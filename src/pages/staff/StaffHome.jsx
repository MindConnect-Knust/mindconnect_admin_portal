import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FileText, HeartHandshake, LifeBuoy } from "lucide-react";
import { staffConcernApi } from "../../services/staffConcernApi";
import { StatusBadge } from "./staffUi";

export default function StaffHome() {
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    staffConcernApi.mine().then((rows) => setRecent(rows.slice(0, 3))).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold text-slate-900">Concerned about a student?</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          You do not need to be sure, and you do not need to make a diagnosis. Tell the support team what you noticed and they will take it from there.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/staff/refer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
            <HeartHandshake size={18} aria-hidden="true" /> I&apos;m concerned about a student
          </Link>
          <Link to="/staff/emergency" className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-800 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
            <LifeBuoy size={18} aria-hidden="true" /> Someone may be in danger now
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><FileText size={16} aria-hidden="true" /> My recent referrals</h2>
            <Link to="/staff/referrals" className="text-sm font-medium text-emerald-700 hover:underline">View all</Link>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
          {!error && recent.length === 0 && <p className="mt-3 text-sm text-slate-500">You have not made any referrals.</p>}
          <ul className="mt-3 divide-y divide-slate-100">
            {recent.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{row.studentDisplayName}</p>
                  <p className="text-xs text-slate-500">{row.reference} · {new Date(row.submittedAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={row.status} label={row.statusLabel} />
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><BookOpen size={16} aria-hidden="true" /> Your role</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
            <li>Notice, and describe what you saw or heard.</li>
            <li>Connect the student with help. You are not expected to be their counsellor.</li>
            <li>Keep it private. Do not discuss the student in group chats or email chains.</li>
          </ul>
          <Link to="/staff/guidance" className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline">Read the guidance</Link>
        </section>
      </div>
    </div>
  );
}
