import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canCrisis } from "../src/services/crisisPermissions.js";

const read = (relativePath) =>
  readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");

test("crisis access requires the exact named permission", () => {
  assert.equal(canCrisis({ crisisPermissions: ["CRISIS_INCIDENT_VIEW"] }, "CRISIS_INCIDENT_VIEW"), true);
  assert.equal(canCrisis({ crisisPermissions: ["CRISIS_INCIDENT_VIEW"] }, "CRISIS_LOCATION_VIEW"), false);
  assert.equal(canCrisis({ role: "Program Administrator" }, "CRISIS_INCIDENT_VIEW"), false);
  assert.equal(canCrisis(null, "CRISIS_INCIDENT_VIEW"), false);
});

test("realtime subscriptions match the backend crisis event contract", () => {
  const source = read("src/services/crisisSocket.js");
  assert.match(source, /crisis:incident:new/);
  assert.match(source, /crisis:incident:updated/);
  assert.match(source, /crisis:incident:escalated/);
  assert.match(source, /crisis:incident:location-updated/);
  assert.doesNotMatch(source, /["']crisis:location:updated["']/);
});

test("map failure keeps exact coordinates, accuracy, and attribution visible", () => {
  const source = read("src/components/crisis/IncidentMap.jsx");
  assert.match(source, /import\(["']maplibre-gl["']\)/);
  assert.match(source, /Map tiles are unavailable/);
  assert.match(source, /location\.latitude/);
  assert.match(source, /location\.longitude/);
  assert.match(source, /horizontalAccuracy/);
  assert.match(source, /OpenFreeMap and OpenStreetMap contributors/);
});

test("command-centre actions are independently permission gated", () => {
  const source = read("src/pages/crisis/CrisisCommandCentre.jsx");
  for (const permission of [
    "CRISIS_INCIDENT_ACKNOWLEDGE",
    "CRISIS_ASSIGN",
    "CRISIS_ESCALATE",
    "CRISIS_RESOLVE",
    "CRISIS_BREAK_GLASS",
  ]) {
    assert.equal(source.includes(`can("${permission}")`), true);
  }
});
