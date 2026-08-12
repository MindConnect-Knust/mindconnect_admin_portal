import { useCallback } from "react";
import { History, RefreshCcw } from "lucide-react";
import { useData } from "../../context/DataContext";
import EmptyState from "../../components/common/EmptyState";

const EVENT_CHIP = {
  APPLICATION_APPROVED: "bg-emerald-100 text-emerald-700",
  APPLICATION_REJECTED: "bg-rose-100 text-rose-700",
  PROVIDER_SUSPENDED: "bg-amber-100 text-amber-700",
  PROVIDER_REINSTATED: "bg-sky-100 text-sky-700",
  PROVIDER_REVOKED: "bg-rose-200 text-rose-800",
  APPLICATION_SUBMITTED: "bg-slate-100 text-slate-600",
  APPLICATION_UNDER_REVIEW: "bg-slate-100 text-slate-600",
};

const formatEvent = (event) =>
  event.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function AuditLog() {
  const { auditLog, isLoading, refresh } = useData();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Audit Log</h2>
          <p className="mt-1 text-sm text-slate-500">
            Provider lifecycle events — approvals, rejections, suspensions, revocations (most recent first).
          </p>
        </div>
        <button onClick={refresh} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-40 text-sm text-slate-400">
          <RefreshCcw size={16} className="animate-spin mr-2" /> Loading audit events…
        </div>
      )}
      {!isLoading && auditLog.length === 0 && (
        <EmptyState icon={History} title="No audit events" description="No provider lifecycle events have been recorded yet." />
      )}
      {!isLoading && auditLog.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="py-2.5 pl-4 pr-2 text-left text-xs font-semibold text-slate-500">Event</th>
                <th className="py-2.5 px-2 text-left text-xs font-semibold text-slate-500 hidden md:table-cell">Provider</th>
                <th className="py-2.5 px-2 text-left text-xs font-semibold text-slate-500 hidden lg:table-cell">Role</th>
                <th className="py-2.5 px-2 text-left text-xs font-semibold text-slate-500 hidden lg:table-cell">Transition</th>
                <th className="py-2.5 px-2 text-left text-xs font-semibold text-slate-500 hidden xl:table-cell">Actor</th>
                <th className="py-2.5 px-2 text-left text-xs font-semibold text-slate-500 hidden lg:table-cell">Reason</th>
                <th className="py-2.5 pl-2 pr-4 text-left text-xs font-semibold text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLog.map((entry) => (
                <tr key={entry.id || `${entry.providerId}-${entry.at}`} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 pl-4 pr-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${EVENT_CHIP[entry.event] || "bg-slate-100 text-slate-500"}`}>
                      {formatEvent(entry.event)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-xs font-medium text-slate-900 hidden md:table-cell">
                    {entry.providerName}
                  </td>
                  <td className="py-2.5 px-2 text-xs text-slate-500 hidden lg:table-cell">
                    {entry.providerRole?.replace("_", " ")}
                  </td>
                  <td className="py-2.5 px-2 hidden lg:table-cell">
                    {entry.fromStatus && (
                      <span className="text-[10px] text-slate-400">
                        {entry.fromStatus} → <span className="text-slate-700 font-medium">{entry.toStatus}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-xs text-slate-500 hidden xl:table-cell">
                    {entry.actor?.name || "System"}
                  </td>
                  <td className="py-2.5 px-2 text-xs text-slate-500 hidden lg:table-cell max-w-[180px]">
                    <span className="truncate block" title={entry.reason}>{entry.reason || "—"}</span>
                  </td>
                  <td className="py-2.5 pl-2 pr-4 text-[10px] text-slate-400 whitespace-nowrap">
                    {entry.at ? new Date(entry.at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
