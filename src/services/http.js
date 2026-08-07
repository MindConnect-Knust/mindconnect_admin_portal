// Minimal fetch wrapper for talking to the real MindConnect backend.
// Throws a plain Error with a human-readable .message on any non-2xx
// response, matching what AuthContext/DataContext already expect from
// the mock api.js functions they call.

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Token travels inside the same sessionStorage session object AuthContext
// already persists (key "admin_portal_session"), so logging out clears it
// in one place instead of two.
const SESSION_KEY = "admin_portal_session";

function getToken() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw).token : null;
  } catch {
    return null;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // No JSON body (e.g. network-level failure) — fall through to the
    // generic error below.
  }

  if (!response.ok || !data || data.success === false) {
    throw new Error((data && data.error) || `Request failed (${response.status})`);
  }

  return data;
}

export const http = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};
