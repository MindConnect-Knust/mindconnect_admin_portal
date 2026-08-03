import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
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
  { value: "on_hold", label: "On Hold" },
  { value: "deactivated", label: "Deactivated" },
];

export default function UserManagementView({ users, subtitleField, emptyLabel }) {
  const navigate = useNavigate();
  const { setHoldTarget, setReactivateTarget, setDeactivateTarget, setDeleteTarget, dialogs } = useUserLifecycle();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery =
        !query.trim() ||
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [users, query, statusFilter]);

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
            <p className="truncate text-xs text-slate-400">{subtitleField(u)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: "sessionsThisMonth",
      header: "Sessions (mo.)",
      sortable: true,
      sortValue: (u) => u.stats?.sessionsThisMonth || 0,
      render: (u) => <span className="text-sm text-slate-700">{u.stats?.sessionsThisMonth ?? 0}</span>,
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
      key: "lastActiveAt",
      header: "Last Active",
      sortable: true,
      sortValue: (u) => u.stats?.lastActiveAt || "",
      render: (u) => <span className="text-sm text-slate-500">{timeAgo(u.stats?.lastActiveAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (u) => (
        <div className="flex justify-end">
          <UserActionsMenu
            user={u}
            onHold={setHoldTarget}
            onReactivate={setReactivateTarget}
            onDeactivate={setDeactivateTarget}
            onDelete={setDeleteTarget}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name or email…" className="sm:max-w-xs" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 sm:w-48"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(u) => navigate(`/users/${u.id}`)}
        emptyTitle="No matches found"
        emptyDescription={emptyLabel}
      />

      {dialogs}
    </div>
  );
}
