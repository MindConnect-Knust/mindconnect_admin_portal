const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SESSION_KEY = "admin_portal_session";
let refreshPromise = null;

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function updateStoredTokens(accessToken, refreshToken) {
  const current = getSession();
  if (!current) return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, token: accessToken, refreshToken }));
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const session = getSession();
    if (!session?.refreshToken) return null;
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.accessToken || !data?.refreshToken) {
      sessionStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new Event("mindconnect:session-expired"));
      return null;
    }
    updateStoredTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function request(path, { method = "GET", body } = {}, canRetry = true) {
  const headers = { "Content-Type": "application/json" };
  const token = getSession()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && canRetry && !path.startsWith("/auth/")) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request(path, { method, body }, false);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.success === false) {
    const error = new Error(data?.error || 'Request failed (' + response.status + ')');
    error.status = response.status;
    error.code = data?.code;
    error.data = data?.data;
    throw error;
  }  return data;
}

export const http = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};