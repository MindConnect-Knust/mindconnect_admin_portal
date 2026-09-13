import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { DataProvider } from "./context/DataContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

// Pages — existing
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Approvals from "./pages/Approvals";
import Counsellors from "./pages/Counsellors";
import PeerCounsellors from "./pages/PeerCounsellors";
import Activity from "./pages/Activity";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Pages — Content
import ContentLibrary from "./pages/content/ContentLibrary";
import VideoModeration from "./pages/content/VideoModeration";
import JoyBreak from "./pages/content/JoyBreak";
import Reels from "./pages/content/Reels";
import TrustedSources from "./pages/content/TrustedSources";
import SourceCandidates from "./pages/content/SourceCandidates";
import AssessmentTemplates from "./pages/content/AssessmentTemplates";

// Pages — CMS
import News from "./pages/cms/News";
import Resources from "./pages/cms/Resources";
import Events from "./pages/cms/Events";

// Pages — Community & Safety
import Reports from "./pages/community/Reports";
import ModerationQueue from "./pages/community/ModerationQueue";

// Pages — Administration
import UsersPage from "./pages/administration/Users";
import AuditLog from "./pages/administration/AuditLog";
import AppointmentsPage from "./pages/administration/Appointments";
import SystemHealth from "./pages/administration/SystemHealth";
import PushNotifications from "./pages/communications/PushNotifications";
import CrisisCommandCentre from "./pages/crisis/CrisisCommandCentre";
import CareNavigation from "./pages/crisis/CareNavigation";
import CaseWorkspace from "./pages/cases/CaseWorkspace";
import CaseDetail from "./pages/cases/CaseDetail";
import WellbeingIntelligence from "./pages/analytics/WellbeingIntelligence";
import ConcernQueue from "./pages/concerns/ConcernQueue";
import ConcernDetail from "./pages/concerns/ConcernDetail";
import InstrumentRegistry from "./pages/outcomes/InstrumentRegistry";
import StaffAccess from "./pages/administration/StaffAccess";
import StaffLayout from "./pages/staff/StaffLayout";
import StaffHome from "./pages/staff/StaffHome";
import ReferStudent from "./pages/staff/ReferStudent";
import MyReferrals from "./pages/staff/MyReferrals";
import StaffGuidance from "./pages/staff/StaffGuidance";
import EmergencyGuidance from "./pages/staff/EmergencyGuidance";
import AcceptInvite from "./pages/staff/AcceptInvite";
import { canAdmin, canConcern, canOutcome, homePathFor } from "./services/portalPermissions";
import { useAuth } from "./context/AuthContext";
import { canCrisis } from "./services/crisisApi";
import { canCare } from "./services/careNavigationApi";
import { canCase } from "./services/caseApi";
import { canAnalytics } from "./services/analyticsApi";

import ErrorBoundary from "./components/common/ErrorBoundary";
import PwaStatus from "./components/common/PwaStatus";

function RoleHome() {
  const { admin } = useAuth();
  if (admin?.rawRole === "admin") return <Dashboard />;
  // A counsellor lands on the work they do; a staff reporter on the referral area.
  if (admin?.rawRole === "counsellor" && !canCase(admin, "CASE_VIEW_ASSIGNED") && canConcern(admin, "CONCERN_REFERRAL_REVIEW")) {
    return <Navigate to="/concerns" replace />;
  }
  return <Navigate to={homePathFor(admin)} replace />;
}

/** Staff reporters never enter the administration layout or its data providers. */
function AdminArea({ children }) {
  const { admin } = useAuth();
  if (admin?.rawRole === "staff") return <Navigate to="/staff" replace />;
  return children;
}

function ConcernRoute({ children }) {
  const { admin } = useAuth();
  return canConcern(admin, "CONCERN_REFERRAL_REVIEW") ? children : <Navigate to="/" replace />;
}

function InstrumentRoute() {
  const { admin } = useAuth();
  return canOutcome(admin, "OUTCOME_INSTRUMENT_MANAGE") ? <InstrumentRegistry /> : <Navigate to="/" replace />;
}

function StaffAccessRoute() {
  const { admin } = useAuth();
  return canAdmin(admin, "STAFF_ACCESS_MANAGE") || canAdmin(admin, "INSTITUTIONAL_DIRECTORY_MANAGE") ? <StaffAccess /> : <Navigate to="/" replace />;
}

/**
 * Route guards decide what to render. They are not the control — every API
 * behind these pages re-checks the same permissions, plus case assignment.
 */
function CaseRoute({ children }) {
  const { admin } = useAuth();
  return canCase(admin, "CASE_VIEW_ASSIGNED") ? children : <Navigate to="/" replace />;
}

function AnalyticsRoute() {
  const { admin } = useAuth();
  return canAnalytics(admin, "ANALYTICS_SERVICE_VIEW") ? <WellbeingIntelligence /> : <Navigate to="/" replace />;
}

function CrisisRoute() {
  const { admin } = useAuth();
  return canCrisis(admin, "CRISIS_INCIDENT_VIEW") ? <CrisisCommandCentre /> : <Navigate to="/" replace />;
}

/**
 * Care navigation needs either permission; holding one shows only that tab.
 * Route-level guarding matters because hiding the sidebar link is not access
 * control — the server enforces the same two permissions independently.
 */
function CareNavigationRoute() {
  const { admin } = useAuth();
  const allowed = canCare(admin, "CARE_REFERRALS_VIEW") || canCare(admin, "CARE_SERVICES_MANAGE");
  return allowed ? <CareNavigation /> : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/staff/accept-invite" element={<AcceptInvite />} />
      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <StaffLayout />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      >
        <Route index element={<StaffHome />} />
        <Route path="refer" element={<ReferStudent />} />
        <Route path="referrals" element={<MyReferrals />} />
        <Route path="guidance" element={<StaffGuidance />} />
        <Route path="emergency" element={<EmergencyGuidance />} />
      </Route>
      <Route
        element={
          <ProtectedRoute>
            <AdminArea>
              <DataProvider>
                <ErrorBoundary>
                  <DashboardLayout />
                </ErrorBoundary>
              </DataProvider>
            </AdminArea>
          </ProtectedRoute>
        }
      >
        {/* Overview */}
        <Route path="/" element={<RoleHome />} />

        {/* Care Network */}
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/counsellors" element={<Counsellors />} />
        <Route path="/peer-counsellors" element={<PeerCounsellors />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/users/:id" element={<UserProfile />} />

        {/* Content */}
        <Route path="/content/library" element={<ContentLibrary />} />
        <Route path="/content/video-moderation" element={<VideoModeration />} />
        <Route path="/content/joy-break" element={<JoyBreak />} />
        <Route path="/content/reels" element={<Reels />} />
        <Route path="/content/trusted-sources" element={<TrustedSources />} />
        <Route path="/content/source-candidates" element={<SourceCandidates />} />
        <Route path="/content/assessments" element={<AssessmentTemplates />} />

        {/* CMS */}
        <Route path="/cms/news" element={<News />} />
        <Route path="/cms/resources" element={<Resources />} />
        <Route path="/cms/events" element={<Events />} />

        {/* Community & Safety */}
        <Route path="/community/reports" element={<Reports />} />
        <Route path="/community/moderation" element={<ModerationQueue />} />
        <Route path="/crisis" element={<CrisisRoute />} />
        <Route path="/crisis/care-navigation" element={<CareNavigationRoute />} />
        <Route path="/cases" element={<CaseRoute><CaseWorkspace /></CaseRoute>} />
        <Route path="/cases/:caseId" element={<CaseRoute><CaseDetail /></CaseRoute>} />
        <Route path="/analytics" element={<AnalyticsRoute />} />
        <Route path="/concerns" element={<ConcernRoute><ConcernQueue /></ConcernRoute>} />
        <Route path="/concerns/:concernId" element={<ConcernRoute><ConcernDetail /></ConcernRoute>} />
        <Route path="/outcomes/instruments" element={<InstrumentRoute />} />

        {/* Administration */}
        <Route path="/administration/users" element={<UsersPage />} />
        <Route path="/administration/audit-log" element={<AuditLog />} />
        <Route path="/administration/system-health" element={<SystemHealth />} />
        <Route path="/administration/staff-access" element={<StaffAccessRoute />} />
        <Route path="/communications/push" element={<PushNotifications />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
            <PwaStatus />
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

