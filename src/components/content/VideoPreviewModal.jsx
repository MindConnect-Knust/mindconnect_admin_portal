import { X, ExternalLink, AlertTriangle } from "lucide-react";
import { contentDisplayStatus, youtubeEmbedUrl, youtubeVideoId } from "../../services/videoPreview";

/**
 * VideoPreviewModal
 *
 * Renders an embedded video preview for admin review before approval.
 * Supports YouTube (safe embed) and generic hosted video (<video> tag).
 * Never auto-plays — admin must manually start playback.
 */
export default function VideoPreviewModal({ item, onClose }) {
  if (!item) return null;

  const youtubeId = youtubeVideoId(item);
  const isYouTube = Boolean(youtubeId);
  const isHosted = !isYouTube && item.mediaUrl;
  const embedUrl = youtubeEmbedUrl(item);
  const displayStatus = contentDisplayStatus(item);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${item.title}`}
    >
      <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {item.sourceName} · {item.provider?.toUpperCase()}
              {item.durationSeconds > 0 && ` · ${Math.floor(item.durationSeconds / 60)}m ${item.durationSeconds % 60}s`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* Safety flags warning */}
        {item.contentSafetyFlags?.length > 0 && (
          <div className="mx-5 mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Safety flags detected</p>
              <p className="text-xs text-amber-700 mt-0.5">{item.contentSafetyFlags.join(", ")}</p>
            </div>
          </div>
        )}

        {/* Video player */}
        <div className="mx-5 my-4 aspect-video rounded-lg overflow-hidden bg-slate-900">
          {isYouTube && (
            <iframe
              src={embedUrl}
              title={item.title}
              className="w-full h-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="eager"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
          {isHosted && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={item.mediaUrl}
              controls
              className="w-full h-full"
              preload="metadata"
            />
          )}
          {!isYouTube && !isHosted && (
            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
              No playable media available for preview.
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 px-5 pb-5 text-xs text-slate-600">
          <p><span className="font-medium text-slate-800">Category:</span> {item.category || "—"}</p>
          <p><span className="font-medium text-slate-800">Status:</span> {displayStatus}</p>
          <p><span className="font-medium text-slate-800">Source context:</span> {item.sourceContext || "—"}</p>
          <p><span className="font-medium text-slate-800">Relevance score:</span> {item.relevanceScore ?? "—"}/100</p>
          {item.canonicalUrl && (
            <a
              href={item.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 flex items-center gap-1 text-brand-600 hover:underline"
            >
              <ExternalLink size={12} /> Open original source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
