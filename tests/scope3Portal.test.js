import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canAdmin, canConcern, canOutcome, canStaff, homePathFor, isStaff } from "../src/services/portalPermissions.js";
import { availableActions, changeSummary, chartSeries, needsEmergencyGuidance, validateConcernForm } from "../src/services/scope3Format.js";

const read = (relativePath) => readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf8");
const dir = (relativePath) => readdirSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)));

test("staff sessions are recognised only when verified, and never gain professional gates", () => {
  const staff = { rawRole: "staff", staffVerified: true, staffPermissions: ["CONCERN_REFERRAL_CREATE"], casePermissions: ["CONCERN_REFERRAL_REVIEW", "OUTCOME_CASE_VIEW"], adminPermissions: ["STAFF_ACCESS_MANAGE"] };
  assert.equal(isStaff(staff), true);
  assert.equal(canStaff(staff, "CONCERN_REFERRAL_CREATE"), true);
  assert.equal(isStaff({ ...staff, staffVerified: false }), false);
  assert.equal(canConcern(staff, "CONCERN_REFERRAL_REVIEW"), false);
  assert.equal(canOutcome(staff, "OUTCOME_CASE_VIEW"), false);
  assert.equal(canAdmin(staff, "STAFF_ACCESS_MANAGE"), false);
  assert.equal(homePathFor(staff), "/staff");
  assert.equal(canStaff({ rawRole: "student", staffVerified: true, staffPermissions: ["CONCERN_REFERRAL_CREATE"] }, "CONCERN_REFERRAL_CREATE"), false);
  assert.equal(canConcern({ rawRole: "counsellor", casePermissions: ["CONCERN_REFERRAL_REVIEW"] }, "CONCERN_REFERRAL_REVIEW"), true);
});

test("the urgent gate shows emergency guidance for anything but a clear no", () => {
  assert.equal(needsEmergencyGuidance("YES"), true);
  assert.equal(needsEmergencyGuidance("UNSURE"), true);
  assert.equal(needsEmergencyGuidance("NO"), false);
  assert.equal(needsEmergencyGuidance(undefined), false);
});

test("the short urgent report needs only the student; the full form asks for observations, never a diagnosis", () => {
  assert.deepEqual(validateConcernForm({ immediateDangerAnswer: "YES", studentName: "Ama" }, { urgent: true }), []);
  const full = validateConcernForm({ immediateDangerAnswer: "NO", studentName: "Ama", concernCategories: [], observations: "short" });
  assert.deepEqual(full.map((error) => error.field).sort(), ["concernCategories", "observations"]);
  assert.match(full.find((error) => error.field === "observations").message, /do not need to make a diagnosis/);
  assert.equal(validateConcernForm({}).some((error) => error.field === "student"), true);
});

test("dispositions are offered from the status and what the concern has", () => {
  const base = { status: "SUBMITTED", student: { hasMindConnectAccount: false }, openCase: null, possibleDuplicates: [] };
  const withoutAccount = availableActions(base);
  assert.ok(withoutAccount.includes("ACKNOWLEDGE"));
  for (const action of ["ESCALATE_TO_CRISIS_SAFETY", "OPEN_CASE", "INVITE_TO_SUPPORT_CHECKIN", "MERGE_DUPLICATE", "LINK_EXISTING_CASE"]) {
    assert.equal(withoutAccount.includes(action), false, action);
  }
  const withCase = availableActions({ ...base, student: { hasMindConnectAccount: true }, openCase: { id: "c" } });
  assert.ok(withCase.includes("LINK_EXISTING_CASE"));
  assert.equal(withCase.includes("OPEN_CASE"), false, "no second case when one is open");
  assert.deepEqual(availableActions({ ...base, status: "CLOSED" }), []);
});

test("charts never plot missing measures as zero and never join different scoring versions", () => {
  const measure = {
    points: [
      { status: "COMPLETED", valid: true, rawScore: 16, scoringVersion: "v1", completedAt: "2026-09-01", purpose: "BASELINE" },
      { status: "EXPIRED", valid: null, rawScore: null, scoringVersion: "v1", availableAt: "2026-09-08", purpose: "FOLLOW_UP" },
      { status: "COMPLETED", valid: true, rawScore: 0, scoringVersion: "v1", completedAt: "2026-09-15", purpose: "FOLLOW_UP" },
      { status: "COMPLETED", valid: true, rawScore: 9, scoringVersion: "v2", completedAt: "2026-09-22", purpose: "FOLLOW_UP" },
      { status: "AVAILABLE", scoringVersion: "v2", availableAt: "2026-09-29", purpose: "FOLLOW_UP" },
    ],
  };
  const series = chartSeries(measure);
  assert.equal(series.length, 4, "open offers are not plotted");
  assert.equal(series[1].v1, null, "an expired check-in is a gap");
  assert.equal(series[2].v1, 0, "a real zero stays a zero");
  assert.equal(series[3].v1, null);
  assert.equal(series[3].v2, 9);
});

test("change is described without significance claims unless a method is approved", () => {
  assert.match(changeSummary({ comparable: true, rawChange: -8, direction: "FEWER_DIFFICULTIES", bandMovement: "BETTER_BAND", methodologyApproved: false }), /descriptive only/);
  assert.doesNotMatch(changeSummary({ comparable: true, rawChange: -8, direction: "FEWER_DIFFICULTIES", bandMovement: "SAME_BAND", methodologyApproved: false }), /reliable improvement|clinically significant/i);
  assert.match(changeSummary({ comparable: false, reason: "SCORING_VERSION_CHANGED" }), /scoring version changed/);
});

test("the staff area imports nothing clinical and hardcodes no contact numbers", () => {
  for (const file of dir("src/pages/staff")) {
    const source = read(`src/pages/staff/${file}`);
    assert.doesNotMatch(source, /caseApi|outcomeApi|crisisApi|crisisSocket|concernReviewApi|analyticsApi/, `${file} reaches a professional API`);
    assert.doesNotMatch(source, /(\+233|\b0\d{2}[\s-]?\d{3}[\s-]?\d{4}\b|tel:\d)/, `${file} hardcodes a phone number`);
  }
  const refer = read("src/pages/staff/ReferStudent.jsx");
  assert.ok(refer.indexOf('step === "SAFETY"') < refer.indexOf('step === "FORM"'), "the safety question comes first");
  assert.match(refer, /ErrorSummary/);
  assert.doesNotMatch(refer, /diagnos(is|e)\b.*select|which (mental )?illness/i);
});

test("the staff area is outside the administration layout and its data providers", () => {
  const app = read("src/App.jsx");
  const staffRoute = app.slice(app.indexOf('path="/staff"'), app.indexOf("<AdminArea>"));
  assert.match(staffRoute, /<StaffLayout \/>/);
  assert.doesNotMatch(staffRoute, /DataProvider|DashboardLayout/);
  assert.match(app, /function AdminArea[\s\S]*rawRole === "staff"[\s\S]*Navigate to="\/staff"/);
});

test("queue rows and reporter screens show no free text or clinical pathway", () => {
  const queue = read("src/pages/concerns/ConcernQueue.jsx");
  assert.doesNotMatch(queue, /observations|reportedStatements/);
  const mine = read("src/pages/staff/MyReferrals.jsx");
  assert.doesNotMatch(mine, /careCase|crisisIncident|assignedTo|closureOutcome|resolutionNote/);
});

test("progress charts keep gaps, offer a table, and use one axis", () => {
  const source = read("src/components/cases/ProgressOutcomes.jsx");
  assert.match(source, /connectNulls=\{false\}/);
  assert.match(source, /Show table/);
  assert.equal((source.match(/<YAxis/g) || []).length, 1);
  assert.doesNotMatch(source, /leaderboard|counsellorRanking/i);
  const analytics = read("src/pages/analytics/WellbeingIntelligence.jsx");
  assert.doesNotMatch(analytics, /outcomeApi|caseView/, "leadership never loads an individual outcome history");
});
