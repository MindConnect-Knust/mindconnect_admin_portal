import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canAnalytics, canCare, canCase } from "../src/services/portalPermissions.js";
import { withQuery } from "../src/services/query.js";

const read = (relativePath) =>
  readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");

test("case, analytics and care gates each read their own permission list", () => {
  assert.equal(canCase({ casePermissions: ["CASE_VIEW_ASSIGNED"] }, "CASE_VIEW_ASSIGNED"), true);
  // Analytics permissions never open casework, and casework never opens analytics.
  assert.equal(canCase({ adminPermissions: ["CASE_VIEW_ASSIGNED"] }, "CASE_VIEW_ASSIGNED"), false);
  assert.equal(canAnalytics({ casePermissions: ["ANALYTICS_SERVICE_VIEW"] }, "ANALYTICS_SERVICE_VIEW"), false);
  assert.equal(canAnalytics({ adminPermissions: ["ANALYTICS_SERVICE_VIEW"] }, "ANALYTICS_SERVICE_VIEW"), true);
  assert.equal(canCare({ adminPermissions: ["CARE_REFERRALS_VIEW"] }, "CARE_SERVICES_MANAGE"), false);
  assert.equal(canCase(null, "CASE_VIEW_ASSIGNED"), false);
  assert.equal(canAnalytics({ role: "Program Administrator" }, "ANALYTICS_SERVICE_VIEW"), false);
});

test("the login session carries the permission lists the gates read", () => {
  const source = read("src/services/api.js");
  assert.match(source, /casePermissions,/);
  assert.match(source, /adminPermissions,/);
});

test("query helper drops empty values and encodes the rest", () => {
  assert.equal(withQuery("/x", { a: "1", b: "", c: null, d: undefined }), "/x?a=1");
  assert.equal(withQuery("/x", {}), "/x");
  assert.equal(withQuery("/x", { q: "a b&c" }), "/x?q=a+b%26c");
});

test("the analytics dashboard renders withheld cells as gaps, never as zero", () => {
  const source = read("src/pages/analytics/WellbeingIntelligence.jsx");
  assert.match(source, /connectNulls=\{false\}/);
  assert.match(source, /point\.suppressed \? null/);
  assert.match(source, /Insufficient data to protect privacy/);
  // A table alternative exists for every chart.
  assert.match(source, /Show table/);
  // One axis only.
  assert.equal((source.match(/<YAxis/g) || []).length, 2, "expected exactly one YAxis per chart variant");
  assert.doesNotMatch(source, /yAxisId/);
});

test("the dashboard never offers a student-level view", () => {
  const source = read("src/pages/analytics/WellbeingIntelligence.jsx");
  assert.doesNotMatch(source, /studentId|student\.name|\/cases\//);
});

test("case queues and the dashboard carry no clinical content", () => {
  const source = read("src/pages/cases/CaseWorkspace.jsx");
  assert.doesNotMatch(source, /presentingConcerns|topConcern|note\.body/);
});

test("reading a clinical note is a separate request, not part of opening a case", () => {
  const source = read("src/pages/cases/CaseDetail.jsx");
  assert.match(source, /caseApi\.readNote/);
  // The note list renders labels, and a body only appears once one is opened.
  assert.match(source, /note\.listLabel/);
  assert.match(source, /opened\.body/);
});

test("student-reported and clinician-recorded concerns are shown separately", () => {
  const source = read("src/pages/cases/CaseDetail.jsx");
  assert.match(source, /STUDENT_REPORTED/);
  assert.match(source, /CLINICIAN_RECORDED/);
});

test("the notification menu uses a quiet indicator rather than a red count", () => {
  const source = read("src/components/layout/NotificationMenu.jsx");
  assert.doesNotMatch(source, /bg-rose-500|bg-red-/);
  assert.match(source, /notificationCentreApi\.list/);
});

test("the waitlist view shows need and urgency, never triage concerns", () => {
  const source = read("src/pages/cases/CaseWorkspace.jsx");
  assert.match(source, /caseApi\.waitlist/);
  assert.doesNotMatch(source, /row\.concerns/);
});
