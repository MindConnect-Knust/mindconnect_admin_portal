import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mapSystemHealth, HEALTH_STATES } from "../src/services/systemHealth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("vercel.json exists, contains valid JSON, and rewrites all unmatched SPA routes to /index.html", () => {
  const vercelConfigPath = path.resolve(__dirname, "../vercel.json");
  assert.ok(fs.existsSync(vercelConfigPath), "vercel.json must exist in admin portal root");

  const raw = fs.readFileSync(vercelConfigPath, "utf-8");
  const config = JSON.parse(raw);

  assert.ok(Array.isArray(config.rewrites), "vercel.json must declare rewrites array");
  const fallback = config.rewrites.find(
    (r) => r.source === "/(.*)" && r.destination === "/index.html"
  );
  assert.ok(fallback, "vercel.json must rewrite /(.*) to /index.html for React Router deep links");
});

test("system health maps all 7 operational components with truthful 7-state model", () => {
  const health = mapSystemHealth(
    { status: "UP", version: "1.0.0", database: "Connected" },
    {
      data: {
        providerConfigured: true,
        workersEnabled: true,
        workerRunning: true,
        workerLastSeenAt: new Date().toISOString(),
        receiptWorkerActive: true,
        schedulerActive: false,
        activeDevices: 42,
        pendingOutbox: 3,
      },
    },
    {
      provider: { name: "groq", status: "ok", code: null, latencyMs: 284 },
      configured: { chat: true, stt: true, tts: false, contentProvider: true },
      runtime: {
        chat: { status: "ok", code: null, lastSuccessAt: "2026-09-07T10:00:00Z", latencyMs: 310 },
        stt: null, // configured but awaiting runtime verification
        tts: null,
        content: { status: "ok", lastSuccessAt: "2026-09-07T09:30:00Z" },
      },
    }
  );

  assert.equal(health.status, "ok");
  assert.ok(Array.isArray(health.matrix));
  assert.equal(health.matrix.length, 7);

  // 1. Receipt Worker: active worker + receipt active = HEALTHY
  const receiptWorker = health.matrix.find((m) => m.id === "receipt_worker");
  assert.equal(receiptWorker.status, HEALTH_STATES.HEALTHY);
  assert.equal(receiptWorker.configured, true);
  assert.equal(receiptWorker.reachable, true);

  // 2. Notification Scheduler: worker active but scheduler inactive = UNHEALTHY
  const scheduler = health.matrix.find((m) => m.id === "notification_scheduler");
  assert.equal(scheduler.status, HEALTH_STATES.UNHEALTHY);
  assert.equal(scheduler.lastError, "SCHEDULER_INACTIVE");

  // 3. AI Provider Reachability: ok with latency = HEALTHY
  const aiReachability = health.matrix.find((m) => m.id === "ai_provider_reachability");
  assert.equal(aiReachability.status, HEALTH_STATES.HEALTHY);
  assert.equal(aiReachability.latencyMs, 284);

  // 4. Nyansa Text: real runtime success recorded = HEALTHY
  const nyansaText = health.matrix.find((m) => m.id === "nyansa_text");
  assert.equal(nyansaText.status, HEALTH_STATES.HEALTHY);
  assert.equal(nyansaText.lastSuccess, "2026-09-07T10:00:00Z");

  // 5. Nyansa Live STT: configured but never run = AWAITING_RUNTIME_VERIFICATION (Truthful!)
  const nyansaStt = health.matrix.find((m) => m.id === "nyansa_live_stt");
  assert.equal(nyansaStt.status, HEALTH_STATES.AWAITING_RUNTIME_VERIFICATION);
  assert.equal(nyansaStt.configured, true);

  // 6. Nyansa Live TTS: not configured = NOT_CONFIGURED
  const nyansaTts = health.matrix.find((m) => m.id === "nyansa_live_tts");
  assert.equal(nyansaTts.status, HEALTH_STATES.NOT_CONFIGURED);
  assert.ok(nyansaTts.deviceEvidence.includes("Signed-device QA required"));

  // 7. Content Provider: configured and runtime verified = HEALTHY
  const contentProvider = health.matrix.find((m) => m.id === "content_provider");
  assert.equal(contentProvider.status, HEALTH_STATES.HEALTHY);
});

test("stale worker heartbeat correctly reports UNHEALTHY status", () => {
  const health = mapSystemHealth(
    { status: "UP" },
    {
      data: {
        providerConfigured: true,
        workersEnabled: true,
        workerRunning: false, // stale heartbeat (>60s)
        workerLastSeenAt: "2026-09-07T08:00:00Z",
        receiptWorkerActive: false,
        schedulerActive: false,
      },
    },
    {}
  );

  const receiptWorker = health.matrix.find((m) => m.id === "receipt_worker");
  assert.equal(receiptWorker.status, HEALTH_STATES.UNHEALTHY);
  assert.equal(receiptWorker.lastError, "WORKER_HEARTBEAT_STALE");
});

test("safe returnTo resolver rejects malformed or external redirects", () => {
  const sanitizeReturnTo = (raw) => {
    if (raw && typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") && raw !== "/login") {
      return raw;
    }
    return "/";
  };

  assert.equal(sanitizeReturnTo("/administration/audit-log"), "/administration/audit-log");
  assert.equal(sanitizeReturnTo("/administration/system-health"), "/administration/system-health");
  assert.equal(sanitizeReturnTo("/content/video-moderation?page=2"), "/content/video-moderation?page=2");
  assert.equal(sanitizeReturnTo("/login"), "/");
  assert.equal(sanitizeReturnTo("https://evil.com"), "/");
  assert.equal(sanitizeReturnTo("//evil.com"), "/");
  assert.equal(sanitizeReturnTo(null), "/");
  assert.equal(sanitizeReturnTo(undefined), "/");
  assert.equal(sanitizeReturnTo(""), "/");
});
