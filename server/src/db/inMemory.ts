import type { Mode } from "../types.js";

interface MemorySession {
  id: string;
  mode: Mode;
  expiresAtMs: number;
  consumed: boolean;
  ipHash: string;
  userAgentHash: string;
}

interface MemoryScore {
  id: string;
  sessionId: string;
  username: string;
  mode: Mode;
  wpm: number;
  raw: number;
  accuracy: number;
  errors: number;
  streak: number;
  durationMs: number;
  certified: boolean;
  clientVersion: string | null;
  telemetry: Record<string, unknown> | null;
  createdAt: string;
}

interface MemoryChallengeScore {
  id: string;
  sessionId: string;
  challengeDate: string;
  username: string;
  mode: Mode;
  wpm: number;
  raw: number;
  accuracy: number;
  errors: number;
  streak: number;
  durationMs: number;
  points: number;
  createdAt: string;
}

const sessions = new Map<string, MemorySession>();
const scores: MemoryScore[] = [];
const challengeScores: MemoryChallengeScore[] = [];
const analyticsAggregates = new Map<
  string,
  {
    dateKey: string;
    eventName: string;
    page: string | null;
    mode: Mode | null;
    theme: "dark" | "light" | null;
    viewportBucket: "sm" | "md" | "lg" | "xl" | null;
    reducedMotion: boolean | null;
    consentVersion: number | null;
    count: number;
    updatedAt: string;
  }
>();

export function createMemorySession(input: Omit<MemorySession, "consumed">): void {
  sessions.set(input.id, { ...input, consumed: false });
}

export function resetInMemoryDatabase(): void {
  sessions.clear();
  scores.length = 0;
  challengeScores.length = 0;
  analyticsAggregates.clear();
}

export function consumeMemorySession(input: {
  id: string;
  mode: Mode;
  ipHash: string;
  userAgentHash: string;
}): { ok: true } | { ok: false; status: number; error: string } {
  const session = sessions.get(input.id);
  if (!session) {
    return { ok: false, status: 409, error: "Session already used or expired" };
  }
  if (session.consumed || session.expiresAtMs <= Date.now() || session.mode !== input.mode) {
    return { ok: false, status: 409, error: "Session already used or expired" };
  }
  if (session.ipHash !== input.ipHash || session.userAgentHash !== input.userAgentHash) {
    return { ok: false, status: 403, error: "Session fingerprint mismatch" };
  }
  session.consumed = true;
  sessions.set(session.id, session);
  return { ok: true };
}

export function insertMemoryScore(score: MemoryScore): { ok: true } | { ok: false; error: string } {
  if (scores.some((item) => item.sessionId === score.sessionId)) {
    return { ok: false, error: "Failed to persist score" };
  }
  scores.push(score);
  return { ok: true };
}

export function getMemoryLeaderboard(mode: Mode, limit: number, certifiedOnly = false): MemoryScore[] {
  return scores
    .filter((score) => score.mode === mode && (!certifiedOnly || score.certified))
    .sort((a, b) => {
      if (b.wpm !== a.wpm) return b.wpm - a.wpm;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.raw !== a.raw) return b.raw - a.raw;
      return a.createdAt.localeCompare(b.createdAt);
    })
    .slice(0, limit);
}

export function insertMemoryChallengeScore(
  score: MemoryChallengeScore,
): { ok: true } | { ok: false; error: string } {
  if (challengeScores.some((item) => item.sessionId === score.sessionId)) {
    return { ok: false, error: "Failed to persist challenge score" };
  }
  challengeScores.push(score);
  return { ok: true };
}

export function getMemoryChallengeLeaderboard(
  challengeDate: string,
  limit: number,
): MemoryChallengeScore[] {
  return challengeScores
    .filter((score) => score.challengeDate === challengeDate)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wpm !== a.wpm) return b.wpm - a.wpm;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.raw !== a.raw) return b.raw - a.raw;
      return a.createdAt.localeCompare(b.createdAt);
    })
    .slice(0, limit);
}

export function getMemoryScoresByUsername(username: string): MemoryScore[] {
  return scores
    .filter((row) => row.username === username)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getMemoryChallengeScoresByUsername(username: string): MemoryChallengeScore[] {
  return challengeScores
    .filter((row) => row.username === username)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function deleteMemoryScoresByUsername(username: string): void {
  for (let index = scores.length - 1; index >= 0; index -= 1) {
    if (scores[index]?.username === username) {
      scores.splice(index, 1);
    }
  }
}

export function deleteMemoryChallengeScoresByUsername(username: string): void {
  for (let index = challengeScores.length - 1; index >= 0; index -= 1) {
    if (challengeScores[index]?.username === username) {
      challengeScores.splice(index, 1);
    }
  }
}

function parseIsoDate(date: string): number {
  const ts = Date.parse(date);
  return Number.isFinite(ts) ? ts : 0;
}

export function getMemorySeasonLeaderboard(
  seasonStartIso: string,
  seasonEndIso: string,
  limit: number,
): Array<{ username: string; points: number; runs: number; bestWpm: number }> {
  const startMs = parseIsoDate(seasonStartIso);
  const endMs = parseIsoDate(seasonEndIso);
  const bucket = new Map<string, { points: number; runs: number; bestWpm: number }>();

  const baseRows = scores
    .filter((row) => {
      const createdMs = parseIsoDate(row.createdAt);
      return createdMs >= startMs && createdMs < endMs;
    })
    .map((row) => ({
      username: row.username,
      points: Math.max(0, Math.floor((row.wpm * row.accuracy) / 10) - row.errors * 2 + row.streak),
      wpm: row.wpm,
    }));

  const challengeRows = challengeScores
    .filter((row) => {
      const createdMs = parseIsoDate(row.createdAt);
      return createdMs >= startMs && createdMs < endMs;
    })
    .map((row) => ({
      username: row.username,
      points: Math.max(0, row.points + 50),
      wpm: row.wpm,
    }));

  for (const row of [...baseRows, ...challengeRows]) {
    const current = bucket.get(row.username) ?? { points: 0, runs: 0, bestWpm: 0 };
    bucket.set(row.username, {
      points: current.points + row.points,
      runs: current.runs + 1,
      bestWpm: Math.max(current.bestWpm, row.wpm),
    });
  }

  return [...bucket.entries()]
    .map(([username, value]) => ({
      username,
      points: value.points,
      runs: value.runs,
      bestWpm: value.bestWpm,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.bestWpm !== a.bestWpm) return b.bestWpm - a.bestWpm;
      if (b.runs !== a.runs) return b.runs - a.runs;
      return a.username.localeCompare(b.username);
    })
    .slice(0, limit);
}

export function incrementMemoryAnalyticsAggregate(input: {
  dateKey: string;
  eventName: string;
  page: string | null;
  mode: Mode | null;
  theme: "dark" | "light" | null;
  viewportBucket: "sm" | "md" | "lg" | "xl" | null;
  reducedMotion: boolean | null;
  consentVersion: number | null;
}): void {
  const key = [
    input.dateKey,
    input.eventName,
    input.page ?? "",
    input.mode ?? "",
    input.theme ?? "",
    input.viewportBucket ?? "",
    input.reducedMotion == null ? "" : String(input.reducedMotion),
    input.consentVersion == null ? "" : String(input.consentVersion),
  ].join("|");
  const current = analyticsAggregates.get(key);
  analyticsAggregates.set(key, {
    dateKey: input.dateKey,
    eventName: input.eventName,
    page: input.page,
    mode: input.mode,
    theme: input.theme,
    viewportBucket: input.viewportBucket,
    reducedMotion: input.reducedMotion,
    consentVersion: input.consentVersion,
    count: (current?.count ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  });
}

export function getMemoryAnalyticsSummary(days: number): Array<{
  dateKey: string;
  eventName: string;
  page: string | null;
  mode: Mode | null;
  theme: "dark" | "light" | null;
  viewportBucket: "sm" | "md" | "lg" | "xl" | null;
  reducedMotion: boolean | null;
  consentVersion: number | null;
  count: number;
}> {
  const cutoff = Date.now() - days * 86_400_000;
  return [...analyticsAggregates.values()]
    .filter((row) => Date.parse(`${row.dateKey}T00:00:00.000Z`) >= cutoff)
    .sort((a, b) => {
      if (b.dateKey !== a.dateKey) return b.dateKey.localeCompare(a.dateKey);
      if (b.count !== a.count) return b.count - a.count;
      return a.eventName.localeCompare(b.eventName);
    })
    .map((row) => ({
      dateKey: row.dateKey,
      eventName: row.eventName,
      page: row.page,
      mode: row.mode,
      theme: row.theme,
      viewportBucket: row.viewportBucket,
      reducedMotion: row.reducedMotion,
      consentVersion: row.consentVersion,
      count: row.count,
    }));
}
