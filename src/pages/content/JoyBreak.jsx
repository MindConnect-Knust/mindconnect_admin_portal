import { useState, useEffect, useCallback } from "react";
import { Laugh, RefreshCcw, Play, AlertTriangle, Info } from "lucide-react";
import { listContent } from "../../services/contentApi";
import EmptyState from "../../components/common/EmptyState";
import VideoPreviewModal from "../../components/content/VideoPreviewModal";
import ModerationActions from "../../components/content/ModerationActions";

const STATUS_TABS = [
  { value: "", label: "All Clips" },
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "flagged", label: "Safety Flagged" },
];

const statusChip = (s) => {
  const chips = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    published: "bg-brand-100 text-brand-700",
    rejected: "bg-rose-100 text-rose-700",
    archived: "bg-slate-200 text-slate-500",
  };
  return `inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chips[s] || "bg-slate-100 text-slate-500"}`;
};

const HUMOR_FLAGS = [
  "HUMOR_SELF_HARM_JOKE",
  "HUMOR_MENTAL_HEALTH_RIDICULE",
  "HUMOR_BULLYING",
  "HUMOR_HUMILIATION",
  "HUMOR_BODY_SHAMING",
  "HUMOR_ETHNIC_DEGRADATION",
  "HUMOR_DISTRESS_PRANK",
  "HUMOR_GRIEF_RIDICULE",
  "HUMOR_DANGEROUS_INJURY",
  "HUMOR_SEXUAL_CONTENT",
  "HUMOR_HATE_CONTENT",
];

function JoyClipCard({ item, onPreview, onDone, sources }) {
  const humorFlags = (item.contentSafetyFlags || []).filter((f) => HUMOR_FLAGS.includes(f));
  const otherFlags = (item.contentSafetyFlags || []).filter((f) => !HUMOR_FLAGS.includes(f));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="relative aspect-video bg-slate-100">
        {item.thumbnailUrl
          ? <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-slate-300"><Laugh size={32} /></div>
        }
        <button
          onClick={() => onPreview(item)}
          className="absolute inset-0 flex items-center justify-center bg-slate-900/30 opacity-0 hover:opacity-100 transition-opacity"
          aria-label={`Watch ${item.title}`}
        >
          <span className="rounded-full bg-white/90 p-3 shadow"><Play size={20} className="text-slate-800" /></span>
        </button>
        <span className={`absolute top-2 left-2 ${statusChip(item.moderationStatus)}`}>
          {item.moderationStatus}
        </span>
        {item.durationSeconds > 0 && (
          <span className="absolute bottom-2 right-2 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] text-white font-mono">
            {Math.floor(item.durationSeconds / 60)}:{String(item.durationSeconds % 60).padStart(2, "0")}
          </span>
        )}
      </div>

      <div className="p-3 space-y-2">
        <p className="text-sm font-semibold text-slate-900 line-clamp-2">{item.title}</p>
        <p className="text-xs text-slate-500">{item.sourceName}</p>

        {/* Humor-specific safety flags */}
        {humorFlags.length > 0 && (
          <div className="rounded border border-rose-200 bg-rose-50 px-2 py-1.5">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle size={11} className="text-rose-600" />
              <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wide">Humor safety flags</p>
            </div>
            <p className="text-[10px] text-rose-700">{humorFlags.map((f) => f.replace("HUMOR_", "").replaceAll("_", " ").toLowerCase()).join(", ")}</p>
          </div>
        )}

        {otherFlags.length > 0 && (
          <div className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5">
            <p className="text-[10px] text-amber-700">{otherFlags.join(", ")}</p>
          </div>
        )}

        {/* Mandatory watch reminder */}
        <button
          onClick={() => onPreview(item)}
          className="w-full rounded-lg border border-slate-200 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
        >
          <Play size={12} /> Watch full clip before deciding
        </button>

        <ModerationActions item={item} onDone={onDone} compact />
      </div>
    </div>
  );
}

export default function JoyBreak() {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusTab, setStatusTab] = useState("pending");
  const [sourceFilter, setSourceFilter] = useState("");
  const [previewing, setPreviewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listContent({
        joy: true,
        status: statusTab || undefined,
        source: sourceFilter || undefined,
      });
      setItems(result.items);
      setCount(result.count);
      // Extract unique sources from the returned items for the filter dropdown.
      setSources([...new Set(result.items.map((i) => i.sourceName).filter(Boolean))].sort());
    } catch (err) {
      setError(err.message || "Failed to load Joy Break clips.");
    } finally {
      setLoading(false);
    }
  }, [statusTab, sourceFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Joy Break Moderation</h2>
          <p className="mt-1 text-sm text-slate-500">Review comedy and positive-distraction clips clip-by-clip. Every clip requires individual human review.</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      {/* Policy notice */}
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 flex items-start gap-2.5">
        <Info size={15} className="text-sky-600 shrink-0 mt-0.5" />
        <p className="text-xs text-sky-800">
          <strong>No bulk approval.</strong> Each clip must be watched and individually reviewed regardless of channel trust level. Source trust does not equal clip safety.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusTab(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusTab === tab.value
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {sources.length > 0 && (
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none"
          >
            <option value="">All sources</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-sm text-slate-400">
          <RefreshCcw size={16} className="animate-spin mr-2" /> Loading Joy Break clips…
        </div>
      )}
      {!loading && error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Failed to load clips</p>
          <p>{error}</p>
          <button onClick={load} className="mt-2 text-xs underline">Retry</button>
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <EmptyState icon={Laugh} title="No Joy Break clips" description="No clips match the current filter." />
      )}
      {!loading && !error && items.length > 0 && (
        <>
          <p className="text-xs text-slate-400">{count} clip{count !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <JoyClipCard key={item._id} item={item} onPreview={setPreviewing} onDone={load} sources={sources} />
            ))}
          </div>
        </>
      )}

      <VideoPreviewModal item={previewing} onClose={() => setPreviewing(null)} />
    </div>
  );
}
