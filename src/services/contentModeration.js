const JOY_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "source_review", label: "Pending review" },
  { value: "flagged", label: "Flagged" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "published", label: "Published" },
];

const JOY_CATEGORY_OPTIONS = [
  { value: "", label: "All Joy types" },
  { value: "humor", label: "Comedy" },
  { value: "joy_break", label: "Joy Break" },
  { value: "cute_animals", label: "Cute animals" },
  { value: "relaxing_nature", label: "Nature" },
  { value: "uplifting_stories", label: "Uplifting" },
];

function buildJoyModerationQuery(filters = {}) {
  const params = new URLSearchParams({ joy: "true" });
  if (filters.status) params.set("status", filters.status);
  if (filters.source) params.set("source", filters.source);
  if (filters.category) params.set("category", filters.category);
  return params.toString();
}

function previewUrl(item) {
  if (item.provider === "youtube" && item.providerId) {
    return "https://www.youtube.com/watch?v=" + encodeURIComponent(item.providerId);
  }
  return item.mediaUrl || item.canonicalUrl || item.sourceUrl || "";
}

function mapJoyContent(item) {
  const safetyFlags = Array.isArray(item.contentSafetyFlags) ? item.contentSafetyFlags : [];
  const joyTags = Array.isArray(item.supportTags) ? item.supportTags : [];
  const playable = Boolean((item.providerId || item.mediaUrl) && !item.unavailableAt);
  return {
    id: item._id || item.id,
    title: item.title || "Untitled clip",
    thumbnailUrl: item.thumbnailUrl || "",
    sourceName: item.sourceName || "Unknown source",
    sourceTrustLevel: item.sourceTrustLevel || (item.verifiedSource ? "VERIFIED_SOURCE" : "UNVERIFIED"),
    provider: item.provider || "external",
    providerId: item.providerId || "",
    durationSeconds: Number(item.durationSeconds) || 0,
    publishedDate: item.discoveryMetadata?.publishedAt || item.publishedAt || null,
    moderationStatus: item.moderationStatus || "draft",
    moderationNote: item.moderationNote || "",
    safetyFlags,
    joyTags,
    category: item.category || "joy_break",
    playable,
    published: item.moderationStatus === "approved" && Boolean(item.publishedAt),
    lastCheckedAt: item.lastCheckedAt || null,
    previewUrl: previewUrl(item),
    history: Array.isArray(item.moderationHistory) ? item.moderationHistory : [],
  };
}

export {
  JOY_CATEGORY_OPTIONS,
  JOY_STATUS_OPTIONS,
  buildJoyModerationQuery,
  mapJoyContent,
  previewUrl,
};