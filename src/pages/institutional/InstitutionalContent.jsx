import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Database,
  GraduationCap,
  HeartHandshake,
  RefreshCcw,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import ModerationActions from '../../components/content/ModerationActions';
import { useToast } from '../../context/ToastContext';
import { getInstitutionalWorkspace } from '../../services/institutionalContentApi';

const TABS = [
  ['sources', 'Sources'],
  ['review', 'Review queue'],
  ['published', 'Published'],
  ['events', 'Events'],
  ['programmes', 'Programmes'],
  ['calendar', 'Academic calendar'],
  ['counsellors', 'Counsellors'],
  ['services', 'Support services'],
  ['health', 'Source health'],
];

const formatDate = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
};

const label = (value) => String(value || 'Not set').replaceAll('_', ' ');

function Status({ value, tone = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-rose-100 text-rose-700',
  };
  return <span className={'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ' + colors[tone]}>{label(value)}</span>;
}

function Table({ columns, rows, empty }) {
  if (!rows.length) return <EmptyState icon={Database} title={empty} description="No governed records currently match this view." />;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[880px] text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>{columns.map((column) => <th key={column.key} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">{column.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row._id || row.id || row.slug || row.key || row.academicYear} className="hover:bg-slate-50">
              {columns.map((column) => <td key={column.key} className="px-3 py-3 align-top text-xs text-slate-600">{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InstitutionalContent() {
  const { notify } = useToast();
  const [active, setActive] = useState('sources');
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setWorkspace(await getInstitutionalWorkspace());
    } catch (loadError) {
      setError(loadError.message || 'Institutional content could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const summary = workspace?.summary || {};
  const metrics = [
    ['Sources', summary.sources, ShieldCheck],
    ['In review', summary.pendingReview, BookOpen],
    ['Published', summary.published, CheckCircle2],
    ['Upcoming events', summary.upcomingEvents, CalendarDays],
    ['Programmes', summary.programmes, HeartHandshake],
    ['Calendars', summary.calendars, CalendarRange],
    ['Counsellors', summary.counsellors, Stethoscope],
    ['Services', summary.services, GraduationCap],
  ];

  const contentColumns = useMemo(() => [
    { key: 'title', label: 'Content', render: (row) => <div><p className="font-semibold text-slate-900">{row.title}</p><p className="mt-1 text-slate-400">{row.sourceName}</p></div> },
    { key: 'type', label: 'Type', render: (row) => label(row.type) },
    { key: 'provenance', label: 'Provenance', render: (row) => <div><Status value={row.official ? 'Official' : row.sourceTrustLevel || 'Review'} tone={row.official ? 'green' : 'amber'} /><p className="mt-1">{label(row.rightsStatus || 'UNKNOWN')}</p></div> },
    { key: 'date', label: 'Published', render: (row) => formatDate(row.providerPublishedAt || row.publishedAt) },
    { key: 'actions', label: 'Actions', render: (row) => <ModerationActions item={row} onDone={() => { notify('Review state updated.', 'success'); load(); }} compact /> },
  ], [load, notify]);

  const view = (() => {
    if (!workspace) return null;
    if (active === 'sources') return <Table empty="No institutional sources" rows={workspace.sources} columns={[
      { key: 'name', label: 'Source', render: (row) => <div><p className="font-semibold text-slate-900">{row.name}</p><p className="mt-1">{row.ownerOrganization || row.organization}</p></div> },
      { key: 'type', label: 'Type', render: (row) => label(row.institutionalSourceType || row.provider) },
      { key: 'trust', label: 'Trust', render: (row) => <Status value={row.trustTier || row.trustLevel} tone={row.verificationStatus === 'VERIFIED' ? 'green' : 'amber'} /> },
      { key: 'mode', label: 'Ingestion', render: (row) => label(row.ingestionMode || 'MANUAL') },
      { key: 'rights', label: 'Rights', render: (row) => label(row.contentRightsStatus || 'UNKNOWN') },
      { key: 'review', label: 'Review', render: (row) => row.requiresReview === false ? 'Not required' : 'Required' },
    ]} />;
    if (active === 'review') return <Table empty="Review queue is clear" rows={workspace.review} columns={contentColumns} />;
    if (active === 'published') return <Table empty="No published institutional content" rows={workspace.published} columns={contentColumns} />;
    if (active === 'events') return <Table empty="No institutional events" rows={workspace.events} columns={[
      { key: 'title', label: 'Event', render: (row) => <div><p className="font-semibold text-slate-900">{row.title}</p><p className="mt-1">{row.event?.organiser || row.sourceName}</p></div> },
      { key: 'starts', label: 'Starts', render: (row) => formatDate(row.event?.startsAt) },
      { key: 'venue', label: 'Venue', render: (row) => row.event?.venueName || row.event?.location || 'Not supplied' },
      { key: 'timezone', label: 'Timezone', render: (row) => row.event?.timezone || 'Africa/Accra' },
      { key: 'state', label: 'State', render: (row) => <Status value={row.event?.status || 'DRAFT'} tone={row.event?.status === 'CANCELLED' ? 'red' : 'green'} /> },
      { key: 'actions', label: 'Review', render: (row) => <ModerationActions item={row} onDone={load} compact /> },
    ]} />;
    if (active === 'programmes') return <Table empty="No institutional programmes" rows={workspace.programmes} columns={[
      { key: 'name', label: 'Programme', render: (row) => <div><p className="font-semibold text-slate-900">{row.name}</p><p className="mt-1">{row.edition || 'No edition label'}</p></div> },
      { key: 'owner', label: 'Owner', render: (row) => row.organization },
      { key: 'window', label: 'Window', render: (row) => formatDate(row.startAt) + ' to ' + formatDate(row.endAt) },
      { key: 'state', label: 'State', render: (row) => <Status value={row.status} tone={row.status === 'ACTIVE' ? 'green' : 'slate'} /> },
      { key: 'verified', label: 'Verified', render: (row) => formatDate(row.verifiedAt) },
    ]} />;
    if (active === 'calendar') return <Table empty="No academic calendars" rows={workspace.calendars} columns={[
      { key: 'year', label: 'Academic year', render: (row) => <p className="font-semibold text-slate-900">{row.academicYear}</p> },
      { key: 'periods', label: 'Periods', render: (row) => String(row.periods?.length || 0) },
      { key: 'warnings', label: 'Validation', render: (row) => <Status value={(row.validationWarnings?.length || 0) ? row.validationWarnings.length + ' warnings' : 'Validated'} tone={(row.validationWarnings?.length || 0) ? 'amber' : 'green'} /> },
      { key: 'verified', label: 'Verified', render: (row) => formatDate(row.verifiedAt) },
      { key: 'state', label: 'State', render: (row) => <Status value={row.active ? 'Active' : 'Inactive'} tone={row.active ? 'green' : 'slate'} /> },
    ]} />;
    if (active === 'counsellors') return <Table empty="No verified KCC counsellors" rows={workspace.counsellors} columns={[
      { key: 'name', label: 'Counsellor', render: (row) => <div><p className="font-semibold text-slate-900">{row.officialName || row.name}</p><p className="mt-1">{row.professionalRole || row.title}</p></div> },
      { key: 'college', label: 'College / unit', render: (row) => row.college || row.unit || row.department || 'Not supplied' },
      { key: 'modes', label: 'Service modes', render: (row) => (row.serviceModes || []).map(label).join(', ') || 'Not supplied' },
      { key: 'review', label: 'Review due', render: (row) => formatDate(row.reviewDueAt) },
      { key: 'booking', label: 'Booking', render: (row) => <Status value={row.bookingEnabled === false ? 'Disabled' : 'Enabled'} tone={row.bookingEnabled === false ? 'amber' : 'green'} /> },
    ]} />;
    if (active === 'services') return <Table empty="No verified support services" rows={workspace.services} columns={[
      { key: 'name', label: 'Service', render: (row) => <div><p className="font-semibold text-slate-900">{row.name}</p><p className="mt-1">{label(row.category)}</p></div> },
      { key: 'tier', label: 'Care tier', render: (row) => label(row.careTier) },
      { key: 'open', label: 'Current hours', render: (row) => row.openNow === null ? 'Hours not published' : row.openNow ? 'Open now' : 'Closed now' },
      { key: 'verification', label: 'Verification', render: (row) => <Status value={row.verificationState} tone="green" /> },
      { key: 'review', label: 'Review due', render: (row) => formatDate(row.reviewDueAt) },
    ]} />;
    return <Table empty="No institutional source health records" rows={workspace.sourceHealth} columns={[
      { key: 'name', label: 'Source', render: (row) => <div><p className="font-semibold text-slate-900">{row.name}</p><p className="mt-1">{label(row.institutionalSourceType)}</p></div> },
      { key: 'status', label: 'Status', render: (row) => <Status value={row.active === false ? 'Disabled' : row.lastSyncStatus || 'Never synced'} tone={row.lastSyncStatus === 'failed' ? 'red' : row.lastSyncStatus === 'success' ? 'green' : 'amber'} /> },
      { key: 'success', label: 'Last successful sync', render: (row) => formatDate(row.lastSuccessfulSyncAt) },
      { key: 'attempt', label: 'Last attempt', render: (row) => formatDate(row.lastSyncAttemptAt || row.lastSyncedAt) },
      { key: 'items', label: 'Discovered', render: (row) => String(row.newCandidateCount || 0) },
      { key: 'error', label: 'Last error', render: (row) => row.lastErrorCode || row.lastSyncError || 'None' },
    ]} />;
  })();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#8C0000] text-sm font-bold text-white">K</span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Institutional Content</h1>
            <p className="mt-1 text-sm text-slate-500">KNUST e-Counselling source governance and publication operations</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/content/trusted-sources" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Manage sources</Link>
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700">
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([name, value, Icon]) => (
          <div key={name} className="flex items-center gap-3 bg-white px-4 py-3">
            <Icon size={18} className="text-brand-700" />
            <div><p className="text-[11px] text-slate-500">{name}</p><p className="text-lg font-semibold text-slate-900">{value ?? '—'}</p></div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Institutional content views">
        {TABS.map(([key, name]) => (
          <button key={key} role="tab" aria-selected={active === key} onClick={() => setActive(key)}
            className={'whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold ' + (active === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800')}>
            {name}
          </button>
        ))}
      </div>

      {loading ? <div className="flex h-48 items-center justify-center text-sm text-slate-500"><RefreshCcw size={16} className="mr-2 animate-spin" /> Loading institutional workspace</div> : null}
      {!loading && error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p className="font-semibold">Workspace unavailable</p><p className="mt-1">{error}</p><button onClick={load} className="mt-2 underline">Try again</button></div> : null}
      {!loading && !error ? view : null}
    </div>
  );
}