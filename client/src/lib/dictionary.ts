type CuratedDictionaryPack = "core" | "myth" | "blitz";
export type DictionaryPack =
  | CuratedDictionaryPack
  | "tech"
  | "top1k"
  | "top5k"
  | "top10k"
  | "verbs"
  | "nouns"
  | "code"
  | "spanish"
  | "french"
  | "german";
const LARGE_DICT_CACHE_KEY = "typeshift.largeDictionary.v1";
const LARGE_DICT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const DERIVED_DICT_CACHE_KEY = "typeshift.derivedDictionary.v3";
const DERIVED_DICT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

interface LargeDictionaryCache {
  words: string[];
  updatedAt: number;
}

interface DerivedDictionarySets {
  top1k: string[];
  top5k: string[];
  top10k: string[];
  verbs: string[];
  nouns: string[];
  tech: string[];
  code: string[];
}

interface DerivedDictionaryCache extends DerivedDictionarySets {
  signature: string;
  updatedAt: number;
}

export const DICTIONARY_PACKS: Record<CuratedDictionaryPack, string[]> = {
  core: [
    "planet",
    "signal",
    "stream",
    "orange",
    "canvas",
    "mirror",
    "rocket",
    "vector",
    "future",
    "summit",
    "module",
    "anchor",
    "memory",
    "fusion",
    "photon",
    "thunder",
  ],
  myth: [
    "dragon",
    "oracle",
    "artifact",
    "griffin",
    "ember",
    "citadel",
    "phoenix",
    "moonstone",
    "relic",
    "tempest",
    "rune",
    "arcane",
    "mythic",
    "legend",
    "sorcery",
    "vortex",
  ],
  blitz: [
    "dash",
    "flash",
    "drift",
    "boost",
    "snap",
    "phase",
    "blink",
    "burst",
    "pivot",
    "spark",
    "storm",
    "vault",
    "hyper",
    "chase",
    "rapid",
    "thrust",
  ],
};

const COMMON_WORDS = [
  "about",
  "above",
  "across",
  "after",
  "again",
  "almost",
  "along",
  "always",
  "around",
  "away",
  "back",
  "because",
  "before",
  "begin",
  "better",
  "between",
  "black",
  "bring",
  "build",
  "carry",
  "change",
  "clean",
  "clear",
  "close",
  "color",
  "come",
  "could",
  "daily",
  "different",
  "during",
  "early",
  "earth",
  "eight",
  "every",
  "family",
  "field",
  "first",
  "follow",
  "found",
  "friend",
  "front",
  "given",
  "great",
  "group",
  "hand",
  "hard",
  "heart",
  "heavy",
  "hello",
  "house",
  "human",
  "idea",
  "important",
  "inside",
  "large",
  "later",
  "learn",
  "leave",
  "light",
  "little",
  "local",
  "long",
  "matter",
  "maybe",
  "money",
  "morning",
  "mother",
  "music",
  "never",
  "night",
  "north",
  "often",
  "once",
  "other",
  "paper",
  "place",
  "point",
  "power",
  "press",
  "quick",
  "quiet",
  "ready",
  "right",
  "river",
  "round",
  "school",
  "second",
  "short",
  "small",
  "sound",
  "south",
  "space",
  "stand",
  "start",
  "state",
  "still",
  "story",
  "study",
  "table",
  "thing",
  "think",
  "three",
  "today",
  "together",
  "under",
  "until",
  "voice",
  "water",
  "where",
  "while",
  "white",
  "whole",
  "world",
  "would",
  "write",
  "young",
];

const TECH_SEEDS = [
  "access",
  "adapter",
  "algorithm",
  "analytics",
  "archive",
  "asset",
  "async",
  "audio",
  "backup",
  "bandwidth",
  "binary",
  "browser",
  "buffer",
  "cache",
  "capacity",
  "channel",
  "client",
  "cloud",
  "cluster",
  "compute",
  "console",
  "container",
  "content",
  "control",
  "cookie",
  "crawler",
  "crypto",
  "daemon",
  "dashboard",
  "database",
  "dataset",
  "debug",
  "deploy",
  "device",
  "digital",
  "domain",
  "driver",
  "encode",
  "engine",
  "event",
  "export",
  "feature",
  "fiber",
  "gateway",
  "graph",
  "hardware",
  "hosting",
  "identity",
  "import",
  "index",
  "infra",
  "input",
  "instance",
  "interface",
  "kernel",
  "latency",
  "layout",
  "library",
  "login",
  "memory",
  "metric",
  "module",
  "monitor",
  "network",
  "node",
  "offline",
  "packet",
  "pipeline",
  "pixel",
  "platform",
  "plugin",
  "portal",
  "privacy",
  "process",
  "profile",
  "protocol",
  "proxy",
  "queue",
  "record",
  "region",
  "release",
  "render",
  "request",
  "response",
  "runtime",
  "schema",
  "script",
  "search",
  "security",
  "server",
  "service",
  "session",
  "signal",
  "socket",
  "source",
  "storage",
  "stream",
  "sync",
  "system",
  "telemetry",
  "terminal",
  "thread",
  "token",
  "traffic",
  "upload",
  "virtual",
  "worker",
];

const CODE_SEEDS = [
  "abstract",
  "array",
  "assert",
  "await",
  "boolean",
  "branch",
  "break",
  "bundle",
  "callback",
  "class",
  "closure",
  "commit",
  "compile",
  "component",
  "config",
  "constant",
  "context",
  "continue",
  "debugger",
  "declare",
  "default",
  "dependency",
  "dispatch",
  "effect",
  "enum",
  "error",
  "export",
  "extends",
  "factory",
  "false",
  "fetch",
  "filter",
  "finally",
  "float",
  "function",
  "generic",
  "handler",
  "hook",
  "hydrate",
  "import",
  "integer",
  "iterate",
  "lambda",
  "layout",
  "literal",
  "mapper",
  "method",
  "mock",
  "module",
  "mutation",
  "namespace",
  "object",
  "package",
  "parameter",
  "parser",
  "payload",
  "promise",
  "property",
  "provider",
  "query",
  "readonly",
  "record",
  "reduce",
  "render",
  "request",
  "resolver",
  "response",
  "return",
  "router",
  "schema",
  "selector",
  "serialize",
  "server",
  "source",
  "state",
  "static",
  "string",
  "struct",
  "switch",
  "symbol",
  "syntax",
  "template",
  "throw",
  "token",
  "transform",
  "true",
  "tuple",
  "type",
  "unknown",
  "utility",
  "value",
  "variable",
  "vector",
  "virtual",
  "void",
  "while",
  "widget",
];

const TECH_ROOTS = [
  "api",
  "app",
  "auth",
  "cache",
  "cloud",
  "code",
  "data",
  "debug",
  "deploy",
  "dev",
  "digital",
  "graph",
  "host",
  "index",
  "logic",
  "media",
  "memory",
  "metric",
  "net",
  "node",
  "packet",
  "proxy",
  "server",
  "socket",
  "stack",
  "stream",
  "sync",
  "tech",
  "tele",
  "token",
  "web",
];

const CODE_ROOTS = [
  "array",
  "async",
  "class",
  "code",
  "compile",
  "const",
  "debug",
  "encode",
  "error",
  "event",
  "function",
  "import",
  "logic",
  "method",
  "module",
  "object",
  "parse",
  "query",
  "render",
  "route",
  "schema",
  "script",
  "source",
  "state",
  "string",
  "syntax",
  "token",
  "type",
  "value",
  "variable",
];

const LOW_QUALITY_WORDS = new Set([
  "admin",
  "advertise",
  "advertisement",
  "ads",
  "adult",
  "beastality",
  "casino",
  "click",
  "download",
  "email",
  "erotica",
  "free",
  "login",
  "naked",
  "password",
  "porn",
  "pussy",
  "redhead",
  "sex",
  "sexy",
  "torrent",
  "whore",
  "xxx",
]);

const languageAndCodePacks: Record<"code" | "spanish" | "french" | "german", string[]> = {
  code: CODE_SEEDS,
  spanish: [
    "hola",
    "gracias",
    "tiempo",
    "mundo",
    "ciudad",
    "familia",
    "palabra",
    "escuela",
    "trabajo",
    "energia",
    "futuro",
    "amigo",
    "ritmo",
    "nube",
    "juego",
    "teclado",
  ],
  french: [
    "bonjour",
    "merci",
    "monde",
    "ville",
    "famille",
    "travail",
    "ecole",
    "avenir",
    "rythme",
    "energie",
    "clavier",
    "nuage",
    "vitesse",
    "ami",
    "histoire",
    "systeme",
  ],
  german: [
    "hallo",
    "danke",
    "welt",
    "stadt",
    "familie",
    "arbeit",
    "schule",
    "zukunft",
    "rhythmus",
    "energie",
    "tastatur",
    "wolke",
    "geschwindigkeit",
    "freund",
    "sprache",
    "system",
  ],
};

const punctuationMarks = [".", ",", "!", "?", ":", ";"];
const irregularVerbs = new Set([
  "be",
  "am",
  "is",
  "are",
  "was",
  "were",
  "been",
  "being",
  "have",
  "has",
  "had",
  "having",
  "do",
  "does",
  "did",
  "done",
  "doing",
  "go",
  "goes",
  "went",
  "gone",
  "going",
  "make",
  "makes",
  "made",
  "making",
  "take",
  "takes",
  "took",
  "taken",
  "taking",
  "see",
  "sees",
  "saw",
  "seen",
  "seeing",
  "come",
  "comes",
  "came",
  "coming",
  "get",
  "gets",
  "got",
  "gotten",
  "getting",
  "give",
  "gives",
  "gave",
  "given",
  "giving",
  "run",
  "runs",
  "ran",
  "running",
  "say",
  "says",
  "said",
  "saying",
  "know",
  "knows",
  "knew",
  "known",
  "knowing",
  "think",
  "thinks",
  "thought",
  "thinking",
  "write",
  "writes",
  "wrote",
  "written",
  "writing",
  "read",
  "reads",
  "reading",
  "speak",
  "speaks",
  "spoke",
  "spoken",
  "speaking",
  "break",
  "breaks",
  "broke",
  "broken",
  "breaking",
  "drive",
  "drives",
  "drove",
  "driven",
  "driving",
  "build",
  "builds",
  "built",
  "building",
  "find",
  "finds",
  "found",
  "finding",
  "leave",
  "leaves",
  "left",
  "leaving",
  "feel",
  "feels",
  "felt",
  "feeling",
]);

const nounHintWords = new Set([
  "time",
  "year",
  "people",
  "way",
  "day",
  "man",
  "woman",
  "child",
  "world",
  "life",
  "hand",
  "part",
  "place",
  "work",
  "week",
  "case",
  "point",
  "group",
  "problem",
  "fact",
  "home",
  "water",
  "room",
  "mother",
  "father",
  "money",
  "story",
  "city",
  "country",
  "family",
  "name",
  "student",
  "game",
  "office",
  "team",
  "player",
  "planet",
  "river",
  "engine",
  "signal",
  "service",
]);

let derivedDictCache: { signature: string; sets: DerivedDictionarySets } | null = null;

function isCuratedPack(pack: DictionaryPack): pack is CuratedDictionaryPack {
  return Object.prototype.hasOwnProperty.call(DICTIONARY_PACKS, pack);
}

export function splitCustomWords(text: string): string[] {
  return [...new Set(text.split(/[\s,]+/).map((part) => part.trim()).filter(Boolean))];
}

function parseDictionary(raw: string): string[] {
  return [...new Set(raw.split(/\r?\n/).map((word) => word.trim().toLowerCase()))]
    .filter(validTrainingWord)
    .slice(0, 50000);
}

function parseFrequencyDictionary(raw: string): string[] {
  return uniqueWords(raw.split(/\r?\n/)).slice(0, 10000);
}

function readDictionaryCache(): string[] | null {
  try {
    const cached = localStorage.getItem(LARGE_DICT_CACHE_KEY);
    if (!cached) {
      return null;
    }
    const parsed = JSON.parse(cached) as LargeDictionaryCache;
    if (!Array.isArray(parsed.words) || typeof parsed.updatedAt !== "number") {
      return null;
    }
    if (Date.now() - parsed.updatedAt > LARGE_DICT_MAX_AGE_MS) {
      return null;
    }
    return parsed.words;
  } catch (_error) {
    return null;
  }
}

function writeDictionaryCache(words: string[]): void {
  try {
    const payload: LargeDictionaryCache = {
      words,
      updatedAt: Date.now(),
    };
    localStorage.setItem(LARGE_DICT_CACHE_KEY, JSON.stringify(payload));
  } catch (_error) {
    // best-effort cache only
  }
}

function dictionarySignature(words: string[]): string {
  const first = words[0] ?? "";
  const middle = words[Math.floor(words.length / 2)] ?? "";
  const last = words.length > 0 ? words[words.length - 1] : "";
  return `${words.length}:${first}:${middle}:${last}`;
}

function readDerivedDictionaryCache(signature: string): DerivedDictionarySets | null {
  try {
    const cached = localStorage.getItem(DERIVED_DICT_CACHE_KEY);
    if (!cached) {
      return null;
    }
    const parsed = JSON.parse(cached) as DerivedDictionaryCache;
    if (
      parsed.signature !== signature ||
      Date.now() - parsed.updatedAt > DERIVED_DICT_MAX_AGE_MS ||
      !Array.isArray(parsed.top1k) ||
      !Array.isArray(parsed.top5k) ||
      !Array.isArray(parsed.top10k) ||
      !Array.isArray(parsed.verbs) ||
      !Array.isArray(parsed.nouns) ||
      !Array.isArray(parsed.tech) ||
      !Array.isArray(parsed.code)
    ) {
      return null;
    }
    return {
      top1k: parsed.top1k,
      top5k: parsed.top5k,
      top10k: parsed.top10k,
      verbs: parsed.verbs,
      nouns: parsed.nouns,
      tech: parsed.tech,
      code: parsed.code,
    };
  } catch (_error) {
    return null;
  }
}

function writeDerivedDictionaryCache(signature: string, sets: DerivedDictionarySets): void {
  try {
    const payload: DerivedDictionaryCache = {
      ...sets,
      signature,
      updatedAt: Date.now(),
    };
    localStorage.setItem(DERIVED_DICT_CACHE_KEY, JSON.stringify(payload));
  } catch (_error) {
    // best-effort cache only
  }
}

function commonWordScore(word: string): number {
  const commonBoost = COMMON_WORDS.includes(word) ? -8 : 0;
  const lengthPenalty = Math.abs(word.length - 5) * 1.7;
  const rarePenalty = (word.match(/[qzxjkv]/g)?.length ?? 0) * 2.2;
  const vowelCount = word.match(/[aeiou]/g)?.length ?? 0;
  const vowelPenalty = vowelCount === 0 ? 6 : Math.abs(word.length * 0.45 - vowelCount) * 1.2;
  const heavySuffixPenalty = /(tion|sion|ology|ality|ments?)$/.test(word) ? 1.1 : 0;
  const awkwardPenalty = /(ae|ii|uu|yy|rh|mn|pt|gn|bd)/.test(word) ? 2.4 : 0;
  return commonBoost + lengthPenalty + rarePenalty + vowelPenalty + heavySuffixPenalty + awkwardPenalty;
}

function validTrainingWord(word: string): boolean {
  return /^[a-z]{2,12}$/.test(word) && !LOW_QUALITY_WORDS.has(word);
}

function uniqueWords(words: string[]): string[] {
  return [...new Set(words.map((word) => word.trim().toLowerCase()).filter(validTrainingWord))];
}

function fillRankedWords(primary: string[], fallback: string[], target: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const word of [...primary, ...fallback]) {
    const normalized = word.toLowerCase();
    if (!validTrainingWord(normalized) || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    out.push(normalized);
    if (out.length >= target) {
      break;
    }
  }
  return out;
}

function domainWordScore(word: string, roots: string[], seedSet: Set<string>): number {
  if (seedSet.has(word)) {
    return -80 + commonWordScore(word);
  }
  const root = roots.find((entry) => word.includes(entry));
  if (!root) {
    return Number.POSITIVE_INFINITY;
  }
  const rootPenalty = word === root ? -20 : word.startsWith(root) ? -8 : 0;
  const suffixPenalty = /(ic|ical|ology|ologist|ography|ization|ability|aceous)$/.test(word) ? 8 : 0;
  return commonWordScore(word) + rootPenalty + suffixPenalty + Math.max(0, word.length - root.length) * 0.35;
}

function deriveDomainPack(largeWords: string[], seeds: string[], roots: string[], target: number): string[] {
  const seedSet = new Set(uniqueWords(seeds));
  const seedWords = [...seedSet];
  const matches = uniqueWords(largeWords)
    .filter((word) => roots.some((root) => word.includes(root)))
    .sort((a, b) => {
      const diff = domainWordScore(a, roots, seedSet) - domainWordScore(b, roots, seedSet);
      return diff !== 0 ? diff : a.localeCompare(b);
    });
  return fillRankedWords(seedWords, matches, target);
}

function likelyVerb(word: string): boolean {
  if (irregularVerbs.has(word)) {
    return true;
  }
  if (word.length < 3) {
    return false;
  }
  return (
    /(ate|ify|ise|ize|ing|ed|en|fy)$/.test(word) ||
    /^(re|pre|over|under|mis)[a-z]{3,}$/.test(word) ||
    /^(un|de)[a-z]{4,}$/.test(word)
  );
}

function likelyNoun(word: string): boolean {
  if (nounHintWords.has(word)) {
    return true;
  }
  if (word.length < 3) {
    return false;
  }
  return /(tion|sion|ment|ness|ity|ship|hood|ism|ist|age|ance|ence|dom|eer|ery|or|er)$/.test(word);
}

function deriveDictionarySets(largeWords: string[], frequencyWords: string[]): DerivedDictionarySets {
  const signature = `${dictionarySignature(largeWords)}:${dictionarySignature(frequencyWords)}`;
  if (derivedDictCache && derivedDictCache.signature === signature) {
    return derivedDictCache.sets;
  }

  const cached = readDerivedDictionaryCache(signature);
  if (cached) {
    derivedDictCache = { signature, sets: cached };
    return cached;
  }

  const normalized = uniqueWords(largeWords);
  const frequencyRanked = uniqueWords(frequencyWords);

  const ranked = [...normalized].sort((a, b) => {
    const diff = commonWordScore(a) - commonWordScore(b);
    return diff !== 0 ? diff : a.localeCompare(b);
  });

  const top10k = fillRankedWords(frequencyRanked, ranked, 10000);
  const top5k = fillRankedWords(frequencyRanked, ranked, 5000);
  const top1k = fillRankedWords(frequencyRanked, ranked, 1000);
  const verbs = ranked.filter(likelyVerb).slice(0, 9000);
  const nouns = ranked.filter(likelyNoun).slice(0, 9000);
  const tech = deriveDomainPack(largeWords, TECH_SEEDS, TECH_ROOTS, 3000);
  const code = deriveDomainPack(largeWords, CODE_SEEDS, CODE_ROOTS, 2500);

  const sets: DerivedDictionarySets = {
    top1k,
    top5k,
    top10k,
    verbs: verbs.length > 0 ? verbs : ranked.slice(0, 3000),
    nouns: nouns.length > 0 ? nouns : ranked.slice(0, 3000),
    tech,
    code,
  };

  writeDerivedDictionaryCache(signature, sets);
  derivedDictCache = { signature, sets };
  return sets;
}

export async function loadLargeDictionary(): Promise<string[]> {
  const cached = readDictionaryCache();
  if (cached && cached.length > 0) {
    return cached;
  }

  const response = await fetch("/data/english-2-12.txt", { cache: "force-cache" });
  if (!response.ok) {
    throw new Error("Failed to load large dictionary");
  }
  const raw = await response.text();
  const words = parseDictionary(raw);
  writeDictionaryCache(words);
  return words;
}

export async function loadFrequencyDictionary(): Promise<string[]> {
  const response = await fetch("/data/english-frequency-10k.txt", { cache: "force-cache" });
  if (!response.ok) {
    throw new Error("Failed to load frequency dictionary");
  }
  const raw = await response.text();
  return parseFrequencyDictionary(raw);
}

export function buildDictionaryPool(params: {
  pack: DictionaryPack;
  customOnly: boolean;
  customWords: string[];
  largeWords: string[];
  frequencyWords: string[];
  punctuation: boolean;
  numbers: boolean;
  lowercase: boolean;
}): string[] {
  const pool: string[] = [];
  let derivedSets: DerivedDictionarySets | null = null;
  const getDerivedSets = () => {
    if (!derivedSets) {
      derivedSets = deriveDictionarySets(params.largeWords, params.frequencyWords);
    }
    return derivedSets;
  };

  if (!params.customOnly) {
    if (isCuratedPack(params.pack)) {
      const commonBlend =
        params.pack === "core" ? COMMON_WORDS : [...COMMON_WORDS, ...getDerivedSets().top5k.slice(0, 900)];
      pool.push(...DICTIONARY_PACKS[params.pack], ...commonBlend);
    } else if (params.pack === "tech") {
      pool.push(...getDerivedSets().tech);
    } else if (
      params.pack === "spanish" ||
      params.pack === "french" ||
      params.pack === "german"
    ) {
      pool.push(...languageAndCodePacks[params.pack]);
    } else if (params.pack === "code") {
      pool.push(...getDerivedSets().code);
    } else if (params.pack === "top1k") {
      pool.push(...getDerivedSets().top1k);
    } else if (params.pack === "top5k") {
      pool.push(...getDerivedSets().top5k);
    } else if (params.pack === "top10k") {
      pool.push(...getDerivedSets().top10k);
    } else if (params.pack === "verbs") {
      pool.push(...getDerivedSets().verbs);
    } else if (params.pack === "nouns") {
      pool.push(...getDerivedSets().nouns);
    }
  }
  if (params.customWords.length > 0) {
    pool.push(...params.customWords);
  }
  if (params.customOnly && params.customWords.length === 0) {
    if (isCuratedPack(params.pack)) {
      pool.push(...DICTIONARY_PACKS[params.pack]);
    } else if (params.pack === "tech") {
      pool.push(...getDerivedSets().tech);
    } else if (
      params.pack === "spanish" ||
      params.pack === "french" ||
      params.pack === "german"
    ) {
      pool.push(...languageAndCodePacks[params.pack]);
    } else if (params.pack === "code") {
      pool.push(...getDerivedSets().code);
    } else if (params.pack === "top1k") {
      pool.push(...getDerivedSets().top1k);
    } else if (params.pack === "top5k") {
      pool.push(...getDerivedSets().top5k);
    } else if (params.pack === "top10k") {
      pool.push(...getDerivedSets().top10k);
    } else if (params.pack === "verbs") {
      pool.push(...getDerivedSets().verbs);
    } else if (params.pack === "nouns") {
      pool.push(...getDerivedSets().nouns);
    }
  }
  if (params.numbers) {
    pool.push("404", "2026", "7x7", "12bit", "24fps", "99");
  }

  let words = [...new Set(pool)];
  if (params.lowercase) {
    words = words.map((word) => word.toLowerCase());
  }
  if (params.punctuation) {
    words = words.map((word) =>
      Math.random() < 0.25
        ? `${word}${punctuationMarks[Math.floor(Math.random() * punctuationMarks.length)]}`
        : word,
    );
  }

  return words.length > 0 ? words : DICTIONARY_PACKS.core;
}

export function generateWords(pool: string[], count: number): string[] {
  const words: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const next = pool[Math.floor(Math.random() * pool.length)];
    if (next !== undefined) {
      words.push(next);
    }
  }
  if (words.length === 0) {
    return [...DICTIONARY_PACKS.core];
  }
  return words;
}
