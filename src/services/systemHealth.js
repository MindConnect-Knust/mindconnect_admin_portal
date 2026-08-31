const runtimeCapability = (runtime, name, configured) => {
  if (!configured) {
    return { status: 'error', code: `${name.toUpperCase()}_NOT_CONFIGURED` };
  }
  return runtime?.[name]
    || { status: 'configured', code: `${name.toUpperCase()}_AWAITING_RUNTIME_CHECK` };
};

export function mapSystemHealth(base, pushResponse, aiResponse) {
  const push = pushResponse.data || {};
  const ai = aiResponse || {};
  return {
    status: base.status === 'UP' ? 'ok' : 'error',
    version: base.version,
    services: {
      database: { status: base.database === 'Connected' ? 'ok' : 'error' },
      push_provider_config: { status: push.providerConfigured ? 'ok' : 'error' },
      notification_worker: { status: push.workerRunning ? 'ok' : 'error' },
      receipt_worker: { status: push.receiptWorkerActive ? 'ok' : 'error' },
      notification_scheduler: { status: push.schedulerActive ? 'ok' : 'error' },
      ai_provider_reachability: {
        status: ai.provider?.status === 'ok' ? 'ok' : 'error',
        code: ai.provider?.code || null,
      },
      nyansa_text: runtimeCapability(ai.runtime, 'chat', ai.configured?.chat),
      nyansa_live_stt: runtimeCapability(ai.runtime, 'stt', ai.configured?.stt),
      nyansa_live_tts: runtimeCapability(ai.runtime, 'tts', ai.configured?.tts),
      content_provider_config: {
        status: ai.configured?.contentProvider ? 'configured' : 'error',
        code: ai.configured?.contentProvider ? null : 'YOUTUBE_NOT_CONFIGURED',
      },
    },
    push,
    ai,
  };
}
