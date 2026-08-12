import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <DataProvider>
              <DashboardLayout />
            </DataProvider>
          </ProtectedRoute>
        }
      >
        {/* Overview */}
        <Route path="/" element={<Dashboard />} />

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

        {/* CMS */}
        <Route path="/cms/news" element={<News />} />
        <Route path="/cms/resources" element={<Resources />} />
        <Route path="/cms/events" element={<Events />} />

        {/* Community & Safety */}
        <Route path="/community/reports" element={<Reports />} />
        <Route path="/community/moderation" element={<ModerationQueue />} />

        {/* Administration */}
        <Route path="/administration/users" element={<UsersPage />} />
        <Route path="/administration/audit-log" element={<AuditLog />} />
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
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
