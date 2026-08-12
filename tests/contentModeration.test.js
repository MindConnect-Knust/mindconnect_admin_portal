import test from "node:test";
import assert from "node:assert/strict";
import {
  buildJoyModerationQuery,
  mapJoyContent,
  previewUrl,
} from "../src/services/contentModeration.js";

test("Joy moderation query always stays inside the Joy queue", () => {
  const query = new URLSearchParams(buildJoyModerationQuery({
    status: "flagged",
    source: "MarkAngelComedy",
    category: "humor",
  }));
  assert.equal(query.get("joy"), "true");
  assert.equal(query.get("status"), "flagged");
  assert.equal(query.get("source"), "MarkAngelComedy");
  assert.equal(query.get("category"), "humor");
});

test("YouTube candidates get a real watch URL", () => {
  assert.equal(
    previewUrl({ provider: "youtube", providerId: "abc123" }),
    "https://www.youtube.com/watch?v=abc123"
  );
});

test("candidate mapping keeps safety, playability, publication, and trust explicit", () => {
  const item = mapJoyContent({
    _id: "content-1",
    type: "VIDEO",
    provider: "youtube",
    providerId: "abc123",
    sourceName: "Brain Jotter",
    sourceTrustLevel: "CURATED_ENTERTAINMENT",
    title: "Reviewed clip",
    category: "humor",
    supportTags: ["JOY_BREAK", "HUMOR"],
    contentSafetyFlags: ["PRANK_DISTRESS"],
    moderationStatus: "approved",
    publishedAt: "2026-08-11T10:00:00Z",
  });

  assert.equal(item.id, "content-1");
  assert.equal(item.playable, true);
  assert.equal(item.published, true);
  assert.deepEqual(item.safetyFlags, ["PRANK_DISTRESS"]);
  assert.deepEqual(item.joyTags, ["JOY_BREAK", "HUMOR"]);
  assert.equal(item.sourceTrustLevel, "CURATED_ENTERTAINMENT");
});

test("unavailable videos remain visibly blocked even when they have an id", () => {
  const item = mapJoyContent({
    provider: "youtube",
    providerId: "removed",
    unavailableAt: "2026-08-11T11:00:00Z",
  });
  assert.equal(item.playable, false);
  assert.equal(item.published, false);
});