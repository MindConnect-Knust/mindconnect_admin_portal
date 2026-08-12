import { useState, useEffect, useCallback } from "react";
import { Film, RefreshCcw, Play } from "lucide-react";
import { listContent } from "../../services/contentApi";
import EmptyState from "../../components/common/EmptyState";
import VideoPreviewModal from "../../components/content/VideoPreviewModal";
import ModerationActions from "../../components/content/ModerationActions";

// Reels = approved/published VIDEO items with short duration.
// We show all approved/published videos and let admin manage them.
const STATUS_TABS = [
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default function Reels() {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusTab, setStatusTab] = useState("approved");
  const [previewing, setPreviewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listContent({ type: "VIDEO", status: statusTab });
      // Filter to short-form eligible (≤ 3 minutes = 180 seconds) for Reels context.
      const reelsItems = result.items.filter((i) => !i.durationSeconds || i.durationSeconds <= 300);
      setItems(reelsItems);
      setCount(reelsItems.length);
    } catch (err) {
      setError(err.message || "Failed to load Reels content.");
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reels</h2>
          <p className="mt-1 text-sm text-slate-500">Short-form video content eligible for the Reels surface (≤5 min). All content has been approved.</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

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

      {loading && <div className="flex items-center justify-center h-40 text-sm text-slate-400"><RefreshCcw size={16} className="animate-spin mr-2" /> Loading…</div>}
      {!loading && error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p className="font-semibold">Failed to load Reels</p><p>{error}</p><button onClick={load} className="mt-2 text-xs underline">Retry</button></div>}
      {!loading && !error && items.length === 0 && <EmptyState icon={Film} title="No Reels content" description="No short-form videos match this status." />}
      {!loading && !error && items.length > 0 && (
        <>
          <p className="text-xs text-slate-400">{count} item{count !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="relative aspect-video bg-slate-100">
                  {item.thumbnailUrl
                    ? <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-slate-300"><Film size={32} /></div>
                  }
                  <button onClick={() => setPreviewing(item)} className="absolute inset-0 flex items-center justify-center bg-slate-900/30 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="rounded-full bg-white/90 p-3 shadow"><Play size={20} className="text-slate-800" /></span>
                  </button>
                  {item.durationSeconds > 0 && (
                    <span className="absolute bottom-2 right-2 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] text-white font-mono">
                      {Math.floor(item.durationSeconds / 60)}:{String(item.durationSeconds % 60).padStart(2, "0")}
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-sm font-semibold text-slate-900 line-clamp-2">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.sourceName}</p>
                  <ModerationActions item={item} onDone={load} compact />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <VideoPreviewModal item={previewing} onClose={() => setPreviewing(null)} />
    </div>
  );
}
