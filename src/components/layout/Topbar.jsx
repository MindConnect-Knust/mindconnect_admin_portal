import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, LogOut, ChevronDown, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { timeAgo, initials } from "../../utils/formatters";

export default function Topbar({ onMenuClick, pageTitle }) {
  const { admin, logout } = useAuth();
  const { notifications, counsellors, peerCounsellors } = useData();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const allUsers = [...counsellors, ...peerCounsellors];
  const results =
    query.trim().length > 0
      ? allUsers.filter((u) => u.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
      : [];

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
        <Menu size={20} />
      </button>

      <h1 className="hidden text-base font-semibold text-slate-800 sm:block">{pageTitle}</h1>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative" ref={searchRef}>
          <div className="relative hidden sm:block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search counsellors, peer counsellors…"
              className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 focus:bg-white"
            />
          </div>
          {searchOpen && results.length > 0 && (
            <div className="absolute right-0 z-20 mt-1 w-72 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    navigate(`/users/${u.id}`);
                    setSearchOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                    {initials(u.name)}
                  </span>
                  <span className="flex-1 truncate">{u.name}</span>
                  <span className="text-xs text-slate-400">{u.role === "peer_counsellor" ? "Peer" : "Counsellor"}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-20 mt-1 w-80 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Notifications</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="flex gap-2 border-b border-slate-50 px-4 py-3 last:border-0">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? "bg-slate-200" : "bg-brand-500"}`} />
                      <div>
                        <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.timestamp)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-slate-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {initials(admin?.name || "Admin")}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium text-slate-800 leading-tight">{admin?.name}</span>
              <span className="block text-xs text-slate-400 leading-tight">{admin?.role}</span>
            </span>
            <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings");
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                Account settings
              </button>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
