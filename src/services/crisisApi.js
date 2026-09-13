import { http } from "./http.js";

export { canCrisis } from "./crisisPermissions.js";

export const crisisApi = {
  async listActive() {
    const response = await http.get("/crisis/incidents/active");
    return response.data || [];
  },
  async getIncident(incidentId) {
    const response = await http.get(`/crisis/incidents/${encodeURIComponent(incidentId)}`);
    return response.data;
  },
  async acknowledge(incidentId) {
    return (await http.post(`/crisis/incidents/${encodeURIComponent(incidentId)}/acknowledge`, {})).data;
  },
  async assign(incidentId, responderId) {
    return (await http.post(`/crisis/incidents/${encodeURIComponent(incidentId)}/assign`, { responderId })).data;
  },
  async escalate(incidentId, reason) {
    return (await http.post(`/crisis/incidents/${encodeURIComponent(incidentId)}/escalate`, { reason })).data;
  },
  async resolve(incidentId, resolutionCode, resolutionNotes) {
    return (await http.post(`/crisis/incidents/${encodeURIComponent(incidentId)}/resolve`, {
      resolutionCode,
      resolutionNotes,
    })).data;
  },
  async breakGlass(incidentId, reason) {
    return (await http.post(`/crisis/incidents/${encodeURIComponent(incidentId)}/break-glass`, { reason })).data;
  },
  async onDuty() {
    const response = await http.get("/crisis/responders/on-duty");
    return response.data || [];
  },
  async listShifts() {
    const response = await http.get("/crisis/responders/shifts");
    return response.data || [];
  },
  async createShift(payload) {
    return (await http.post("/crisis/responders/shifts", payload)).data;
  },
};
