import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchInput from "../common/SearchInput";
import DataTable from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";
import Avatar from "../common/Avatar";
import UserActionsMenu from "./UserActionsMenu";
import { useUserLifecycle } from "./useUserLifecycle";
import { timeAgo } from "../../utils/formatters";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "Suspended" },
  { value: "deactivated", label: "Revoked" },
];

export default function UserManagementView({ users, subtitleField, emptyLabel }) {
  const navigate = useNavigate();
  const { setHoldTarget, setReactivateTarget, setDeleteTarget, dialogs } = useUserLifecycle();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => users.filter((user) => {
    const term = query.trim().toLowerCase();
    return (!term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)) &&
      (statusFilter === "all" || user.status === statusFilter);
  }), [query, statusFilter, users]);

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
            <p className="truncate text-xs text-slate-400">{subtitleField(user)}</p>
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", sortable: true, render: (user) => <StatusBadge status={user.status} /> },
    {
      key: "activity",
      header: "Recorded Activity",
      sortable: true,
      sortValue: (user) => user.stats?.totalSessions || 0,
      render: (user) => <span className="text-sm text-slate-700">{user.stats?.totalSessions || 0}</span>,
    },
    {
      key: "lastActiveAt",
      header: "Last Recorded",
      sortable: true,
      sortValue: (user) => user.stats?.lastActiveAt || "",
      render: (user) => <span className="text-sm text-slate-500">{timeAgo(user.stats?.lastActiveAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (user) => (
        <div className="flex justify-end">
          <UserActionsMenu user={user} onHold={setHoldTarget} onReactivate={setReactivateTarget} onDelete={setDeleteTarget} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name or email..." className="sm:max-w-xs" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 sm:w-48">
          {STATUS_FILTERS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={filtered} onRowClick={(user) => navigate(`/users/${user.id}`)} emptyTitle="No matches found" emptyDescription={emptyLabel} />
      {dialogs}
    </div>
  );
}