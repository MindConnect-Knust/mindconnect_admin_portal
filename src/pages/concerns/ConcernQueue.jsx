import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, RefreshCw, UserCheck } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { concernReviewApi } from "../../services/staffConcernApi";
import { subscribeToEvents } from "../../services/liveSocket";
import { QUEUE_LABELS, readable } from "../../services/scope3Format";

/**
 * Student Concerns: the professional queue for staff referrals.
 *
 * Rows carry who, when, broad categories, urgency and status. Nothing the
 * reporter wrote appears in a list; opening a concern is a separate, audited
 * request. The queue refreshes the moment the server signals a change.
 */
const VIEWS = ["NEW", "URGENT", "MINE", "ASSIGNED", "WAITING_FOR_INFORMATION", "CONNECTED", "CLOSED"];

function Priority({ value }) {
  if (value === "URGENT") {
    return <span className="inline-flex items-center gap-1 rounded-full border-2 border-rose-700 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-900"><AlertTriangle size={12} aria-hidden="true" /> Urgent</span>;
  }
  if (value === "SOON") return <span className="inline-flex items-center gap-1 rounded-full border border-amber-500 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900"><Clock size={12} aria-hidden="true" /> Soon</span>;
  return <span className="inline-flex items-center rounded-full border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-600">Routine</span>;
}

export default function ConcernQueue() {
  const { notify } = useToast();
  const [view, setView] = useState("NEW");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await concernReviewApi.queue(view));
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [view, notify]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeToEvents(["concerns:queue:changed"], () => load()), [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Student Concerns</h2>
          <p className="text-sm text-slate-500">Referrals from verified staff. Updates live.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" /> Refresh
        </button>
      </div>

      <div role="tablist" aria-label="Concern queues" className="flex flex-wrap gap-1 border-b border-slate-200">
        {VIEWS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={view === name}
            onClick={() => setView(name)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${view === name ? "border-emerald-600 text-emerald-800" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {QUEUE_LABELS[name]}
            {data?.counts?.[name] != null && name !== "CLOSED" && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 text-xs tabular-nums text-slate-700">{data.counts[name]}</span>}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{QUEUE_LABELS[view]} concerns</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">Submitted</th>
              <th scope="col" className="px-4 py-3">Student</th>
              <th scope="col" className="px-4 py-3">Reported by</th>
              <th scope="col" className="px-4 py-3">Concerns</th>
              <th scope="col" className="px-4 py-3">Priority</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data?.rows || []).map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {new Date(row.submittedAt).toLocaleString()}
                  {row.overdue && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-800"><Clock size={12} aria-hidden="true" /> Past review window</span>}
                </td>
                <td className="px-4 py-3">
                  <Link to={`/concerns/${row.id}`} className="font-semibold text-emerald-800 underline-offset-2 hover:underline">{row.studentDisplayName}</Link>
                  <p className="text-xs text-slate-500">{row.reference}{row.studentRef ? ` · ${row.studentRef}` : ""}{row.viewed ? "" : " · not yet opened"}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{readable(row.reporterRole)}</td>
                <td className="px-4 py-3 text-slate-700">{row.concernCategories.map(readable).join(", ")}</td>
                <td className="px-4 py-3"><Priority value={row.priority} /></td>
                <td className="px-4 py-3 text-slate-700">{readable(row.status)}</td>
                <td className="px-4 py-3 text-slate-700">{row.assignedTo ? <span className="inline-flex items-center gap-1"><UserCheck size={14} aria-hidden="true" /> {row.assignedTo.name}</span> : "Unassigned"}</td>
              </tr>
            ))}
            {!loading && (data?.rows || []).length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Nothing in this queue.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
