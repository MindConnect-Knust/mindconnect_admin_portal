import { useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Star,
  Clock,
  Users,
  FileText,
  PauseCircle,
  PlayCircle,
  Ban,
  Trash2,
} from "lucide-react";
import { useData } from "../context/DataContext";
import Avatar from "../components/common/Avatar";
import StatusBadge from "../components/common/StatusBadge";
import Tabs from "../components/common/Tabs";
import EmptyState from "../components/common/EmptyState";
import ActivityChart from "../components/activity/ActivityChart";
import EvaluationTable from "../components/activity/EvaluationTable";
import { useUserLifecycle } from "../components/users/useUserLifecycle";
import { formatDate, formatDateTime, roleLabel } from "../utils/formatters";

function StatBlock({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon size={13} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1.5 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getUserById } = useData();
  const { setHoldTarget, setReactivateTarget, setDeactivateTarget, setDeleteTarget, dialogs } = useUserLifecycle();
  const [tab, setTab] = useState(location.state?.tab || "overview");

  const user = getUserById(id);

  if (!user) {
    return (
      <EmptyState
        icon={Users}
        title="Profile not found"
        description="This user may have been deleted or the link is no longer valid."
        action={
          <Link to="/counsellors" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Back to Counsellors
          </Link>
        }
      />
    );
  }

  const isPeer = user.role === "peer_listener";
  const stats = user.stats || {};

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={user.name} size="xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                <StatusBadge status={user.status} />
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {isPeer ? `${user.program} · Year ${user.yearOfStudy}` : user.title}
              </p>
              <span className="mt-2 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {roleLabel(user.role)}
              </span>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Mail size={12} /> {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={12} /> {user.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} /> Joined {formatDate(user.joinedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {user.status !== "on_hold" && user.status !== "deactivated" && (
              <button
                onClick={() => setHoldTarget(user)}
                className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <PauseCircle size={14} /> Put on Hold
              </button>
            )}
            {user.status === "on_hold" && (
              <button
                onClick={() => setReactivateTarget(user)}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <PlayCircle size={14} /> Reactivate
              </button>
            )}
            {user.status !== "deactivated" && (
              <button
                onClick={() => setDeactivateTarget(user)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <Ban size={14} /> Deactivate
              </button>
            )}
            <button
              onClick={() => setDeleteTarget(user)}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatBlock icon={Users} label="Students Seen" value={stats.studentsSeen ?? 0} />
          <StatBlock icon={Calendar} label="Sessions (mo.)" value={stats.sessionsThisMonth ?? 0} />
          <StatBlock icon={Calendar} label="Total Sessions" value={stats.totalSessions ?? 0} />
          <StatBlock icon={Star} label="Avg. Rating" value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"} />
          <StatBlock icon={Clock} label="Avg. Response" value={stats.avgResponseTimeHrs ? `${stats.avgResponseTimeHrs}h` : "—"} />
        </div>
      </div>

      <Tabs
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "activity", label: "Activity & Sessions", count: user.activityLog?.length },
          { value: "evaluations", label: "Evaluations & Feedback", count: user.evaluations?.length },
          { value: "documents", label: "Documents & Credentials" },
          { value: "notes", label: "Admin Notes & History", count: user.adminNotes?.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Sessions & Satisfaction Trend</h3>
            {user.ratingTrend?.length > 0 ? (
              <ActivityChart data={user.ratingTrend} />
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">Not enough activity yet to show a trend.</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Details</h3>
            {isPeer ? (
              <>
                <Detail label="Student ID" value={user.studentId} />
                <Detail label="Program" value={user.program} />
                <Detail label="Year of Study" value={user.yearOfStudy} />
                <Detail label="Training Cohort" value={user.trainingCohort} />
                <Detail label="Supervisor" value={user.supervisor} />
              </>
            ) : (
              <>
                <Detail label="Department" value={user.department} />
                <Detail label="Years of Experience" value={user.yearsExperience} />
                <Detail label="License Number" value={user.licenseNumber} />
                <Detail label="Specialties" value={user.specialties?.join(", ") || "—"} />
              </>
            )}
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {user.activityLog?.length ? (
            <ul className="divide-y divide-slate-50">
              {user.activityLog.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm text-slate-700">{entry.action}</p>
                    {entry.details && <p className="mt-0.5 text-xs text-slate-400">{entry.details}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{formatDateTime(entry.date)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState icon={Calendar} title="No activity logged" description="Session and account activity will appear here." />
            </div>
          )}
        </div>
      )}

      {tab === "evaluations" && <EvaluationTable evaluations={user.evaluations || []} />}

      {tab === "documents" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {user.documents?.length ? (
            <div className="space-y-2">
              {user.documents.map((doc) => (
                <div key={doc.name} className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-600">
                  <FileText size={16} className="text-slate-400" />
                  {doc.name}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="No documents on file" description="Credentials submitted during application will appear here." />
          )}
        </div>
      )}

      {tab === "notes" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {user.adminNotes?.length ? (
            <ul className="divide-y divide-slate-50">
              {[...user.adminNotes].reverse().map((note) => (
                <li key={note.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{note.action.replace("_", " ")}</span>
                    <span className="text-xs text-slate-400">{formatDateTime(note.date)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">{note.note}</p>
                  <p className="mt-1 text-xs text-slate-400">by {note.admin}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState icon={FileText} title="No admin notes" description="Notes from approvals and status changes will appear here." />
            </div>
          )}
        </div>
      )}

      {dialogs}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value || "—"}</p>
    </div>
  );
}
