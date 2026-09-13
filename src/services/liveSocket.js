import { io } from "socket.io-client";
import { API_ORIGIN } from "./http";

const SESSION_KEY = "admin_portal_session";

const accessToken = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null")?.token || "";
  } catch {
    return "";
  }
};

/**
 * Subscribes to events on the signed-in person's own socket room.
 *
 * The server only ever emits to `user:<id>` for these events and carries ids or
 * counts, never names or content, so a page refetches through the authorised
 * API when something changes. Returns an unsubscribe function.
 */
export function subscribeToEvents(events, onEvent) {
  const socket = io(API_ORIGIN, {
    auth: { token: accessToken() },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelayMax: 10000,
  });
  events.forEach((event) => socket.on(event, (payload) => onEvent(event, payload)));
  // Anything missed while disconnected is picked up by refetching on reconnect.
  socket.on("connect", () => onEvent("connect", null));
  return () => socket.disconnect();
}
