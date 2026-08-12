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

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [apps, cs, pcs, audit] = await Promise.all([
        api.getApplications(),
        api.getCounsellors(),
        api.getPeerCounsellors(),
        api.getAuditLog(),
      ]);
      setApplications(apps);
      setCounsellors(cs);
      setPeerCounsellors(pcs);
      setAuditLog(audit);
      setNotifications(apps.slice(0, 20).map((application) => ({
        id: `application-${application.id}-${application.version}`,
        type: "application",
        message: `${application.name} has an application awaiting review.`,
        timestamp: application.submittedAt,
        read: false,
      })));
    } catch (error) {
      notify(error.message || "Failed to load portal data.", "error");
    } finally {
      setIsLoading(false);
    }
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