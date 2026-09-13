import { useCallback, useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { staffConcernApi } from "../../services/staffConcernApi";
import { subscribeToEvents } from "../../services/liveSocket";
import { StatusBadge } from "./staffUi";

/**
 * The reporter's closed loop: what they referred and where it stands, in the
 * five statuses they are allowed to see. No assignment, appointment, case,
 * treatment or crisis information is ever returned by the API, so none can be
 * shown here.
 */
export default function MyReferrals() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [responses, setResponses] = useState({});
  const [sending, setSending] = useState("");

  const load = useCallback(() => {
    staffConcernApi.mine().then((data) => { setRows(data); setError(""); }).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
    // A status change creates an in-app notification on this account's own socket.
    return subscribeToEvents(["notification:new"], (event, payload) => {
      if (event === "connect" || payload?.route === "staff-referral") load();
    });
  }, [load]);

  const respond = async (id) => {
    setSending(id);
    try {
      await staffConcernApi.clarify(id, responses[id] || "");
      setResponses((current) => ({ ...current, [id]: "" }));
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending("");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">My referrals</h1>
      {error && <p role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {rows === null && !error && <p className="text-sm text-slate-500">Loading…</p>}
      {rows?.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">You have not made any referrals.</p>}
      <ul className="space-y-3">
        {(rows || []).map((row) => (
          <li key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{row.studentDisplayName}{row.studentRef ? ` · ${row.studentRef}` : ""}</p>
                <p className="text-xs text-slate-500">{row.reference} · submitted {new Date(row.submittedAt).toLocaleString()}</p>
                <p className="mt-1 text-xs text-slate-600">{row.categoryLabels.join(", ")}</p>
              </div>
              <StatusBadge status={row.status} label={row.statusLabel} />
            </div>
            <p className="mt-2 text-sm text-slate-700">{row.message}</p>
            {row.clarificationRequest && (
              <div className="mt-3 rounded-xl border-2 border-amber-400 bg-amber-50 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-950"><MessageSquareText size={16} aria-hidden="true" /> The support team asks:</p>
                <p className="mt-1 text-sm text-amber-950">{row.clarificationRequest.question}</p>
                <label htmlFor={`response-${row.id}`} className="mt-2 block text-sm font-semibold text-slate-800">Your answer</label>
                <textarea id={`response-${row.id}`} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" maxLength={2000} value={responses[row.id] || ""} onChange={(event) => setResponses((current) => ({ ...current, [row.id]: event.target.value }))} />
                <button type="button" disabled={sending === row.id || !(responses[row.id] || "").trim()} onClick={() => respond(row.id)} className="mt-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                  {sending === row.id ? "Sending…" : "Send answer"}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
