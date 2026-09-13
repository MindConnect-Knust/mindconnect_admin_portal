import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { canCase, caseApi } from "../../services/caseApi";
import ProgressOutcomes from "../../components/cases/ProgressOutcomes";
import { canOutcome, outcomeApi } from "../../services/outcomeApi";

/**
 * A single counselling case.
 *
 * Tabbed rather than one long page, for two reasons. It keeps a counsellor
 * oriented, and — more importantly — each tab fetches its own data only when
 * opened. Opening a case does not pull every clinical note into the browser;
 * reading a note is a separate, audited request made only when somebody
 * clicks it.
 *
 * The server enforces assignment. If this page loads, the viewer is either
 * assigned to the case or reached it under supervisory access that has already
 * been written to the audit log.
 */

const TABS = [
  ["overview", "Overview"],
  ["plan", "Care plan"],
  ["sessions", "Sessions"],
  ["notes", "Notes"],
  ["timeline", "Timeline"],
  ["wellbeing", "Wellbeing"],
  ["outcomes", "Progress & Outcomes"],
];

const readable = (value) =>
  String(value || "").toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const when = (value) => (value ? new Date(value).toLocaleString() : "—");
const day = (value) => (value ? new Date(value).toLocaleDateString() : "—");

const input =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
const button =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const primary =
  "rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50";

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

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  );
}

export default function CaseDetail() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const { notify } = useToast();

  const [config, setConfig] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [outcomesOn, setOutcomesOn] = useState(false);
  const mayViewOutcomes = canOutcome(admin, "OUTCOME_CASE_VIEW");

  // Progress & Outcomes appears only when the service has switched it on.
  useEffect(() => {
    if (!mayViewOutcomes) return;
    outcomeApi.config().then((cfg) => setOutcomesOn(Boolean(cfg?.enabled))).catch(() => setOutcomesOn(false));
  }, [mayViewOutcomes]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfg, detail] = await Promise.all([caseApi.config(), caseApi.get(caseId)]);
      setConfig(cfg);
      setCaseData(detail);
    } catch (loadError) {
      setError(loadError.status === 404 ? "This case does not exist or is not assigned to you." : loadError.message);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !caseData) {
    return <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" aria-busy="true" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <Lock className="mx-auto text-slate-400" size={30} aria-hidden="true" />
        <p className="mt-3 font-semibold text-slate-900">Case unavailable</p>
        <p className="mt-1 text-sm text-slate-600">{error}</p>
        <button type="button" onClick={() => navigate("/cases")} className={`${button} mt-4`}>
          Back to workspace
        </button>
      </div>
    );
  }

  const isClosed = caseData.status === "CLOSED";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate("/cases")} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Back to workspace">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="font-mono text-xs font-semibold text-slate-500">{caseData.caseRef}</p>
            <h1 className="text-xl font-semibold text-slate-900">{caseData.student?.name || "Student"}</h1>
            <p className="text-sm text-slate-600">
              {readable(caseData.status)} · {readable(caseData.priority)} priority · opened {day(caseData.caseOpenedAt)}
            </p>
          </div>
        </div>
        <button type="button" onClick={load} className={button}>
          <RefreshCw size={14} className="mr-1 inline" aria-hidden="true" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200" role="tablist" aria-label="Case sections">
        {TABS.filter(([value]) => value !== "outcomes" || (mayViewOutcomes && outcomesOn)).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === value ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <Overview caseData={caseData} config={config} admin={admin} notify={notify} reload={load} isClosed={isClosed} />
      )}
      {tab === "plan" && <CarePlanTab caseId={caseId} notify={notify} readOnly={isClosed} />}
      {tab === "sessions" && <SessionsTab caseId={caseId} config={config} notify={notify} readOnly={isClosed} reload={load} />}
      {tab === "notes" && (
        <NotesTab caseId={caseId} config={config} notify={notify} canWrite={canCase(admin, "CASE_NOTE_WRITE")} />
      )}
      {tab === "timeline" && <TimelineTab caseId={caseId} notify={notify} />}
      {tab === "wellbeing" && <WellbeingTab caseId={caseId} notify={notify} />}
      {tab === "outcomes" && mayViewOutcomes && outcomesOn && <ProgressOutcomes caseId={caseId} notify={notify} readOnly={isClosed} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function Overview({ caseData, config, admin, notify, reload, isClosed }) {
  const [busy, setBusy] = useState(false);
  const [concern, setConcern] = useState("");
  const [topConcern, setTopConcern] = useState("");
  const [closeReason, setCloseReason] = useState("GOALS_MET");
  const [closeNote, setCloseNote] = useState("");
  const [handoverTo, setHandoverTo] = useState("");
  const [handoverReason, setHandoverReason] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [status, setStatus] = useState("");

  const run = async (action, success) => {
    setBusy(true);
    try {
      await action();
      notify(success, "success");
      await reload();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const studentReported = (caseData.presentingConcerns || []).filter((c) => c.source === "STUDENT_REPORTED");
  const clinicianRecorded = (caseData.presentingConcerns || []).filter((c) => c.source === "CLINICIAN_RECORDED");
  const pending = caseData.pendingHandover;
  const isIncomingHandover = pending && String(pending.toCounsellor) === String(admin?.id);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Summary">
        <dl className="grid grid-cols-2 gap-3">
          <Field label="Student ID">{caseData.student?.studentId || "—"}</Field>
          <Field label="Programme">{caseData.student?.program || "—"}</Field>
          <Field label="Counsellor">{caseData.primaryCounsellor?.name || "Unassigned"}</Field>
          <Field label="Origin">{readable(caseData.origin)}</Field>
          <Field label="Last contact">{day(caseData.lastContactAt)}</Field>
          <Field label="Next review">{day(caseData.nextReviewAt)}</Field>
          <Field label="Follow-up due">{day(caseData.followUpDueAt)}</Field>
          <Field label="Contact attempts">{caseData.contactAttempts}</Field>
          <Field label="Next appointment">{caseData.nextAppointment ? when(caseData.nextAppointment.at) : "None booked"}</Field>
          <Field label="Open tasks">{caseData.openTaskCount}</Field>
        </dl>
        {caseData.crisisIncidentCount > 0 && (
          <p className="mt-3 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            This case is linked to {caseData.crisisIncidentCount} safety incident
            {caseData.crisisIncidentCount === 1 ? "" : "s"}. Incident detail is held in the Crisis Command Centre.
          </p>
        )}
      </Section>

      <Section title="Presenting concerns">
        {/*
          Shown in two lists on purpose. What the student said in triage and what
          a counsellor recorded after evaluation are different facts, and neither
          is a diagnosis.
        */}
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Student-reported</p>
        <p className="mt-1 text-sm text-slate-800">
          {studentReported.length ? studentReported.map((c) => readable(c.key)).join(", ") : "None recorded"}
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Clinician-recorded</p>
        <p className="mt-1 text-sm text-slate-800">
          {clinicianRecorded.length ? clinicianRecorded.map((c) => readable(c.key)).join(", ") : "Not yet recorded"}
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Top concern</p>
        <p className="mt-1 text-sm text-slate-800">{caseData.topConcern ? readable(caseData.topConcern) : "Not set"}</p>

        {!isClosed && canCase(admin, "CASE_MANAGE") && (
          <form
            className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              run(
                () =>
                  caseApi.recordConcerns(caseData.id, {
                    concerns: concern ? [concern] : [],
                    topConcern: topConcern || undefined,
                  }),
                "Clinical concerns recorded."
              ).then(() => {
                setConcern("");
                setTopConcern("");
              });
            }}
          >
            <label className="sr-only" htmlFor="concern-add">Add a clinician-recorded concern</label>
            <input id="concern-add" className={input} placeholder="Concern key, e.g. SLEEP" value={concern} onChange={(e) => setConcern(e.target.value.toUpperCase())} />
            <label className="sr-only" htmlFor="concern-top">Top concern</label>
            <input id="concern-top" className={input} placeholder="Top concern" value={topConcern} onChange={(e) => setTopConcern(e.target.value.toUpperCase())} />
            <button type="submit" disabled={busy || (!concern && !topConcern)} className={button}>Record</button>
          </form>
        )}
      </Section>

      <Section title="Referrals in progress">
        {caseData.openReferrals?.length ? (
          <ul className="space-y-2">
            {caseData.openReferrals.map((referral) => (
              <li key={referral.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <span className="text-slate-800">{referral.destinationName || "Referral"}</span>
                <span className="text-xs text-slate-500">{readable(referral.status)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No open referrals.</p>
        )}
      </Section>

      <Section title="Case actions">
        {isIncomingHandover && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm font-medium text-emerald-900">This case has been offered to you.</p>
            <div className="mt-2 flex gap-2">
              <button type="button" disabled={busy} className={primary} onClick={() => run(() => caseApi.respondHandover(caseData.id, pending.id, { accept: true }), "Handover accepted.")}>
                Accept
              </button>
              <button type="button" disabled={busy} className={button} onClick={() => run(() => caseApi.respondHandover(caseData.id, pending.id, { accept: false, declineReason: "Unable to take this case" }), "Handover declined.")}>
                Decline
              </button>
            </div>
          </div>
        )}

        {isClosed ? (
          canCase(admin, "CASE_CLOSE") && (
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                run(() => caseApi.reopen(caseData.id, reopenReason), "Case reopened.");
              }}
            >
              <p className="text-sm text-slate-700">
                Closed: {readable(caseData.closure?.topReason)} on {day(caseData.closure?.closedAt)}
              </p>
              <label className="block text-xs font-medium text-slate-600" htmlFor="reopen-reason">Reason for reopening</label>
              <input id="reopen-reason" className={input} value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} required />
              <button type="submit" disabled={busy || !reopenReason.trim()} className={button}>Reopen case</button>
            </form>
          )
        ) : (
          <div className="space-y-5">
            {canCase(admin, "CASE_MANAGE") && (
              <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  run(() => caseApi.updateStatus(caseData.id, { status }), "Status updated.").then(() => setStatus(""));
                }}
              >
                <div className="min-w-[200px] flex-1">
                  <label className="block text-xs font-medium text-slate-600" htmlFor="case-status">Move case to</label>
                  <select id="case-status" className={input} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">Choose a status…</option>
                    {(config?.statuses || [])
                      .filter((value) => !["CLOSED", "REOPENED"].includes(value))
                      .map((value) => (
                        <option key={value} value={value}>{readable(value)}</option>
                      ))}
                  </select>
                </div>
                <button type="submit" disabled={busy || !status} className={button}>Update</button>
              </form>
            )}

            {canCase(admin, "CASE_HANDOVER") && !pending && (
              <form
                className="space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  run(() => caseApi.handover(caseData.id, { counsellorId: handoverTo, reason: handoverReason }), "Handover requested. It moves when they accept.").then(() => {
                    setHandoverTo("");
                    setHandoverReason("");
                  });
                }}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Hand over</p>
                <label className="sr-only" htmlFor="handover-to">Receiving counsellor user ID</label>
                <input id="handover-to" className={input} placeholder="Receiving counsellor's user ID" value={handoverTo} onChange={(e) => setHandoverTo(e.target.value.trim())} />
                <label className="sr-only" htmlFor="handover-reason">Handover reason</label>
                <input id="handover-reason" className={input} placeholder="Reason, e.g. annual leave" value={handoverReason} onChange={(e) => setHandoverReason(e.target.value)} />
                <button type="submit" disabled={busy || !handoverTo || !handoverReason.trim()} className={button}>Request handover</button>
              </form>
            )}
            {pending && !isIncomingHandover && (
              <p className="text-sm text-slate-600">A handover is awaiting the receiving counsellor's response.</p>
            )}

            {canCase(admin, "CASE_CLOSE") && (
              <form
                className="space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  run(() => caseApi.close(caseData.id, { topReason: closeReason, reasons: [closeReason], note: closeNote }), "Case closed.");
                }}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Close case</p>
                <label className="sr-only" htmlFor="close-reason">Top closure reason</label>
                <select id="close-reason" className={input} value={closeReason} onChange={(e) => setCloseReason(e.target.value)}>
                  {(config?.closureReasons || []).map((value) => (
                    <option key={value} value={value}>{readable(value)}</option>
                  ))}
                </select>
                <label className="sr-only" htmlFor="close-note">Closure note</label>
                <textarea id="close-note" rows={2} className={input} placeholder="Closure note (visible to the care team only)" value={closeNote} onChange={(e) => setCloseNote(e.target.value)} />
                <button type="submit" disabled={busy} className={button}>Close case</button>
              </form>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Care plan
// ---------------------------------------------------------------------------

function CarePlanTab({ caseId, notify, readOnly }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [matters, setMatters] = useState("");
  const [goals, setGoals] = useState("");
  const [actions, setActions] = useState("");
  const [reviewAt, setReviewAt] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await caseApi.carePlan(caseId);
      setData(result);
      if (result.current) {
        setMatters(result.current.whatMattersToStudent || "");
        setGoals((result.current.goals || []).map((goal) => goal.description).join("\n"));
        setActions((result.current.actions || []).map((action) => action.description).join("\n"));
      }
    } catch (error) {
      notify(error.message, "error");
    }
  }, [caseId, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (agree) => {
    setBusy(true);
    try {
      await caseApi.saveCarePlan(caseId, {
        whatMattersToStudent: matters,
        goals: goals.split("\n").map((line) => line.trim()).filter(Boolean).map((description) => ({ description, owner: "SHARED" })),
        actions: actions.split("\n").map((line) => line.trim()).filter(Boolean).map((description) => ({ description, owner: "STUDENT" })),
        reviewAt: reviewAt || undefined,
        agree,
      });
      notify(agree ? "New agreed version saved." : "Draft saved as a new version.", "success");
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <Section title={data?.current ? `Version ${data.current.version} · ${readable(data.current.status)}` : "No care plan yet"}>
        <p className="mb-3 text-xs text-slate-500">
          Saving never edits the current plan. It creates a new version and keeps the previous one, so what was agreed
          and when stays on the record. Drafts are never shown to the student.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="plan-matters">What matters to the student (their words)</label>
            <textarea id="plan-matters" rows={2} className={input} value={matters} onChange={(e) => setMatters(e.target.value)} disabled={readOnly} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="plan-goals">Goals, one per line</label>
            <textarea id="plan-goals" rows={3} className={input} value={goals} onChange={(e) => setGoals(e.target.value)} disabled={readOnly} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="plan-actions">Agreed next steps, one per line</label>
            <textarea id="plan-actions" rows={3} className={input} value={actions} onChange={(e) => setActions(e.target.value)} disabled={readOnly} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor="plan-review">Review date</label>
            <input id="plan-review" type="date" className={input} value={reviewAt} onChange={(e) => setReviewAt(e.target.value)} disabled={readOnly} />
          </div>
          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => save(false)} className={button}>Save draft</button>
              <button type="button" disabled={busy} onClick={() => save(true)} className={primary}>Save as agreed with student</button>
            </div>
          )}
        </div>
      </Section>
      <Section title="History">
        {data?.history?.length ? (
          <ul className="space-y-2 text-sm">
            {data.history.map((plan) => (
              <li key={plan.id} className="flex justify-between text-slate-700">
                <span>v{plan.version} · {readable(plan.status)}</span>
                <span className="text-xs text-slate-500">{day(plan.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No earlier versions.</p>
        )}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

function SessionsTab({ caseId, config, notify, readOnly, reload }) {
  const [sessions, setSessions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ mode: "IN_PERSON", attendanceStatus: "ATTENDED", sessionType: "FOLLOW_UP" });

  const load = useCallback(async () => {
    try {
      setSessions(await caseApi.sessions(caseId));
    } catch (error) {
      notify(error.message, "error");
    }
  }, [caseId, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await caseApi.recordSession(caseId, form);
      notify(
        form.attendanceStatus === "NO_SHOW"
          ? "Recorded. A follow-up task has been created — a missed session is not treated as a safety concern."
          : "Session recorded and a follow-up task created.",
        "success"
      );
      await Promise.all([load(), reload()]);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const select = (field, options) => (
    <select className={input} value={form[field]} onChange={(e) => setForm((current) => ({ ...current, [field]: e.target.value }))}>
      {(options || []).map((value) => (
        <option key={value} value={value}>{readable(value)}</option>
      ))}
    </select>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Section title="Sessions">
        {sessions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <caption className="sr-only">Sessions on this case, newest first</caption>
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="py-2 pr-3">When</th>
                  <th scope="col" className="py-2 pr-3">Type</th>
                  <th scope="col" className="py-2 pr-3">Mode</th>
                  <th scope="col" className="py-2 pr-3">Attendance</th>
                  <th scope="col" className="py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 text-slate-800">{when(session.startedAt)}</td>
                    <td className="py-2 pr-3 text-slate-700">{readable(session.sessionType)}</td>
                    <td className="py-2 pr-3 text-slate-700">{readable(session.mode)}</td>
                    <td className="py-2 pr-3 text-slate-700">{readable(session.attendanceStatus)}</td>
                    <td className="py-2 text-slate-500">{session.hasNote ? "Yes" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No sessions recorded.</p>
        )}
      </Section>
      {!readOnly && (
        <Section title="Record a session">
          <form className="space-y-2" onSubmit={submit}>
            <label className="block text-xs font-medium text-slate-600">Type{select("sessionType", config?.sessionTypes)}</label>
            <label className="block text-xs font-medium text-slate-600">Mode{select("mode", config?.sessionModes)}</label>
            <label className="block text-xs font-medium text-slate-600">Attendance{select("attendanceStatus", config?.attendanceStatuses)}</label>
            <button type="submit" disabled={busy} className={primary}>Record session</button>
          </form>
        </Section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

function NotesTab({ caseId, config, notify, canWrite }) {
  const [notes, setNotes] = useState([]);
  const [opened, setOpened] = useState(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ noteType: "FOLLOW_UP_SESSION", listLabel: "", body: "" });
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    try {
      setNotes(await caseApi.notes(caseId));
    } catch (error) {
      if (error.status === 403) setForbidden(true);
      else notify(error.message, "error");
    }
  }, [caseId, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const openNote = async (note) => {
    try {
      // Reading a body is its own request and is audited server-side.
      setOpened(await caseApi.readNote(caseId, note.id));
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const create = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await caseApi.createNote(caseId, { ...draft, finalise: true });
      notify("Note saved.", "success");
      setDraft({ noteType: "FOLLOW_UP_SESSION", listLabel: "", body: "" });
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (forbidden) {
    return (
      <Section title="Notes">
        <p className="text-sm text-slate-600">Clinical notes require the note-writing permission.</p>
      </Section>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Section title="Notes">
        <p className="mb-2 text-xs text-slate-500">Opening a note is recorded in the audit log.</p>
        {notes.length ? (
          <ul className="space-y-1">
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => openNote(note)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 ${opened?.id === note.id ? "bg-emerald-50" : ""}`}
                >
                  <span className="block font-medium text-slate-800">{note.listLabel}</span>
                  <span className="block text-xs text-slate-500">{note.author?.name || "—"} · {day(note.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No notes.</p>
        )}
      </Section>

      <div className="space-y-4">
        {opened && (
          <Section title={readable(opened.noteType)} action={<button type="button" className={button} onClick={() => setOpened(null)}>Close</button>}>
            <p className="whitespace-pre-wrap text-sm text-slate-800">{opened.body}</p>
            {opened.amended && <p className="mt-2 text-xs text-slate-500">This note has been amended; earlier versions are retained.</p>}
          </Section>
        )}
        {canWrite && (
          <Section title="Write a note">
            <form className="space-y-2" onSubmit={create}>
              <label className="block text-xs font-medium text-slate-600" htmlFor="note-type">Type</label>
              <select id="note-type" className={input} value={draft.noteType} onChange={(e) => setDraft((d) => ({ ...d, noteType: e.target.value }))}>
                {(config?.noteTypes || []).map((value) => (
                  <option key={value} value={value}>{readable(value)}</option>
                ))}
              </select>
              <label className="block text-xs font-medium text-slate-600" htmlFor="note-label">
                List label (shown in lists — no clinical detail)
              </label>
              <input id="note-label" className={input} value={draft.listLabel} maxLength={120} onChange={(e) => setDraft((d) => ({ ...d, listLabel: e.target.value }))} />
              <label className="block text-xs font-medium text-slate-600" htmlFor="note-body">Note</label>
              <textarea id="note-body" rows={6} className={input} value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} />
              <button type="submit" disabled={busy || draft.body.trim().length < 2} className={primary}>Save note</button>
            </form>
          </Section>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline and wellbeing
// ---------------------------------------------------------------------------

function TimelineTab({ caseId, notify }) {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    caseApi.timeline(caseId).then(setEvents).catch((error) => notify(error.message, "error"));
  }, [caseId, notify]);

  return (
    <Section title="Timeline">
      {events.length ? (
        <ol className="space-y-3 border-l border-slate-200 pl-4">
          {events.map((event, index) => (
            <li key={`${event.type}-${event.ref || index}`} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />
              <p className="text-sm text-slate-800">{event.label}</p>
              <p className="text-xs text-slate-500">{readable(event.type)} · {when(event.at)}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-slate-500">No events yet.</p>
      )}
    </Section>
  );
}

function WellbeingTab({ caseId, notify }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    caseApi.wellbeing(caseId).then(setData).catch((error) => notify(error.message, "error"));
  }, [caseId, notify]);

  if (!data) return <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" aria-busy="true" />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Self-reported mood">
        <p className="mb-2 text-xs text-slate-500">{data.mood.note}</p>
        {data.mood.entries.length ? (
          <ul className="space-y-1 text-sm">
            {data.mood.entries.map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="flex justify-between">
                <span className="text-slate-800">{entry.mood}</span>
                <span className="text-xs text-slate-500">{day(entry.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No mood check-ins.</p>
        )}
      </Section>
      <Section title="Screening results">
        <p className="mb-2 text-xs text-slate-500">{data.assessments.note}</p>
        {data.assessments.entries.length ? (
          <ul className="space-y-1 text-sm">
            {data.assessments.entries.map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="flex justify-between gap-2">
                <span className="text-slate-800">
                  {entry.template || "Check-in"} {entry.version ? `(${entry.version})` : ""} · {readable(entry.band)}
                </span>
                <span className="text-xs text-slate-500">{day(entry.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No screening results.</p>
        )}
      </Section>
    </div>
  );
}
