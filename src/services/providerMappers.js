const PROVIDER_STATUSES = new Set([
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
  "REVOKED",
]);

export function portalStatus(status) {
  return {
    PENDING: "pending",
    UNDER_REVIEW: "under_review",
    APPROVED: "active",
    REJECTED: "rejected",
    SUSPENDED: "on_hold",
    REVOKED: "deactivated",
  }[status] || "pending";
}

export function apiStatus(status) {
  const mapped = {
    pending: "PENDING",
    under_review: "UNDER_REVIEW",
    active: "APPROVED",
    rejected: "REJECTED",
    on_hold: "SUSPENDED",
    deactivated: "REVOKED",
  }[status] || status;
  if (!PROVIDER_STATUSES.has(mapped)) throw new Error("Unknown provider status.");
  return mapped;
}

const historyEntry = (event) => ({
  id: event.id,
  date: event.at,
  action: event.event,
  details: event.reason || "",
  note: event.reason || event.event.replaceAll("_", " ").toLowerCase(),
  admin: event.actor?.name || "System",
});

export function mapProvider(row) {
  const profile = row.publicProfile || {};
  const activity = row.activity || {};
  const isPeer = row.role === "peer_listener";
  const totalSessions = isPeer
    ? activity.totalConversations || 0
    : activity.totalAppointments || 0;
  const lastActiveAt = isPeer
    ? activity.lastConversationAt || null
    : activity.lastAppointmentAt || null;
  const history = (row.history || []).map(historyEntry);

  return {
    id: row.id,
    version: row.version,
    providerStatus: row.status,
    status: portalStatus(row.status),
    role: row.role,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    title: row.title || "",
    department: row.department || profile.organization || "",
    studentId: row.studentId || "",
    program: row.program || "",
    yearOfStudy: row.yearOfStudy,
    joinedAt: row.createdAt,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    motivation: row.motivation || "",
    bio: profile.bio || "",
    languages: profile.languages || [],
    specialties: profile.specialties || [],
    organization: profile.organization || "",
    qualification: profile.qualification || "",
    location: profile.location || "",
    serviceModes: profile.serviceModes || [],
    profileImage: profile.profileImage || null,
    profileReadiness: row.profileReadiness || { ready: false, missing: [] },
    yearsExperience: profile.yearsExperience,
    professionalRegistrationNumber:
      row.verificationData?.professionalRegistrationNumber || "",
    trainingCompleted: row.verificationData?.trainingCompleted === true,
    guidelinesAcknowledged: row.verificationData?.guidelinesAcknowledged === true,
    rejectionReason: row.rejectionReason || "",
    suspensionReason: row.suspensionReason || "",
    profileCompletion: row.profileCompletion || 0,
    stats: {
      totalSessions,
      totalAppointments: activity.totalAppointments || 0,
      completedAppointments: activity.completedAppointments || 0,
      studentsSeen: activity.studentsSeen || 0,
      totalConversations: activity.totalConversations || 0,
      activeConversations: activity.activeConversations || 0,
      availableSlots: activity.availableSlots || 0,
      lastActiveAt,
    },

    activityLog: history,
    adminNotes: history,
  };
}

export function mapAuditEvent(event = {}) {
  const rawEvent = event.event || event.action || "SYSTEM_EVENT";
  const rawAt = event.at || event.timestamp || new Date().toISOString();
  const actorName = event.actor?.name || event.admin || "System";
  const actorRole = event.actor?.role || "system";

  return {
    id: event.id || event.auditId || String(Math.random()),
    auditId: event.auditId || event.id,
    event: rawEvent,
    action: typeof rawEvent === "string" ? rawEvent.replace(/_/g, " ").toLowerCase() : "event",
    at: rawAt,
    timestamp: rawAt,
    actor: {
      id: event.actor?.id || null,
      name: actorName,
      email: event.actor?.email || "",
      role: actorRole,
    },
    admin: actorName,
    providerId: event.providerId || event.targetId || "",
    providerName: event.providerName || event.targetSummary || event.targetId || "—",
    targetName: event.providerName || event.targetSummary || event.targetId || "—",
    providerRole: event.providerRole || event.targetType || "—",
    targetType: event.targetType || "PROVIDER",
    targetId: event.targetId || event.providerId || "",
    targetSummary: event.targetSummary || event.providerName || "",
    fromStatus: event.fromStatus || null,
    toStatus: event.toStatus || null,
    reason: event.reason || "",
    status: event.status || "SUCCESS",
    requestId: event.requestId || "",
    ipHash: event.ipHash || "",
    beforeStateSummary: event.beforeStateSummary || null,
    afterStateSummary: event.afterStateSummary || null,
    metadata: event.metadata || null,
    errorCode: event.errorCode || "",
  };
}
