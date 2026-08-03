import { useMemo } from "react";
import { UserCog, GraduationCap, ClipboardCheck, Star, PauseCircle, Ban } from "lucide-react";
import { useData } from "../context/DataContext";
import StatCard from "../components/dashboard/StatCard";
import PendingApprovalsWidget from "../components/dashboard/PendingApprovalsWidget";
import RecentActivityFeed from "../components/dashboard/RecentActivityFeed";
import ActivityChart from "../components/activity/ActivityChart";

function aggregateTrend(users) {
  const byMonth = {};
  users.forEach((u) => {
    (u.ratingTrend || []).forEach(({ month, avgRating, sessions }) => {
      if (!byMonth[month]) byMonth[month] = { month, ratingSum: 0, ratingCount: 0, sessions: 0 };
      if (avgRating > 0) {
        byMonth[month].ratingSum += avgRating;
        byMonth[month].ratingCount += 1;
      }
      byMonth[month].sessions += sessions;
    });
  });
  return Object.values(byMonth).map((m) => ({
    month: m.month,
    sessions: m.sessions,
    avgRating: m.ratingCount ? +(m.ratingSum / m.ratingCount).toFixed(1) : 0,
  }));
}

export default function Dashboard() {
  const { applications, counsellors, peerCounsellors, auditLog, isLoading } = useData();

  const stats = useMemo(() => {
    const allUsers = [...counsellors, ...peerCounsellors];
    const activeCounsellors = counsellors.filter((u) => u.status === "active").length;
    const activePeers = peerCounsellors.filter((u) => u.status === "active").length;
    const onHold = allUsers.filter((u) => u.status === "on_hold").length;
    const deactivated = allUsers.filter((u) => u.status === "deactivated").length;
    const ratedUsers = allUsers.filter((u) => u.stats?.avgRating > 0);
    const avgSatisfaction = ratedUsers.length
      ? (ratedUsers.reduce((sum, u) => sum + u.stats.avgRating, 0) / ratedUsers.length).toFixed(1)
      : "—";
    const sessionsThisMonth = allUsers.reduce((sum, u) => sum + (u.stats?.sessionsThisMonth || 0), 0);
    return { activeCounsellors, activePeers, onHold, deactivated, avgSatisfaction, sessionsThisMonth };
  }, [counsellors, peerCounsellors]);

  const trend = useMemo(() => aggregateTrend([...counsellors, ...peerCounsellors]), [counsellors, peerCounsellors]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-400">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Overview</h2>
        <p className="mt-1 text-sm text-slate-500">A snapshot of the counselling program's people and performance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={UserCog} label="Active Counsellors" value={stats.activeCounsellors} hint="Lecturers & professionals" tone="brand" />
        <StatCard icon={GraduationCap} label="Active Peer Counsellors" value={stats.activePeers} hint="Trained student volunteers" tone="sky" />
        <StatCard icon={ClipboardCheck} label="Pending Applications" value={applications.length} hint="Awaiting your review" tone="amber" />
        <StatCard icon={Star} label="Avg. Student Satisfaction" value={stats.avgSatisfaction} hint={`Across ${stats.sessionsThisMonth} sessions this month`} tone="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={PauseCircle} label="Accounts On Hold" value={stats.onHold} hint="Under review, temporarily paused" tone="amber" />
        <StatCard icon={Ban} label="Deactivated Accounts" value={stats.deactivated} hint="No longer active in the program" tone="rose" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Sessions & Satisfaction Trend</h3>
          <p className="text-xs text-slate-400">Last 6 months, all counsellors & peer counsellors</p>
        </div>
        <ActivityChart data={trend} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PendingApprovalsWidget applications={applications} />
        <RecentActivityFeed entries={auditLog} />
      </div>
    </div>
  );
}
