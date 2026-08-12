import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCog, GraduationCap, ClipboardCheck, MessageCircle, CalendarCheck,
  PauseCircle, MonitorPlay, Laugh, Film, TriangleAlert, Activity,
  ArrowRight, RefreshCcw,
} from "lucide-react";
import { useData } from "../context/DataContext";
import StatCard from "../components/dashboard/StatCard";
import PendingApprovalsWidget from "../components/dashboard/PendingApprovalsWidget";
import RecentActivityFeed from "../components/dashboard/RecentActivityFeed";

function QuickAction({ icon: Icon, label, description, to, tone = "brand" }) {
  const navigate = useNavigate();
  const tones = {
    brand: "bg-brand-50 text-brand-700 hover:bg-brand-100 border-brand-200",
    amber: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
    sky: "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200",
    rose: "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200",
  };
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors w-full ${tones[tone] || tones.brand}`}
    >
      <span className="flex items-center gap-3">
        <Icon size={18} className="shrink-0" />
        <span>
          <p className="text-sm font-semibold">{label}</p>
          {description && <p className="text-xs opacity-70 mt-0.5">{description}</p>}
        </span>
      </span>
      <ArrowRight size={15} className="shrink-0 opacity-50" />
    </button>
  );
}

function CountBadge({ value, error }) {
  if (error) return <span className="text-rose-500 text-xs">error</span>;
  if (value === null) return <span className="text-slate-300 text-xs animate-pulse">…</span>;
  return <>{value}</>;
}

export default function Dashboard() {
  const { applications, counsellors, peerCounsellors, auditLog, isLoading, contentCounts, contentCountsError, refresh, refreshContentCounts } = useData();

  const stats = useMemo(() => ({
    activeCounsellors: counsellors.filter((u) => u.status === "active").length,
    activePeers: peerCounsellors.filter((u) => u.status === "active").length,
    suspended: [...counsellors, ...peerCounsellors].filter((u) => u.status === "on_hold").length,
    pendingApplications: applications.filter((a) => a.status === "pending" || a.status === "under_review").length,
    appointments: counsellors.reduce((s, u) => s + (u.stats?.totalAppointments || 0), 0),
    conversations: peerCounsellors.reduce((s, u) => s + (u.stats?.totalConversations || 0), 0),
  }), [counsellors, peerCounsellors, applications]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        <RefreshCcw size={18} className="animate-spin mr-2" />
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Operational overview — all numbers from the backend.</p>
        </div>
        <button
          onClick={() => { refresh(); refreshContentCounts(); }}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      {/* Provider stats */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Care Network</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={ClipboardCheck} label="Pending Applications" value={stats.pendingApplications} hint="Awaiting admin review" tone="amber" />
          <StatCard icon={UserCog} label="Active Counsellors" value={stats.activeCounsellors} hint="Approved and available" tone="brand" />
          <StatCard icon={GraduationCap} label="Active Peer Listeners" value={stats.activePeers} hint="Approved and active" tone="sky" />
          <StatCard icon={CalendarCheck} label="Appointments Recorded" value={stats.appointments} hint="All recorded statuses" tone="emerald" />
          <StatCard icon={MessageCircle} label="Peer Conversations" value={stats.conversations} hint="Private thread count only" tone="sky" />
          <StatCard icon={PauseCircle} label="Suspended Providers" value={stats.suspended} hint="Removed from directories" tone="amber" />
        </div>
      </section>

      {/* Content stats */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Content</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <MonitorPlay size={16} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Videos Pending</span>
            </div>
            <p className="text-3xl font-bold text-amber-900">
              <CountBadge value={contentCounts.videoPending} error={contentCountsError} />
            </p>
            <p className="text-xs text-amber-600 mt-1">Awaiting review</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Laugh size={16} className="text-rose-600" />
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Joy Clips Pending</span>
            </div>
            <p className="text-3xl font-bold text-rose-900">
              <CountBadge value={contentCounts.joyPending} error={contentCountsError} />
            </p>
            <p className="text-xs text-rose-600 mt-1">Human review required</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Film size={16} className="text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Published Content</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900">
              <CountBadge value={contentCounts.published} error={contentCountsError} />
            </p>
            <p className="text-xs text-emerald-600 mt-1">Live to students</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TriangleAlert size={16} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Open Reports</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              <CountBadge value={contentCounts.openReports} error={contentCountsError} />
            </p>
            <p className="text-xs text-slate-500 mt-1">Require attention</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction icon={ClipboardCheck} label="Review Applications" description={`${stats.pendingApplications} pending`} to="/approvals" tone="brand" />
          <QuickAction icon={MonitorPlay} label="Review Videos" description="Moderate pending clips" to="/content/video-moderation" tone="amber" />
          <QuickAction icon={Laugh} label="Review Joy Clips" description="Human review required" to="/content/joy-break" tone="rose" />
          <QuickAction icon={Activity} label="Audit Log" description="Recent admin activity" to="/administration/audit-log" tone="sky" />
          <QuickAction icon={TriangleAlert} label="View Reports" description="Open content reports" to="/community/reports" tone="amber" />
          <QuickAction icon={GraduationCap} label="Manage Providers" description="Counsellors & peer listeners" to="/counsellors" tone="emerald" />
        </div>
      </section>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PendingApprovalsWidget applications={applications} />
        <RecentActivityFeed entries={auditLog} />
      </div>
    </div>
  );
}