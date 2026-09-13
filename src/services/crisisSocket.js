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

export function subscribeToCrisisIncidents(onEvent) {
  const socket = io(API_ORIGIN, {
    auth: { token: accessToken() },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelayMax: 10000,
  });
  const events = [
    "crisis:incident:new",
    "crisis:incident:updated",
    "crisis:incident:escalated",
    "crisis:incident:location-updated",
  ];
  events.forEach((event) => socket.on(event, (payload) => onEvent(event, payload)));
  return () => socket.disconnect();
}
