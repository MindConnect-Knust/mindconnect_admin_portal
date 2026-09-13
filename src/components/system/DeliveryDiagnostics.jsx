import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, MinusCircle, RefreshCcw, Send, XCircle } from "lucide-react";
import {
  COMPONENT_ROWS,
  LANE_LABELS,
  componentDetail,
  formatAge,
  formatMs,
  stateTone,
} from "../../services/deliveryDiagnostics";
import { getDeliveryDiagnostics } from "../../services/pushApi";

const TONES = {
  ok: { icon: CheckCircle2, className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  warn: { icon: AlertTriangle, className: "border-amber-200 bg-amber-50 text-amber-800" },
  down: { icon: XCircle, className: "border-rose-200 bg-rose-50 text-rose-700" },
  idle: { icon: MinusCircle, className: "border-slate-200 bg-slate-100 text-slate-600" },
};

function StateBadge({ state }) {
  const tone = TONES[stateTone(state)];
  const Icon = tone.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone.className}`}>
      <Icon size={12} aria-hidden="true" />
      {state || "UNKNOWN"}
    </span>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <p className="text-[11px] font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800">{value}</p>
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

const percent = (value) => (value === null || value === undefined ? "—" : `${(value * 100).toFixed(1)}%`);

/**
 * System operations view of notification delivery. It belongs in System
 * Health, not in leadership's Wellbeing Intelligence: it is about whether the
 * pipeline works, not about students.
 */
export default function DeliveryDiagnostics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getDeliveryDiagnostics());
      setError(null);
    } catch (err) {
      setError(err?.status === 403 ? "Delivery diagnostics require the NOTIFICATIONS_VIEW permission." : err?.message || "Diagnostics unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const lanes = data?.queue?.lanes || {};
  const dispatch = data?.latency?.notification_dispatch_latency_ms || {};
  const ticket = data?.latency?.notification_provider_ticket_latency_ms || {};
  const slo = data?.slo;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="delivery-diagnostics-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="delivery-diagnostics-title" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Send size={16} className="text-brand-600" aria-hidden="true" />
            Notification Delivery Diagnostics
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Dispatcher liveness, queue age by lane and delivery latency. Counts and codes only: no recipients, devices or message content.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}

      {data && (
        <>
          {data.alerts?.length > 0 ? (
            <ul className="space-y-1.5" aria-label="Active delivery alerts">
              {data.alerts.map((alert) => {
                const tone = alert.severity === "critical" ? TONES.down : TONES.warn;
                const Icon = tone.icon;
                return (
                  <li key={alert.code} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${tone.className}`}>
                    <Icon size={14} aria-hidden="true" />
                    <span className="font-semibold capitalize">{alert.severity}</span>
                    <span className="font-mono">{alert.code}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${TONES.ok.className}`}>
              <CheckCircle2 size={14} aria-hidden="true" /> No delivery alerts
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Oldest due push" value={formatAge(data.queue.notification_queue_oldest_age_seconds)} hint={slo ? `SLO ${formatAge(slo.queueOldestAgeSeconds)}` : null} />
            <Stat label="Due now" value={data.queue.dueNow} hint={data.queue.expiredLeases ? `${data.queue.expiredLeases} expired lease(s)` : null} />
            <Stat label="Waiting to retry" value={data.queue.retryWait} hint={`retries in 1h: ${data.reliability.lastHour.notification_retry_count}`} />
            <Stat label="Failure rate (1h)" value={percent(data.reliability.lastHour.failureRate)} hint={`receipts failed (24h): ${percent(data.reliability.last24h.notification_receipt_failure_rate)}`} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <caption className="sr-only">Background component status</caption>
              <thead className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Component</th>
                  <th className="py-2 pr-4">State</th>
                  <th className="py-2">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPONENT_ROWS.map(([key, label]) => (
                  <tr key={key}>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{label}</td>
                    <td className="py-2.5 pr-4"><StateBadge state={data.components[key]?.state} /></td>
                    <td className="py-2.5 text-[11px] text-slate-500">{componentDetail(key, data.components[key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <caption className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Queue and latency by lane (last hour, first attempts)
              </caption>
              <thead className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Lane</th>
                  <th className="py-2 pr-4 text-right">Due</th>
                  <th className="py-2 pr-4 text-right">Scheduled</th>
                  <th className="py-2 pr-4 text-right">Oldest due</th>
                  <th className="py-2 pr-4 text-right">Dispatch p50 / p95</th>
                  <th className="py-2 pr-4 text-right">Ticket p95</th>
                  <th className="py-2 text-right">SLO p95</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {Object.keys(LANE_LABELS).map((lane) => (
                  <tr key={lane}>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{LANE_LABELS[lane]}</td>
                    <td className="py-2.5 pr-4 text-right">{lanes[lane]?.dueNow ?? 0}</td>
                    <td className="py-2.5 pr-4 text-right">{lanes[lane]?.scheduled ?? 0}</td>
                    <td className="py-2.5 pr-4 text-right">{formatAge(lanes[lane]?.oldestDueAgeSeconds)}</td>
                    <td className="py-2.5 pr-4 text-right">{formatMs(dispatch[lane]?.p50)} / {formatMs(dispatch[lane]?.p95)}</td>
                    <td className="py-2.5 pr-4 text-right">{formatMs(ticket[lane]?.p95)}</td>
                    <td className="py-2.5 text-right text-slate-400">{slo ? formatMs(slo.dispatchP95Ms[lane]) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
            <Clock size={12} aria-hidden="true" />
            Generated {new Date(data.generatedAt).toLocaleString()} · environment {data.environment} · database {data.database?.name} ({data.database?.fingerprint}) · refreshes every 15 s.
            "Delivered to provider" means Expo handed the push to Apple or Google; no provider can confirm a person saw it.
          </p>
        </>
      )}
    </section>
  );
}
