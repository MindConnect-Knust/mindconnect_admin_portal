import { http } from './http';

export async function getPushHealth() {
  const data = await http.get('/notifications/admin/health');
  return data.data;
}

export async function listPushCampaigns(limit = 50) {
  const data = await http.get(`/notifications/admin/campaigns?limit=${limit}`);
  return data.data || [];
}

export async function createPushCampaign(fields) {
  const data = await http.post('/notifications/admin/campaigns', fields);
  return data.data;
}

export async function updatePushCampaign(id, fields) {
  const data = await http.put(`/notifications/admin/campaigns/${id}`, fields);
  return data.data;
}

export async function previewPushCampaign(id) {
  const data = await http.get(`/notifications/admin/campaigns/${id}/preview`);
  return data.data;
}

export async function confirmPushCampaign(id) {
  const data = await http.post(`/notifications/admin/campaigns/${id}/confirm`, { confirm: true });
  return data.data;
}

export async function cancelPushCampaign(id) {
  const data = await http.post(`/notifications/admin/campaigns/${id}/cancel`, {});
  return data.data;
}

export async function getPushCampaignStats(id) {
  const data = await http.get(`/notifications/admin/campaigns/${id}/stats`);
  return data.data;
}

/**
 * Send a test push notification to the admin's own registered devices.
 * Use this to verify Expo credentials and FCM delivery before broadcasting.
 */
export async function adminSelfTestPush({ title, body, route } = {}) {
  const data = await http.post('/notifications/admin/test', {
    title: title || 'Admin test notification',
    body: body || 'Push notification system is working correctly.',
    route: route || 'home',
  });
  return data.data;
}

export async function getAdminDeliveryStatus(id) {
  const data = await http.get(`/notifications/admin/deliveries/${id}`);
  return data.data;
}
