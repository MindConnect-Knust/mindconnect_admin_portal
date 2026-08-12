import { useState, useEffect, useCallback } from "react";
import { CalendarCheck, RefreshCcw, Plus, Send, EyeOff, Archive, Edit2, MapPin, Clock } from "lucide-react";
import { listContent, createContentItem, updateContentItem, moderateContentItem } from "../../services/contentApi";
import { useToast } from "../../context/ToastContext";
import EmptyState from "../../components/common/EmptyState";

const STATUS_TABS = [
  { value: "draft", label: "Drafts" },
  { value: "approved", label: "Upcoming" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Past Events" },
];

const statusChip = (s) => {
  const chips = { draft: "bg-slate-100 text-slate-600", approved: "bg-amber-100 text-amber-700", published: "bg-emerald-100 text-emerald-700", archived: "bg-slate-200 text-slate-400" };
  return `inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chips[s] || "bg-slate-100 text-slate-500"}`;
};

const BLANK = { title: "", description: "", thumbnailUrl: "", canonicalUrl: "", location: "", startsAt: "", endsAt: "", registrationUrl: "" };

function EventForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? {
    ...BLANK, ...initial,
    location: initial.location || "",
    startsAt: initial.startsAt ? initial.startsAt.slice(0, 16) : "",
    endsAt: initial.endsAt ? initial.endsAt.slice(0, 16) : "",
    registrationUrl: initial.registrationUrl || "",
  } : BLANK);
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { notify("Title is required.", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        type: "EVENT",
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      };
      await onSave(payload);
    } catch (err) { notify(err.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">{initial?._id ? "Edit Event" : "New Event"}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">Title *</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Event name…" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Starts at *</label>
          <input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Ends at</label>
          <input type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
          <input value={form.location} onChange={(e) => set("location", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. KCC Building, Zoom link…" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Registration URL</label>
          <input value={form.registrationUrl} onChange={(e) => set("registrationUrl", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="https://…" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Thumbnail URL</label>
          <input value={form.thumbnailUrl} onChange={(e) => set("thumbnailUrl", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="https://…" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">{saving ? "Saving…" : (initial?._id ? "Save Changes" : "Create Draft")}</button>
      </div>
    </form>
  );
}

export default function Events() {
  const { notify } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusTab, setStatusTab] = useState("draft");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await listContent({ type: "EVENT", status: statusTab });
      setItems(result.items.sort((a, b) => new Date(a.startsAt || a.createdAt) - new Date(b.startsAt || b.createdAt)));
    } catch (err) { setError(err.message || "Failed to load events."); }
    finally { setLoading(false); }
  }, [statusTab]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (payload) => {
    await createContentItem({ ...payload, moderationStatus: "draft" });
    notify("Event draft created.", "success"); setShowForm(false); load();
  };
  const handleEdit = async (payload) => {
    await updateContentItem(editing._id, payload);
    notify("Event updated.", "success"); setEditing(null); load();
  };
  const handlePublish = async (item) => {
    await moderateContentItem(item._id, { action: "PUBLISH" });
    notify(`"${item.title}" published.`, "success"); load();
  };
  const handleUnpublish = async (item) => {
    await moderateContentItem(item._id, { action: "UNPUBLISH" });
    notify(`"${item.title}" unpublished.`, "info"); load();
  };
  const handleArchive = async (item) => {
    if (!window.confirm(`Archive "${item.title}"?`)) return;
    await moderateContentItem(item._id, { action: "ARCHIVE" });
    notify("Archived.", "info"); load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Events</h2>
          <p className="mt-1 text-sm text-slate-500">Campus wellbeing events and workshops.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"><RefreshCcw size={13} /> Refresh</button>
          <button onClick={() => { setShowForm(true); setEditing(null); }} className="flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-700"><Plus size={13} /> New Event</button>
        </div>
      </div>

      {(showForm || editing) && (
        <EventForm initial={editing} onSave={editing ? handleEdit : handleCreate} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button key={tab.value} onClick={() => setStatusTab(tab.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusTab === tab.value ? "bg-brand-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{tab.label}</button>
        ))}
      </div>

      {loading && <div className="flex items-center justify-center h-40 text-sm text-slate-400"><RefreshCcw size={16} className="animate-spin mr-2" /> Loading…</div>}
      {!loading && error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p className="font-semibold">Failed to load</p><p>{error}</p><button onClick={load} className="mt-2 text-xs underline">Retry</button></div>}
      {!loading && !error && items.length === 0 && <EmptyState icon={CalendarCheck} title="No events in this state" description="Create a draft to get started." />}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-4">
              {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" className="h-14 w-20 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                  <span className={statusChip(item.moderationStatus)}>{item.moderationStatus}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                  {item.startsAt && <span className="flex items-center gap-1"><Clock size={10} />{new Date(item.startsAt).toLocaleString()}</span>}
                  {item.location && <span className="flex items-center gap-1"><MapPin size={10} />{item.location}</span>}
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap shrink-0">
                <button onClick={() => { setEditing(item); setShowForm(false); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"><Edit2 size={11} /> Edit</button>
                {["draft", "approved"].includes(item.moderationStatus) && (
                  <button onClick={() => handlePublish(item)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2 py-1 text-xs font-semibold hover:bg-emerald-700"><Send size={11} /> Publish</button>
                )}
                {item.moderationStatus === "published" && (
                  <button onClick={() => handleUnpublish(item)} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 px-2 py-1 text-xs font-medium"><EyeOff size={11} /> Unpublish</button>
                )}
                {item.moderationStatus !== "archived" && (
                  <button onClick={() => handleArchive(item)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 px-2 py-1 text-xs font-medium"><Archive size={11} /> Archive</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
