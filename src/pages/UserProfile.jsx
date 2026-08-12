import { useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Calendar, Users, PauseCircle, PlayCircle, ShieldOff, MessageCircle, CalendarCheck, CheckCircle } from "lucide-react";
import { useData } from "../context/DataContext";
import Avatar from "../components/common/Avatar";
import StatusBadge from "../components/common/StatusBadge";
import Tabs from "../components/common/Tabs";
import EmptyState from "../components/common/EmptyState";
import { useUserLifecycle } from "../components/users/useUserLifecycle";
import { formatDate, formatDateTime, roleLabel } from "../utils/formatters";

function StatBlock({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
      <div className="flex items-center gap-1.5 text-slate-400"><Icon size={13} /><span className="text-xs font-medium">{label}</span></div>
      <p className="mt-1.5 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Detail({ label, value }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 text-sm text-slate-800">{value || "-"}</p></div>;
}

export default function UserProfile() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getUserById } = useData();
  const { setHoldTarget, setReactivateTarget, setDeleteTarget, dialogs } = useUserLifecycle();
  const [tab, setTab] = useState(location.state?.tab || "overview");
  const user = getUserById(id);

  if (!user) {
    return <EmptyState icon={Users} title="Profile not found" description="The provider is not present in the current server response." action={<Link to="/counsellors" className="text-sm font-semibold text-brand-600">Back to providers</Link>} />;
  }

  const isPeer = user.role === "peer_listener";
  const stats = user.stats || {};

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft size={15} /> Back</button>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={user.name} size="xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold text-slate-900">{user.name}</h2><StatusBadge status={user.status} /></div>
              <p className="mt-0.5 text-sm text-slate-500">{isPeer ? user.program : user.title}</p>
              <span className="mt-2 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{roleLabel(user.role)}</span>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Mail size={12} /> {user.email}</span>
                {user.phone ? <span className="flex items-center gap-1.5"><Phone size={12} /> {user.phone}</span> : null}
                <span className="flex items-center gap-1.5"><Calendar size={12} /> Submitted {formatDate(user.submittedAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.status === "active" ? <button onClick={() => setHoldTarget(user)} className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"><PauseCircle size={14} /> Suspend</button> : null}
            {user.status === "on_hold" ? <button onClick={() => setReactivateTarget(user)} className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><PlayCircle size={14} /> Reinstate</button> : null}
            {user.status !== "deactivated" ? <button onClick={() => setDeleteTarget(user)} className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white"><ShieldOff size={14} /> Revoke access</button> : null}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {isPeer ? (
            <>
              <StatBlock icon={MessageCircle} label="Conversations" value={stats.totalConversations || 0} />
              <StatBlock icon={MessageCircle} label="Open Threads" value={stats.activeConversations || 0} />
            </>
          ) : (
            <>
              <StatBlock icon={CalendarCheck} label="Appointments" value={stats.totalAppointments || 0} />
              <StatBlock icon={CheckCircle} label="Completed" value={stats.completedAppointments || 0} />
              <StatBlock icon={Users} label="Students Seen" value={stats.studentsSeen || 0} />
              <StatBlock icon={Calendar} label="Available Slots" value={stats.availableSlots || 0} />
            </>
          )}
        </div>
      </div>

      <Tabs tabs={[{ value: "overview", label: "Overview" }, { value: "history", label: "Governance History", count: user.adminNotes?.length }]} active={tab} onChange={setTab} />

      {tab === "overview" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Submitted profile</h3>
            <Detail label="Bio" value={user.bio} />
            <Detail label="Languages" value={user.languages?.join(", ")} />
            <Detail label="Motivation" value={user.motivation} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm grid grid-cols-2 gap-4">
            {isPeer ? <><Detail label="Student ID" value={user.studentId} /><Detail label="Program" value={user.program} /><Detail label="Year of Study" value={user.yearOfStudy} /><Detail label="Training declared" value={user.trainingCompleted ? "Yes" : "No"} /></> : <><Detail label="Department" value={user.department} /><Detail label="Organisation" value={user.organization} /><Detail label="Years of Experience" value={user.yearsExperience} /><Detail label="Registration Number" value={user.professionalRegistrationNumber} /><Detail label="Specialties" value={user.specialties?.join(", ")} /></>}
            <Detail label="Guidelines acknowledged" value={user.guidelinesAcknowledged ? "Yes" : "No"} />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {user.adminNotes?.length ? <ul className="divide-y divide-slate-50">{[...user.adminNotes].reverse().map((note) => <li key={note.id} className="px-5 py-3.5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase text-brand-600">{note.action.replaceAll("_", " ")}</span><span className="text-xs text-slate-400">{formatDateTime(note.date)}</span></div>{note.note ? <p className="mt-1 text-sm text-slate-600">{note.note}</p> : null}<p className="mt-1 text-xs text-slate-400">by {note.admin}</p></li>)}</ul> : <div className="p-5"><EmptyState icon={Calendar} title="No governance history" description="Status decisions will appear here." /></div>}
        </div>
      )}
      {dialogs}
    </div>
  );
}