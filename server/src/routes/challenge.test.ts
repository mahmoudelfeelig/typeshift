import assert from "node:assert/strict";
import test from "node:test";
import {
  getDailyChallenge,
  getSeasonWindow,
  parseSeasonId,
  pointsForChallengeScore,
} from "./challenge.js";

test("daily challenge is deterministic for the same UTC date", () => {
  const date = new Date(Date.UTC(2026, 2, 5, 8, 30, 0));
  const first = getDailyChallenge(date);
  const second = getDailyChallenge(date);
  assert.deepEqual(first, second);
  assert.equal(first.date, "2026-03-05");
});

test("season window mapping handles quarter boundaries", () => {
  const season = getSeasonWindow(new Date(Date.UTC(2026, 10, 22)));
  assert.equal(season.id, "2026-Q4");
  assert.equal(season.startDate, "2026-10-01");
  assert.equal(season.endDate, "2027-01-01");
});

test("parseSeasonId returns the same window as computed season", () => {
  const fromId = parseSeasonId("2026-Q2");
  assert.equal(fromId.id, "2026-Q2");
  assert.equal(fromId.startDate, "2026-04-01");
  assert.equal(fromId.endDate, "2026-07-01");
});

test("challenge points reward speed+accuracy and penalize errors", () => {
  const baseline = pointsForChallengeScore({
    wpm: 85,
    accuracy: 95,
    errors: 10,
    streak: 24,
    raw: 96,
  });
  const cleaner = pointsForChallengeScore({
    wpm: 85,
    accuracy: 95,
    errors: 3,
    streak: 24,
    raw: 96,
  });
  assert.ok(cleaner > baseline);
});
