import { Check, X, Eye, Mail, Phone, AlertCircle } from "lucide-react";
import Avatar from "../common/Avatar";
import { timeAgo } from "../../utils/formatters";

export default function ApplicationCard({ application, onView, onApprove, onReject }) {
  const subtitle =
    application.role === "peer_listener"
      ? `${application.program} - Year ${application.yearOfStudy}`
      : application.title;
  const photoUrl = application.profileImage?.thumbnailUrl || application.profileImage?.secureUrl || "";
  const missing = application.profileReadiness?.missing || [];
  const ready = application.profileReadiness?.ready !== false;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <Avatar name={application.name} src={photoUrl} size="lg" />
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

      {!ready ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>Missing {missing.slice(0, 3).join(", ")}{missing.length > 3 ? "..." : ""}</span>
        </div>
      ) : null}

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{application.motivation}</p>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onApprove(application)}
          disabled={!ready}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          <Check size={14} /> Approve
        </button>
        <button
          onClick={() => onReject(application)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
        >
          <X size={14} /> Reject
        </button>
        <button
          onClick={() => onView(application)}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          aria-label="View details"
        >
          <Eye size={14} />
        </button>
      </div>
    </div>
  );
}