const target = String(process.argv[2] || '').trim().toLowerCase();
const expected = target === 'preview' ? 'staging' : target;
const url = String(process.env.VITE_API_URL || '').trim();
const failures = [];

if (!['staging', 'production'].includes(expected)) failures.push('Target must be staging or production.');
let parsed;
try {
  parsed = new URL(url);
} catch {
  failures.push('VITE_API_URL must be explicitly set to a valid URL.');
}

if (parsed) {
  const host = parsed.hostname.toLowerCase();
  const private172 = host.match(/^172\.(\d{1,2})\./);
  const privateHost = host === 'localhost' || /^127\./.test(host) || /^10\./.test(host) ||
    /^192\.168\./.test(host) || (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31);
  if (parsed.protocol !== 'https:') failures.push('VITE_API_URL must use HTTPS.');
  if (!/\/api\/?$/.test(parsed.pathname)) failures.push('VITE_API_URL must end with /api.');
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    failures.push('VITE_API_URL cannot contain credentials, a query string, or a fragment.');
  }
  if (privateHost || /ngrok|metro|expo/i.test(host)) failures.push('VITE_API_URL cannot use a local, private, tunnel, or development host.');
  if (/\.example$/i.test(host) || /placeholder|your-real-domain/i.test(url)) failures.push('VITE_API_URL is still a placeholder.');
}

const configuredAppEnv = String(process.env.VITE_APP_ENV || '').trim().toLowerCase();
if (configuredAppEnv && configuredAppEnv !== expected) {
  failures.push(`VITE_APP_ENV must be ${expected}.`);
}

if (failures.length) {
  console.error(`ADMIN_CONFIG_CHECK_FAILED (${expected})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`ADMIN_CONFIG_CHECK_PASSED (${expected})`);
console.log(`API origin: ${parsed.origin}`);
