import { useState, useEffect, useCallback } from "react";
import {
  History,
  RefreshCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  X,
  ChevronRight,
  Shield,
  Clock,
  User,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import { getAuditLogs } from "../../services/administrationApi";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";

const ACTION_FILTER_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "ADMIN_LOGIN", label: "Admin Login" },
  { value: "ADMIN_LOGOUT", label: "Admin Logout" },
  { value: "PROVIDER_APPROVED", label: "Provider Approved" },
  { value: "PROVIDER_REJECTED", label: "Provider Rejected" },
  { value: "PROVIDER_SUSPENDED", label: "Provider Suspended" },
  { value: "PROVIDER_REVOKED", label: "Provider Revoked" },
  { value: "CONTENT_APPROVED", label: "Content Approved" },
  { value: "CONTENT_REJECTED", label: "Content Rejected" },
  { value: "CONTENT_PUBLISHED", label: "Content Published" },
  { value: "CONTENT_UNPUBLISHED", label: "Content Unpublished" },
  { value: "ASSESSMENT_PUBLISHED", label: "Assessment Published" },
  { value: "ASSESSMENT_UPDATED", label: "Assessment Updated" },
  { value: "CAMPAIGN_SENT", label: "Campaign Sent" },
  { value: "CAMPAIGN_CANCELLED", label: "Campaign Cancelled" },
  { value: "USER_ROLE_CHANGED", label: "User Role Changed" },
  { value: "FEATURE_FLAG_CHANGED", label: "Feature Flag Changed" },
];

const TARGET_FILTER_OPTIONS = [
  { value: "", label: "All Targets" },
  { value: "PROVIDER", label: "Provider" },
  { value: "CONTENT", label: "Content" },
  { value: "ASSESSMENT", label: "Assessment" },
  { value: "CAMPAIGN", label: "Campaign" },
  { value: "USER", label: "User" },
  { value: "FEATURE_FLAG", label: "Feature Flag" },
  { value: "SYSTEM", label: "System" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Results" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILURE", label: "Failure" },
];

function getActionBadgeClass(action = "") {
  const norm = String(action).toUpperCase();
  if (norm.includes("APPROVED") || norm.includes("PUBLISHED") || norm.includes("LOGIN")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
  }
  if (norm.includes("REJECTED") || norm.includes("REVOKED") || norm.includes("CANCELLED") || norm.includes("FAILURE")) {
    return "bg-rose-50 text-rose-700 border-rose-200/60";
  }
  if (norm.includes("SUSPENDED") || norm.includes("REVIEW") || norm.includes("WAITING")) {
    return "bg-amber-50 text-amber-700 border-amber-200/60";
  }
  if (norm.includes("ROLE") || norm.includes("FLAG") || norm.includes("UPDATE")) {
    return "bg-blue-50 text-blue-700 border-blue-200/60";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function formatActionTitle(action = "") {
  return String(action)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const limit = 20;

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuditLogs({
        page,
        limit,
        action: actionFilter || undefined,
        targetType: targetFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setPages(res.pages || Math.ceil((res.total || 0) / limit) || 1);
    } catch (err) {
      console.error("[AuditLog] Failed to fetch audit logs:", err);
      setError(err.message || "Failed to load audit logs from backend.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, actionFilter, targetFilter, statusFilter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with live refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Audit Log
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administrative and security-sensitive activity across MindConnect.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPage(1);
              fetchLogs();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCcw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Search and Multi-Filter Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search actor, action, target, or reason…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-9 text-sm text-slate-900 outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Action filter */}
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50 focus:border-brand-500"
            >
              {ACTION_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Target Type filter */}
            <select
              value={targetFilter}
              onChange={(e) => {
                setTargetFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50 focus:border-brand-500"
            >
              {TARGET_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50 focus:border-brand-500"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active search filter badge */}
        {(search || actionFilter || targetFilter || statusFilter) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-medium">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">
                Query: "{search}"
                <button onClick={handleClearSearch} className="hover:text-slate-900">
                  <X size={12} />
                </button>
              </span>
            )}
            {actionFilter && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">
                Action: {actionFilter}
                <button
                  onClick={() => {
                    setActionFilter("");
                    setPage(1);
                  }}
                  className="hover:text-slate-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {targetFilter && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">
                Target: {targetFilter}
                <button
                  onClick={() => {
                    setTargetFilter("");
                    setPage(1);
                  }}
                  className="hover:text-slate-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">
                Status: {statusFilter}
                <button
                  onClick={() => {
                    setStatusFilter("");
                    setPage(1);
                  }}
                  className="hover:text-slate-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                handleClearSearch();
                setActionFilter("");
                setTargetFilter("");
                setStatusFilter("");
              }}
              className="text-brand-600 hover:text-brand-700 font-semibold underline ml-auto"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* 3. Page Content States */}
      {/* Loading state */}
      {loading && (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <RefreshCcw size={24} className="animate-spin text-brand-600 mb-3" />
          <p className="text-sm font-semibold text-slate-800">
            Loading audit events…
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Querying server-authoritative audit records
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <XCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-900">
                Failed to load audit logs
              </h3>
              <p className="text-xs text-rose-700 mt-1">{error}</p>
              <button
                onClick={fetchLogs}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors"
              >
                <RefreshCcw size={12} /> Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state (No logs recorded yet or no match) */}
      {!loading && !error && logs.length === 0 && (
        <EmptyState
          icon={History}
          title={
            search || actionFilter || targetFilter || statusFilter
              ? "No matching audit records"
              : "No audit activity has been recorded yet"
          }
          description={
            search || actionFilter || targetFilter || statusFilter
              ? "No events matched your current search and filter criteria."
              : "Administrative and security actions will be recorded here in real time."
          }
          action={
            search || actionFilter || targetFilter || statusFilter ? (
              <button
                onClick={() => {
                  handleClearSearch();
                  setActionFilter("");
                  setTargetFilter("");
                  setStatusFilter("");
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear all filters
              </button>
            ) : null
          }
        />
      )}

      {/* Success state with data table */}
      {!loading && !error && logs.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold">
                    <th className="py-3 pl-4 pr-3">Timestamp</th>
                    <th className="py-3 px-3">Actor</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-3 hidden md:table-cell">Target</th>
                    <th className="py-3 px-3 hidden lg:table-cell">Result</th>
                    <th className="py-3 px-3 hidden xl:table-cell">Reason / Notes</th>
                    <th className="py-3 pl-3 pr-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logs.map((entry) => {
                    const isSuccess = (entry.status || "SUCCESS").toUpperCase() === "SUCCESS";
                    const eventTitle = entry.event || entry.action || "Event";

                    return (
                      <tr
                        key={entry.id || entry.auditId}
                        onClick={() => setSelectedLog(entry)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        {/* Timestamp */}
                        <td className="py-3 pl-4 pr-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(entry.timestamp || entry.at).toLocaleString()}
                        </td>

                        {/* Actor */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">
                              {entry.actor?.name || entry.admin || "System"}
                            </span>
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase font-bold text-slate-500">
                              {entry.actor?.role || "system"}
                            </span>
                          </div>
                        </td>

                        {/* Action badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getActionBadgeClass(
                              eventTitle
                            )}`}
                          >
                            {formatActionTitle(eventTitle)}
                          </span>
                        </td>

                        {/* Target */}
                        <td className="py-3 px-3 hidden md:table-cell max-w-[200px] truncate">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900 truncate">
                              {entry.targetSummary || entry.providerName || entry.targetId || "—"}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                              {entry.targetType || entry.providerRole || "System"}
                            </span>
                          </div>
                        </td>

                        {/* Status Result */}
                        <td className="py-3 px-3 hidden lg:table-cell whitespace-nowrap">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 size={13} />
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                              <XCircle size={13} />
                              Failed
                            </span>
                          )}
                        </td>

                        {/* Reason / Notes */}
                        <td className="py-3 px-3 hidden xl:table-cell max-w-[220px] truncate text-slate-500">
                          {entry.reason ||
                            (entry.fromStatus && entry.toStatus
                              ? `${entry.fromStatus} → ${entry.toStatus}`
                              : "—")}
                        </td>

                        {/* Action link */}
                        <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-brand-600 font-semibold hover:text-brand-700">
                            View <ChevronRight size={14} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={pages}
            totalItems={total}
            pageSize={limit}
            onPageChange={setPage}
            itemLabel="audit events"
          />
        </div>
      )}

      {/* 4. Details Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm p-2 sm:p-4">
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getActionBadgeClass(
                    selectedLog.event || selectedLog.action
                  )}`}
                >
                  {formatActionTitle(selectedLog.event || selectedLog.action)}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">
                  Event Details
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  ID: {selectedLog.auditId || selectedLog.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Core Properties Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <span className="text-slate-400 block font-medium">Actor</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedLog.actor?.name || selectedLog.admin || "System"}
                </span>
                <span className="text-slate-500 block text-[11px]">
                  {selectedLog.actor?.email || "internal@mindconnect"}
                </span>
                <span className="inline-block mt-1 rounded bg-slate-200/80 px-1.5 py-0.5 text-[9px] uppercase font-bold text-slate-600">
                  {selectedLog.actor?.role || "system"}
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <span className="text-slate-400 block font-medium">Status & Time</span>
                <div className="flex items-center gap-1 mt-0.5 font-bold">
                  {(selectedLog.status || "SUCCESS").toUpperCase() === "SUCCESS" ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Success
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-1">
                      <XCircle size={13} /> Failed
                    </span>
                  )}
                </div>
                <span className="text-slate-500 block text-[11px] mt-1 font-mono">
                  {new Date(selectedLog.timestamp || selectedLog.at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Target Information */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs space-y-1">
              <span className="text-slate-400 font-medium block">Target Resource</span>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold text-slate-900">
                  {selectedLog.targetSummary || selectedLog.providerName || "—"}
                </span>
                <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 uppercase">
                  {selectedLog.targetType || "System"}
                </span>
              </div>
              {selectedLog.targetId && (
                <p className="font-mono text-[11px] text-slate-400 truncate">
                  ID: {selectedLog.targetId}
                </p>
              )}
            </div>

            {/* Justification / Reason */}
            {selectedLog.reason && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs">
                <span className="text-slate-400 font-medium block">Admin Reason / Justification</span>
                <p className="text-slate-800 mt-1 font-medium leading-relaxed">
                  {selectedLog.reason}
                </p>
              </div>
            )}

            {/* State Transition (if provider/content transition) */}
            {(selectedLog.fromStatus || selectedLog.toStatus) && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs">
                <span className="text-slate-400 font-medium block">Status Transition</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {selectedLog.fromStatus || "NONE"}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    {selectedLog.toStatus || "UNKNOWN"}
                  </span>
                </div>
              </div>
            )}

            {/* Before / After State Summary (if available) */}
            {(selectedLog.beforeStateSummary || selectedLog.afterStateSummary) && (
              <div className="space-y-2 text-xs">
                <span className="text-slate-400 font-medium block">State Summary</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px]">
                  {selectedLog.beforeStateSummary && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 overflow-x-auto">
                      <span className="text-slate-400 font-sans font-semibold block mb-1">Before:</span>
                      <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog.beforeStateSummary, null, 2)}</pre>
                    </div>
                  )}
                  {selectedLog.afterStateSummary && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 overflow-x-auto">
                      <span className="text-slate-400 font-sans font-semibold block mb-1">After:</span>
                      <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog.afterStateSummary, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Safe Technical Metadata */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs space-y-1 font-mono text-[11px] text-slate-500">
              <span className="text-slate-400 font-sans font-medium block mb-1">Network Evidence</span>
              <p>Request ID: {selectedLog.requestId || "req_direct"}</p>
              <p>IP Hash: {selectedLog.ipHash || "ip_verified"}</p>
              <p>Source: {selectedLog.source || "web_admin"}</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
