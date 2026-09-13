import { useCallback, useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { outcomeApi, canOutcome } from "../../services/outcomeApi";
import { useAuth } from "../../context/AuthContext";
import { SIGNAL_LABELS, changeSummary, chartSeries, readable } from "../../services/scope3Format";

/**
 * Progress & Outcomes for one case.
 *
 * Student-reported measures, shown so the counsellor and student can discuss
 * them: raw scores and bands for the professional, missing measures shown as
 * missing, change described plainly and called reliable only under an approved
 * method. Nothing here recommends a treatment.
 */

const input = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
const button = "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const primary = "rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50";
const day = (value) => (value ? new Date(value).toLocaleDateString() : "—");

const SERIES_STROKES = ["#0f766e", "#7c3aed", "#b45309"];

function Section({ title, children, action }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function MeasureCard({ measure, caseId, notify }) {
  const [table, setTable] = useState(false);
  const [items, setItems] = useState(null);
  const series = chartSeries(measure);
  const versions = [...new Set(measure.points.map((point) => point.scoringVersion))];

  const openItems = async (administrationId) => {
    try {
      setItems(await outcomeApi.responses(caseId, administrationId));
    } catch (error) {
      notify(error.message, "error");
    }
  };

  return (
    <Section
      title={`${measure.shortName}${measure.validated ? "" : " (not a validated instrument)"}`}
      action={<button type="button" className={button} onClick={() => setTable((value) => !value)} aria-pressed={table}>{table ? "Show chart" : "Show table"}</button>}
    >
      <p className="mb-2 text-sm text-slate-700">{changeSummary(measure.change)}</p>
      <p className="mb-3 text-xs text-slate-500">
        Missing: {measure.missing.declined} declined · {measure.missing.expired} expired · {measure.missing.invalid} invalid · {measure.missing.cancelled} cancelled. Missing measures are gaps, never zeros.
      </p>

      {!table && series.length > 0 && (
        <div className="h-56 w-full" role="img" aria-label={`${measure.shortName} scores over time. Use Show table for the values.`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="at" tickFormatter={day} tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis domain={measure.scoreRange ? [measure.scoreRange.min, measure.scoreRange.max] : ["auto", "auto"]} tick={{ fontSize: 11, fill: "#64748b" }} width={32} />
              <Tooltip labelFormatter={day} />
              {versions.length > 1 && <Legend />}
              {versions.map((version, index) => (
                <Line key={version} type="linear" dataKey={version} name={`Scoring ${version}`} stroke={SERIES_STROKES[index % SERIES_STROKES.length]} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {(table || series.length === 0) && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{measure.shortName} administrations</caption>
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Purpose</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Score</th><th className="py-2 pr-3">Band</th><th className="py-2">Items</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {measure.points.map((point) => (
                <tr key={point.id}>
                  <td className="py-2 pr-3">{day(point.completedAt || point.availableAt)}</td>
                  <td className="py-2 pr-3">{readable(point.purpose)}</td>
                  <td className="py-2 pr-3">
                    {readable(point.status)}
                    {point.safetyResponse && <span className="ml-1 inline-flex items-center gap-1 text-xs font-semibold text-rose-800"><AlertTriangle size={12} aria-hidden="true" /> safety response</span>}
                    {point.prorated && <span className="ml-1 text-xs text-slate-500">(prorated)</span>}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{point.rawScore ?? "—"}</td>
                  <td className="py-2 pr-3">{point.bandLabel || "—"}</td>
                  <td className="py-2">{["COMPLETED", "STARTED", "INVALID"].includes(point.status) ? <button type="button" className="text-xs font-semibold text-emerald-800 underline" onClick={() => openItems(point.id)}>View answers</button> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">Item answers (viewing is audited) · version {items.instrumentVersion}</p>
            <button type="button" className="text-xs underline" onClick={() => setItems(null)}>Close</button>
          </div>
          <ol className="mt-2 space-y-1 text-sm">
            {items.items.map((item) => (
              <li key={item.key} className="flex justify-between gap-3">
                <span className="text-slate-700">{item.text}</span>
                <span className="shrink-0 font-medium text-slate-900">{item.answerLabel || "Not answered"}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {measure.open.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-600"><Clock size={12} aria-hidden="true" /> Open: {measure.open.map((entry) => `${readable(entry.purpose)} until ${day(entry.expiresAt)}`).join("; ")}</p>
      )}
    </Section>
  );
}

export default function ProgressOutcomes({ caseId, notify, readOnly }) {
  const { admin } = useAuth();
  const [view, setView] = useState(null);
  const [offerable, setOfferable] = useState([]);
  const [schedule, setSchedule] = useState({ instrumentKey: "", overrideReason: "" });
  const [goal, setGoal] = useState({ title: "", target: "", category: "OTHER" });
  const [decision, setDecision] = useState({ context: "OUTCOME_REVIEW", whatMattersToStudent: "", options: "", decision: "", nextStep: "", reviewAt: "", studentSummary: "", updatePlan: false });
  const [selectedSignals, setSelectedSignals] = useState([]);
  const [busy, setBusy] = useState(false);
  const canSchedule = canOutcome(admin, "OUTCOME_SCHEDULE") && !readOnly;
  const canReview = canOutcome(admin, "OUTCOME_REVIEW");

  const load = useCallback(async () => {
    try {
      setView(await outcomeApi.caseView(caseId));
    } catch (error) {
      notify(error.message, "error");
    }
  }, [caseId, notify]);

  useEffect(() => {
    load();
    if (canSchedule) outcomeApi.offerable().then(setOfferable).catch(() => setOfferable([]));
  }, [load, canSchedule]);

  const act = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      notify(message, "success");
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (!view) return <p className="text-sm text-slate-500">Loading progress…</p>;
  const openSignals = view.signals.filter((signal) => signal.status !== "RESOLVED");

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">{view.note} Mood, Nyansa and other digital signals are not shown here and are not outcome measures.</p>

      {openSignals.length > 0 && (
        <Section title="Review prompts">
          <ul className="space-y-2">
            {openSignals.map((signal) => (
              <li key={signal.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${signal.severity === "URGENT" ? "border-rose-600 bg-rose-50" : "border-amber-300 bg-amber-50"}`}>
                <label className="flex items-center gap-2 text-sm text-slate-900">
                  <input type="checkbox" checked={selectedSignals.includes(signal.id)} onChange={() => setSelectedSignals((list) => (list.includes(signal.id) ? list.filter((id) => id !== signal.id) : [...list, signal.id]))} />
                  <AlertTriangle size={14} aria-hidden="true" />
                  <span><strong>{readable(signal.severity)}:</strong> {SIGNAL_LABELS[signal.signalType] || readable(signal.signalType)}{signal.instrumentKey ? ` · ${signal.instrumentKey}` : ""} · {day(signal.createdAt)}</span>
                </label>
                {canReview && (
                  <div className="flex gap-2">
                    {signal.status === "OPEN" && <button type="button" disabled={busy} className={button} onClick={() => act(() => outcomeApi.acknowledgeSignal(caseId, signal.id), "Acknowledged")}>Acknowledge</button>}
                    <button type="button" disabled={busy} className={button} onClick={() => act(() => outcomeApi.resolveSignal(caseId, signal.id, { resolution: "NO_CHANGE_NEEDED" }), "Resolved")}>No change needed</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">These are prompts to review, not diagnoses. Tick any you discussed and record the decision below.</p>
        </Section>
      )}

      {view.measures.length === 0 && <Section title="Measures"><p className="text-sm text-slate-500">No check-ins have been offered on this case.</p></Section>}
      {view.measures.map((measure) => <MeasureCard key={measure.instrumentKey} measure={measure} caseId={caseId} notify={notify} />)}

      {canSchedule && (
        <Section title="Offer a check-in">
          {offerable.length === 0 ? (
            <p className="text-sm text-slate-500">No instrument is approved and active yet.</p>
          ) : (
            <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); act(() => outcomeApi.schedule(caseId, { instrumentKey: schedule.instrumentKey, purpose: "PROFESSIONAL_REQUEST", overrideReason: schedule.overrideReason || undefined }), "Check-in offered"); }}>
              <label className="sr-only" htmlFor="instrument">Instrument</label>
              <select id="instrument" required className={input} value={schedule.instrumentKey} onChange={(event) => setSchedule({ ...schedule, instrumentKey: event.target.value })}>
                <option value="">Choose a measure</option>
                {offerable.map((instrument) => <option key={instrument.key} value={instrument.key}>{instrument.shortName} (about {instrument.estimatedMinutes} min)</option>)}
              </select>
              <label className="sr-only" htmlFor="override">Reason to override fatigue rules</label>
              <input id="override" className={input} placeholder="Reason, if offering sooner than usual" value={schedule.overrideReason} onChange={(event) => setSchedule({ ...schedule, overrideReason: event.target.value })} />
              <button type="submit" disabled={busy} className={primary}>Offer</button>
            </form>
          )}
        </Section>
      )}

      <Section title="Goals">
        {view.goals.length === 0 && <p className="text-sm text-slate-500">No goals yet.</p>}
        <ul className="space-y-2">
          {view.goals.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{entry.title}</p>
                <span className="text-xs text-slate-600">{readable(entry.status)} · review {day(entry.reviewAt)}</span>
              </div>
              {entry.target && <p className="text-slate-700">Target: {entry.target}</p>}
              <p className="mt-1 text-slate-700">Student says: <strong>{readable(entry.studentProgress)}</strong> · You recorded: <strong>{readable(entry.professionalProgress)}</strong></p>
              {entry.whatHelps && <p className="text-slate-600">What helps: {entry.whatHelps}</p>}
              {canSchedule && entry.status === "ACTIVE" && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600" htmlFor={`progress-${entry.id}`}>Review progress</label>
                  <select id={`progress-${entry.id}`} className="rounded-lg border border-slate-200 px-2 py-1 text-sm" defaultValue="" onChange={(event) => event.target.value && act(() => outcomeApi.updateGoal(caseId, entry.id, { progress: event.target.value }), "Goal reviewed")}>
                    <option value="">Choose</option>
                    {["NOT_STARTED", "A_LITTLE", "SOME", "A_LOT", "ACHIEVED", "NOT_SURE"].map((value) => <option key={value} value={value}>{readable(value)}</option>)}
                  </select>
                  <button type="button" className={button} disabled={busy} onClick={() => act(() => outcomeApi.updateGoal(caseId, entry.id, { status: "ACHIEVED" }), "Goal marked achieved")}>Mark achieved</button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {canSchedule && (
          <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); act(() => outcomeApi.createGoal(caseId, goal), "Goal added").then(() => setGoal({ title: "", target: "", category: "OTHER" })); }}>
            <label className="sr-only" htmlFor="goal-title">Goal, in the student’s words</label>
            <input id="goal-title" required maxLength={140} className={input} placeholder="Goal, in the student’s words" value={goal.title} onChange={(event) => setGoal({ ...goal, title: event.target.value })} />
            <label className="sr-only" htmlFor="goal-target">What better would look like</label>
            <input id="goal-target" maxLength={400} className={input} placeholder="What “better” would look like" value={goal.target} onChange={(event) => setGoal({ ...goal, target: event.target.value })} />
            <button type="submit" disabled={busy} className={primary}>Add goal</button>
          </form>
        )}
      </Section>

      <Section title="Shared decisions">
        {view.decisions.length === 0 && <p className="text-sm text-slate-500">No decisions recorded.</p>}
        <ul className="space-y-2">
          {view.decisions.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="text-xs text-slate-500">{day(entry.createdAt)} · {readable(entry.context)}{entry.carePlanId ? " · care plan updated" : ""}</p>
              {entry.whatMattersToStudent && <p className="text-slate-700"><span className="font-semibold">What matters:</span> {entry.whatMattersToStudent}</p>}
              {entry.optionsDiscussed?.length > 0 && <p className="text-slate-700"><span className="font-semibold">Options:</span> {entry.optionsDiscussed.join("; ")}</p>}
              <p className="text-slate-900"><span className="font-semibold">Agreed:</span> {entry.decision}</p>
              {entry.nextStep && <p className="text-slate-700"><span className="font-semibold">Next:</span> {entry.nextStep} · review {day(entry.reviewAt)}</p>}
            </li>
          ))}
        </ul>
        {canSchedule && (
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              act(() => outcomeApi.recordDecision(caseId, {
                context: decision.context,
                whatMattersToStudent: decision.whatMattersToStudent,
                optionsDiscussed: decision.options.split("\n").map((line) => line.trim()).filter(Boolean),
                decision: decision.decision,
                nextStep: decision.nextStep,
                reviewAt: decision.reviewAt || undefined,
                studentSummary: decision.studentSummary,
                signalIds: selectedSignals,
                ...(decision.updatePlan ? { carePlanChange: { agree: true, actions: decision.nextStep ? [{ description: decision.nextStep, owner: "COUNSELLOR" }] : [] } } : {}),
              }), "Decision recorded").then(() => setSelectedSignals([]));
            }}
          >
            <label className="block text-xs font-semibold text-slate-600" htmlFor="matters">What matters to the student</label>
            <textarea id="matters" className={input} maxLength={1000} value={decision.whatMattersToStudent} onChange={(event) => setDecision({ ...decision, whatMattersToStudent: event.target.value })} />
            <label className="block text-xs font-semibold text-slate-600" htmlFor="options">Options discussed (one per line)</label>
            <textarea id="options" className={input} value={decision.options} onChange={(event) => setDecision({ ...decision, options: event.target.value })} />
            <label className="block text-xs font-semibold text-slate-600" htmlFor="agreed">What was agreed</label>
            <textarea id="agreed" required className={input} maxLength={1000} value={decision.decision} onChange={(event) => setDecision({ ...decision, decision: event.target.value })} />
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600" htmlFor="next">Next step</label>
                <input id="next" className={input} maxLength={500} value={decision.nextStep} onChange={(event) => setDecision({ ...decision, nextStep: event.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600" htmlFor="review">Review on</label>
                <input id="review" type="date" className={input} value={decision.reviewAt} onChange={(event) => setDecision({ ...decision, reviewAt: event.target.value })} />
              </div>
            </div>
            <label className="block text-xs font-semibold text-slate-600" htmlFor="summary">Summary the student may see (optional)</label>
            <input id="summary" className={input} maxLength={500} value={decision.studentSummary} onChange={(event) => setDecision({ ...decision, studentSummary: event.target.value })} />
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={decision.updatePlan} onChange={(event) => setDecision({ ...decision, updatePlan: event.target.checked })} /> Create a new agreed care-plan version from this decision</label>
            <button type="submit" disabled={busy} className={primary}>Record decision{selectedSignals.length ? ` and resolve ${selectedSignals.length} prompt${selectedSignals.length > 1 ? "s" : ""}` : ""}</button>
          </form>
        )}
      </Section>

      <Section title="Care-plan revisions">
        {view.carePlanRevisions.length === 0 ? <p className="text-sm text-slate-500">No care plan yet.</p> : (
          <ul className="space-y-1 text-sm">
            {view.carePlanRevisions.map((plan) => (
              <li key={plan.id} className="flex items-center gap-2 text-slate-700">
                {plan.status === "AGREED" ? <CheckCircle2 size={14} className="text-emerald-700" aria-hidden="true" /> : <Clock size={14} aria-hidden="true" />}
                Version {plan.version} · {readable(plan.status)} · agreed {day(plan.agreedAt)} · review {day(plan.reviewAt)}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
