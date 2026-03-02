import dotenv from "dotenv";
dotenv.config();

import assert from "node:assert/strict";
import app from "../../app";
import prisma from "../../prisma";
import { backgroundJobService } from "../../services/background-job.service";
import { registerBackgroundJobHandlers } from "../../services/background-job-handlers";

type JsonValue = Record<string, any>;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<{ status: number; body: JsonValue }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  let body: JsonValue = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  return { status: response.status, body };
}

async function registerAndOnboard(baseUrl: string, suffix: string) {
  const password = "Passw0rd!123";
  const email = `integration_${suffix}_${Date.now()}@example.com`;

  const registerRes = await requestJson(baseUrl, "/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: `User ${suffix}`,
      email,
      password,
    }),
  });

  assert.equal(registerRes.status, 201, "register should return 201");
  const token = registerRes.body?.data?.token as string;
  assert.ok(token, "register should return token");

  const onboardingRes = await requestJson(
    baseUrl,
    "/auth/onboarding",
    {
      method: "PATCH",
      body: JSON.stringify({
        company: `Company ${suffix}`,
        twilioAccountSid: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        twilioAuthToken: "test_auth_token_123",
        twilioPhoneNumber: "+14155550123",
        openaiApiKey: "sk-test-key-123",
      }),
    },
    token,
  );

  assert.equal(onboardingRes.status, 200, "onboarding should return 200");
  return { token, email };
}

async function uploadKnowledgeDoc(
  baseUrl: string,
  token: string,
  fileName: string,
  content: string,
) {
  const FormDataCtor = (globalThis as any).FormData;
  const BlobCtor = (globalThis as any).Blob;
  const formData = new FormDataCtor();
  formData.append("file", new BlobCtor([content], { type: "text/plain" }), fileName);

  const response = await fetch(`${baseUrl}/knowledge/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const body = (await response.json()) as JsonValue;
  assert.equal(response.status, 201, "knowledge upload should return 201");
  return body.data.id as string;
}

async function waitForKnowledgeStatus(
  baseUrl: string,
  token: string,
  documentId: string,
  expectedStatus: "READY" | "FAILED",
  timeoutMs = 30000,
) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const docsRes = await requestJson(baseUrl, "/knowledge", { method: "GET" }, token);
    assert.equal(docsRes.status, 200, "knowledge list should return 200");
    const doc = (docsRes.body.data || []).find((item: any) => item.id === documentId);
    if (doc?.status === expectedStatus) return doc;
    if (doc?.status === "FAILED" && expectedStatus !== "FAILED") {
      throw new Error(`Knowledge ingestion failed unexpectedly for ${documentId}`);
    }
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for knowledge doc ${documentId} to reach ${expectedStatus}`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for integration tests");
  }

  registerBackgroundJobHandlers();
  backgroundJobService.startWorker();

  const server = await new Promise<ReturnType<typeof app.listen>>(
    (resolve, reject) => {
      const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
      instance.on("error", reject);
    },
  );

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start test server");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    console.log("[integration] Running auth flow...");
    const user1 = await registerAndOnboard(baseUrl, "a");
    const meRes = await requestJson(baseUrl, "/auth/me", { method: "GET" }, user1.token);
    assert.equal(meRes.status, 200, "/auth/me should return 200");
    assert.equal(meRes.body?.data?.email, user1.email, "/auth/me should return correct user");

    console.log("[integration] Running campaign create/start flow...");
    const campaignRes = await requestJson(
      baseUrl,
      "/campaigns",
      {
        method: "POST",
        body: JSON.stringify({
          name: "Integration Campaign",
          type: "Appointment Reminder",
          phoneNumbers: ["4155552671", "+14155552672", "invalid-number"],
        }),
      },
      user1.token,
    );
    assert.equal(campaignRes.status, 201, "campaign create should return 201");
    const campaignId = campaignRes.body?.campaign?.id as string;
    assert.ok(campaignId, "campaign id missing");

    const startRes = await requestJson(
      baseUrl,
      `/campaigns/${campaignId}/start`,
      { method: "POST" },
      user1.token,
    );
    assert.equal(startRes.status, 200, "campaign start should return 200");
    assert.ok(startRes.body?.count >= 1, "campaign start should enqueue at least one call");

    console.log("[integration] Running knowledge upload/query flow...");
    const docId = await uploadKnowledgeDoc(
      baseUrl,
      user1.token,
      "integration_knowledge.txt",
      "Support hours are Monday to Friday, 9 AM to 6 PM EST. Billing questions are answered by email.",
    );
    await waitForKnowledgeStatus(baseUrl, user1.token, docId, "READY");

    const queryRes = await requestJson(
      baseUrl,
      "/knowledge/query",
      {
        method: "POST",
        body: JSON.stringify({
          query: "What are your support hours?",
          topK: 3,
          generateAnswer: false,
        }),
      },
      user1.token,
    );
    assert.equal(queryRes.status, 200, "knowledge query should return 200");
    assert.ok(
      (queryRes.body?.data?.results || []).length > 0,
      "knowledge query should return at least one chunk",
    );

    console.log("[integration] Running tenant isolation checks...");
    const user2 = await registerAndOnboard(baseUrl, "b");
    const user2QueryRes = await requestJson(
      baseUrl,
      "/knowledge/query",
      {
        method: "POST",
        body: JSON.stringify({
          query: "What are your support hours?",
          topK: 3,
          generateAnswer: false,
        }),
      },
      user2.token,
    );
    assert.equal(user2QueryRes.status, 200, "user2 query should return 200");
    assert.equal(
      (user2QueryRes.body?.data?.results || []).length,
      0,
      "tenant isolation failed: user2 received user1 knowledge chunks",
    );

    const user2DeleteRes = await requestJson(
      baseUrl,
      `/knowledge/${docId}`,
      { method: "DELETE" },
      user2.token,
    );
    assert.equal(
      user2DeleteRes.status,
      404,
      "tenant isolation failed: user2 should not delete user1 document",
    );

    console.log("[integration] All checks passed");
  } finally {
    backgroundJobService.stopWorker();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[integration] Failed:", error);
  process.exitCode = 1;
});
