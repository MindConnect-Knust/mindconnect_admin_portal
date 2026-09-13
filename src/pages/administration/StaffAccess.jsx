import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { canAdmin } from "../../services/portalPermissions";
import { staffAccessApi } from "../../services/staffConcernApi";
import { readable } from "../../services/scope3Format";

/**
 * Staff referral access. Invite verified individuals, remove access, and import
 * the university's student directory. An email domain never grants access.
 */
const ROLES = ["LECTURER", "ACADEMIC_ADVISOR", "COLLEGE_STAFF", "HALL_STAFF", "DOSA_STAFF", "STUDENT_SUPPORT_STAFF", "SECURITY_STAFF", "OTHER_AUTHORISED_STAFF"];
const input = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30";

export default function StaffAccess() {
  const { admin } = useAuth();
  const { notify } = useToast();
  const canManage = canAdmin(admin, "STAFF_ACCESS_MANAGE");
  const canImport = canAdmin(admin, "INSTITUTIONAL_DIRECTORY_MANAGE");
  const [invitations, setInvitations] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ email: "", name: "", staffRole: "LECTURER", department: "", verificationNote: "" });
  const [link, setLink] = useState("");
  const [directory, setDirectory] = useState({ source: "", importBatch: "", json: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!canManage) return;
    try {
      const [inviteRows, staffRows] = await Promise.all([staffAccessApi.invitations(), staffAccessApi.staff()]);
      setInvitations(inviteRows);
      setStaff(staffRows);
    } catch (error) {
      notify(error.message, "error");
    }
  }, [canManage, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const invite = async (event) => {
    event.preventDefault();
    setBusy(true);
    setLink("");
    try {
      const result = await staffAccessApi.invite(form);
      if (!result.delivered && result.acceptLink) setLink(result.acceptLink);
      notify(result.delivered ? "Invitation emailed" : "Invitation created. Email is not configured; pass the link on securely.", "success");
      setForm({ email: "", name: "", staffRole: "LECTURER", department: "", verificationNote: "" });
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const importRecords = async (event) => {
    event.preventDefault();
    let records;
    try {
      records = JSON.parse(directory.json);
    } catch {
      notify("The directory data must be a JSON array of { studentRef, fullName, programme, college }.", "error");
      return;
    }
    setBusy(true);
    try {
      const result = await staffAccessApi.importDirectory({ source: directory.source, importBatch: directory.importBatch, records });
      notify(`Imported: ${result.inserted} new, ${result.updated} updated, ${result.rejected} rejected`, "success");
      setDirectory({ ...directory, json: "" });
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (!canManage && !canImport) return <p className="text-sm text-slate-500">You do not have staff access administration permissions.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Staff referral access</h2>

      {canManage && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Invite a verified staff member</h3>
          <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={invite}>
            <div><label className="text-xs font-semibold text-slate-600" htmlFor="invite-email">Institutional email</label><input id="invite-email" type="email" required className={input} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            <div><label className="text-xs font-semibold text-slate-600" htmlFor="invite-name">Name</label><input id="invite-name" className={input} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div><label className="text-xs font-semibold text-slate-600" htmlFor="invite-role">Role</label><select id="invite-role" className={input} value={form.staffRole} onChange={(event) => setForm({ ...form, staffRole: event.target.value })}>{ROLES.map((role) => <option key={role} value={role}>{readable(role)}</option>)}</select></div>
            <div><label className="text-xs font-semibold text-slate-600" htmlFor="invite-dept">Department</label><input id="invite-dept" className={input} value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></div>
            <div className="sm:col-span-2"><label className="text-xs font-semibold text-slate-600" htmlFor="invite-verify">How was employment verified?</label><input id="invite-verify" required className={input} placeholder="e.g. Checked against the HR staff directory" value={form.verificationNote} onChange={(event) => setForm({ ...form, verificationNote: event.target.value })} /></div>
            <button type="submit" disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 sm:w-fit">Send invitation</button>
          </form>
          {link && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
              <p className="font-semibold">One-time link (shown once). Share it only with the invited person.</p>
              <p className="mt-1 break-all font-mono">{link}</p>
            </div>
          )}
        </section>
      )}

      {canManage && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Invitations</h3>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {invitations.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 py-2">
                  <span>{row.email} · {readable(row.staffRole)} · <strong>{readable(row.status)}</strong></span>
                  {row.status === "PENDING" && <button type="button" className="text-xs font-semibold text-rose-800 underline" onClick={async () => { await staffAccessApi.revoke(row.id).catch((error) => notify(error.message, "error")); load(); }}>Revoke</button>}
                </li>
              ))}
              {invitations.length === 0 && <li className="py-2 text-slate-500">None.</li>}
            </ul>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Staff with access</h3>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {staff.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 py-2">
                  <span>{row.name} · {readable(row.staffRole)}{row.department ? ` · ${row.department}` : ""} · <strong>{row.active ? "Active" : "Removed"}</strong></span>
                  {row.active && <button type="button" className="text-xs font-semibold text-rose-800 underline" onClick={async () => { if (window.confirm(`Remove referral access for ${row.name}? Their past referrals stay on record.`)) { await staffAccessApi.deactivate(row.id).catch((error) => notify(error.message, "error")); load(); } }}>Remove access</button>}
                </li>
              ))}
              {staff.length === 0 && <li className="py-2 text-slate-500">None.</li>}
            </ul>
          </section>
        </div>
      )}

      {canImport && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Import the university student directory</h3>
          <p className="mt-1 text-xs text-slate-500">Identification only: student number, name, programme, college. No wellbeing data. Use an authoritative export from the university registry.</p>
          <form className="mt-3 space-y-2" onSubmit={importRecords}>
            <div className="grid gap-2 sm:grid-cols-2">
              <div><label className="text-xs font-semibold text-slate-600" htmlFor="dir-source">Source</label><input id="dir-source" required className={input} placeholder="e.g. KNUST registry export" value={directory.source} onChange={(event) => setDirectory({ ...directory, source: event.target.value })} /></div>
              <div><label className="text-xs font-semibold text-slate-600" htmlFor="dir-batch">Batch name</label><input id="dir-batch" className={input} value={directory.importBatch} onChange={(event) => setDirectory({ ...directory, importBatch: event.target.value })} /></div>
            </div>
            <label className="text-xs font-semibold text-slate-600" htmlFor="dir-json">Records (JSON array)</label>
            <textarea id="dir-json" required className={`${input} min-h-32 font-mono text-xs`} value={directory.json} onChange={(event) => setDirectory({ ...directory, json: event.target.value })} />
            <button type="submit" disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Import</button>
          </form>
        </section>
      )}
    </div>
  );
}
