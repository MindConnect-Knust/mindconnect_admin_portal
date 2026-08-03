import { Check, X, Eye, Mail, Phone } from "lucide-react";
import Avatar from "../common/Avatar";
import { timeAgo } from "../../utils/formatters";

export default function ApplicationCard({ application, onView, onApprove, onReject }) {
  const subtitle =
    application.role === "peer_counsellor"
      ? `${application.program} · Year ${application.yearOfStudy}`
      : application.title;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <Avatar name={application.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{application.name}</p>
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Mail size={11} /> {application.email}
            </span>
            <span className="flex items-center gap-1">
              <Phone size={11} /> {application.phone}
            </span>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
          {timeAgo(application.submittedAt)}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-slate-600 leading-relaxed">{application.motivation}</p>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onApprove(application)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Check size={14} /> Approve
        </button>
        <button
          onClick={() => onReject(application)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
        >
          <X size={14} /> Reject
        </button>
        <button
          onClick={() => onView(application)}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          aria-label="View details"
        >
          <Eye size={14} />
        </button>
      </div>
    </div>
  );
}
