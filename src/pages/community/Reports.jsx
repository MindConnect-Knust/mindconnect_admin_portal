import { useState, useEffect, useCallback } from "react";
import { TriangleAlert, RefreshCcw, EyeOff, XCircle } from "lucide-react";
import { listContentReports, updateContentReport } from "../../services/contentApi";
import { useToast } from "../../context/ToastContext";
import EmptyState from "../../components/common/EmptyState";

const STATUS_TABS = [
  { value: "open", label: "Open Reports" },
  { value: "reviewed", label: "Reviewed" },
  { value: "dismissed", label: "Dismissed" },
];

const REASON_LABELS = {
  misinformation: "Misinformation",
  unsafe_advice: "Unsafe Advice",
  self_harm: "Self-Harm Risk",
  harassment: "Harassment",
  broken: "Broken / Not Loading",
  other: "Other",
};

const reasonChip = (reason) => {
  const chips = {
    unsafe_advice: "bg-rose-100 text-rose-700",
    self_harm: "bg-rose-200 text-rose-800 font-semibold",
    misinformation: "bg-amber-100 text-amber-700",
    harassment: "bg-orange-100 text-orange-700",
    broken: "bg-slate-100 text-slate-600",
    other: "bg-slate-100 text-slate-500",
  };
  return `inline-block rounded-full px-2 py-0.5 text-[10px] ${chips[reason] || chips.other}`;
};

const statusBadge = (s) => {
  const badges = {
    open: "bg-rose-100 text-rose-700",
    reviewed: "bg-emerald-100 text-emerald-700",
    dismissed: "bg-slate-100 text-slate-500",
  };
  return `inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badges[s] || badges.open}`;
};

export default function Reports() {
  const { notify } = useToast();
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusTab, setStatusTab] = useState("open");
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await listContentReports({ status: statusTab, page, limit: 20 });
      setReports(result.reports);
      setTotal(result.total);
      setPages(result.pages);
    } catch (err) { setError(err.message || "Failed to load reports."); }
    finally { setLoading(false); }
  }, [statusTab, page]);

  useEffect(() => { setPage(1); }, [statusTab]);
  useEffect(() => { load(); }, [load]);

  const doAction = async (id, action, label) => {
    setBusy(id + action);
    try {
      await updateContentReport(id, action);
      notify(`Report ${label}.`, "success");
      load();
    } catch (err) { notify(err.message, "error"); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Content Reports</h2>
          <p className="mt-1 text-sm text-slate-500">
            Reports submitted by students about problematic content. Reporter identities are not stored.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button key={tab.value} onClick={() => setStatusTab(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusTab === tab.value ? "bg-brand-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center justify-center h-40 text-sm text-slate-400"><RefreshCcw size={16} className="animate-spin mr-2" /> Loading…</div>}
      {!loading && error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p className="font-semibold">Failed to load</p><p>{error}</p><button onClick={load} className="mt-2 text-xs underline">Retry</button></div>}
      {!loading && !error && reports.length === 0 && <EmptyState icon={TriangleAlert} title="No reports in this state" description="All clear." />}

      {!loading && !error && reports.length > 0 && (
        <>
          <p className="text-xs text-slate-400">{total} report{total !== 1 ? "s" : ""} total</p>
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={reasonChip(report.reason)}>{REASON_LABELS[report.reason] || report.reason}</span>
                    <span className={statusBadge(report.status)}>{report.status}</span>
                    {report.status === "open" && report.reason === "self_harm" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 text-white px-2 py-0.5 text-[10px] font-bold">
                        ⚠ PRIORITY
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 shrink-0">{new Date(report.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Content details */}
                {report.content && (
                  <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {report.content.thumbnailUrl && (
                        <img src={report.content.thumbnailUrl} alt="" className="h-10 w-14 rounded object-cover shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{report.content.title || "Unknown content"}</p>
                        <p className="text-[10px] text-slate-500">{report.content.type} · {report.content.moderationStatus}</p>
                      </div>
                    </div>
                  </div>
                )}

                {report.detail && (
                  <p className="text-xs text-slate-600 italic">&quot;{report.detail}&quot;</p>
                )}

                {report.status === "open" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => doAction(report.id, "flag_for_review", "flagged for review")}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    >
                      <TriangleAlert size={12} /> Flag Content
                    </button>
                    <button
                      onClick={() => doAction(report.id, "unpublish_content", "resolved — content unpublished")}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    >
                      <EyeOff size={12} /> Unpublish Content
                    </button>
                    <button
                      onClick={() => doAction(report.id, "dismiss", "dismissed")}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    >
                      <XCircle size={12} /> Dismiss
                    </button>
                  </div>
                )}
                {report.status !== "open" && report.reviewedAt && (
                  <p className="text-[10px] text-slate-400">Reviewed: {new Date(report.reviewedAt).toLocaleString()}</p>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-slate-50">← Previous</button>
              <span className="text-xs text-slate-500">Page {page} of {pages}</span>
              <button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-slate-50">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
