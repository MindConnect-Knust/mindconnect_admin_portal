import { http } from "./http";
import { withQuery } from "./query";

/**
 * Staff concern referral API clients.
 *
 * `staffConcernApi` is the reporter side (verified staff), `concernReviewApi`
 * the professional queue, `staffAccessApi` institutional administration. The
 * server enforces each boundary on its own, whatever the portal renders.
 */
export { canConcern, canStaff, isStaff } from "./portalPermissions";

const enc = encodeURIComponent;

export const staffConcernApi = {
  form: async () => (await http.get("/staff-concerns/form")).data,
  searchStudents: async (q) => (await http.get(withQuery("/staff-concerns/students/search", { q }))).data || [],
  submit: async (payload) => (await http.post("/staff-concerns", payload)).data,
  mine: async () => (await http.get("/staff-concerns/mine")).data || [],
  mineOne: async (id) => (await http.get(`/staff-concerns/mine/${enc(id)}`)).data,
  clarify: async (id, response) => (await http.post(`/staff-concerns/mine/${enc(id)}/clarification`, { response })).data,
  guidanceServices: async () => (await http.get("/staff-concerns/guidance/services")).data || [],
};

export const concernReviewApi = {
  config: async () => (await http.get("/staff-concerns/review/config")).data,
  reviewers: async () => (await http.get("/staff-concerns/review/reviewers")).data || [],
  queue: async (view, params = {}) => (await http.get(withQuery(`/staff-concerns/review/queues/${enc(view)}`, params))).data,
  detail: async (id) => (await http.get(`/staff-concerns/review/${enc(id)}`)).data,
  assign: async (id, assigneeId) => (await http.post(`/staff-concerns/review/${enc(id)}/assign`, assigneeId ? { assigneeId } : {})).data,
  disposition: async (id, payload) => (await http.post(`/staff-concerns/review/${enc(id)}/disposition`, payload)).data,
  referralDestinations: async () => (await http.get("/staff-concerns/review/referral-destinations")).data || [],
  searchAccounts: async (q) => (await http.get(withQuery("/staff-concerns/review/student-accounts", { q }))).data || [],
  linkStudent: async (id, studentUserId) => (await http.post(`/staff-concerns/review/${enc(id)}/link-student`, { studentUserId })).data,
};

export const staffAccessApi = {
  invitations: async () => (await http.get("/staff-access/invitations")).data || [],
  invite: async (payload) => (await http.post("/staff-access/invitations", payload)).data,
  revoke: async (id) => (await http.post(`/staff-access/invitations/${enc(id)}/revoke`, {})).data,
  staff: async () => (await http.get("/staff-access/staff")).data || [],
  deactivate: async (id) => (await http.post(`/staff-access/staff/${enc(id)}/deactivate`, {})).data,
  importDirectory: async (payload) => (await http.post("/staff-access/directory/import", payload)).data,
  acceptInvitation: async (payload) => (await http.post("/staff-access/invitations/accept", payload)).data,
};
