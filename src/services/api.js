// Mock "backend" for the admin portal.
//
// Every export here is an async function shaped like a real API call
// (returns a Promise, takes plain arguments, throws on failure). When a real
// backend is ready, this file is the only place that needs to change —
// replace the bodies with `fetch`/axios calls and keep the same signatures.

import {
  seedApplications,
  seedCounsellors,
  seedPeerCounsellors,
  seedAuditLog,
  seedNotifications,
  nextId,
} from "../data/mockData";

const LATENCY = 350;
const delay = (ms = LATENCY) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory store, mutated in place to simulate a persistent backend across
// the session.
const store = {
  applications: [...seedApplications],
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
  return role === "peer_counsellor" ? "peerCounsellors" : "counsellors";
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function login(email, password) {
  await delay(500);
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }
  if (password.length < 4) {
    throw new Error("Incorrect email or password.");
  }
  return { name: email.split("@")[0], email, role: "Program Administrator" };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------
export async function getApplications() {
  await delay();
  return [...store.applications];
}

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
// Application decisions
// ---------------------------------------------------------------------------
export async function approveApplication(applicationId, adminName = "Admin") {
  await delay(500);
  const app = store.applications.find((a) => a.id === applicationId);
  if (!app) throw new Error("Application not found.");

  const base = {
    id: nextId(app.role === "peer_counsellor" ? "p" : "c"),
    role: app.role,
    name: app.name,
    email: app.email,
    phone: app.phone,
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

  const newUser =
    app.role === "peer_counsellor"
      ? {
          ...base,
          studentId: app.studentId,
          program: app.program,
          yearOfStudy: app.yearOfStudy,
          trainingCohort: app.trainingProgram,
          supervisor: "Unassigned",
        }
      : {
          ...base,
          title: app.title,
          department: app.department,
          yearsExperience: app.yearsExperience,
          licenseNumber: app.licenseNumber,
          specialties: [],
        };

  store[findUserCollection(app.role)] = [
    newUser,
    ...store[findUserCollection(app.role)],
  ];
  store.applications = store.applications.filter((a) => a.id !== applicationId);

  addAuditEntry({
    admin: adminName,
    action: "Approved application",
    targetName: app.name,
    targetRole: app.role,
    reason: "",
  });

  return newUser;
}

export async function rejectApplication(applicationId, reason, adminName = "Admin") {
  await delay(500);
  const app = store.applications.find((a) => a.id === applicationId);
  if (!app) throw new Error("Application not found.");
  if (!reason || !reason.trim()) throw new Error("A reason is required to reject an application.");

  store.applications = store.applications.filter((a) => a.id !== applicationId);

  addAuditEntry({
    admin: adminName,
    action: "Rejected application",
    targetName: app.name,
    targetRole: app.role,
    reason,
  });

  return { id: applicationId };
}

// ---------------------------------------------------------------------------
// Lifecycle actions on approved users
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
