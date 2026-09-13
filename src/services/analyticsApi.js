import { http } from "./http";
import { withQuery } from "./query";

/**
 * Campus Wellbeing Intelligence API client.
 *
 * Every figure that comes back has already been through server-side
 * suppression. The dashboard renders `suppressed` cells as withheld; it must
 * never try to reconstruct them, and it cannot — the values are not sent.
 */
export { canAnalytics } from "./portalPermissions";

export const analyticsApi = {
  metrics: async () => (await http.get("/analytics/metrics")).data,
  overview: async (period = "30d") => (await http.get(withQuery("/analytics/overview", { period }))).data,
  metric: async (metricKey, params = {}) =>
    (await http.get(withQuery(`/analytics/metrics/${encodeURIComponent(metricKey)}`, params))).data,
  dataQuality: async () => (await http.get("/analytics/data-quality")).data,
  exportCsv: async (metrics, period = "30d") =>
    http.download(withQuery("/analytics/export", { metrics: metrics.join(","), period })),
};
