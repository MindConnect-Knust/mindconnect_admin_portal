import { createContext, useContext, useState, useCallback, useEffect } from "react";
import * as api from "../services/api";
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

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [apps, cs, pcs, audit, notifs] = await Promise.all([
        api.getApplications(),
        api.getCounsellors(),
        api.getPeerCounsellors(),
        api.getAuditLog(),
        api.getNotifications(),
      ]);
      setApplications(apps);
      setCounsellors(cs);
      setPeerCounsellors(pcs);
      setAuditLog(audit);
      setNotifications(notifs);
    } catch {
      notify("Failed to load portal data.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (isAuthenticated) loadAll();
  }, [isAuthenticated, loadAll]);

  const adminName = admin?.name || "Admin";

  const approveApplication = useCallback(async (applicationId) => {
    const app = applications.find((a) => a.id === applicationId);
    const newUser = await api.approveApplication(applicationId, adminName);
    setApplications((prev) => prev.filter((a) => a.id !== applicationId));
    if (newUser.role === "peer_counsellor") {
      setPeerCounsellors((prev) => [newUser, ...prev]);
    } else {
      setCounsellors((prev) => [newUser, ...prev]);
    }
    const auditRow = await api.getAuditLog();
    setAuditLog(auditRow);
    notify(`${app?.name || "Applicant"} approved and added to active ${newUser.role === "peer_counsellor" ? "peer counsellors" : "counsellors"}.`, "success");
    return newUser;
  }, [applications, adminName, notify]);

  const rejectApplication = useCallback(async (applicationId, reason) => {
    const app = applications.find((a) => a.id === applicationId);
    await api.rejectApplication(applicationId, reason, adminName);
    setApplications((prev) => prev.filter((a) => a.id !== applicationId));
    setAuditLog(await api.getAuditLog());
    notify(`${app?.name || "Application"} was rejected.`, "info");
  }, [applications, adminName, notify]);

  const patchUserInLists = useCallback((updated) => {
    setCounsellors((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setPeerCounsellors((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }, []);

  const updateUserStatus = useCallback(async (id, status, reason) => {
    const updated = await api.updateUserStatus(id, status, reason, adminName);
    patchUserInLists(updated);
    setAuditLog(await api.getAuditLog());
    const labels = { active: "reactivated", on_hold: "put on hold", deactivated: "deactivated" };
    notify(`${updated.name} was ${labels[status] || status}.`, status === "deactivated" ? "info" : "success");
    return updated;
  }, [adminName, notify, patchUserInLists]);

  const deleteUser = useCallback(async (id, reason) => {
    const user = counsellors.find((u) => u.id === id) || peerCounsellors.find((u) => u.id === id);
    await api.deleteUser(id, reason, adminName);
    setCounsellors((prev) => prev.filter((u) => u.id !== id));
    setPeerCounsellors((prev) => prev.filter((u) => u.id !== id));
    setAuditLog(await api.getAuditLog());
    notify(`${user?.name || "Profile"} was permanently deleted.`, "info");
  }, [counsellors, peerCounsellors, adminName, notify]);

  const getUserById = useCallback(
    (id) => counsellors.find((u) => u.id === id) || peerCounsellors.find((u) => u.id === id) || null,
    [counsellors, peerCounsellors]
  );

  const value = {
    isLoading,
    applications,
    counsellors,
    peerCounsellors,
    auditLog,
    notifications,
    approveApplication,
    rejectApplication,
    updateUserStatus,
    deleteUser,
    getUserById,
    refresh: loadAll,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
