import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

const TONE_STYLES = {
  danger: "bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-600",
  warning: "bg-amber-600 hover:bg-amber-700 focus-visible:outline-amber-600",
  default: "bg-brand-600 hover:bg-brand-700 focus-visible:outline-brand-600",
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "default",
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "Explain why this action is being taken…",
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setSubmitting(false);
      setTouched(false);
    }
  }, [open]);

  const reasonInvalid = requireReason && touched && !reason.trim();

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      setTouched(true);
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${TONE_STYLES[tone]}`}
          >
            {submitting ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        {tone !== "default" && (
          <div className={`shrink-0 rounded-full p-2 h-fit ${tone === "danger" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}>
            <AlertTriangle size={18} />
          </div>
        )}
        <div className="flex-1 space-y-4">
          {description && <p className="text-sm text-slate-600 leading-relaxed">{description}</p>}
          {requireReason && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{reasonLabel}</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onBlur={() => setTouched(true)}
                rows={3}
                placeholder={reasonPlaceholder}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${reasonInvalid ? "border-rose-400" : "border-slate-300"}`}
              />
              {reasonInvalid && <p className="mt-1 text-xs text-rose-600">A reason is required for this action.</p>}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
