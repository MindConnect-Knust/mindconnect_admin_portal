import { http } from "./http";
import { withQuery } from "./query";

/** The signed-in user's own notifications. The server scopes every call. */
export const notificationCentreApi = {
  list: async (params = {}) => {
    const response = await http.get(withQuery("/notifications/centre", params));
    return { items: response.data || [], page: response.page || null };
  },
  unreadCount: async () => (await http.get("/notifications/centre/unread-count")).data?.unread || 0,
  markRead: async (id) => (await http.post(`/notifications/centre/${encodeURIComponent(id)}/read`, {})).data,
  markAllRead: async () => (await http.post("/notifications/centre/read-all", {})).data,
  archive: async (id) => (await http.post(`/notifications/centre/${encodeURIComponent(id)}/archive`, {})).data,
};
