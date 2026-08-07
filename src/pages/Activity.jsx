import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Clock } from "lucide-react";
import { useData } from "../context/DataContext";
import Tabs from "../components/common/Tabs";
import DataTable from "../components/common/DataTable";
import Avatar from "../components/common/Avatar";
import StatusBadge from "../components/common/StatusBadge";
import ActivityChart from "../components/activity/ActivityChart";
import Sparkline from "../components/activity/Sparkline";
import { timeAgo } from "../utils/formatters";

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

export default function Activity() {
  const { counsellors, peerCounsellors } = useData();
  const navigate = useNavigate();
  const [tab, setTab] = useState("counsellor");

  const users = tab === "counsellor" ? counsellors : peerCounsellors;
  const trend = useMemo(() => aggregateTrend(users), [users]);

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{u.name}</p>
            <p className="truncate text-xs text-slate-400">
              {tab === "counsellor" ? u.department : `${u.program} · Year ${u.yearOfStudy}`}
            </p>
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (u) => <StatusBadge status={u.status} /> },
    {
      key: "studentsSeen",
      header: "Students Seen",
      sortable: true,
      sortValue: (u) => u.stats?.studentsSeen || 0,
      render: (u) => <span className="text-sm text-slate-700">{u.stats?.studentsSeen ?? 0}</span>,
    },
    {
      key: "totalSessions",
      header: "Total Sessions",
      sortable: true,
      sortValue: (u) => u.stats?.totalSessions || 0,
      render: (u) => <span className="text-sm text-slate-700">{u.stats?.totalSessions ?? 0}</span>,
    },
    {
      key: "avgRating",
      header: "Avg. Rating",
      sortable: true,
      sortValue: (u) => u.stats?.avgRating || 0,
      render: (u) =>
        u.stats?.avgRating > 0 ? (
          <span className="flex items-center gap-1 text-sm font-medium text-slate-700">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            {u.stats.avgRating.toFixed(1)}
          </span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        ),
    },
    {
      key: "avgResponseTimeHrs",
      header: "Avg. Response",
      sortable: true,
      sortValue: (u) => u.stats?.avgResponseTimeHrs ?? 999,
      render: (u) =>
        u.stats?.avgResponseTimeHrs ? (
          <span className="flex items-center gap-1 text-sm text-slate-600">
            <Clock size={12} className="text-slate-400" />
            {u.stats.avgResponseTimeHrs}h
          </span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        ),
    },
    {
      key: "trend",
      header: "Rating Trend",
      render: (u) => <Sparkline data={u.ratingTrend} />,
    },
    {
      key: "lastActiveAt",
      header: "Last Active",
      sortable: true,
      sortValue: (u) => u.stats?.lastActiveAt || "",
      render: (u) => <span className="text-sm text-slate-500">{timeAgo(u.stats?.lastActiveAt)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Activity & Evaluations</h2>
        <p className="mt-1 text-sm text-slate-500">
          See how each counsellor and peer counsellor is performing based on session activity and student feedback.
        </p>
      </div>

      <Tabs
        tabs={[
          { value: "counsellor", label: "Counsellor Activity", count: counsellors.length },
          { value: "peer_listener", label: "Peer Counsellor Activity", count: peerCounsellors.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            {tab === "counsellor" ? "Counsellor" : "Peer Counsellor"} Sessions & Satisfaction
          </h3>
          <p className="text-xs text-slate-400">Last 6 months</p>
        </div>
        <ActivityChart data={trend} />
      </div>

      <DataTable
        columns={columns}
        data={users}
        onRowClick={(u) => navigate(`/users/${u.id}`, { state: { tab: "evaluations" } })}
        emptyTitle="No activity yet"
        emptyDescription={`There is no recorded activity for ${tab === "counsellor" ? "counsellors" : "peer counsellors"} yet.`}
      />
    </div>
  );
}
