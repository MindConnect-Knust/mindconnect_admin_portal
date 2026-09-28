/* oxlint-disable react/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import * as api from "../services/api";
import { getDashboardContentCounts } from "../services/contentApi";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { admin, isAuthenticated } = useAuth();
  const { notify } = useToast();
  const [applications, setApplications] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [peerCounsellors, setPeerCounsellors] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Content counts for sidebar badges — fetched separately so provider data
  // loads quickly and content counts arrive when ready.
  const [contentCounts, setContentCounts] = useState({
    videoPending: null,
    joyPending: null,
    published: null,
    openReports: null,
  });
  const [contentCountsError, setContentCountsError] = useState(false);

  // Settled independently: a failing audit log must not leave the approval
  // queue empty. Background refreshes stay silent and keep the page on screen.
  const loadAll = useCallback(async ({ background = false } = {}) => {
    if (!background) setIsLoading(true);
    const [apps, cs, pcs, audit] = await Promise.allSettled([
      api.getApplications(),
      api.getCounsellors(),
      api.getPeerCounsellors(),
      api.getAuditLog(),
    ]);
    if (apps.status === "fulfilled") {
      setApplications(apps.value);
      setNotifications(apps.value.slice(0, 20).map((application) => ({
        id: `application-${application.id}-${application.version}`,
        type: "application",
        message: `${application.name} has an application awaiting review.`,
        timestamp: application.submittedAt,
        read: false,
      })));
    }
    if (cs.status === "fulfilled") setCounsellors(cs.value);
    if (pcs.status === "fulfilled") setPeerCounsellors(pcs.value);
    if (audit.status === "fulfilled") setAuditLog(audit.value);
    const failure = [apps, cs, pcs, audit].find((result) => result.status === "rejected");
    if (failure && !background) notify(failure.reason?.message || "Failed to load portal data.", "error");
    setIsLoading(false);
  }, [notify]);

  const loadContentCounts = useCallback(async () => {
    try {
      setContentCountsError(false);
      const counts = await getDashboardContentCounts();
      setContentCounts(counts);
    } catch {
      setContentCountsError(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void loadAll();
      void loadContentCounts();
    }
  }, [isAuthenticated, loadAll, loadContentCounts]);

  // Applications arrive while the portal is open. Without this, anything
  // submitted after sign-in stayed invisible until the admin signed in again.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const refresh = () => {
      if (document.visibilityState === "visible") void loadAll({ background: true });
    };
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [isAuthenticated, loadAll]);

  const adminName = admin?.name || "Admin";

  const approveApplication = useCallback(async (applicationId) => {
    const application = applications.find((item) => item.id === applicationId);
    const updated = await api.approveApplication(applicationId, adminName, application?.version);
    await loadAll();
    notify(`${updated.name} was approved.`, "success");
    return updated;
  }, [adminName, applications, loadAll, notify]);

  const rejectApplication = useCallback(async (applicationId, reason) => {
    const application = applications.find((item) => item.id === applicationId);
    await api.rejectApplication(applicationId, reason, adminName, application?.version);
    await loadAll();
    notify(`${application?.name || "Application"} was rejected.`, "info");
  }, [adminName, applications, loadAll, notify]);

  const allProviders = useMemo(
    () => [...counsellors, ...peerCounsellors],
    [counsellors, peerCounsellors]
  );

  const updateUserStatus = useCallback(async (id, status, reason) => {
    const current = [...counsellors, ...peerCounsellors].find((user) => user.id === id);
    const updated = await api.updateUserStatus(id, status, reason, adminName, current?.version);
    await loadAll();
    const labels = { active: "reactivated", on_hold: "suspended", deactivated: "revoked" };
    notify(`${updated.name} was ${labels[status] || status}.`, status === "active" ? "success" : "info");
    return updated;
  }, [adminName, counsellors, loadAll, notify, peerCounsellors]);

  const deleteUser = useCallback(async (id, reason) => {
    const user = allProviders.find((item) => item.id === id);
    await api.deleteUser(id, reason, adminName, user?.version);
    await loadAll();
    notify(`${user?.name || "Provider"} access was revoked.`, "info");
  }, [adminName, allProviders, loadAll, notify]);

  const getUserById = useCallback(
    (id) => allProviders.find((user) => user.id === id) || null,
    [allProviders]
  );

  return (
    <DataContext.Provider value={{
      isLoading,
      applications,
      counsellors,
      peerCounsellors,
      auditLog,
      notifications,
      contentCounts,
      contentCountsError,
      approveApplication,
      rejectApplication,
      updateUserStatus,
      deleteUser,
      getUserById,
      refresh: loadAll,
      refreshContentCounts: loadContentCounts,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}