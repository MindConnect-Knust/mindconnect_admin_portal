import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  EyeOff,
  Film,
  Play,
  RefreshCw,
  ShieldAlert,
  Tag,
  Upload,
  X,
} from "lucide-react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "../context/ToastContext";
import { getJoyModerationQueue, moderateJoyContent } from "../services/api";
import {
  JOY_CATEGORY_OPTIONS,
  JOY_STATUS_OPTIONS,
} from "../services/contentModeration";

const formatDuration = (seconds) => {
  const total = Math.max(0, Number(seconds) || 0);
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0");
};

const statusClasses = {
  source_review: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  published: "bg-blue-50 text-blue-700",
};

function PreviewModal({ item, onClose }) {
  if (!item) return null;
  const youtubeEmbed = item.provider === "youtube" && item.providerId
    ? "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(item.providerId)
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="text-xs text-slate-500">{item.sourceName}</p>
          </div>
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close preview">
            <X size={19} />
          </button>
        </div>
        <div className="aspect-video bg-black">
          {youtubeEmbed ? (
            <iframe
              className="h-full w-full"
              src={youtubeEmbed}
              title={"Preview " + item.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : item.previewUrl ? (
            <video className="h-full w-full" src={item.previewUrl} controls preload="metadata" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white">No playable preview is available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ item, options, busy, onPreview, onAction, onReject }) {
  const [flag, setFlag] = useState("");
  const [tag, setTag] = useState("");
  const status = item.published ? "published" : item.moderationStatus;
  const approvalBlocked = !item.playable || item.safetyFlags.length > 0;

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="grid gap-0 sm:grid-cols-[220px_1fr]">
        <div className="relative aspect-video bg-slate-100 sm:aspect-auto sm:min-h-52">
          {item.thumbnailUrl ? (
            <img className="h-full w-full object-cover" src={item.thumbnailUrl} alt="" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400"><Film size={30} /></div>
          )}
          <button
            onClick={() => onPreview(item)}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/20 text-white hover:bg-slate-950/35"
            aria-label={"Preview " + item.title}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow">
              <Play size={20} fill="currentColor" />
            </span>
          </button>
        </div>

        <div className="min-w-0 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{item.sourceName} · {formatDuration(item.durationSeconds)}</p>
            </div>
            <span className={"rounded-md px-2 py-1 text-xs font-semibold " + (statusClasses[status] || "bg-slate-100 text-slate-600")}>
              {status.replaceAll("_", " ")}
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div><dt className="text-slate-400">Provider ID</dt><dd className="truncate font-mono text-slate-700">{item.providerId || "None"}</dd></div>
            <div><dt className="text-slate-400">Playability</dt><dd className={item.playable ? "text-emerald-700" : "text-red-700"}>{item.playable ? "Playable" : "Blocked"}</dd></div>
            <div><dt className="text-slate-400">Category</dt><dd className="text-slate-700">{item.category.replaceAll("_", " ")}</dd></div>
            <div><dt className="text-slate-400">Source trust</dt><dd className="truncate text-slate-700">{item.sourceTrustLevel}</dd></div>
          </dl>

          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Safety flags</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {item.safetyFlags.length === 0 && <span className="text-xs text-emerald-700">No unresolved flags</span>}
              {item.safetyFlags.map((value) => (
                <button
                  key={value}
                  onClick={() => onAction(item, "REMOVE_SAFETY_FLAG", { value })}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                  title="Remove flag after confirming it is incorrect"
                >
                  <ShieldAlert size={12} /> {value} <X size={11} />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <select className="min-w-44 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs" value={flag} onChange={(event) => setFlag(event.target.value)}>
              <option value="">Add safety flag</option>
              {(options.safetyFlags || []).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <button
              className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              disabled={!flag || busy}
              onClick={() => {
                onAction(item, "ADD_SAFETY_FLAG", { value: flag });
                setFlag("");
              }}
              title="Add selected safety flag"
            >
              <AlertTriangle size={15} />
            </button>
            <select className="min-w-40 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs" value={tag} onChange={(event) => setTag(event.target.value)}>
              <option value="">Add Joy tag</option>
              {(options.joyTags || []).filter((value) => !item.joyTags.includes(value)).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <button
              className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              disabled={!tag || busy}
              onClick={() => {
                onAction(item, "ADD_JOY_TAG", { value: tag });
                setTag("");
              }}
              title="Add selected Joy tag"
            >
              <Tag size={15} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            {item.moderationStatus !== "approved" && (
              <button
                onClick={() => onAction(item, "APPROVE")}
                disabled={approvalBlocked || busy}
                title={approvalBlocked ? "Resolve flags and playability before approval" : "Approve clip"}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check size={15} /> Approve
              </button>
            )}
            {item.moderationStatus === "approved" && !item.published && (
              <button
                onClick={() => onAction(item, "PUBLISH")}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40"
              >
                <Upload size={15} /> Publish
              </button>
            )}
            {item.published && (
              <button
                onClick={() => onAction(item, "UNPUBLISH")}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <EyeOff size={15} /> Unpublish
              </button>
            )}
            {item.moderationStatus !== "rejected" && (
              <button
                onClick={() => onReject(item)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
              >
                <X size={15} /> Reject
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ContentModeration() {
  const { notify } = useToast();
  const [filters, setFilters] = useState({ status: "source_review", source: "", category: "" });
  const [queue, setQueue] = useState({ items: [], count: 0, options: {} });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [previewing, setPreviewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setQueue(await getJoyModerationQueue(filters));
    } catch (error) {
      notify(error.message || "Could not load the moderation queue.", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const action = async (item, actionName, details = {}) => {
    setBusyId(item.id);
    try {
      const updated = await moderateJoyContent(item.id, actionName, details);
      setQueue((current) => ({
        ...current,
        items: current.items.map((entry) => entry.id === updated.id ? updated : entry),
      }));
      notify(actionName.replaceAll("_", " ").toLowerCase() + " completed.", "success");
    } catch (error) {
      notify(error.message || "The moderation action failed.", "error");
    } finally {
      setBusyId("");
    }
  };

  const reject = async (reason) => {
    await action(rejecting, "REJECT", { reason });
    setRejecting(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Joy Break moderation</h2>
          <p className="mt-1 text-sm text-slate-500">Watch each clip, resolve safety flags, approve it, then publish it.</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid gap-3 border-y border-slate-200 bg-white py-4 sm:grid-cols-3">
        <label className="text-xs font-medium text-slate-600">
          Status
          <select className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            {JOY_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Source
          <select className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={filters.source} onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value }))}>
            <option value="">All sources</option>
            {(queue.options.sources || []).map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Joy type
          <select className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
            {JOY_CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Film size={16} />
        <span>{queue.count} clips match the current filters</span>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading review queue...</div>
      ) : queue.items.length === 0 ? (
        <EmptyState icon={Film} title="No clips in this view" description="Change the filters or refresh after new candidates are discovered." />
      ) : (
        <div className="space-y-3">
          {queue.items.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              options={queue.options}
              busy={busyId === item.id}
              onPreview={setPreviewing}
              onAction={action}
              onReject={setRejecting}
            />
          ))}
        </div>
      )}

      <PreviewModal item={previewing} onClose={() => setPreviewing(null)} />
      <ConfirmDialog
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        onConfirm={reject}
        title="Reject clip"
        description="The clip will be removed from publication and kept in the audit trail."
        confirmLabel="Reject clip"
        tone="danger"
        requireReason
        reasonLabel="Reason for rejection"
        reasonPlaceholder="Describe the safety or suitability issue."
      />
    </div>
  );
}