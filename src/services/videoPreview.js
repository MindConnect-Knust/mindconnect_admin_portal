const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "www.youtube.com",
  "youtu.be",
]);

export function youtubeVideoId(item = {}) {
  const provider = String(item.provider || "").toLowerCase();
  const providerId = String(item.providerId || "").trim();
  if (provider === "youtube" && providerId) return providerId;

  for (const raw of [item.canonicalUrl, item.mediaUrl]) {
    if (!raw) continue;
    try {
      const url = new URL(raw);
      if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) continue;
      if (url.hostname.toLowerCase() === "youtu.be") {
        return url.pathname.split("/").filter(Boolean)[0] || "";
      }
      if (url.pathname === "/watch") return url.searchParams.get("v") || "";
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" || parts[0] === "embed") return parts[1] || "";
    } catch {
      // Ignore non-URL media values.
    }
  }
  return "";
}

export function youtubeEmbedUrl(item) {
  const videoId = youtubeVideoId(item);
  if (!videoId) return "";
  return "https://www.youtube-nocookie.com/embed/" +
    encodeURIComponent(videoId) +
    "?rel=0&modestbranding=1&playsinline=1";
}

export function contentDisplayStatus(item = {}, now = Date.now()) {
  const publishedAt = item.publishedAt ? new Date(item.publishedAt).getTime() : 0;
  if (item.moderationStatus === "approved" && publishedAt > 0 && publishedAt <= now) {
    return "published";
  }
  return item.displayStatus || item.moderationStatus || "unknown";
}