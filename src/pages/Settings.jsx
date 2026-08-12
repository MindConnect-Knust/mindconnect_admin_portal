import { useState, useEffect, useCallback } from "react";
import { Bell, Database, ShieldCheck, Activity, CheckCircle, XCircle, RefreshCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/common/Avatar";
import { getSystemHealth } from "../services/contentApi";

const safeguards = [
  {
    icon: ShieldCheck,
    title: "Server-authoritative access",
    description: "Provider approval, suspension, reinstatement, and revocation are enforced by the API and recorded in the governance audit trail.",
  },
  {
    icon: Bell,
    title: "Live review queue",
    description: "Sidebar badges reflect live data from the backend. Numbers update on every page load and manual refresh.",
  },
  {
    icon: Database,
    title: "Recorded activity only",
    description: "Portal counts come from provider applications, appointments, and peer conversations. MindConnect does not infer ratings or fabricate evaluations.",
  },
];

function HealthBadge({ status }) {
  if (status === "ok") return <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold"><CheckCircle size={13} /> Healthy</span>;
  if (status === "error") return <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-semibold"><XCircle size={13} /> Error</span>;
  return <span className="text-slate-400 text-xs">—</span>;
}

export default function Settings() {
  const { admin } = useAuth();
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(null);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await getSystemHealth();
      setHealth(data);
    } catch (err) {
      setHealthError(err.message || "Health check failed.");
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => { loadHealth(); }, [loadHealth]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Settings &amp; Health</h2>
        <p className="mt-1 text-sm text-slate-500">Administrator session and system status.</p>
      </div>

      {/* Admin session */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar name={admin?.name || "Admin"} size="xl" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">{admin?.name || "Administrator"}</p>
            <p className="truncate text-sm text-slate-500">{admin?.email}</p>
            <p className="mt-1 text-xs font-medium uppercase text-brand-700">{admin?.role}</p>
          </div>
        </div>
        <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-500">
          Account identity and credentials are managed by the MindConnect backend. This portal does not persist profile or notification settings that the server does not support.
        </p>
      </section>

      {/* System health */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Activity size={16} className="text-brand-600" /> System Health
          </h3>
          <button
            onClick={loadHealth}
            disabled={healthLoading}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <RefreshCcw size={12} className={healthLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {healthLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <RefreshCcw size={14} className="animate-spin" /> Checking…
          </div>
        )}
        {!healthLoading && healthError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <p className="font-semibold">Health check failed</p>
            <p className="text-xs mt-1">{healthError}</p>
          </div>
        )}
        {!healthLoading && health && (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">API Status</span>
              <HealthBadge status={health.status === "ok" ? "ok" : "error"} />
            </div>
            {health.services && Object.entries(health.services).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-700 capitalize">{key.replace(/_/g, " ")}</span>
                <HealthBadge status={value?.status || (value === "ok" ? "ok" : "error")} />
              </div>
            ))}
            {health.version && (
              <p className="text-xs text-slate-400 mt-2">Backend v{health.version} · {new Date().toLocaleString()}</p>
            )}
          </div>
        )}
      </section>

      {/* Portal safeguards */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Portal safeguards</h3>
        <div className="mt-3 divide-y divide-slate-100">
          {safeguards.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-3 py-4 first:pt-2 last:pb-0">
              <Icon size={18} className="mt-0.5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-medium text-slate-800">{title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}