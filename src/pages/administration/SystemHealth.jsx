import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCcw,
  ShieldCheck,
  Zap,
  Server,
  Radio,
  Cpu,
  Info,
} from "lucide-react";
import { getSystemHealth } from "../../services/contentApi";
import { HEALTH_STATES } from "../../services/systemHealth";

function StatusBadge({ status }) {
  switch (status) {
    case HEALTH_STATES.HEALTHY:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} />
          Healthy
        </span>
      );
    case HEALTH_STATES.DEGRADED:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          <AlertTriangle size={12} />
          Degraded
        </span>
      );
    case HEALTH_STATES.UNHEALTHY:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
          <XCircle size={12} />
          Unhealthy
        </span>
      );
    case HEALTH_STATES.AWAITING_RUNTIME_VERIFICATION:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">
          <Clock size={12} />
          Awaiting Verification
        </span>
      );
    case HEALTH_STATES.CONFIGURED:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
          <Activity size={12} />
          Configured
        </span>
      );
    case HEALTH_STATES.NOT_CONFIGURED:
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 border border-slate-200">
          Not Configured
        </span>
      );
  }
}

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testingAi, setTestingAi] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSystemHealth();
      setHealth(data);
    } catch (err) {
      setError(err.message || "Failed to load system health.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const runSyntheticAiPing = async () => {
    setTestingAi(true);
    setTestResult(null);
    try {
      const data = await getSystemHealth();
      setHealth(data);
      const aiProvider = data.ai?.provider;
      if (aiProvider?.status === "ok") {
        setTestResult({
          success: true,
          message: `Provider ping passed (${aiProvider.latencyMs ? `${aiProvider.latencyMs} ms` : "OK"}). Verified reachability only (SYNTHETIC_DIAGNOSTIC).`,
        });
      } else {
        setTestResult({
          success: false,
          message: `Provider ping returned status: ${aiProvider?.status || "error"} (${aiProvider?.code || "UNREACHABLE"}).`,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || "Synthetic ping failed.",
      });
    } finally {
      setTestingAi(false);
    }
  };

  const matrix = health?.matrix || [];
  const healthyCount = matrix.filter((m) => m.status === HEALTH_STATES.HEALTHY).length;
  const awaitingCount = matrix.filter((m) => m.status === HEALTH_STATES.AWAITING_RUNTIME_VERIFICATION).length;
  const issuesCount = matrix.filter((m) => m.status === HEALTH_STATES.DEGRADED || m.status === HEALTH_STATES.UNHEALTHY).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-brand-600" />
            System Health &amp; Observability
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Truthful operational SRE telemetry and runtime verification. Configuration is never confused with health.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={runSyntheticAiPing}
            disabled={loading || testingAi}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-50 transition-colors"
          >
            <Zap size={14} className={testingAi ? "animate-spin" : ""} />
            {testingAi ? "Pinging…" : "Test AI Provider (Synthetic)"}
          </button>
          <button
            onClick={loadHealth}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Synthetic ping banner */}
      {testResult && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            testResult.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-start gap-2">
            <Info size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">
                [SYNTHETIC_DIAGNOSTIC] Result
              </p>
              <p className="mt-0.5 text-xs leading-relaxed">{testResult.message}</p>
              <p className="mt-1 text-[11px] opacity-75">
                Note: A synthetic provider ping verifies server-to-provider connectivity only. It does not prove mobile runtime completion or device speaker/mic validation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SRE Core Principle Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-900">Operational Health Guarantees:</span> MindConnect strictly distinguishes between{" "}
            <strong>Configuration</strong> (environment keys present), <strong>Provider Reachability</strong> (network API ping),{" "}
            <strong>Runtime Success</strong> (real executed user flows), and <strong>Device Validation</strong> (hardware/mic/speaker testing). Services awaiting first real usage remain honestly labeled as <em>Awaiting Verification</em>.
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">API Status</span>
            <Server size={18} className="text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {health?.status === "ok" ? "UP" : "DOWN"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Backend v{health?.version || "1.0.0"}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Healthy Services</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{healthyCount}</p>
          <p className="mt-1 text-xs text-slate-400">Of {matrix.length} monitored subsystems</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Awaiting Runtime</span>
            <Clock size={18} className="text-sky-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-sky-600">{awaitingCount}</p>
          <p className="mt-1 text-xs text-slate-400">Configured, pending real usage</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Degraded / Unhealthy</span>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{issuesCount}</p>
          <p className="mt-1 text-xs text-slate-400">Requires attention</p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Health check failed</p>
          <p className="text-xs mt-1">{error}</p>
          <button onClick={loadHealth} className="mt-2 text-xs underline font-medium">
            Retry connection
          </button>
        </div>
      )}

      {/* Operational Subsystems Matrix Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Cpu size={16} className="text-slate-500" />
            Operational Subsystems Matrix
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Granular breakdown of component configuration, external reachability, and verified server runtimes.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Component</th>
                <th className="px-4 py-3.5">Configured</th>
                <th className="px-4 py-3.5">Reachable</th>
                <th className="px-4 py-3.5">Runtime Status</th>
                <th className="px-4 py-3.5">Last Success</th>
                <th className="px-4 py-3.5">Safe Error</th>
                <th className="px-6 py-3.5">Device Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading && matrix.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCcw className="mx-auto h-6 w-6 animate-spin mb-2" />
                    Loading system telemetry…
                  </td>
                </tr>
              ) : matrix.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No operational metrics received from backend.
                  </td>
                </tr>
              ) : (
                matrix.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{row.name}</p>
                      <p className="text-[11px] text-slate-400">{row.category}</p>
                    </td>

                    <td className="px-4 py-4">
                      {row.configured ? (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                          <CheckCircle2 size={13} /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-400">
                          No
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {row.reachable ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                            <Radio size={13} className="text-emerald-500" /> Reachable
                          </span>
                          {row.latencyMs != null && (
                            <span className="text-[10px] text-slate-400">{row.latencyMs} ms</span>
                          )}
                        </div>
                      ) : row.configured ? (
                        <span className="font-medium text-rose-600">Unreachable</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={row.status} />
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                      {row.lastSuccess ? (
                        <span>{new Date(row.lastSuccess).toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400">Awaiting call</span>
                      )}
                    </td>

                    <td className="px-4 py-4 font-mono text-[11px]">
                      {row.lastError ? (
                        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700 border border-rose-100">
                          {row.lastError}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-500 max-w-xs text-[11px] leading-relaxed">
                      {row.deviceEvidence}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Push Notification Worker Heartbeat Details */}
      {health?.push && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Radio size={16} className="text-brand-600" />
              Push Worker &amp; Delivery Telemetry
            </h3>
            {health.push.workerLastSeenAt && (
              <span className="text-xs text-slate-400">
                Worker Heartbeat: {new Date(health.push.workerLastSeenAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-[11px] font-medium text-slate-500 uppercase">Worker Process</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {health.push.workerRunning ? "Active (<60s heartbeat)" : "Heartbeat Stale / Inactive"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-[11px] font-medium text-slate-500 uppercase">Registered Devices</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {health.push.activeDevices ?? 0} active
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-[11px] font-medium text-slate-500 uppercase">Pending Outbox</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {health.push.pendingOutbox ?? 0} messages
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-[11px] font-medium text-slate-500 uppercase">Last Delivery</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {health.push.lastSuccessfulPushAt
                  ? new Date(health.push.lastSuccessfulPushAt).toLocaleTimeString()
                  : "None recorded"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security & Governance Footer */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-[11px] text-slate-500 leading-relaxed">
        <p className="font-semibold text-slate-700">Security &amp; Redaction Guarantee:</p>
        Health endpoints and telemetry are authorized exclusively for authenticated administrators. Credentials, API keys, database connection strings, and student conversation/audio data are strictly excluded from all health telemetry.
      </div>
    </div>
  );
}
