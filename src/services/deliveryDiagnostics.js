/**
 * Formatting and classification for the delivery diagnostics panel. Pure, with
 * no API client import, so it is tested directly. The request lives in pushApi.
 */

/** States that mean work is happening as it should. */
const OK_STATES = new Set(["ONLINE", "OK", "CHANGE_STREAM", "LISTENING"]);
/** States that mean nothing useful is happening. */
const DOWN_STATES = new Set(["OFFLINE", "NOT_RUNNING", "NOT_CONFIGURED", "FAILING"]);

/** "ok" | "warn" | "down" | "idle". Always rendered with an icon and a label, never colour alone. */
export function stateTone(state) {
  if (!state) return "idle";
  if (OK_STATES.has(state)) return "ok";
  if (DOWN_STATES.has(state)) return "down";
  if (state === "DISABLED" || state === "STARTING" || state === "UNKNOWN") return "idle";
  return "warn";
}

export function formatAge(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(Number(seconds))) return "—";
  const value = Math.max(0, Math.round(Number(seconds)));
  if (value < 60) return `${value}s`;
  if (value < 3600) return `${Math.floor(value / 60)}m ${value % 60}s`;
  return `${Math.floor(value / 3600)}h ${Math.floor((value % 3600) / 60)}m`;
}

export function formatMs(value) {
  if (value === null || value === undefined) return "—";
  return value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(1)} s`;
}

export const LANE_LABELS = {
  URGENT_TRANSACTIONAL: "Urgent (safety)",
  TRANSACTIONAL: "Transactional",
  BULK_CAMPAIGN: "Bulk / campaign",
};

/** Components in the order an operator checks them. */
export const COMPONENT_ROWS = [
  ["pushDispatcher", "Push dispatcher (worker)"],
  ["socketIO", "Socket.IO realtime"],
  ["expoProvider", "Expo push provider"],
  ["receiptWorker", "Receipt worker"],
  ["scheduler", "Notification scheduler"],
  ["crisisEscalationWorker", "Crisis escalation worker"],
  ["careNavigationWorker", "Care navigation worker"],
  ["analyticsWorker", "Analytics worker"],
  ["operationsWorker", "Operations worker"],
  ["reminderWorker", "Reminder worker"],
];

/** One line of detail per component. Operational fields only. */
export function componentDetail(key, component) {
  if (!component) return "";
  const when = (value) => (value ? new Date(value).toLocaleString() : "never");
  switch (key) {
    case "pushDispatcher":
      return [
        component.lastHeartbeatAt ? `heartbeat ${formatAge(component.heartbeatAgeSeconds)} ago` : "no heartbeat",
        component.changeStream ? `wake: ${component.changeStream}` : null,
        component.sameDatabaseAsWeb === false ? "DIFFERENT DATABASE FROM WEB" : null,
        component.deploymentId ? `deploy ${String(component.deploymentId).slice(0, 8)}` : null,
      ].filter(Boolean).join(" · ");
    case "socketIO":
      return [component.mode, component.lastPublishedAt ? `last publish ${when(component.lastPublishedAt)}` : null].filter(Boolean).join(" · ");
    case "expoProvider":
      return [component.configured ? "configured" : "not configured", component.lastErrorCode ? `last error ${component.lastErrorCode}` : null].filter(Boolean).join(" · ");
    case "receiptWorker":
      return `last run ${when(component.lastRunAt)}`;
    default:
      return [component.lastRunAt ? `last run ${when(component.lastRunAt)}` : null, component.lastErrorCode ? `error ${component.lastErrorCode}` : null].filter(Boolean).join(" · ");
  }
}
