import { http } from "./http";
import { withQuery } from "./query";

/**
 * Measurement-based care API client (professional side).
 *
 * Every request is re-authorised on the server, which also requires access to
 * the case. `canOutcome` only decides what to render.
 */
export { canOutcome } from "./portalPermissions";

const enc = encodeURIComponent;

export const outcomeApi = {
  config: async () => (await http.get("/outcomes/config")).data,
  caseView: async (caseId, reason) => (await http.get(withQuery(`/outcomes/cases/${enc(caseId)}`, { reason }))).data,
  responses: async (caseId, administrationId) => (await http.get(`/outcomes/cases/${enc(caseId)}/checkins/${enc(administrationId)}/responses`)).data,
  offerable: async () => (await http.get("/outcomes/offerable-instruments")).data || [],
  schedule: async (caseId, payload) => (await http.post(`/outcomes/cases/${enc(caseId)}/checkins`, payload)).data,
  createGoal: async (caseId, payload) => (await http.post(`/outcomes/cases/${enc(caseId)}/goals`, payload)).data,
  updateGoal: async (caseId, goalId, payload) => (await http.patch(`/outcomes/cases/${enc(caseId)}/goals/${enc(goalId)}`, payload)).data,
  recordDecision: async (caseId, payload) => (await http.post(`/outcomes/cases/${enc(caseId)}/decisions`, payload)).data,
  acknowledgeSignal: async (caseId, signalId) => (await http.post(`/outcomes/cases/${enc(caseId)}/signals/${enc(signalId)}/acknowledge`, {})).data,
  resolveSignal: async (caseId, signalId, payload) => (await http.post(`/outcomes/cases/${enc(caseId)}/signals/${enc(signalId)}/resolve`, payload)).data,

  instruments: async () => (await http.get("/outcomes/instruments")).data || [],
  instrument: async (id) => (await http.get(`/outcomes/instruments/${enc(id)}`)).data,
  approveInstrument: async (id, payload) => (await http.post(`/outcomes/instruments/${enc(id)}/approve`, payload)).data,
  publishInstrument: async (id) => (await http.post(`/outcomes/instruments/${enc(id)}/publish`, {})).data,
  activateInstrument: async (id) => (await http.post(`/outcomes/instruments/${enc(id)}/activate`, {})).data,
  deactivateInstrument: async (id) => (await http.post(`/outcomes/instruments/${enc(id)}/deactivate`, {})).data,
  newInstrumentVersion: async (id) => (await http.post(`/outcomes/instruments/${enc(id)}/versions`, {})).data,
};
