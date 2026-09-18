import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { canConcern, concernReviewApi } from "../../services/staffConcernApi";
import { ACTION_LABELS, availableActions, readable } from "../../services/scope3Format";

/**
 * One staff concern, for professionals. Opening this page records a view in the
 * audit log. Actions are offered from the current status; the server enforces
 * the same state machine and every permission.
 */
const when = (value) => (value ? new Date(value).toLocaleString() : "—");
const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40";

function Row({ label, children }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[12rem_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800">{children}</dd>
    </div>
  );
}

export default function ConcernDetail() {
  const { concernId } = useParams();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const { notify } = useToast();
  const [detail, setDetail] = useState(null);
  const [action, setAction] = useState("");
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);
  const [accountQuery, setAccountQuery] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const canAct = canConcern(admin, "CONCERN_REFERRAL_DISPOSITION");

  const load = useCallback(async () => {
    try {
      setDetail(await concernReviewApi.detail(concernId));
    } catch (error) {
      notify(error.message, "error");
      if (error.status === 404) navigate("/concerns");
    }
  }, [concernId, navigate, notify]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (action === "CREATE_REFERRAL" && !destinations.length) {
      concernReviewApi.referralDestinations().then(setDestinations).catch((error) => notify(error.message, "error"));
    }
  }, [action, destinations.length, notify]);

  const run = async (fn, success) => {
    setBusy(true);
    try {
      const result = await fn();
      if (result) setDetail(result);
      else await load();
      notify(success, "success");
      setAction("");
      setFields({});
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (!detail) return <p className="text-sm text-slate-500">Loading…</p>;
  const actions = canAct ? availableActions(detail) : [];

  return (
    <div className="space-y-4">
      <Link to="/concerns" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"><ArrowLeft size={15} aria-hidden="true" /> Student Concerns</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{detail.student.displayName}</h2>
          <p className="text-sm text-slate-500">{detail.reference} · {readable(detail.status)} · reporter sees “{detail.reporterFacingStatus}”</p>
        </div>
        {detail.priority === "URGENT" && (
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-rose-700 bg-rose-50 px-3 py-1 text-sm font-bold text-rose-900"><AlertTriangle size={15} aria-hidden="true" /> Urgent</span>
        )}
      </div>

      <p className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"><Lock size={13} aria-hidden="true" /> Confidential. Opening this referral was recorded. Do not copy its contents into email or messaging.</p>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <dl className="space-y-3">
            <Row label="Immediate danger answer">{detail.immediateDangerLabel}{detail.urgentPath ? " (short urgent report)" : ""}</Row>
            <Row label="Reporter urgency">{readable(detail.reporterUrgency)}</Row>
            <Row label="Concerns">{detail.categoryLabels.join(", ")}</Row>
            <Row label="What they observed">{detail.textRedactedAt ? <em>Redacted under the retention policy</em> : <span className="whitespace-pre-wrap">{detail.observations || "—"}</span>}</Row>
            <Row label="What the student said">{detail.textRedactedAt ? <em>Redacted</em> : <span className="whitespace-pre-wrap">{detail.reportedStatements || "—"}</span>}</Row>
            <Row label="Observed">{when(detail.observedAt)} · {readable(detail.frequency)}</Row>
            <Row label="Spoken to student">{detail.hasSpokenToStudent == null ? "Not said" : detail.hasSpokenToStudent ? "Yes" : "No"}</Row>
            <Row label="Student aware of referral">{readable(detail.studentAwareOfReferral)}</Row>
          </dl>

          {detail.clarifications.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Questions to the reporter</h3>
              <ul className="mt-2 space-y-2">
                {detail.clarifications.map((entry) => (
                  <li key={entry.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-800">{entry.question}</p>
                    <p className="mt-1 text-slate-700">{entry.response || <em className="text-slate-500">Awaiting answer</em>}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Activity</h3>
            <ol className="mt-2 space-y-1.5 text-sm">
              {detail.activity.map((entry, index) => (
                <li key={`${entry.at}-${index}`} className="text-slate-700">
                  <span className="text-slate-500">{when(entry.at)}</span> · {readable(entry.action)}{entry.toStatus && entry.toStatus !== entry.fromStatus ? ` → ${readable(entry.toStatus)}` : ""}{entry.note ? ` — ${entry.note}` : ""}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <h3 className="font-semibold text-slate-900">Student</h3>
            <p className="mt-1 text-slate-700">{detail.student.studentRef || "No student number"} · {detail.student.identityVerified ? "from the university directory" : "entered by the reporter, not verified"}</p>
            <p className="mt-1 text-slate-700">{detail.student.hasMindConnectAccount ? "Linked to a MindConnect account" : "No MindConnect account linked"}</p>
            {detail.openCase && <p className="mt-1 text-slate-700">Open case <Link className="font-semibold text-emerald-800 underline" to={`/cases/${detail.openCase.id}`}>{detail.openCase.caseRef}</Link></p>}
            {!detail.student.hasMindConnectAccount && canAct && (
              <div className="mt-3 space-y-2">
                <label htmlFor="account-search" className="block text-xs font-semibold text-slate-700">Link a MindConnect account</label>
                <div className="flex gap-2">
                  <input id="account-search" className={input} value={accountQuery} onChange={(event) => setAccountQuery(event.target.value)} placeholder="Student number or name" />
                  <button type="button" className="rounded-lg border border-slate-300 px-2 text-xs font-semibold" onClick={async () => setAccounts(await concernReviewApi.searchAccounts(accountQuery).catch(() => []))}>Find</button>
                </div>
                <ul className="space-y-1">
                  {accounts.map((account) => (
                    <li key={account.id} className="flex items-center justify-between gap-2 text-xs">
                      <span>{account.name} · {account.studentId || "no number"} <span className="text-slate-500">(self-reported)</span></span>
                      <button type="button" disabled={busy} className="rounded border border-emerald-600 px-2 py-0.5 font-semibold text-emerald-800" onClick={() => run(() => concernReviewApi.linkStudent(concernId, account.id), "Account linked")}>Link</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <h3 className="font-semibold text-slate-900">Reporter</h3>
            <p className="mt-1 text-slate-700">{detail.reporter.name} · {readable(detail.reporter.role)}{detail.reporter.department ? ` · ${detail.reporter.department}` : ""}</p>
            <p className="mt-1 text-slate-600">Prefers: {readable(detail.reporter.contactPreference)}{detail.reporter.email ? ` · ${detail.reporter.email}` : ""}</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <h3 className="font-semibold text-slate-900">Response times</h3>
            <p className="mt-1 text-slate-600">Submitted {when(detail.submittedAt)}</p>
            <p className="text-slate-600">First opened {when(detail.firstViewedAt)}</p>
            <p className="text-slate-600">Assigned {when(detail.assignedAt)}</p>
            {detail.overdue && <p className="mt-1 font-semibold text-rose-800">Past the configured review window</p>}
            {!detail.assignedAt && (
              <button type="button" disabled={busy} onClick={() => run(async () => { await concernReviewApi.assign(concernId); return null; }, "Assigned to you")} className="mt-2 rounded-lg bg-emerald-700 px-3 py-1.5 font-semibold text-white hover:bg-emerald-800">Take this referral</button>
            )}
          </section>

          {detail.possibleDuplicates.length > 0 && (
            <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">
              <h3 className="font-semibold text-amber-950">Possibly related referrals</h3>
              <ul className="mt-1 space-y-1">
                {detail.possibleDuplicates.map((entry) => <li key={entry.id}><Link className="underline" to={`/concerns/${entry.id}`}>{entry.reference}</Link> · {readable(entry.status)} · {readable(entry.reporterRole)}</li>)}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {actions.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Next step</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((name) => (
              <button key={name} type="button" onClick={() => { setAction(name); setFields({}); }} aria-pressed={action === name} className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${action === name ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-slate-300 text-slate-700 hover:bg-slate-50"} ${name === "ESCALATE_TO_CRISIS_SAFETY" ? "border-rose-600 text-rose-800" : ""}`}>
                {ACTION_LABELS[name]}
              </button>
            ))}
          </div>

          {action && (
            <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); run(() => concernReviewApi.disposition(concernId, { action, ...fields }), `${ACTION_LABELS[action]} recorded`); }}>
              {action === "REQUEST_INFORMATION" && (
                <div>
                  <label htmlFor="question" className="block text-sm font-semibold text-slate-800">Question for the reporter</label>
                  <p className="text-xs text-slate-500">The reporter will see this exact text. Do not include anything about the student’s care.</p>
                  <textarea id="question" className={input} maxLength={600} required value={fields.question || ""} onChange={(event) => setFields({ ...fields, question: event.target.value })} />
                </div>
              )}
              {action === "CREATE_REFERRAL" && (
                <div>
                  <label htmlFor="service" className="block text-sm font-semibold text-slate-800">Refer to</label>
                  <select id="service" className={input} required value={fields.supportServiceId || ""} onChange={(event) => setFields({ ...fields, supportServiceId: event.target.value })}>
                    <option value="">Choose a verified service</option>
                    {destinations.map((service) => <option key={service.id} value={service.id}>{service.name} · {readable(service.category)}</option>)}
                  </select>
                  <p className="text-xs text-slate-500">Only verified services that are taking referrals are listed.</p>
                </div>
              )}
              {action === "ESCALATE_TO_CRISIS_SAFETY" && (
                <div>
                  <label htmlFor="tier" className="block text-sm font-semibold text-slate-800">Level</label>
                  <select id="tier" className={input} value={fields.tier || "HIGH"} onChange={(event) => setFields({ ...fields, tier: event.target.value })}>
                    <option value="HIGH">Professional safety review needed</option>
                    <option value="IMMINENT">Immediate risk</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-600">This starts the Crisis Safety workflow. The reporter will not be told.</p>
                </div>
              )}
              {action === "MERGE_DUPLICATE" && (
                <div>
                  <label htmlFor="duplicate" className="block text-sm font-semibold text-slate-800">Duplicate of</label>
                  <select id="duplicate" className={input} required value={fields.duplicateOfId || ""} onChange={(event) => setFields({ ...fields, duplicateOfId: event.target.value })}>
                    <option value="">Choose a referral</option>
                    {detail.possibleDuplicates.map((entry) => <option key={entry.id} value={entry.id}>{entry.reference}</option>)}
                  </select>
                </div>
              )}
              {action === "CLOSE" && (
                <div>
                  <label htmlFor="outcome" className="block text-sm font-semibold text-slate-800">How was it resolved?</label>
                  <select id="outcome" className={input} required value={fields.closureOutcome || ""} onChange={(event) => setFields({ ...fields, closureOutcome: event.target.value })}>
                    <option value="">Choose</option>
                    {["SUPPORT_CONNECTED", "STUDENT_DECLINED_SUPPORT", "STUDENT_UNREACHABLE", "INFORMATION_ONLY", "NO_FURTHER_ACTION", "HANDLED_BY_OTHER_SERVICE", "INVALID_REPORT"].map((value) => <option key={value} value={value}>{readable(value)}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="note" className="block text-sm font-semibold text-slate-800">Note for the team {action === "ESCALATE_TO_CRISIS_SAFETY" ? "(required)" : "(optional)"}</label>
                <textarea id="note" className={input} maxLength={1000} required={action === "ESCALATE_TO_CRISIS_SAFETY"} value={fields.note || ""} onChange={(event) => setFields({ ...fields, note: event.target.value })} />
                <p className="text-xs text-slate-500">Visible to professionals only, never to the reporter.</p>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">Confirm</button>
                <button type="button" onClick={() => setAction("")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
