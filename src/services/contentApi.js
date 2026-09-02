/**
 * contentApi.js
 * All content-management API calls for the MindConnect admin portal.
 * Covers: content library, video moderation, Joy Break, trusted sources,
 * source candidates, CMS (news/resources/events), and reports.
 *
 * Every call goes through the shared http client which handles auth,
 * token refresh, and error normalisation.
 */
import { http } from "./http";
import { mapSystemHealth } from "./systemHealth";

// ─── Content Library ──────────────────────────────────────────────────────────

export async function listContent({ status, type, joy, source, page = 1, limit = 40 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (type) params.set("type", type);
  if (joy) params.set("joy", "true");
  if (source) params.set("source", source);
  if (page > 1) params.set("page", String(page));
  params.set("limit", String(Math.min(limit, 300)));
  const data = await http.get(`/feed/manage/items?${params}`);
  return {
    items: data.data || [],
    count: data.count || 0,
    page: data.page || 1,
    pages: data.pages || 1,
    options: data.options || {},
  };
}

export async function createContentItem(fields) {
  const data = await http.post("/feed/manage/items", fields);
  return data.data;
}

export async function updateContentItem(id, fields) {
  const data = await http.put(`/feed/manage/items/${id}`, fields);
  return data.data;
}

export async function moderateContentItem(id, { action, value, reason }) {
  const data = await http.patch(`/feed/manage/items/${id}/moderation`, { action, value, reason });
  return data.data;
}

export async function archiveContentItem(id) {
  const data = await http.delete(`/feed/manage/items/${id}`);
  return data.data;
}

// ─── Trusted Sources ──────────────────────────────────────────────────────────

export async function listTrustedSources({ provider, approved } = {}) {
  const params = new URLSearchParams();
  if (provider) params.set("provider", provider);
  if (approved !== undefined) params.set("approved", String(approved));
  const data = await http.get(`/feed/manage/sources?${params}`);
  return { sources: data.data || [], count: data.count || 0, options: data.options || {} };
}

export async function createTrustedSource(fields) {
  const data = await http.post("/feed/manage/sources", fields);
  return data.data;
}

export async function updateTrustedSource(id, fields) {
  const data = await http.put(`/feed/manage/sources/${id}`, fields);
  return data.data;
}

export async function disableTrustedSource(id) {
  const data = await http.delete(`/feed/manage/sources/${id}`);
  return data.data;
}

export async function syncTrustedSource(id, { category, maxResults } = {}) {
  const data = await http.post(`/feed/manage/sources/${id}/sync`, { category, maxResults });
  return data.data;
}

// ─── Source Candidates ────────────────────────────────────────────────────────

export async function listSourceCandidates({ status, credibility } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (credibility) params.set("credibility", credibility);
  const data = await http.get(`/feed/manage/source-candidates?${params}`);
  return { candidates: data.data || [], count: data.count || 0, options: data.options || {} };
}

export async function updateSourceCandidate(id, fields) {
  const data = await http.put(`/feed/manage/source-candidates/${id}`, fields);
  return data.data;
}

export async function promoteSourceCandidate(id, fields) {
  const data = await http.post(`/feed/manage/source-candidates/${id}/promote`, fields);
  return data.data;
}

// ─── YouTube Discovery ────────────────────────────────────────────────────────

export async function searchYoutubeChannels(query, { maxResults = 8 } = {}) {
  const data = await http.post("/feed/manage/providers/youtube/search-channels", { query, maxResults });
  return {
    channels: data.data || [],
    count: data.count || 0,
    meta: data.meta || {},
  };
}

export async function addYoutubeChannelSource({
  channelId,
  trustLevel,
  sourceCategory,
  autoSyncEnabled = false,
}) {
  const data = await http.post("/feed/manage/providers/youtube/add-channel", {
    channelId,
    trustLevel,
    sourceCategory,
    autoSyncEnabled,
  });
  return data.data;
}

export async function resolveYoutubeVideo({ url, sourceId, category }) {
  const data = await http.post("/feed/manage/providers/youtube/resolve-video", {
    url,
    sourceId,
    category,
  });
  return data.data;
}

export async function importYoutubeVideo({
  url,
  sourceId,
  category,
  supportTags,
  eligibleSurfaces,
}) {
  const data = await http.post("/feed/manage/providers/youtube/import-video", {
    url,
    sourceId,
    category,
    supportTags,
    eligibleSurfaces,
  });
  return data.data;
}

// ─── Content Reports ──────────────────────────────────────────────────────────

export async function listContentReports({ status, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const data = await http.get(`/feed/manage/reports?${params}`);
  return {
    reports: data.data || [],
    count: data.count || 0,
    total: data.total || 0,
    page: data.page || 1,
    pages: data.pages || 1,
  };
}

export async function updateContentReport(id, action) {
  const data = await http.patch(`/feed/manage/reports/${id}`, { action });
  return data.data;
}

// ─── Dashboard Counts ─────────────────────────────────────────────────────────

/**
 * Returns lightweight counts for the dashboard without fetching full records.
 * Uses Promise.allSettled so a single failed count doesn't crash the whole dashboard.
 */
// Assessment Templates
export async function listAssessmentTemplates() {
  const data = await http.get('/content/assessment/manage');
  return { templates: data.data || [], count: data.count || 0 };
}

export async function saveAssessmentTemplate(fields) {
  const data = await http.put('/content/assessment/manage', fields);
  return data.data;
}
export async function getDashboardContentCounts() {
  const [videoPending, joyPending, published, openReports] = await Promise.allSettled([
    http.get("/feed/manage/items?status=review&type=VIDEO&limit=1").then((d) => d.count || 0),
    http.get("/feed/manage/items?joy=true&status=review&limit=1").then((d) => d.count || 0),
    http.get("/feed/manage/items?status=published&limit=1").then((d) => d.count || 0),
    http.get("/feed/manage/reports?status=open&limit=1").then((d) => d.total || 0),
  ]);
  return {
    videoPending: videoPending.status === "fulfilled" ? videoPending.value : null,
    joyPending: joyPending.status === "fulfilled" ? joyPending.value : null,
    published: published.status === "fulfilled" ? published.value : null,
    openReports: openReports.status === "fulfilled" ? openReports.value : null,
  };
}

// ─── System Health ────────────────────────────────────────────────────────────

export async function getSystemHealth() {
  const [base, pushResponse, aiResponse] = await Promise.all([
    http.get('/health'),
    http.get('/notifications/admin/health'),
    http.get('/ai/admin/health'),
  ]);
  return mapSystemHealth(base, pushResponse, aiResponse);
}

// ─── Appointments (admin) ─────────────────────────────────────────────────────

export async function listAppointmentsAdmin({ status, counsellor, from, to, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (counsellor) params.set("counsellor", counsellor);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const data = await http.get(`/appointments/admin?${params}`);
  return {
    appointments: data.data || [],
    count: data.count || 0,
    total: data.total || 0,
    page: data.page || 1,
    pages: data.pages || 1,
  };
}


