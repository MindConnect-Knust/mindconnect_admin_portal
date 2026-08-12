import { http } from "./http";
import { apiStatus, mapAuditEvent, mapProvider } from "./providerMappers";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const data = await http.post("/auth/login", { email, password, role: "admin" });
  if (!data.accessToken || data.user?.role !== "admin") {
    throw new Error("An administrator account is required.");
  }
  return {
    name: data.user.name || email.split("@")[0],
    email: data.user.email || email,
    role: "Program Administrator",
    token: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  try {
    await http.post("/auth/logout", { refreshToken });
  } catch {
    // Local logout still completes when the backend is unavailable.
  }
}

// ─── Provider Applications ────────────────────────────────────────────────────

export async function getApplications() {
  const data = await http.get("/providers/applications");
  return (data.data || []).map(mapProvider);
}

export async function approveApplication(applicationId, _adminName, version) {
  const data = await http.patch(`/providers/${applicationId}/status`, {
    status: "APPROVED",
    version,
  });
  return mapProvider(data.data);
}

export async function rejectApplication(applicationId, reason, _adminName, version) {
  if (!reason?.trim()) throw new Error("A reason is required to reject an application.");
  const data = await http.patch(`/providers/${applicationId}/status`, {
    status: "REJECTED",
    reason: reason.trim(),
    version,
  });
  return mapProvider(data.data);
}

// ─── Providers (approved / active) ───────────────────────────────────────────

async function getProviders(role) {
  const data = await http.get(`/providers?role=${encodeURIComponent(role)}`);
  return (data.data || [])
    .filter((row) => ["APPROVED", "SUSPENDED", "REVOKED"].includes(row.status))
    .map(mapProvider);
}

export const getCounsellors = () => getProviders("counsellor");
export const getPeerCounsellors = () => getProviders("peer_listener");

export async function getAuditLog() {
  const data = await http.get("/providers/audit");
  return (data.data || []).map(mapAuditEvent);
}

export async function getNotifications() {
  const applications = await getApplications();
  return applications.slice(0, 20).map((application) => ({
    id: `application-${application.id}-${application.version}`,
    type: "application",
    message: `${application.name} submitted a ${application.role === "peer_listener" ? "peer listener" : "counsellor"} application.`,
    timestamp: application.submittedAt,
    read: false,
  }));
}

export async function getUserById(id) {
  const data = await http.get(`/providers/${id}`);
  return mapProvider(data.data);
}

export async function updateUserStatus(id, status, reason, _adminName, version) {
  const target = apiStatus(status);
  if (["SUSPENDED", "REVOKED"].includes(target) && !reason?.trim()) {
    throw new Error("A reason is required for this action.");
  }
  const data = await http.patch(`/providers/${id}/status`, {
    status: target,
    reason: reason?.trim() || undefined,
    version,
  });
  return mapProvider(data.data);
}

// Kept under the old function name so existing dialogs remain wired. The
// operation is an auditable revocation, never a destructive account delete.
export async function deleteUser(id, reason, adminName, version) {
  return updateUserStatus(id, "deactivated", reason, adminName, version);
}

// ─── User Management ──────────────────────────────────────────────────────────

export async function listUsers({ page = 1, limit = 20, search } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (search) params.set("search", search);
  const data = await http.get(`/auth/users?${params}`);
  return {
    users: (data.data || []).map(safeUserView),
    count: data.count || 0,
    total: data.total || (data.data || []).length,
  };
}

export async function setUserRole(id, role) {
  const data = await http.put(`/auth/users/${id}/role`, { role });
  return safeUserView(data.data || data.user || {});
}

function safeUserView(user) {
  // Strip all sensitive / wellness fields before returning to UI.
  return {
    id: String(user._id || user.id || ""),
    name: user.name || "",
    email: user.email || "",
    role: user.role || "student",
    accountStatus: user.accountStatus || "active",
    createdAt: user.createdAt,
    avatar: user.avatar || "",
    // Provider application summary — safe operational state only.
    providerStatus: user.providerApplication?.status || null,
    providerType: user.providerApplication?.providerType || null,
    providerActive: user.providerApplication?.active || false,
  };
}
