/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createWebhook,
  createRaceRoom,
  createTournament,
  deleteWebhook,
  enqueueCasualDuel,
  enqueueRanked,
  fetchAccountProfile,
  fetchAnalyticsSummary,
  fetchChallengeLeaderboard,
  fetchCurrentSeason,
  fetchDailyChallenge,
  fetchDuelState,
  fetchFriends,
  fetchLeaderboard,
  fetchRaceRoomState,
  fetchRankedStatus,
  fetchSharedReplay,
  fetchSeasonLeaderboard,
  fetchTournamentState,
  flushQueuedScores,
  initSession,
  installOfflineSyncHooks,
  joinRaceRoom,
  listReplayShares,
  listWebhooks,
  loginAccount,
  registerAccount,
  reportTournamentMatch,
  requestFriend,
  respondFriend,
  shareReplay,
  startRaceRoom,
  submitScore,
  submitChallengeScore,
  testWebhook,
  sendPrivacyAnalytics,
  updateAccountPreferences,
  updateDuelState,
  updateRaceProgress,
  ApiError,
  type AccountProfile,
  type AnalyticsSummaryResponse,
  type ChallengeLeaderboardEntry,
  type DailyChallenge,
  type DuelState,
  type FriendListResponse,
  type LeaderboardEntry,
  type Mode,
  type RaceRoomState,
  type ReplayShareEntry,
  type SeasonLeaderboardEntry,
  type SeasonWindow,
  type TournamentState,
  type WebhookEndpoint,
} from "./lib/api";
import {
  buildDictionaryPool,
  generateWords,
  loadLargeDictionary,
  splitCustomWords,
  type DictionaryPack,
} from "./lib/dictionary";

const STORAGE_CUSTOM = "typeshift.customWords";
const STORAGE_BEST = "typeshift.bestByMode";
const STORAGE_THEME = "typeshift.theme";
const STORAGE_FOCUS_PREFS = "typeshift.focusPrefs.v1";
const STORAGE_CIPHER_PREFS = "typeshift.cipherPrefs.v1";
const STORAGE_PULSE_PREFS = "typeshift.pulsePrefs.v1";
const STORAGE_SOUND_PACK = "typeshift.soundPack.v1";
const STORAGE_ACCESSIBILITY = "typeshift.accessibilityPreset.v1";
const STORAGE_A11Y_PREFS = "typeshift.a11yPrefs.v1";
const STORAGE_WEAKNESS_MAP = "typeshift.weaknessMap.v1";
const STORAGE_KEY_STATS = "typeshift.keyStats.v1";
const STORAGE_GHOSTS = "typeshift.ghostRuns.v1";
const STORAGE_REPLAYS = "typeshift.replays.v1";
const STORAGE_RACE_META = "typeshift.raceMeta.v1";
const STORAGE_ACCOUNT_TOKEN = "typeshift.accountToken.v1";
const STORAGE_ACCOUNT_PROFILE = "typeshift.accountProfile.v1";
const STORAGE_ACCOUNT_PREFS = "typeshift.accountPrefs.v1";
const STORAGE_PRIVACY_CONSENT = "typeshift.privacyConsent.v1";
const PRIVACY_CONSENT_VERSION = 1;

const QUOTES = [
  "Calm typing beats rushed typing every time.",
  "Look ahead one word and keep your hands loose.",
  "Clean runs come from small accurate movements.",
  "Stay steady and speed will show up on its own.",
  "Mistakes cost less when you catch them early.",
];

const CODE_SNIPPETS = [
  "const score = typed.correct / Math.max(1, typed.total);",
  "if (mode === \"chart\") return commitOnBeat(word, timing);",
  "export async function loadReplay(id: string): Promise<void> {",
  "for (const key of keyboardRows) heatmap[key] = stats[key] ?? 0;",
  "router.post(\"/duel/update\", validateAuth, submitDuelProgress);",
  "type LeaderboardRow = { handle: string; wpm: number; acc: number };",
];

const MODE_META: Record<Mode, { label: string; flavor: string; timed: boolean }> = {
  time: {
    label: "Sprint",
    flavor: "Timed word run.",
    timed: true,
  },
  quote: {
    label: "Quote",
    flavor: "Finish one full line.",
    timed: false,
  },
  meteor: {
    label: "Meteor",
    flavor: "First letter locks nearest word.",
    timed: true,
  },
  zen: {
    label: "Flow",
    flavor: "No timer, endless words.",
    timed: false,
  },
  pulse: {
    label: "Pulse",
    flavor: "Beat-timed scoring lane.",
    timed: true,
  },
  relay: {
    label: "Relay",
    flavor: "Mistakes push you backward.",
    timed: true,
  },
  cipher: {
    label: "Cipher",
    flavor: "Global shift decode mode.",
    timed: true,
  },
  drift: {
    label: "Drift",
    flavor: "Words drift side-to-side while you type.",
    timed: true,
  },
  reverse: {
    label: "Reverse",
    flavor: "Reading order flips right-to-left.",
    timed: true,
  },
  echo: {
    label: "Echo",
    flavor: "Type the previous word from memory.",
    timed: true,
  },
  rogue: {
    label: "Rogue",
    flavor: "Pick run perks every few clears.",
    timed: true,
  },
  duel: {
    label: "Rhythm Duel",
    flavor: "Beat-timed run vs rival pace.",
    timed: true,
  },
  code: {
    label: "Code",
    flavor: "Type syntax-heavy programming words.",
    timed: true,
  },
  coach: {
    label: "Coach",
    flavor: "Adaptive drills from your weak patterns.",
    timed: true,
  },
  blackout: {
    label: "Blackout",
    flavor: "Typed letters fade; trust muscle memory.",
    timed: true,
  },
  chain: {
    label: "Chain",
    flavor: "Combo multipliers on long clean streaks.",
    timed: true,
  },
  gravity: {
    label: "Gravity Flip",
    flavor: "Flow direction flips with time pulses.",
    timed: true,
  },
  coop: {
    label: "Co-op Relay",
    flavor: "Two pilots alternate each cleared word.",
    timed: true,
  },
  infection: {
    label: "Infection",
    flavor: "Mistakes infect nearby words until cleaned.",
    timed: true,
  },
  stealth: {
    label: "Stealth",
    flavor: "Only first and last letters stay visible.",
    timed: true,
  },
  chart: {
    label: "Rhythm Chart",
    flavor: "Strict beatmap windows for each submit.",
    timed: true,
  },
};

const MODE_DETAILS: Record<Mode, string> = {
  time: "A straight speed run. Clean rhythm and sustained focus matter more than gimmicks here.",
  quote: "One complete passage with no timer pressure. Useful for endurance and punctuation control.",
  meteor: "Your ship auto-locks the closest word with the typed opening letter. Each hit burns letters off the target.",
  zen: "Endless practice with no clock. Good for warming up or drilling accuracy without pressure.",
  pulse: "Every submit is judged against the beat. Better timing means cleaner bonus scoring.",
  relay: "Mistakes kick you backward through the prompt. Strong for recovery discipline under pressure.",
  cipher: "All words are shifted by the same amount. Decode fast and keep your pattern recognition sharp.",
  drift: "Words slide while you read them. Tracks eye control and quick target reacquisition.",
  reverse: "The reading direction flips. Good for breaking autopilot and forcing deliberate reads.",
  echo: "Clear a word, then repeat the last one from memory. Strong for recall and sequencing.",
  rogue: "Perks change the run every few clears. Higher variance, more aggressive pacing.",
  duel: "A rhythm-forward race against rival pace. Keep the beat or lose ground.",
  code: "Programming-heavy words and snippets. Good for syntax accuracy and symbol handling.",
  coach: "Weights words toward patterns you miss. Best mode for targeted improvement.",
  blackout: "Letters fade under your hands. Forces trust in muscle memory.",
  chain: "Long clean streaks stack combo value. Rewards consistency.",
  gravity: "The lane flow flips on a timer. Strong for reset speed and attention shifting.",
  coop: "Alternating turns create a relay cadence. Good for handoff rhythm and recovery.",
  infection: "Mistakes spread pressure into nearby words. Clean up quickly or the lane gets messy.",
  stealth: "Middle letters vanish. Focus on shape, memory, and word skeletons.",
  chart: "The strictest rhythm mode. Smaller hit windows, stronger precision demand.",
};

export type AppRoute = "home" | "play" | "social" | "boards" | "lab" | "profile" | "privacy" | "settings";

const ROUTE_LABELS: Record<AppRoute, string> = {
  home: "Home",
  play: "Play",
  social: "Social",
  boards: "Boards",
  lab: "Lab",
  profile: "Profile",
  privacy: "Privacy",
  settings: "Settings",
};

const ROUTE_GROUPS: Array<{ label: string; routes: AppRoute[] }> = [
  { label: "Start", routes: ["home", "play"] },
  { label: "Community", routes: ["social", "boards", "lab"] },
  { label: "Account", routes: ["profile", "privacy", "settings"] },
];

const ROUTE_COPY: Record<AppRoute, { title: string; subtitle: string }> = {
  home: {
    title: "TypeShift HQ",
    subtitle: "Home dashboard with quick launch, profile snapshot, and active ladders.",
  },
  play: {
    title: "Play Deck",
    subtitle: "Pick a mode, read the rundown, and launch the run from one place.",
  },
  social: {
    title: "Social Hub",
    subtitle: "Create race rooms, join friends, or run tournaments.",
  },
  boards: {
    title: "Rank Boards",
    subtitle: "Track global runs, daily challenge, and current season ladder.",
  },
  lab: {
    title: "Training Lab",
    subtitle: "Build custom dictionaries, review replays, and inspect heatmaps.",
  },
  profile: {
    title: "Pilot Profile",
    subtitle: "Account sync, friends, ranked queue, duel state, replay shares, and webhooks.",
  },
  privacy: {
    title: "Privacy Desk",
    subtitle: "Consent controls, storage rules, cookie policy, and aggregate analytics.",
  },
  settings: {
    title: "System Settings",
    subtitle: "Tune performance, accessibility, and focus HUD behavior.",
  },
};

function routeFromPathname(pathname: string): AppRoute {
  const normalized = pathname.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  if (normalized === "/" || normalized === "/home") return "home";
  if (normalized === "/modes") return "play";
  if (normalized === "/social") return "social";
  if (normalized === "/boards") return "boards";
  if (normalized === "/lab") return "lab";
  if (normalized === "/profile") return "profile";
  if (normalized === "/privacy") return "privacy";
  if (normalized === "/settings") return "settings";
  if (normalized === "/play") return "play";
  return "home";
}

function pathForRoute(route: AppRoute): string {
  return route === "home" ? "/" : `/${route}`;
}

function viewportBucket(width: number): "sm" | "md" | "lg" | "xl" {
  if (width < 640) return "sm";
  if (width < 960) return "md";
  if (width < 1280) return "lg";
  return "xl";
}

function handleLooksValid(input: string): boolean {
  return /^[A-Za-z0-9](?:[A-Za-z0-9 _.-]{0,22}[A-Za-z0-9])?$/.test(input.trim());
}

function passwordLooksValid(input: string): boolean {
  return input.length >= 10 && /[A-Z]/.test(input) && /[a-z]/.test(input) && /\d/.test(input);
}

function readStoredPrivacyConsent(): PrivacyConsent | null {
  try {
    const stored = localStorage.getItem(STORAGE_PRIVACY_CONSENT);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as Partial<PrivacyConsent>;
    if (parsed && parsed.version === PRIVACY_CONSENT_VERSION) {
      return {
        version: PRIVACY_CONSENT_VERSION,
        analytics: parsed.analytics === true,
        preferences: parsed.preferences === true,
        decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : new Date().toISOString(),
      };
    }
    return null;
  } catch (_error) {
    return null;
  }
}

type RuntimeStatus = "idle" | "running" | "finished";
type ThemeMode = "dark" | "light";
type CipherDirection = "forward" | "backward";
type PulseJudgeTone = "perfect" | "great" | "ok" | "miss";
type SoundPack = "arcade" | "retro" | "cinematic" | "soft" | "mute";
type AccessibilityPreset = "standard" | "reduced" | "contrast" | "colorblind" | "dyslexia";

interface AccessibilityPrefs {
  announceEvents: boolean;
  textScale: number;
}

interface PrivacyConsent {
  version: number;
  analytics: boolean;
  preferences: boolean;
  decidedAt: string;
}

interface AnalyticsSummaryRow {
  dateKey: string;
  eventName: string;
  page: string | null;
  mode: Mode | null;
  theme: "dark" | "light" | null;
  viewportBucket: "sm" | "md" | "lg" | "xl" | null;
  reducedMotion: boolean | null;
  consentVersion: number | null;
  count: number;
}

interface ReplayEvent {
  t: number;
  key: string;
  kind: "key" | "submit" | "backspace" | "miss" | "mode";
  correct: boolean;
}

interface ReplayRun {
  id: string;
  mode: Mode;
  createdAt: string;
  durationMs: number;
  wpm: number;
  accuracy: number;
  events: ReplayEvent[];
  samples: Array<{ t: number; words: number; chars: number }>;
}

interface GhostRun {
  mode: Mode;
  wpm: number;
  accuracy: number;
  samples: Array<{ t: number; words: number; chars: number }>;
  updatedAt: number;
}

interface RogueBuffs {
  scoreMultiplier: number;
  shieldCharges: number;
  wrongPenaltyScale: number;
  comboBonus: number;
  extraTimeSec: number;
}

interface RogueOffer {
  id: string;
  name: string;
  description: string;
  apply: (buffs: RogueBuffs) => RogueBuffs;
}

interface MeteorWord {
  id: number;
  text: string;
  xPercent: number;
  yPercent: number;
  speed: number;
}

interface LaserFx {
  id: number;
  xPercent: number;
  yPercent: number;
  lockId: number | null;
}

interface ExplosionFx {
  id: number;
  xPercent: number;
  yPercent: number;
}

interface SessionReport {
  reason: string;
  wpm: number;
  raw: number;
  cpm: number;
  kps: number;
  accuracy: number;
  efficiency: number;
  elapsedSec: number;
  completedWords: number;
  correctChars: number;
  wrongChars: number;
  maxStreak: number;
  best: number;
}

interface LiveStats {
  wpm: number;
  raw: number;
  cpm: number;
  kps: number;
  accuracy: number;
  efficiency: number;
  errors: number;
  streak: number;
  maxStreak: number;
  elapsedSec: number;
  completedWords: number;
  correctChars: number;
  wrongChars: number;
  lives: number;
}

interface RuntimeState {
  status: RuntimeStatus;
  runNonce: number;
  startMs: number;
  finishMs: number;
  correctChars: number;
  wrongChars: number;
  rawChars: number;
  errors: number;
  streak: number;
  maxStreak: number;
  completedWords: number;
  lives: number;
  hudRaf: number;
  lastHudPaint: number;
  meteorRaf: number;
  meteorSpawnClock: number;
  meteorLastTs: number;
  meteorWords: MeteorWord[];
  meteorWordId: number;
  meteorLastPaint: number;
  meteorLockId: number | null;
  meteorBuffer: string;
  sessionId: string | null;
  sessionToken: string | null;
}

interface FocusPrefs {
  enabled: boolean;
  showStats: boolean;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  statVisibility: Record<string, boolean>;
}

const DEFAULT_FOCUS_STAT_VISIBILITY: Record<string, boolean> = {
  wpm: true,
  raw: false,
  cpm: false,
  kps: false,
  acc: true,
  eff: false,
  words: true,
  correct: false,
  wrong: false,
  errors: true,
  streak: true,
  bestStreak: false,
  time: true,
  lives: true,
};

function compareWords(typed: string, target: string) {
  let correct = 0;
  let wrong = 0;
  const maxLen = Math.max(typed.length, target.length);
  for (let i = 0; i < maxLen; i += 1) {
    if (typed[i] === target[i] && typed[i] !== undefined) {
      correct += 1;
    } else {
      wrong += 1;
    }
  }
  return { correct, wrong };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatSeconds(value: number) {
  return `${Math.max(value, 0).toFixed(1)}s`;
}

function meteorDifficulty(runtime: RuntimeState) {
  const elapsedSec =
    runtime.status === "running" && runtime.startMs > 0
      ? Math.max(0, (performance.now() - runtime.startMs) / 1000)
      : 0;

  return {
    elapsedSec,
    // Linear ramp: starts easy, then steadily increases difficulty over time.
    speedScale: clamp(0.58 + elapsedSec * 0.012, 0.58, 2.3),
    spawnIntervalSec: clamp(1.45 - elapsedSec * 0.005, 0.55, 1.45),
  };
}

function pulseTiming(runtime: RuntimeState, bpm: number) {
  const safeBpm = clamp(bpm, 60, 220);
  const beatIntervalSec = 60 / safeBpm;
  if (runtime.status !== "running" || runtime.startMs <= 0) {
    return {
      elapsedSec: 0,
      phase: 0,
      distanceSec: beatIntervalSec,
      quality: "miss" as PulseJudgeTone,
      beatIntervalSec,
    };
  }
  const elapsedSec = Math.max(0, (performance.now() - runtime.startMs) / 1000);
  const phase = (elapsedSec % beatIntervalSec) / beatIntervalSec;
  const distanceSec = Math.min(phase, 1 - phase) * beatIntervalSec;
  let quality: PulseJudgeTone = "miss";
  if (distanceSec <= 0.055) {
    quality = "perfect";
  } else if (distanceSec <= 0.11) {
    quality = "great";
  } else if (distanceSec <= 0.18) {
    quality = "ok";
  }

  return {
    elapsedSec,
    phase,
    distanceSec,
    quality,
    beatIntervalSec,
  };
}

function encodeCipherWord(word: string, shift = 3) {
  return word.replace(/[a-z]/gi, (char) => {
    const base = char >= "a" && char <= "z" ? 97 : 65;
    const code = char.charCodeAt(0) - base;
    const next = ((code + shift) % 26 + 26) % 26;
    return String.fromCharCode(next + base);
  });
}

function maskInnerLetters(word: string): string {
  if (word.length <= 2) {
    return word;
  }
  return `${word[0]}${"•".repeat(word.length - 2)}${word[word.length - 1]}`;
}

function scoreSummary(runtime: RuntimeState) {
  const elapsedSec = Math.max(
    (runtime.finishMs > 0 ? runtime.finishMs : performance.now()) - runtime.startMs,
    16,
  ) / 1000;
  const wpm = (runtime.correctChars / 5 / elapsedSec) * 60;
  const raw = (runtime.rawChars / 5 / elapsedSec) * 60;
  const denominator = runtime.correctChars + runtime.wrongChars;
  const accuracy = denominator > 0 ? (runtime.correctChars / denominator) * 100 : 100;
  return { elapsedSec, wpm, raw, accuracy };
}

function isEditableElement(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable ||
    Boolean(el.closest("input, textarea, select, [contenteditable='true']"))
  );
}

const KEYBOARD_ROWS = ["1234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm"];

const KEY_TO_FINGER: Record<string, string> = {
  "1": "L Pinky",
  "2": "L Ring",
  "3": "L Middle",
  "4": "L Index",
  "5": "L Index",
  "6": "R Index",
  "7": "R Index",
  "8": "R Middle",
  "9": "R Ring",
  "0": "R Pinky",
  q: "L Pinky",
  w: "L Ring",
  e: "L Middle",
  r: "L Index",
  t: "L Index",
  y: "R Index",
  u: "R Index",
  i: "R Middle",
  o: "R Ring",
  p: "R Pinky",
  a: "L Pinky",
  s: "L Ring",
  d: "L Middle",
  f: "L Index",
  g: "L Index",
  h: "R Index",
  j: "R Index",
  k: "R Middle",
  l: "R Ring",
  z: "L Pinky",
  x: "L Ring",
  c: "L Middle",
  v: "L Index",
  b: "L Index",
  n: "R Index",
  m: "R Index",
};

function simpleHash64(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
  return `${hex}${hex}${hex}${hex}`.slice(0, 64);
}

function extractWeakPatterns(target: string, typed: string): string[] {
  const patterns: string[] = [];
  const maxLen = Math.min(Math.max(target.length, typed.length), 20);
  for (let i = 0; i < maxLen; i += 1) {
    if (target[i] !== typed[i]) {
      const bi = target.slice(Math.max(0, i - 1), Math.min(target.length, i + 1));
      const tri = target.slice(Math.max(0, i - 1), Math.min(target.length, i + 2));
      if (bi.length === 2) {
        patterns.push(bi.toLowerCase());
      }
      if (tri.length === 3) {
        patterns.push(tri.toLowerCase());
      }
    }
  }
  return patterns;
}

function randomPick<T>(values: T[], count: number): T[] {
  const pool = [...values];
  const out: T[] = [];
  while (pool.length > 0 && out.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    const next = pool[index];
    if (next !== undefined) {
      out.push(next);
    }
    pool.splice(index, 1);
  }
  return out;
}

function generateCoachWords(pool: string[], weakPatterns: string[], count: number): string[] {
  if (weakPatterns.length === 0) {
    return generateWords(pool, count);
  }
  const targetPatterns = weakPatterns.slice(0, 8).map((pattern) => pattern.toLowerCase());
  const focused = pool.filter((word) =>
    targetPatterns.some((pattern) => pattern.length > 1 && word.toLowerCase().includes(pattern)),
  );
  const blend = [...focused, ...pool].filter(Boolean);
  if (blend.length === 0) {
    return [];
  }
  return generateWords(blend, count);
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSeededWords(pool: string[], count: number, seed: number): string[] {
  if (pool.length === 0 || count <= 0) {
    return [];
  }
  const nextRand = mulberry32(seed);
  const words: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const index = Math.floor(nextRand() * pool.length);
    const value = pool[index];
    if (value !== undefined) {
      words.push(value);
    }
  }
  return words;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export default function App() {
  const router = useRouter();
  const pathname = usePathname();
  const isDevEnvironment = process.env.NODE_ENV !== "production";
  const arenaRef = useRef<HTMLElement | null>(null);
  const previewRafRef = useRef(0);
  const replayImportInputRef = useRef<HTMLInputElement | null>(null);
  const pendingPreviewRef = useRef("");
  const typedRef = useRef("");
  const wordQueueRef = useRef<string[]>([]);
  const promptWordsRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);
  const fxIdRef = useRef(0);
  const fxTimeoutsRef = useRef<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicLoopRef = useRef<number>(0);
  const musicStepRef = useRef(0);
  const pulseJudgeTimeoutRef = useRef(0);
  const runSamplesRef = useRef<Array<{ t: number; words: number; chars: number }>>([]);
  const keyEventsRef = useRef<ReplayEvent[]>([]);
  const keyIntervalsRef = useRef<number[]>([]);
  const lastKeyTsRef = useRef(0);
  const racePushAtRef = useRef(0);
  const echoPendingRef = useRef<string | null>(null);
  const rogueBuffsRef = useRef<RogueBuffs>({
    scoreMultiplier: 1,
    shieldCharges: 0,
    wrongPenaltyScale: 1,
    comboBonus: 0,
    extraTimeSec: 0,
  });

  const runtimeRef = useRef<RuntimeState>({
    status: "idle",
    runNonce: 0,
    startMs: 0,
    finishMs: 0,
    correctChars: 0,
    wrongChars: 0,
    rawChars: 0,
    errors: 0,
    streak: 0,
    maxStreak: 0,
    completedWords: 0,
    lives: 5,
    hudRaf: 0,
    lastHudPaint: 0,
    meteorRaf: 0,
    meteorSpawnClock: 0,
    meteorLastTs: 0,
    meteorWords: [],
    meteorWordId: 0,
    meteorLastPaint: 0,
    meteorLockId: null,
    meteorBuffer: "",
    sessionId: null,
    sessionToken: null,
  });

  const [mode, setMode] = useState<Mode>("time");
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const consent = readStoredPrivacyConsent();
      if (!consent?.preferences) {
        return "dark";
      }
      const stored = localStorage.getItem(STORAGE_THEME);
      return stored === "light" ? "light" : "dark";
    } catch (_error) {
      return "dark";
    }
  });
  const [appRoute, setAppRoute] = useState<AppRoute>(() => routeFromPathname(pathname || "/"));
  const [accessibilityPrefs, setAccessibilityPrefs] = useState<AccessibilityPrefs>(() => ({
    announceEvents: true,
    textScale: 1,
  }));
  const [durationSec, setDurationSec] = useState(60);
  const [dictionaryPack, setDictionaryPack] = useState<DictionaryPack>("core");
  const [username, setUsername] = useState("player");
  const [phase, setPhase] = useState("Ready");
  const [isRunning, setIsRunning] = useState(false);
  const [timerText, setTimerText] = useState("60.0s");
  const [typedPreview, setTypedPreview] = useState("");
  const [promptWords, setPromptWords] = useState<string[]>([]);
  const [wordResults, setWordResults] = useState<Array<"good" | "bad" | undefined>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [largeWords, setLargeWords] = useState<string[]>([]);
  const [dictionaryStatus, setDictionaryStatus] = useState("Loading word list...");
  const [report, setReport] = useState<SessionReport | null>(null);
  const [stats, setStats] = useState<LiveStats>({
    wpm: 0,
    raw: 0,
    cpm: 0,
    kps: 0,
    accuracy: 100,
    efficiency: 100,
    errors: 0,
    streak: 0,
    maxStreak: 0,
    elapsedSec: 0,
    completedWords: 0,
    correctChars: 0,
    wrongChars: 0,
    lives: 5,
  });
  const [bestByMode, setBestByMode] = useState<Record<Mode, number>>({
    time: 0,
    quote: 0,
    meteor: 0,
    zen: 0,
    pulse: 0,
    relay: 0,
    cipher: 0,
    drift: 0,
    reverse: 0,
    echo: 0,
    rogue: 0,
    duel: 0,
    code: 0,
    coach: 0,
    blackout: 0,
    chain: 0,
    gravity: 0,
    coop: 0,
    infection: 0,
    stealth: 0,
    chart: 0,
  });
  const [focusPrefs, setFocusPrefs] = useState<FocusPrefs>({
    enabled: true,
    showStats: true,
    sfxEnabled: true,
    musicEnabled: true,
    sfxVolume: 0.78,
    musicVolume: 0.42,
    statVisibility: DEFAULT_FOCUS_STAT_VISIBILITY,
  });
  const [cipherShift, setCipherShift] = useState(3);
  const [cipherDirection, setCipherDirection] = useState<CipherDirection>("forward");
  const [pulseBpm, setPulseBpm] = useState(108);
  const [pulseJudge, setPulseJudge] = useState<{ label: string; tone: PulseJudgeTone } | null>(null);
  const [soundPack, setSoundPack] = useState<SoundPack>("arcade");
  const [accessibilityPreset, setAccessibilityPreset] = useState<AccessibilityPreset>("standard");
  const [adaptiveTrainer, setAdaptiveTrainer] = useState(false);
  const [weaknessMap, setWeaknessMap] = useState<Record<string, number>>({});
  const [keyStats, setKeyStats] = useState<Record<string, { hits: number; errors: number }>>({});
  const [ghostRuns, setGhostRuns] = useState<Partial<Record<Mode, GhostRun>>>({});
  const [ghostStatus, setGhostStatus] = useState("No ghost");
  const [replays, setReplays] = useState<ReplayRun[]>([]);
  const [selectedReplayId, setSelectedReplayId] = useState<string>("");
  const [replayCursorMs, setReplayCursorMs] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replayNote, setReplayNote] = useState<string | null>(null);
  const [raceName, setRaceName] = useState("Pilot");
  const [raceRoomInput, setRaceRoomInput] = useState("");
  const [raceRoomId, setRaceRoomId] = useState("");
  const [racePlayerId, setRacePlayerId] = useState("");
  const [raceState, setRaceState] = useState<RaceRoomState | null>(null);
  const [raceError, setRaceError] = useState<string | null>(null);
  const [tournamentName, setTournamentName] = useState("Orbital Cup");
  const [tournamentEntrantsInput, setTournamentEntrantsInput] = useState("alpha\nbeta\ngamma\ndelta");
  const [tournamentLookupId, setTournamentLookupId] = useState("");
  const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
  const [tournamentError, setTournamentError] = useState<string | null>(null);
  const [echoPending, setEchoPending] = useState<string | null>(null);
  const [rogueOffer, setRogueOffer] = useState<RogueOffer[] | null>(null);
  const [rogueBuffLabel, setRogueBuffLabel] = useState("No perks yet");
  const [duelRivalProgress, setDuelRivalProgress] = useState(0);
  const [meteorWordsView, setMeteorWordsView] = useState<MeteorWord[]>([]);
  const [meteorSelection, setMeteorSelection] = useState<{ id: number | null; typed: string }>({
    id: null,
    typed: "",
  });
  const [laserFx, setLaserFx] = useState<LaserFx[]>([]);
  const [explosionFx, setExplosionFx] = useState<ExplosionFx[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeBoard, setChallengeBoard] = useState<ChallengeLeaderboardEntry[]>([]);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [challengeNote, setChallengeNote] = useState<string | null>(null);
  const [seasonWindow, setSeasonWindow] = useState<SeasonWindow | null>(null);
  const [seasonBoard, setSeasonBoard] = useState<SeasonLeaderboardEntry[]>([]);
  const [seasonError, setSeasonError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [liveAlertMessage, setLiveAlertMessage] = useState("");
  const [chainCombo, setChainCombo] = useState(1);
  const [coopTurn, setCoopTurn] = useState<1 | 2>(1);
  const [infectedIndices, setInfectedIndices] = useState<number[]>([]);
  const [certifiedRun, setCertifiedRun] = useState(false);
  const [modePreview, setModePreview] = useState<Mode | null>(null);
  const [privacyConsent, setPrivacyConsent] = useState<PrivacyConsent | null>(null);
  const [consentDraft, setConsentDraft] = useState({ analytics: false, preferences: false });
  const [privacyNote, setPrivacyNote] = useState<string | null>(null);
  const [analyticsAdminToken, setAnalyticsAdminToken] = useState("");
  const [analyticsSummaryRows, setAnalyticsSummaryRows] = useState<AnalyticsSummaryRow[]>([]);
  const [analyticsSummaryTotals, setAnalyticsSummaryTotals] = useState<Record<string, number>>({});
  const [analyticsSummaryLoading, setAnalyticsSummaryLoading] = useState(false);
  const [analyticsSummaryError, setAnalyticsSummaryError] = useState<string | null>(null);

  const [accountToken, setAccountToken] = useState<string>("");
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [accountPrefs, setAccountPrefs] = useState<Record<string, unknown>>({});
  const [authHandle, setAuthHandle] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLocale, setAuthLocale] = useState("en");
  const [authNote, setAuthNote] = useState<string | null>(null);
  const [friendHandle, setFriendHandle] = useState("");
  const [friends, setFriends] = useState<FriendListResponse>({
    friends: [],
    incoming: [],
    outgoing: [],
  });
  const [rankedStatus, setRankedStatus] = useState<string>("idle");
  const [activeDuel, setActiveDuel] = useState<DuelState | null>(null);
  const [duelNote, setDuelNote] = useState<string | null>(null);
  const [replayShareTitle, setReplayShareTitle] = useState("My run");
  const [sharedReplayIdInput, setSharedReplayIdInput] = useState("");
  const [replayShares, setReplayShares] = useState<ReplayShareEntry[]>([]);
  const [loadedSharedReplay, setLoadedSharedReplay] = useState<ReplayShareEntry | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState("score.submitted");
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);

  const [settings, setSettings] = useState({
    punctuation: false,
    numbers: false,
    lowercase: false,
    customOnly: false,
  });
  const doNotTrackEnabled = useMemo(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;
    const nav = navigator as Navigator & { msDoNotTrack?: string };
    const win = window as Window & { doNotTrack?: string; globalPrivacyControl?: boolean };
    return (
      nav.doNotTrack === "1" ||
      nav.doNotTrack === "yes" ||
      nav.msDoNotTrack === "1" ||
      win.doNotTrack === "1" ||
      win.globalPrivacyControl === true
    );
  }, []);
  const analyticsEnabled = privacyConsent?.analytics === true && !doNotTrackEnabled;
  const canStoreComfortPrefs = privacyConsent?.preferences === true;
  const clientViewportBucket =
    typeof window !== "undefined" ? viewportBucket(window.innerWidth) : ("lg" as const);
  const localProfileSummary = useMemo(() => {
    const bestEntry = (Object.entries(bestByMode) as Array<[Mode, number]>).reduce<{
      mode: Mode;
      wpm: number;
    } | null>((best, [modeId, value]) => {
      if (!best || value > best.wpm) {
        return { mode: modeId, wpm: value };
      }
      return best;
    }, null);
    const avgWpm =
      replays.length > 0 ? replays.reduce((sum, replay) => sum + replay.wpm, 0) / replays.length : 0;
    const totalReplayEvents = replays.reduce((sum, replay) => sum + replay.events.length, 0);
    return {
      runs: replays.length,
      avgWpm,
      bestMode: bestEntry?.mode ?? mode,
      bestWpm: bestEntry?.wpm ?? bestByMode[mode] ?? 0,
      ghosts: Object.keys(ghostRuns).length,
      replayEvents: totalReplayEvents,
    };
  }, [bestByMode, ghostRuns, mode, replays]);

  const activePool = useMemo(
    () =>
      buildDictionaryPool({
        pack: dictionaryPack,
        customOnly: settings.customOnly,
        customWords,
        largeWords,
        punctuation: settings.punctuation,
        numbers: settings.numbers,
        lowercase: settings.lowercase,
      }),
    [dictionaryPack, settings, customWords, largeWords],
  );
  const weakPatterns = useMemo(
    () =>
      Object.entries(weaknessMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([pattern]) => pattern),
    [weaknessMap],
  );
  const adaptivePool = useMemo(() => {
    if (!adaptiveTrainer || weakPatterns.length === 0 || activePool.length < 100) {
      return activePool;
    }
    const focused = activePool.filter((word) =>
      weakPatterns.some((pattern) => pattern.length > 1 && word.toLowerCase().includes(pattern)),
    );
    if (focused.length >= 220) {
      return [...focused, ...activePool.slice(0, 320)];
    }
    return activePool;
  }, [activePool, adaptiveTrainer, weakPatterns]);
  const playPool = adaptivePool;

  const activeWords = promptWords;

  const visibleWords = useMemo(() => {
    const start = Math.max(0, currentIndex - 14);
    const end = Math.min(activeWords.length, currentIndex + 70);
    const entries = activeWords.slice(start, end).map((word, offset) => ({
      word,
      index: start + offset,
    }));
    if (mode === "reverse") {
      entries.reverse();
    }
    return entries;
  }, [activeWords, currentIndex, mode]);

  useEffect(() => {
    try {
      const storedConsent = readStoredPrivacyConsent();
      const allowStoredComfortPrefs = storedConsent?.preferences === true;
      const storedCustom = localStorage.getItem(STORAGE_CUSTOM);
      if (storedCustom) {
        const parsed = JSON.parse(storedCustom) as string[];
        if (Array.isArray(parsed)) {
          setCustomWords(parsed);
          setCustomInput(parsed.join("\n"));
        }
      }
      const storedBest = localStorage.getItem(STORAGE_BEST);
      if (storedBest) {
        const parsed = JSON.parse(storedBest) as Partial<Record<Mode, number>>;
        if (parsed) {
          setBestByMode({
            time: parsed.time ?? 0,
            quote: parsed.quote ?? 0,
            meteor: parsed.meteor ?? 0,
            zen: parsed.zen ?? 0,
            pulse: parsed.pulse ?? 0,
            relay: parsed.relay ?? 0,
            cipher: parsed.cipher ?? 0,
            drift: parsed.drift ?? 0,
            reverse: parsed.reverse ?? 0,
            echo: parsed.echo ?? 0,
            rogue: parsed.rogue ?? 0,
            duel: parsed.duel ?? 0,
            code: parsed.code ?? 0,
            coach: parsed.coach ?? 0,
            blackout: parsed.blackout ?? 0,
            chain: parsed.chain ?? 0,
            gravity: parsed.gravity ?? 0,
            coop: parsed.coop ?? 0,
            infection: parsed.infection ?? 0,
            stealth: parsed.stealth ?? 0,
            chart: parsed.chart ?? 0,
          });
        }
      }
      if (allowStoredComfortPrefs) {
        const storedFocus = localStorage.getItem(STORAGE_FOCUS_PREFS);
        if (storedFocus) {
          const parsed = JSON.parse(storedFocus) as Partial<FocusPrefs>;
          if (parsed) {
            setFocusPrefs({
              enabled: parsed.enabled ?? true,
              showStats: parsed.showStats ?? true,
              sfxEnabled: parsed.sfxEnabled ?? true,
              musicEnabled: parsed.musicEnabled ?? true,
              sfxVolume: clamp(Number(parsed.sfxVolume ?? 0.78), 0, 1),
              musicVolume: clamp(Number(parsed.musicVolume ?? 0.42), 0, 1),
              statVisibility: {
                ...DEFAULT_FOCUS_STAT_VISIBILITY,
                ...(parsed.statVisibility ?? {}),
              },
            });
          }
        }
        const storedCipher = localStorage.getItem(STORAGE_CIPHER_PREFS);
        if (storedCipher) {
          const parsed = JSON.parse(storedCipher) as
            | Partial<{
                shift: number;
                direction: CipherDirection;
              }>
            | null;
          if (parsed) {
            setCipherShift(clamp(Math.round(parsed.shift ?? 3), 1, 25));
            setCipherDirection(parsed.direction === "backward" ? "backward" : "forward");
          }
        }
        const storedPulse = localStorage.getItem(STORAGE_PULSE_PREFS);
        if (storedPulse) {
          const parsed = JSON.parse(storedPulse) as Partial<{ bpm: number }> | null;
          if (parsed) {
            setPulseBpm(clamp(Math.round(parsed.bpm ?? 108), 60, 220));
          }
        }
        const storedSoundPack = localStorage.getItem(STORAGE_SOUND_PACK);
        if (
          storedSoundPack === "arcade" ||
          storedSoundPack === "retro" ||
          storedSoundPack === "cinematic" ||
          storedSoundPack === "soft" ||
          storedSoundPack === "mute"
        ) {
          setSoundPack(storedSoundPack);
        }
        const storedAccessibility = localStorage.getItem(STORAGE_ACCESSIBILITY);
        if (
          storedAccessibility === "standard" ||
          storedAccessibility === "reduced" ||
          storedAccessibility === "contrast" ||
          storedAccessibility === "colorblind" ||
          storedAccessibility === "dyslexia"
        ) {
          setAccessibilityPreset(storedAccessibility);
        } else {
          if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
            setAccessibilityPreset("reduced");
          } else if (window.matchMedia?.("(prefers-contrast: more)")?.matches) {
            setAccessibilityPreset("contrast");
          }
        }
        const storedA11yPrefs = localStorage.getItem(STORAGE_A11Y_PREFS);
        if (storedA11yPrefs) {
          const parsed = JSON.parse(storedA11yPrefs) as Partial<AccessibilityPrefs> | null;
          if (parsed) {
            setAccessibilityPrefs({
              announceEvents: parsed.announceEvents ?? true,
              textScale: clamp(Number(parsed.textScale ?? 1), 0.85, 1.25),
            });
          }
        }
      } else {
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
          setAccessibilityPreset("reduced");
        } else if (window.matchMedia?.("(prefers-contrast: more)")?.matches) {
          setAccessibilityPreset("contrast");
        }
      }
      const storedWeakness = localStorage.getItem(STORAGE_WEAKNESS_MAP);
      if (storedWeakness) {
        const parsed = JSON.parse(storedWeakness) as Record<string, number>;
        if (parsed && typeof parsed === "object") {
          setWeaknessMap(parsed);
        }
      }
      const storedKeyStats = localStorage.getItem(STORAGE_KEY_STATS);
      if (storedKeyStats) {
        const parsed = JSON.parse(storedKeyStats) as Record<string, { hits: number; errors: number }>;
        if (parsed && typeof parsed === "object") {
          setKeyStats(parsed);
        }
      }
      const storedGhosts = localStorage.getItem(STORAGE_GHOSTS);
      if (storedGhosts) {
        const parsed = JSON.parse(storedGhosts) as Partial<Record<Mode, GhostRun>>;
        if (parsed && typeof parsed === "object") {
          setGhostRuns(parsed);
        }
      }
      const storedReplays = localStorage.getItem(STORAGE_REPLAYS);
      if (storedReplays) {
        const parsed = JSON.parse(storedReplays) as ReplayRun[];
        if (Array.isArray(parsed)) {
          const clipped = parsed.slice(0, 20);
          setReplays(clipped);
          if (clipped[0]) {
            setSelectedReplayId(clipped[0].id);
          }
        }
      }
      const storedRaceMeta = localStorage.getItem(STORAGE_RACE_META);
      if (storedRaceMeta) {
        const parsed = JSON.parse(storedRaceMeta) as
          | Partial<{ raceName: string; roomId: string; playerId: string }>
          | null;
        if (parsed) {
          setRaceName(parsed.raceName?.slice(0, 24) || "Pilot");
          setRaceRoomId(parsed.roomId?.toUpperCase() || "");
          setRaceRoomInput(parsed.roomId?.toUpperCase() || "");
          setRacePlayerId(parsed.playerId || "");
        }
      }
      const storedAccountToken = localStorage.getItem(STORAGE_ACCOUNT_TOKEN);
      if (storedAccountToken) {
        setAccountToken(storedAccountToken);
      }
      const storedAccountProfile = localStorage.getItem(STORAGE_ACCOUNT_PROFILE);
      if (storedAccountProfile) {
        const parsed = JSON.parse(storedAccountProfile) as AccountProfile;
        if (parsed && typeof parsed === "object" && typeof parsed.id === "string") {
          setAccountProfile(parsed);
          setAuthHandle(parsed.handle);
        }
      }
      const storedAccountPrefs = localStorage.getItem(STORAGE_ACCOUNT_PREFS);
      if (storedAccountPrefs) {
        const parsed = JSON.parse(storedAccountPrefs) as Record<string, unknown>;
        if (parsed && typeof parsed === "object") {
          setAccountPrefs(parsed);
        }
      }
      if (storedConsent) {
        setPrivacyConsent(storedConsent);
        setConsentDraft({
          analytics: storedConsent.analytics,
          preferences: storedConsent.preferences,
        });
      }
    } catch (_error) {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    setAppRoute(routeFromPathname(pathname || "/"));
  }, [pathname]);

  useEffect(() => {
    installOfflineSyncHooks();
    void flushQueuedScores();

    if (!("serviceWorker" in navigator)) {
      return;
    }
    if (isDevEnvironment) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
      if ("caches" in window) {
        void caches.keys().then((keys) => {
          for (const key of keys) {
            if (key.startsWith("typeshift-cache")) {
              void caches.delete(key);
            }
          }
        });
      }
      return;
    }
    const register = () => {
      void navigator.serviceWorker.register("/sw.js");
    };
    window.addEventListener("load", register);
    return () => {
      window.removeEventListener("load", register);
    };
  }, [isDevEnvironment]);

  useEffect(() => {
    if (!privacyConsent) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_PRIVACY_CONSENT, JSON.stringify(privacyConsent));
    } catch (_error) {
      // ignore storage write failures
    }
  }, [privacyConsent]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      if (canStoreComfortPrefs) {
        localStorage.setItem(STORAGE_THEME, theme);
      } else {
        localStorage.removeItem(STORAGE_THEME);
      }
    } catch (_error) {
      // ignore storage write failures
    }
  }, [canStoreComfortPrefs, theme]);

  useEffect(() => {
    setAccountPrefs((prev) => {
      const next = { ...prev, privacyConsent };
      if (canStoreComfortPrefs) {
        return {
          ...next,
          theme,
          mode,
          durationSec,
          dictionaryPack,
          soundPack,
          accessibilityPreset,
          textScale: accessibilityPrefs.textScale,
          focusPrefs,
        };
      }
      delete next.theme;
      delete next.mode;
      delete next.durationSec;
      delete next.dictionaryPack;
      delete next.soundPack;
      delete next.accessibilityPreset;
      delete next.textScale;
      delete next.focusPrefs;
      return next;
    });
  }, [
    accessibilityPrefs.textScale,
    accessibilityPreset,
    canStoreComfortPrefs,
    dictionaryPack,
    durationSec,
    focusPrefs,
    mode,
    privacyConsent,
    soundPack,
    theme,
  ]);

  useEffect(() => {
    try {
      if (canStoreComfortPrefs) {
        localStorage.setItem(STORAGE_FOCUS_PREFS, JSON.stringify(focusPrefs));
      } else {
        localStorage.removeItem(STORAGE_FOCUS_PREFS);
      }
    } catch (_error) {
      // ignore storage write failures
    }
  }, [canStoreComfortPrefs, focusPrefs]);

  useEffect(() => {
    try {
      if (canStoreComfortPrefs) {
        localStorage.setItem(
          STORAGE_CIPHER_PREFS,
          JSON.stringify({ shift: cipherShift, direction: cipherDirection }),
        );
      } else {
        localStorage.removeItem(STORAGE_CIPHER_PREFS);
      }
    } catch (_error) {
      // ignore storage write failures
    }
  }, [canStoreComfortPrefs, cipherShift, cipherDirection]);

  useEffect(() => {
    try {
      if (canStoreComfortPrefs) {
        localStorage.setItem(STORAGE_PULSE_PREFS, JSON.stringify({ bpm: pulseBpm }));
      } else {
        localStorage.removeItem(STORAGE_PULSE_PREFS);
      }
    } catch (_error) {
      // ignore storage write failures
    }
  }, [canStoreComfortPrefs, pulseBpm]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accessibility", accessibilityPreset);
    try {
      if (canStoreComfortPrefs) {
        localStorage.setItem(STORAGE_ACCESSIBILITY, accessibilityPreset);
      } else {
        localStorage.removeItem(STORAGE_ACCESSIBILITY);
      }
    } catch (_error) {
      // ignore storage write failures
    }
  }, [accessibilityPreset, canStoreComfortPrefs]);

  useEffect(() => {
    document.documentElement.style.setProperty("--text-scale", String(accessibilityPrefs.textScale));
    try {
      if (canStoreComfortPrefs) {
        localStorage.setItem(STORAGE_A11Y_PREFS, JSON.stringify(accessibilityPrefs));
      } else {
        localStorage.removeItem(STORAGE_A11Y_PREFS);
      }
    } catch (_error) {
      // ignore storage write failures
    }
  }, [accessibilityPrefs, canStoreComfortPrefs]);

  useEffect(() => {
    try {
      if (canStoreComfortPrefs) {
        localStorage.setItem(STORAGE_SOUND_PACK, soundPack);
      } else {
        localStorage.removeItem(STORAGE_SOUND_PACK);
      }
    } catch (_error) {
      // ignore storage write failures
    }
  }, [canStoreComfortPrefs, soundPack]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WEAKNESS_MAP, JSON.stringify(weaknessMap));
    } catch (_error) {
      // ignore storage write failures
    }
  }, [weaknessMap]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(keyStats));
    } catch (_error) {
      // ignore storage write failures
    }
  }, [keyStats]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GHOSTS, JSON.stringify(ghostRuns));
    } catch (_error) {
      // ignore storage write failures
    }
  }, [ghostRuns]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_REPLAYS, JSON.stringify(replays.slice(0, 20)));
    } catch (_error) {
      // ignore storage write failures
    }
  }, [replays]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_RACE_META,
        JSON.stringify({ raceName, roomId: raceRoomId, playerId: racePlayerId }),
      );
    } catch (_error) {
      // ignore storage write failures
    }
  }, [raceName, raceRoomId, racePlayerId]);

  useEffect(() => {
    try {
      if (accountToken) {
        localStorage.setItem(STORAGE_ACCOUNT_TOKEN, accountToken);
      } else {
        localStorage.removeItem(STORAGE_ACCOUNT_TOKEN);
      }
    } catch (_error) {
      // ignore storage write failures
    }
  }, [accountToken]);

  useEffect(() => {
    try {
      if (accountProfile) {
        localStorage.setItem(STORAGE_ACCOUNT_PROFILE, JSON.stringify(accountProfile));
      } else {
        localStorage.removeItem(STORAGE_ACCOUNT_PROFILE);
      }
    } catch (_error) {
      // ignore storage write failures
    }
  }, [accountProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACCOUNT_PREFS, JSON.stringify(accountPrefs));
    } catch (_error) {
      // ignore storage write failures
    }
  }, [accountPrefs]);

  useEffect(() => {
    void flushQueuedScores();
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadLargeDictionary()
      .then((words) => {
        if (cancelled) return;
        setLargeWords(words);
        setDictionaryStatus(`Dictionary loaded: ${words.length.toLocaleString()} words`);
      })
      .catch(() => {
        if (cancelled) return;
        setDictionaryStatus("Using built-in word packs.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function primeWordQueue(target = 1800) {
    if (playPool.length === 0) return;
    const missing = target - wordQueueRef.current.length;
    if (missing > 0) {
      wordQueueRef.current.push(...generateWords(playPool, missing + 700));
    }
  }

  function takeWords(count: number): string[] {
    primeWordQueue(count);
    const out = wordQueueRef.current.splice(0, count);
    if (out.length < count) {
      out.push(...generateWords(playPool, count - out.length));
    }
    primeWordQueue(1800);
    return out;
  }

  useEffect(() => {
    wordQueueRef.current = [];
    primeWordQueue();
    const warmTimer = window.setTimeout(() => {
      primeWordQueue(3200);
    }, 120);
    return () => {
      window.clearTimeout(warmTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePool, adaptiveTrainer]);

  useEffect(() => {
    resetSession(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, durationSec, activePool, adaptiveTrainer]);

  useEffect(
    () => () => {
      clearLoops();
      for (const timeoutId of fxTimeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }
      fxTimeoutsRef.current = [];
      if (pulseJudgeTimeoutRef.current) {
        window.clearTimeout(pulseJudgeTimeoutRef.current);
        pulseJudgeTimeoutRef.current = 0;
      }
    },
    [],
  );

  useEffect(() => {
    promptWordsRef.current = promptWords;
  }, [promptWords]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  function announce(message: string, assertive = false) {
    if (!accessibilityPrefs.announceEvents) {
      return;
    }
    if (assertive) {
      setLiveAlertMessage("");
      window.setTimeout(() => setLiveAlertMessage(message), 5);
      return;
    }
    setLiveMessage("");
    window.setTimeout(() => setLiveMessage(message), 5);
  }

  function trackPrivacyEvent(
    event:
      | "page_view"
      | "mode_select"
      | "run_start"
      | "run_finish"
      | "auth_register"
      | "auth_login"
      | "consent_update",
    options?: {
      page?: string;
      mode?: Mode;
    },
  ): void {
    if (!analyticsEnabled) {
      return;
    }
    sendPrivacyAnalytics({
      event,
      page: options?.page ?? appRoute,
      mode: options?.mode,
      theme,
      consentVersion: PRIVACY_CONSENT_VERSION,
      telemetry: {
        viewportBucket: clientViewportBucket,
        reducedMotion:
          accessibilityPreset === "reduced" || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
        doNotTrack: doNotTrackEnabled,
      },
    });
  }

  function applyPrivacyConsent(next: { analytics: boolean; preferences: boolean }): void {
    const resolved: PrivacyConsent = {
      version: PRIVACY_CONSENT_VERSION,
      analytics: next.analytics && !doNotTrackEnabled,
      preferences: next.preferences,
      decidedAt: new Date().toISOString(),
    };
    setPrivacyConsent(resolved);
    setConsentDraft({
      analytics: resolved.analytics,
      preferences: resolved.preferences,
    });
    setPrivacyNote(
      resolved.analytics
        ? "Anonymous usage stats are on. No tracking cookies are used."
        : "Only essential app behavior is active. Anonymous usage stats stay off.",
    );
    if (accountToken) {
      const nextPrefs = {
        ...accountPrefs,
        privacyConsent: resolved,
      };
      setAccountPrefs(nextPrefs);
      void updateAccountPreferences(accountToken, nextPrefs).catch(() => {
        // keep local consent even if sync fails
      });
    }
    if (resolved.analytics) {
      trackPrivacyEvent("consent_update");
    }
  }

  function navigateToRoute(route: AppRoute): void {
    setAppRoute(route);
    router.push(pathForRoute(route));
  }

  function goBack(fallback: AppRoute = "home"): void {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    navigateToRoute(fallback);
  }

  async function refreshLeaderboard(silent = false) {
    if (!silent) {
      setLeaderboardLoading(true);
    }
    setLeaderboardError(null);
    try {
      const data = await fetchLeaderboard(mode, 15, certifiedRun);
      setLeaderboardEntries(data.entries);
    } catch (error) {
      setLeaderboardError((error as Error).message);
    } finally {
      if (!silent) {
        setLeaderboardLoading(false);
      }
    }
  }

  useEffect(() => {
    refreshLeaderboard();
    const id = window.setInterval(() => {
      refreshLeaderboard(true);
    }, 20_000);
    return () => {
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, certifiedRun]);

  useEffect(() => {
    trackPrivacyEvent("page_view", { page: appRoute, mode: appRoute === "play" ? mode : undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appRoute]);

  useEffect(() => {
    if (appRoute === "play") {
      trackPrivacyEvent("mode_select", { page: "play", mode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (appRoute !== "privacy") {
      return;
    }
    if (analyticsAdminToken.trim() || isDevEnvironment) {
      void refreshAnalyticsSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appRoute, isDevEnvironment]);

  async function refreshChallengeAndSeason(silent = false): Promise<void> {
    if (!silent) {
      setChallengeError(null);
      setSeasonError(null);
    }
    try {
      const [dailyPayload, seasonPayload] = await Promise.all([
        fetchDailyChallenge(),
        fetchCurrentSeason(),
      ]);
      setDailyChallenge(dailyPayload.challenge);
      setSeasonWindow(seasonPayload.season);

      const [challengeBoardPayload, seasonBoardPayload] = await Promise.all([
        fetchChallengeLeaderboard(dailyPayload.challenge.date, 15),
        fetchSeasonLeaderboard(seasonPayload.season.id, 25),
      ]);
      setChallengeBoard(challengeBoardPayload.entries);
      setSeasonBoard(seasonBoardPayload.entries);
      if (!silent) {
        setChallengeError(null);
        setSeasonError(null);
      }
    } catch (error) {
      const message = (error as Error).message;
      setChallengeError(message);
      setSeasonError(message);
    }
  }

  useEffect(() => {
    void refreshChallengeAndSeason();
    const id = window.setInterval(() => {
      void refreshChallengeAndSeason(true);
    }, 60_000);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  async function refreshAnalyticsSummary(): Promise<void> {
    setAnalyticsSummaryLoading(true);
    setAnalyticsSummaryError(null);
    try {
      const payload: AnalyticsSummaryResponse = await fetchAnalyticsSummary({
        token: analyticsAdminToken.trim() || undefined,
        days: 14,
      });
      setAnalyticsSummaryRows(payload.rows);
      setAnalyticsSummaryTotals(payload.totals);
    } catch (error) {
      setAnalyticsSummaryError((error as Error).message);
      setAnalyticsSummaryRows([]);
      setAnalyticsSummaryTotals({});
    } finally {
      setAnalyticsSummaryLoading(false);
    }
  }

  useEffect(() => {
    if (!accountToken) {
      setAccountProfile(null);
      setFriends({ friends: [], incoming: [], outgoing: [] });
      setActiveDuel(null);
      setRankedStatus("idle");
      return;
    }
    void refreshAccountProfile(accountToken);
    void refreshFriends();
    void refreshRankedStatus();
    void refreshReplayShares();
    void refreshWebhooks();
    const id = window.setInterval(() => {
      void refreshFriends();
      void refreshRankedStatus();
      void refreshDuelState();
    }, 3000);
    return () => {
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountToken]);

  useEffect(() => {
    if (!raceRoomId) {
      setRaceState(null);
      return;
    }
    let cancelled = false;
    const pull = () => {
      void fetchRaceRoomState(raceRoomId)
        .then((room) => {
          if (cancelled) return;
          setRaceState(room);
          setRaceError(null);
        })
        .catch((error) => {
          if (cancelled) return;
          setRaceError((error as Error).message);
        });
    };
    pull();
    const id = window.setInterval(pull, 900);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [raceRoomId]);

  async function createRace(): Promise<void> {
    try {
      const result = await createRaceRoom(mode, raceName.trim() || "Pilot");
      setRaceRoomId(result.roomId);
      setRaceRoomInput(result.roomId);
      setRacePlayerId(result.playerId);
      setRaceState(result.room);
      setMode(result.room.mode);
      setRaceError(null);
    } catch (error) {
      setRaceError((error as Error).message);
    }
  }

  async function joinRace(): Promise<void> {
    try {
      const result = await joinRaceRoom(raceRoomInput, raceName.trim() || "Pilot");
      setRaceRoomId(result.roomId);
      setRaceRoomInput(result.roomId);
      setRacePlayerId(result.playerId);
      setRaceState(result.room);
      setMode(result.room.mode);
      setRaceError(null);
    } catch (error) {
      setRaceError((error as Error).message);
    }
  }

  async function startRace(): Promise<void> {
    if (!raceRoomId || !racePlayerId) {
      return;
    }
    try {
      const room = await startRaceRoom(raceRoomId, racePlayerId);
      setRaceState(room);
      setRaceError(null);
      startSession();
    } catch (error) {
      setRaceError((error as Error).message);
    }
  }

  async function createBracket(): Promise<void> {
    try {
      const entrants = tournamentEntrantsInput
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
      const fallback = raceState?.players.map((player) => player.name) ?? [];
      const data = await createTournament({
        mode,
        name: tournamentName.trim() || "Orbital Cup",
        entrants: entrants.length >= 2 ? entrants : fallback,
      });
      setTournamentState(data);
      setTournamentLookupId(data.id);
      setTournamentError(null);
    } catch (error) {
      setTournamentError((error as Error).message);
    }
  }

  useEffect(() => {
    const targetId = tournamentLookupId || tournamentState?.id;
    if (!targetId) {
      return;
    }
    let cancelled = false;
    const pull = () => {
      void fetchTournamentState(targetId)
        .then((nextState) => {
          if (cancelled) return;
          setTournamentState(nextState);
          setTournamentError(null);
        })
        .catch((error) => {
          if (cancelled) return;
          setTournamentError((error as Error).message);
        });
    };
    pull();
    const id = window.setInterval(pull, 1800);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [tournamentLookupId, tournamentState?.id]);

  async function markMatchWinner(matchId: string, winnerId: string): Promise<void> {
    if (!tournamentState) {
      return;
    }
    try {
      const nextState = await reportTournamentMatch({
        tournamentId: tournamentState.id,
        matchId,
        winnerId,
      });
      setTournamentState(nextState);
      setTournamentError(null);
    } catch (error) {
      setTournamentError((error as Error).message);
    }
  }

  async function refreshAccountProfile(token = accountToken): Promise<void> {
    if (!token) {
      setAccountProfile(null);
      return;
    }
    try {
      const payload = await fetchAccountProfile(token);
      setAccountProfile(payload.account);
      setAccountPrefs(payload.preferences);
      setAuthHandle(payload.account.handle);
      const prefs = asRecord(payload.preferences);
      if (prefs) {
        const storedConsent = asRecord(prefs.privacyConsent);
        const allowRemoteComfortPrefs = storedConsent?.preferences === true;
        if (storedConsent && storedConsent.version === PRIVACY_CONSENT_VERSION) {
          const nextConsent: PrivacyConsent = {
            version: PRIVACY_CONSENT_VERSION,
            analytics: storedConsent.analytics === true,
            preferences: storedConsent.preferences === true,
            decidedAt:
              typeof storedConsent.decidedAt === "string"
                ? storedConsent.decidedAt
                : new Date().toISOString(),
          };
          setPrivacyConsent(nextConsent);
          setConsentDraft({
            analytics: nextConsent.analytics,
            preferences: nextConsent.preferences,
          });
        }
        if (allowRemoteComfortPrefs) {
          const remoteFocusPrefs = asRecord(prefs.focusPrefs);
          if (remoteFocusPrefs) {
            setFocusPrefs((prev) => ({
              enabled: typeof remoteFocusPrefs.enabled === "boolean" ? remoteFocusPrefs.enabled : prev.enabled,
              showStats:
                typeof remoteFocusPrefs.showStats === "boolean" ? remoteFocusPrefs.showStats : prev.showStats,
              sfxEnabled:
                typeof remoteFocusPrefs.sfxEnabled === "boolean" ? remoteFocusPrefs.sfxEnabled : prev.sfxEnabled,
              musicEnabled:
                typeof remoteFocusPrefs.musicEnabled === "boolean"
                  ? remoteFocusPrefs.musicEnabled
                  : prev.musicEnabled,
              sfxVolume: clamp(Number(remoteFocusPrefs.sfxVolume ?? prev.sfxVolume), 0, 1),
              musicVolume: clamp(Number(remoteFocusPrefs.musicVolume ?? prev.musicVolume), 0, 1),
              statVisibility: {
                ...DEFAULT_FOCUS_STAT_VISIBILITY,
                ...(asRecord(remoteFocusPrefs.statVisibility) ?? prev.statVisibility),
              },
            }));
          }
          if (prefs.theme === "dark" || prefs.theme === "light") {
            setTheme(prefs.theme);
          }
          if (typeof prefs.durationSec === "number") {
            setDurationSec(clamp(Math.round(prefs.durationSec), 30, 120));
          }
          if (
            prefs.dictionaryPack === "core" ||
            prefs.dictionaryPack === "tech" ||
            prefs.dictionaryPack === "myth" ||
            prefs.dictionaryPack === "blitz" ||
            prefs.dictionaryPack === "top1k" ||
            prefs.dictionaryPack === "top5k" ||
            prefs.dictionaryPack === "top10k" ||
            prefs.dictionaryPack === "verbs" ||
            prefs.dictionaryPack === "nouns" ||
            prefs.dictionaryPack === "code" ||
            prefs.dictionaryPack === "spanish" ||
            prefs.dictionaryPack === "french" ||
            prefs.dictionaryPack === "german"
          ) {
            setDictionaryPack(prefs.dictionaryPack);
          }
        }
      }
      setAuthNote(null);
    } catch (error) {
      setAuthNote((error as Error).message);
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setAccountToken("");
        setAccountProfile(null);
      }
    }
  }

  async function registerAccountFlow(): Promise<void> {
    const handle = authHandle.trim();
    if (!handleLooksValid(handle)) {
      setAuthNote("Handle must be 2-24 chars and only use letters, numbers, spaces, dots, dashes, or underscores.");
      return;
    }
    if (!passwordLooksValid(authPassword)) {
      setAuthNote("Password must be at least 10 chars with uppercase, lowercase, and a number.");
      return;
    }
    try {
      const payload = await registerAccount({
        handle,
        password: authPassword,
        locale: authLocale,
      });
      setAccountToken(payload.token);
      setAccountProfile(payload.account);
      setAuthPassword("");
      setAuthNote("Account created and signed in.");
      trackPrivacyEvent("auth_register", { page: "profile" });
      await refreshAccountProfile(payload.token);
    } catch (error) {
      setAuthNote((error as Error).message);
    }
  }

  async function loginAccountFlow(): Promise<void> {
    const handle = authHandle.trim();
    if (!handleLooksValid(handle)) {
      setAuthNote("Enter the same handle format you registered with.");
      return;
    }
    if (!authPassword) {
      setAuthNote("Password is required.");
      return;
    }
    try {
      const payload = await loginAccount({
        handle,
        password: authPassword,
      });
      setAccountToken(payload.token);
      setAccountProfile(payload.account);
      setAuthPassword("");
      setAuthNote("Signed in.");
      trackPrivacyEvent("auth_login", { page: "profile" });
      await refreshAccountProfile(payload.token);
    } catch (error) {
      setAuthNote((error as Error).message);
    }
  }

  async function refreshFriends(): Promise<void> {
    if (!accountToken) return;
    try {
      const payload = await fetchFriends(accountToken);
      setFriends(payload);
    } catch (_error) {
      // keep UI responsive
    }
  }

  async function sendFriendRequest(): Promise<void> {
    if (!accountToken || !friendHandle.trim()) return;
    try {
      await requestFriend(accountToken, friendHandle.trim());
      setFriendHandle("");
      await refreshFriends();
    } catch (error) {
      setAuthNote((error as Error).message);
    }
  }

  async function respondFriendRequest(requestId: string, accept: boolean): Promise<void> {
    if (!accountToken) return;
    try {
      await respondFriend(accountToken, requestId, accept);
      await refreshFriends();
    } catch (error) {
      setAuthNote((error as Error).message);
    }
  }

  async function enqueueRankedFlow(): Promise<void> {
    if (!accountToken) return;
    try {
      const result = await enqueueRanked(accountToken);
      setRankedStatus(result.status);
      if (result.duel) {
        setActiveDuel(result.duel);
      }
    } catch (error) {
      setDuelNote((error as Error).message);
    }
  }

  async function enqueueDuelFlow(): Promise<void> {
    if (!accountToken) return;
    try {
      const result = await enqueueCasualDuel(accountToken);
      setRankedStatus(result.status);
      if (result.duel) {
        setActiveDuel(result.duel);
      }
    } catch (error) {
      setDuelNote((error as Error).message);
    }
  }

  async function refreshRankedStatus(): Promise<void> {
    if (!accountToken) return;
    try {
      const status = await fetchRankedStatus(accountToken);
      setRankedStatus(status.status);
      if (status.duel) {
        setActiveDuel(status.duel);
      }
    } catch (_error) {
      // no-op
    }
  }

  async function refreshDuelState(): Promise<void> {
    if (!accountToken || !activeDuel) return;
    try {
      const payload = await fetchDuelState(accountToken, activeDuel.id);
      setActiveDuel(payload.duel);
    } catch (_error) {
      // no-op
    }
  }

  async function pushDuelProgress(finished = false): Promise<void> {
    if (!accountToken || !activeDuel) return;
    try {
      const payload = await updateDuelState(accountToken, {
        duelId: activeDuel.id,
        progress: computeRaceProgress(),
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        finished,
      });
      setActiveDuel(payload.duel);
    } catch (_error) {
      // no-op
    }
  }

  async function shareSelectedReplay(): Promise<void> {
    const source =
      replays.find((item) => item.id === selectedReplayId) ??
      replays[0];
    if (!source) {
      setReplayNote("No replay to share.");
      return;
    }
    try {
      const payload = await shareReplay({
        token: accountToken || undefined,
        mode: source.mode,
        title: replayShareTitle.trim() || "Shared run",
        replay: source as unknown as Record<string, unknown>,
        isPublic: true,
      });
      setReplayNote(`Replay shared: ${payload.id}`);
      await refreshReplayShares();
    } catch (error) {
      setReplayNote((error as Error).message);
    }
  }

  async function loadSharedReplay(): Promise<void> {
    if (!sharedReplayIdInput.trim()) return;
    try {
      const payload = await fetchSharedReplay(sharedReplayIdInput.trim());
      setLoadedSharedReplay({
        id: payload.id,
        accountId: payload.accountId,
        mode: payload.mode,
        title: payload.title,
        isPublic: payload.isPublic,
        createdAt: payload.createdAt,
      });
      setReplayNote(`Loaded shared replay ${payload.id}.`);
    } catch (error) {
      setReplayNote((error as Error).message);
    }
  }

  async function refreshReplayShares(): Promise<void> {
    try {
      const payload = await listReplayShares({
        mine: Boolean(accountToken),
        token: accountToken || undefined,
      });
      setReplayShares(payload.entries);
    } catch (_error) {
      // no-op
    }
  }

  async function refreshWebhooks(): Promise<void> {
    if (!accountToken) {
      setWebhooks([]);
      return;
    }
    try {
      const payload = await listWebhooks(accountToken);
      setWebhooks(payload.entries);
    } catch (_error) {
      // no-op
    }
  }

  async function createWebhookFlow(): Promise<void> {
    if (!accountToken || !webhookUrl.trim()) return;
    try {
      const created = await createWebhook(
        accountToken,
        webhookUrl.trim(),
        webhookEvents
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean),
      );
      setAuthNote(`Webhook created. Secret: ${created.secret ?? "hidden"}`);
      setWebhookUrl("");
      await refreshWebhooks();
    } catch (error) {
      setAuthNote((error as Error).message);
    }
  }

  async function deleteWebhookFlow(id: string): Promise<void> {
    if (!accountToken) return;
    try {
      await deleteWebhook(accountToken, id);
      await refreshWebhooks();
    } catch (error) {
      setAuthNote((error as Error).message);
    }
  }

  async function testWebhookFlow(id: string): Promise<void> {
    if (!accountToken) return;
    try {
      await testWebhook(accountToken, id);
      setAuthNote("Webhook test sent.");
    } catch (error) {
      setAuthNote((error as Error).message);
    }
  }

  function activateDailyChallenge(): void {
    if (!dailyChallenge) {
      return;
    }
    setMode(dailyChallenge.mode);
    setDurationSec(dailyChallenge.durationSec);
    setDictionaryPack(dailyChallenge.dictionaryPack as DictionaryPack);
    setChallengeActive(true);
    setChallengeNote(`Challenge loaded: ${dailyChallenge.id}`);
    announce(`Daily challenge preset loaded for ${dailyChallenge.date}`);
    resetSession(true);
  }

  useEffect(() => {
    if (!challengeActive || !dailyChallenge) {
      return;
    }
    const stillMatching =
      mode === dailyChallenge.mode &&
      durationSec === dailyChallenge.durationSec &&
      dictionaryPack === (dailyChallenge.dictionaryPack as DictionaryPack);
    if (!stillMatching) {
      setChallengeActive(false);
      setChallengeNote("Challenge preset changed. Run will not submit to daily board.");
      announce("Challenge preset changed. Daily challenge submission is disabled until you reload it.");
    }
  }, [challengeActive, dailyChallenge, mode, durationSec, dictionaryPack]);

  function syncMeteorSelection() {
    const runtime = runtimeRef.current;
    setMeteorSelection((prev) => {
      if (prev.id === runtime.meteorLockId && prev.typed === runtime.meteorBuffer) {
        return prev;
      }
      return {
        id: runtime.meteorLockId,
        typed: runtime.meteorBuffer,
      };
    });
  }

  function clearMeteorSelection() {
    const runtime = runtimeRef.current;
    runtime.meteorLockId = null;
    runtime.meteorBuffer = "";
    syncMeteorSelection();
  }

  function saveBestForMode(nextWpm: number) {
    setBestByMode((prev) => {
      const current = prev[mode] ?? 0;
      if (nextWpm <= current) {
        return prev;
      }
      const next = { ...prev, [mode]: Number(nextWpm.toFixed(1)) };
      localStorage.setItem(STORAGE_BEST, JSON.stringify(next));
      return next;
    });
  }

  function updateLiveStats() {
    const runtime = runtimeRef.current;
    const summary = scoreSummary(runtime);
    const cpm = (runtime.rawChars / summary.elapsedSec) * 60;
    const kps = runtime.rawChars / summary.elapsedSec;
    const efficiency = runtime.rawChars > 0 ? (runtime.correctChars / runtime.rawChars) * 100 : 100;
    setStats({
      wpm: summary.wpm,
      raw: summary.raw,
      cpm,
      kps,
      accuracy: summary.accuracy,
      efficiency,
      errors: runtime.errors,
      streak: runtime.streak,
      maxStreak: runtime.maxStreak,
      elapsedSec: summary.elapsedSec,
      completedWords: runtime.completedWords,
      correctChars: runtime.correctChars,
      wrongChars: runtime.wrongChars,
      lives: runtime.lives,
    });
  }

  function showPulseJudge(label: string, tone: PulseJudgeTone) {
    setPulseJudge({ label, tone });
    playJudgeSfx(tone);
    if (pulseJudgeTimeoutRef.current) {
      window.clearTimeout(pulseJudgeTimeoutRef.current);
    }
    pulseJudgeTimeoutRef.current = window.setTimeout(() => {
      setPulseJudge(null);
      pulseJudgeTimeoutRef.current = 0;
    }, 700);
  }

  function logReplayEvent(kind: ReplayEvent["kind"], key: string, correct: boolean): void {
    const runtime = runtimeRef.current;
    if (runtime.status !== "running") {
      return;
    }
    const t = Math.max(0, performance.now() - runtime.startMs);
    keyEventsRef.current.push({ t, key, kind, correct });
    if (keyEventsRef.current.length > 6000) {
      keyEventsRef.current = keyEventsRef.current.slice(-6000);
    }
  }

  function bumpKeyStat(rawKey: string, correct: boolean): void {
    const key = rawKey.toLowerCase();
    if (!/^[a-z0-9]$/.test(key)) {
      return;
    }
    setKeyStats((prev) => {
      const current = prev[key] ?? { hits: 0, errors: 0 };
      const next = {
        hits: current.hits + 1,
        errors: current.errors + (correct ? 0 : 1),
      };
      return { ...prev, [key]: next };
    });
  }

  function pushWeakness(target: string, typed: string): void {
    const patterns = extractWeakPatterns(target, typed);
    if (patterns.length === 0) return;
    setWeaknessMap((prev) => {
      const next = { ...prev };
      for (const pattern of patterns) {
        next[pattern] = (next[pattern] ?? 0) + 1;
      }
      return next;
    });
  }

  function noteKeyInterval(): void {
    const runtime = runtimeRef.current;
    if (runtime.status !== "running") {
      return;
    }
    const now = performance.now();
    if (lastKeyTsRef.current > 0) {
      const interval = now - lastKeyTsRef.current;
      keyIntervalsRef.current.push(interval);
      if (keyIntervalsRef.current.length > 5000) {
        keyIntervalsRef.current = keyIntervalsRef.current.slice(-5000);
      }
    }
    lastKeyTsRef.current = now;
  }

  function computeRaceProgress(): number {
    const runtime = runtimeRef.current;
    if (mode === "meteor") {
      return clamp(runtime.completedWords * 2.4, 0, 100);
    }
    const total = Math.max(1, promptWordsRef.current.length);
    return clamp((currentIndexRef.current / total) * 100, 0, 100);
  }

  function rogueOffers(): RogueOffer[] {
    const offers: RogueOffer[] = [
      {
        id: "overclock",
        name: "Overclock Core",
        description: "+20% score gain",
        apply: (buffs) => ({ ...buffs, scoreMultiplier: buffs.scoreMultiplier + 0.2 }),
      },
      {
        id: "shield",
        name: "Nano Shield",
        description: "Ignore next 6 mistakes",
        apply: (buffs) => ({ ...buffs, shieldCharges: buffs.shieldCharges + 6 }),
      },
      {
        id: "stabilizer",
        name: "Gyro Stabilizer",
        description: "Mistake penalty reduced",
        apply: (buffs) => ({ ...buffs, wrongPenaltyScale: buffs.wrongPenaltyScale * 0.6 }),
      },
      {
        id: "combo",
        name: "Combo Reactor",
        description: "Extra bonus on long streaks",
        apply: (buffs) => ({ ...buffs, comboBonus: buffs.comboBonus + 1 }),
      },
      {
        id: "time",
        name: "Time Warp",
        description: "+12s run time",
        apply: (buffs) => ({ ...buffs, extraTimeSec: buffs.extraTimeSec + 12 }),
      },
    ];
    return randomPick(offers, 3);
  }

  function applyRogueOffer(choiceIndex: number): void {
    const currentOffers = rogueOffer;
    if (!currentOffers) {
      return;
    }
    const picked = currentOffers[choiceIndex];
    if (!picked) {
      return;
    }
    rogueBuffsRef.current = picked.apply(rogueBuffsRef.current);
    setRogueBuffLabel(`${picked.name}: ${picked.description}`);
    setRogueOffer(null);
  }

  function clearLoops() {
    const runtime = runtimeRef.current;
    if (runtime.hudRaf) {
      cancelAnimationFrame(runtime.hudRaf);
      runtime.hudRaf = 0;
    }
    if (runtime.meteorRaf) {
      cancelAnimationFrame(runtime.meteorRaf);
      runtime.meteorRaf = 0;
    }
    if (musicLoopRef.current) {
      window.clearInterval(musicLoopRef.current);
      musicLoopRef.current = 0;
    }
  }

  function scheduleFxCleanup(callback: () => void, delayMs: number) {
    const timeoutId = window.setTimeout(() => {
      callback();
      fxTimeoutsRef.current = fxTimeoutsRef.current.filter((id) => id !== timeoutId);
    }, delayMs);
    fxTimeoutsRef.current.push(timeoutId);
  }

  function getAudioContext(): AudioContext | null {
    if (soundPack === "mute") {
      return null;
    }
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch (_error) {
      return null;
    }
  }

  function musicProfileForMode(currentMode: Mode): {
    intervalMs: number;
    lead: number[];
    bass: number[];
    leadType: OscillatorType;
    accentType: OscillatorType;
  } {
    if (currentMode === "meteor") {
      return {
        intervalMs: 360,
        lead: [392, 440, 523.25, 659.25, 587.33, 523.25],
        bass: [130.81, 146.83, 164.81, 174.61],
        leadType: "triangle",
        accentType: "sawtooth",
      };
    }
    if (currentMode === "pulse" || currentMode === "duel" || currentMode === "chart") {
      return {
        intervalMs: Math.max(140, Math.round((60_000 / Math.max(70, pulseBpm)) / 2)),
        lead: [523.25, 587.33, 659.25, 783.99, 659.25, 587.33],
        bass: [130.81, 146.83, 164.81, 196],
        leadType: "square",
        accentType: "triangle",
      };
    }
    return {
      intervalMs: 430,
      lead: [261.63, 329.63, 392, 440, 392, 329.63],
      bass: [98, 110, 130.81, 146.83],
      leadType: "sine",
      accentType: "triangle",
    };
  }

  function playMusicTone(
    ctx: AudioContext,
    input: {
      frequency: number;
      durationSec: number;
      volume: number;
      type: OscillatorType;
      startAt?: number;
    },
  ): void {
    const startAt = input.startAt ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(input.frequency * 5.5, startAt);
    osc.type = input.type;
    osc.frequency.setValueAtTime(input.frequency, startAt);
    gain.gain.setValueAtTime(0.001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, input.volume * focusPrefs.musicVolume), startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + input.durationSec);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + input.durationSec + 0.04);
  }

  function startMusicLoop(): void {
    if (!focusPrefs.musicEnabled || soundPack === "mute") {
      return;
    }
    const ctx = getAudioContext();
    if (!ctx) {
      return;
    }
    if (musicLoopRef.current) {
      window.clearInterval(musicLoopRef.current);
      musicLoopRef.current = 0;
    }
    musicStepRef.current = 0;
    const profile = musicProfileForMode(mode);
    const tick = () => {
      if (runtimeRef.current.status !== "running") {
        return;
      }
      const step = musicStepRef.current++;
      const now = ctx.currentTime + 0.02;
      const leadFreq = profile.lead[step % profile.lead.length] ?? profile.lead[0] ?? 261.63;
      const bassFreq = profile.bass[Math.floor(step / 2) % profile.bass.length] ?? profile.bass[0] ?? 98;
      playMusicTone(ctx, {
        frequency: leadFreq,
        durationSec: profile.intervalMs / 1000,
        volume: mode === "meteor" ? 0.055 : 0.04,
        type: profile.leadType,
        startAt: now,
      });
      if (step % 2 === 0) {
        playMusicTone(ctx, {
          frequency: bassFreq,
          durationSec: (profile.intervalMs / 1000) * 1.8,
          volume: mode === "meteor" ? 0.05 : 0.032,
          type: "sine",
          startAt: now,
        });
      }
      if (mode === "pulse" || mode === "duel" || mode === "chart") {
        playMusicTone(ctx, {
          frequency: leadFreq * 2,
          durationSec: 0.08,
          volume: 0.018,
          type: profile.accentType,
          startAt: now,
        });
      }
    };
    tick();
    musicLoopRef.current = window.setInterval(tick, profile.intervalMs);
  }

  function playLaserSfx() {
    if (!focusPrefs.sfxEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const sfxLevel = Math.max(0.001, focusPrefs.sfxVolume);
    if (soundPack === "retro") {
      osc.type = "square";
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.07);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.09 * sfxLevel, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    } else if (soundPack === "cinematic") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(960, now);
      osc.frequency.exponentialRampToValueAtTime(210, now + 0.12);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.15 * sfxLevel, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    } else if (soundPack === "soft") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(820, now);
      osc.frequency.exponentialRampToValueAtTime(430, now + 0.09);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.07 * sfxLevel, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.13 * sfxLevel, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  function playLockSfx() {
    if (!focusPrefs.sfxEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const sfxLevel = Math.max(0.001, focusPrefs.sfxVolume);
    osc.type = soundPack === "retro" ? "square" : "triangle";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.06);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime((soundPack === "soft" ? 0.04 : 0.08) * sfxLevel, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  function playJudgeSfx(tone: PulseJudgeTone) {
    if (!focusPrefs.sfxEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const sfxLevel = Math.max(0.001, focusPrefs.sfxVolume);
    const frequency =
      tone === "perfect" ? 760 : tone === "great" ? 620 : tone === "ok" ? 480 : 220;
    const lead = ctx.createOscillator();
    const leadGain = ctx.createGain();
    lead.type = tone === "miss" ? "sawtooth" : "triangle";
    lead.frequency.setValueAtTime(frequency, now);
    lead.frequency.exponentialRampToValueAtTime(tone === "miss" ? 140 : frequency * 0.72, now + 0.12);
    leadGain.gain.setValueAtTime(0.001, now);
    leadGain.gain.exponentialRampToValueAtTime((tone === "perfect" ? 0.1 : 0.065) * sfxLevel, now + 0.015);
    leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    lead.connect(leadGain);
    leadGain.connect(ctx.destination);
    lead.start(now);
    lead.stop(now + 0.16);

    if (tone !== "miss") {
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkle.type = soundPack === "retro" ? "square" : "sine";
      sparkle.frequency.setValueAtTime(frequency * 2.02, now);
      sparkle.frequency.exponentialRampToValueAtTime(frequency * 1.2, now + 0.09);
      sparkleGain.gain.setValueAtTime(0.001, now);
      sparkleGain.gain.exponentialRampToValueAtTime((tone === "perfect" ? 0.045 : 0.025) * sfxLevel, now + 0.01);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      sparkle.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);
      sparkle.start(now);
      sparkle.stop(now + 0.12);
    }
  }

  function playExplosionSfx() {
    if (!focusPrefs.sfxEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const sfxLevel = Math.max(0.001, focusPrefs.sfxVolume);
    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    const crack = ctx.createOscillator();
    const crackGain = ctx.createGain();
    if (soundPack === "retro") {
      body.type = "square";
      body.frequency.setValueAtTime(160, now);
      body.frequency.exponentialRampToValueAtTime(50, now + 0.22);
      bodyGain.gain.setValueAtTime(0.001, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.12 * sfxLevel, now + 0.02);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      crack.type = "square";
      crack.frequency.setValueAtTime(540, now);
      crack.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      crackGain.gain.setValueAtTime(0.001, now);
      crackGain.gain.exponentialRampToValueAtTime(0.04 * sfxLevel, now + 0.008);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else if (soundPack === "cinematic") {
      body.type = "triangle";
      body.frequency.setValueAtTime(210, now);
      body.frequency.exponentialRampToValueAtTime(42, now + 0.35);
      bodyGain.gain.setValueAtTime(0.001, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.24 * sfxLevel, now + 0.04);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      crack.type = "sawtooth";
      crack.frequency.setValueAtTime(860, now);
      crack.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      crackGain.gain.setValueAtTime(0.001, now);
      crackGain.gain.exponentialRampToValueAtTime(0.05 * sfxLevel, now + 0.012);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    } else if (soundPack === "soft") {
      body.type = "sine";
      body.frequency.setValueAtTime(220, now);
      body.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      bodyGain.gain.setValueAtTime(0.001, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.1 * sfxLevel, now + 0.03);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      crack.type = "triangle";
      crack.frequency.setValueAtTime(600, now);
      crack.frequency.exponentialRampToValueAtTime(180, now + 0.09);
      crackGain.gain.setValueAtTime(0.001, now);
      crackGain.gain.exponentialRampToValueAtTime(0.02 * sfxLevel, now + 0.01);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else {
      body.type = "triangle";
      body.frequency.setValueAtTime(180, now);
      body.frequency.exponentialRampToValueAtTime(58, now + 0.25);
      bodyGain.gain.setValueAtTime(0.001, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.19 * sfxLevel, now + 0.03);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      crack.type = "sawtooth";
      crack.frequency.setValueAtTime(720, now);
      crack.frequency.exponentialRampToValueAtTime(150, now + 0.1);
      crackGain.gain.setValueAtTime(0.001, now);
      crackGain.gain.exponentialRampToValueAtTime(0.045 * sfxLevel, now + 0.012);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    }
    body.connect(bodyGain);
    crack.connect(crackGain);
    bodyGain.connect(ctx.destination);
    crackGain.connect(ctx.destination);
    body.start(now);
    crack.start(now);
    body.stop(now + 0.42);
    crack.stop(now + 0.16);
  }

  function triggerLaser(word: MeteorWord) {
    const id = ++fxIdRef.current;
    setLaserFx((prev) => [...prev, { id, xPercent: word.xPercent, yPercent: word.yPercent, lockId: word.id }]);
    scheduleFxCleanup(() => {
      setLaserFx((prev) => prev.filter((fx) => fx.id !== id));
    }, 90);
    playLaserSfx();
  }

  function triggerExplosion(word: MeteorWord) {
    const id = ++fxIdRef.current;
    setExplosionFx((prev) => [...prev, { id, xPercent: word.xPercent, yPercent: word.yPercent }]);
    scheduleFxCleanup(() => {
      setExplosionFx((prev) => prev.filter((fx) => fx.id !== id));
    }, 460);
    playExplosionSfx();
  }

  useEffect(() => {
    if (isRunning && focusPrefs.musicEnabled && soundPack !== "mute") {
      startMusicLoop();
    } else if (musicLoopRef.current) {
      window.clearInterval(musicLoopRef.current);
      musicLoopRef.current = 0;
    }
    return () => {
      if (musicLoopRef.current) {
        window.clearInterval(musicLoopRef.current);
        musicLoopRef.current = 0;
      }
    };
  }, [focusPrefs.musicEnabled, focusPrefs.musicVolume, isRunning, mode, pulseBpm, soundPack]);

  function spawnMeteorWord(yPercent?: number, speed?: number) {
    const runtime = runtimeRef.current;
    const word = playPool[Math.floor(Math.random() * playPool.length)] ?? "signal";
    runtime.meteorWordId += 1;

    // Spawn near/off the top so meteors travel farther before reaching the floor.
    const spawnY = yPercent ?? -26 + Math.random() * 14;
    const spawnSpeed = speed ?? 6 + Math.random() * 5;

    runtime.meteorWords.push({
      id: runtime.meteorWordId,
      text: word,
      xPercent: Math.random() * 82 + 6,
      yPercent: spawnY,
      speed: spawnSpeed,
    });
  }

  function seedMeteorField() {
    const runtime = runtimeRef.current;
    runtime.meteorWords = [];
    runtime.meteorWordId = 0;

    for (let i = 0; i < 6; i += 1) {
      const y = -20 + Math.random() * 22;
      const speed = 6 + Math.random() * 4;
      spawnMeteorWord(y, speed);
    }

    setMeteorWordsView([...runtime.meteorWords]);
  }

  function resetSession(remix: boolean) {
    clearLoops();
    setIsRunning(false);

    const runtime = runtimeRef.current;
    runtime.status = "idle";
    runtime.runNonce += 1;
    runtime.startMs = 0;
    runtime.finishMs = 0;
    runtime.correctChars = 0;
    runtime.wrongChars = 0;
    runtime.rawChars = 0;
    runtime.errors = 0;
    runtime.streak = 0;
    runtime.maxStreak = 0;
    runtime.completedWords = 0;
    runtime.lives = 5;
    runtime.meteorWords = [];
    runtime.meteorSpawnClock = 0;
    runtime.meteorLastTs = 0;
    runtime.meteorLastPaint = 0;
    runtime.meteorLockId = null;
    runtime.meteorBuffer = "";
    runtime.sessionId = null;
    runtime.sessionToken = null;
    runtime.lastHudPaint = 0;
    runSamplesRef.current = [];
    keyEventsRef.current = [];
    keyIntervalsRef.current = [];
    lastKeyTsRef.current = 0;
    echoPendingRef.current = null;
    rogueBuffsRef.current = {
      scoreMultiplier: 1,
      shieldCharges: 0,
      wrongPenaltyScale: 1,
      comboBonus: 0,
      extraTimeSec: 0,
    };
    racePushAtRef.current = 0;

    if (previewRafRef.current) {
      cancelAnimationFrame(previewRafRef.current);
      previewRafRef.current = 0;
    }

    typedRef.current = "";
    pendingPreviewRef.current = "";
    setTypedPreview("");
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setWordResults([]);
    setMeteorWordsView([]);
    setMeteorSelection({ id: null, typed: "" });
    setLaserFx([]);
    setExplosionFx([]);
    if (pulseJudgeTimeoutRef.current) {
      window.clearTimeout(pulseJudgeTimeoutRef.current);
      pulseJudgeTimeoutRef.current = 0;
    }
    setPulseJudge(null);
    setEchoPending(null);
    setRogueOffer(null);
    setRogueBuffLabel("No perks yet");
    setDuelRivalProgress(0);
    setChainCombo(1);
    setCoopTurn(1);
    setInfectedIndices([]);
    setGhostStatus("No ghost");
    setPhase("Ready");
    setReport(null);
    setTimerText(MODE_META[mode].timed ? formatSeconds(durationSec) : "∞");
    setStats({
      wpm: 0,
      raw: 0,
      cpm: 0,
      kps: 0,
      accuracy: 100,
      efficiency: 100,
      errors: 0,
      streak: 0,
      maxStreak: 0,
      elapsedSec: 0,
      completedWords: 0,
      correctChars: 0,
      wrongChars: 0,
      lives: 5,
    });

    if (!remix) return;

    announce("Run reset. Ready when you are.");

    if (mode === "meteor") {
      promptWordsRef.current = [];
      setPromptWords([]);
      seedMeteorField();
      return;
    }

    if (mode === "quote") {
      let quote = QUOTES[Math.floor(Math.random() * QUOTES.length)] ?? QUOTES[0];
      if (!settings.punctuation) {
        quote = quote.replace(/[.,!?;:]/g, "");
      }
      if (settings.lowercase) {
        quote = quote.toLowerCase();
      }
      const nextWords = quote.split(/\s+/).filter(Boolean);
      promptWordsRef.current = nextWords;
      setPromptWords(nextWords);
      return;
    }

    if (mode === "code") {
      const snippet =
        CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)] ?? CODE_SNIPPETS[0] ?? "";
      const nextWords = snippet
        .replace(/[{}()[\];,.]/g, " ")
        .split(/\s+/)
        .map((word) => word.trim())
        .filter(Boolean);
      promptWordsRef.current = nextWords;
      setPromptWords(nextWords);
      return;
    }

    const nextCount = mode === "zen" ? 260 : 220;
    const nextWords = challengeActive && dailyChallenge
      ? generateSeededWords(playPool, nextCount, dailyChallenge.seed)
      : mode === "coach"
        ? generateCoachWords(playPool, weakPatterns, nextCount)
        : takeWords(nextCount);
    promptWordsRef.current = nextWords;
    setPromptWords(nextWords);
  }

  function scheduleTypedPreview(nextValue: string) {
    pendingPreviewRef.current = nextValue;
    if (previewRafRef.current) {
      return;
    }
    previewRafRef.current = requestAnimationFrame(() => {
      previewRafRef.current = 0;
      setTypedPreview(pendingPreviewRef.current);
    });
  }

  function startHudLoop() {
    const frame = (timestamp: number) => {
      const runtime = runtimeRef.current;
      if (runtime.status !== "running") return;

      if (timestamp - runtime.lastHudPaint > 70) {
        const elapsed = scoreSummary(runtime).elapsedSec;
        runSamplesRef.current.push({
          t: elapsed,
          words: runtime.completedWords,
          chars: runtime.correctChars,
        });
        if (runSamplesRef.current.length > 3000) {
          runSamplesRef.current = runSamplesRef.current.slice(-3000);
        }

        if (MODE_META[mode].timed) {
          const extraTime = mode === "rogue" ? rogueBuffsRef.current.extraTimeSec : 0;
          const remain = durationSec + extraTime - elapsed;
          setTimerText(formatSeconds(remain));
          if (remain <= 0) {
            endSession("Time up");
            return;
          }
        } else {
          setTimerText(formatSeconds(elapsed));
        }

        const ghost = ghostRuns[mode];
        if (ghost && ghost.samples.length > 0) {
          let nearest = ghost.samples[ghost.samples.length - 1];
          for (const sample of ghost.samples) {
            if (sample.t >= elapsed) {
              nearest = sample;
              break;
            }
          }
          const diff = runtime.correctChars - nearest.chars;
          if (Math.abs(diff) < 4) {
            setGhostStatus("Ghost pace: neck and neck");
          } else if (diff > 0) {
            setGhostStatus(`Ghost pace: +${diff} chars ahead`);
          } else {
            setGhostStatus(`Ghost pace: ${Math.abs(diff)} chars behind`);
          }
        }

        if (mode === "duel") {
          const targetWpm = Math.max(40, (ghostRuns.duel?.wpm ?? bestByMode.duel ?? 82) * 0.92);
          const rivalChars = ((targetWpm / 60) * 5 * elapsed) * (0.96 + Math.sin(elapsed * 0.8) * 0.08);
          const rivalProgress = clamp((rivalChars / Math.max(1, runtime.correctChars + 120)) * 100, 0, 100);
          setDuelRivalProgress(rivalProgress);
        }

        if (raceRoomId && racePlayerId && timestamp - racePushAtRef.current > 450) {
          racePushAtRef.current = timestamp;
          const runtimeWpm = elapsed > 0 ? (runtime.correctChars / 5 / elapsed) * 60 : 0;
          const judged = runtime.correctChars + runtime.wrongChars;
          const runtimeAcc = judged > 0 ? (runtime.correctChars / judged) * 100 : 100;
          void updateRaceProgress({
            roomId: raceRoomId,
            playerId: racePlayerId,
            progress: computeRaceProgress(),
            wpm: runtimeWpm,
            accuracy: runtimeAcc,
            finished: false,
          }).catch(() => {
            // keep run smooth on network failures
          });
        }

        if (activeDuel && timestamp - racePushAtRef.current > 700) {
          racePushAtRef.current = timestamp;
          void pushDuelProgress(false);
        }

        updateLiveStats();
        runtime.lastHudPaint = timestamp;
      }

      runtime.hudRaf = requestAnimationFrame(frame);
    };

    runtimeRef.current.hudRaf = requestAnimationFrame(frame);
  }

  function startMeteorLoop() {
    const runtime = runtimeRef.current;
    if (runtime.meteorWords.length < 5) {
      for (let i = runtime.meteorWords.length; i < 5; i += 1) {
        spawnMeteorWord();
      }
      setMeteorWordsView([...runtime.meteorWords]);
    }

    const frame = (timestamp: number) => {
      const current = runtimeRef.current;
      if (current.status !== "running" || mode !== "meteor") return;

      if (!current.meteorLastTs) {
        current.meteorLastTs = timestamp;
      }

      const dt = clamp((timestamp - current.meteorLastTs) / 1000, 0, 0.06);
      current.meteorLastTs = timestamp;
      current.meteorSpawnClock += dt;
      const difficulty = meteorDifficulty(current);

      while (current.meteorSpawnClock >= difficulty.spawnIntervalSec) {
        spawnMeteorWord();
        current.meteorSpawnClock -= difficulty.spawnIntervalSec;
      }

      const nextWords: MeteorWord[] = [];
      let wordsChanged = false;

      for (const word of current.meteorWords) {
        const nextY = word.yPercent + word.speed * difficulty.speedScale * dt;
        if (nextY >= 96) {
          current.wrongChars += word.text.length;
          current.errors += 1;
          current.streak = 0;
          current.lives -= 1;
          wordsChanged = true;
        } else {
          nextWords.push({ ...word, yPercent: nextY });
        }
      }

      current.meteorWords = nextWords;
      if (current.meteorLockId && !current.meteorWords.some((word) => word.id === current.meteorLockId)) {
        clearMeteorSelection();
      }

      if (wordsChanged || timestamp - current.meteorLastPaint >= 42) {
        setMeteorWordsView([...current.meteorWords]);
        updateLiveStats();
        current.meteorLastPaint = timestamp;
      }

      if (current.lives <= 0) {
        endSession("Game over");
        return;
      }

      current.meteorRaf = requestAnimationFrame(frame);
    };

    runtimeRef.current.meteorRaf = requestAnimationFrame(frame);
  }

  function startSession() {
    const runtime = runtimeRef.current;
    if (runtime.status !== "idle") return;

    if (raceState && raceRoomId && racePlayerId && raceState.status === "lobby" && raceState.hostPlayerId === racePlayerId) {
      void startRaceRoom(raceRoomId, racePlayerId)
        .then((room) => setRaceState(room))
        .catch(() => {
          // host sync failure should not block local run
        });
    }

    const active = document.activeElement as HTMLElement | null;
    if (active && typeof active.blur === "function") {
      active.blur();
    }
    window.focus();
    arenaRef.current?.focus({ preventScroll: true });

    runtime.status = "running";
    runtime.startMs = performance.now();
    runtime.finishMs = 0;
    runtime.sessionId = null;
    runtime.sessionToken = null;
    runSamplesRef.current = [];
    keyEventsRef.current = [];
    keyIntervalsRef.current = [];
    lastKeyTsRef.current = performance.now();
    racePushAtRef.current = 0;
    setGhostStatus(ghostRuns[mode] ? "Ghost pace: tracking..." : "No ghost for this mode yet");
    setIsRunning(true);
    setPhase("Running");
    announce("Run started");
    setReport(null);
    trackPrivacyEvent("run_start", { page: "play", mode });

    const runNonce = runtime.runNonce;
    initSession(mode)
      .then((session) => {
        const current = runtimeRef.current;
        if (current.runNonce !== runNonce || current.status !== "running") return;
        current.sessionId = session.sessionId;
        current.sessionToken = session.token;
      })
      .catch(() => {
        // API may be offline; local play still continues.
      });

    startHudLoop();
    if (mode === "meteor") {
      startMeteorLoop();
    }
    if (raceRoomId && racePlayerId) {
      void updateRaceProgress({
        roomId: raceRoomId,
        playerId: racePlayerId,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
      }).catch(() => {
        // ignore race sync failures
      });
    }
    void pushDuelProgress(false);
  }

  function endSession(reason: string) {
    const runtime = runtimeRef.current;
    if (runtime.status !== "running") return;

    runtime.status = "finished";
    setIsRunning(false);
    runtime.finishMs = performance.now();
    clearLoops();
    setPhase(reason);

    const summary = scoreSummary(runtime);
    const cpm = (runtime.rawChars / summary.elapsedSec) * 60;
    const kps = runtime.rawChars / summary.elapsedSec;
    const efficiency = runtime.rawChars > 0 ? (runtime.correctChars / runtime.rawChars) * 100 : 100;
    const best = Math.max(bestByMode[mode] ?? 0, summary.wpm);
    saveBestForMode(summary.wpm);
    announce(
      `Run ended: ${reason}. ${summary.wpm.toFixed(1)} WPM and ${summary.accuracy.toFixed(1)} percent accuracy.`,
      reason === "Game over",
    );
    trackPrivacyEvent("run_finish", { page: "play", mode });

    setReport({
      reason,
      wpm: summary.wpm,
      raw: summary.raw,
      cpm,
      kps,
      accuracy: summary.accuracy,
      efficiency,
      elapsedSec: summary.elapsedSec,
      completedWords: runtime.completedWords,
      correctChars: runtime.correctChars,
      wrongChars: runtime.wrongChars,
      maxStreak: runtime.maxStreak,
      best,
    });
    updateLiveStats();

    const ghostPayload: GhostRun = {
      mode,
      wpm: Number(summary.wpm.toFixed(2)),
      accuracy: Number(summary.accuracy.toFixed(2)),
      samples: runSamplesRef.current.slice(-1400),
      updatedAt: Date.now(),
    };
    setGhostRuns((prev) => {
      const current = prev[mode];
      if (!current || ghostPayload.wpm >= current.wpm) {
        return { ...prev, [mode]: ghostPayload };
      }
      return prev;
    });

    const replayRun: ReplayRun = {
      id: crypto.randomUUID(),
      mode,
      createdAt: new Date().toISOString(),
      durationMs: Math.round(summary.elapsedSec * 1000),
      wpm: Number(summary.wpm.toFixed(2)),
      accuracy: Number(summary.accuracy.toFixed(2)),
      events: keyEventsRef.current.slice(-5000),
      samples: runSamplesRef.current.slice(-2000),
    };
    setReplays((prev) => {
      const next = [replayRun, ...prev].slice(0, 20);
      if (!selectedReplayId) {
        setSelectedReplayId(replayRun.id);
      }
      return next;
    });

    const intervals = keyIntervalsRef.current;
    const avgInterval =
      intervals.length > 0 ? intervals.reduce((sum, value) => sum + value, 0) / intervals.length : 120;
    const minInterval = intervals.length > 0 ? Math.min(...intervals) : avgInterval;
    const idleCount = intervals.filter((value) => value >= 800).length;
    const idleRatio = intervals.length > 0 ? idleCount / intervals.length : 0;
    const telemetry = {
      typedChars: runtime.rawChars,
      correctChars: runtime.correctChars,
      wrongChars: runtime.wrongChars,
      avgKeyIntervalMs: Number(avgInterval.toFixed(2)),
      burstKps: Number((1000 / Math.max(8, minInterval)).toFixed(2)),
      idleRatio: Number(idleRatio.toFixed(4)),
      timelineHash: simpleHash64(JSON.stringify(keyEventsRef.current.slice(-2000))),
    };

    if (runtime.sessionId && runtime.sessionToken) {
      const scorePayload = {
        sessionId: runtime.sessionId,
        mode,
        username: accountProfile?.handle?.trim() || username.trim() || "player",
        wpm: Number(summary.wpm.toFixed(2)),
        raw: Number(summary.raw.toFixed(2)),
        accuracy: Number(summary.accuracy.toFixed(2)),
        errors: runtime.errors,
        streak: runtime.maxStreak,
        durationMs: Math.round(summary.elapsedSec * 1000),
        certified: certifiedRun,
      };

      const challengeEligible =
        challengeActive &&
        dailyChallenge &&
        mode === dailyChallenge.mode &&
        Math.abs(scorePayload.durationMs - dailyChallenge.durationSec * 1000) <= 15_000;

      if (challengeEligible) {
        submitChallengeScore(
          {
            ...scorePayload,
            challengeDate: dailyChallenge.date,
          },
          runtime.sessionToken,
        )
          .then((result) => {
            setChallengeNote(`Challenge submitted: +${result.points} pts`);
            announce(`Challenge submitted. ${result.points} points awarded.`);
            void refreshChallengeAndSeason(true);
          })
          .catch((error) => {
            setChallengeNote(`Challenge submit failed: ${(error as Error).message}`);
            announce("Challenge submission failed.", true);
          });
      } else {
        submitScore(
          {
            ...scorePayload,
            clientVersion: "react-creative-v2",
            telemetry,
          },
          runtime.sessionToken,
        )
          .then(() => refreshLeaderboard(true))
          .catch(() => {
            // Keep local gameplay unaffected if leaderboard submit fails.
          });
      }
    }

    if (raceRoomId && racePlayerId) {
      void updateRaceProgress({
        roomId: raceRoomId,
        playerId: racePlayerId,
        progress: 100,
        wpm: summary.wpm,
        accuracy: summary.accuracy,
        finished: true,
      }).catch(() => {
        // ignore race sync failures
      });
    }
    void pushDuelProgress(true);
  }

  function commitCurrentWord() {
    const typed = typedRef.current.trim();
    if (!typed) return;
    if (runtimeRef.current.status === "idle") {
      startSession();
    }

    const words = promptWordsRef.current;
    const index = currentIndexRef.current;
    const isEchoRecall = mode === "echo" && echoPendingRef.current !== null;
    const target = isEchoRecall ? echoPendingRef.current ?? words[index] : words[index];
    if (!target) return;
    const isInfectedWord = infectedIndices.includes(index);

    const runtime = runtimeRef.current;
    const result = compareWords(typed, target);
    runtime.correctChars += result.correct;
    runtime.wrongChars += result.wrong;
    runtime.rawChars += typed.length;
    logReplayEvent("submit", "submit", typed === target);

    const perfect = typed === target;
    if (perfect) {
      runtime.completedWords += 1;
      let keepStreak = true;
      if (mode === "pulse" || mode === "duel" || mode === "chart") {
        const timing = pulseTiming(runtime, pulseBpm);
        const perfectWindow = mode === "chart" ? 0.04 : 0.055;
        const greatWindow = mode === "chart" ? 0.08 : 0.11;
        const okWindow = mode === "chart" ? 0.14 : 0.18;
        if (timing.distanceSec <= perfectWindow) {
          runtime.correctChars += Math.max(2, Math.floor(target.length * 0.9));
          showPulseJudge(
            mode === "duel" ? "PERFECT STRIKE" : mode === "chart" ? "CRIT HIT" : "PERFECT BEAT",
            "perfect",
          );
        } else if (timing.distanceSec <= greatWindow) {
          runtime.correctChars += Math.max(1, Math.floor(target.length * 0.55));
          showPulseJudge(
            mode === "duel" ? "GREAT STRIKE" : mode === "chart" ? "GOOD HIT" : "GREAT BEAT",
            "great",
          );
        } else if (timing.distanceSec <= okWindow) {
          runtime.correctChars += 1;
          showPulseJudge(mode === "duel" ? "HIT" : mode === "chart" ? "LATE" : "ON BEAT", "ok");
        } else {
          runtime.wrongChars += 1;
          runtime.errors += 1;
          keepStreak = false;
          showPulseJudge(mode === "duel" ? "DODGED" : mode === "chart" ? "MISS" : "OFF BEAT", "miss");
        }
      }
      if (mode === "rogue") {
        const buffs = rogueBuffsRef.current;
        runtime.correctChars += Math.floor(target.length * Math.max(0, buffs.scoreMultiplier - 1));
        if (runtime.streak >= 5 && buffs.comboBonus > 0) {
          runtime.correctChars += buffs.comboBonus;
        }
      }
      if (keepStreak) {
        runtime.streak += 1;
        runtime.maxStreak = Math.max(runtime.maxStreak, runtime.streak);
      } else {
        runtime.streak = 0;
      }
      if (mode === "chain") {
        const nextCombo = Math.min(18, chainCombo + 1);
        runtime.correctChars += Math.max(0, nextCombo - 1);
        setChainCombo(nextCombo);
      }
      if (mode === "infection" && isInfectedWord) {
        setInfectedIndices((prev) => prev.filter((value) => value !== index));
      }
      if (mode === "coop") {
        setCoopTurn((prev) => (prev === 1 ? 2 : 1));
      }
    } else {
      let ignoreError = false;
      if (mode === "rogue" && rogueBuffsRef.current.shieldCharges > 0) {
        rogueBuffsRef.current = {
          ...rogueBuffsRef.current,
          shieldCharges: rogueBuffsRef.current.shieldCharges - 1,
        };
        ignoreError = true;
      }
      if (!ignoreError) {
        runtime.errors += 1;
        runtime.streak = 0;
        if (mode === "rogue") {
          runtime.wrongChars += Math.ceil(result.wrong * (rogueBuffsRef.current.wrongPenaltyScale - 1));
        }
        if (mode === "infection" && isInfectedWord) {
          runtime.wrongChars += 2;
          runtime.errors += 1;
        }
      }
      pushWeakness(target, typed);
      if (mode === "pulse" || mode === "duel" || mode === "chart") {
        showPulseJudge("MISS", "miss");
      }
      if (mode === "chain") {
        setChainCombo(1);
      }
      if (mode === "infection") {
        setInfectedIndices((prev) => {
          const next = new Set(prev);
          next.add(index + 1);
          next.add(index + 2);
          return [...next].filter((value) => value < words.length + 500);
        });
      }
    }

    if (!isEchoRecall) {
      setWordResults((prev) => {
        const next = [...prev];
        next[index] = perfect ? "good" : "bad";
        return next;
      });
    }

    if (mode === "relay" && !perfect) {
      const rollbackIndex = Math.max(0, index - 2);
      currentIndexRef.current = rollbackIndex;
      setCurrentIndex(rollbackIndex);
      clearInput();
      updateLiveStats();
      return;
    }

    let nextIndex = index + 1;
    if (mode === "echo") {
      if (isEchoRecall) {
        echoPendingRef.current = null;
        setEchoPending(null);
        nextIndex = index;
      } else {
        echoPendingRef.current = perfect ? target : null;
        setEchoPending(perfect ? target : null);
      }
    }
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);

    if (mode === "rogue" && perfect && runtime.completedWords > 0 && runtime.completedWords % 20 === 0) {
      const offers = rogueOffers();
      setRogueOffer(offers);
      showPulseJudge("PICK A PERK (1-3)", "ok");
    }

    if (mode !== "quote" && nextIndex >= words.length - 50) {
      setPromptWords((prev) => {
        const next = [...prev, ...takeWords(80)];
        promptWordsRef.current = next;
        return next;
      });
    }

    if (mode === "quote" && nextIndex >= words.length) {
      clearInput();
      endSession("Done");
      return;
    }

    clearInput();
    updateLiveStats();
  }

  function clearInput() {
    typedRef.current = "";
    pendingPreviewRef.current = "";
    setTypedPreview("");
  }

  function handleStandardKey(event: globalThis.KeyboardEvent) {
    if (mode === "meteor") return;
    if (isEditableElement(event.target)) return;
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;

    const runtime = runtimeRef.current;

    if (event.key === "Escape") {
      event.preventDefault();
      resetSession(false);
      return;
    }

    if (mode === "rogue" && rogueOffer) {
      if (event.key === "1" || event.key === "2" || event.key === "3") {
        event.preventDefault();
        applyRogueOffer(Number(event.key) - 1);
      }
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      if (runtime.status === "finished") {
        return;
      }
      if (typedRef.current.length > 0) {
        typedRef.current = typedRef.current.slice(0, -1);
        scheduleTypedPreview(typedRef.current);
        logReplayEvent("backspace", "Backspace", true);
      }
      return;
    }

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (runtime.status === "finished") {
        return;
      }
      commitCurrentWord();
      return;
    }

    if (event.key.length !== 1) return;
    if (!/^[a-zA-Z0-9.,!?;:'"-]$/.test(event.key)) return;

    if (runtime.status === "finished") {
      resetSession(false);
    }

    noteKeyInterval();
    const inputChar = settings.lowercase ? event.key.toLowerCase() : event.key;
    const expectedWord =
      mode === "echo" && echoPendingRef.current ? echoPendingRef.current : promptWordsRef.current[currentIndexRef.current];
    const expectedChar = expectedWord?.[typedRef.current.length];
    const charCorrect =
      expectedChar != null ? expectedChar.toLowerCase() === inputChar.toLowerCase() : false;
    bumpKeyStat(inputChar, charCorrect);
    logReplayEvent("key", inputChar, charCorrect);
    typedRef.current += inputChar;
    scheduleTypedPreview(typedRef.current);

    if (runtime.status === "idle" && typedRef.current.length > 0) {
      startSession();
    }
  }

  function handleMeteorKey(event: globalThis.KeyboardEvent) {
    if (mode !== "meteor") return;
    if (isEditableElement(event.target)) return;
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;

    const runtime = runtimeRef.current;
    if (runtime.status === "finished") {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      resetSession(false);
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
      logReplayEvent("submit", "Space", true);
      if (runtime.meteorLockId && runtime.meteorBuffer.length > 0) {
        const index = runtime.meteorWords.findIndex((word) => word.id === runtime.meteorLockId);
        if (index >= 0) {
          const target = runtime.meteorWords[index];
          const chip = Math.min(runtime.meteorBuffer.length, target.text.length);
          const remaining = target.text.slice(chip);
          runtime.correctChars += chip;

          if (remaining.length > 0) {
            runtime.meteorWords[index] = { ...target, text: remaining };
          } else {
            runtime.completedWords += 1;
            runtime.streak += 1;
            runtime.maxStreak = Math.max(runtime.maxStreak, runtime.streak);
            runtime.meteorWords = runtime.meteorWords.filter((word) => word.id !== target.id);
            triggerExplosion(target);
            if (runtime.meteorWords.length < 5) {
              spawnMeteorWord();
            }
          }
          setMeteorWordsView([...runtime.meteorWords]);
          updateLiveStats();
        }
      }
      clearMeteorSelection();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      if (runtime.meteorBuffer.length > 0) {
        runtime.meteorBuffer = runtime.meteorBuffer.slice(0, -1);
        if (runtime.meteorBuffer.length === 0) {
          runtime.meteorLockId = null;
        }
        syncMeteorSelection();
        logReplayEvent("backspace", "Backspace", true);
      }
      return;
    }

    if (event.key.length !== 1) return;
    if (!/^[a-zA-Z0-9.,!?;:]$/.test(event.key)) return;

    const inputChar = settings.lowercase ? event.key.toLowerCase() : event.key;
    let lockWord = runtime.meteorLockId
      ? runtime.meteorWords.find((word) => word.id === runtime.meteorLockId)
      : undefined;

    if (!lockWord) {
      const first = inputChar.toLowerCase();
      let candidate: MeteorWord | undefined;
      for (const word of runtime.meteorWords) {
        if ((word.text[0] ?? "").toLowerCase() !== first) {
          continue;
        }
        if (!candidate || word.yPercent > candidate.yPercent) {
          candidate = word;
        }
      }
      if (!candidate) return;
      runtime.meteorLockId = candidate.id;
      runtime.meteorBuffer = "";
      playLockSfx();
      lockWord = candidate;
    }

    if (runtime.status === "idle") {
      startSession();
    }

    event.preventDefault();
    noteKeyInterval();
    runtime.rawChars += 1;

    const expected = lockWord.text[runtime.meteorBuffer.length];
    if (expected && expected.toLowerCase() === inputChar.toLowerCase()) {
      bumpKeyStat(inputChar, true);
      logReplayEvent("key", inputChar, true);
      triggerLaser(lockWord);
      runtime.meteorBuffer += inputChar;
      if (runtime.meteorBuffer.length >= lockWord.text.length) {
        runtime.correctChars += lockWord.text.length;
        runtime.completedWords += 1;
        runtime.streak += 1;
        runtime.maxStreak = Math.max(runtime.maxStreak, runtime.streak);
        runtime.meteorWords = runtime.meteorWords.filter((word) => word.id !== lockWord.id);
        triggerExplosion(lockWord);
        runtime.meteorLockId = null;
        runtime.meteorBuffer = "";
        if (runtime.meteorWords.length < 5) {
          spawnMeteorWord();
        }
        setMeteorWordsView([...runtime.meteorWords]);
      }
    } else {
      bumpKeyStat(inputChar, false);
      logReplayEvent("miss", inputChar, false);
      runtime.wrongChars += 1;
      runtime.errors += 1;
      runtime.streak = 0;
    }

    syncMeteorSelection();
    updateLiveStats();
  }

  useEffect(() => {
    const listener = (event: globalThis.KeyboardEvent) => {
      if (appRoute !== "play") {
        return;
      }
      if (mode === "meteor") {
        handleMeteorKey(event);
      } else {
        handleStandardKey(event);
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [appRoute, mode, settings.lowercase, pulseBpm, focusPrefs.sfxEnabled, rogueOffer, soundPack]);

  function saveCustomDictionary() {
    const words = splitCustomWords(customInput);
    setCustomWords(words);
    localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(words));
    resetSession(true);
  }

  useEffect(() => {
    if (!replayPlaying) {
      return;
    }
    const replay = replays.find((item) => item.id === selectedReplayId);
    if (!replay) {
      return;
    }
    const id = window.setInterval(() => {
      setReplayCursorMs((prev) => {
        const next = prev + 120;
        if (next >= replay.durationMs) {
          setReplayPlaying(false);
          return replay.durationMs;
        }
        return next;
      });
    }, 120);
    return () => {
      window.clearInterval(id);
    };
  }, [replayPlaying, replays, selectedReplayId]);

  useEffect(() => {
    setReplayCursorMs(0);
    setReplayPlaying(false);
  }, [selectedReplayId]);

  const lockedMeteorWord =
    meteorSelection.id != null ? meteorWordsView.find((word) => word.id === meteorSelection.id) : null;
  const shipAimDeg = lockedMeteorWord
    ? clamp(
        (Math.atan2(lockedMeteorWord.yPercent - 92, lockedMeteorWord.xPercent - 50) * 180) / Math.PI,
        -28,
        28,
      )
    : 0;
  const selectedReplay = useMemo(
    () => replays.find((item) => item.id === selectedReplayId) ?? null,
    [replays, selectedReplayId],
  );
  const replayVisibleEvents = useMemo(
    () =>
      selectedReplay
        ? selectedReplay.events.filter((event) => event.t <= replayCursorMs).slice(-28)
        : ([] as ReplayEvent[]),
    [selectedReplay, replayCursorMs],
  );

  function normalizeReplayCandidate(raw: unknown): ReplayRun | null {
    const record = asRecord(raw);
    if (!record) return null;

    const modeValue = record.mode;
    const allowedModes = new Set<Mode>([
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
    ]);
    if (typeof modeValue !== "string" || !allowedModes.has(modeValue as Mode)) {
      return null;
    }

    const eventsRaw = Array.isArray(record.events) ? record.events : [];
    const events: ReplayEvent[] = eventsRaw
      .map((item) => {
        const eventRecord = asRecord(item);
        if (!eventRecord) return null;
        const t = Number(eventRecord.t);
        const key = `${eventRecord.key ?? ""}`.slice(0, 32);
        const kind = eventRecord.kind;
        const correct = Boolean(eventRecord.correct);
        if (
          !Number.isFinite(t) ||
          typeof kind !== "string" ||
          !["key", "submit", "backspace", "miss", "mode"].includes(kind)
        ) {
          return null;
        }
        return { t: Math.max(0, t), key, kind: kind as ReplayEvent["kind"], correct };
      })
      .filter((value): value is ReplayEvent => value !== null)
      .slice(0, 6000);

    const samplesRaw = Array.isArray(record.samples) ? record.samples : [];
    const samples = samplesRaw
      .map((item) => {
        const sampleRecord = asRecord(item);
        if (!sampleRecord) return null;
        const t = Number(sampleRecord.t);
        const words = Number(sampleRecord.words);
        const chars = Number(sampleRecord.chars);
        if (!Number.isFinite(t) || !Number.isFinite(words) || !Number.isFinite(chars)) {
          return null;
        }
        return {
          t: Math.max(0, t),
          words: Math.max(0, Math.round(words)),
          chars: Math.max(0, Math.round(chars)),
        };
      })
      .filter((value): value is { t: number; words: number; chars: number } => value !== null)
      .slice(0, 4000);

    const createdAt =
      typeof record.createdAt === "string" && Number.isFinite(Date.parse(record.createdAt))
        ? record.createdAt
        : new Date().toISOString();

    return {
      id: typeof record.id === "string" && record.id.length > 0 ? record.id : crypto.randomUUID(),
      mode: modeValue as Mode,
      createdAt,
      durationMs: Math.max(0, Math.round(Number(record.durationMs) || 0)),
      wpm: Number(Number(record.wpm) || 0),
      accuracy: Number(Number(record.accuracy) || 0),
      events,
      samples,
    };
  }

  function exportSelectedReplayFile(): void {
    if (!selectedReplay) {
      return;
    }
    const filenameDate = selectedReplay.createdAt.replace(/[:.]/g, "-");
    const blob = new Blob([JSON.stringify(selectedReplay, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `typeshift-replay-${selectedReplay.mode}-${filenameDate}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setReplayNote("Replay exported.");
  }

  async function importReplayFile(file?: File): Promise<void> {
    if (!file) {
      return;
    }
    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText) as unknown;
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      const normalized = candidates
        .map((candidate) => normalizeReplayCandidate(candidate))
        .filter((value): value is ReplayRun => value !== null);
      if (normalized.length === 0) {
        setReplayNote("Replay import failed: file had no valid replay data.");
        return;
      }
      setReplays((prev) => {
        const dedup = new Map<string, ReplayRun>();
        for (const replay of [...normalized, ...prev]) {
          dedup.set(replay.id, replay);
        }
        return [...dedup.values()].slice(0, 20);
      });
      setSelectedReplayId(normalized[0]?.id ?? "");
      setReplayNote(`Imported ${normalized.length} replay file${normalized.length > 1 ? "s" : ""}.`);
    } catch (_error) {
      setReplayNote("Replay import failed: invalid JSON file.");
    }
  }

  const fingerStats = useMemo(() => {
    const summary: Record<string, { hits: number; errors: number }> = {};
    for (const [key, bucket] of Object.entries(keyStats)) {
      const finger = KEY_TO_FINGER[key] ?? "Unknown";
      const current = summary[finger] ?? { hits: 0, errors: 0 };
      summary[finger] = {
        hits: current.hits + bucket.hits,
        errors: current.errors + bucket.errors,
      };
    }
    return Object.entries(summary)
      .map(([finger, bucket]) => ({
        finger,
        hits: bucket.hits,
        errors: bucket.errors,
        accuracy: bucket.hits > 0 ? ((bucket.hits - bucket.errors) / bucket.hits) * 100 : 100,
      }))
      .sort((a, b) => a.finger.localeCompare(b.finger));
  }, [keyStats]);

  const statCards = useMemo(
    () => [
      {
        key: "wpm",
        label: "WPM",
        value: stats.wpm.toFixed(1),
        help: "Words per minute based on correct characters. Five characters count as one word.",
      },
      {
        key: "raw",
        label: "RAW",
        value: stats.raw.toFixed(1),
        help: "Raw speed using all typed characters, including mistakes.",
      },
      {
        key: "cpm",
        label: "CPM",
        value: stats.cpm.toFixed(0),
        help: "Characters per minute, including both correct and wrong keys.",
      },
      {
        key: "kps",
        label: "KPS",
        value: stats.kps.toFixed(2),
        help: "Keystrokes per second.",
      },
      {
        key: "acc",
        label: "ACC",
        value: `${stats.accuracy.toFixed(1)}%`,
        help: "Correct characters divided by total judged characters.",
      },
      {
        key: "eff",
        label: "EFF",
        value: `${stats.efficiency.toFixed(1)}%`,
        help: "Correct characters divided by all typed characters.",
      },
      {
        key: "words",
        label: "WORDS",
        value: String(stats.completedWords),
        help: "Total words completed in this run.",
      },
      {
        key: "correct",
        label: "CORRECT",
        value: String(stats.correctChars),
        help: "Number of correct characters entered.",
      },
      {
        key: "wrong",
        label: "WRONG",
        value: String(stats.wrongChars),
        help: "Number of wrong characters entered.",
      },
      {
        key: "errors",
        label: "ERRORS",
        value: String(stats.errors),
        help: "Mistakes counted at word-level and mode-level events.",
      },
      {
        key: "streak",
        label: "STREAK",
        value: String(stats.streak),
        help: "Current chain of completed words without a reset.",
      },
      {
        key: "bestStreak",
        label: "BEST STREAK",
        value: String(stats.maxStreak),
        help: "Highest streak reached in this run.",
      },
      {
        key: "time",
        label: "TIME",
        value: formatSeconds(stats.elapsedSec),
        help: "Elapsed run time.",
      },
      {
        key: "lives",
        label: "LIVES",
        value: mode === "meteor" ? String(stats.lives) : "-",
        help: "Remaining lives in Meteor mode.",
      },
    ],
    [mode, stats],
  );

  const focusStatCards = useMemo(
    () => statCards.filter((card) => focusPrefs.statVisibility[card.key]),
    [focusPrefs.statVisibility, statCards],
  );
  const previewMode = modePreview ?? mode;
  const runIndicatorCards = [
    { key: "mode", label: "Mode", value: MODE_META[mode].label },
    { key: "pack", label: "Pack", value: dictionaryPack.toUpperCase() },
    { key: "acc", label: "Acc", value: `${stats.accuracy.toFixed(1)}%` },
    { key: "streak", label: "Streak", value: String(stats.streak) },
    {
      key: "tempo",
      label: mode === "cipher" ? "Shift" : mode === "pulse" || mode === "duel" || mode === "chart" ? "BPM" : "State",
      value:
        mode === "cipher"
          ? `${cipherDirection === "forward" ? "+" : "-"}${cipherShift}`
          : mode === "pulse" || mode === "duel" || mode === "chart"
            ? String(pulseBpm)
            : phase,
    },
  ];
  const playModeCards = (Object.keys(MODE_META) as Mode[]).map((modeId) => ({
    id: modeId,
    label: MODE_META[modeId].label,
    flavor: MODE_META[modeId].flavor,
    detail: MODE_DETAILS[modeId],
    best: (bestByMode[modeId] ?? 0).toFixed(1),
  }));

  const showDistrictStack = appRoute === "play" || appRoute === "settings";
  const showArena = appRoute === "play";
  const atlasLayoutClass = showArena
    ? "atlas-layout atlas-layout--play"
    : showDistrictStack
      ? "atlas-layout atlas-layout--duo"
      : "atlas-layout atlas-layout--single";
  const focusModeActive = isRunning && focusPrefs.enabled;
  const cipherSignedShift = cipherDirection === "forward" ? cipherShift : -cipherShift;
  const gravityFlip = mode === "gravity" && Math.floor(stats.elapsedSec / 6) % 2 === 1;
  const pulseState =
    mode === "pulse" || mode === "duel" || mode === "chart"
      ? pulseTiming(runtimeRef.current, pulseBpm)
      : { phase: 0, quality: "miss" as PulseJudgeTone };

  return (
    <div className={`scene-root ${focusModeActive ? "game-focus" : ""}`}>
      <a className="skip-link" href={showArena ? "#typing-arena" : "#main-content"}>
        {showArena ? "Skip to typing arena" : "Skip to main content"}
      </a>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {liveAlertMessage}
      </div>

      <header className="site-header">
        <Link href={pathForRoute("home")} className="brand-mark">
          <span className="brand-icon" aria-hidden="true">
            TS
          </span>
          <span className="brand-copy">
            <span className="brand-text">TypeShift</span>
            <span className="brand-sub sr-only">arcade typing drills</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Main sections">
          {ROUTE_GROUPS.map((group) => (
            <div key={group.label} className="site-nav-group">
              {group.routes.map((route) => (
                <Link
                  key={route}
                  href={pathForRoute(route)}
                  className={`site-nav-link ${appRoute === route ? "active" : ""}`}
                  aria-current={appRoute === route ? "page" : undefined}
                >
                  <span className="site-nav-label">{ROUTE_LABELS[route]}</span>
                  <span className="site-nav-hint sr-only">{ROUTE_COPY[route].title}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="site-tools">
          <button
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            aria-pressed={theme === "dark"}
            aria-label="Toggle theme"
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          </button>
        </div>
      </header>

      <main className={atlasLayoutClass} id="main-content">
        {showDistrictStack && (
          <aside className="district-stack">
            {appRoute === "play" &&
              (Object.keys(MODE_META) as Mode[]).map((item) => (
                <button
                  key={item}
                  className={`district-card ${item === mode ? "active" : ""}`}
                  onClick={() => {
                    setMode(item);
                    setModePreview(item);
                  }}
                  onMouseEnter={() => setModePreview(item)}
                  onFocus={() => setModePreview(item)}
                  aria-pressed={item === mode}
                  aria-current={item === mode ? "page" : undefined}
                >
                  <strong>{MODE_META[item].label}</strong>
                  <span>{MODE_META[item].flavor}</span>
                </button>
              ))}
            {appRoute === "settings" && (
              <p className="dictionary-note">
                Settings hub: tune run setup, accessibility, sound, and focus HUD from this page.
              </p>
            )}

            <section className="settings-card">
              <h3>Run setup</h3>
              <label>
                Duration
                <select value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))}>
                  <option value={30}>30s</option>
                  <option value={60}>60s</option>
                  <option value={90}>90s</option>
                  <option value={120}>120s</option>
                </select>
              </label>
              <label>
                Word set
                <select
                  value={dictionaryPack}
                  onChange={(e) => setDictionaryPack(e.target.value as DictionaryPack)}
                >
                  <option value="core">Core</option>
                  <option value="tech">Tech</option>
                  <option value="myth">Mythic</option>
                  <option value="blitz">Blitz</option>
                  <option value="top1k">Top 1K</option>
                  <option value="top5k">Top 5K</option>
                  <option value="top10k">Top 10K</option>
                  <option value="verbs">Verbs</option>
                  <option value="nouns">Nouns</option>
                  <option value="code">Code</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                  <option value="german">German</option>
                </select>
              </label>
              <div className="toggle-grid">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.punctuation}
                    onChange={(e) => setSettings((s) => ({ ...s, punctuation: e.target.checked }))}
                  />
                  Punctuation
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.numbers}
                    onChange={(e) => setSettings((s) => ({ ...s, numbers: e.target.checked }))}
                  />
                  Numbers
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.lowercase}
                    onChange={(e) => setSettings((s) => ({ ...s, lowercase: e.target.checked }))}
                  />
                  Lowercase lock
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.customOnly}
                    onChange={(e) => setSettings((s) => ({ ...s, customOnly: e.target.checked }))}
                  />
                  Custom only
                </label>
              </div>
              <p className="dictionary-note">{dictionaryStatus}</p>
              {mode === "cipher" && (
                <div className="mode-options">
                  <h4>Cipher Settings</h4>
                  <label>
                    Shift direction
                    <select
                      value={cipherDirection}
                      onChange={(event) => setCipherDirection(event.target.value as CipherDirection)}
                    >
                      <option value="forward">Forward</option>
                      <option value="backward">Backward</option>
                    </select>
                  </label>
                  <label>
                    Letter shift
                    <input
                      type="range"
                      min={1}
                      max={25}
                      value={cipherShift}
                      onChange={(event) => setCipherShift(clamp(Number(event.target.value), 1, 25))}
                    />
                  </label>
                  <p className="dictionary-note">
                    Global shift: {cipherDirection === "forward" ? "+" : "-"}
                    {cipherShift}
                  </p>
                </div>
              )}
              {(mode === "pulse" || mode === "duel" || mode === "chart") && (
                <div className="mode-options">
                  <h4>Rhythm Settings</h4>
                  <label>
                    BPM
                    <input
                      type="range"
                      min={70}
                      max={180}
                      step={1}
                      value={pulseBpm}
                      onChange={(event) => setPulseBpm(clamp(Number(event.target.value), 70, 180))}
                    />
                  </label>
                  <p className="dictionary-note">Beat speed: {pulseBpm} BPM</p>
                </div>
              )}
              <div className="mode-options">
                <h4>Training + Access</h4>
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={adaptiveTrainer}
                    onChange={(event) => setAdaptiveTrainer(event.target.checked)}
                  />
                  Adaptive weak-pattern trainer
                </label>
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={certifiedRun}
                    onChange={(event) => setCertifiedRun(event.target.checked)}
                  />
                  Certified run mode
                </label>
                <label>
                  Sound pack
                  <select value={soundPack} onChange={(event) => setSoundPack(event.target.value as SoundPack)}>
                    <option value="arcade">Arcade</option>
                    <option value="retro">Retro</option>
                    <option value="cinematic">Cinematic</option>
                    <option value="soft">Soft</option>
                    <option value="mute">Mute</option>
                  </select>
                </label>
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={focusPrefs.sfxEnabled}
                    onChange={(event) =>
                      setFocusPrefs((prev) => ({
                        ...prev,
                        sfxEnabled: event.target.checked,
                      }))
                    }
                  />
                  Sound effects
                </label>
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={focusPrefs.musicEnabled}
                    onChange={(event) =>
                      setFocusPrefs((prev) => ({
                        ...prev,
                        musicEnabled: event.target.checked,
                      }))
                    }
                  />
                  Background music
                </label>
                <label>
                  SFX level
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={focusPrefs.sfxVolume}
                    onChange={(event) =>
                      setFocusPrefs((prev) => ({
                        ...prev,
                        sfxVolume: clamp(Number(event.target.value), 0, 1),
                      }))
                    }
                  />
                </label>
                <label>
                  Music level
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={focusPrefs.musicVolume}
                    onChange={(event) =>
                      setFocusPrefs((prev) => ({
                        ...prev,
                        musicVolume: clamp(Number(event.target.value), 0, 1),
                      }))
                    }
                  />
                </label>
                <label>
                  Accessibility preset
                  <select
                    value={accessibilityPreset}
                    onChange={(event) => setAccessibilityPreset(event.target.value as AccessibilityPreset)}
                  >
                    <option value="standard">Standard</option>
                    <option value="reduced">Reduced motion</option>
                    <option value="contrast">High contrast</option>
                    <option value="colorblind">Colorblind friendly</option>
                    <option value="dyslexia">Dyslexia support</option>
                  </select>
                </label>
                {weakPatterns.length > 0 && (
                  <p className="dictionary-note">Weak patterns: {weakPatterns.slice(0, 6).join(", ")}</p>
                )}
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={accessibilityPrefs.announceEvents}
                    onChange={(event) =>
                      setAccessibilityPrefs((prev) => ({ ...prev, announceEvents: event.target.checked }))
                    }
                  />
                  Announce key events
                </label>
                <label>
                  Text scale
                  <input
                    type="range"
                    min={0.85}
                    max={1.25}
                    step={0.05}
                    value={accessibilityPrefs.textScale}
                    onChange={(event) =>
                      setAccessibilityPrefs((prev) => ({
                        ...prev,
                        textScale: clamp(Number(event.target.value), 0.85, 1.25),
                      }))
                    }
                  />
                </label>
                <p className="dictionary-note">Text scale: {(accessibilityPrefs.textScale * 100).toFixed(0)}%</p>
                <p className="dictionary-note">
                  Audio: {focusPrefs.sfxEnabled ? `${Math.round(focusPrefs.sfxVolume * 100)}% SFX` : "SFX off"} ·{" "}
                  {focusPrefs.musicEnabled ? `${Math.round(focusPrefs.musicVolume * 100)}% music` : "music off"}
                </p>
                {mode === "rogue" && <p className="dictionary-note">Active buff: {rogueBuffLabel}</p>}
              </div>
              <div className="focus-options">
                <h4>Focus Run View</h4>
                <label>
                  <input
                    type="checkbox"
                    checked={focusPrefs.enabled}
                    onChange={(event) =>
                      setFocusPrefs((prev) => ({
                        ...prev,
                        enabled: event.target.checked,
                      }))
                    }
                  />
                  Full-screen focus while running
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={focusPrefs.showStats}
                    onChange={(event) =>
                      setFocusPrefs((prev) => ({
                        ...prev,
                        showStats: event.target.checked,
                      }))
                    }
                  />
                  Keep selected stats in focus view
                </label>
                <div className="focus-stat-picker">
                  {statCards.map((card) => (
                    <label key={`focus-${card.key}`}>
                      <input
                        type="checkbox"
                        checked={focusPrefs.statVisibility[card.key] ?? false}
                        onChange={(event) =>
                          setFocusPrefs((prev) => ({
                            ...prev,
                            statVisibility: {
                              ...prev.statVisibility,
                              [card.key]: event.target.checked,
                            },
                          }))
                        }
                      />
                      {card.label}
                    </label>
                  ))}
                </div>
              </div>
            </section>
          </aside>
        )}

        {showArena && (
          <section
            className="arena-frame"
            id="typing-arena"
            ref={arenaRef}
            tabIndex={-1}
            aria-label="Typing arena"
          >
          <div className="arena-glow" />
          <div className="arena-headline">
            <div>
              <p>Run state</p>
              <h2 aria-live="polite">{phase}</h2>
              {challengeActive && dailyChallenge && (
                <p className="dictionary-note">Daily challenge active: {dailyChallenge.date}</p>
              )}
            </div>
            <div className="timer-chip">{timerText}</div>
          </div>
          <div className="run-indicator-strip" aria-label="Run indicators">
            {runIndicatorCards.map((card) => (
              <article key={`indicator-${card.key}`} className="run-indicator-card">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </div>
          {(mode === "pulse" || mode === "duel" || mode === "chart") && (
            <section className={`rhythm-stage ${pulseJudge ? `judge-${pulseJudge.tone}` : ""}`}>
              <div className={`pulse-banner ${pulseState.quality !== "miss" ? "active" : ""}`}>
                {mode === "duel"
                  ? `Rhythm duel live: keep beat and outrun rival pace (${pulseBpm} BPM).`
                  : mode === "chart"
                    ? `Rhythm chart live: strict beatmap windows (${pulseBpm} BPM).`
                    : `Rhythm mode: submit each word on beat for extra score (${pulseBpm} BPM).`}
              </div>
              <div className="pulse-lane" aria-hidden="true">
                <div className="pulse-grid-ticks">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <span key={`pulse-tick-${index}`} />
                  ))}
                </div>
                <div className="pulse-target" />
                <div className="pulse-sweep" style={{ left: `${pulseState.phase * 100}%` }} />
              </div>
              {pulseJudge && (
                <div className={`pulse-judge ${pulseJudge.tone}`}>
                  <span>{pulseJudge.label}</span>
                </div>
              )}
            </section>
          )}
          {mode === "duel" && (
            <div className="duel-bars">
              <div>
                <span>You</span>
                <strong>{Math.round(clamp((stats.correctChars / Math.max(1, stats.correctChars + 120)) * 100, 0, 100))}%</strong>
              </div>
              <div>
                <span>Rival</span>
                <strong>{Math.round(duelRivalProgress)}%</strong>
              </div>
            </div>
          )}

          {mode !== "meteor" ? (
            <div
              className={`prompt-shell ${
                mode === "reverse" || gravityFlip ? "reverse-flow" : ""
              } ${mode === "pulse" || mode === "duel" || mode === "chart" ? "rhythm-prompt" : ""}`}
            >
              {visibleWords.map(({ word, index }) => {
                const displayWord = index === currentIndex && mode === "echo" && echoPending ? echoPending : word;
                const encodedWord =
                  mode === "cipher" ? encodeCipherWord(displayWord, cipherSignedShift) : displayWord;
                const shownWord =
                  mode === "stealth" && index >= currentIndex
                    ? maskInnerLetters(encodedWord)
                    : encodedWord;
                const driftX =
                  mode === "drift" ? Math.sin(stats.elapsedSec * 2.4 + index * 0.62) * 12 : 0;
                const infected = mode === "infection" && infectedIndices.includes(index);
                if (index < currentIndex) {
                  return (
                    <span
                      key={`${index}-${word}`}
                      className={`prompt-word ${wordResults[index] === "good" ? "good" : "bad"} ${
                        infected ? "infected" : ""
                      }`}
                      style={mode === "drift" ? { transform: `translateX(${driftX}px)` } : undefined}
                    >
                      {shownWord}
                    </span>
                  );
                }
                if (index === currentIndex) {
                  return (
                    <span
                      key={`${index}-${word}`}
                      className={`prompt-word current ${infected ? "infected" : ""}`}
                      style={mode === "drift" ? { transform: `translateX(${driftX}px)` } : undefined}
                    >
                      {displayWord.split("").map((char, charIndex) => {
                        const typedChar = typedPreview[charIndex];
                        const encodedChar = mode === "cipher" ? encodeCipherWord(char, cipherSignedShift) : char;
                        const shownChar =
                          mode === "blackout"
                            ? "•"
                            : mode === "stealth" && charIndex > 0 && charIndex < displayWord.length - 1
                              ? "•"
                              : encodedChar;
                        if (typedChar === undefined) {
                          return (
                            <span key={charIndex} className="pending">
                              {shownChar}
                            </span>
                          );
                        }
                        if (typedChar === char) {
                          return (
                            <span key={charIndex} className="correct">
                              {shownChar}
                            </span>
                          );
                        }
                        return (
                          <span key={charIndex} className="wrong">
                            {shownChar}
                          </span>
                        );
                      })}
                      {typedPreview.length > displayWord.length && (
                        <span className="extra">{typedPreview.slice(displayWord.length)}</span>
                      )}
                    </span>
                  );
                }
                return (
                  <span
                    key={`${index}-${word}`}
                    className={`prompt-word future ${infected ? "infected" : ""}`}
                    style={mode === "drift" ? { transform: `translateX(${driftX}px)` } : undefined}
                  >
                    {shownWord}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="meteor-shell" aria-label="Meteor lane">
              <div className="meteor-skyfield" aria-hidden="true" />
              <div
                className="ship-cockpit"
                aria-hidden="true"
                style={{ transform: `translateX(-50%) rotate(${shipAimDeg}deg)` }}
              >
                <div className="ship-shadow" />
                <div className="ship-fin left" />
                <div className="ship-fin right" />
                <div className="ship-wing left" />
                <div className="ship-tail left" />
                <div className="ship-core">
                  <div className="ship-shell" />
                  <div className="ship-canopy" />
                  <div className="ship-cannon" />
                  <div className="ship-nose" />
                </div>
                <div className="ship-tail right" />
                <div className="ship-wing right" />
                <div className="ship-engine center" />
                <div className="ship-engine left" />
                <div className="ship-engine right" />
              </div>
              {lockedMeteorWord && (
                <div
                  className="tracking-laser"
                  aria-hidden="true"
                  style={{
                    left: "50%",
                    top: "92%",
                    width: `${Math.hypot(lockedMeteorWord.xPercent - 50, lockedMeteorWord.yPercent - 92)}%`,
                    transform: `rotate(${(Math.atan2(lockedMeteorWord.yPercent - 92, lockedMeteorWord.xPercent - 50) * 180) / Math.PI}deg)`,
                  }}
                />
              )}
              {laserFx.map((fx) => {
                const shipX = 50;
                const shipY = 92;
                const trackedTarget =
                  fx.lockId != null ? meteorWordsView.find((word) => word.id === fx.lockId) : undefined;
                const targetX = trackedTarget?.xPercent ?? fx.xPercent;
                const targetY = trackedTarget?.yPercent ?? fx.yPercent;
                const dx = targetX - shipX;
                const dy = targetY - shipY;
                const length = Math.hypot(dx, dy);
                const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
                return (
                  <div
                    key={fx.id}
                    className="laser-shot"
                    aria-hidden="true"
                    style={{
                      left: `${shipX}%`,
                      top: `${shipY}%`,
                      width: `${length}%`,
                      transform: `rotate(${angleDeg}deg)`,
                    }}
                  >
                    <span className="laser-shot-core" />
                    <span className="laser-shot-tip" />
                  </div>
                );
              })}
              {explosionFx.map((fx) => (
                <div
                  key={fx.id}
                  className="meteor-explosion"
                  aria-hidden="true"
                  style={{
                    left: `${fx.xPercent}%`,
                    top: `${fx.yPercent}%`,
                  }}
                >
                  <span className="meteor-explosion-core" />
                  <span className="meteor-explosion-ring" />
                  <span className="meteor-explosion-sparks" />
                </div>
              ))}
              {meteorWordsView.map((word) => {
                const isLocked = word.id === meteorSelection.id;
                const typed = meteorSelection.typed;
                const progress = isLocked && word.text.length > 0 ? typed.length / word.text.length : 0;
                return (
                  <div
                    key={word.id}
                    className={`meteor-word ${isLocked ? "locked" : ""}`}
                    style={{
                      left: `${word.xPercent}%`,
                      top: `${word.yPercent}%`,
                      transform: "translate(-50%, 0)",
                    }}
                  >
                    <span className="meteor-word-text">{isLocked ? word.text.slice(typed.length) || "..." : word.text}</span>
                    {isLocked && (
                      <>
                        <span className="meteor-word-progress" style={{ transform: `scaleX(${progress})` }} />
                        <span className="meteor-word-tail">{typed.length}/{word.text.length}</span>
                      </>
                    )}
                  </div>
                );
              })}
              <div className="meteor-floor">ground line</div>
            </div>
          )}

          {mode !== "meteor" ? (
            <div className="control-row">
              <p className="control-hint">
                {typedPreview
                  ? `Current input: ${typedPreview}`
                  : "Type anywhere to start. Space submits the word."}
              </p>
              <button className="launch-btn" onClick={startSession}>
                Start run
              </button>
              <button className="ghost-btn" onClick={() => resetSession(false)} aria-keyshortcuts="Escape">
                Reset
              </button>
              <button className="ghost-btn" onClick={() => resetSession(true)}>
                Shuffle words
              </button>
            </div>
          ) : (
            <div className="meteor-controls">
              <div className="meteor-chip">
                <span>Target</span>
                <strong>{lockedMeteorWord?.text ?? "none"}</strong>
              </div>
              <div className="meteor-chip">
                <span>Typed</span>
                <strong>{meteorSelection.typed || "..."}</strong>
              </div>
              <button className="launch-btn" onClick={startSession}>
                Start run
              </button>
              <button className="ghost-btn" onClick={() => resetSession(false)} aria-keyshortcuts="Escape">
                Reset
              </button>
              <button className="ghost-btn" onClick={() => resetSession(true)}>
                Shuffle words
              </button>
            </div>
          )}
          {mode === "meteor" && (
            <p className="meteor-tip">
              Type a first letter to lock the nearest word. Press space to bank current progress and release target.
              Meteors spawn high and speed up over time.
            </p>
          )}
          {mode === "meteor" && (
            <p className="sr-only">
              Current meteor target: {lockedMeteorWord?.text ?? "none"}. Typed progress:{" "}
              {meteorSelection.typed || "none"}.
            </p>
          )}

          <div className="legend-line">
            <span className="dot good" />
            match
            <span className="dot bad" />
            miss
            {mode === "meteor" ? (
              <>
                <span className="dot now" />
                locked target
              </>
            ) : (
              <>
                <span className="dot now" />
                current word
              </>
            )}
          </div>
          {mode !== "meteor" && (
            <p className="meteor-tip">Type anywhere. Space submits a word. Backspace edits.</p>
          )}
          {mode === "relay" && (
            <p className="meteor-tip">Relay rule: mistakes push you two words backward.</p>
          )}
          {mode === "cipher" && (
            <p className="meteor-tip">
              Cipher rule: all letters are shifted {cipherDirection} by {cipherShift}. Type the decoded word.
            </p>
          )}
          {mode === "pulse" && (
            <p className="meteor-tip">Rhythm rule: submit each word on beat. Better timing gives bigger bonus.</p>
          )}
          {mode === "duel" && (
            <p className="meteor-tip">Duel rule: keep rhythm while racing the rival progress bar.</p>
          )}
          {mode === "chart" && (
            <p className="meteor-tip">Chart rule: stricter beat windows than Pulse. Precision matters.</p>
          )}
          {mode === "echo" && (
            <p className="meteor-tip">Echo rule: after each clear, repeat the previous word from memory.</p>
          )}
          {mode === "rogue" && (
            <p className="meteor-tip">Rogue rule: every 20 words opens a perk draft. Use keys 1-3 to pick.</p>
          )}
          {mode === "drift" && (
            <p className="meteor-tip">Drift rule: words slide horizontally while you type.</p>
          )}
          {mode === "reverse" && (
            <p className="meteor-tip">Reverse rule: reading order flips right-to-left.</p>
          )}
          {mode === "blackout" && (
            <p className="meteor-tip">Blackout rule: letters are masked while typing.</p>
          )}
          {mode === "chain" && <p className="meteor-tip">Chain combo: x{chainCombo}</p>}
          {mode === "gravity" && (
            <p className="meteor-tip">Gravity rule: direction flips every few seconds.</p>
          )}
          {mode === "coop" && <p className="meteor-tip">Co-op relay: Player {coopTurn} turn.</p>}
          {mode === "infection" && (
            <p className="meteor-tip">Infection rule: errors infect nearby words until you clear them.</p>
          )}
          {mode === "stealth" && (
            <p className="meteor-tip">Stealth rule: middle letters are hidden.</p>
          )}
          {mode === "coach" && (
            <p className="meteor-tip">Coach mode: weak patterns are boosted in the word stream.</p>
          )}
          {mode === "code" && (
            <p className="meteor-tip">Code mode: syntax-heavy dictionary and snippets.</p>
          )}
          <p className="meteor-tip">{ghostStatus}</p>
          {mode === "rogue" && rogueOffer && (
            <div className="rogue-offers">
              {rogueOffer.map((offer, offerIndex) => (
                <button key={offer.id} className="ghost-btn" onClick={() => applyRogueOffer(offerIndex)}>
                  {offerIndex + 1}. {offer.name}
                  <span>{offer.description}</span>
                </button>
              ))}
            </div>
          )}
          {focusModeActive && focusPrefs.showStats && focusStatCards.length > 0 && (
            <aside className="focus-hud">
              {focusStatCards.map((card) => (
                <article key={`focus-value-${card.key}`}>
                  <p>{card.label}</p>
                  <h4>{card.value}</h4>
                </article>
              ))}
            </aside>
          )}
          </section>
        )}

        <aside className={`intel-stack ${showArena ? "" : "intel-stack-wide"}`}>
          <section className="route-intro">
            <div className="route-intro-head">
              <div>
                <h3>{ROUTE_COPY[appRoute].title}</h3>
                <p>{ROUTE_COPY[appRoute].subtitle}</p>
              </div>
              {appRoute !== "home" && (
                <button className="ghost-btn back-btn" onClick={() => goBack()}>
                  Back
                </button>
              )}
            </div>
          </section>

          {appRoute === "home" && (
            <section className="home-hero">
              <div className="home-hero-grid">
                <div>
                  <p className="home-eyebrow">Typing platform</p>
                  <h2>Fast drills, weird modes, and a front page that finally feels sorted out.</h2>
                  <p>
                    Home stays calm. Play is now the one place where you pick a mode and launch it, while boards,
                    lab, profile, and settings keep their own pages.
                  </p>
                  <div className="hero-pill-row">
                    <span className="hero-pill">{Object.keys(MODE_META).length} modes</span>
                    <span className="hero-pill">{dictionaryPack.toUpperCase()} active pack</span>
                    <span className="hero-pill">{(bestByMode[mode] ?? 0).toFixed(1)} best WPM</span>
                    <span className="hero-pill">{dailyChallenge ? dailyChallenge.date : "Daily ready"}</span>
                  </div>
                  <div className="hero-actions">
                    <button className="launch-btn" onClick={() => navigateToRoute("play")}>
                      Open play
                    </button>
                    <button className="ghost-btn" onClick={() => navigateToRoute("play")}>
                      Browse play modes
                    </button>
                    <button className="ghost-btn" onClick={() => navigateToRoute("boards")}>
                      Open boards
                    </button>
                  </div>
                </div>
                <div className="home-hero-art" aria-hidden="true">
                  <div className="hero-orbit hero-orbit-a" />
                  <div className="hero-orbit hero-orbit-b" />
                  <div className="hero-orbit hero-orbit-c" />
                  <div className="hero-preview-card">
                    <span>Current lane</span>
                    <strong>{MODE_META[mode].label}</strong>
                    <p>{MODE_META[mode].flavor}</p>
                  </div>
                  <div className="hero-preview-card secondary">
                    <span>Daily</span>
                    <strong>{dailyChallenge ? MODE_META[dailyChallenge.mode].label : "Ready"}</strong>
                    <p>
                      {dailyChallenge
                        ? `${dailyChallenge.durationSec}s · ${dailyChallenge.dictionaryPack}`
                        : "Fresh run queued."}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {appRoute === "home" && (
            <section className="path-grid">
              <article className="path-card">
                <h3>Play Arena</h3>
                <p>Run any mode with instant keyboard capture and low-latency stats.</p>
                <button
                  className="ghost-btn"
                  onClick={() => navigateToRoute("play")}
                >
                  Go to Play
                </button>
              </article>
              <article className="path-card">
                <h3>Play Deck</h3>
                <p>Compare creative modes, read the rundown, and launch from one control page.</p>
                <button
                  className="ghost-btn"
                  onClick={() => navigateToRoute("play")}
                >
                  Go to Play
                </button>
              </article>
              <article className="path-card">
                <h3>Pilot Profile</h3>
                <p>Manage account sync, duel queue, friends, replay sharing, and webhook endpoints.</p>
                <button
                  className="ghost-btn"
                  onClick={() => navigateToRoute("profile")}
                >
                  Go to Profile
                </button>
              </article>
            </section>
          )}

          {appRoute === "home" && (
            <section className="philosophy-grid">
              <article>
                <h3>Static hubs</h3>
                <p>Each page does one job well: home for overview, play for runs, settings for tuning.</p>
              </article>
              <article>
                <h3>Fast input first</h3>
                <p>Typing stays global. The live HUD is lighter, quicker, and easier to read mid-run.</p>
              </article>
              <article>
                <h3>Modes with character</h3>
                <p>Meteor and rhythm now look and sound like their own modes instead of sharing one generic shell.</p>
              </article>
            </section>
          )}

          {appRoute === "home" && (
            <section className="leaderboard-block">
              <h3>Quick Launch</h3>
              <div className="custom-actions">
                <button
                  className="launch-btn"
                  onClick={() => navigateToRoute("play")}
                >
                  Start typing
                </button>
                <button
                  className="ghost-btn"
                  onClick={() => navigateToRoute("play")}
                >
                  Browse modes
                </button>
                <button
                  className="ghost-btn"
                  onClick={() => navigateToRoute("profile")}
                >
                  Open profile
                </button>
              </div>
              <p className="dim">
                Current mode: <strong>{MODE_META[mode].label}</strong> · Best{" "}
                <strong>{(bestByMode[mode] ?? 0).toFixed(1)} WPM</strong>
              </p>
              {dailyChallenge && (
                <p className="dim">
                  Daily: {dailyChallenge.mode} · {dailyChallenge.durationSec}s · {dailyChallenge.dictionaryPack}
                </p>
              )}
            </section>
          )}

          {appRoute === "play" && !isRunning && (
            <section className="leaderboard-block">
              <h3>Mode Deck</h3>
              <div className="play-mode-grid">
                {playModeCards.map((entry) => (
                  <article
                    key={`mode-catalog-${entry.id}`}
                    className={`mode-card ${mode === entry.id ? "active" : ""}`}
                    onMouseEnter={() => setModePreview(entry.id)}
                    onFocus={() => setModePreview(entry.id)}
                  >
                    <div className="mode-card-head">
                      <h4>{entry.label}</h4>
                      <span>{entry.best} best</span>
                    </div>
                    <p>{entry.flavor}</p>
                    <div className="custom-actions">
                      <button
                        className={`ghost-btn ${mode === entry.id ? "is-selected" : ""}`}
                        onClick={() => {
                          setMode(entry.id);
                          setModePreview(entry.id);
                        }}
                      >
                        {mode === entry.id ? "Selected" : "Choose"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {appRoute === "play" && !isRunning && (
            <section className="mode-preview-card">
              <p className="home-eyebrow">Selected mode</p>
              <div className="mode-preview-head">
                <div>
                  <h3>{MODE_META[previewMode].label}</h3>
                  <p>{MODE_META[previewMode].flavor}</p>
                </div>
                <button className="launch-btn" onClick={startSession}>
                  Start {MODE_META[previewMode].label}
                </button>
              </div>
              <p className="mode-preview-copy">{MODE_DETAILS[previewMode]}</p>
              <div className="mode-preview-meta">
                <span>{MODE_META[previewMode].timed ? `${durationSec}s run` : "Open length"}</span>
                <span>{dictionaryPack.toUpperCase()} pack</span>
                <span>{(bestByMode[previewMode] ?? 0).toFixed(1)} best WPM</span>
              </div>
              {dailyChallenge && (
                <p className="dim">
                  Daily challenge: {MODE_META[dailyChallenge.mode].label} · {dailyChallenge.durationSec}s ·{" "}
                  {dailyChallenge.dictionaryPack}
                </p>
              )}
            </section>
          )}

          {appRoute === "profile" && (
            <section className="leaderboard-block">
              <h3>Pilot Record</h3>
              <div className="profile-stat-grid">
                <article>
                  <span>Local runs</span>
                  <strong>{localProfileSummary.runs}</strong>
                </article>
                <article>
                  <span>Average WPM</span>
                  <strong>{localProfileSummary.avgWpm.toFixed(1)}</strong>
                </article>
                <article>
                  <span>Best lane</span>
                  <strong>{MODE_META[localProfileSummary.bestMode].label}</strong>
                </article>
                <article>
                  <span>Best WPM</span>
                  <strong>{localProfileSummary.bestWpm.toFixed(1)}</strong>
                </article>
                <article>
                  <span>Ghost saves</span>
                  <strong>{localProfileSummary.ghosts}</strong>
                </article>
                <article>
                  <span>Replay events</span>
                  <strong>{localProfileSummary.replayEvents}</strong>
                </article>
              </div>
              {accountProfile && (
                <p className="dim">
                  Account rating {accountProfile.rating} · Verified runs {accountProfile.verifiedRuns} · Locale{" "}
                  {accountProfile.locale}
                </p>
              )}
            </section>
          )}

          {appRoute === "profile" && (
            <section className="leaderboard-block">
              <h3>Account</h3>
              <label>
                Handle
                <input value={authHandle} onChange={(event) => setAuthHandle(event.target.value)} maxLength={24} />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  maxLength={128}
                />
              </label>
              <label>
                Locale
                <input value={authLocale} onChange={(event) => setAuthLocale(event.target.value)} maxLength={12} />
              </label>
              <div className="custom-actions">
                <button className="launch-btn" onClick={() => void registerAccountFlow()}>
                  Register
                </button>
                <button className="ghost-btn" onClick={() => void loginAccountFlow()}>
                  Login
                </button>
                <button
                  className="ghost-btn"
                  onClick={() => {
                    setAccountToken("");
                    setAccountProfile(null);
                    setAuthNote("Signed out.");
                  }}
                >
                  Logout
                </button>
              </div>
              {accountProfile && (
                <p className="dim">
                  Signed in as <strong>{accountProfile.handle}</strong> · Rating {accountProfile.rating} · Verified{" "}
                  {accountProfile.verifiedRuns}
                </p>
              )}
              {authNote && <p className="dim">{authNote}</p>}
            </section>
          )}

          {appRoute === "profile" && (
            <section className="leaderboard-block">
              <h3>Cloud Sync + Friends</h3>
              <div className="custom-actions">
                <button
                  className="launch-btn"
                  disabled={!accountToken}
                  onClick={() => void updateAccountPreferences(accountToken, accountPrefs)}
                >
                  Save prefs
                </button>
                <button className="ghost-btn" disabled={!accountToken} onClick={() => void refreshFriends()}>
                  Refresh
                </button>
              </div>
              <label>
                Add friend
                <input value={friendHandle} onChange={(event) => setFriendHandle(event.target.value)} maxLength={24} />
              </label>
              <div className="custom-actions">
                <button className="ghost-btn" disabled={!accountToken} onClick={() => void sendFriendRequest()}>
                  Send request
                </button>
              </div>
              <p className="dim">Friends: {friends.friends.length}</p>
              <ol>
                {friends.friends.slice(0, 8).map((friend) => (
                  <li key={friend.id}>
                    <span>{friend.handle}</span>
                    <strong>{friend.rating}</strong>
                  </li>
                ))}
              </ol>
              {friends.incoming.length > 0 && (
                <div className="custom-actions">
                  {friends.incoming.slice(0, 4).map((request) => (
                    <button
                      key={request.requestId}
                      className="ghost-btn"
                      onClick={() => void respondFriendRequest(request.requestId, true)}
                    >
                      Accept {request.fromHandle}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {appRoute === "profile" && (
            <section className="leaderboard-block">
              <h3>Ranked + Duel</h3>
              <div className="custom-actions">
                <button className="launch-btn" disabled={!accountToken} onClick={() => void enqueueRankedFlow()}>
                  Ranked queue
                </button>
                <button className="ghost-btn" disabled={!accountToken} onClick={() => void enqueueDuelFlow()}>
                  Casual duel
                </button>
                <button className="ghost-btn" disabled={!accountToken} onClick={() => void refreshRankedStatus()}>
                  Status
                </button>
              </div>
              <p className="dim">Queue: {rankedStatus}</p>
              {activeDuel && (
                <>
                  <p className="dim">
                    Duel {activeDuel.kind} · {activeDuel.status}
                  </p>
                  <ol>
                    {activeDuel.players.map((player) => (
                      <li key={player.accountId}>
                        <span>{player.handle}</span>
                        <strong>
                          {player.progress.toFixed(0)}% · {player.wpm.toFixed(1)} WPM
                        </strong>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              {duelNote && <p className="dim">{duelNote}</p>}
            </section>
          )}

          {appRoute === "profile" && (
            <section className="leaderboard-block">
              <h3>Replay Share + Webhooks</h3>
              <label>
                Share title
                <input
                  value={replayShareTitle}
                  onChange={(event) => setReplayShareTitle(event.target.value)}
                  maxLength={80}
                />
              </label>
              <div className="custom-actions">
                <button className="launch-btn" onClick={() => void shareSelectedReplay()}>
                  Share selected replay
                </button>
                <button className="ghost-btn" onClick={() => void refreshReplayShares()}>
                  Refresh shares
                </button>
              </div>
              <label>
                Load shared replay ID
                <input
                  value={sharedReplayIdInput}
                  onChange={(event) => setSharedReplayIdInput(event.target.value)}
                  maxLength={24}
                />
              </label>
              <div className="custom-actions">
                <button className="ghost-btn" onClick={() => void loadSharedReplay()}>
                  Load shared replay
                </button>
              </div>
              {loadedSharedReplay && (
                <p className="dim">
                  Loaded {loadedSharedReplay.id} · {loadedSharedReplay.mode} · {loadedSharedReplay.title}
                </p>
              )}
              <ol>
                {replayShares.slice(0, 6).map((entry) => (
                  <li key={entry.id}>
                    <span>{entry.title}</span>
                    <strong>{entry.id}</strong>
                  </li>
                ))}
              </ol>
              <label>
                Webhook URL
                <input
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                  placeholder="https://example.com/hook"
                />
              </label>
              <label>
                Webhook events
                <input
                  value={webhookEvents}
                  onChange={(event) => setWebhookEvents(event.target.value)}
                  placeholder="score.submitted,webhook.test"
                />
              </label>
              <div className="custom-actions">
                <button className="launch-btn" disabled={!accountToken} onClick={() => void createWebhookFlow()}>
                  Add webhook
                </button>
                <button className="ghost-btn" disabled={!accountToken} onClick={() => void refreshWebhooks()}>
                  Refresh hooks
                </button>
              </div>
              {webhooks.length > 0 && (
                <div className="custom-actions">
                  {webhooks.slice(0, 4).map((hook) => (
                    <button
                      key={hook.id}
                      className="ghost-btn"
                      onClick={() => void testWebhookFlow(hook.id)}
                    >
                      Test {hook.id.slice(0, 8)}
                    </button>
                  ))}
                </div>
              )}
              {webhooks.length > 0 && (
                <div className="custom-actions">
                  {webhooks.slice(0, 4).map((hook) => (
                    <button
                      key={`del-${hook.id}`}
                      className="ghost-btn"
                      onClick={() => void deleteWebhookFlow(hook.id)}
                    >
                      Remove {hook.id.slice(0, 8)}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {(appRoute === "play" || appRoute === "settings" || appRoute === "home") && (
            <section className="stats-block">
              <h3>Stats</h3>
              <div className="stat-grid">
                {statCards.map((card) => (
                  <article key={card.key}>
                    <p className="stat-title">
                      {card.label}
                      <button
                        type="button"
                        className="stat-help"
                        aria-label={`${card.label} help`}
                        data-help={card.help}
                      >
                        ?
                      </button>
                    </p>
                    <h4>{card.value}</h4>
                  </article>
                ))}
              </div>
            </section>
          )}

          {appRoute === "settings" && (
            <section className="leaderboard-block">
              <h3>Privacy Controls</h3>
              <p className="dim">
                Consent, storage controls, cookie policy, and analytics review now live in the dedicated Privacy page.
              </p>
              <div className="custom-actions">
                <button
                  className="launch-btn"
                  onClick={() => navigateToRoute("privacy")}
                >
                  Open privacy desk
                </button>
              </div>
            </section>
          )}

          {appRoute === "privacy" && (
            <section className="leaderboard-block privacy-page" id="privacy-controls">
              <h3>Privacy Controls</h3>
              <p className="dim">
                Tracking cookies stay off by default. Anonymous usage stats remain off unless you allow them.
                Functional storage is still used for things you explicitly do, like signed-in sessions, replays,
                dictionaries, and run history.
              </p>
              <div className="privacy-card-grid">
                <article className="privacy-option-card">
                  <div className="privacy-option-head">
                    <div>
                      <strong>Comfort settings on this device</strong>
                      <p>Theme, sound, focus HUD, and input comfort defaults.</p>
                    </div>
                    <label className="privacy-switch">
                      <input
                        type="checkbox"
                        checked={consentDraft.preferences}
                        onChange={(event) =>
                          setConsentDraft((prev) => ({ ...prev, preferences: event.target.checked }))
                        }
                      />
                      <span />
                    </label>
                  </div>
                </article>
                <article className="privacy-option-card">
                  <div className="privacy-option-head">
                    <div>
                      <strong>Anonymous usage stats</strong>
                      <p>Aggregate counts only. No ad IDs, no cross-site tracking, no fingerprinting.</p>
                    </div>
                    <label className="privacy-switch">
                      <input
                        type="checkbox"
                        checked={consentDraft.analytics}
                        disabled={doNotTrackEnabled}
                        onChange={(event) =>
                          setConsentDraft((prev) => ({ ...prev, analytics: event.target.checked }))
                        }
                      />
                      <span />
                    </label>
                  </div>
                </article>
              </div>
              <div className="privacy-meta-grid">
                <article>
                  <span>Cookies</span>
                  <strong>Off by default</strong>
                  <p>No marketing or third-party tracking cookies are shipped.</p>
                </article>
                <article>
                  <span>Browser signal</span>
                  <strong>{doNotTrackEnabled ? "Privacy signal on" : "No privacy signal"}</strong>
                  <p>{doNotTrackEnabled ? "Anonymous usage stats stay disabled." : "You can choose aggregate stats manually."}</p>
                </article>
                <article>
                  <span>Storage still used</span>
                  <strong>Functional only</strong>
                  <p>Signed-in session data, custom dictionaries, replays, and active run state.</p>
                </article>
              </div>
              <div className="custom-actions">
                <button className="launch-btn" onClick={() => applyPrivacyConsent(consentDraft)}>
                  Save privacy choices
                </button>
                <button
                  className="ghost-btn"
                  onClick={() => applyPrivacyConsent({ analytics: false, preferences: false })}
                >
                  Essentials only
                </button>
              </div>
              {privacyConsent && (
                <p className="dim">
                  Saved {new Date(privacyConsent.decidedAt).toLocaleString()} · Analytics{" "}
                  {privacyConsent.analytics ? "on" : "off"} · Comfort settings{" "}
                  {privacyConsent.preferences ? "on" : "off"}
                </p>
              )}
              {privacyNote && <p className="dim">{privacyNote}</p>}
            </section>
          )}

          {appRoute === "privacy" && (
            <section className="leaderboard-block privacy-page">
              <h3>Cookie + Storage Policy</h3>
              <div className="privacy-meta-grid">
                <article>
                  <span>Essential app storage</span>
                  <strong>Always available</strong>
                  <p>Needed for login state, replay files, active runs, and custom dictionaries you ask to save.</p>
                </article>
                <article>
                  <span>Comfort storage</span>
                  <strong>Optional</strong>
                  <p>Theme, sound pack, accessibility preset, and HUD layout only save if you allow it.</p>
                </article>
                <article>
                  <span>Audience measurement</span>
                  <strong>Aggregate only</strong>
                  <p>Counts of page views, mode picks, run starts, and run finishes with coarse buckets only.</p>
                </article>
              </div>
            </section>
          )}

          {appRoute === "privacy" && (
            <section className="leaderboard-block privacy-page">
              <h3>Analytics Summary</h3>
              <p className="dim">
                Admin view for aggregate usage counts. In production, this requires your metrics token.
              </p>
              <div className="analytics-toolbar">
                <label>
                  Analytics token
                  <input
                    type="password"
                    value={analyticsAdminToken}
                    onChange={(event) => setAnalyticsAdminToken(event.target.value)}
                    placeholder={isDevEnvironment ? "Optional in dev" : "Required in production"}
                  />
                </label>
                <button className="launch-btn" onClick={() => void refreshAnalyticsSummary()}>
                  Load summary
                </button>
              </div>
              {analyticsSummaryError && <p className="dim">Analytics: {analyticsSummaryError}</p>}
              <div className="analytics-totals-grid">
                {Object.entries(analyticsSummaryTotals).length > 0 ? (
                  Object.entries(analyticsSummaryTotals).map(([eventName, count]) => (
                    <article key={`analytics-total-${eventName}`}>
                      <span>{eventName.replace(/_/g, " ")}</span>
                      <strong>{count}</strong>
                    </article>
                  ))
                ) : (
                  <p className="dim">{analyticsSummaryLoading ? "Loading analytics..." : "No analytics summary loaded yet."}</p>
                )}
              </div>
              {analyticsSummaryRows.length > 0 && (
                <div className="analytics-table-wrap">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Event</th>
                        <th>Page</th>
                        <th>Mode</th>
                        <th>Theme</th>
                        <th>Viewport</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsSummaryRows.map((row, index) => (
                        <tr key={`analytics-row-${row.dateKey}-${row.eventName}-${index}`}>
                          <td>{row.dateKey}</td>
                          <td>{row.eventName}</td>
                          <td>{row.page ?? "-"}</td>
                          <td>{row.mode ?? "-"}</td>
                          <td>{row.theme ?? "-"}</td>
                          <td>{row.viewportBucket ?? "-"}</td>
                          <td>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {appRoute === "lab" && (
            <section className="custom-block">
              <h3>Custom dictionary</h3>
              <textarea
                value={customInput}
                onChange={(event) => setCustomInput(event.target.value)}
                placeholder="Add your own words here..."
              />
              <div className="custom-actions">
                <button className="launch-btn" onClick={saveCustomDictionary}>
                  Save
                </button>
                <button
                  className="ghost-btn"
                  onClick={() => {
                    setCustomInput("");
                    setCustomWords([]);
                    localStorage.setItem(STORAGE_CUSTOM, JSON.stringify([]));
                    resetSession(true);
                  }}
                >
                  Clear
                </button>
              </div>
            </section>
          )}

          {appRoute === "social" && (
            <section className="leaderboard-block">
              <h3>Multiplayer Race</h3>
              <label>
                Pilot tag
                <input value={raceName} onChange={(event) => setRaceName(event.target.value)} maxLength={24} />
              </label>
              <div className="custom-actions">
                <button className="launch-btn" onClick={() => void createRace()}>
                  Create room
                </button>
                <input
                  value={raceRoomInput}
                  onChange={(event) => setRaceRoomInput(event.target.value.toUpperCase())}
                  placeholder="ROOMID"
                />
                <button className="ghost-btn" onClick={() => void joinRace()}>
                  Join
                </button>
              </div>
              {raceRoomId && (
                <div className="multiplayer-room">
                  <p>
                    Room <strong>{raceRoomId}</strong> {raceState?.status ? `(${raceState.status})` : ""}
                  </p>
                  <button
                    className="launch-btn"
                    onClick={() => void startRace()}
                    disabled={!raceState || raceState.hostPlayerId !== racePlayerId}
                  >
                    Start race
                  </button>
                  <ol>
                    {(raceState?.players ?? []).map((player) => (
                      <li key={player.id}>
                        <span>{player.name}</span>
                        <strong>
                          {player.progress.toFixed(0)}% · {player.wpm.toFixed(1)} WPM
                        </strong>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {raceError && (
                <p className="dim" role="alert">
                  Race: {raceError}
                </p>
              )}
            </section>
          )}

          {appRoute === "social" && (
            <section className="leaderboard-block">
              <h3>Tournament</h3>
              <label>
                Bracket name
                <input
                  value={tournamentName}
                  onChange={(event) => setTournamentName(event.target.value)}
                  maxLength={48}
                />
              </label>
              <label>
                Entrants (one per line)
                <textarea
                  value={tournamentEntrantsInput}
                  onChange={(event) => setTournamentEntrantsInput(event.target.value)}
                  rows={5}
                />
              </label>
              <div className="custom-actions">
                <button className="launch-btn" onClick={() => void createBracket()}>
                  Create bracket
                </button>
                <input
                  value={tournamentLookupId}
                  onChange={(event) => setTournamentLookupId(event.target.value)}
                  placeholder="Tournament ID"
                />
                <button
                  className="ghost-btn"
                  onClick={() => {
                    if (!tournamentLookupId) return;
                    void fetchTournamentState(tournamentLookupId).then(setTournamentState).catch(() => {
                      // no-op
                    });
                  }}
                >
                  Spectate
                </button>
              </div>
              {tournamentState && (
                <div className="tournament-board">
                  <p>
                    {tournamentState.name} · {tournamentState.status}
                  </p>
                  <p className="dim">{tournamentState.id}</p>
                  {tournamentState.matches
                    .slice()
                    .sort((a, b) => a.round - b.round || a.index - b.index)
                    .map((match) => {
                      const aName =
                        tournamentState.players.find((player) => player.id === match.playerAId)?.name ?? "TBD";
                      const bName =
                        tournamentState.players.find((player) => player.id === match.playerBId)?.name ?? "TBD";
                      return (
                        <div key={match.id} className="tournament-match">
                          <p>
                            R{match.round} · Match {match.index + 1}
                          </p>
                          <div className="custom-actions">
                            <button
                              className="ghost-btn"
                              disabled={!match.playerAId}
                              onClick={() => {
                                if (match.playerAId) void markMatchWinner(match.id, match.playerAId);
                              }}
                            >
                              {aName}
                            </button>
                            <button
                              className="ghost-btn"
                              disabled={!match.playerBId}
                              onClick={() => {
                                if (match.playerBId) void markMatchWinner(match.id, match.playerBId);
                              }}
                            >
                              {bName}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
              {tournamentError && (
                <p className="dim" role="alert">
                  Tournament: {tournamentError}
                </p>
              )}
            </section>
          )}

          {appRoute === "lab" && (
            <section className="leaderboard-block">
              <h3>Replay Viewer</h3>
              {replays.length > 0 ? (
                <>
                  <label>
                    Replay run
                    <select
                      value={selectedReplayId || (replays[0]?.id ?? "")}
                      onChange={(event) => setSelectedReplayId(event.target.value)}
                    >
                      {replays.map((run) => (
                        <option key={run.id} value={run.id}>
                          {new Date(run.createdAt).toLocaleString()} · {run.mode} · {run.wpm.toFixed(1)} WPM
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedReplay && (
                    <>
                      <input
                        type="range"
                        min={0}
                        max={selectedReplay.durationMs}
                        value={replayCursorMs}
                        onChange={(event) => setReplayCursorMs(Number(event.target.value))}
                      />
                      <div className="custom-actions">
                        <button className="launch-btn" onClick={() => setReplayPlaying((v) => !v)}>
                          {replayPlaying ? "Pause" : "Play"}
                        </button>
                        <button className="ghost-btn" onClick={() => setReplayCursorMs(0)}>
                          Rewind
                        </button>
                        <button className="ghost-btn" onClick={exportSelectedReplayFile}>
                          Export JSON
                        </button>
                        <button
                          className="ghost-btn"
                          onClick={() => replayImportInputRef.current?.click()}
                        >
                          Import JSON
                        </button>
                        <input
                          ref={replayImportInputRef}
                          type="file"
                          accept="application/json"
                          style={{ display: "none" }}
                          onChange={(event) => {
                            void importReplayFile(event.target.files?.[0]);
                            event.currentTarget.value = "";
                          }}
                        />
                      </div>
                      <p className="dim">
                        {Math.round(replayCursorMs)}ms / {selectedReplay.durationMs}ms
                      </p>
                      <div className="replay-feed">
                        {replayVisibleEvents.map((event, index) => (
                          <span key={`${event.t}-${index}`} className={event.correct ? "good" : "bad"}>
                            {event.kind}:{event.key}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="dim">No replays yet.</p>
              )}
              {replayNote && (
                <p className="dim" role="status">
                  {replayNote}
                </p>
              )}
            </section>
          )}

          {appRoute === "lab" && (
            <section className="leaderboard-block">
              <h3>Heatmap + Fingers</h3>
              <div className="heatmap-grid">
                {KEYBOARD_ROWS.map((row) => (
                  <div key={row} className="heatmap-row">
                    {row.split("").map((key) => {
                      const bucket = keyStats[key] ?? { hits: 0, errors: 0 };
                      const errorRate = bucket.hits > 0 ? bucket.errors / bucket.hits : 0;
                      const alpha = Math.min(0.75, errorRate * 1.2 + 0.1);
                      return (
                        <span
                          key={key}
                          className="heatmap-key"
                          style={{ background: `rgba(255, 126, 157, ${alpha})` }}
                          title={`${key.toUpperCase()} · hits ${bucket.hits} · errors ${bucket.errors}`}
                        >
                          {key.toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
              <ol>
                {fingerStats.map((finger) => (
                  <li key={finger.finger}>
                    <span>{finger.finger}</span>
                    <strong>
                      {finger.accuracy.toFixed(1)}% · {finger.hits} hits
                    </strong>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {appRoute === "boards" && (
            <section className="leaderboard-block" aria-busy={leaderboardLoading}>
              <h3>Leaderboard</h3>
              {certifiedRun && <p className="dim">Certified-only filter is enabled.</p>}
              {leaderboardLoading && <p className="dim">Loading board...</p>}
              {leaderboardError && <p className="dim">Board offline: {leaderboardError}</p>}
              {!leaderboardLoading && !leaderboardError && leaderboardEntries.length > 0 && (
                <ol>
                  {leaderboardEntries.map((entry) => (
                    <li key={`${entry.rank}-${entry.username}-${entry.createdAt}`}>
                      <span>
                        {entry.rank}. {entry.username}
                        {entry.certified ? " ✓" : ""}
                      </span>
                      <strong>{entry.wpm.toFixed(1)} WPM</strong>
                    </li>
                  ))}
                </ol>
              )}
              {!leaderboardLoading && !leaderboardError && leaderboardEntries.length === 0 && (
                <p className="dim">No scores yet.</p>
              )}
            </section>
          )}

          {appRoute === "boards" && (
            <section className="leaderboard-block" aria-busy={!dailyChallenge}>
              <h3>Daily Challenge</h3>
              {dailyChallenge ? (
                <>
                  <p className="dim">
                    {dailyChallenge.date} · {dailyChallenge.mode} · {dailyChallenge.durationSec}s ·{" "}
                    {dailyChallenge.dictionaryPack}
                  </p>
                  <div className="custom-actions">
                    <button className="launch-btn" onClick={activateDailyChallenge}>
                      Load challenge preset
                    </button>
                    <button
                      className="ghost-btn"
                      onClick={() => {
                        void refreshChallengeAndSeason();
                      }}
                    >
                      Refresh
                    </button>
                  </div>
                </>
              ) : (
                <p className="dim">Loading daily challenge...</p>
              )}
              {challengeNote && (
                <p className="dim" role="status">
                  {challengeNote}
                </p>
              )}
              {challengeError && (
                <p className="dim" role="alert">
                  Challenge: {challengeError}
                </p>
              )}
              {challengeBoard.length > 0 && (
                <ol>
                  {challengeBoard.map((entry) => (
                    <li key={`${entry.rank}-${entry.username}-${entry.createdAt}`}>
                      <span>
                        {entry.rank}. {entry.username}
                      </span>
                      <strong>
                        {entry.points} pts · {entry.wpm.toFixed(1)} WPM
                      </strong>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}

          {appRoute === "boards" && (
            <section className="leaderboard-block" aria-busy={!seasonWindow && !seasonError}>
              <h3>Season Ladder</h3>
              {seasonWindow && (
                <p className="dim">
                  {seasonWindow.id} · {seasonWindow.startDate} to {seasonWindow.endDate}
                </p>
              )}
              {seasonError && (
                <p className="dim" role="alert">
                  Season: {seasonError}
                </p>
              )}
              {seasonBoard.length > 0 ? (
                <ol>
                  {seasonBoard.map((entry) => (
                    <li key={`${entry.rank}-${entry.username}`}>
                      <span>
                        {entry.rank}. {entry.username}
                      </span>
                      <strong>
                        {entry.points} pts · {entry.bestWpm.toFixed(1)} best
                      </strong>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="dim">No seasonal entries yet.</p>
              )}
            </section>
          )}

          {appRoute === "play" && report && (
            <section className="report-block">
              <h3>Run recap</h3>
              <p>Result: {report.reason}</p>
              <p>
                WPM {report.wpm.toFixed(1)} | RAW {report.raw.toFixed(1)}
              </p>
              <p>
                CPM {report.cpm.toFixed(0)} | KPS {report.kps.toFixed(2)} | Time {formatSeconds(report.elapsedSec)}
              </p>
              <p>
                Accuracy {report.accuracy.toFixed(1)}% | Efficiency {report.efficiency.toFixed(1)}%
              </p>
              <p>
                Words {report.completedWords} | Correct {report.correctChars} | Wrong {report.wrongChars}
              </p>
              <p>Best streak {report.maxStreak}</p>
              <p>Best ({mode}) {report.best.toFixed(1)} WPM</p>
            </section>
          )}
        </aside>
      </main>

      {!privacyConsent && (
        <section className="consent-banner" aria-label="Privacy choices">
          <div>
            <strong>No tracking cookies by default.</strong>
            <p>
              Anonymous usage stats stay off unless you allow them. You can also leave comfort-setting storage off and
              still use the site.
            </p>
          </div>
          <div className="consent-actions">
            <button
              className="launch-btn"
              onClick={() => applyPrivacyConsent({ analytics: !doNotTrackEnabled, preferences: true })}
            >
              Allow anonymous stats
            </button>
            <button
              className="ghost-btn"
              onClick={() => applyPrivacyConsent({ analytics: false, preferences: false })}
            >
              Essentials only
            </button>
            <button
              className="ghost-btn"
              onClick={() => {
                navigateToRoute("privacy");
              }}
            >
              Choose manually
            </button>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <p>
          <strong>TypeShift Station</strong> · Speed drills, strange modes, boards, and run history in one place.
        </p>
        <div className="footer-links">
          <Link href={pathForRoute("home")}>Home</Link>
          <Link href={pathForRoute("play")}>Play</Link>
          <Link href={pathForRoute("boards")}>Boards</Link>
          <Link href={pathForRoute("settings")}>Settings</Link>
          <Link href={pathForRoute("privacy")}>Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
