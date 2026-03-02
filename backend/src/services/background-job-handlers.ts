import { BackgroundJobType, Prisma } from "@prisma/client";
import { backgroundJobService } from "./background-job.service";
import { ingestDocument } from "./rag.service";
import { runPostCallAnalysis } from "./post-call-analysis.service";

interface KnowledgeIngestPayload {
  userId: string;
  documentId: string;
  filePath: string;
}

interface PostCallAnalysisPayload {
  callSid: string;
}

let handlersRegistered = false;

function asObject(payload: Prisma.JsonValue): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid job payload");
  }
  return payload as Record<string, unknown>;
}

function requireString(
  object: Record<string, unknown>,
  key: string,
): string {
  const value = object[key];
  if (!value || typeof value !== "string") {
    throw new Error(`Invalid payload field: ${key}`);
  }
  return value;
}

export function registerBackgroundJobHandlers() {
  if (handlersRegistered) return;
  handlersRegistered = true;

  backgroundJobService.registerHandler(
    BackgroundJobType.KNOWLEDGE_INGEST,
    async (payload) => {
      const raw = asObject(payload);
      const parsed: KnowledgeIngestPayload = {
        userId: requireString(raw, "userId"),
        documentId: requireString(raw, "documentId"),
        filePath: requireString(raw, "filePath"),
      };
      await ingestDocument(parsed.userId, parsed.documentId, parsed.filePath);
    },
  );

  backgroundJobService.registerHandler(
    BackgroundJobType.POST_CALL_ANALYSIS,
    async (payload) => {
      const raw = asObject(payload);
      const parsed: PostCallAnalysisPayload = {
        callSid: requireString(raw, "callSid"),
      };
      await runPostCallAnalysis(parsed.callSid);
    },
  );
}

export async function enqueueKnowledgeIngestJob(
  userId: string,
  documentId: string,
  filePath: string,
) {
  await backgroundJobService.enqueue({
    userId,
    type: BackgroundJobType.KNOWLEDGE_INGEST,
    payload: { userId, documentId, filePath },
    maxAttempts: 3,
  });
}

export async function enqueuePostCallAnalysisJob(
  userId: string,
  callSid: string,
) {
  await backgroundJobService.enqueue({
    userId,
    type: BackgroundJobType.POST_CALL_ANALYSIS,
    payload: { callSid },
    maxAttempts: 3,
  });
}
