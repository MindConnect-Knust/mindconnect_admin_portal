import { FileText, Check, X } from "lucide-react";
import Modal from "../common/Modal";
import Avatar from "../common/Avatar";
import { formatDate, roleLabel } from "../../utils/formatters";

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value}</p>
    </div>
  );
}

export default function ApplicationDetailModal({ application, onClose, onApprove, onReject }) {
  if (!application) return null;
  const isPeer = application.role === "peer_counsellor";

  return (
    <Modal
      open={!!application}
      onClose={onClose}
      title="Application Details"
      size="lg"
      footer={
        <>
          <button
            onClick={() => onReject(application)}
            className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <X size={15} /> Reject
          </button>
          <button
            onClick={() => onApprove(application)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Check size={15} /> Approve
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar name={application.name} size="xl" />
          <div>
            <h3 className="text-lg font-bold text-slate-900">{application.name}</h3>
            <p className="text-sm text-slate-500">{isPeer ? application.program : application.title}</p>
            <span className="mt-1.5 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              {roleLabel(application.role)} Application
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
          <Field label="Email" value={application.email} />
          <Field label="Phone" value={application.phone} />
          <Field label="Submitted" value={formatDate(application.submittedAt)} />
          {isPeer ? (
            <>
              <Field label="Student ID" value={application.studentId} />
              <Field label="Year of Study" value={application.yearOfStudy} />
              <Field label="Training Program" value={application.trainingProgram} />
              <Field label="Training Completed" value={formatDate(application.trainingCompletionDate)} />
            </>
          ) : (
            <>
              <Field label="Department" value={application.department} />
              <Field label="Years of Experience" value={application.yearsExperience} />
              <Field label="License Number" value={application.licenseNumber} />
            </>
          )}
        </div>

        {!isPeer && application.qualifications?.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">Qualifications</p>
            <div className="flex flex-wrap gap-2">
              {application.qualifications.map((q) => (
                <span key={q} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}

        {isPeer && application.referees?.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">Referees</p>
            <ul className="space-y-1">
              {application.referees.map((r) => (
                <li key={r} className="text-sm text-slate-700">{r}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">Motivation Statement</p>
          <p className="text-sm text-slate-700 leading-relaxed rounded-xl border border-slate-100 p-4">{application.motivation}</p>
        </div>

        {application.documents?.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">Submitted Documents</p>
            <div className="space-y-2">
              {application.documents.map((doc) => (
                <div key={doc.name} className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
                  <FileText size={15} className="text-slate-400" />
                  {doc.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
