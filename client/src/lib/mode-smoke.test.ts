import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { generateCodePrompt } from "./code-prompts";
import { buildDictionaryPool } from "./dictionary";
import { GAME_MODES, MODE_META, modeFromSlug, pathForMode } from "./game-modes";
import { MODE_VALUES } from "./server/types";

const largeWords = readFileSync(new URL("../../public/data/english-2-12.txt", import.meta.url), "utf8")
  .trim()
  .split(/\r?\n/);
const frequencyWords = readFileSync(new URL("../../public/data/english-frequency-10k.txt", import.meta.url), "utf8")
  .trim()
  .split(/\r?\n/);

test("all server modes have playable metadata and stable game routes", () => {
  assert.deepEqual([...GAME_MODES].sort(), [...MODE_VALUES].sort());
  for (const mode of GAME_MODES) {
    const meta = MODE_META[mode];
    assert.ok(meta.label.length >= 2, `${mode} label`);
    assert.ok(meta.slug.length >= 2, `${mode} slug`);
    assert.equal(modeFromSlug(meta.slug), mode, `${mode} slug maps back`);
    assert.equal(pathForMode(mode), `/games/${meta.slug}`);
    assert.ok(meta.objective.length > 10, `${mode} objective`);
    assert.ok(meta.rule.length > 10, `${mode} rule`);
    assert.ok(meta.scoring.length > 10, `${mode} scoring`);
  }
});

test("recommended packs are large enough for each mode smoke run", () => {
  for (const mode of GAME_MODES) {
    const pack = MODE_META[mode].recommended.pack;
    const pool = buildDictionaryPool({
      pack,
      customOnly: false,
      customWords: [],
      largeWords,
      frequencyWords,
      punctuation: false,
      numbers: false,
      lowercase: true,
    });
    const minimum = pack === "core" ? 80 : 900;
    assert.ok(pool.length >= minimum, `${mode} ${pack} pool too small: ${pool.length}`);
    assert.ok(pool.every((word) => /^[a-z]{2,12}$/.test(word)), `${mode} ${pack} contains invalid words`);
  }
});

test("code prompts preserve structure and language-specific tokens", () => {
  const prompt = generateCodePrompt("typescript", "preserve", 160);
  const flatPrompt = generateCodePrompt("python", "flat", 120);
  assert.equal(prompt.tokens.length, 160);
  assert.equal(flatPrompt.tokens.length, 120);
  assert.ok(Object.keys(prompt.lineStarts).length >= 8);
  assert.ok(Object.values(prompt.lineStarts).some((indent) => indent > 0), "preserved prompt has indentation");
  assert.ok(Object.values(flatPrompt.lineStarts).every((indent) => indent === 0), "flat prompt removes indentation");
  assert.ok(prompt.tokens.some((token) => token === "function" || token === "const" || token === "type"));
});
