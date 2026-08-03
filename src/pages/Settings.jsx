import { useState } from "react";
import { Bell, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Avatar from "../components/common/Avatar";

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start justify-between gap-4 py-3.5">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand-600" : "bg-slate-200"}`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </label>
  );
}

export default function Settings() {
  const { admin } = useAuth();
  const { notify } = useToast();
  const [name, setName] = useState(admin?.name || "");
  const [email, setEmail] = useState(admin?.email || "");
  const [prefs, setPrefs] = useState({
    newApplications: true,
    lowRatingFlags: true,
    weeklyDigest: false,
  });

  const handleSave = (e) => {
    e.preventDefault();
    notify("Account settings saved.", "success");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Manage your admin account and notification preferences.</p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar name={name || "Admin"} size="xl" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{admin?.role}</p>
            <p className="text-xs text-slate-400">Program Administrator account</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-5 flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <Save size={15} /> Save changes
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Notification preferences</h3>
        </div>
        <div className="divide-y divide-slate-100">
          <Toggle
            checked={prefs.newApplications}
            onChange={(v) => setPrefs((p) => ({ ...p, newApplications: v }))}
            label="New applications"
            description="Get notified when someone applies to become a counsellor or peer counsellor."
          />
          <Toggle
            checked={prefs.lowRatingFlags}
            onChange={(v) => setPrefs((p) => ({ ...p, lowRatingFlags: v }))}
            label="Low rating flags"
            description="Get notified when a counsellor or peer counsellor's average rating drops significantly."
          />
          <Toggle
            checked={prefs.weeklyDigest}
            onChange={(v) => setPrefs((p) => ({ ...p, weeklyDigest: v }))}
            label="Weekly digest"
            description="A weekly summary of applications, activity, and program health."
          />
        </div>
      </div>
    </div>
  );
}
