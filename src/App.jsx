import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { DataProvider } from "./context/DataContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

// Pages — existing
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Approvals = lazy(() => import("./pages/Approvals"));
const Counsellors = lazy(() => import("./pages/Counsellors"));
const PeerCounsellors = lazy(() => import("./pages/PeerCounsellors"));
const Activity = lazy(() => import("./pages/Activity"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Pages — Content
const ContentLibrary = lazy(() => import("./pages/content/ContentLibrary"));
const VideoModeration = lazy(() => import("./pages/content/VideoModeration"));
const JoyBreak = lazy(() => import("./pages/content/JoyBreak"));
const Reels = lazy(() => import("./pages/content/Reels"));
const TrustedSources = lazy(() => import("./pages/content/TrustedSources"));
const SourceCandidates = lazy(() => import("./pages/content/SourceCandidates"));
const AssessmentTemplates = lazy(() => import("./pages/content/AssessmentTemplates"));
const InstitutionalContent = lazy(() => import("./pages/institutional/InstitutionalContent"));

// Pages — CMS
const News = lazy(() => import("./pages/cms/News"));
const Resources = lazy(() => import("./pages/cms/Resources"));
const Events = lazy(() => import("./pages/cms/Events"));

// Pages — Community & Safety
const Reports = lazy(() => import("./pages/community/Reports"));
const ModerationQueue = lazy(() => import("./pages/community/ModerationQueue"));

// Pages — Administration
const UsersPage = lazy(() => import("./pages/administration/Users"));
const AuditLog = lazy(() => import("./pages/administration/AuditLog"));
const AppointmentsPage = lazy(() => import("./pages/administration/Appointments"));
const SystemHealth = lazy(() => import("./pages/administration/SystemHealth"));
const PushNotifications = lazy(() => import("./pages/communications/PushNotifications"));
const CrisisCommandCentre = lazy(() => import("./pages/crisis/CrisisCommandCentre"));
const CareNavigation = lazy(() => import("./pages/crisis/CareNavigation"));
const CaseWorkspace = lazy(() => import("./pages/cases/CaseWorkspace"));
const CaseDetail = lazy(() => import("./pages/cases/CaseDetail"));
const WellbeingIntelligence = lazy(() => import("./pages/analytics/WellbeingIntelligence"));
const ConcernQueue = lazy(() => import("./pages/concerns/ConcernQueue"));
const ConcernDetail = lazy(() => import("./pages/concerns/ConcernDetail"));
const InstrumentRegistry = lazy(() => import("./pages/outcomes/InstrumentRegistry"));
const StaffAccess = lazy(() => import("./pages/administration/StaffAccess"));
const StaffLayout = lazy(() => import("./pages/staff/StaffLayout"));
const StaffHome = lazy(() => import("./pages/staff/StaffHome"));
const ReferStudent = lazy(() => import("./pages/staff/ReferStudent"));
const MyReferrals = lazy(() => import("./pages/staff/MyReferrals"));
const StaffGuidance = lazy(() => import("./pages/staff/StaffGuidance"));
const EmergencyGuidance = lazy(() => import("./pages/staff/EmergencyGuidance"));
const AcceptInvite = lazy(() => import("./pages/staff/AcceptInvite"));
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-stone-500">Loading...</div>}>
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
        <Route path="/institutional" element={<InstitutionalContent />} />

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
    </Suspense>
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

