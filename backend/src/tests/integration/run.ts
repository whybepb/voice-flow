import dotenv from "dotenv";
dotenv.config();

import assert from "node:assert/strict";
import app from "../../app";
import prisma from "../../prisma";
import { backgroundJobService } from "../../services/background-job.service";
import { registerBackgroundJobHandlers } from "../../services/background-job-handlers";
import {
  composeSystemPrompt,
  executeToolCall,
  resolveRealtimeProfile,
} from "../../services/openai-realtime.service";

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

async function waitForCampaignStatus(
  baseUrl: string,
  token: string,
  campaignId: string,
  expectedStatus: string,
  timeoutMs = 30000,
) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const campaignsRes = await requestJson(baseUrl, "/campaigns", { method: "GET" }, token);
    assert.equal(campaignsRes.status, 200, "campaign list should return 200");
    const campaign = (campaignsRes.body.campaigns || []).find((item: any) => item.id === campaignId);
    if (campaign?.status === expectedStatus) return campaign;
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for campaign ${campaignId} to reach ${expectedStatus}`);
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
    console.log("[integration] Running realtime profile checks...");
    const inboundProfile = resolveRealtimeProfile({});
    assert.equal(inboundProfile.model, "gpt-realtime-mini");
    assert.equal(inboundProfile.voice, "cedar");

    const inheritedCampaignProfile = resolveRealtimeProfile({
      voiceMode: "PREMIUM",
      userVoice: "sage",
    });
    assert.equal(inheritedCampaignProfile.model, "gpt-realtime");
    assert.equal(inheritedCampaignProfile.voice, "sage");

    const overriddenCampaignProfile = resolveRealtimeProfile({
      voiceMode: "PREMIUM",
      userVoice: "sage",
      voiceOverride: "marin",
      userPrompt: "Speak with confident warmth.",
    });
    assert.equal(overriddenCampaignProfile.voice, "marin");
    assert.match(
      overriddenCampaignProfile.instructions,
      /Role & Objective/,
      "system prompt should include labeled realtime sections",
    );
    assert.match(
      overriddenCampaignProfile.instructions,
      /Variety/,
      "system prompt should include anti-robotic variety guidance",
    );
    assert.match(
      composeSystemPrompt("Use a calm, reassuring tone."),
      /Use a calm, reassuring tone\./,
      "editable prompt should be wrapped inside the hidden system prompt",
    );

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
          voiceMode: "premium",
          agentVoiceOverride: "marin",
          phoneNumbers: ["4155552671", "+14155552672", "invalid-number"],
        }),
      },
      user1.token,
    );
    assert.equal(campaignRes.status, 201, "campaign create should return 201");
    const campaignId = campaignRes.body?.campaign?.id as string;
    assert.ok(campaignId, "campaign id missing");
    assert.equal(campaignRes.body?.campaign?.voiceMode, "PREMIUM");
    assert.equal(campaignRes.body?.campaign?.agentVoiceOverride, "marin");

    const startRes = await requestJson(
      baseUrl,
      `/campaigns/${campaignId}/start`,
      { method: "POST" },
      user1.token,
    );
    assert.equal(startRes.status, 200, "campaign start should return 200");
    assert.ok(startRes.body?.count >= 1, "campaign start should enqueue at least one call");
    await waitForCampaignStatus(baseUrl, user1.token, campaignId, "COMPLETED");

    const inheritedCampaignRes = await requestJson(
      baseUrl,
      "/campaigns",
      {
        method: "POST",
        body: JSON.stringify({
          name: "Inherited Voice Campaign",
          type: "Appointment Reminder",
          voiceMode: "default",
          phoneNumbers: ["+14155552673"],
        }),
      },
      user1.token,
    );
    assert.equal(inheritedCampaignRes.status, 201, "default campaign create should return 201");
    assert.equal(inheritedCampaignRes.body?.campaign?.voiceMode, "DEFAULT");
    assert.equal(inheritedCampaignRes.body?.campaign?.agentVoiceOverride, null);

    const settingsRes = await requestJson(
      baseUrl,
      "/auth/settings",
      {
        method: "PATCH",
        body: JSON.stringify({
          agentVoice: "sage",
          agentPrompt: "Keep a reassuring, appointment-focused tone.",
        }),
      },
      user1.token,
    );
    assert.equal(settingsRes.status, 200, "settings update should return 200");

    const meAfterSettings = await requestJson(baseUrl, "/auth/me", { method: "GET" }, user1.token);
    assert.equal(meAfterSettings.status, 200, "/auth/me after settings should return 200");
    assert.equal(meAfterSettings.body?.data?.agentVoice, "sage");
    assert.equal(
      meAfterSettings.body?.data?.agentPrompt,
      "Keep a reassuring, appointment-focused tone.",
    );
    const user1Id = meAfterSettings.body?.data?.id as string;
    assert.ok(user1Id, "user id should be available after settings refresh");

    const callLogsRes = await requestJson(baseUrl, "/call-logs", { method: "GET" }, user1.token);
    assert.equal(callLogsRes.status, 200, "call logs should return 200");
    const firstCallLog = callLogsRes.body?.data?.callLogs?.[0];
    assert.ok(firstCallLog?.sid, "campaign dispatch should create a call log");

    const bookingsAfterDispatch = await requestJson(baseUrl, "/bookings", { method: "GET" }, user1.token);
    assert.equal(bookingsAfterDispatch.status, 200, "bookings list after dispatch should return 200");
    const firstBooking = (bookingsAfterDispatch.body?.data?.bookings || []).find(
      (item: any) => item.id === firstCallLog.bookingId,
    );
    assert.ok(firstBooking?.id, "first booking should be available for tool checks");

    const rescheduleWithoutConfirm = JSON.parse(
      await executeToolCall(
        "reschedule_booking",
        {
          booking_id: firstBooking.id,
          new_date_time: "2026-04-01T14:00:00.000Z",
          confirmed: false,
        },
        user1Id,
      ),
    );
    assert.equal(
      rescheduleWithoutConfirm.confirmation_required,
      true,
      "reschedule tool should require explicit confirmation",
    );

    const cancelWithoutConfirm = JSON.parse(
      await executeToolCall(
        "cancel_booking",
        {
          booking_id: firstBooking.id,
          confirmed: false,
        },
        user1Id,
      ),
    );
    assert.equal(
      cancelWithoutConfirm.confirmation_required,
      true,
      "cancel tool should require explicit confirmation",
    );

    const webhookRes = await requestJson(
      baseUrl,
      "/webhooks/twilio",
      {
        method: "POST",
        body: JSON.stringify({
          CallSid: firstCallLog.sid,
          CallStatus: "completed",
        }),
      },
    );
    assert.equal(webhookRes.status, 200, "webhook should return 200");

    const bookingsAfterWebhook = await requestJson(baseUrl, "/bookings", { method: "GET" }, user1.token);
    assert.equal(bookingsAfterWebhook.status, 200, "bookings list should return 200");
    const webhookBooking = (bookingsAfterWebhook.body?.data?.bookings || []).find(
      (item: any) => item.id === firstCallLog.bookingId,
    );
    assert.equal(
      webhookBooking?.status,
      "PENDING",
      "Twilio delivery status must not overwrite appointment status",
    );
    assert.equal(
      webhookBooking?.lastCallStatus,
      "completed",
      "Twilio delivery status should still be tracked on the booking",
    );

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

    const reindexRes = await requestJson(
      baseUrl,
      `/knowledge/${docId}/reindex`,
      { method: "POST" },
      user1.token,
    );
    assert.equal(reindexRes.status, 200, "knowledge reindex should return 200");
    await waitForKnowledgeStatus(baseUrl, user1.token, docId, "READY");

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
