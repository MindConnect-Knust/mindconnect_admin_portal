// Backend for the admin portal.
//
// Auth and the Approvals workflow (getApplications/approveApplication/
// rejectApplication) talk to the real MindConnect backend via `http.js`.
// Everything else (Counsellors, PeerCounsellors, Activity, UserProfile,
// notifications) is still backed by the in-memory mock store seeded from
// mockData.js — those pages have no real backend support yet (session
// stats, ratings, evaluations, activity logs, document uploads).

import { http } from "./http";
import {
  seedCounsellors,
  seedPeerCounsellors,
  seedAuditLog,
  seedNotifications,
  nextId,
} from "../data/mockData";

const LATENCY = 350;
const delay = (ms = LATENCY) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory store, mutated in place to simulate a persistent backend across
// the session — used only by the still-mocked reads/actions below.
const store = {
  counsellors: [...seedCounsellors],
  peerCounsellors: [...seedPeerCounsellors],
  auditLog: [...seedAuditLog],
  notifications: [...seedNotifications],
};

function addAuditEntry({ admin, action, targetName, targetRole, reason }) {
  store.auditLog = [
    {
      id: nextId("audit"),
      timestamp: new Date().toISOString(),
      admin,
      action,
      targetName,
      targetRole,
      reason: reason || "",
    },
    ...store.auditLog,
  ];
}

function findUserCollection(role) {
  return role === "peer_listener" ? "peerCounsellors" : "counsellors";
}

// ---------------------------------------------------------------------------
// Auth — real backend
// ---------------------------------------------------------------------------
export async function login(email, password) {
  const data = await http.post("/auth/login", { email, password, role: "admin" });
  return {
    name: data.user?.name || email.split("@")[0],
    email: data.user?.email || email,
    role: "Program Administrator",
    token: data.token,
  };
}

// ---------------------------------------------------------------------------
// Applications — real backend (users with approvalStatus: "pending")
// ---------------------------------------------------------------------------
function mapPendingUserToApplication(user) {
  return {
    id: user.id || user._id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    submittedAt: user.createdAt,
    status: "pending",
    // Lecturer/counsellor fields
    title: user.title || "",
    department: user.department || "",
    yearsExperience: user.yearsExperience,
    licenseNumber: user.licenseNumber || "",
    qualifications: [],
    // Peer counsellor fields
    studentId: user.studentId || "",
    program: user.program || "",
    yearOfStudy: user.yearOfStudy,
    trainingProgram: "",
    referees: [],
    // Shared
    motivation: user.motivation || "",
    documents: [],
  };
}

export async function getApplications() {
  const data = await http.get("/auth/users/pending");
  return (data.data || []).map(mapPendingUserToApplication);
}

export async function approveApplication(applicationId, adminName = "Admin") {
  const data = await http.put(`/auth/users/${applicationId}/approve`, {});
  const approvedUser = data.user;

  // Reflect the approval in the still-mocked active-user lists so the
  // Counsellors/PeerCounsellors pages have something to show — those pages
  // don't read from the real backend yet.
  const newUser = {
    id: approvedUser.id,
    role: approvedUser.role,
    name: approvedUser.name,
    email: approvedUser.email,
    phone: "",
    joinedAt: new Date().toISOString(),
    status: "active",
    stats: {
      sessionsThisMonth: 0,
      totalSessions: 0,
      studentsSeen: 0,
      avgRating: 0,
      avgResponseTimeHrs: 0,
      lastActiveAt: null,
    },
    ratingTrend: [],
    evaluations: [],
    activityLog: [],
    adminNotes: [
      {
        id: nextId("note"),
        date: new Date().toISOString(),
        admin: adminName,
        action: "approved",
        note: "Application approved after review.",
      },
    ],
  };

  store[findUserCollection(approvedUser.role)] = [
    newUser,
    ...store[findUserCollection(approvedUser.role)],
  ];

  addAuditEntry({
    admin: adminName,
    action: "Approved application",
    targetName: approvedUser.name,
    targetRole: approvedUser.role,
    reason: "",
  });

  return newUser;
}

export async function rejectApplication(applicationId, reason, adminName = "Admin") {
  if (!reason || !reason.trim()) throw new Error("A reason is required to reject an application.");

  const data = await http.put(`/auth/users/${applicationId}/reject`, { reason });
  const rejectedUser = data.user;

  addAuditEntry({
    admin: adminName,
    action: "Rejected application",
    targetName: rejectedUser?.name,
    targetRole: rejectedUser?.role,
    reason,
  });

  return { id: applicationId };
}

// ---------------------------------------------------------------------------
// Reads — still mocked
// ---------------------------------------------------------------------------
export async function getCounsellors() {
  await delay();
  return [...store.counsellors];
}

export async function getPeerCounsellors() {
  await delay();
  return [...store.peerCounsellors];
}

export async function getAuditLog() {
  await delay();
  return [...store.auditLog];
}

export async function getNotifications() {
  await delay(150);
  return [...store.notifications];
}

export async function getUserById(id) {
  await delay();
  const user =
    store.counsellors.find((u) => u.id === id) ||
    store.peerCounsellors.find((u) => u.id === id);
  if (!user) throw new Error("User not found.");
  return user;
}

// ---------------------------------------------------------------------------
// Lifecycle actions on approved users — still mocked
// ---------------------------------------------------------------------------
export async function updateUserStatus(id, status, reason, adminName = "Admin") {
  await delay(450);
  if (["on_hold", "deactivated"].includes(status) && (!reason || !reason.trim())) {
    throw new Error("A reason is required for this action.");
  }

  let user = null;
  for (const key of ["counsellors", "peerCounsellors"]) {
    const idx = store[key].findIndex((u) => u.id === id);
    if (idx !== -1) {
      const actionLabel = { active: "Reactivated", on_hold: "Put on hold", deactivated: "Deactivated" }[status] || status;
      user = {
        ...store[key][idx],
        status,
        adminNotes: [
          {
            id: nextId("note"),
            date: new Date().toISOString(),
            admin: adminName,
            action: status,
            note: reason || `${actionLabel} by admin.`,
          },
          ...store[key][idx].adminNotes,
        ],
      };
      store[key] = [...store[key]];
      store[key][idx] = user;

      addAuditEntry({
        admin: adminName,
        action: actionLabel,
        targetName: user.name,
        targetRole: user.role,
        reason: reason || "",
      });
      break;
    }
  }

  if (!user) throw new Error("User not found.");
  return user;
}

export async function deleteUser(id, reason, adminName = "Admin") {
  await delay(450);
  if (!reason || !reason.trim()) throw new Error("A reason is required to delete a profile.");

  let removed = null;
  for (const key of ["counsellors", "peerCounsellors"]) {
    const found = store[key].find((u) => u.id === id);
    if (found) {
      removed = found;
      store[key] = store[key].filter((u) => u.id !== id);
      break;
    }
  }
  if (!removed) throw new Error("User not found.");

  addAuditEntry({
    admin: adminName,
    action: "Deleted profile",
    targetName: removed.name,
    targetRole: removed.role,
    reason,
  });

  return { id };
}
