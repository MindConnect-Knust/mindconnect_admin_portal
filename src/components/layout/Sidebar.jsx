import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardCheck,
  UserCog,
  GraduationCap,
  BarChart3,
  Settings,
  HeartHandshake,
  X,
} from "lucide-react";
import { useData } from "../../context/DataContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/approvals", label: "Approvals", icon: ClipboardCheck, countKey: "applications" },
  { to: "/counsellors", label: "Counsellors", icon: UserCog },
  { to: "/peer-counsellors", label: "Peer Counsellors", icon: GraduationCap },
  { to: "/activity", label: "Activity & Evaluations", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { applications } = useData();
  const counts = { applications: applications.length };

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <HeartHandshake size={19} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">Wellbeing Portal</p>
              <p className="text-xs text-slate-400">Admin Console</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="mt-2 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <span className="flex items-center gap-3">
                <item.icon size={18} />
                {item.label}
              </span>
              {item.countKey && counts[item.countKey] > 0 && (
                <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {counts[item.countKey]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 inset-x-0 border-t border-slate-100 p-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Managing counsellors and peer counsellors on behalf of the Student Wellbeing Office.
          </p>
        </div>
      </aside>
    </>
  );
}
