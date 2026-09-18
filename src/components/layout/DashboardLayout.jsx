import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../../context/AuthContext";
import { subscribeToCrisisIncidents } from "../../services/crisisSocket";

const TITLES = [
  { match: "/concerns/", title: "Student Concern" },
  { match: "/concerns", title: "Student Concerns" },
  { match: "/outcomes/instruments", title: "Outcome Instruments" },
  { match: "/administration/staff-access", title: "Staff Referral Access" },
  { match: "/cases/", title: "Case" },
  { match: "/cases", title: "Case Workspace" },
  { match: "/analytics", title: "Wellbeing Intelligence" },
  { match: "/crisis/care-navigation", title: "Care Navigation" },
  { match: "/institutional", title: "Institutional Content" },
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
  const [crisisAlert, setCrisisAlert] = useState(null);
  const pageTitle = usePageTitle();
  const { admin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!admin?.crisisPermissions?.includes("CRISIS_INCIDENT_VIEW")) return;
    const unsubscribe = subscribeToCrisisIncidents((event, payload) => {
      if (location.pathname === "/crisis") return;
      if (event === "crisis:incident:new" || event === "crisis:incident:location-updated") {
        setCrisisAlert({
          id: payload?.incidentId,
          riskTier: payload?.riskTier || "IMMINENT",
          isLocation: event === "crisis:incident:location-updated",
        });
      }
    });
    return () => unsubscribe();
  }, [admin, location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        {crisisAlert && location.pathname !== "/crisis" && (
          <div className="flex items-center justify-between gap-3 bg-rose-600 px-4 py-2 text-white text-xs font-semibold shadow-md">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="animate-pulse" />
              <span>
                {crisisAlert.isLocation
                  ? "URGENT SAFETY UPDATE: Student in crisis uploaded live GPS coordinates. Location tracking active."
                  : "URGENT SAFETY INCIDENT: Student crisis reported. Immediate counsellor response required."}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigate("/crisis");
                  setCrisisAlert(null);
                }}
                className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 shadow-sm"
              >
                Open Command Centre
              </button>
              <button onClick={() => setCrisisAlert(null)} className="px-1 text-white/80 hover:text-white" aria-label="Dismiss alert">✕</button>
            </div>
          </div>
        )}
        <Topbar onMenuClick={() => setSidebarOpen(true)} pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
