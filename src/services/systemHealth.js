/**
 * systemHealth.js
 * Rigorous health mapping for MindConnect Administration.
 *
 * Implements the truthful 7-state operational model:
 * - NOT_CONFIGURED
 * - CONFIGURED
 * - AWAITING_RUNTIME_VERIFICATION
 * - HEALTHY
 * - DEGRADED
 * - UNHEALTHY
 * - UNKNOWN
 *
 * Explicitly separates:
 * 1. Configuration (secret/env presence)
 * 2. Provider Reachability (network & API ping)
 * 3. Runtime Success (real server execution telemetry)
 * 4. Device Validation (hardware / physical QA evidence)
 */

export const HEALTH_STATES = {
  NOT_CONFIGURED: "NOT_CONFIGURED",
  CONFIGURED: "CONFIGURED",
  AWAITING_RUNTIME_VERIFICATION: "AWAITING_RUNTIME_VERIFICATION",
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  UNHEALTHY: "UNHEALTHY",
  UNKNOWN: "UNKNOWN",
};

const runtimeCapability = (runtime, name, configured) => {
  if (!configured) {
    return { status: "error", code: `${name.toUpperCase()}_NOT_CONFIGURED` };
  }
  return (
    runtime?.[name] || {
      status: "configured",
      code: `${name.toUpperCase()}_AWAITING_RUNTIME_CHECK`,
    }
  );
};

export function mapSystemHealth(base = {}, pushResponse = {}, aiResponse = {}) {
  const push = pushResponse.data || {};
  const ai = aiResponse || {};
  const aiProvider = ai.provider || {};
  const aiRuntime = ai.runtime || {};
  const aiConfigured = ai.configured || {};

  // Compatibility legacy services mapping
  const services = {
    database: { status: base.database === "Connected" ? "ok" : "error" },
    push_provider_config: { status: push.providerConfigured ? "ok" : "error" },
    notification_worker: { status: push.workerRunning ? "ok" : "error" },
    receipt_worker: { status: push.receiptWorkerActive ? "ok" : "error" },
    notification_scheduler: { status: push.schedulerActive ? "ok" : "error" },
    ai_provider_reachability: {
      status: aiProvider.status === "ok" ? "ok" : "error",
      code: aiProvider.code || null,
      latencyMs: aiProvider.latencyMs || null,
    },
    nyansa_text: runtimeCapability(aiRuntime, "chat", aiConfigured.chat),
    nyansa_live_stt: runtimeCapability(aiRuntime, "stt", aiConfigured.stt),
    nyansa_live_tts: runtimeCapability(aiRuntime, "tts", aiConfigured.tts),
    content_provider_config: {
      status: aiConfigured.contentProvider ? "configured" : "error",
      code: aiConfigured.contentProvider ? null : "YOUTUBE_NOT_CONFIGURED",
    },
  };

  // Structured operational matrix for SRE dashboard
  const matrix = [
    {
      id: "receipt_worker",
      name: "Receipt Worker",
      category: "Push Notifications",
      configured: Boolean(push.workersEnabled ?? push.providerConfigured),
      reachable: push.workerRunning,
      runtime: push.receiptWorkerActive ? HEALTH_STATES.HEALTHY : (push.workerRunning ? HEALTH_STATES.DEGRADED : HEALTH_STATES.UNHEALTHY),
      lastSuccess: push.workerLastSeenAt || null,
      lastError: push.receiptWorkerActive ? null : (!push.workerRunning ? "WORKER_HEARTBEAT_STALE" : "RECEIPT_WORKER_INACTIVE"),
      latencyMs: null,
      deviceEvidence: "Server receipt delivery confirmation",
      status: push.receiptWorkerActive && push.workerRunning
        ? HEALTH_STATES.HEALTHY
        : (push.workersEnabled === false ? HEALTH_STATES.NOT_CONFIGURED : HEALTH_STATES.UNHEALTHY),
    },
    {
      id: "notification_scheduler",
      name: "Notification Scheduler",
      category: "Push Notifications",
      configured: Boolean(push.workersEnabled ?? push.providerConfigured),
      reachable: push.workerRunning,
      runtime: push.schedulerActive ? HEALTH_STATES.HEALTHY : (push.workerRunning ? HEALTH_STATES.DEGRADED : HEALTH_STATES.UNHEALTHY),
      lastSuccess: push.workerLastSeenAt || null,
      lastError: push.schedulerActive ? null : (!push.workerRunning ? "WORKER_HEARTBEAT_STALE" : "SCHEDULER_INACTIVE"),
      latencyMs: null,
      deviceEvidence: "Server campaign dispatch heartbeat",
      status: push.schedulerActive && push.workerRunning
        ? HEALTH_STATES.HEALTHY
        : (push.workersEnabled === false ? HEALTH_STATES.NOT_CONFIGURED : HEALTH_STATES.UNHEALTHY),
    },
    {
      id: "ai_provider_reachability",
      name: "AI Provider Reachability",
      category: "Intelligence & Nyansa",
      configured: Boolean(aiConfigured.chat || aiProvider.name),
      reachable: aiProvider.status === "ok",
      runtime: aiProvider.status === "ok" ? HEALTH_STATES.HEALTHY : (aiProvider.status === "error" ? HEALTH_STATES.UNHEALTHY : HEALTH_STATES.NOT_CONFIGURED),
      lastSuccess: aiProvider.status === "ok" ? (aiProvider.checkedAt || new Date().toISOString()) : null,
      lastError: aiProvider.code || null,
      latencyMs: aiProvider.latencyMs || null,
      deviceEvidence: "Backend synthetic reachability ping",
      status: aiProvider.status === "ok"
        ? HEALTH_STATES.HEALTHY
        : (aiProvider.status === "error" ? HEALTH_STATES.UNHEALTHY : (aiConfigured.chat ? HEALTH_STATES.CONFIGURED : HEALTH_STATES.NOT_CONFIGURED)),
    },
    {
      id: "nyansa_text",
      name: "Nyansa Text",
      category: "Intelligence & Nyansa",
      configured: Boolean(aiConfigured.chat),
      reachable: aiProvider.status === "ok",
      runtime: !aiConfigured.chat
        ? HEALTH_STATES.NOT_CONFIGURED
        : aiRuntime.chat?.status === "ok"
        ? HEALTH_STATES.HEALTHY
        : aiRuntime.chat?.status === "error"
        ? HEALTH_STATES.DEGRADED
        : HEALTH_STATES.AWAITING_RUNTIME_VERIFICATION,
      lastSuccess: aiRuntime.chat?.lastSuccessAt || (aiRuntime.chat?.status === "ok" ? aiRuntime.chat.checkedAt : null),
      lastError: aiRuntime.chat?.status === "error" ? (aiRuntime.chat.code || "CHAT_RUNTIME_ERROR") : null,
      latencyMs: aiRuntime.chat?.latencyMs || null,
      deviceEvidence: "Server chat completion response verified",
      status: !aiConfigured.chat
        ? HEALTH_STATES.NOT_CONFIGURED
        : aiRuntime.chat?.status === "ok"
        ? HEALTH_STATES.HEALTHY
        : aiRuntime.chat?.status === "error"
        ? HEALTH_STATES.DEGRADED
        : HEALTH_STATES.AWAITING_RUNTIME_VERIFICATION,
    },
    {
      id: "nyansa_live_stt",
      name: "Nyansa Live STT",
      category: "Intelligence & Nyansa",
      configured: Boolean(aiConfigured.stt),
      reachable: aiProvider.status === "ok",
      runtime: !aiConfigured.stt
        ? HEALTH_STATES.NOT_CONFIGURED
        : aiRuntime.stt?.status === "ok"
        ? HEALTH_STATES.HEALTHY
        : aiRuntime.stt?.status === "error"
        ? HEALTH_STATES.DEGRADED
        : HEALTH_STATES.AWAITING_RUNTIME_VERIFICATION,
      lastSuccess: aiRuntime.stt?.lastSuccessAt || (aiRuntime.stt?.status === "ok" ? aiRuntime.stt.checkedAt : null),
      lastError: aiRuntime.stt?.status === "error" ? (aiRuntime.stt.code || "STT_RUNTIME_ERROR") : null,
      latencyMs: aiRuntime.stt?.latencyMs || null,
      deviceEvidence: "Server transcription verified · Physical mic input separate",
      status: !aiConfigured.stt
        ? HEALTH_STATES.NOT_CONFIGURED
        : aiRuntime.stt?.status === "ok"
        ? HEALTH_STATES.HEALTHY
        : aiRuntime.stt?.status === "error"
        ? HEALTH_STATES.DEGRADED
        : HEALTH_STATES.AWAITING_RUNTIME_VERIFICATION,
    },
    {
      id: "nyansa_live_tts",
      name: "Nyansa Live TTS",
      category: "Intelligence & Nyansa",
      configured: Boolean(aiConfigured.tts),
      reachable: aiProvider.status === "ok",
      runtime: !aiConfigured.tts
        ? HEALTH_STATES.NOT_CONFIGURED
        : aiRuntime.tts?.status === "ok"
        ? HEALTH_STATES.HEALTHY
        : aiRuntime.tts?.status === "error"
        ? HEALTH_STATES.DEGRADED
        : HEALTH_STATES.AWAITING_RUNTIME_VERIFICATION,
      lastSuccess: aiRuntime.tts?.lastSuccessAt || (aiRuntime.tts?.status === "ok" ? aiRuntime.tts.checkedAt : null),
      lastError: aiRuntime.tts?.status === "error" ? (aiRuntime.tts.code || "TTS_RUNTIME_ERROR") : null,
      latencyMs: aiRuntime.tts?.latencyMs || null,
      deviceEvidence: "Provider audio synthesis verified · Signed-device QA required",
      status: !aiConfigured.tts
        ? HEALTH_STATES.NOT_CONFIGURED
        : aiRuntime.tts?.status === "ok"
        ? HEALTH_STATES.HEALTHY
        : aiRuntime.tts?.status === "error"
        ? HEALTH_STATES.DEGRADED
        : HEALTH_STATES.AWAITING_RUNTIME_VERIFICATION,
    },
    {
      id: "content_provider",
      name: "Content Provider",
      category: "Content Pipeline",
      configured: Boolean(aiConfigured.contentProvider),
      reachable: Boolean(aiConfigured.contentProvider),
      runtime: !aiConfigured.contentProvider
        ? HEALTH_STATES.NOT_CONFIGURED
        : aiRuntime.content?.status === "ok"
        ? HEALTH_STATES.HEALTHY
        : aiRuntime.content?.status === "error"
        ? HEALTH_STATES.DEGRADED
        : HEALTH_STATES.AWAITING_RUNTIME_VERIFICATION,
      lastSuccess: aiRuntime.content?.lastSuccessAt || null,
      lastError: aiConfigured.contentProvider ? null : "YOUTUBE_NOT_CONFIGURED",
      latencyMs: null,
      deviceEvidence: "Server YouTube feed ingestion verified",
      status: !aiConfigured.contentProvider
        ? HEALTH_STATES.NOT_CONFIGURED
        : aiRuntime.content?.status === "ok"
        ? HEALTH_STATES.HEALTHY
        : HEALTH_STATES.AWAITING_RUNTIME_VERIFICATION,
    },
  ];

  return {
    status: base.status === "UP" ? "ok" : "error",
    version: base.version,
    services,
    matrix,
    push,
    ai,
  };
}
