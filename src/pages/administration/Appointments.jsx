import { useState, useEffect, useCallback } from "react";
import { CalendarDays, RefreshCcw, Filter } from "lucide-react";
import { listAppointmentsAdmin } from "../../services/contentApi";
import EmptyState from "../../components/common/EmptyState";

const STATUS_OPTS = ["", "pending", "confirmed", "completed", "cancelled", "no_show"];

const statusChip = (s) => {
  const chips = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-sky-100 text-sky-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-500",
    no_show: "bg-rose-100 text-rose-700",
  };
  return `inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${chips[s] || "bg-slate-100 text-slate-500"}`;
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await listAppointmentsAdmin({ status: status || undefined, page, limit: 20 });
      setAppointments(result.appointments);
      setTotal(result.total);
      setPages(result.pages);
    } catch (err) { setError(err.message || "Failed to load appointments."); }
    finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { setPage(1); }, [status]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Appointments</h2>
          <p className="mt-1 text-sm text-slate-500">
            Operational appointment log — status and counsellor only. Student identities, counselling notes, and wellness context are not shown.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 w-fit">
        <Filter size={14} className="text-slate-400" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-sm outline-none bg-transparent">
          <option value="">All statuses</option>
          {STATUS_OPTS.filter(Boolean).map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>

      {loading && <div className="flex items-center justify-center h-40 text-sm text-slate-400"><RefreshCcw size={16} className="animate-spin mr-2" /> Loading…</div>}
      {!loading && error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p className="font-semibold">Failed to load appointments</p><p>{error}</p><button onClick={load} className="mt-2 text-xs underline">Retry</button></div>}
      {!loading && !error && appointments.length === 0 && <EmptyState icon={CalendarDays} title="No appointments found" description="Try adjusting the status filter." />}

      {!loading && !error && appointments.length > 0 && (
        <>
          <p className="text-xs text-slate-400">{total} appointment{total !== 1 ? "s" : ""} total</p>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="py-2.5 pl-4 pr-2 text-left text-xs font-semibold text-slate-500">Date &amp; Time</th>
                  <th className="py-2.5 px-2 text-left text-xs font-semibold text-slate-500">Status</th>
                  <th className="py-2.5 px-2 text-left text-xs font-semibold text-slate-500 hidden md:table-cell">Counsellor</th>
                  <th className="py-2.5 px-2 text-left text-xs font-semibold text-slate-500 hidden lg:table-cell">Type</th>
                  <th className="py-2.5 pl-2 pr-4 text-left text-xs font-semibold text-slate-500 hidden lg:table-cell">Booked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 pl-4 pr-2 text-xs font-medium text-slate-900">
                      {new Date(appt.dateTime).toLocaleDateString()}<br />
                      <span className="text-slate-400">{new Date(appt.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={statusChip(appt.status)}>{appt.status?.replace("_", " ")}</span>
                    </td>
                    <td className="py-2.5 px-2 text-xs text-slate-600 hidden md:table-cell">
                      {appt.counsellor?.name || "—"}
                      {appt.counsellor?.department && <span className="text-slate-400"> · {appt.counsellor.department}</span>}
                    </td>
                    <td className="py-2.5 px-2 text-xs text-slate-500 hidden lg:table-cell capitalize">{appt.type}</td>
                    <td className="py-2.5 pl-2 pr-4 text-[10px] text-slate-400 hidden lg:table-cell">
                      {appt.createdAt ? new Date(appt.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
