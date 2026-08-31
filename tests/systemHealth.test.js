import test from "node:test";
import assert from "node:assert/strict";
import { mapSystemHealth } from "../src/services/systemHealth.js";

test("system health keeps configured, provider, runtime, content, and push states distinct", () => {
  const health = mapSystemHealth(
    { status: "UP", version: "1.2.3", database: "Connected" },
    {
        data: {
          providerConfigured: true,
          workerRunning: true,
          receiptWorkerActive: false,
          schedulerActive: true,
        },
    },
    {
        provider: { name: "groq", status: "error", code: "GROQ_TIMEOUT" },
        configured: { chat: true, stt: true, tts: true, contentProvider: false },
        runtime: {
          chat: { status: "ok", code: null, requestId: "mc-chat" },
          stt: null,
          tts: { status: "error", code: "GROQ_TTS_TERMS_REQUIRED" },
        },
    }
  );
  assert.equal(health.status, "ok");
  assert.equal(health.services.database.status, "ok");
  assert.equal(health.services.ai_provider_reachability.status, "error");
  assert.equal(health.services.ai_provider_reachability.code, "GROQ_TIMEOUT");
  assert.equal(health.services.nyansa_text.status, "ok");
  assert.equal(health.services.nyansa_live_stt.status, "configured");
  assert.equal(health.services.nyansa_live_tts.code, "GROQ_TTS_TERMS_REQUIRED");
  assert.equal(health.services.content_provider_config.code, "YOUTUBE_NOT_CONFIGURED");
  assert.equal(health.services.receipt_worker.status, "error");
});
