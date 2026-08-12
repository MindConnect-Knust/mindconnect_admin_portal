import { Check, X } from "lucide-react";
import Modal from "../common/Modal";
import Avatar from "../common/Avatar";
import { formatDate, roleLabel } from "../../utils/formatters";

function Field({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 text-sm text-slate-800">{String(value)}</p></div>;
}

export default function ApplicationDetailModal({ application, onClose, onApprove, onReject }) {
  if (!application) return null;
  const isPeer = application.role === "peer_listener";
  return (
    <Modal open title="Application Details" onClose={onClose} size="lg" footer={<><button onClick={() => onReject(application)} className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"><X size={15} /> Reject</button><button onClick={() => onApprove(application)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"><Check size={15} /> Approve</button></>}>
      <div className="space-y-6">
        <div className="flex items-center gap-4"><Avatar name={application.name} size="xl" /><div><h3 className="text-lg font-bold text-slate-900">{application.name}</h3><p className="text-sm text-slate-500">{isPeer ? application.program : application.title}</p><span className="mt-1.5 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{roleLabel(application.role)} Application</span></div></div>
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
          <Field label="Email" value={application.email} /><Field label="Phone" value={application.phone} /><Field label="Submitted" value={formatDate(application.submittedAt)} /><Field label="Profile completion" value={`${application.profileCompletion}%`} />
          {isPeer ? <><Field label="Student ID" value={application.studentId} /><Field label="Year of Study" value={application.yearOfStudy} /><Field label="Training declared" value={application.trainingCompleted ? "Yes" : "No"} /></> : <><Field label="Department" value={application.department} /><Field label="Organisation" value={application.organization} /><Field label="Years of Experience" value={application.yearsExperience} /><Field label="Registration Number" value={application.professionalRegistrationNumber} /><Field label="Specialties" value={application.specialties?.join(", ")} /></>}
          <Field label="Languages" value={application.languages?.join(", ")} /><Field label="Guidelines acknowledged" value={application.guidelinesAcknowledged ? "Yes" : "No"} />
        </div>
        {application.bio ? <div><p className="mb-2 text-xs font-medium uppercase text-slate-400">Bio</p><p className="rounded-xl border border-slate-100 p-4 text-sm text-slate-700">{application.bio}</p></div> : null}
        <div><p className="mb-2 text-xs font-medium uppercase text-slate-400">Motivation Statement</p><p className="rounded-xl border border-slate-100 p-4 text-sm text-slate-700">{application.motivation || "Not provided"}</p></div>
      </div>
    </Modal>
  );
}