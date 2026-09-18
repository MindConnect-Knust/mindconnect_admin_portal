const APP_ENV = String(import.meta.env.VITE_APP_ENV || (import.meta.env.PROD ? 'production' : 'development')).trim().toLowerCase();
const PRODUCTION_API_HOST = 'mind-connect-backend-wg2b.onrender.com';
// Development talks to the backend on this machine (and its mindconnect_dev
// database). It never falls back to, or may be pointed at, the production API.
const DEFAULT_API_URL = APP_ENV === 'development' ? 'http://localhost:5000/api' : `https://${PRODUCTION_API_HOST}/api`;
const RAW_API_URL = String(
  import.meta.env.VITE_API_URL || DEFAULT_API_URL
).trim().replace(/\/+$/, '');
const SESSION_KEY = 'admin_portal_session';
const REQUEST_TIMEOUT_MS = 60000;
const CLIENT_TYPE = 'admin-web';
const APP_VERSION = String(import.meta.env.VITE_APP_VERSION || '0.0.0').trim();
const APP_BUILD = String(import.meta.env.VITE_BUILD_REVISION || import.meta.env.VITE_COMMIT_SHA || 'local').trim();
const safeHeaderValue = (value, fallback) => {
  const normalized = String(value || fallback || '').trim().slice(0, 128);
  return /^[A-Za-z0-9._-]{1,128}$/.test(normalized) ? normalized : fallback;
};
let refreshPromise = null;

const resolveApiBaseUrl = () => {
  const candidate = RAW_API_URL;
  if (!candidate) return { url: '', error: 'The admin portal is missing VITE_API_URL.' };
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return { url: '', error: 'The admin portal API URL is invalid.' };
  }
  if (!/\/api\/?$/.test(parsed.pathname)) return { url: '', error: 'The admin portal API URL must end with /api.' };
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    return { url: '', error: 'The admin portal API URL cannot contain credentials, a query string, or a fragment.' };
  }
  if (APP_ENV === 'development' && parsed.hostname.toLowerCase() === PRODUCTION_API_HOST) {
    return { url: '', error: 'Local development cannot use the production API. Set VITE_API_URL=http://localhost:5000/api and run the backend locally.' };
  }
  if (APP_ENV !== 'development') {
    const host = parsed.hostname.toLowerCase();
    const private172 = host.match(/^172\.(\d{1,2})\./);
    const privateHost = host === 'localhost' || /^127\./.test(host) || /^10\./.test(host) ||
      /^192\.168\./.test(host) || (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31);
    if (parsed.protocol !== 'https:' || privateHost || /ngrok|metro/.test(host) || /\.(?:invalid|example)$/.test(host)) {
      return { url: '', error: 'The admin portal release API must use an explicit public HTTPS endpoint.' };
    }
  }
  return { url: candidate, error: null };
};

const resolved = resolveApiBaseUrl();
export const API_BASE_URL = resolved.url;
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
export const API_CONFIGURATION_ERROR = resolved.error;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('MindConnect services took too long to respond. Please try again; the first request after inactivity may be slower.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

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
    if (!session?.refreshToken) {
      sessionStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new Event('mindconnect:session-expired'));
      return null;
    }
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.accessToken || !data?.refreshToken) {
        sessionStorage.removeItem(SESSION_KEY);
        window.dispatchEvent(new Event('mindconnect:session-expired'));
        return null;
      }
      updateStoredTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new Event('mindconnect:session-expired'));
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function request(path, { method = 'GET', body } = {}, canRetry = true) {
  if (API_CONFIGURATION_ERROR) {
    const error = new Error(API_CONFIGURATION_ERROR);
    error.code = 'API_CONFIGURATION_ERROR';
    throw error;
  }
  const headers = {
    'Content-Type': 'application/json',
    'X-MindConnect-Client': CLIENT_TYPE,
    'X-MindConnect-Platform': 'web',
    'X-MindConnect-App-Version': safeHeaderValue(APP_VERSION, '0.0.0'),
    'X-MindConnect-App-Build': safeHeaderValue(APP_BUILD, 'local'),
    'X-MindConnect-Bundle-ID': 'mindconnect-admin-portal',
    'X-MindConnect-Environment': safeHeaderValue(APP_ENV, 'development'),
  };
  const token = getSession()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && canRetry && !path.startsWith('/auth/')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request(path, { method, body }, false);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.success === false) {
    const error = new Error(data?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = data?.code;
    error.data = data?.data;
    throw error;
  }
  return data;
}

/**
 * Authenticated download for non-JSON responses such as CSV exports.
 *
 * `request` always parses JSON, which is right for the API and wrong for a file.
 * This returns a Blob and a filename; the caller decides how to save it. A 401
 * gets one refresh attempt, like every other request.
 */
async function download(path, canRetry = true) {
  if (API_CONFIGURATION_ERROR) {
    const error = new Error(API_CONFIGURATION_ERROR);
    error.code = 'API_CONFIGURATION_ERROR';
    throw error;
  }
  const token = getSession()?.token;
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'X-MindConnect-Client': CLIENT_TYPE,
      'X-MindConnect-Platform': 'web',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (response.status === 401 && canRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return download(path, false);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const error = new Error(data?.error || `Download failed (${response.status})`);
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  return { blob: await response.blob(), filename: match ? match[1] : 'mindconnect-export.csv' };
}

export const http = {
  download,
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
