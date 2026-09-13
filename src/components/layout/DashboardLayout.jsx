import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const TITLES = [
  { match: "/concerns/", title: "Student Concern" },
  { match: "/concerns", title: "Student Concerns" },
  { match: "/outcomes/instruments", title: "Outcome Instruments" },
  { match: "/administration/staff-access", title: "Staff Referral Access" },
  { match: "/cases/", title: "Case" },
  { match: "/cases", title: "Case Workspace" },
  { match: "/analytics", title: "Wellbeing Intelligence" },
  { match: "/crisis/care-navigation", title: "Care Navigation" },
  { match: "/crisis", title: "Crisis Command Centre" },
  { match: "/", title: "Dashboard", end: true },
  { match: "/approvals", title: "Approvals" },
  { match: "/content-moderation", title: "Content Moderation" },
  { match: "/counsellors", title: "Counsellors" },
  { match: "/peer-counsellors", title: "Peer Counsellors" },
  { match: "/activity", title: "Activity & Evaluations" },
  { match: "/users/:id", title: "Profile" },
  { match: "/settings", title: "Settings" },
];

function usePageTitle() {
  const location = useLocation();
  for (const entry of TITLES) {
    const isMatch = entry.end ? location.pathname === entry.match : location.pathname.startsWith(entry.match.split(":")[0]);
    if (isMatch) return entry.title;
  }
  return "Wellbeing Portal";
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageTitle = usePageTitle();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
