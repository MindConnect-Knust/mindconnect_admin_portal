import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, LifeBuoy, Search } from "lucide-react";
import { staffConcernApi } from "../../services/staffConcernApi";
import { needsEmergencyGuidance, newIdempotencyKey, validateConcernForm } from "../../services/scope3Format";
import { ErrorSummary } from "./staffUi";
import EmergencyServices from "./EmergencyServices";

/**
 * "I'm concerned about a student."
 *
 * Step 1 is always the safety question. If the answer is anything but a clear
 * no, emergency guidance comes first and a short urgent report is offered, so
 * nobody has to get through a long form while someone may be in danger.
 *
 * The form asks what was observed, never what is wrong with the student. The
 * reporter's urgency is theirs; clinical risk is decided by professionals.
 */

const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40";
const label = "block text-sm font-semibold text-slate-800";
const hint = "mt-0.5 text-xs text-slate-500";

export default function ReferStudent() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [step, setStep] = useState("SAFETY");
  const [form, setForm] = useState({ concernCategories: [], frequency: "UNKNOWN", reporterUrgency: "ROUTINE", relationship: "TEACHES_STUDENT", studentAwareOfReferral: "UNSURE", reporterContactPreference: "PORTAL_ONLY" });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [loadError, setLoadError] = useState("");
  const idempotencyKey = useRef(newIdempotencyKey());
  const summaryRef = useRef(null);

  useEffect(() => {
    staffConcernApi.form().then(setConfig).catch((error) => setLoadError(error.message));
  }, []);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const urgent = step === "URGENT";

  const chosen = useMemo(() => results.find((row) => row.selection === form.selection), [results, form.selection]);

  const search = async (event) => {
    event.preventDefault();
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults(await staffConcernApi.searchStudents(query.trim()));
    } catch (error) {
      setErrors([{ field: "student", message: error.message }]);
    } finally {
      setSearching(false);
    }
  };

  const answerSafety = (answer) => {
    set("immediateDangerAnswer", answer);
    setStep(needsEmergencyGuidance(answer) ? "EMERGENCY" : "FORM");
  };

  const toggleCategory = (key) => {
    const list = form.concernCategories.includes(key) ? form.concernCategories.filter((item) => item !== key) : [...form.concernCategories, key];
    set("concernCategories", list);
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validateConcernForm(form, { urgent });
    setErrors(found);
    if (found.length) {
      setTimeout(() => summaryRef.current?.querySelector('[role="alert"]')?.focus(), 0);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        urgentPath: urgent,
        idempotencyKey: idempotencyKey.current,
        ...(form.selection ? { studentName: undefined, studentRef: undefined } : { selection: undefined }),
      };
      const result = await staffConcernApi.submit(payload);
      setDone(result);
    } catch (error) {
      setErrors([{ field: "form", message: error.message }]);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) return <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">{loadError}</p>;
  if (!config) return <p className="text-sm text-slate-500">Loading…</p>;

  if (done) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-white p-6" aria-live="polite">
        <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900"><CheckCircle2 className="text-emerald-700" aria-hidden="true" /> Your referral has been submitted</h1>
        <p className="mt-2 text-sm text-slate-700">Reference <strong>{done.reference}</strong>. {done.message}</p>
        <p className="mt-2 text-sm text-slate-600">You will see its status in My referrals. The support team may contact you if they need more information. Details of any support the student receives stay private.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => navigate("/staff/referrals")} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">View my referrals</button>
          <Link to="/staff" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to home</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Refer a student for support</h1>

      {step === "SAFETY" && (
        <fieldset className="rounded-2xl border border-slate-200 bg-white p-5">
          <legend className="px-1 text-base font-semibold text-slate-900">{config.immediateDangerQuestion}</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {config.immediateDangerAnswers.map((answer) => (
              <button key={answer.key} type="button" onClick={() => answerSafety(answer.key)} className="rounded-xl border-2 border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:border-emerald-600 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                {answer.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === "EMERGENCY" && (
        <section className="space-y-4 rounded-2xl border-2 border-slate-900 bg-white p-5" aria-labelledby="emergency-now">
          <h2 id="emergency-now" className="flex items-center gap-2 text-lg font-bold text-slate-900"><LifeBuoy aria-hidden="true" /> If someone may be in danger right now</h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-800">
            <li>If there is an immediate threat to life, contact emergency services and KNUST security now, using the verified contacts below.</li>
            <li>Stay with the student if it is safe to do so. Do not put yourself at risk.</li>
            <li>Then send a short urgent report so the support team knows at once.</li>
          </ol>
          <EmergencyServices />
          <div className="flex flex-wrap gap-3 pt-1">
            <button type="button" onClick={() => setStep("URGENT")} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              <AlertTriangle size={16} aria-hidden="true" /> Send a short urgent report
            </button>
            <button type="button" onClick={() => setStep("FORM")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Continue to the full form</button>
          </div>
        </section>
      )}

      {(step === "FORM" || step === "URGENT") && (
        <form onSubmit={submit} noValidate className="space-y-5" ref={summaryRef}>
          <ErrorSummary errors={errors} />
          {urgent && (
            <p className="flex items-start gap-2 rounded-xl border-2 border-amber-500 bg-amber-50 p-3 text-sm text-amber-950">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span><strong>Urgent report.</strong> Only the student is required. Add anything else you can. This report does not replace contacting emergency help.</span>
            </p>
          )}

          <fieldset id="field-student" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <legend className="px-1 text-base font-semibold text-slate-900">Which student?</legend>
            {!manualEntry ? (
              <>
                <div className="flex gap-2">
                  <label htmlFor="student-search" className="sr-only">Search by name or student number</label>
                  <input id="student-search" className={input} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search(event); }} placeholder="Name or student number (at least 3 characters)" autoComplete="off" />
                  <button type="button" onClick={search} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={searching}>
                    <Search size={15} aria-hidden="true" /> {searching ? "Searching" : "Search"}
                  </button>
                </div>
                {results.length > 0 && (
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200" aria-label="Matching students">
                    {results.map((row) => (
                      <li key={row.selection}>
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
                          <input type="radio" name="student" checked={form.selection === row.selection} onChange={() => set("selection", row.selection)} />
                          <span className="text-sm text-slate-800"><strong>{row.fullName}</strong> · {row.studentRef}{row.programme ? ` · ${row.programme}` : ""}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                {chosen && <p className="text-sm text-emerald-800">Selected: {chosen.fullName}</p>}
                <button type="button" onClick={() => { setManualEntry(true); set("selection", undefined); }} className="text-sm font-medium text-emerald-700 underline">I can’t find the student</button>
              </>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="student-name" className={label}>Student’s name</label>
                  <input id="student-name" className={input} value={form.studentName || ""} onChange={(event) => set("studentName", event.target.value)} maxLength={160} />
                </div>
                <div>
                  <label htmlFor="student-ref" className={label}>Student number <span className="font-normal text-slate-500">(if known)</span></label>
                  <input id="student-ref" className={input} value={form.studentRef || ""} onChange={(event) => set("studentRef", event.target.value)} maxLength={40} />
                </div>
                <button type="button" onClick={() => setManualEntry(false)} className="text-left text-sm font-medium text-emerald-700 underline">Search instead</button>
              </div>
            )}
          </fieldset>

          <fieldset id="field-concernCategories" className="rounded-2xl border border-slate-200 bg-white p-5">
            <legend className="px-1 text-base font-semibold text-slate-900">What concerned you? {urgent && <span className="text-sm font-normal text-slate-500">(optional)</span>}</legend>
            <p className={hint}>Choose what you noticed. These are observations, not diagnoses.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {config.concernCategories.map((category) => (
                <label key={category.key} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50">
                  <input type="checkbox" checked={form.concernCategories.includes(category.key)} onChange={() => toggleCategory(category.key)} />
                  {category.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div id="field-observations">
              <label htmlFor="observations" className={label}>What did you observe? {urgent && <span className="font-normal text-slate-500">(optional)</span>}</label>
              <p className={hint}>{config.observationPrompt}</p>
              <textarea id="observations" className={`${input} mt-1 min-h-28`} maxLength={4000} value={form.observations || ""} onChange={(event) => set("observations", event.target.value)} />
            </div>
            <div>
              <label htmlFor="statements" className={label}>What did the student say, if anything? <span className="font-normal text-slate-500">(optional)</span></label>
              <textarea id="statements" className={`${input} mt-1 min-h-20`} maxLength={2000} value={form.reportedStatements || ""} onChange={(event) => set("reportedStatements", event.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="observed-at" className={label}>When did this happen?</label>
                <input id="observed-at" type="date" className={input} max={new Date().toISOString().slice(0, 10)} value={form.observedAt || ""} onChange={(event) => set("observedAt", event.target.value)} />
              </div>
              <div>
                <label htmlFor="frequency" className={label}>How often have you noticed it?</label>
                <select id="frequency" className={input} value={form.frequency} onChange={(event) => set("frequency", event.target.value)}>
                  <option value="ONCE">Once</option><option value="A_FEW_TIMES">A few times</option><option value="ONGOING">Ongoing</option><option value="UNKNOWN">Not sure</option>
                </select>
              </div>
              <div>
                <label htmlFor="relationship" className={label}>Your relationship to the student</label>
                <select id="relationship" className={input} value={form.relationship} onChange={(event) => set("relationship", event.target.value)}>
                  <option value="TEACHES_STUDENT">I teach them</option><option value="ACADEMIC_ADVISOR">Academic advisor</option><option value="SUPERVISOR">Project or research supervisor</option><option value="HALL_OR_RESIDENCE">Hall or residence</option><option value="SUPPORT_SERVICE">Student support service</option><option value="SECURITY">Security</option><option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="urgency" className={label}>How soon do you feel this needs attention?</label>
                <select id="urgency" className={input} value={form.reporterUrgency} onChange={(event) => set("reporterUrgency", event.target.value)}>
                  <option value="ROUTINE">When the team can</option><option value="SOON">Within a few days</option><option value="URGENT">As soon as possible</option>
                </select>
              </div>
              <fieldset>
                <legend className={label}>Have you spoken with the student about this?</legend>
                <div className="mt-1 flex gap-4 text-sm">
                  <label className="flex items-center gap-1.5"><input type="radio" name="spoken" checked={form.hasSpokenToStudent === true} onChange={() => set("hasSpokenToStudent", true)} /> Yes</label>
                  <label className="flex items-center gap-1.5"><input type="radio" name="spoken" checked={form.hasSpokenToStudent === false} onChange={() => set("hasSpokenToStudent", false)} /> No</label>
                </div>
              </fieldset>
              <div>
                <label htmlFor="aware" className={label}>Does the student know you are referring them?</label>
                <select id="aware" className={input} value={form.studentAwareOfReferral} onChange={(event) => set("studentAwareOfReferral", event.target.value)}>
                  <option value="YES">Yes</option><option value="NO">No</option><option value="UNSURE">Not sure</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="contact" className={label}>If the team needs to ask you something</label>
              <select id="contact" className={input} value={form.reporterContactPreference} onChange={(event) => set("reporterContactPreference", event.target.value)}>
                <option value="PORTAL_ONLY">Ask me here in the portal</option><option value="EMAIL">Email me</option><option value="PHONE">Phone me</option>
              </select>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-500">
            Your name is recorded with this referral and seen only by the professional support team. Referrals are confidential but not anonymous, and the team may need to act to keep someone safe.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={submitting} className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
              {submitting ? "Submitting…" : urgent ? "Send urgent report" : "Submit referral"}
            </button>
            <button type="button" onClick={() => setStep("SAFETY")} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back</button>
          </div>
        </form>
      )}
    </div>
  );
}
