import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { staffAccessApi } from "../../services/staffConcernApi";

/**
 * Public page: a verified staff member sets up access from their invitation.
 * The token is single use and expires; an email address alone grants nothing.
 */
export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 10) return setError("Choose a password of at least 10 characters.");
    if (password !== confirm) return setError("The passwords do not match.");
    setBusy(true);
    setError("");
    try {
      await staffAccessApi.acceptInvitation({ token, password, name });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const field = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40";
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-lg font-bold text-slate-900">Set up your staff referral access</h1>
        {!token && <p role="alert" className="mt-3 text-sm text-rose-700">This link is missing its invitation token.</p>}
        {done ? (
          <div className="mt-4 space-y-3" aria-live="polite">
            <p className="text-sm text-slate-700">Your access is ready.</p>
            <Link to="/login" className="inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
            {error && <p role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-2 text-sm text-rose-800">{error}</p>}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-800">Your name <span className="font-normal text-slate-500">(optional)</span></label>
              <input id="name" className={field} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-800">Password</label>
              <input id="password" type="password" className={field} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-semibold text-slate-800">Confirm password</label>
              <input id="confirm" type="password" className={field} value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" />
            </div>
            <button type="submit" disabled={busy || !token} className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
              {busy ? "Setting up…" : "Activate access"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
