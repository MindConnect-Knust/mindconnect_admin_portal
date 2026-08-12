import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ClipboardCheck, UserCog, GraduationCap, CalendarDays,
  Film, Laugh, Tv2, ShieldCheck, Newspaper, BookOpen, CalendarCheck,
  Users, FileText, ListChecks, History, Settings, X, Database, TriangleAlert,
  MonitorPlay, Layers,
} from "lucide-react";
import { useData } from "../../context/DataContext";

const SECTION = "px-3 mt-6 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 select-none";

const NavItem = ({ to, label, icon: Icon, badge, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`
    }
  >
    <span className="flex items-center gap-3 min-w-0">
      <Icon size={17} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
    {badge != null && badge > 0 && (
      <span className="shrink-0 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
        {badge > 99 ? "99+" : badge}
      </span>
    )}
  </NavLink>
);

export default function Sidebar({ open, onClose }) {
  const { applications, contentCounts } = useData();

  const pendingApplications = applications.filter(
    (a) => a.status === "pending" || a.status === "under_review"
  ).length;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo / Identity */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <NavLink to="/" className="flex items-center gap-2.5" onClick={onClose}>
            <img
              src="/mindconnect-logo.png"
              alt="MindConnect"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">MindConnect</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Admin Console</p>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto py-2 px-2">

          {/* OVERVIEW */}
          <p className={SECTION}>Overview</p>
          <NavItem to="/" label="Dashboard" icon={LayoutDashboard} end />

          {/* CARE NETWORK */}
          <p className={SECTION}>Care Network</p>
          <NavItem to="/approvals" label="Applications" icon={ClipboardCheck} badge={pendingApplications} onClick={onClose} />
          <NavItem to="/counsellors" label="Counsellors" icon={UserCog} onClick={onClose} />
          <NavItem to="/peer-counsellors" label="Peer Listeners" icon={GraduationCap} onClick={onClose} />
          <NavItem to="/appointments" label="Appointments" icon={CalendarDays} onClick={onClose} />

          {/* CONTENT */}
          <p className={SECTION}>Content</p>
          <NavItem to="/content/library" label="Content Library" icon={Layers} onClick={onClose} />
          <NavItem
            to="/content/video-moderation"
            label="Video Moderation"
            icon={MonitorPlay}
            badge={contentCounts.videoPending}
            onClick={onClose}
          />
          <NavItem
            to="/content/joy-break"
            label="Joy Break"
            icon={Laugh}
            badge={contentCounts.joyPending}
            onClick={onClose}
          />
          <NavItem to="/content/reels" label="Reels" icon={Film} onClick={onClose} />
          <NavItem to="/content/trusted-sources" label="Trusted Sources" icon={ShieldCheck} onClick={onClose} />
          <NavItem to="/content/source-candidates" label="Source Candidates" icon={Database} onClick={onClose} />

          {/* CMS */}
          <p className={SECTION}>CMS</p>
          <NavItem to="/cms/news" label="News & Announcements" icon={Newspaper} onClick={onClose} />
          <NavItem to="/cms/resources" label="Resources" icon={BookOpen} onClick={onClose} />
          <NavItem to="/cms/events" label="Events" icon={CalendarCheck} onClick={onClose} />

          {/* COMMUNITY & SAFETY */}
          <p className={SECTION}>Community &amp; Safety</p>
          <NavItem
            to="/community/reports"
            label="Content Reports"
            icon={TriangleAlert}
            badge={contentCounts.openReports}
            onClick={onClose}
          />
          <NavItem to="/community/moderation" label="Moderation Queue" icon={ListChecks} onClick={onClose} />

          {/* ADMINISTRATION */}
          <p className={SECTION}>Administration</p>
          <NavItem to="/administration/users" label="Users" icon={Users} onClick={onClose} />
          <NavItem to="/administration/audit-log" label="Audit Log" icon={History} onClick={onClose} />
          <NavItem to="/activity" label="Activity" icon={FileText} onClick={onClose} />
          <NavItem to="/settings" label="Settings &amp; Health" icon={Settings} onClick={onClose} />
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 px-4 py-3">
          <p className="text-[10px] text-slate-400 leading-relaxed">
            MindConnect Wellbeing Administration<br />
            KNUST Counselling Centre
          </p>
        </div>
      </aside>
    </>
  );
}
