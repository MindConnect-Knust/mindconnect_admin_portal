import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Lock, ShieldAlert } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { outcomeApi } from "../../services/outcomeApi";
import { readable } from "../../services/scope3Format";

/**
 * Outcome instrument registry. Clinical governance: approve (with the KCC
 * reference), publish (freezes the content), activate. A licence that is not
 * verified cannot be approved; a published version cannot be edited.
 */
export default function InstrumentRegistry() {
  const { notify } = useToast();
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState("");
  const [references, setReferences] = useState({});

  const load = useCallback(async () => {
    try {
      setRows(await outcomeApi.instruments());
    } catch (error) {
      notify(error.message, "error");
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id, fn, message) => {
    setBusy(id);
    try {
      await fn();
      notify(message, "success");
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Outcome instruments</h2>
        <p className="text-sm text-slate-500">Versioned measures for measurement-based care. Nothing is offered to students until a version is approved, published and active.</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Instrument versions</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">Instrument</th><th className="px-4 py-3">Licence</th><th className="px-4 py-3">KCC approval</th><th className="px-4 py-3">State</th><th className="px-4 py-3">Used</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{row.shortName} v{row.version}</p>
                  <p className="text-xs text-slate-500">{row.name} · {readable(row.category)} · {row.itemCount} items · {row.validated ? "validated" : "not a validated instrument"}</p>
                  <p className="text-xs text-slate-500">Change method: {row.changeMethodologyApproved ? "approved" : "descriptive only"}</p>
                </td>
                <td className="px-4 py-3">{row.licenseStatus === "PENDING_LICENSE_REVIEW" || row.licenseStatus === "NOT_PERMITTED" ? <span className="inline-flex items-center gap-1 font-semibold text-rose-800"><ShieldAlert size={14} aria-hidden="true" /> {readable(row.licenseStatus)}</span> : readable(row.licenseStatus)}</td>
                <td className="px-4 py-3">{readable(row.clinicalApprovalStatus)}{row.approvalReference ? <p className="text-xs text-slate-500">{row.approvalReference}</p> : null}</td>
                <td className="px-4 py-3">
                  {row.active ? <span className="inline-flex items-center gap-1 font-semibold text-emerald-800"><CheckCircle2 size={14} aria-hidden="true" /> Active</span> : row.published ? <span className="inline-flex items-center gap-1 text-slate-700"><Lock size={14} aria-hidden="true" /> Published</span> : "Draft"}
                </td>
                <td className="px-4 py-3 tabular-nums">{row.administrations}</td>
                <td className="space-y-2 px-4 py-3">
                  {row.clinicalApprovalStatus !== "APPROVED" && !row.published && (
                    <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); act(row.id, () => outcomeApi.approveInstrument(row.id, { approvalReference: references[row.id] }), "Approval recorded"); }}>
                      <label className="sr-only" htmlFor={`ref-${row.id}`}>KCC approval reference</label>
                      <input id={`ref-${row.id}`} required className="w-40 rounded-lg border border-slate-200 px-2 py-1 text-xs" placeholder="KCC approval reference" value={references[row.id] || ""} onChange={(event) => setReferences({ ...references, [row.id]: event.target.value })} />
                      <button type="submit" disabled={busy === row.id} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold">Approve</button>
                    </form>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {row.clinicalApprovalStatus === "APPROVED" && !row.published && <button type="button" disabled={busy === row.id} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold" onClick={() => act(row.id, () => outcomeApi.publishInstrument(row.id), "Published and frozen")}>Publish</button>}
                    {row.published && !row.active && <button type="button" disabled={busy === row.id} className="rounded-lg border border-emerald-600 px-2 py-1 text-xs font-semibold text-emerald-800" onClick={() => act(row.id, () => outcomeApi.activateInstrument(row.id), "Activated")}>Activate</button>}
                    {row.active && <button type="button" disabled={busy === row.id} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold" onClick={() => act(row.id, () => outcomeApi.deactivateInstrument(row.id), "Deactivated")}>Deactivate</button>}
                    {row.published && <button type="button" disabled={busy === row.id} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold" onClick={() => act(row.id, () => outcomeApi.newInstrumentVersion(row.id), "New draft version created")}>New version</button>}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No instruments registered. Run the Scope 3 migration to register the drafts.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
