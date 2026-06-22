export const MODE_VALUES = [
  "time",
  "quote",
  "meteor",
  "zen",
  "pulse",
  "relay",
  "cipher",
  "drift",
  "reverse",
  "echo",
  "rogue",
  "duel",
  "code",
  "coach",
  "blackout",
  "chain",
  "gravity",
  "coop",
  "infection",
  "stealth",
  "chart",
] as const;

export type Mode = (typeof MODE_VALUES)[number];

export const CHALLENGE_DICTIONARY_VALUES = [
  "top1k",
  "top5k",
  "top10k",
  "verbs",
  "nouns",
  "core",
  "tech",
] as const;

export type ChallengeDictionaryPack = (typeof CHALLENGE_DICTIONARY_VALUES)[number];

const MODE_SET = new Set<string>(MODE_VALUES);

export function isMode(value: unknown): value is Mode {
  return typeof value === "string" && MODE_SET.has(value);
}
