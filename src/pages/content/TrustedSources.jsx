import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  PowerOff,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Video,
} from "lucide-react";
import {
  disableTrustedSource,
  listTrustedSources,
  syncTrustedSource,
  updateTrustedSource,
} from "../../services/contentApi";
import YoutubeChannelFinder from "../../components/content/YoutubeChannelFinder";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../context/ToastContext";

const trustChip = (level) => {
  const chips = {
    OFFICIAL_KNUST: "bg-brand-100 text-brand-700",
    OFFICIAL_KCC: "bg-emerald-100 text-emerald-700",
    AUTHORITATIVE_HEALTH: "bg-sky-100 text-sky-700",
    TRUSTED_EDUCATIONAL: "bg-violet-100 text-violet-700",
    CURATED_PROFESSIONAL: "bg-indigo-100 text-indigo-700",
    CURATED_ENTERTAINMENT: "bg-pink-100 text-pink-700",
    APPROVED_EXTERNAL: "bg-cyan-100 text-cyan-700",
    UNVERIFIED: "bg-slate-100 text-slate-500",
  };
  return "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold " +
    (chips[level] || chips.UNVERIFIED);
};

const formatDate = (value) => {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString();
};

export default function TrustedSources() {
  const { notify } = useToast();
  const [sources, setSources] = useState([]);
  const [count, setCount] = useState(0);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFinder, setShowFinder] = useState(false);
  const [syncing, setSyncing] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listTrustedSources();
      setSources(result.sources);
      setCount(result.count);
      setOptions(result.options || {});
    } catch (loadError) {
      setError(loadError.message || "Failed to load trusted sources.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDisable = async (source) => {
    if (!window.confirm('Disable "' + source.name + '"? Its published content will be removed from student feeds.')) return;
    try {
      await disableTrustedSource(source._id);
      notify('"' + source.name + '" disabled and its content archived.', "info");
      load();
    } catch (actionError) {
      notify(actionError.message || "Could not disable source.", "error");
    }
  };

  const handleSync = async (source) => {
    setSyncing(source._id);
    try {
      const result = await syncTrustedSource(source._id, { maxResults: 25 });
      notify(
        "Discovery complete: " + (result.imported || 0) + " added for review, " +
          (result.duplicates || 0) + " duplicates skipped.",
        "success"
      );
      load();
    } catch (syncError) {
      notify(syncError.message || "Discovery failed.", "error");
    } finally {
      setSyncing("");
    }
  };

  const handleApproval = async (source) => {
    try {
      await updateTrustedSource(source._id, { isApproved: !source.isApproved });
      notify(!source.isApproved ? "Source approved for discovery." : "Source discovery approval removed.", "success");
      load();
    } catch (actionError) {
      notify(actionError.message || "Could not update source.", "error");
    }
  };

  const handleAdded = (source) => {
    notify('"' + source.name + '" added as a trusted discovery source.', "success");
    setShowFinder(false);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Trusted Sources</h2>
          <p className="mt-1 text-sm text-slate-500">
            {count} sources. Source approval permits discovery only; every video still requires review and publication.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
            <RefreshCcw size={13} /> Refresh
          </button>
          <button onClick={() => setShowFinder(true)} className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700">
            <Video size={14} /> Add YouTube Source
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">
          <RefreshCcw size={16} className="mr-2 animate-spin" /> Loading sources...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Failed to load sources</p>
          <p>{error}</p>
          <button onClick={load} className="mt-2 text-xs underline">Retry</button>
        </div>
      )}

      {!loading && !error && sources.length === 0 && (
        <EmptyState icon={ShieldCheck} title="No trusted sources" description="Find a YouTube channel to begin bounded, review-only discovery." />
      )}

      {!loading && !error && sources.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="py-2.5 pl-4 pr-2 text-left text-xs font-semibold text-slate-500">Source</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-slate-500">Trust</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-slate-500">Discovery</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-slate-500">Candidates</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-slate-500">Last sync</th>
                <th className="py-2.5 pl-2 pr-4 text-left text-xs font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((source) => (
                <tr key={source._id} className="hover:bg-slate-50">
                  <td className="py-3 pl-4 pr-2">
                    <div className="flex max-w-sm items-center gap-3">
                      {source.thumbnailUrl ? (
                        <img src={source.thumbnailUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100">
                          <Video size={18} className="text-slate-400" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900">{source.name}</p>
                        <p className="truncate text-[11px] text-slate-500">{source.provider} | {source.sourceIdentifier || source.organization}</p>
                        <p className="text-[10px] text-slate-400">{source.videoCount || 0} provider videos</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <span className={trustChip(source.trustLevel)}>{(source.trustLevel || "UNVERIFIED").replaceAll("_", " ")}</span>
                    <button
                      onClick={() => handleApproval(source)}
                      className={"mt-1 block rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                        (source.isApproved ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}
                    >
                      {source.isApproved ? "Approved source" : "Approve source"}
                    </button>
                  </td>
                  <td className="px-2 py-3 text-xs text-slate-600">
                    <p>{source.disabledAt ? "Disabled" : "Enabled"}</p>
                    <p className="text-[10px] text-slate-400">{source.autoSyncEnabled ? "Periodic discovery on" : "Manual discovery"}</p>
                    <p className="text-[10px] text-slate-400">Review always required</p>
                  </td>
                  <td className="px-2 py-3">
                    <p className="text-xs font-semibold text-slate-700">{source.candidateCount || 0} total</p>
                    <p className="text-[10px] text-orange-600">{source.pendingCandidateCount || 0} awaiting review</p>
                  </td>
                  <td className="px-2 py-3 text-xs text-slate-500">
                    <p>{formatDate(source.lastSuccessfulSyncAt || source.lastSyncedAt)}</p>
                    {source.lastSyncStatus === "failed" && <p className="text-[10px] text-rose-600">Last sync failed</p>}
                  </td>
                  <td className="py-3 pl-2 pr-4">
                    <div className="flex flex-wrap gap-1.5">
                      {source.sourceUrl && (
                        <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                          <ExternalLink size={11} /> View
                        </a>
                      )}
                      {source.isApproved && !source.disabledAt && (
                        <button
                          onClick={() => handleSync(source)}
                          disabled={syncing === source._id}
                          className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
                        >
                          <RotateCcw size={11} className={syncing === source._id ? "animate-spin" : ""} />
                          {syncing === source._id ? "Discovering..." : "Discover"}
                        </button>
                      )}
                      {!source.disabledAt && (
                        <button onClick={() => handleDisable(source)} className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100">
                          <PowerOff size={11} /> Disable
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showFinder && (
        <YoutubeChannelFinder options={options} onAdded={handleAdded} onClose={() => setShowFinder(false)} />
      )}
    </div>
  );
}