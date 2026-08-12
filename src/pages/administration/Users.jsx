import { useState, useEffect, useCallback } from "react";
import { Users, RefreshCcw, Search, Shield } from "lucide-react";
import { listUsers, setUserRole } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import EmptyState from "../../components/common/EmptyState";
import Avatar from "../../components/common/Avatar";

const ROLES = ["student", "peer_listener", "counsellor", "admin"];
const STATUS_CHIP = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-amber-100 text-amber-700",
  disabled: "bg-rose-100 text-rose-700",
};
const ROLE_CHIP = {
  admin: "bg-brand-100 text-brand-700 font-bold",
  counsellor: "bg-violet-100 text-violet-700",
  peer_listener: "bg-sky-100 text-sky-700",
  student: "bg-slate-100 text-slate-600",
};

export default function UsersPage() {
  const { notify } = useToast();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changingRole, setChangingRole] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await listUsers({ page, limit: 20, search: search || undefined });
      setUsers(result.users);
      setTotal(result.total);
      const perPage = 20;
      setPages(Math.ceil(result.total / perPage));
    } catch (err) { setError(err.message || "Failed to load users."); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleRoleChange = async (user, newRole) => {
    if (user.role === "admin" && newRole !== "admin") {
      if (!window.confirm(`Remove admin role from ${user.name}? They will lose all admin access.`)) return;
    }
    setChangingRole(user.id);
    try {
      await setUserRole(user.id, newRole);
      notify(`${user.name}'s role updated to ${newRole}.`, "success");
      load();
    } catch (err) { notify(err.message, "error"); }
    finally { setChangingRole(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Users</h2>
          <p className="mt-1 text-sm text-slate-500">
            Account management. Wellness, counselling, and private data are not exposed here.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 flex-1 max-w-md">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 text-sm outline-none"
          />
        </div>
        <button type="submit" className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-semibold hover:bg-brand-700">Search</button>
        {search && (
          <button type="button" onClick={() => { setSearch(""); setSearchInput(""); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">Clear</button>
        )}
      </form>

      {loading && <div className="flex items-center justify-center h-40 text-sm text-slate-400"><RefreshCcw size={16} className="animate-spin mr-2" /> Loading…</div>}
      {!loading && error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p className="font-semibold">Failed to load users</p><p>{error}</p><button onClick={load} className="mt-2 text-xs underline">Retry</button></div>}
      {!loading && !error && users.length === 0 && <EmptyState icon={Users} title="No users found" description={search ? "Try a different search term." : "No users in the system."} />}

      {!loading && !error && users.length > 0 && (
        <>
          <p className="text-xs text-slate-400">{total} user{total !== 1 ? "s" : ""} total</p>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="py-2.5 pl-4 pr-2 text-left text-xs font-semibold text-slate-500">User</th>
                  <th className="py-2.5 px-2 text-left text-xs font-semibold text-slate-500 hidden md:table-cell">Email</th>
                  <th className="py-2.5 px-2 text-left text-xs font-semibold text-slate-500">Role</th>
                  <th className="py-2.5 px-2 text-left text-xs font-semibold text-slate-500 hidden lg:table-cell">Status</th>
                  <th className="py-2.5 px-2 text-left text-xs font-semibold text-slate-500 hidden lg:table-cell">Joined</th>
                  <th className="py-2.5 pl-2 pr-4 text-left text-xs font-semibold text-slate-500">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pl-4 pr-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={user.name} size="sm" />
                        <span className="text-xs font-medium text-slate-900 truncate max-w-[120px]">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-xs text-slate-500 hidden md:table-cell max-w-[180px] truncate">{user.email}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] ${ROLE_CHIP[user.role] || ROLE_CHIP.student}`}>
                        {user.role?.replace("_", " ")}
                        {user.role === "admin" && <Shield size={9} className="inline ml-0.5 -mt-0.5" />}
                      </span>
                    </td>
                    <td className="py-3 px-2 hidden lg:table-cell">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CHIP[user.accountStatus] || STATUS_CHIP.active}`}>
                        {user.accountStatus}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-[10px] text-slate-400 hidden lg:table-cell">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 pl-2 pr-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        disabled={changingRole === user.id}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                      </select>
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
