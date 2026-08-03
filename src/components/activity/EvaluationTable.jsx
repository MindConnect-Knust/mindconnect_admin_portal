import { Star, MessageSquareQuote } from "lucide-react";
import EmptyState from "../common/EmptyState";
import { formatDate } from "../../utils/formatters";

function RatingStars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
        />
      ))}
    </div>
  );
}

export default function EvaluationTable({ evaluations }) {
  if (evaluations.length === 0) {
    return <EmptyState icon={MessageSquareQuote} title="No evaluations yet" description="Student feedback will appear here once sessions are logged." />;
  }

  return (
    <ul className="space-y-3">
      {evaluations.map((ev) => (
        <li key={ev.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium text-slate-800">{ev.studentAlias}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{ev.sessionType}</span>
            </div>
            <div className="flex items-center gap-3">
              <RatingStars rating={ev.rating} />
              <span className="text-xs text-slate-400">{formatDate(ev.date)}</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">"{ev.comment}"</p>
        </li>
      ))}
    </ul>
  );
}
