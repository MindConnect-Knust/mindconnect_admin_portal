import { useState, useEffect, useCallback } from "react";
import { MonitorPlay, RefreshCcw, Play, AlertTriangle } from "lucide-react";
import { listContent } from "../../services/contentApi";
import EmptyState from "../../components/common/EmptyState";
import VideoPreviewModal from "../../components/content/VideoPreviewModal";
import ModerationActions from "../../components/content/ModerationActions";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "review", label: "Awaiting Review" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "flagged", label: "Flagged" },
  { value: "archived", label: "Archived" },
];

const statusChip = (s) => {
  const chips = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    published: "bg-brand-100 text-brand-700",
    rejected: "bg-rose-100 text-rose-700",
    archived: "bg-slate-200 text-slate-500",
    source_review: "bg-orange-100 text-orange-700",
  };
  return `inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chips[s] || "bg-slate-100 text-slate-500"}`;
};

function VideoCard({ item, onPreview, onDone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-100">
        {item.thumbnailUrl
          ? <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-slate-300"><MonitorPlay size={32} /></div>
        }
        <button
          onClick={() => onPreview(item)}
          className="absolute inset-0 flex items-center justify-center bg-slate-900/30 opacity-0 hover:opacity-100 transition-opacity"
          aria-label={`Preview ${item.title}`}
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
        <p className="text-xs text-slate-500">{item.sourceName} · {item.provider?.toUpperCase()}</p>

        {/* Safety flags */}
        {item.contentSafetyFlags?.length > 0 && (
          <div className="flex items-start gap-1.5 rounded bg-amber-50 border border-amber-200 px-2 py-1.5">
            <AlertTriangle size={12} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700">{item.contentSafetyFlags.slice(0, 3).join(", ")}{item.contentSafetyFlags.length > 3 ? ` +${item.contentSafetyFlags.length - 3} more` : ""}</p>
          </div>
        )}

        <button
          onClick={() => onPreview(item)}
          className="w-full rounded-lg border border-slate-200 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Watch before deciding
        </button>

        <ModerationActions item={item} onDone={onDone} compact />
      </div>
    </div>
  );
}

export default function VideoModeration() {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusTab, setStatusTab] = useState("review");
  const [previewing, setPreviewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listContent({ type: "VIDEO", status: statusTab || undefined });
      setItems(result.items);
      setCount(result.count);
    } catch (err) {
      setError(err.message || "Failed to load videos.");
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Video Moderation</h2>
          <p className="mt-1 text-sm text-slate-500">Review and approve video content before students see it. Watch every clip before deciding.</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap border-b border-slate-100 pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusTab(tab.value)}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              statusTab === tab.value
                ? "border-b-2 border-brand-600 text-brand-700 bg-brand-50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-sm text-slate-400">
          <RefreshCcw size={16} className="animate-spin mr-2" /> Loading videos…
        </div>
      )}
      {!loading && error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Failed to load videos</p>
          <p>{error}</p>
          <button onClick={load} className="mt-2 text-xs underline">Retry</button>
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <EmptyState icon={MonitorPlay} title={`No ${statusTab || "video"} items`} description="No videos match this filter right now." />
      )}
      {!loading && !error && items.length > 0 && (
        <>
          <p className="text-xs text-slate-400">{count} video{count !== 1 ? "s" : ""} found</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <VideoCard key={item._id} item={item} onPreview={setPreviewing} onDone={load} />
            ))}
          </div>
        </>
      )}

      <VideoPreviewModal item={previewing} onClose={() => setPreviewing(null)} />
    </div>
  );
}
