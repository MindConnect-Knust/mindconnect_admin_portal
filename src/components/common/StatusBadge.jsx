const STYLES = {
  active: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-amber-100 text-amber-700",
  deactivated: "bg-rose-100 text-rose-700",
  pending: "bg-sky-100 text-sky-700",
};

const LABELS = {
  active: "Active",
  on_hold: "On Hold",
  deactivated: "Deactivated",
  pending: "Pending",
};

export default function StatusBadge({ status, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status] || "bg-slate-100 text-slate-600"} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {LABELS[status] || status}
    </span>
  );
}
