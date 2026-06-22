import test from "node:test";
import assert from "node:assert/strict";
import { chooseMeteorTarget } from "./meteor-targeting";

test("meteor target stays flexible until a shared prefix diverges", () => {
  const words = [
    { id: 1, text: "advance", yPercent: 70 },
    { id: 2, text: "advantage", yPercent: 42 },
  ];

  const firstLock = chooseMeteorTarget(words, "a", null);
  assert.equal(firstLock?.id, 1);

  const sharedPrefixLock = chooseMeteorTarget(words, "advan", firstLock?.id ?? null);
  assert.equal(sharedPrefixLock?.id, 1);

  const advantageLock = chooseMeteorTarget(words, "advant", sharedPrefixLock?.id ?? null);
  assert.equal(advantageLock?.id, 2);

  const advanceLock = chooseMeteorTarget(words, "advanc", sharedPrefixLock?.id ?? null);
  assert.equal(advanceLock?.id, 1);
});
