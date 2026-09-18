import { http } from "./http";

/**
 * Care Navigation API client.
 *
 * Two permissions gate two distinct jobs, and the portal should not blur them:
 * CARE_REFERRALS_VIEW is the coordination queue (who is waiting, did anything
 * happen), CARE_SERVICES_MANAGE is keeping campus contact details true.
 * Neither implies clinical access to a student's record, and neither is granted
 * by default — both have to be assigned deliberately.
 */
export { canCare } from "./portalPermissions";

/** `http.get` takes a path only, so query strings are built here. */
const withQuery = (path, params = {}) => {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return search ? `${path}?${search}` : path;
};

export const careNavigationApi = {
  async listReferrals(params = {}) {
    const response = await http.get(withQuery("/care-navigation/admin/referrals", params));
    return { items: response.data || [], page: response.page || null };
  },

  async referralSummary() {
    const response = await http.get("/care-navigation/admin/referrals/summary");
    return response.data || null;
  },

  /**
   * Claiming is atomic server-side and returns 409 when somebody else got there
   * first, so the UI reports "already taken" rather than silently showing two
   * coordinators as owner of the same referral.
   */
  async claimReferral(referralId) {
    const response = await http.post(
      `/care-navigation/admin/referrals/${encodeURIComponent(referralId)}/claim`,
      {}
    );
    return response.data;
  },

  async updateReferralStatus(referralId, payload) {
    const response = await http.post(
      `/care-navigation/admin/referrals/${encodeURIComponent(referralId)}/status`,
      payload
    );
    return response.data;
  },

  async listServices(params = {}) {
    const response = await http.get(withQuery("/care-navigation/admin/services", params));
    return { items: response.data || [], meta: response.meta || {} };
  },

  async updateService(serviceId, payload) {
    const response = await http.patch(
      `/care-navigation/admin/services/${encodeURIComponent(serviceId)}`,
      payload
    );
    return response.data;
  },

  async verifyService(serviceId) {
    const response = await http.post(
      `/care-navigation/admin/services/${encodeURIComponent(serviceId)}/verify`,
      { confirmed: true }
    );
    return response.data;
  },
};
