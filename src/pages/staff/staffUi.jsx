import { AlertCircle, CheckCircle2, Clock, Info } from "lucide-react";
import { REPORTER_STATUS_TONE } from "../../services/scope3Format";

const TONES = {
  neutral: { icon: Clock, className: "border-slate-300 bg-slate-50 text-slate-700" },
  info: { icon: Info, className: "border-sky-300 bg-sky-50 text-sky-800" },
  attention: { icon: AlertCircle, className: "border-amber-400 bg-amber-50 text-amber-900" },
  done: { icon: CheckCircle2, className: "border-emerald-300 bg-emerald-50 text-emerald-800" },
};

/** A status is always an icon plus words, never colour alone. */
export function StatusBadge({ status, label }) {
  const tone = TONES[REPORTER_STATUS_TONE[status] || "neutral"];
  const Icon = tone.icon;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone.className}`}>
      <Icon size={12} aria-hidden="true" />
      {label || status}
    </span>
  );
}

/** Lists every problem at the top of a form, linked to its field. */
export function ErrorSummary({ errors }) {
  if (!errors?.length) return null;
  return (
    <div role="alert" aria-labelledby="error-summary-title" tabIndex={-1} className="rounded-xl border-2 border-rose-600 bg-rose-50 p-4">
      <h2 id="error-summary-title" className="text-sm font-bold text-rose-900">Please check the following</h2>
      <ul className="mt-2 list-disc pl-5 text-sm text-rose-900">
        {errors.map((error) => (
          <li key={error.field}><a href={`#field-${error.field}`} className="underline">{error.message}</a></li>
        ))}
      </ul>
    </div>
  );
}
