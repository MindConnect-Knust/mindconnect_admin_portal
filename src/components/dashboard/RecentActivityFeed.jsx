import { History } from "lucide-react";
import EmptyState from "../common/EmptyState";
import { timeAgo } from "../../utils/formatters";

const ACTION_STYLES = {
  "Approved application": "bg-emerald-50 text-emerald-600",
  "Rejected application": "bg-slate-100 text-slate-500",
  "Put on hold": "bg-amber-50 text-amber-600",
  Reactivated: "bg-emerald-50 text-emerald-600",
  Deactivated: "bg-rose-50 text-rose-600",
  "Deleted profile": "bg-rose-50 text-rose-600",
};

export default function RecentActivityFeed({ entries }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-800">Recent Admin Activity</h3>
      </div>
      {entries.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={History} title="No activity yet" description="Actions you take will show up here." />
        </div>
      ) : (
        <ul className="divide-y divide-slate-50">
          {entries.slice(0, 6).map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 px-5 py-3">
              <span className={`mt-0.5 rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${ACTION_STYLES[entry.action] || "bg-slate-100 text-slate-500"}`}>
                {entry.action}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-700">
                  <span className="font-medium">{entry.targetName}</span>
                </p>
                {entry.reason && <p className="mt-0.5 truncate text-xs text-slate-400">{entry.reason}</p>}
              </div>
              <span className="shrink-0 text-xs text-slate-400">{timeAgo(entry.timestamp)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
