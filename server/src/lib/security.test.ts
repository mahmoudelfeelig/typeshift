import assert from "node:assert/strict";
import test from "node:test";
import {
  displayNameMeetsPolicy,
  extractBearerToken,
  isReasonableScore,
  safeTokenCompare,
  signSessionToken,
  usernameMeetsPolicy,
  verifySessionToken,
} from "./security.js";

test("session token roundtrip preserves sid and mode", () => {
  const token = signSessionToken("d4f2cfb0-4d9b-4de1-b4b2-82a5bf30ed63", "time");
  const payload = verifySessionToken(token);
  assert.ok(payload);
  assert.equal(payload?.sid, "d4f2cfb0-4d9b-4de1-b4b2-82a5bf30ed63");
  assert.equal(payload?.mode, "time");
});

test("anti-cheat rejects implausible burst telemetry", () => {
  const ok = isReasonableScore({
    wpm: 130,
    raw: 150,
    accuracy: 93,
    durationMs: 60_000,
    errors: 12,
    telemetry: {
      typedChars: 900,
      correctChars: 850,
      wrongChars: 50,
      avgKeyIntervalMs: 40,
      burstKps: 42,
      idleRatio: 0.15,
      timelineHash: "a".repeat(64),
    },
  });
  assert.equal(ok, false);
});

test("anti-cheat accepts a reasonable score sample", () => {
  const ok = isReasonableScore({
    wpm: 88,
    raw: 96,
    accuracy: 95,
    durationMs: 60_000,
    errors: 14,
    telemetry: {
      typedChars: 540,
      correctChars: 510,
      wrongChars: 30,
      avgKeyIntervalMs: 125,
      burstKps: 9.5,
      idleRatio: 0.11,
      timelineHash: "b".repeat(64),
    },
  });
  assert.equal(ok, true);
});

test("bearer token parsing is case-insensitive and trims spacing", () => {
  assert.equal(extractBearerToken("Bearer abc123"), "abc123");
  assert.equal(extractBearerToken("bearer abc123"), "abc123");
  assert.equal(extractBearerToken("   Bearer    abc123   "), "abc123");
  assert.equal(extractBearerToken("token abc123"), null);
});

test("safe token compare succeeds only for exact match", () => {
  assert.equal(safeTokenCompare("secret-token", "secret-token"), true);
  assert.equal(safeTokenCompare("secret-token", "secret-token-2"), false);
  assert.equal(safeTokenCompare("secret-token", undefined), false);
});

test("username policy accepts safe names and rejects unsafe values", () => {
  assert.equal(usernameMeetsPolicy("Pilot_One"), true);
  assert.equal(usernameMeetsPolicy("player two"), true);
  assert.equal(usernameMeetsPolicy("<script>alert(1)</script>"), false);
  assert.equal(usernameMeetsPolicy("a"), false);
});

test("display name policy rejects script-like names", () => {
  assert.equal(displayNameMeetsPolicy("Orbital Cup", 48), true);
  assert.equal(displayNameMeetsPolicy("Alpha-Team_2", 24), true);
  assert.equal(displayNameMeetsPolicy("DROP TABLE users;", 48), false);
  assert.equal(displayNameMeetsPolicy("x", 48), false);
});
