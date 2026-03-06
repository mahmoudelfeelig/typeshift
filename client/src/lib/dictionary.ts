type CuratedDictionaryPack = "core" | "tech" | "myth" | "blitz";
export type DictionaryPack =
  | CuratedDictionaryPack
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
const DERIVED_DICT_CACHE_KEY = "typeshift.derivedDictionary.v1";
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
  tech: [
    "latency",
    "runtime",
    "dataset",
    "kernel",
    "virtual",
    "compiler",
    "syntax",
    "request",
    "storage",
    "frontend",
    "backend",
    "protocol",
    "service",
    "thread",
    "pipeline",
    "release",
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

const languageAndCodePacks: Record<"code" | "spanish" | "french" | "german", string[]> = {
  code: [
    "function",
    "const",
    "return",
    "async",
    "await",
    "promise",
    "object",
    "string",
    "number",
    "boolean",
    "array",
    "import",
    "export",
    "router",
    "schema",
    "render",
    "state",
    "effect",
    "module",
    "buffer",
  ],
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
    .filter((word) => /^[a-z]{2,12}$/.test(word))
    .slice(0, 50000);
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
      !Array.isArray(parsed.nouns)
    ) {
      return null;
    }
    return {
      top1k: parsed.top1k,
      top5k: parsed.top5k,
      top10k: parsed.top10k,
      verbs: parsed.verbs,
      nouns: parsed.nouns,
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
  const lengthPenalty = Math.abs(word.length - 5) * 1.7;
  const rarePenalty = (word.match(/[qzxjkv]/g)?.length ?? 0) * 2.2;
  const vowelCount = word.match(/[aeiou]/g)?.length ?? 0;
  const vowelPenalty = vowelCount === 0 ? 6 : Math.abs(word.length * 0.45 - vowelCount) * 1.2;
  const heavySuffixPenalty = /(tion|sion|ology|ality|ments?)$/.test(word) ? 1.1 : 0;
  return lengthPenalty + rarePenalty + vowelPenalty + heavySuffixPenalty;
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

function deriveDictionarySets(largeWords: string[]): DerivedDictionarySets {
  const signature = dictionarySignature(largeWords);
  if (derivedDictCache && derivedDictCache.signature === signature) {
    return derivedDictCache.sets;
  }

  const cached = readDerivedDictionaryCache(signature);
  if (cached) {
    derivedDictCache = { signature, sets: cached };
    return cached;
  }

  const normalized = [...new Set(largeWords.map((word) => word.toLowerCase()))].filter((word) =>
    /^[a-z]{2,12}$/.test(word),
  );

  const ranked = [...normalized].sort((a, b) => {
    const diff = commonWordScore(a) - commonWordScore(b);
    return diff !== 0 ? diff : a.localeCompare(b);
  });

  const top10k = ranked.slice(0, 10000);
  const top5k = ranked.slice(0, 5000);
  const top1k = ranked.slice(0, 1000);
  const verbs = ranked.filter(likelyVerb).slice(0, 9000);
  const nouns = ranked.filter(likelyNoun).slice(0, 9000);

  const sets: DerivedDictionarySets = {
    top1k: top1k.length > 0 ? top1k : ranked.slice(0, 1000),
    top5k: top5k.length > 0 ? top5k : ranked.slice(0, 5000),
    top10k: top10k.length > 0 ? top10k : ranked.slice(0, 10000),
    verbs: verbs.length > 0 ? verbs : ranked.slice(0, 3000),
    nouns: nouns.length > 0 ? nouns : ranked.slice(0, 3000),
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

export function buildDictionaryPool(params: {
  pack: DictionaryPack;
  customOnly: boolean;
  customWords: string[];
  largeWords: string[];
  punctuation: boolean;
  numbers: boolean;
  lowercase: boolean;
}): string[] {
  const pool: string[] = [];
  let derivedSets: DerivedDictionarySets | null = null;
  const getDerivedSets = () => {
    if (!derivedSets) {
      derivedSets = deriveDictionarySets(params.largeWords);
    }
    return derivedSets;
  };

  if (!params.customOnly) {
    if (isCuratedPack(params.pack)) {
      pool.push(...DICTIONARY_PACKS[params.pack], ...params.largeWords);
    } else if (
      params.pack === "code" ||
      params.pack === "spanish" ||
      params.pack === "french" ||
      params.pack === "german"
    ) {
      pool.push(...languageAndCodePacks[params.pack]);
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
    } else if (
      params.pack === "code" ||
      params.pack === "spanish" ||
      params.pack === "french" ||
      params.pack === "german"
    ) {
      pool.push(...languageAndCodePacks[params.pack]);
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
