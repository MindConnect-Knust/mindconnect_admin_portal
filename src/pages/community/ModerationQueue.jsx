import { useState, useEffect, useCallback } from "react";
import { ListChecks, RefreshCcw } from "lucide-react";
import { listContent } from "../../services/contentApi";
import EmptyState from "../../components/common/EmptyState";
import VideoPreviewModal from "../../components/content/VideoPreviewModal";
import ModerationActions from "../../components/content/ModerationActions";

/**
 * Moderation Queue — flagged content requiring admin attention.
 * Shows items with safety flags or in source_review status.
 */
export default function ModerationQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewing, setPreviewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // Load items in source_review or pending with safety flags.
      const [sourceReview, pending] = await Promise.all([
        listContent({ status: "source_review" }),
        listContent({ status: "pending" }),
      ]);
      const flaggedPending = pending.items.filter((i) => (i.contentSafetyFlags || []).length > 0);
      const combined = [...sourceReview.items, ...flaggedPending].sort(
        (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      );
      setItems(combined);
    } catch (err) { setError(err.message || "Failed to load moderation queue."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Moderation Queue</h2>
          <p className="mt-1 text-sm text-slate-500">Content in source review or flagged with safety issues.</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      {loading && <div className="flex items-center justify-center h-40 text-sm text-slate-400"><RefreshCcw size={16} className="animate-spin mr-2" /> Loading…</div>}
      {!loading && error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p className="font-semibold">Failed to load</p><p>{error}</p><button onClick={load} className="mt-2 text-xs underline">Retry</button></div>}
      {!loading && !error && items.length === 0 && <EmptyState icon={ListChecks} title="Moderation queue clear" description="No items require immediate attention." />}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4 space-y-2">
              <div className="flex items-start gap-3">
                {item.thumbnailUrl && (
                  <img src={item.thumbnailUrl} alt="" className="h-14 w-20 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.type} · {item.sourceName} · {item.moderationStatus}</p>
                  {(item.contentSafetyFlags || []).length > 0 && (
                    <p className="text-xs text-rose-600 mt-1">⚠ Flags: {item.contentSafetyFlags.join(", ")}</p>
                  )}
                </div>
                {item.type === "VIDEO" && (
                  <button onClick={() => setPreviewing(item)} className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-white">
                    Preview
                  </button>
                )}
              </div>
              <ModerationActions item={item} onDone={load} compact />
            </div>
          ))}
        </div>
      )}

      <VideoPreviewModal item={previewing} onClose={() => setPreviewing(null)} />
    </div>
  );
}
