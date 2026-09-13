import { http } from "./http";
import { withQuery } from "./query";

/**
 * Counselling case API client.
 *
 * `canCase` only decides what to render. Every request is re-authorised on the
 * server, which additionally requires *assignment* to a case — holding
 * CASE_VIEW_ASSIGNED opens your own caseload, not everybody's.
 */
export { canCase } from "./portalPermissions";

const enc = encodeURIComponent;

export const caseApi = {
  config: async () => (await http.get("/cases/config")).data,
  dashboard: async () => (await http.get("/cases/dashboard")).data,
  queue: async (queue, params = {}) => {
    const response = await http.get(withQuery(`/cases/queues/${enc(queue)}`, params));
    return { items: response.data || [], page: response.page || null };
  },
  myTasks: async () => (await http.get("/cases/tasks/mine")).data || [],
  waitlist: async () => (await http.get("/cases/waitlist")).data || [],
  completeTask: async (taskId, note) => (await http.post(`/cases/tasks/${enc(taskId)}/complete`, { note })).data,

  get: async (caseId, reason) => (await http.get(withQuery(`/cases/${enc(caseId)}`, { reason }))).data,
  timeline: async (caseId) => (await http.get(`/cases/${enc(caseId)}/timeline`)).data || [],
  wellbeing: async (caseId) => (await http.get(`/cases/${enc(caseId)}/wellbeing`)).data,
  sessions: async (caseId) => (await http.get(`/cases/${enc(caseId)}/sessions`)).data || [],
  carePlan: async (caseId) => (await http.get(`/cases/${enc(caseId)}/care-plan`)).data,

  notes: async (caseId) => (await http.get(`/cases/${enc(caseId)}/notes`)).data || [],
  readNote: async (caseId, noteId) => (await http.get(`/cases/${enc(caseId)}/notes/${enc(noteId)}`)).data,
  createNote: async (caseId, payload) => (await http.post(`/cases/${enc(caseId)}/notes`, payload)).data,
  amendNote: async (caseId, noteId, payload) =>
    (await http.patch(`/cases/${enc(caseId)}/notes/${enc(noteId)}`, payload)).data,

  recordSession: async (caseId, payload) => (await http.post(`/cases/${enc(caseId)}/sessions`, payload)).data,
  saveCarePlan: async (caseId, payload) => (await http.put(`/cases/${enc(caseId)}/care-plan`, payload)).data,
  recordConcerns: async (caseId, payload) => (await http.post(`/cases/${enc(caseId)}/concerns`, payload)).data,
  createTask: async (caseId, payload) => (await http.post(`/cases/${enc(caseId)}/tasks`, payload)).data,
  updateStatus: async (caseId, payload) => (await http.patch(`/cases/${enc(caseId)}/status`, payload)).data,

  assign: async (caseId, counsellorId) =>
    (await http.post(`/cases/${enc(caseId)}/assign`, counsellorId ? { counsellorId } : {})).data,
  handover: async (caseId, payload) => (await http.post(`/cases/${enc(caseId)}/handover`, payload)).data,
  respondHandover: async (caseId, handoverId, payload) =>
    (await http.post(`/cases/${enc(caseId)}/handover/${enc(handoverId)}/respond`, payload)).data,
  close: async (caseId, payload) => (await http.post(`/cases/${enc(caseId)}/close`, payload)).data,
  reopen: async (caseId, reason) => (await http.post(`/cases/${enc(caseId)}/reopen`, { reason })).data,
};
