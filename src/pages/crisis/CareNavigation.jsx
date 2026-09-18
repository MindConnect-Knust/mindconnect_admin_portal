import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  RefreshCw,
  ShieldQuestion,
  UserRoundCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { canCare, careNavigationApi } from "../../services/careNavigationApi";

/**
 * Care Navigation workspace.
 *
 * Answers two operational questions that nothing else in the portal answers:
 * "who was referred somewhere and is still waiting?" and "are the campus
 * contact details we are giving students still true?".
 *
 * What it deliberately does not show: triage answers, free text, or routing
 * reason codes. A coordinator needs to know a student is waiting on Student
 * Financial Services. They do not need to read what that student typed about
 * their family, and the API does not send it.
 */

const STATUS_STYLE = {
  CREATED: "border-slate-200 bg-slate-50 text-slate-700",
  SENT: "border-sky-200 bg-sky-50 text-sky-700",
  ACCEPTED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  SCHEDULED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  DECLINED: "border-slate-200 bg-slate-50 text-slate-600",
  UNREACHABLE: "border-rose-200 bg-rose-50 text-rose-700",
  REDIRECTED: "border-slate-200 bg-slate-50 text-slate-600",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-600",
};

const URGENCY_STYLE = {
  URGENT: "border-rose-200 bg-rose-50 text-rose-700",
  SOON: "border-amber-200 bg-amber-50 text-amber-800",
  ROUTINE: "border-slate-200 bg-slate-50 text-slate-600",
};

const NEXT_STATUSES = [
  "SENT",
  "ACCEPTED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "DECLINED",
  "UNREACHABLE",
  "REDIRECTED",
  "CLOSED",
];

const CLOSURE_REASONS = [
  "SUPPORT_DELIVERED",
  "STUDENT_DECLINED",
  "STUDENT_UNREACHABLE",
  "REDIRECTED_ELSEWHERE",
  "SERVICE_UNAVAILABLE",
  "DUPLICATE",
  "NO_LONGER_NEEDED",
  "OTHER",
];

const CLOSING = new Set(["COMPLETED", "DECLINED", "UNREACHABLE", "REDIRECTED", "CLOSED"]);

const readable = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const when = (value) => (value ? new Date(value).toLocaleString() : "—");

function Metric({ icon: Icon, label, value, tone = "slate" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={16} />
        <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className={`mt-2 text-2xl font-semibold text-${tone}-900`}>{value}</p>
    </div>
  );
}

export default function CareNavigation() {
  const { admin } = useAuth();
  const { notify } = useToast();

  const mayViewReferrals = canCare(admin, "CARE_REFERRALS_VIEW");
  const mayManageServices = canCare(admin, "CARE_SERVICES_MANAGE");

  const [tab, setTab] = useState(mayViewReferrals ? "referrals" : "services");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [summary, setSummary] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [filter, setFilter] = useState("open");

  const [services, setServices] = useState([]);
  const [serviceMeta, setServiceMeta] = useState({});

  const referralParams = useMemo(() => {
    if (filter === "unassigned") return { unassigned: "true" };
    if (filter === "mine") return { mine: "true" };
    if (filter === "failed") return { status: "UNREACHABLE,DECLINED" };
    if (filter === "completed") return { status: "COMPLETED,CLOSED" };
    return {};
  }, [filter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "referrals" && mayViewReferrals) {
        const [queue, stats] = await Promise.all([
          careNavigationApi.listReferrals(referralParams),
          careNavigationApi.referralSummary(),
        ]);
        setReferrals(queue.items);
        setSummary(stats);
      } else if (tab === "services" && mayManageServices) {
        const result = await careNavigationApi.listServices();
        setServices(result.items);
        setServiceMeta(result.meta);
      }
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [mayManageServices, mayViewReferrals, notify, referralParams, tab]);

  useEffect(() => {
    load();
  }, [load]);

  const claim = async (referral) => {
    setBusyId(referral.id);
    try {
      await careNavigationApi.claimReferral(referral.id);
      notify("Referral assigned to you.", "success");
      await load();
    } catch (error) {
      // The server returns 409 when somebody else claimed it first, so this
      // reads as "already taken" rather than a generic failure.
      notify(error.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const advance = async (referral, status, closureReason) => {
    setBusyId(referral.id);
    try {
      await careNavigationApi.updateReferralStatus(referral.id, { status, closureReason });
      notify(`Referral marked ${readable(status).toLowerCase()}.`, "success");
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const verify = async (service) => {
    setBusyId(service.id);
    try {
      await careNavigationApi.verifyService(service.id);
      notify(`${service.name} verified and published.`, "success");
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  if (!mayViewReferrals && !mayManageServices) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <ShieldQuestion className="mx-auto text-slate-400" size={32} />
        <p className="mt-3 font-semibold text-slate-900">No care navigation access</p>
        <p className="mt-1 text-sm text-slate-600">
          This workspace needs the care referrals or support services permission.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Care navigation</h1>
          <p className="mt-1 text-sm text-slate-600">
            Referrals raised by Smart Triage and after crisis incidents, and the campus services
            students are sent to.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {mayViewReferrals && (
          <TabButton active={tab === "referrals"} onClick={() => setTab("referrals")}>
            Referral queue
          </TabButton>
        )}
        {mayManageServices && (
          <TabButton active={tab === "services"} onClick={() => setTab("services")}>
            Support services
          </TabButton>
        )}
      </div>

      {tab === "referrals" && mayViewReferrals && (
        <>
          {summary && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Metric icon={ClipboardList} label="Open" value={summary.open} />
              <Metric icon={Clock3} label="Follow-ups due" value={summary.overdueFollowUps} />
              <Metric icon={UserRoundCheck} label="Waitlist" value={summary.waitlistWaiting} />
              {/*
                Unreachable is surfaced as a headline number because it is the
                failure the rest of the funnel hides: a referral that was made,
                logged, and reached nobody.
              */}
              <Metric icon={ShieldQuestion} label="Unreachable" value={summary.unreachable} tone="rose" />
              <Metric icon={CheckCircle2} label="Completed" value={summary.completed} tone="emerald" />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {[
              ["open", "Open"],
              ["unassigned", "Unassigned"],
              ["mine", "Mine"],
              ["failed", "Failed handoffs"],
              ["completed", "Recently closed"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                  filter === value
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <SkeletonRows />
          ) : referrals.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nothing waiting"
              body="No referrals match this filter."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[860px] text-left text-sm">
                <caption className="sr-only">
                  Care referrals awaiting action, most urgent and longest waiting first
                </caption>
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Student</th>
                    <th scope="col" className="px-4 py-3">Destination</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Waiting</th>
                    <th scope="col" className="px-4 py-3">Owner</th>
                    <th scope="col" className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <ReferralRow
                      key={referral.id}
                      referral={referral}
                      busy={busyId === referral.id}
                      onClaim={() => claim(referral)}
                      onAdvance={(status, reason) => advance(referral, status, reason)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "services" && mayManageServices && (
        <>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            Smart Triage only recommends a service that has been verified within the last{" "}
            <strong>{serviceMeta.verificationMaxAgeDays ?? 180} days</strong>. A service that is not
            routable is withheld from students rather than shown with a warning.
          </div>

          {loading ? (
            <SkeletonRows />
          ) : services.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No services configured"
              body="Run the support services seed, then verify each entry against the service."
            />
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  busy={busyId === service.id}
                  onVerify={() => verify(service)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
        active
          ? "border-emerald-600 text-emerald-700"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function ReferralRow({ referral, busy, onClaim, onAdvance }) {
  const [status, setStatus] = useState("");
  const [closureReason, setClosureReason] = useState("SUPPORT_DELIVERED");
  const needsReason = CLOSING.has(status);

  return (
    <tr className="border-b border-slate-100 last:border-0 align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{referral.student?.name || "Student"}</p>
        <p className="text-xs text-slate-500">{referral.student?.studentId || "—"}</p>
        <span
          className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            URGENCY_STYLE[referral.urgency] || URGENCY_STYLE.ROUTINE
          }`}
        >
          {readable(referral.urgency)}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-slate-900">{referral.destinationName || readable(referral.destinationType)}</p>
        <p className="text-xs text-slate-500">From {readable(referral.origin)}</p>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
            STATUS_STYLE[referral.status] || STATUS_STYLE.CREATED
          }`}
        >
          {readable(referral.status)}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-slate-900">{referral.ageDays}d</p>
        <p className="text-xs text-slate-500">{when(referral.createdAt)}</p>
      </td>
      <td className="px-4 py-3 text-slate-700">{referral.assignedTo?.name || "Unassigned"}</td>
      <td className="px-4 py-3">
        {!referral.assignedTo ? (
          <button
            type="button"
            disabled={busy}
            onClick={onClaim}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-50"
          >
            {busy ? "Working…" : "Take this"}
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`status-${referral.id}`}>
              New status
            </label>
            <select
              id={`status-${referral.id}`}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700"
            >
              <option value="">Move to…</option>
              {NEXT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {readable(value)}
                </option>
              ))}
            </select>
            {needsReason && (
              <>
                <label className="sr-only" htmlFor={`reason-${referral.id}`}>
                  Closure reason
                </label>
                <select
                  id={`reason-${referral.id}`}
                  value={closureReason}
                  onChange={(event) => setClosureReason(event.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700"
                >
                  {CLOSURE_REASONS.map((value) => (
                    <option key={value} value={value}>
                      {readable(value)}
                    </option>
                  ))}
                </select>
              </>
            )}
            <button
              type="button"
              disabled={busy || !status}
              onClick={() => onAdvance(status, needsReason ? closureReason : undefined)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function ServiceCard({ service, busy, onVerify }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-slate-900">{service.name}</h2>
            {/*
              Routability is the single fact that matters here: whether Smart
              Triage will actually put this in front of a student.
            */}
            {service.routable ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <BadgeCheck size={12} /> Live in triage
              </span>
            ) : (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                Not recommended to students
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">{readable(service.category)}</p>
          {service.physicalLocation && (
            <p className="mt-1 text-xs text-slate-500">{service.physicalLocation}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{readable(service.verificationState)}</p>
          <p className="text-xs text-slate-400">Checked {when(service.lastVerifiedAt)}</p>
          {service.verificationState !== "VERIFIED" && (
            <button
              type="button"
              disabled={busy}
              onClick={onVerify}
              className="mt-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-50"
            >
              {busy ? "Saving…" : "I have checked these details"}
            </button>
          )}
        </div>
      </div>

      {service.contactMethods?.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {service.contactMethods.map((method) => (
            <li
              key={`${method.kind}:${method.value}`}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
            >
              {readable(method.kind)}: {method.display}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-amber-700">
          No contact details recorded. Students cannot be handed off to this service until one is added.
        </p>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {[0, 1, 2].map((row) => (
        <div key={row} className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <Icon className="mx-auto text-slate-400" size={30} />
      <p className="mt-3 font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}
