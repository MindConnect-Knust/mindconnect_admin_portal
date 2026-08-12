import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import Tabs from "../components/common/Tabs";
import DataTable from "../components/common/DataTable";
import Avatar from "../components/common/Avatar";
import StatusBadge from "../components/common/StatusBadge";
import { timeAgo } from "../utils/formatters";

export default function Activity() {
  const { counsellors, peerCounsellors } = useData();
  const navigate = useNavigate();
  const [tab, setTab] = useState("counsellor");
  const users = tab === "counsellor" ? counsellors : peerCounsellors;
  const isCounsellor = tab === "counsellor";

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{isCounsellor ? user.department : user.program}</p>
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (user) => <StatusBadge status={user.status} /> },
    {
      key: "total",
      header: isCounsellor ? "Appointments" : "Conversations",
      sortable: true,
      sortValue: (user) => isCounsellor ? user.stats?.totalAppointments || 0 : user.stats?.totalConversations || 0,
      render: (user) => <span className="text-sm text-slate-700">{isCounsellor ? user.stats?.totalAppointments || 0 : user.stats?.totalConversations || 0}</span>,
    },
    {
      key: "active",
      header: isCounsellor ? "Completed" : "Open",
      sortable: true,
      sortValue: (user) => isCounsellor ? user.stats?.completedAppointments || 0 : user.stats?.activeConversations || 0,
      render: (user) => <span className="text-sm text-slate-700">{isCounsellor ? user.stats?.completedAppointments || 0 : user.stats?.activeConversations || 0}</span>,
    },
    ...(isCounsellor ? [{
      key: "slots",
      header: "Available Slots",
      sortable: true,
      sortValue: (user) => user.stats?.availableSlots || 0,
      render: (user) => <span className="text-sm text-slate-700">{user.stats?.availableSlots || 0}</span>,
    }] : []),
    {
      key: "lastActiveAt",
      header: "Last Recorded Activity",
      sortable: true,
      sortValue: (user) => user.stats?.lastActiveAt || "",
      render: (user) => <span className="text-sm text-slate-500">{timeAgo(user.stats?.lastActiveAt)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Recorded Activity</h2>
        <p className="mt-1 text-sm text-slate-500">Counts come from appointments and peer conversation records. No rating system is inferred.</p>
      </div>
      <Tabs
        tabs={[
          { value: "counsellor", label: "Counsellors", count: counsellors.length },
          { value: "peer_listener", label: "Peer Listeners", count: peerCounsellors.length },
        ]}
        active={tab}
        onChange={setTab}
      />
      <DataTable
        columns={columns}
        data={users}
        onRowClick={(user) => navigate(`/users/${user.id}`, { state: { tab: "history" } })}
        emptyTitle="No recorded activity"
        emptyDescription="No approved or suspended providers are available in this category."
      />
    </div>
  );
}