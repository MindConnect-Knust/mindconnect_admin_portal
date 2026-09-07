import { http } from "./http";
import { mapAuditEvent } from "./providerMappers";

/**
 * Fetch unified administrative and security audit logs with server-side filtering and pagination.
 */
export async function getAuditLogs({
  page = 1,
  limit = 25,
  action,
  targetType,
  role,
  status,
  from,
  to,
  search,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (action) params.set("action", action);
  if (targetType) params.set("targetType", targetType);
  if (role) params.set("role", role);
  if (status) params.set("status", status);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (search) params.set("search", search);

  try {
    const data = await http.get(`/administration/audit-logs?${params}`);
    return {
      logs: (data.data || []).map(mapAuditEvent),
      total: data.total || (data.data || []).length,
      page: data.page || page,
      pages: data.pages || 1,
      limit: data.limit || limit,
    };
  } catch (err) {
    // Graceful fallback to legacy /providers/audit if administrationRouter is warming up
    if (err.status === 404) {
      const fallback = await http.get("/providers/audit");
      const mapped = (fallback.data || []).map(mapAuditEvent);
      return {
        logs: mapped.slice((page - 1) * limit, page * limit),
        total: mapped.length,
        page,
        pages: Math.ceil(mapped.length / limit) || 1,
        limit,
      };
    }
    throw err;
  }
}

/**
 * Fetch authoritative production operational metrics aggregated from MongoDB collections.
 */
export async function getProductionMetrics() {
  const data = await http.get("/administration/metrics");
  return data.data;
}

/**
 * Fetch authoritative server-side feature flags.
 */
export async function getFeatureFlags() {
  const data = await http.get("/administration/feature-flags");
  return data.data;
}

/**
 * Update server-side feature flags with required audit reason.
 */
export async function updateFeatureFlags(flags, reason) {
  const data = await http.put("/administration/feature-flags", { flags, reason });
  return data.data;
}
