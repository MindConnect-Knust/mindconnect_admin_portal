import { useState } from "react";
import { CheckCircle, XCircle, Send, Archive, ShieldAlert, EyeOff } from "lucide-react";
import { moderateContentItem } from "../../services/contentApi";
import { useToast } from "../../context/ToastContext";

const ACTIONS = {
  APPROVE:            { label: "Approve",   icon: CheckCircle, tone: "emerald" },
  REJECT:             { label: "Reject",    icon: XCircle,     tone: "rose" },
  PUBLISH:            { label: "Publish",   icon: Send,        tone: "brand" },
  UNPUBLISH:          { label: "Unpublish", icon: EyeOff,      tone: "amber" },
  ARCHIVE:            { label: "Archive",   icon: Archive,     tone: "slate" },
  ADD_SAFETY_FLAG:    { label: "Add Flag",  icon: ShieldAlert, tone: "orange" },
};

const toneClasses = {
  emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
  rose:    "bg-rose-600 hover:bg-rose-700 text-white",
  brand:   "bg-brand-600 hover:bg-brand-700 text-white",
  amber:   "bg-amber-500 hover:bg-amber-600 text-white",
  slate:   "bg-slate-500 hover:bg-slate-600 text-white",
  orange:  "bg-orange-500 hover:bg-orange-600 text-white",
};

/**
 * ModerationActions
 *
 * Renders action buttons appropriate for the item's current moderationStatus.
 * All actions hit the real backend moderation endpoint and are audited.
 */
export default function ModerationActions({ item, onDone, compact = false }) {
  const { notify } = useToast();
  const [busy, setBusy] = useState(null);
  const [showReason, setShowReason] = useState(null);
  const [reason, setReason] = useState("");

  const status = item?.moderationStatus;
  const publishedAt = item?.publishedAt ? new Date(item.publishedAt).getTime() : 0;
  const isPublished = item?.isPublished === true ||
    (status === "approved" && publishedAt > 0 && publishedAt <= Date.now());

  const available = [];
  if (["discovered", "source_review", "pending"].includes(status)) {
    available.push("APPROVE", "REJECT");
  }
  if (status === "approved" && !isPublished) {
    available.push("PUBLISH", "REJECT");
  }
  if (isPublished) {
    available.push("UNPUBLISH", "REJECT");
  }
  if (status !== "archived") available.push("ARCHIVE");

  const doAction = async (action, value) => {
    try {
      setBusy(action);
      await moderateContentItem(item._id || item.id, { action, reason: reason.trim() || undefined, value });
      notify({ APPROVE: "Content approved.", REJECT: "Content rejected.", PUBLISH: "Content published.", UNPUBLISH: "Content unpublished.", ARCHIVE: "Content archived." }[action] || "Content updated.", "success");
      setShowReason(null);
      setReason("");
      onDone?.();
    } catch (err) {
      notify(err.message || "Action failed.", "error");
    } finally {
      setBusy(null);
    }
  };

  const handleClick = (action) => {
    if (["REJECT", "UNPUBLISH", "ARCHIVE", "ADD_SAFETY_FLAG"].includes(action)) {
      setShowReason(action);
    } else {
      doAction(action);
    }
  };

  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap gap-2 ${compact ? "" : ""}`}>
        {available.map((action) => {
          const cfg = ACTIONS[action];
          if (!cfg) return null;
          const Icon = cfg.icon;
          return (
            <button
              key={action}
              onClick={() => handleClick(action)}
              disabled={!!busy}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${toneClasses[cfg.tone]}`}
            >
              <Icon size={13} />
              {busy === action ? "…" : cfg.label}
            </button>
          );
        })}
      </div>

      {/* Reason input for destructive/reversible actions */}
      {showReason && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
          <p className="text-xs font-medium text-slate-700">
            {showReason === "REJECT" ? "Reason for rejection (required):" :
             showReason === "UNPUBLISH" ? "Reason for unpublishing (optional):" :
             showReason === "ARCHIVE" ? "Reason for archiving (optional):" :
             "Note (optional):"}
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Enter reason…"
            className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => doAction(showReason)}
              disabled={showReason === "REJECT" && !reason.trim()}
              className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              Confirm {ACTIONS[showReason]?.label}
            </button>
            <button
              onClick={() => { setShowReason(null); setReason(""); }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
