import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Play,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";
import { listContent } from "../../services/contentApi";
import EmptyState from "../../components/common/EmptyState";
import VideoPreviewModal from "../../components/content/VideoPreviewModal";
import DirectVideoIngestModal from "../../components/content/DirectVideoIngestModal";
import ModerationActions from "../../components/content/ModerationActions";
import { useToast } from "../../context/ToastContext";
import { contentDisplayStatus } from "../../services/videoPreview";

const STATUS_OPTS = ["", "draft", "pending", "approved", "rejected", "archived", "source_review", "published", "flagged"];
const TYPE_OPTS = ["", "VIDEO", "ARTICLE", "KNUST_NEWS", "ANNOUNCEMENT", "EVENT", "RESOURCE_LINK", "AUDIO", "PODCAST", "INFOGRAPHIC"];

const statusChip = (status) => {
  const chips = {
    draft: "bg-slate-100 text-slate-600",
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    published: "bg-brand-100 text-brand-700",
    rejected: "bg-rose-100 text-rose-700",
    archived: "bg-slate-200 text-slate-500",
    source_review: "bg-orange-100 text-orange-700",
    discovered: "bg-sky-100 text-sky-700",
  };
  return "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase " +
    (chips[status] || "bg-slate-100 text-slate-500");
};

export default function ContentLibrary() {
  const { notify } = useToast();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [previewing, setPreviewing] = useState(null);
  const [showAddVideo, setShowAddVideo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listContent({
        status: status || undefined,
        type: type || undefined,
        page,
        limit: 40,
      });
      setItems(result.items);
      setCount(result.count);
      setPages(result.pages || Math.max(Math.ceil(result.count / 40), 1));
      setOptions(result.options);
    } catch (loadError) {
      setError(loadError.message || "Failed to load content.");
    } finally {
      setLoading(false);
    }
  }, [status, type, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [status, type]);

  const filtered = search.trim()
    ? items.filter((item) =>
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.sourceName?.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const videoAdded = (result) => {
    if (result.duplicate) {
      notify("That video already exists in the content library.", "info");
      return;
    }
    notify("Video added to pending review.", "success");
    setPage(1);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Content Library</h2>
          <p className="mt-1 text-sm text-slate-500">{count} content items</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
          >
            <RefreshCcw size={13} /> Refresh
          </button>
          <button
            onClick={() => setShowAddVideo(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
          >
            <Plus size={14} /> Add Video
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2">
          <Search size={14} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title or source"
            className="w-48 text-sm outline-none"
          />
        </label>
        <label className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2">
          <Filter size={14} className="text-slate-400" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="bg-transparent text-sm outline-none">
            <option value="">All statuses</option>
            {STATUS_OPTS.filter(Boolean).map((value) => (
              <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2">
          <Filter size={14} className="text-slate-400" />
          <select value={type} onChange={(event) => setType(event.target.value)} className="bg-transparent text-sm outline-none">
            <option value="">All types</option>
            {TYPE_OPTS.filter(Boolean).map((value) => (
              <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">
          <RefreshCcw size={16} className="mr-2 animate-spin" /> Loading
        </div>
      )}
      {!loading && error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Failed to load content</p>
          <p>{error}</p>
          <button onClick={load} className="mt-2 text-xs underline">Retry</button>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState icon={Layers} title="No content items found" description="Adjust the filters or add a video." />
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="py-2.5 pl-4 pr-2 text-left text-xs font-semibold text-slate-500">Title</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-slate-500">Type</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-slate-500">Source</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-slate-500">Status</th>
                <th className="py-2.5 pl-2 pr-4 text-left text-xs font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const displayStatus = contentDisplayStatus(item);
                return (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="py-3 pl-4 pr-2 font-medium text-slate-900">
                      <div className="flex max-w-sm items-center gap-2">
                        {item.type === "VIDEO" ? (
                          <button
                            onClick={() => setPreviewing(item)}
                            className="group relative h-11 w-16 shrink-0 overflow-hidden rounded bg-slate-900"
                            aria-label={"Preview " + item.title}
                          >
                            {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
                            <span className="absolute inset-0 flex items-center justify-center bg-slate-900/25 group-hover:bg-slate-900/45">
                              <Play size={15} className="text-white" fill="currentColor" />
                            </span>
                          </button>
                        ) : item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt="" className="h-11 w-16 shrink-0 rounded object-cover" />
                        ) : null}
                        <span className="line-clamp-2 text-xs">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-500">{item.type}</td>
                    <td className="max-w-[150px] truncate px-2 py-3 text-xs text-slate-500">{item.sourceName}</td>
                    <td className="px-2 py-3">
                      <span className={statusChip(displayStatus)}>{displayStatus}</span>
                    </td>
                    <td className="py-3 pl-2 pr-4">
                      <div className="flex flex-wrap gap-1.5">
                        {item.type === "VIDEO" && (
                          <button
                            onClick={() => setPreviewing(item)}
                            className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
                          >
                            Preview
                          </button>
                        )}
                        <ModerationActions item={item} onDone={load} compact />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={page <= 1}
            className="rounded-md border border-slate-200 p-2 text-slate-600 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs text-slate-500">Page {page} of {pages}</span>
          <button
            onClick={() => setPage((current) => Math.min(current + 1, pages))}
            disabled={page >= pages}
            className="rounded-md border border-slate-200 p-2 text-slate-600 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      <VideoPreviewModal item={previewing} onClose={() => setPreviewing(null)} />
      {showAddVideo && (
        <DirectVideoIngestModal
          options={options}
          onAdded={videoAdded}
          onClose={() => setShowAddVideo(false)}
        />
      )}
    </div>
  );
}