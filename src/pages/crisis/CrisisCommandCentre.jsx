import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, LockKeyhole, RefreshCw, ShieldAlert, UserRoundCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { canCrisis, crisisApi } from "../../services/crisisApi";
import { subscribeToCrisisIncidents } from "../../services/crisisSocket";
import IncidentMap from "../../components/crisis/IncidentMap";

const badge = {
  IMMINENT: "border-rose-200 bg-rose-50 text-rose-700",
  HIGH: "border-amber-200 bg-amber-50 text-amber-800",
};

const when = (value) => value ? new Date(value).toLocaleString() : "Not recorded";
const age = (value) => {
  if (!value) return "unknown";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
};

function EmptyQueue() {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
      <CheckCircle2 className="mx-auto text-emerald-600" size={34} />
      <p className="mt-3 font-semibold text-emerald-900">No active safety incidents</p>
      <p className="mt-1 text-sm text-emerald-700">The queue refreshes automatically.</p>
    </div>
  );
}

export default function CrisisCommandCentre() {
  const { admin } = useAuth();
  const { notify } = useToast();
  const [incidents, setIncidents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [responders, setResponders] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [resolutionCode, setResolutionCode] = useState("SUPPORT_COMPLETED");
  const [selectedResponder, setSelectedResponder] = useState("");
  const [, tick] = useState(0);

  const loadQueue = useCallback(async () => {
    const [queue, onDuty] = await Promise.all([crisisApi.listActive(), crisisApi.onDuty()]);
    setIncidents(queue);
    setResponders(onDuty);
    setSelectedId((current) => current && queue.some((item) => item.id === current) ? current : queue[0]?.id || null);
    setLoading(false);
  }, []);

  const loadDetail = useCallback(async (id) => {
    if (!id) return setDetail(null);
    setDetail(await crisisApi.getIncident(id));
  }, []);

  useEffect(() => {
    loadQueue().catch((error) => {
      setLoading(false);
      notify(error.message, "error");
    });
    const refresh = setInterval(() => loadQueue().catch(() => {}), 20000);
    const clock = setInterval(() => tick((value) => value + 1), 1000);
    const unsubscribe = subscribeToCrisisIncidents(() => {
      loadQueue().catch(() => {});
      if (selectedId) loadDetail(selectedId).catch(() => {});
    });
    return () => {
      clearInterval(refresh);
      clearInterval(clock);
      unsubscribe();
    };
  }, [loadDetail, loadQueue, notify, selectedId]);

  useEffect(() => {
    loadDetail(selectedId).catch((error) => notify(error.message, "error"));
  }, [loadDetail, notify, selectedId]);

  const ordered = useMemo(() => [...incidents].sort((a, b) => {
    if (a.riskTier !== b.riskTier) return a.riskTier === "IMMINENT" ? -1 : 1;
    return new Date(a.triggeredAt) - new Date(b.triggeredAt);
  }), [incidents]);

  const act = async (label, operation) => {
    setBusy(true);
    try {
      await operation();
      notify(label);
      setReason("");
      await loadQueue();
      if (selectedId) await loadDetail(selectedId);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const student = detail?.context?.student || detail?.student || {};
  const context = detail?.context;
  const can = (permission) => canCrisis(admin, permission);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-rose-700"><ShieldAlert size={20} /><span className="text-xs font-bold uppercase tracking-[0.18em]">Restricted clinical operations</span></div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Crisis command centre</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">Use the minimum information needed to coordinate safety support. Every incident, context, location, and break-glass view is audited.</p>
        </div>
        <button onClick={() => loadQueue()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section aria-label="Active incident queue" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Active queue</h3>
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">{incidents.length}</span>
          </div>
          {loading ? <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">Loading secure queue…</div> : null}
          {!loading && ordered.length === 0 ? <EmptyQueue /> : null}
          <div className="space-y-2">
            {ordered.map((incident) => (
              <button key={incident.id} onClick={() => setSelectedId(incident.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === incident.id ? "border-slate-900 bg-slate-900 text-white shadow-lg" : "border-slate-200 bg-white hover:border-slate-400"}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-full border px-2 py-1 text-[11px] font-bold tracking-wide ${selectedId === incident.id ? "border-white/30 bg-white/10 text-white" : badge[incident.riskTier]}`}>{incident.riskTier}</span>
                  <span className={`text-xs font-semibold tabular-nums ${selectedId === incident.id ? "text-white/70" : "text-slate-500"}`}>{age(incident.triggeredAt)} open</span>
                </div>
                <p className="mt-3 truncate text-sm font-semibold">{incident.student?.name || "Student"}</p>
                <p className={`mt-1 text-xs ${selectedId === incident.id ? "text-white/65" : "text-slate-500"}`}>{incident.sourceType.replaceAll("_", " ")} · {incident.status}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="min-w-0">
          {!detail ? (
            <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">Select an incident to begin.</div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${badge[detail.riskTier]}`}>{detail.riskTier}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{detail.status}</span>
                      <span className="text-xs text-slate-500">Incident {detail.id.slice(-8)}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-slate-950">{student.name || "Student safety incident"}</h3>
                    <p className="mt-1 text-sm text-slate-600">{student.email || "Identity available only with context access"} · Triggered {when(detail.triggeredAt)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    <p className="font-semibold text-slate-800">Acknowledgement timer</p>
                    <p className={`mt-1 text-2xl font-bold tabular-nums ${detail.acknowledgedAt ? "text-emerald-700" : "text-rose-700"}`}>{detail.acknowledgedAt ? "Acknowledged" : age(detail.triggeredAt)}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Info icon={Clock3} label="Last signal" value={when(detail.lastSignalAt)} />
                  <Info icon={AlertTriangle} label="Signals" value={String(detail.signalCount || detail.signals?.length || 0)} />
                  <Info icon={UserRoundCheck} label="Assigned" value={detail.assignedResponder?.name || "Unassigned"} />
                  <Info icon={ShieldAlert} label="Dispatch" value={detail.dispatchState} />
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Panel title="Response controls" subtitle="Actions are atomic and written to the audit trail.">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {can("CRISIS_INCIDENT_ACKNOWLEDGE") && <Action disabled={busy || Boolean(detail.acknowledgedAt)} onClick={() => act("Incident acknowledged", () => crisisApi.acknowledge(detail.id))}>Acknowledge</Action>}
                    {can("CRISIS_ASSIGN") && (
                      <div className="flex gap-2 sm:col-span-2">
                        <select value={selectedResponder} onChange={(event) => setSelectedResponder(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm">
                          <option value="">Choose on-duty responder</option>
                          {responders.map((responder) => <option key={responder.id} value={responder.id}>{responder.name} · {responder.role}</option>)}
                        </select>
                        <Action disabled={busy || !selectedResponder} onClick={() => act("Responder assigned", () => crisisApi.assign(detail.id, selectedResponder))}>Assign</Action>
                      </div>
                    )}
                  </div>
                  <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required operational reason or resolution notes" className="mt-3 min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {can("CRISIS_ESCALATE") && <Action disabled={busy || reason.trim().length < 10} onClick={() => act("Incident escalated", () => crisisApi.escalate(detail.id, reason))}>Escalate</Action>}
                    {can("CRISIS_RESOLVE") && <>
                      <select value={resolutionCode} onChange={(event) => setResolutionCode(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm">
                        <option value="SUPPORT_COMPLETED">Support completed</option>
                        <option value="TRANSFERRED_TO_EMERGENCY_SERVICES">Transferred to emergency services</option>
                        <option value="FALSE_POSITIVE">False positive</option>
                        <option value="UNREACHABLE">Unreachable</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <Action disabled={busy || reason.trim().length < 10} onClick={() => act("Incident resolved", () => crisisApi.resolve(detail.id, resolutionCode, reason))}>Resolve</Action>
                    </>}
                  </div>
                  {can("CRISIS_BREAK_GLASS") && (
                    <button disabled={busy || reason.trim().length < 20} onClick={() => act("Temporary break-glass access granted", async () => { await crisisApi.breakGlass(detail.id, reason); await loadDetail(detail.id); })} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 text-sm font-semibold text-rose-800 disabled:opacity-40">
                      <LockKeyhole size={16} /> Break glass for restricted context
                    </button>
                  )}
                </Panel>

                <Panel title="Location" subtitle="Exact coordinates appear only with location permission or an active break-glass grant.">
                  <IncidentMap location={detail.location} />
                </Panel>
              </div>

              <Panel title="Context timeline" subtitle="Built from source-of-truth records at view time; no duplicated emergency snapshot.">
                {!context ? <Restricted /> : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <ContextList title="Recent moods" rows={context.recentMoods} render={(row) => `${row.mood} · ${when(row.createdAt)}`} />
                    <ContextList title="Assessments" rows={context.recentAssessments} render={(row) => `${row.riskLevel || "recorded"} · score ${row.totalScore ?? "n/a"} · ${when(row.createdAt)}`} />
                    <ContextList title="Appointments" rows={context.appointments} render={(row) => `${row.status} · ${when(row.dateTime)}`} />
                    <ContextList title="Signals" rows={detail.signals} render={(row) => `${row.severity} · ${(row.reasonCodes || []).join(", ")} · ${when(row.occurredAt)}`} />
                    <div className="md:col-span-2">
                      <ContextList title="Trigger conversation" rows={context.conversation?.messages} render={(row) => `${row.role || row.senderRole}: ${row.content || row.text || ""}`} restricted={!context.conversation} />
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-950">{title}</h3><p className="mt-1 text-xs text-slate-500">{subtitle}</p><div className="mt-4">{children}</div></div>;
}
function Info({ icon: Icon, label, value }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><Icon size={15} className="text-slate-500" /><p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</p></div>;
}
function Action({ children, ...props }) {
  return <button {...props} className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">{children}</button>;
}
function Restricted() {
  return <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600"><LockKeyhole size={17} /> Restricted context is not available to this role.</div>;
}
function ContextList({ title, rows = [], render, restricted = false }) {
  return <div><h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h4>{restricted ? <div className="mt-2"><Restricted /></div> : rows?.length ? <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">{rows.slice(0, 12).map((row, index) => <li key={row._id || index} className="px-3 py-2 text-sm text-slate-700">{render(row)}</li>)}</ul> : <p className="mt-2 text-sm text-slate-400">No records.</p>}</div>;
}
