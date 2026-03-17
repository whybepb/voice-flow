import {
  BackgroundJobStatus,
  BackgroundJobType,
  Prisma,
} from "@prisma/client";
import prisma from "../prisma";
import fs from "node:fs/promises";
import { finalizeCampaignDispatchIfIdle } from "./campaign.service";

type JobHandler = (payload: Prisma.JsonValue) => Promise<void>;

const WORKER_INTERVAL_MS = 2000;
const DEFAULT_BATCH_SIZE = 5;
const BASE_BACKOFF_MS = 2000;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }
  return "Unknown error";
}

function retryDelayMs(attempt: number): number {
  const exponent = Math.max(0, attempt - 1);
  const delay = BASE_BACKOFF_MS * Math.pow(2, exponent);
  return Math.min(delay, 5 * 60 * 1000);
}

function payloadField(
  payload: Prisma.JsonValue,
  key: string,
): string | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

async function cleanupFailedKnowledgeJob(payload: Prisma.JsonValue) {
  const filePath = payloadField(payload, "filePath");
  const documentId = payloadField(payload, "documentId");

  if (filePath) {
    await fs.unlink(filePath).catch(() => {
      // ignore cleanup errors
    });
  }

  if (documentId) {
    await prisma.knowledgeDocument
      .update({
        where: { id: documentId },
        data: { status: "FAILED" },
      })
      .catch(() => {
        // document may have been deleted
      });
  }
}

class BackgroundJobService {
  private handlers = new Map<BackgroundJobType, JobHandler>();
  private interval: NodeJS.Timeout | null = null;
  private polling = false;
  private warnedMissingTable = false;

  registerHandler(type: BackgroundJobType, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  async enqueue(options: {
    type: BackgroundJobType;
    payload: Prisma.InputJsonValue;
    userId?: string;
    maxAttempts?: number;
    runAt?: Date;
  }) {
    try {
      return await prisma.backgroundJob.create({
        data: {
          type: options.type,
          payload: options.payload,
          userId: options.userId,
          maxAttempts: options.maxAttempts ?? 3,
          runAt: options.runAt ?? new Date(),
        },
      });
    } catch (error) {
      if ((error as { code?: string })?.code === "P2021") {
        this.warnMissingTable();
        const handler = this.handlers.get(options.type);
        if (handler) {
          await handler(options.payload as Prisma.JsonValue);
          return null;
        }
      }
      throw error;
    }
  }

  startWorker() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      void this.pollAndProcess();
    }, WORKER_INTERVAL_MS);
    void this.pollAndProcess();
    console.log("[Jobs] Background worker started");
  }

  stopWorker() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async listUserJobs(userId: string, limit = 25) {
    try {
      return await prisma.backgroundJob.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          type: true,
          status: true,
          attempts: true,
          maxAttempts: true,
          lastError: true,
          runAt: true,
          createdAt: true,
          updatedAt: true,
          completedAt: true,
        },
      });
    } catch (error) {
      if ((error as { code?: string })?.code === "P2021") {
        this.warnMissingTable();
        return [];
      }
      throw error;
    }
  }

  private async pollAndProcess() {
    if (this.polling) return;
    this.polling = true;

    try {
      const dueJobs = await prisma.backgroundJob.findMany({
        where: {
          status: {
            in: [BackgroundJobStatus.PENDING, BackgroundJobStatus.RETRY],
          },
          runAt: { lte: new Date() },
        },
        orderBy: { createdAt: "asc" },
        take: DEFAULT_BATCH_SIZE,
      });

      for (const job of dueJobs) {
        await this.processJob(job.id);
      }
    } catch (error) {
      if ((error as { code?: string })?.code === "P2021") {
        this.warnMissingTable();
        this.stopWorker();
        return;
      }
      if ((error as { name?: string })?.name === "PrismaClientInitializationError") {
        console.error(
          "[Jobs] Worker paused because database is unreachable. It will resume on next server start.",
        );
        this.stopWorker();
        return;
      }
      console.error("[Jobs] Poll failed:", error);
    } finally {
      this.polling = false;
    }
  }

  private async processJob(jobId: string) {
    const now = new Date();
    const claimed = await prisma.backgroundJob.updateMany({
      where: {
        id: jobId,
        status: { in: [BackgroundJobStatus.PENDING, BackgroundJobStatus.RETRY] },
        runAt: { lte: now },
      },
      data: {
        status: BackgroundJobStatus.PROCESSING,
        attempts: { increment: 1 },
        startedAt: now,
        lastError: null,
      },
    });

    if (claimed.count === 0) return;

    const job = await prisma.backgroundJob.findUnique({
      where: { id: jobId },
    });
    if (!job) return;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: BackgroundJobStatus.FAILED,
          completedAt: new Date(),
          lastError: `No handler registered for ${job.type}`,
        },
      });
      return;
    }

    try {
      await handler(job.payload);
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: BackgroundJobStatus.COMPLETED,
          completedAt: new Date(),
          lastError: null,
        },
      });
    } catch (error) {
      const canRetry = job.attempts < job.maxAttempts;
      if (canRetry) {
        await prisma.backgroundJob.update({
          where: { id: job.id },
          data: {
            status: BackgroundJobStatus.RETRY,
            runAt: new Date(Date.now() + retryDelayMs(job.attempts)),
            lastError: toErrorMessage(error),
          },
        });
      } else {
        if (
          job.type === BackgroundJobType.KNOWLEDGE_INGEST ||
          job.type === BackgroundJobType.KNOWLEDGE_REINDEX
        ) {
          await cleanupFailedKnowledgeJob(job.payload);
        }
        await prisma.backgroundJob.update({
          where: { id: job.id },
          data: {
            status: BackgroundJobStatus.FAILED,
            completedAt: new Date(),
            lastError: toErrorMessage(error),
          },
        });
        await this.runCompletionHooks(job);
      }
      return;
    }

    await this.runCompletionHooks(job);
  }

  private warnMissingTable() {
    if (this.warnedMissingTable) return;
    this.warnedMissingTable = true;
    console.warn(
      "[Jobs] BackgroundJob table is missing. Run Prisma migration/db push to enable persisted job queue.",
    );
  }

  private async runCompletionHooks(job: {
    id: string;
    type: BackgroundJobType;
    payload: Prisma.JsonValue;
  }) {
    if (job.type === BackgroundJobType.CAMPAIGN_CALL) {
      await finalizeCampaignDispatchIfIdle(job.payload).catch((error) => {
        console.error("[Jobs] Failed to finalize campaign state:", error);
      });
    }
  }
}

export const backgroundJobService = new BackgroundJobService();
