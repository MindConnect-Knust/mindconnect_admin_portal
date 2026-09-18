import { NavLink, Navigate, Outlet } from "react-router-dom";
import { BookOpen, FileText, HeartHandshake, Home, LifeBuoy, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { isStaff } from "../../services/portalPermissions";

/**
 * The staff referral area. Deliberately separate from the administration
 * dashboard: no sidebar of clinical tools, no data providers that fetch
 * operational counts, nothing a lecturer does not need.
 */
const LINKS = [
  { to: "/staff", label: "Home", icon: Home, end: true },
  { to: "/staff/refer", label: "Refer a student", icon: HeartHandshake },
  { to: "/staff/referrals", label: "My referrals", icon: FileText },
  { to: "/staff/guidance", label: "Guidance", icon: BookOpen },
  { to: "/staff/emergency", label: "Emergency guidance", icon: LifeBuoy },
];

export default function StaffLayout() {
  const { admin, logout } = useAuth();
  if (!isStaff(admin)) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <a href="#staff-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow">
        Skip to content
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <img src="/mindconnect-logo.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
            <div>
              <p className="text-sm font-bold text-slate-900">Student Support Referrals</p>
              <p className="text-xs text-slate-500">KNUST · MindConnect</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">{admin?.name}</span>
            <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
              <LogOut size={15} aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
        <nav aria-label="Staff referral navigation" className="mx-auto max-w-5xl overflow-x-auto px-2">
          <ul className="flex gap-1 pb-2">
            {LINKS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => `inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isActive ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <Icon size={16} aria-hidden="true" /> {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="staff-main" className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
