import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  Plus,
  Search,
  Video,
  X,
} from "lucide-react";
import {
  addYoutubeChannelSource,
  searchYoutubeChannels,
} from "../../services/contentApi";

const DEFAULT_TRUST_LEVELS = [
  "OFFICIAL_KNUST",
  "OFFICIAL_KCC",
  "AUTHORITATIVE_HEALTH",
  "TRUSTED_EDUCATIONAL",
  "CURATED_PROFESSIONAL",
  "CURATED_ENTERTAINMENT",
  "APPROVED_EXTERNAL",
  "UNVERIFIED",
];

const compactNumber = (value) =>
  Number.isFinite(Number(value))
    ? new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value))
    : "Hidden";

export default function YoutubeChannelFinder({
  options = {},
  onAdded,
  onClose,
}) {
  const trustLevels = options.trustLevels?.length ? options.trustLevels : DEFAULT_TRUST_LEVELS;
  const categories = options.categories?.length ? options.categories : ["mental_wellness"];
  const [query, setQuery] = useState("");
  const [channels, setChannels] = useState([]);
  const [trustLevel, setTrustLevel] = useState("UNVERIFIED");
  const [sourceCategory, setSourceCategory] = useState("mental_wellness");
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState("");
  const [error, setError] = useState("");

  const runSearch = async (event) => {
    event?.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    setError("");
    try {
      const result = await searchYoutubeChannels(query.trim());
      setChannels(result.channels);
      if (!result.channels.length) setError("No matching channels found.");
    } catch (searchError) {
      setError(searchError.message || "Channel search failed.");
    } finally {
      setSearching(false);
    }
  };

  const addSource = async (channel) => {
    setAdding(channel.id);
    setError("");
    try {
      const source = await addYoutubeChannelSource({
        channelId: channel.id,
        trustLevel,
        sourceCategory,
        autoSyncEnabled,
      });
      const existingSource = {
        id: source._id,
        name: source.name,
        trustLevel: source.trustLevel,
        enabled: !source.disabledAt,
        requiresReview: source.requiresReview !== false,
        candidateCount: 0,
        pendingCandidateCount: 0,
      };
      setChannels((current) =>
        current.map((entry) =>
          entry.id === channel.id ? { ...entry, existingSource } : entry
        )
      );
      onAdded?.(source);
    } catch (addError) {
      if (addError.code === "SOURCE_ALREADY_EXISTS" && addError.data) {
        setChannels((current) =>
          current.map((entry) =>
            entry.id === channel.id
              ? { ...entry, existingSource: addError.data }
              : entry
          )
        );
      } else {
        setError(addError.message || "Could not add this source.");
      }
    } finally {
      setAdding("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Find YouTube channel"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Video size={20} className="text-rose-600" />
            <h2 className="text-base font-semibold text-slate-900">Find YouTube Channel</h2>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={runSearch} className="border-b border-slate-100 px-5 py-4">
          <div className="flex gap-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-300 px-3">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Channel name, @handle, URL, or channel ID"
                className="h-10 w-full min-w-0 text-sm outline-none"
                autoFocus
              />
            </label>
            <button
              type="submit"
              disabled={searching || query.trim().length < 2}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {searching ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}
              Search
            </button>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <label className="text-xs font-medium text-slate-600">
              Trust level
              <select
                value={trustLevel}
                onChange={(event) => setTrustLevel(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
              >
                {trustLevels.map((value) => (
                  <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Default category
              <select
                value={sourceCategory}
                onChange={(event) => setSourceCategory(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
              >
                {categories.map((value) => (
                  <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
            <label className="flex h-[58px] items-end gap-2 pb-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(event) => setAutoSyncEnabled(event.target.checked)}
                className="h-4 w-4"
              />
              Periodic discovery
            </label>
          </div>
          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {channels.map((channel) => (
            <div key={channel.id} className="grid gap-3 border-b border-slate-100 px-5 py-4 sm:grid-cols-[56px_1fr_auto]">
              {channel.thumbnailUrl ? (
                <img src={channel.thumbnailUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Video size={22} className="text-slate-400" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{channel.title}</p>
                  {channel.customUrl && <span className="text-xs text-slate-500">{channel.customUrl}</span>}
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-slate-500">{channel.id}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">{channel.description || "No description provided."}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {compactNumber(channel.subscriberCount)} subscribers · {compactNumber(channel.videoCount)} videos
                </p>
                {channel.existingSource && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-emerald-700">
                    <CheckCircle2 size={13} />
                    <span>Source already exists</span>
                    <span>{channel.existingSource.trustLevel?.replaceAll("_", " ")}</span>
                    <span>{channel.existingSource.enabled ? "Enabled" : "Disabled"}</span>
                    <span>{channel.existingSource.pendingCandidateCount || 0} awaiting review</span>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2 sm:flex-col">
                <a
                  href={channel.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink size={13} /> View
                </a>
                <button
                  onClick={() => addSource(channel)}
                  disabled={Boolean(channel.existingSource) || adding === channel.id}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300"
                >
                  {adding === channel.id ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />}
                  Add Source
                </button>
              </div>
            </div>
          ))}
          {!searching && !channels.length && !error && (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              <Video size={20} className="mr-2" /> Search YouTube channels
            </div>
          )}
        </div>
      </div>
    </div>
  );
}