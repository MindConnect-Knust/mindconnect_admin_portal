import { Link } from "react-router-dom";
import { LifeBuoy } from "lucide-react";
import EmergencyServices from "./EmergencyServices";

export default function EmergencyGuidance() {
  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><LifeBuoy aria-hidden="true" /> Emergency guidance</h1>
      <section className="rounded-2xl border-2 border-slate-900 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">If a student may be in immediate danger</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-800">
          <li>Contact emergency services and KNUST security now, using the verified contacts below.</li>
          <li>Stay with the student if it is safe. Do not put yourself at risk.</li>
          <li>Remove obvious means of harm only if you can do so safely.</li>
          <li>Send a short urgent report so the support team is told at once.</li>
        </ol>
        <p className="mt-3 text-sm font-semibold text-slate-900">A report is not a substitute for contacting emergency help.</p>
        <Link to="/staff/refer" className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Send an urgent report</Link>
      </section>
      <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">Draft guidance pending KNUST Counselling Centre review.</p>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Verified contacts</h2>
        <EmergencyServices />
      </section>
    </div>
  );
}
