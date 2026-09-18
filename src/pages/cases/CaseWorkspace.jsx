import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlarmClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  Inbox,
  ListChecks,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { canCase, caseApi } from "../../services/caseApi";

/**
 * Counsellor workspace.
 *
 * The screen a counsellor keeps open all day. Two halves:
 *
 *   - **Counts** across the top. Numbers only — no names, no concerns. A
 *     counselling centre screen is often visible to whoever walks past it.
 *   - **Queues** below. Named, server-defined views ("follow-up due", "awaiting
 *     student") so nobody has to assemble a filter to find who needs them, and
 *     so a client can never build a query that reaches past its own caseload.
 *
 * Deliberately absent: any ranking of counsellors by volume. Caseload is for
 * planning, not for pressure to close cases faster.
 */

const QUEUES = [
  ["MY_ACTIVE", "My active cases"],
  ["NEW_REFERRALS", "New referrals"],
  ["FOLLOW_UP_DUE", "Follow-up due"],
  ["NEEDS_REVIEW", "Needs review"],
  ["AWAITING_STUDENT", "Awaiting student"],
  ["REFERRED_OUT", "Referred out"],
  ["CRISIS_FOLLOW_UP", "Crisis follow-up"],
  ["UNASSIGNED", "Unassigned"],
  ["RECENTLY_CLOSED", "Recently closed"],
  ["WAITLIST", "Waitlist"],
];

const STATUS_STYLE = {
  NEW: "border-sky-200 bg-sky-50 text-sky-700",
  INTAKE_PENDING: "border-sky-200 bg-sky-50 text-sky-700",
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REOPENED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FOLLOW_UP: "border-indigo-200 bg-indigo-50 text-indigo-700",
  WAITING_ON_STUDENT: "border-amber-200 bg-amber-50 text-amber-800",
  REFERRED: "border-slate-200 bg-slate-50 text-slate-700",
  MONITORING: "border-slate-200 bg-slate-50 text-slate-700",
  ON_HOLD: "border-slate-200 bg-slate-50 text-slate-600",
  CLOSURE_PENDING: "border-slate-200 bg-slate-50 text-slate-600",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-500",
};

const PRIORITY_STYLE = {
  URGENT: "border-rose-200 bg-rose-50 text-rose-700",
  SOON: "border-amber-200 bg-amber-50 text-amber-800",
  ROUTINE: "border-slate-200 bg-slate-50 text-slate-600",
};

const readable = (value) =>
  String(value || "").toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const shortDate = (value) => (value ? new Date(value).toLocaleDateString() : "—");

function Metric({ icon: Icon, label, value, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={16} aria-hidden="true" />
        <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? "—"}</p>
    </button>
  );
}

export default function CaseWorkspace() {
  const { admin } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [queue, setQueue] = useState("MY_ACTIVE");
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [allCounsellors, setAllCounsellors] = useState(false);

  const mayAssign = canCase(admin, "CASE_ASSIGN");
  const maySupervise = canCase(admin, "CASE_SUPERVISE");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // The waitlist is not a case queue: it is students waiting for a first slot,
      // read from its own endpoint.
      const isWaitlist = queue === "WAITLIST";
      const [dashboard, list, myTasks] = await Promise.all([
        caseApi.dashboard(),
        isWaitlist
          ? caseApi.waitlist().then((items) => ({ items, page: null }))
          : caseApi.queue(queue, { page, allCounsellors: allCounsellors && maySupervise ? "true" : undefined }),
        caseApi.myTasks(),
      ]);
      setMetrics(dashboard);
      setRows(list.items);
      setPageInfo(list.page);
      setTasks(myTasks);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [allCounsellors, maySupervise, notify, page, queue]);

  useEffect(() => {
    load();
  }, [load]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const claim = async (row) => {
    setBusyId(row.id);
    try {
      await caseApi.assign(row.id);
      notify(`Case ${row.caseRef} is now yours.`, "success");
      await load();
    } catch (error) {
      // 409 means somebody else claimed it first; the message says so.
      notify(error.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const completeTask = async (task) => {
    setBusyId(task.id);
    try {
      await caseApi.completeTask(task.id);
      notify("Task completed.", "success");
      setTasks((current) => current.filter((row) => row.id !== task.id));
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const open = (nextQueue) => {
    setQueue(nextQueue);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {greeting}, {admin?.name?.split(" ")[0] || "counsellor"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">Your caseload, follow-ups and new referrals.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={15} aria-hidden="true" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric icon={CalendarDays} label="Today's appointments" value={metrics?.todaysAppointments} onClick={() => navigate("/administration/appointments")} />
        <Metric icon={FolderOpen} label="Active caseload" value={metrics?.activeCaseload} onClick={() => open("MY_ACTIVE")} />
        <Metric icon={AlarmClock} label="Follow-ups due" value={metrics?.followUpsDue} onClick={() => open("FOLLOW_UP_DUE")} />
        <Metric icon={Inbox} label="New referrals" value={metrics?.newReferrals} onClick={() => open("NEW_REFERRALS")} />
        <Metric icon={ClipboardList} label="Needs review" value={metrics?.needsReview} onClick={() => open("NEEDS_REVIEW")} />
        <Metric icon={ListChecks} label="Open tasks" value={metrics?.openTasks} onClick={() => document.getElementById("my-tasks")?.focus()} />
        <Metric icon={UserPlus} label="Unassigned cases" value={metrics?.unassignedCases} onClick={() => open("UNASSIGNED")} />
        <Metric icon={CalendarDays} label="Waitlist offers out" value={metrics?.waitlistOffers} onClick={() => navigate("/crisis/care-navigation")} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="queue-heading" className="min-w-0 space-y-3">
          <h2 id="queue-heading" className="sr-only">Case queues</h2>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Case queues">
            {QUEUES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={queue === value}
                onClick={() => open(value)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                  queue === value
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {maySupervise && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={allCounsellors} onChange={(event) => setAllCounsellors(event.target.checked)} />
              Show every counsellor's cases (supervisory view — access is audited)
            </label>
          )}

          {loading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading cases">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
              ))}
            </div>
          ) : queue === "WAITLIST" ? (
            rows.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <CheckCircle2 className="mx-auto text-slate-400" size={30} aria-hidden="true" />
                <p className="mt-3 font-semibold text-slate-900">Nobody is waiting</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <caption className="sr-only">Students waiting for a counselling session, most urgent and longest waiting first</caption>
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">Student</th>
                      <th scope="col" className="px-4 py-3">Urgency</th>
                      <th scope="col" className="px-4 py-3">Need</th>
                      <th scope="col" className="px-4 py-3">Preferred mode</th>
                      <th scope="col" className="px-4 py-3">Waiting</th>
                      <th scope="col" className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3">
                          <p className="text-slate-900">{row.student?.name || "Student"}</p>
                          <p className="text-xs text-slate-500">{row.student?.studentId || ""}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[row.urgency] || PRIORITY_STYLE.ROUTINE}`}>
                            {readable(row.urgency)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{row.careNeed || "—"}</td>
                        <td className="px-4 py-3 text-slate-700">{readable(row.preferredMode)}</td>
                        <td className="px-4 py-3 text-slate-700">{row.waitingDays}d</td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.status === "OFFERED" ? `Offer out until ${shortDate(row.offerExpiresAt)}` : "Waiting"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
                  Open slots are offered automatically, most urgent and longest waiting first. Adding availability is the way to move this list.
                </p>
              </div>
            )
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <CheckCircle2 className="mx-auto text-slate-400" size={30} aria-hidden="true" />
              <p className="mt-3 font-semibold text-slate-900">Nothing in this queue</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[760px] text-left text-sm">
                <caption className="sr-only">Cases in the selected queue, most urgent and longest open first</caption>
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Case</th>
                    <th scope="col" className="px-4 py-3">Student</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Open</th>
                    <th scope="col" className="px-4 py-3">Follow-up</th>
                    <th scope="col" className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-semibold text-slate-900">{row.caseRef}</p>
                        <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[row.priority] || PRIORITY_STYLE.ROUTINE}`}>
                          {readable(row.priority)}
                        </span>
                        {row.hasCrisisHistory && (
                          <span className="ml-1 mt-1 inline-block rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            Crisis history
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-900">{row.student?.name || "Student"}</p>
                        <p className="text-xs text-slate-500">{row.student?.studentId || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[row.status] || STATUS_STYLE.ACTIVE}`}>
                          {readable(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.openDays}d</td>
                      <td className="px-4 py-3 text-slate-700">{shortDate(row.followUpDueAt)}</td>
                      <td className="px-4 py-3">
                        {!row.primaryCounsellor && mayAssign ? (
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => claim(row)}
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-50"
                          >
                            {busyId === row.id ? "Working…" : "Take this case"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate(`/cases/${row.id}`)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Open
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pageInfo && pageInfo.total > pageInfo.limit && (
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                Page {pageInfo.page} of {Math.ceil(pageInfo.total / pageInfo.limit)}
              </span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">
                  Previous
                </button>
                <button type="button" disabled={!pageInfo.hasMore} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        <aside aria-labelledby="tasks-heading" className="space-y-3">
          <h2 id="tasks-heading" className="text-sm font-semibold text-slate-900">
            My tasks
          </h2>
          <div id="my-tasks" tabIndex={-1} className="space-y-2 focus:outline-none">
            {tasks.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No open tasks.</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{task.title}</p>
                      <p className={`text-xs ${task.overdue ? "font-semibold text-amber-800" : "text-slate-500"}`}>
                        {task.overdue ? "Overdue · " : "Due "}
                        {shortDate(task.dueAt)} · {task.caseRef}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busyId === task.id}
                      onClick={() => completeTask(task)}
                      className="shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
                      aria-label={`Mark ${task.title} complete`}
                    >
                      Done
                    </button>
                  </div>
                  <button type="button" onClick={() => navigate(`/cases/${task.caseId}`)} className="mt-2 text-xs font-medium text-emerald-700 hover:underline">
                    Open case
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
