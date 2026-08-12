import { useState, useEffect, useCallback } from "react";
import { Database, RefreshCcw, CheckCircle, XCircle, ArrowUpRight } from "lucide-react";
import { listSourceCandidates, updateSourceCandidate, promoteSourceCandidate } from "../../services/contentApi";
import { useToast } from "../../context/ToastContext";
import EmptyState from "../../components/common/EmptyState";

const STATUS_TABS = [
  { value: "pending_review", label: "Pending Review" },
  { value: "approved_video_only", label: "Video-Only Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "promoted_to_trusted_source", label: "Promoted" },
];

const CREDIBILITY_CLASSES = [
  "AUTHORITATIVE_ORGANIZATION","UNIVERSITY","PROFESSIONAL_ORGANIZATION",
  "LICENSED_PROFESSIONAL","EDUCATIONAL_ORGANIZATION","WELLNESS_CREATOR",
  "UNKNOWN","HIGH_RISK_SOURCE",
];

const riskChip = (level) => ({
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
}[level] || "bg-slate-100 text-slate-500");

export default function SourceCandidates() {
  const { notify } = useToast();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusTab, setStatusTab] = useState("pending_review");
  const [promoting, setPromoting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listSourceCandidates({ status: statusTab });
      setCandidates(result.candidates);
    } catch (err) {
      setError(err.message || "Failed to load source candidates.");
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => { load(); }, [load]);

  const handleApproveVideoOnly = async (id) => {
    try {
      await updateSourceCandidate(id, { reviewStatus: "approved_video_only" });
      notify("Approved for video-only import.", "success");
      load();
    } catch (err) { notify(err.message, "error"); }
  };

  const handleReject = async (id) => {
    try {
      await updateSourceCandidate(id, { reviewStatus: "rejected" });
      notify("Candidate rejected.", "info");
      load();
    } catch (err) { notify(err.message, "error"); }
  };

  const handlePromote = async (candidate) => {
    if (!window.confirm(`Promote "${candidate.channelTitle}" to a Trusted Source?`)) return;
    setPromoting(candidate._id);
    try {
      await promoteSourceCandidate(candidate._id, {
        name: candidate.channelTitle,
        organization: candidate.channelTitle,
      });
      notify(`"${candidate.channelTitle}" promoted to Trusted Source.`, "success");
      load();
    } catch (err) { notify(err.message, "error"); }
    finally { setPromoting(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Source Candidates</h2>
          <p className="mt-1 text-sm text-slate-500">YouTube channels discovered during content sync. Review and promote or reject.</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      <div className="flex gap-1 flex-wrap">
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
      {!loading && error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p className="font-semibold">Failed to load</p><p>{error}</p><button onClick={load} className="mt-2 text-xs underline">Retry</button></div>}
      {!loading && !error && candidates.length === 0 && <EmptyState icon={Database} title="No candidates" description="No source candidates in this state." />}
      {!loading && !error && candidates.length > 0 && (
        <div className="space-y-3">
          {candidates.map((c) => (
            <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{c.channelTitle}</p>
                  <p className="text-xs text-slate-500">{c.handle} · {c.country || "Unknown country"}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskChip(c.riskLevel)}`}>
                    {c.riskLevel} risk
                  </span>
                  <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {c.credibilityClass?.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {c.description && (
                <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>
              )}

              <div className="flex gap-4 text-xs text-slate-500">
                <span>{(c.subscriberCount || 0).toLocaleString()} subscribers</span>
                <span>{(c.videoCount || 0)} videos</span>
                <span>Discovered from: {(c.discoveredFromTopics || []).join(", ") || "—"}</span>
              </div>

              {c.canonicalUrl && (
                <a href={c.canonicalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                  <ArrowUpRight size={11} /> View channel
                </a>
              )}

              {statusTab === "pending_review" && (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => handleApproveVideoOnly(c._id)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700">
                    <CheckCircle size={12} /> Approve Video-Only
                  </button>
                  <button onClick={() => handlePromote(c)} disabled={promoting === c._id} className="flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-700 disabled:opacity-50">
                    <ArrowUpRight size={12} /> {promoting === c._id ? "Promoting…" : "Promote to Source"}
                  </button>
                  <button onClick={() => handleReject(c._id)} className="flex items-center gap-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 text-xs font-medium">
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
