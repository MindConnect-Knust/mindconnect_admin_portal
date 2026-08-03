import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import Avatar from "../common/Avatar";
import EmptyState from "../common/EmptyState";
import { timeAgo, roleLabel } from "../../utils/formatters";

export default function PendingApprovalsWidget({ applications }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-800">Pending Approvals</h3>
        <Link to="/approvals" className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
          View all <ArrowRight size={13} />
        </Link>
      </div>
      {applications.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={ClipboardCheck} title="All caught up" description="There are no pending applications right now." />
        </div>
      ) : (
        <ul className="divide-y divide-slate-50">
          {applications.slice(0, 5).map((app) => (
            <li key={app.id}>
              <Link to="/approvals" className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <Avatar name={app.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{app.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {roleLabel(app.role)} application · {timeAgo(app.submittedAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">Pending</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
