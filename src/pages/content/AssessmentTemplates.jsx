import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Plus, RefreshCcw, Save, Trash2 } from "lucide-react";
import { listAssessmentTemplates, saveAssessmentTemplate } from "../../services/contentApi";
import { useToast } from "../../context/ToastContext";

const defaultTemplate = {
  key: "wellbeing",
  title: "Wellbeing check-up",
  prompt: "Over the last two weeks, how often have you noticed the following?",
  disclaimer: "This check-up is not a diagnosis. It helps MindConnect suggest support options.",
  sourceName: "KNUST Counselling Centre",
  sourceUrl: "https://kcc.knust.edu.gh/",
  published: false,
  questions: [
    { text: "Little interest or pleasure in doing things", order: 1 },
    { text: "Feeling nervous, anxious, or on edge", order: 2 },
    { text: "Trouble relaxing or sleeping", order: 3 },
    { text: "Feeling down, hopeless, or overwhelmed", order: 4 },
  ],
  options: [
    { label: "Not at all", value: 0 },
    { label: "Several days", value: 1 },
    { label: "More than half the days", value: 2 },
    { label: "Nearly every day", value: 3 },
  ],
  bands: [
    { level: "low", maxPercent: 33, recommendation: "Keep using healthy routines and check in again later." },
    { level: "moderate", maxPercent: 66, recommendation: "Consider a wellbeing activity or a conversation with support." },
    { level: "high", maxPercent: 100, recommendation: "Please consider speaking with a counsellor soon." },
  ],
};

const fieldClass = "w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

const normalizeTemplate = (template = defaultTemplate) => ({
  ...defaultTemplate,
  ...template,
  key: template.key || "wellbeing",
  questions: (template.questions?.length ? template.questions : defaultTemplate.questions).map((item, index) => ({
    text: item.text || "",
    order: Number(item.order || index + 1),
  })),
  options: (template.options?.length ? template.options : defaultTemplate.options).map((item) => ({
    label: item.label || "",
    value: Number(item.value || 0),
  })),
  bands: (template.bands?.length ? template.bands : defaultTemplate.bands).map((item) => ({
    level: item.level || "low",
    maxPercent: Number(item.maxPercent || 0),
    recommendation: item.recommendation || "",
  })),
});

const statusLabel = (template) => {
  if (!template?._id) return "Not saved";
  return template.published ? "Published" : "Draft";
};

export default function AssessmentTemplates() {
  const { notify } = useToast();
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(defaultTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeTemplate = useMemo(
    () => templates.find((template) => template.key === form.key) || null,
    [templates, form.key]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listAssessmentTemplates();
      setTemplates(result.templates);
      const wellbeing = result.templates.find((template) => template.key === "wellbeing") || result.templates[0];
      setForm(normalizeTemplate(wellbeing || defaultTemplate));
    } catch (loadError) {
      setError(loadError.message || "Could not load assessment templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setArrayItem = (group, index, field, value) => {
    setForm((current) => ({
      ...current,
      [group]: current[group].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };
  const addItem = (group, item) => setForm((current) => ({ ...current, [group]: [...current[group], item] }));
  const removeItem = (group, index) => setForm((current) => ({
    ...current,
    [group]: current[group].filter((_, itemIndex) => itemIndex !== index),
  }));

  const payloadFor = (published) => ({
    ...form,
    published,
    questions: form.questions
      .map((item, index) => ({ text: item.text.trim(), order: Number(item.order || index + 1) }))
      .filter((item) => item.text),
    options: form.options
      .map((item) => ({ label: item.label.trim(), value: Number(item.value) }))
      .filter((item) => item.label && Number.isFinite(item.value)),
    bands: form.bands
      .map((item) => ({
        level: item.level,
        maxPercent: Number(item.maxPercent),
        recommendation: item.recommendation.trim(),
      }))
      .filter((item) => item.recommendation && Number.isFinite(item.maxPercent)),
  });

  const save = async (published) => {
    setSaving(true);
    try {
      const saved = await saveAssessmentTemplate(payloadFor(published));
      setForm(normalizeTemplate(saved));
      notify(published ? "Wellbeing check-up published." : "Assessment draft saved.", "success");
      await load();
    } catch (saveError) {
      notify(saveError.message || "Could not save the assessment template.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Wellbeing Check-up</h2>
          <p className="mt-1 text-sm text-slate-500">
            Publish the questionnaire students see in the mobile app. Drafts stay hidden until published.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
            <RefreshCcw size={13} /> Refresh
          </button>
          <button disabled={saving} onClick={() => save(false)} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <Save size={13} /> Save draft
          </button>
          <button disabled={saving} onClick={() => save(true)} className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            <Check size={13} /> Publish
          </button>
        </div>
      </div>

      {loading && <div className="flex h-40 items-center justify-center text-sm text-slate-400"><RefreshCcw size={16} className="mr-2 animate-spin" /> Loading check-up...</div>}

      {!loading && error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Failed to load assessment templates</p>
          <p>{error}</p>
          <button onClick={load} className="mt-2 text-xs underline">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className={labelClass}>Key</span>
                  <input className={fieldClass} value={form.key} onChange={(event) => setField("key", event.target.value)} />
                </label>
                <label>
                  <span className={labelClass}>Title</span>
                  <input className={fieldClass} value={form.title} onChange={(event) => setField("title", event.target.value)} />
                </label>
                <label className="md:col-span-2">
                  <span className={labelClass}>Prompt</span>
                  <textarea rows={2} className={fieldClass} value={form.prompt} onChange={(event) => setField("prompt", event.target.value)} />
                </label>
                <label className="md:col-span-2">
                  <span className={labelClass}>Non-diagnostic disclaimer</span>
                  <textarea rows={2} className={fieldClass} value={form.disclaimer} onChange={(event) => setField("disclaimer", event.target.value)} />
                </label>
                <label>
                  <span className={labelClass}>Clinical source</span>
                  <input className={fieldClass} value={form.sourceName} onChange={(event) => setField("sourceName", event.target.value)} />
                </label>
                <label>
                  <span className={labelClass}>Source URL</span>
                  <input className={fieldClass} value={form.sourceUrl} onChange={(event) => setField("sourceUrl", event.target.value)} />
                </label>
              </div>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Questions</h3>
                <button onClick={() => addItem("questions", { text: "", order: form.questions.length + 1 })} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"><Plus size={12} /> Add</button>
              </div>
              <div className="space-y-2">
                {form.questions.map((question, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-[80px_minmax(0,1fr)_40px]">
                    <input className={fieldClass} type="number" min="1" value={question.order} onChange={(event) => setArrayItem("questions", index, "order", event.target.value)} />
                    <input className={fieldClass} value={question.text} onChange={(event) => setArrayItem("questions", index, "text", event.target.value)} />
                    <button onClick={() => removeItem("questions", index)} className="rounded-md p-2 text-rose-500 hover:bg-rose-50" aria-label="Remove question"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Answer Options</h3>
                <button onClick={() => addItem("options", { label: "", value: 0 })} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"><Plus size={12} /> Add</button>
              </div>
              <div className="space-y-2">
                {form.options.map((option, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_120px_40px]">
                    <input className={fieldClass} value={option.label} onChange={(event) => setArrayItem("options", index, "label", event.target.value)} />
                    <input className={fieldClass} type="number" min="0" value={option.value} onChange={(event) => setArrayItem("options", index, "value", event.target.value)} />
                    <button onClick={() => removeItem("options", index)} className="rounded-md p-2 text-rose-500 hover:bg-rose-50" aria-label="Remove option"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Risk Bands</h3>
                <button onClick={() => addItem("bands", { level: "low", maxPercent: 100, recommendation: "" })} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"><Plus size={12} /> Add</button>
              </div>
              <div className="space-y-2">
                {form.bands.map((band, index) => (
                  <div key={index} className="grid gap-2 lg:grid-cols-[150px_120px_minmax(0,1fr)_40px]">
                    <select className={fieldClass} value={band.level} onChange={(event) => setArrayItem("bands", index, "level", event.target.value)}>
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                    </select>
                    <input className={fieldClass} type="number" min="0" max="100" value={band.maxPercent} onChange={(event) => setArrayItem("bands", index, "maxPercent", event.target.value)} />
                    <input className={fieldClass} value={band.recommendation} onChange={(event) => setArrayItem("bands", index, "recommendation", event.target.value)} />
                    <button onClick={() => removeItem("bands", index)} className="rounded-md p-2 text-rose-500 hover:bg-rose-50" aria-label="Remove band"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Student visibility</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{statusLabel(activeTemplate || form)}</p>
              <p className="mt-1 text-sm text-slate-500">
                Only a published and reviewed template appears in the mobile Wellbeing check-up screen.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Saved templates</p>
              <div className="mt-3 space-y-2">
                {templates.length === 0 ? (
                  <p className="text-sm text-slate-500">No templates saved yet.</p>
                ) : templates.map((template) => (
                  <button key={template._id || template.key} onClick={() => setForm(normalizeTemplate(template))} className="block w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50">
                    <span className="block font-semibold text-slate-800">{template.title}</span>
                    <span className="text-xs text-slate-500">{template.key} | {statusLabel(template)}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
