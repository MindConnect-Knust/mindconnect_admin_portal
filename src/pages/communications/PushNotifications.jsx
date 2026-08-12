import { useCallback, useEffect, useState } from 'react';
import {
  Bell, CheckCircle2, Clock, Info, RefreshCcw, Send,
  ShieldAlert, Smartphone, Sparkles, XCircle
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  adminSelfTestPush,
  cancelPushCampaign,
  confirmPushCampaign,
  createPushCampaign,
  getPushCampaignStats,
  getPushHealth,
  listPushCampaigns,
  previewPushCampaign,
} from '../../services/pushApi';

const initialForm = {
  name: '',
  title: '',
  body: '',
  category: 'content',
  audienceType: 'ROLE',
  roles: ['student'],
  route: 'home',
  entityId: '',
  scheduledFor: '',
};

const chip = (status) => {
  const styles = {
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    sending: 'bg-amber-50 text-amber-700 border-amber-200',
    sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return `rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase border ${styles[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`;
};

export default function PushNotifications() {
  const { notify } = useToast();
  const [health, setHealth] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextHealth, nextCampaigns] = await Promise.all([getPushHealth(), listPushCampaigns(100)]);
      setHealth(nextHealth);
      setCampaigns(nextCampaigns);
    } catch (error) {
      notify(error.message || 'Could not load push notifications.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const toggleRole = (role) => {
    setForm((current) => {
      const exists = current.roles.includes(role);
      const nextRoles = exists
        ? current.roles.filter((r) => r !== role)
        : [...current.roles, role];
      return { ...current, roles: nextRoles };
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (form.audienceType === 'ROLE' && form.roles.length === 0) {
      notify('Please select at least one target role.', 'error');
      return;
    }
    setSaving(true);
    try {
      const campaign = await createPushCampaign({
        ...form,
        roles: form.audienceType === 'ROLE' ? form.roles : [],
        scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : undefined,
      });
      const previewData = await previewPushCampaign(campaign._id);
      setPreview(previewData);
      setForm(initialForm);
      await load();
      notify('Campaign draft created successfully. Preview and confirm when ready to broadcast.', 'success');
    } catch (error) {
      notify(error.message || 'Could not create campaign.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSelfTest = async () => {
    setTesting(true);
    try {
      await adminSelfTestPush({
        title: 'Admin Verification Push',
        body: 'Push delivery service test from MindConnect Admin Console.',
        route: 'home',
      });
      notify('Test notification queued for your registered admin device.', 'success');
      await load();
    } catch (error) {
      notify(error.message || 'Could not send test push.', 'error');
    } finally {
      setTesting(false);
    }
  };

  const confirm = async (campaign) => {
    const targetCount = campaign.audienceCount || 'all selected';
    if (!window.confirm(`Are you sure you want to broadcast this campaign to ${targetCount} recipient(s)?`)) return;
    try {
      await confirmPushCampaign(campaign._id);
      await load();
      notify('Campaign confirmed and scheduled for delivery.', 'success');
    } catch (error) {
      notify(error.message || 'Could not confirm campaign.', 'error');
    }
  };

  const cancel = async (campaign) => {
    if (!window.confirm(`Cancel campaign "${campaign.name}"?`)) return;
    try {
      await cancelPushCampaign(campaign._id);
      await load();
      notify('Campaign cancelled.', 'success');
    } catch (error) {
      notify(error.message || 'Could not cancel campaign.', 'error');
    }
  };

  const refreshStats = async (campaign) => {
    try {
      await getPushCampaignStats(campaign._id);
      await load();
      notify('Refreshed campaign delivery stats.', 'success');
    } catch (error) {
      notify(error.message || 'Could not refresh stats.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Push Notifications Console</h1>
          <p className="text-sm text-slate-500 mt-1">
            System health, device delivery metrics, and targeted broadcast campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelfTest}
            disabled={testing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50"
          >
            <Smartphone size={16} className="text-slate-500" />
            {testing ? 'Queuing test...' : 'Send Test Push to Me'}
          </button>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCcw size={16} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Manual Action Warning Banner */}
      {health && !health.providerConfigured && (
        <div className="flex gap-3.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          <ShieldAlert size={20} className="shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">Provider Access Token Required (MANUAL_ACTION_REQUIRED)</p>
            <p className="text-amber-800">
              The backend env variable <code>EXPO_PUSH_ACCESS_TOKEN</code> is currently not configured.
              Notifications will queue safely in MongoDB outbox, but Expo delivery cannot leave the backend worker until the access token is set.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Active Push Devices"
          value={health?.activeDevices ?? 0}
          icon={Smartphone}
          detail="Registered & enabled devices"
        />
        <Metric
          label="Outbox Pending Queue"
          value={health?.pendingOutbox ?? 0}
          icon={Clock}
          detail={health?.workersEnabled ? 'Worker active (5s poll)' : 'Worker PAUSED'}
          highlight={health?.pendingOutbox > 50}
        />
        <Metric
          label="Delivery Provider"
          value={health?.providerConfigured ? 'READY' : 'UNCONFIGURED'}
          icon={Send}
          detail={health?.lastSuccessfulPushAt ? `Last push: ${new Date(health.lastSuccessfulPushAt).toLocaleTimeString()}` : 'No recent deliveries'}
          statusColor={health?.providerConfigured ? 'text-emerald-600' : 'text-amber-600'}
        />
        <Metric
          label="Failures (Last Hour)"
          value={health?.failedLastHour ?? 0}
          icon={XCircle}
          detail={`${health?.invalidTokensLast24h ?? 0} invalid tokens pruned (24h)`}
          statusColor={health?.failedLastHour > 0 ? 'text-rose-600' : 'text-slate-900'}
        />
      </div>

      {/* Campaign Creation Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles size={18} className="text-brand-600" />
          <h2 className="text-base font-bold text-slate-900">Broadcast Campaign Composer</h2>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Campaign Internal Name</label>
              <input
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="e.g. Exam Stress Reduction Campaign"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Notification Title (Max 100 chars)</label>
              <input
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="e.g. Take a 5-minute MindConnect Joy Break!"
                maxLength={100}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Notification Body (Max 180 chars)</label>
              <textarea
                value={form.body}
                onChange={(e) => setField('body', e.target.value)}
                className="w-full min-h-[72px] rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Write a clear, non-stigmatizing message for student lock-screens..."
                maxLength={180}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Notification Category</label>
              <select
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="content">Content & Wellbeing</option>
                <option value="optionalReminders">Optional Reminders</option>
                <option value="system">System / Important</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Target Route Destination</label>
              <select
                value={form.route}
                onChange={(e) => setField('route', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="home">Home Dashboard</option>
                <option value="inbox">Inbox</option>
                <option value="appointments">Appointments</option>
                <option value="content">Content Library</option>
                <option value="resources">Resources</option>
                <option value="events">Events</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Optional Target Entity ID</label>
              <input
                value={form.entityId}
                onChange={(e) => setField('entityId', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                placeholder="Resource ID, Event ID, or Content ID"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Schedule For (Leave empty for Immediate)</label>
              <input
                type="datetime-local"
                value={form.scheduledFor}
                onChange={(e) => setField('scheduledFor', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Audience Target Roles</label>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: 'student', label: 'Students' },
                  { id: 'peer_listener', label: 'Peer Listeners' },
                  { id: 'counsellor', label: 'Counsellors' },
                ].map(({ id, label }) => (
                  <label key={id} className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-700 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={form.roles.includes(id)}
                      onChange={() => toggleRole(id)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 shadow-sm disabled:opacity-60 transition-colors"
            >
              <Send size={16} /> Create Campaign Draft
            </button>
          </div>
        </form>
      </div>

      {/* Preview Card */}
      {preview && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-950 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Info size={20} className="shrink-0 text-blue-600" />
            <div>
              <p className="font-bold text-blue-900">Campaign Preview: {preview.title}</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Targeting <strong>{preview.audienceCount}</strong> active user account(s).
                Est. opted-out users: {preview.optedOutEstimate || 0} | Est. reachable devices: {preview.eligibleEstimate || preview.audienceCount}.
                Route: <code>{preview.route}</code>
              </p>
            </div>
          </div>
          <button
            onClick={() => setPreview(null)}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Campaigns List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Push Notification Campaigns</h2>
          <span className="text-xs text-slate-500 font-medium">{campaigns.length} Total Campaigns</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Campaign Name & Title</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Audience</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Delivery Stats</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((campaign) => (
                <tr key={campaign._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{campaign.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{campaign.title}</div>
                  </td>
                  <td className="px-4 py-4 text-xs font-medium text-slate-600">
                    <span className="capitalize">{campaign.category}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-xs font-semibold">
                    {campaign.audienceCount || 0} user(s)
                  </td>
                  <td className="px-4 py-4">
                    <span className={chip(campaign.status)}>{campaign.status}</span>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-600">
                    <div className="font-mono">
                      Q: {campaign.stats?.queued || 0} | T: {campaign.stats?.ticketed || 0} | D: {campaign.stats?.delivered || 0} | F: {campaign.stats?.failed || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => previewPushCampaign(campaign._id).then(setPreview)}
                        className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Preview
                      </button>

                      {['draft', 'scheduled'].includes(campaign.status) && (
                        <button
                          onClick={() => confirm(campaign)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                        >
                          <CheckCircle2 size={13} /> Confirm
                        </button>
                      )}

                      {['draft', 'scheduled'].includes(campaign.status) && (
                        <button
                          onClick={() => cancel(campaign)}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
                        >
                          <XCircle size={13} /> Cancel
                        </button>
                      )}

                      <button
                        onClick={() => refreshStats(campaign)}
                        className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Stats
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && campaigns.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-slate-500" colSpan={6}>
                    <Bell size={28} className="mx-auto text-slate-300 mb-2" />
                    No notification campaigns created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon, detail, highlight, statusColor = 'text-slate-900' }) {
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm space-y-2 ${highlight ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between text-slate-500">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        <Icon size={18} className="text-slate-400" />
      </div>
      <div className={`text-2xl font-bold tracking-tight ${statusColor}`}>{value}</div>
      {detail && <div className="text-xs text-slate-500">{detail}</div>}
    </div>
  );
}