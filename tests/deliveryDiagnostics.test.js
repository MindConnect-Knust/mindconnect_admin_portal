import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { COMPONENT_ROWS, componentDetail, formatAge, formatMs, stateTone } from "../src/services/deliveryDiagnostics.js";

const read = (relativePath) =>
  readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");

test("component states map to tones, and unknown values never read as healthy", () => {
  assert.equal(stateTone("ONLINE"), "ok");
  assert.equal(stateTone("STALE"), "warn");
  assert.equal(stateTone("OFFLINE"), "down");
  assert.equal(stateTone("NOT_CONFIGURED"), "down");
  assert.equal(stateTone("DISABLED"), "idle");
  assert.equal(stateTone(undefined), "idle");
  assert.notEqual(stateTone("SOMETHING_NEW"), "ok");
});

test("ages and durations are formatted for people", () => {
  assert.equal(formatAge(null), "—");
  assert.equal(formatAge(42), "42s");
  assert.equal(formatAge(125), "2m 5s");
  assert.equal(formatAge(3 * 3600 + 120), "3h 2m");
  assert.equal(formatMs(null), "—");
  assert.equal(formatMs(250), "250 ms");
  assert.equal(formatMs(2500), "2.5 s");
});

test("every required operations component is listed", () => {
  const keys = COMPONENT_ROWS.map(([key]) => key);
  for (const key of ["pushDispatcher", "socketIO", "expoProvider", "receiptWorker", "analyticsWorker", "crisisEscalationWorker"]) {
    assert.ok(keys.includes(key), key);
  }
});

test("a worker attached to a different database is called out", () => {
  const detail = componentDetail("pushDispatcher", { lastHeartbeatAt: new Date().toISOString(), heartbeatAgeSeconds: 5, sameDatabaseAsWeb: false });
  assert.match(detail, /DIFFERENT DATABASE FROM WEB/);
});

test("delivery diagnostics live in System Health, never in Wellbeing Intelligence", () => {
  assert.match(read("src/pages/administration/SystemHealth.jsx"), /<DeliveryDiagnostics \/>/);
  assert.doesNotMatch(read("src/pages/analytics/WellbeingIntelligence.jsx"), /DeliveryDiagnostics|diagnostics/i);
});

test("the diagnostics panel shows state with an icon and label, not colour alone", () => {
  const source = read("src/components/system/DeliveryDiagnostics.jsx");
  assert.match(source, /<Icon size=\{12\} aria-hidden="true" \/>\s*\{state \|\| "UNKNOWN"\}/);
  // No field that would identify a person or a device is ever read.
  assert.doesNotMatch(source, /expoPushToken|\.email\b|\.recipient\b|studentId/);
});
