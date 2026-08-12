import test from "node:test";
import assert from "node:assert/strict";
import { apiStatus, mapAuditEvent, mapProvider, portalStatus } from "../src/services/providerMappers.js";

test("provider status mappings preserve authoritative lifecycle semantics", () => {
  assert.equal(portalStatus("APPROVED"), "active");
  assert.equal(portalStatus("SUSPENDED"), "on_hold");
  assert.equal(portalStatus("REVOKED"), "deactivated");
  assert.equal(apiStatus("active"), "APPROVED");
  assert.equal(apiStatus("on_hold"), "SUSPENDED");
  assert.equal(apiStatus("deactivated"), "REVOKED");
  assert.throws(() => apiStatus("invented"), /Unknown provider status/);
});

test("provider mapper uses measured activity and does not invent ratings or documents", () => {
  const mapped = mapProvider({
    id: "p1",
    version: 3,
    status: "APPROVED",
    role: "counsellor",
    name: "Dr Care",
    email: "care@knust.edu.gh",
    publicProfile: { specialties: ["Stress"], languages: ["English"], yearsExperience: 5 },
    verificationData: { professionalRegistrationNumber: "REG-1" },
    activity: { totalAppointments: 8, completedAppointments: 6, studentsSeen: 4, availableSlots: 2 },
    history: [],
  });
  assert.equal(mapped.status, "active");
  assert.equal(mapped.stats.totalAppointments, 8);
  assert.equal(mapped.stats.completedAppointments, 6);
  assert.equal("ratingTrend" in mapped, false);
  assert.equal("evaluations" in mapped, false);
  assert.equal("documents" in mapped, false);
});

test("audit mapper retains actor, target, reason, and event timestamp", () => {
  const mapped = mapAuditEvent({
    id: "e1",
    event: "PROVIDER_SUSPENDED",
    providerName: "Listener",
    providerRole: "peer_listener",
    actor: { name: "Admin" },
    reason: "Review",
    at: "2026-08-11T10:00:00Z",
  });
  assert.equal(mapped.admin, "Admin");
  assert.equal(mapped.targetName, "Listener");
  assert.equal(mapped.reason, "Review");
  assert.equal(mapped.timestamp, "2026-08-11T10:00:00Z");
});