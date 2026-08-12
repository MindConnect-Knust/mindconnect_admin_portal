import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  Plus,
  Search,
  Video,
  X,
} from "lucide-react";
import {
  importYoutubeVideo,
  resolveYoutubeVideo,
} from "../../services/contentApi";
import { youtubeEmbedUrl } from "../../services/videoPreview";

const DEFAULT_CATEGORIES = [
  "mental_wellness",
  "stress_management",
  "academic_stress",
  "sleep",
  "mindfulness",
  "knust_counselling",
  "humor",
  "uplifting",
  "nature",
];
const DEFAULT_SURFACES = ["HOME", "REELS", "JOY_BREAK", "LIBRARY"];

const durationLabel = (seconds) => {
  const total = Number(seconds) || 0;
  const minutes = Math.floor(total / 60);
  return minutes + "m " + String(total % 60).padStart(2, "0") + "s";
};

export default function DirectVideoIngestModal({
  options = {},
  onAdded,
  onClose,
}) {
  const categories = options.categories?.length ? options.categories : DEFAULT_CATEGORIES;
  const supportTagOptions = options.supportTags || [];
  const surfaceOptions = options.eligibleSurfaces?.length
    ? options.eligibleSurfaces
    : DEFAULT_SURFACES;
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("mental_wellness");
  const [supportTags, setSupportTags] = useState([]);
  const [eligibleSurfaces, setEligibleSurfaces] = useState(["HOME", "LIBRARY"]);
  const [resolved, setResolved] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const resolveVideo = async (event) => {
    event?.preventDefault();
    if (!url.trim()) return;
    setResolving(true);
    setError("");
    setResolved(null);
    try {
      const result = await resolveYoutubeVideo({ url: url.trim(), category });
      setResolved(result);
    } catch (resolveError) {
      setError(resolveError.message || "Could not resolve this video.");
    } finally {
      setResolving(false);
    }
  };

  const toggleSurface = (surface) => {
    setEligibleSurfaces((current) =>
      current.includes(surface)
        ? current.filter((entry) => entry !== surface)
        : [...current, surface]
    );
  };

  const addVideo = async () => {
    setAdding(true);
    setError("");
    try {
      const result = await importYoutubeVideo({
        url: url.trim(),
        category,
        supportTags,
        eligibleSurfaces,
      });
      onAdded?.(result);
      if (!result.duplicate) onClose();
    } catch (addError) {
      setError(addError.message || "Could not add this video.");
    } finally {
      setAdding(false);
    }
  };

  const item = resolved?.item;
  const embedUrl = item ? youtubeEmbedUrl(item) : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add YouTube video"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Video size={20} className="text-rose-600" />
            <h2 className="text-base font-semibold text-slate-900">Add YouTube Video</h2>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <form onSubmit={resolveVideo} className="border-b border-slate-100 px-5 py-4">
            <div className="flex gap-2">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-300 px-3">
                <Video size={16} className="shrink-0 text-slate-400" />
                <input
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    setResolved(null);
                  }}
                  placeholder="YouTube URL, Shorts URL, or video ID"
                  className="h-10 w-full min-w-0 text-sm outline-none"
                  autoFocus
                />
              </label>
              <button
                type="submit"
                disabled={resolving || !url.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {resolving ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}
                Resolve
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
          </form>

          {item && (
            <div className="space-y-4 px-5 py-4">
              {resolved.duplicate && (
                <div className="flex items-start gap-2 border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Video already exists</p>
                    <p>Current status: {resolved.existing?.displayStatus || resolved.existing?.moderationStatus}</p>
                  </div>
                </div>
              )}

              <div className="aspect-video overflow-hidden rounded-md bg-slate-950">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={"Preview " + item.title}
                    className="h-full w-full"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Preview unavailable
                  </div>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.sourceName}</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-400">{item.providerId}</p>
                  <p className="mt-3 line-clamp-4 text-xs leading-5 text-slate-600">{item.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{durationLabel(item.durationSeconds)}</span>
                    <span>{item.playabilityStatus || "PLAYABLE"}</span>
                    <span>{item.providerChannelId}</span>
                  </div>
                  <a
                    href={item.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                  >
                    <ExternalLink size={13} /> Open on YouTube
                  </a>
                </div>

                <div className="space-y-3 border-l-0 border-slate-200 lg:border-l lg:pl-4">
                  <label className="block text-xs font-medium text-slate-700">
                    Category
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
                    >
                      {categories.map((value) => (
                        <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs font-medium text-slate-700">
                    Support tags
                    <select
                      multiple
                      value={supportTags}
                      onChange={(event) =>
                        setSupportTags([...event.target.selectedOptions].map((option) => option.value))
                      }
                      className="mt-1 h-28 w-full rounded-md border border-slate-300 bg-white p-2 text-xs"
                    >
                      {supportTagOptions.map((value) => (
                        <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                      ))}
                    </select>
                  </label>

                  <fieldset>
                    <legend className="text-xs font-medium text-slate-700">Eligible surfaces</legend>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {surfaceOptions.map((surface) => (
                        <label key={surface} className="flex items-center gap-2 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={eligibleSurfaces.includes(surface)}
                            onChange={() => toggleSurface(surface)}
                            className="h-4 w-4"
                          />
                          {surface.replaceAll("_", " ")}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
          )}
        </div>

        {item && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Enters pending review
            </p>
            <button
              onClick={addVideo}
              disabled={adding || resolved.duplicate}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300"
            >
              {adding ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}
              Add to Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}