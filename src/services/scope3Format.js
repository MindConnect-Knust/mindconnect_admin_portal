/**
 * Pure helpers for the outcome and staff concern screens. No network imports,
 * so they are tested directly. None of these decide access; the server does.
 */

export const readable = (value) =>
  String(value || "").toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

// ---------------------------------------------------------------------------
// Staff referral form
// ---------------------------------------------------------------------------

/** The emergency guidance is shown before the form for anything but a clear "no". */
export const needsEmergencyGuidance = (answer) => answer === "YES" || answer === "UNSURE";

/**
 * Client-side validation mirrors the server's required fields so the error
 * summary appears before a round trip. The server validates again.
 */
export function validateConcernForm(form, { urgent = false } = {}) {
  const errors = [];
  if (!form.immediateDangerAnswer) errors.push({ field: "immediateDangerAnswer", message: "Answer whether the student may be in immediate danger." });
  if (!form.selection && String(form.studentName || "").trim().length < 2) errors.push({ field: "student", message: "Tell us which student this is about." });
  if (!urgent) {
    if (!Array.isArray(form.concernCategories) || form.concernCategories.length === 0) errors.push({ field: "concernCategories", message: "Choose at least one thing that concerned you." });
    if (String(form.observations || "").trim().length < 10) errors.push({ field: "observations", message: "Describe what you observed. You do not need to make a diagnosis." });
  }
  return errors;
}

/** A fresh idempotency key per form, kept across retries of the same submission. */
export const newIdempotencyKey = () =>
  (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** Reporter-facing status → tone and icon name. Never colour alone: every badge also carries its label. */
export const REPORTER_STATUS_TONE = {
  SUBMITTED: "neutral",
  RECEIVED: "info",
  UNDER_REVIEW: "info",
  MORE_INFORMATION_NEEDED: "attention",
  CLOSED: "done",
};

// ---------------------------------------------------------------------------
// Professional queue
// ---------------------------------------------------------------------------

export const QUEUE_LABELS = {
  NEW: "New",
  URGENT: "Urgent review",
  MINE: "Assigned to me",
  ASSIGNED: "Assigned",
  WAITING_FOR_INFORMATION: "Waiting for information",
  CONNECTED: "Connected",
  CLOSED: "Closed",
};

/** Mirrors the server transition table only to decide which buttons to offer. */
const TRANSITIONS = {
  SUBMITTED: ["RECEIVED", "UNDER_REVIEW", "NEEDS_INFORMATION", "ASSIGNED", "CONTACT_ATTEMPTED", "CONNECTED", "REFERRED", "ESCALATED", "DUPLICATE", "INVALID", "CLOSED"],
  RECEIVED: ["UNDER_REVIEW", "NEEDS_INFORMATION", "ASSIGNED", "CONTACT_ATTEMPTED", "CONNECTED", "REFERRED", "ESCALATED", "DUPLICATE", "INVALID", "CLOSED"],
  UNDER_REVIEW: ["NEEDS_INFORMATION", "ASSIGNED", "CONTACT_ATTEMPTED", "CONNECTED", "REFERRED", "ESCALATED", "DUPLICATE", "INVALID", "CLOSED"],
  NEEDS_INFORMATION: ["UNDER_REVIEW", "ASSIGNED", "ESCALATED", "CLOSED"],
  ASSIGNED: ["UNDER_REVIEW", "NEEDS_INFORMATION", "CONTACT_ATTEMPTED", "CONNECTED", "REFERRED", "ESCALATED", "DUPLICATE", "CLOSED"],
  CONTACT_ATTEMPTED: ["CONTACT_ATTEMPTED", "NEEDS_INFORMATION", "CONNECTED", "REFERRED", "ESCALATED", "CLOSED"],
  CONNECTED: ["NEEDS_INFORMATION", "REFERRED", "ESCALATED", "CLOSED"],
  REFERRED: ["NEEDS_INFORMATION", "CONNECTED", "ESCALATED", "CLOSED"],
  ESCALATED: ["NEEDS_INFORMATION", "CONNECTED", "REFERRED", "CLOSED"],
  CLOSED: [],
  DUPLICATE: [],
  INVALID: [],
};

const ACTION_TARGET = {
  ACKNOWLEDGE: ["RECEIVED", "UNDER_REVIEW"],
  REQUEST_INFORMATION: ["NEEDS_INFORMATION"],
  RECORD_CONTACT_ATTEMPT: ["CONTACT_ATTEMPTED"],
  INVITE_TO_SUPPORT_CHECKIN: null,
  LINK_EXISTING_CASE: ["CONNECTED"],
  OPEN_CASE: ["CONNECTED"],
  CREATE_REFERRAL: ["REFERRED"],
  ESCALATE_TO_CRISIS_SAFETY: ["ESCALATED"],
  MARK_CONNECTED: ["CONNECTED"],
  MERGE_DUPLICATE: ["DUPLICATE"],
  CLOSE: ["CLOSED"],
};

/** Actions a professional can take from this status, given what the concern has. */
export function availableActions(detail) {
  if (!detail) return [];
  const allowed = TRANSITIONS[detail.status] || [];
  if (!allowed.length) return [];
  return Object.entries(ACTION_TARGET)
    .filter(([action, targets]) => {
      if (targets && !targets.some((target) => allowed.includes(target))) return false;
      const needsAccount = ["INVITE_TO_SUPPORT_CHECKIN", "LINK_EXISTING_CASE", "OPEN_CASE", "CREATE_REFERRAL", "ESCALATE_TO_CRISIS_SAFETY"].includes(action);
      if (needsAccount && !detail.student?.hasMindConnectAccount) return false;
      if (action === "LINK_EXISTING_CASE" && !detail.openCase) return false;
      if (action === "OPEN_CASE" && detail.openCase) return false;
      if (action === "MERGE_DUPLICATE" && !(detail.possibleDuplicates || []).length) return false;
      return true;
    })
    .map(([action]) => action);
}

export const ACTION_LABELS = {
  ACKNOWLEDGE: "Acknowledge",
  REQUEST_INFORMATION: "Ask the reporter a question",
  RECORD_CONTACT_ATTEMPT: "Record a contact attempt",
  INVITE_TO_SUPPORT_CHECKIN: "Invite the student to a support check-in",
  LINK_EXISTING_CASE: "Link to the student's open case",
  OPEN_CASE: "Open a counselling case",
  CREATE_REFERRAL: "Refer to a verified service",
  ESCALATE_TO_CRISIS_SAFETY: "Escalate to Crisis Safety",
  MARK_CONNECTED: "Mark connected to support",
  MERGE_DUPLICATE: "Merge as duplicate",
  CLOSE: "Close",
};

// ---------------------------------------------------------------------------
// Outcomes
// ---------------------------------------------------------------------------

/**
 * Chart points for one measure. Only valid completed scores are plotted.
 * Anything else becomes a gap (null), never a zero, and a changed scoring
 * version starts a new series so incomparable scores are never joined.
 */
export function chartSeries(measure) {
  const points = (measure?.points || []).filter((point) => ["COMPLETED", "INVALID", "DECLINED", "EXPIRED"].includes(point.status));
  const versions = [...new Set(points.map((point) => point.scoringVersion))];
  return points.map((point) => {
    const row = { at: point.completedAt || point.availableAt, purpose: point.purpose, status: point.status };
    for (const version of versions) {
      row[version] = point.scoringVersion === version && point.status === "COMPLETED" && point.valid && typeof point.rawScore === "number" ? point.rawScore : null;
    }
    return row;
  });
}

/** Plain description of change for the professional. Reliability is named only when the method is approved. */
export function changeSummary(change) {
  if (!change) return "Only one comparable measure so far.";
  if (!change.comparable) return change.reason === "SCORING_VERSION_CHANGED" ? "Not comparable: the scoring version changed." : "Not comparable.";
  const direction = change.direction === "FEWER_DIFFICULTIES" ? "fewer difficulties" : change.direction === "MORE_DIFFICULTIES" ? "more difficulties" : "no change";
  const sign = change.rawChange > 0 ? `+${change.rawChange}` : String(change.rawChange);
  const band = change.bandMovement === "BETTER_BAND" ? ", moved to a lower band" : change.bandMovement === "WORSE_BAND" ? ", moved to a higher band" : "";
  const reliable = change.methodologyApproved ? `; ${readable(change.reliableChange)} (approved method)` : "; descriptive only, no reliable-change method approved";
  return `${sign} since baseline (${direction}${band})${reliable}.`;
}

export const SIGNAL_LABELS = {
  SAFETY_RESPONSE: "Safety response in a check-in",
  SIGNIFICANT_WORSENING: "Reliable worsening since baseline",
  NO_MEANINGFUL_PROGRESS: "No reliable progress across follow-ups",
  BAND_WORSENED: "Moved to a higher band",
  MISSED_REVIEW: "Review check-in not completed",
  CARE_GOAL_STALLED: "Goal progress unchanged across reviews",
};
