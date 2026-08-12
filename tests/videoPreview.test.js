import test from "node:test";
import assert from "node:assert/strict";
import {
  contentDisplayStatus,
  youtubeEmbedUrl,
  youtubeVideoId,
} from "../src/services/videoPreview.js";

test("YouTube preview resolves provider IDs and supported URL formats", () => {
  assert.equal(youtubeVideoId({ provider: "youtube", providerId: "abc123DEF45" }), "abc123DEF45");
  assert.equal(youtubeVideoId({ canonicalUrl: "https://youtu.be/abc123DEF45" }), "abc123DEF45");
  assert.equal(youtubeVideoId({ mediaUrl: "https://www.youtube.com/shorts/abc123DEF45" }), "abc123DEF45");
  assert.equal(youtubeVideoId({ mediaUrl: "https://www.youtube.com/embed/abc123DEF45" }), "abc123DEF45");
  assert.equal(youtubeVideoId({ mediaUrl: "https://example.com/video/abc123DEF45" }), "");
});

test("YouTube preview uses privacy-enhanced embed URLs", () => {
  assert.equal(
    youtubeEmbedUrl({ provider: "youtube", providerId: "abc123DEF45" }),
    "https://www.youtube-nocookie.com/embed/abc123DEF45?rel=0&modestbranding=1&playsinline=1"
  );
});

test("effective content status distinguishes approved from published", () => {
  const now = new Date("2026-08-11T12:00:00Z").getTime();
  assert.equal(contentDisplayStatus({ moderationStatus: "approved" }, now), "approved");
  assert.equal(
    contentDisplayStatus({
      moderationStatus: "approved",
      publishedAt: "2026-08-11T11:00:00Z",
    }, now),
    "published"
  );
});