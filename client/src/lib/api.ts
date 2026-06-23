export type Mode =
  | "time"
  | "quote"
  | "meteor"
  | "zen"
  | "pulse"
  | "relay"
  | "cipher"
  | "drift"
  | "reverse"
  | "echo"
  | "rogue"
  | "duel"
  | "code"
  | "coach"
  | "blackout"
  | "chain"
  | "gravity"
  | "coop"
  | "infection"
  | "stealth"
  | "chart";

export interface SessionInitResponse {
  sessionId: string;
  token: string;
  expiresAt: string;
}

export interface ScoreSubmissionPayload {
  sessionId: string;
  mode: Mode;
  username: string;
  wpm: number;
  raw: number;
  accuracy: number;
  errors: number;
  streak: number;
  durationMs: number;
  certified?: boolean;
  clientVersion?: string;
  telemetry?: {
    typedChars: number;
    correctChars: number;
    wrongChars: number;
    avgKeyIntervalMs: number;
    burstKps: number;
    idleRatio: number;
    timelineHash?: string;
  };
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  mode: Mode;
  wpm: number;
  raw: number;
  accuracy: number;
  errors: number;
  streak: number;
  durationMs: number;
  certified?: boolean;
  createdAt: string;
}

export interface LeaderboardResponse {
  mode: Mode;
  entries: LeaderboardEntry[];
}

export interface AdminUserEntry {
  id: string;
  handle: string;
  rating: number;
  locale: string;
  verifiedRuns: number;
  createdAt: string;
  deletedAt: string | null;
  sessionCount: number;
  scoreCount: number;
  challengeScoreCount: number;
  replayShareCount: number;
  webhookCount: number;
}

export interface AdminLeaderboardEntry {
  id: string;
  sessionId: string;
  accountId: string | null;
  username: string;
  mode: Mode;
  wpm: number;
  raw: number;
  accuracy: number;
  errors: number;
  streak: number;
  durationMs: number;
  certified: boolean;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUserEntry[];
}

export interface AdminLeaderboardResponse {
  entries: AdminLeaderboardEntry[];
}

export interface DailyChallenge {
  id: string;
  date: string;
  mode: Mode;
  durationSec: number;
  dictionaryPack: "top1k" | "top5k" | "top10k" | "verbs" | "nouns" | "core" | "tech";
  seed: number;
}

export interface ChallengeLeaderboardEntry {
  rank: number;
  username: string;
  mode: Mode;
  points: number;
  wpm: number;
  raw: number;
  accuracy: number;
  errors: number;
  streak: number;
  durationMs: number;
  createdAt: string;
}

export interface ChallengeLeaderboardResponse {
  date: string;
  entries: ChallengeLeaderboardEntry[];
}

export interface SeasonWindow {
  id: string;
  startDate: string;
  endDate: string;
}

export interface SeasonLeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  runs: number;
  bestWpm: number;
}

export interface SeasonLeaderboardResponse {
  season: SeasonWindow;
  entries: SeasonLeaderboardEntry[];
}

export interface RacePlayerState {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  finished: boolean;
  finishedAt: number | null;
}

export interface RaceRoomState {
  roomId: string;
  mode: Mode;
  status: "lobby" | "running" | "finished";
  startedAt: number | null;
  hostPlayerId: string;
  players: RacePlayerState[];
}

export interface RaceRoomCreateResponse {
  roomId: string;
  playerId: string;
  room: RaceRoomState;
}

export interface TournamentPlayer {
  id: string;
  name: string;
}

export interface TournamentMatch {
  id: string;
  round: number;
  index: number;
  playerAId: string | null;
  playerBId: string | null;
  winnerId: string | null;
}

export interface TournamentState {
  id: string;
  name: string;
  mode: Mode;
  status: "live" | "finished";
  createdAt: number;
  players: TournamentPlayer[];
  matches: TournamentMatch[];
}

export interface ChallengeSubmitPayload {
  sessionId: string;
  challengeDate: string;
  mode: Mode;
  username: string;
  wpm: number;
  raw: number;
  accuracy: number;
  errors: number;
  streak: number;
  durationMs: number;
}

export interface AccountProfile {
  id: string;
  handle: string;
  rating: number;
  locale: string;
  verifiedRuns: number;
  createdAt: string;
  sessionTtlMs?: number;
}

export interface AccountSessionEntry {
  id: string;
  label: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface FriendListResponse {
  friends: Array<{ id: string; handle: string; rating: number }>;
  incoming: Array<{ requestId: string; fromAccountId: string; fromHandle: string; createdAt: string }>;
  outgoing: Array<{ requestId: string; toAccountId: string; toHandle: string; createdAt: string }>;
}

export interface DuelState {
  id: string;
  kind: "ranked" | "casual";
  status: "running" | "finished";
  createdAt: number;
  updatedAt: number;
  winnerAccountId: string | null;
  players: Array<{
    accountId: string;
    handle: string;
    rating: number;
    progress: number;
    wpm: number;
    accuracy: number;
    finished: boolean;
  }>;
}

export interface ReplayShareEntry {
  id: string;
  accountId: string | null;
  mode: Mode;
  title: string;
  isPublic: boolean;
  createdAt: string;
}

export interface ReplaySharePayload extends ReplayShareEntry {
  replay: Record<string, unknown>;
}

export interface WebhookEndpoint {
  id: string;
  targetUrl: string;
  events: string[];
  active: boolean;
  secret?: string;
}

export interface PrivacyAnalyticsPayload {
  event:
    | "page_view"
    | "mode_select"
    | "run_start"
    | "run_finish"
    | "auth_register"
    | "auth_login"
    | "consent_update";
  page?: string;
  mode?: Mode;
  theme?: "dark" | "light";
  consentVersion?: number;
  telemetry?: {
    viewportBucket?: "sm" | "md" | "lg" | "xl";
    reducedMotion?: boolean;
    doNotTrack?: boolean;
  };
}

export interface AnalyticsSummaryRow {
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

export interface AnalyticsSummaryResponse {
  days: number;
  totals: Record<string, number>;
  rows: AnalyticsSummaryRow[];
}

const LEADERBOARD_CACHE_KEY = "typeshift.leaderboard.cache.v1";
const LEADERBOARD_CACHE_TTL_MS = 12_000;
const SCORE_QUEUE_KEY = "typeshift.score.queue.v1";

interface CachedLeaderboardMap {
  [key: string]: {
    updatedAt: number;
    value: LeaderboardResponse;
  };
}

interface QueuedScoreSubmission {
  payload: ScoreSubmissionPayload;
  token: string;
  queuedAt: number;
  attempts: number;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const leaderboardMemoryCache = new Map<
  string,
  { updatedAt: number; value: LeaderboardResponse }
>();
let queueFlushInFlight = false;

function leaderboardKey(modeKey: string, limit: number): string {
  return `${modeKey}:${limit}`;
}

function readLeaderboardCache(key: string): LeaderboardResponse | null {
  const mem = leaderboardMemoryCache.get(key);
  if (mem && Date.now() - mem.updatedAt <= LEADERBOARD_CACHE_TTL_MS) {
    return mem.value;
  }

  try {
    const raw = localStorage.getItem(LEADERBOARD_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLeaderboardMap;
    const hit = parsed[key];
    if (!hit) return null;
    if (Date.now() - hit.updatedAt > LEADERBOARD_CACHE_TTL_MS) {
      return null;
    }
    leaderboardMemoryCache.set(key, { updatedAt: hit.updatedAt, value: hit.value });
    return hit.value;
  } catch (_error) {
    return null;
  }
}

function writeLeaderboardCache(key: string, value: LeaderboardResponse): void {
  const nextEntry = {
    updatedAt: Date.now(),
    value,
  };
  leaderboardMemoryCache.set(key, nextEntry);

  try {
    const raw = localStorage.getItem(LEADERBOARD_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CachedLeaderboardMap) : {};
    parsed[key] = nextEntry;

    const keys = Object.keys(parsed).slice(-24);
    const trimmed: CachedLeaderboardMap = {};
    for (const cacheKey of keys) {
      const entry = parsed[cacheKey];
      if (entry) {
        trimmed[cacheKey] = entry;
      }
    }

    localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify(trimmed));
  } catch (_error) {
    // Best effort cache only.
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        errorMessage = body.error;
      }
    } catch (_error) {
      // no-op
    }
    throw new ApiError(response.status, errorMessage);
  }
  return (await response.json()) as T;
}

function readScoreQueue(): QueuedScoreSubmission[] {
  try {
    const raw = localStorage.getItem(SCORE_QUEUE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as QueuedScoreSubmission[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof item.token === "string" &&
          item.payload &&
          typeof item.payload === "object",
      )
      .slice(-80)
      .map((item) => ({
        payload: item.payload,
        token: item.token,
        queuedAt: Number(item.queuedAt) || Date.now(),
        attempts: Number(item.attempts) || 0,
      }));
  } catch (_error) {
    return [];
  }
}

function writeScoreQueue(queue: QueuedScoreSubmission[]): void {
  try {
    localStorage.setItem(SCORE_QUEUE_KEY, JSON.stringify(queue.slice(-80)));
  } catch (_error) {
    // best effort queue only
  }
}

function enqueueScore(payload: ScoreSubmissionPayload, token: string): void {
  const queue = readScoreQueue();
  queue.push({
    payload,
    token,
    queuedAt: Date.now(),
    attempts: 0,
  });
  writeScoreQueue(queue);
}

async function postScoreNow(payload: ScoreSubmissionPayload, token: string): Promise<void> {
  const response = await fetch("/api/v1/leaderboard/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  await parseJson<{ ok: true }>(response);
}

function shouldQueueScore(error: unknown): boolean {
  if (!navigator.onLine) {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  if (error instanceof ApiError && error.status >= 500) {
    return true;
  }
  return false;
}

export async function flushQueuedScores(): Promise<void> {
  if (queueFlushInFlight) {
    return;
  }
  queueFlushInFlight = true;
  try {
    const queue = readScoreQueue();
    if (queue.length === 0) {
      return;
    }
    const nextQueue: QueuedScoreSubmission[] = [];
    for (const item of queue) {
      try {
        await postScoreNow(item.payload, item.token);
      } catch (error) {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          continue;
        }
        nextQueue.push({
          ...item,
          attempts: item.attempts + 1,
        });
      }
    }
    writeScoreQueue(nextQueue);
  } finally {
    queueFlushInFlight = false;
  }
}

export function installOfflineSyncHooks(): void {
  window.addEventListener("online", () => {
    void flushQueuedScores();
  });
}

export async function initSession(mode: Mode): Promise<SessionInitResponse> {
  const response = await fetch("/api/v1/session/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  return parseJson<SessionInitResponse>(response);
}

export async function submitScore(payload: ScoreSubmissionPayload, token: string): Promise<void> {
  try {
    await postScoreNow(payload, token);
  } catch (error) {
    if (shouldQueueScore(error)) {
      enqueueScore(payload, token);
      return;
    }
    throw error;
  }
}

export async function fetchLeaderboard(
  mode: Mode,
  limit = 15,
  certifiedOnly = false,
): Promise<LeaderboardResponse> {
  const key = leaderboardKey(`${mode}:${certifiedOnly}`, limit);
  const cached = readLeaderboardCache(key);
  if (cached) {
    return cached;
  }

  const query = new URLSearchParams({
    mode,
    limit: String(limit),
    certifiedOnly: String(certifiedOnly),
  });
  try {
    const response = await fetch(`/api/v1/leaderboard?${query.toString()}`);
    const payload = await parseJson<LeaderboardResponse>(response);
    writeLeaderboardCache(key, payload);
    return payload;
  } catch (error) {
    const stale = readLeaderboardCache(key);
    if (stale) {
      return stale;
    }
    throw error;
  }
}

export async function fetchDailyChallenge(): Promise<{
  challenge: DailyChallenge;
  season: SeasonWindow;
}> {
  const response = await fetch("/api/v1/challenge/daily");
  return parseJson<{ challenge: DailyChallenge; season: SeasonWindow }>(response);
}

export async function submitChallengeScore(
  payload: ChallengeSubmitPayload,
  token: string,
): Promise<{ points: number }> {
  const response = await fetch("/api/v1/challenge/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return parseJson<{ ok: true; points: number }>(response);
}

export async function fetchChallengeLeaderboard(
  date?: string,
  limit = 20,
): Promise<ChallengeLeaderboardResponse> {
  const query = new URLSearchParams();
  if (date) {
    query.set("date", date);
  }
  query.set("limit", String(limit));
  const response = await fetch(`/api/v1/challenge/leaderboard?${query.toString()}`);
  return parseJson<ChallengeLeaderboardResponse>(response);
}

export async function fetchCurrentSeason(): Promise<{ season: SeasonWindow; challengeDate: string }> {
  const response = await fetch("/api/v1/season/current");
  return parseJson<{ season: SeasonWindow; challengeDate: string }>(response);
}

export async function fetchSeasonLeaderboard(
  seasonId?: string,
  limit = 25,
): Promise<SeasonLeaderboardResponse> {
  const query = new URLSearchParams();
  if (seasonId) {
    query.set("seasonId", seasonId);
  }
  query.set("limit", String(limit));
  const response = await fetch(`/api/v1/season/leaderboard?${query.toString()}`);
  return parseJson<SeasonLeaderboardResponse>(response);
}

export async function createRaceRoom(mode: Mode, name: string): Promise<RaceRoomCreateResponse> {
  const response = await fetch("/api/v1/race/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, name }),
  });
  return parseJson<RaceRoomCreateResponse>(response);
}

export async function joinRaceRoom(roomId: string, name: string): Promise<RaceRoomCreateResponse> {
  const response = await fetch("/api/v1/race/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId: roomId.toUpperCase(), name }),
  });
  return parseJson<RaceRoomCreateResponse>(response);
}

export async function startRaceRoom(roomId: string, playerId: string): Promise<RaceRoomState> {
  const response = await fetch("/api/v1/race/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId: roomId.toUpperCase(), playerId }),
  });
  const payload = await parseJson<{ ok: true; room: RaceRoomState }>(response);
  return payload.room;
}

export async function updateRaceProgress(input: {
  roomId: string;
  playerId: string;
  progress: number;
  wpm: number;
  accuracy: number;
  finished: boolean;
}): Promise<void> {
  const response = await fetch("/api/v1/race/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomId: input.roomId.toUpperCase(),
      playerId: input.playerId,
      progress: input.progress,
      wpm: input.wpm,
      accuracy: input.accuracy,
      finished: input.finished,
    }),
  });
  await parseJson<{ ok: true }>(response);
}

export async function fetchRaceRoomState(roomId: string): Promise<RaceRoomState> {
  const query = new URLSearchParams({ roomId: roomId.toUpperCase() });
  const response = await fetch(`/api/v1/race/state?${query.toString()}`);
  const payload = await parseJson<{ room: RaceRoomState }>(response);
  return payload.room;
}

export async function createTournament(input: {
  mode: Mode;
  name: string;
  entrants: string[];
}): Promise<TournamentState> {
  const response = await fetch("/api/v1/tournament/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await parseJson<{ tournament: TournamentState }>(response);
  return payload.tournament;
}

export async function reportTournamentMatch(input: {
  tournamentId: string;
  matchId: string;
  winnerId: string;
}): Promise<TournamentState> {
  const response = await fetch("/api/v1/tournament/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await parseJson<{ tournament: TournamentState }>(response);
  return payload.tournament;
}

export async function fetchTournamentState(tournamentId: string): Promise<TournamentState> {
  const query = new URLSearchParams({ tournamentId });
  const response = await fetch(`/api/v1/tournament/state?${query.toString()}`);
  const payload = await parseJson<{ tournament: TournamentState }>(response);
  return payload.tournament;
}

function authHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function registerAccount(input: {
  handle: string;
  password: string;
  locale?: string;
  turnstileToken?: string;
}): Promise<{ token: string; account: AccountProfile }> {
  const response = await fetch("/api/v1/account/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<{ token: string; account: AccountProfile }>(response);
}

export async function loginAccount(input: {
  handle: string;
  password: string;
  turnstileToken?: string;
}): Promise<{ token: string; account: AccountProfile }> {
  const response = await fetch("/api/v1/account/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<{ token: string; account: AccountProfile }>(response);
}

export async function fetchAccountProfile(token: string): Promise<{
  account: AccountProfile;
  preferences: Record<string, unknown>;
}> {
  const response = await fetch("/api/v1/account/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson<{ account: AccountProfile; preferences: Record<string, unknown> }>(response);
}

export async function updateAccountPreferences(
  token: string,
  preferences: Record<string, unknown>,
): Promise<{ ok: true; preferences: Record<string, unknown> }> {
  const response = await fetch("/api/v1/account/preferences", {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ preferences }),
  });
  return parseJson<{ ok: true; preferences: Record<string, unknown> }>(response);
}

export async function changeAccountPassword(
  token: string,
  input: { currentPassword: string; newPassword: string },
): Promise<{ ok: true }> {
  const response = await fetch("/api/v1/account/password", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return parseJson<{ ok: true }>(response);
}

export async function fetchAccountSessions(
  token: string,
): Promise<{ currentSessionId: string; sessions: AccountSessionEntry[] }> {
  const response = await fetch("/api/v1/account/sessions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson<{ currentSessionId: string; sessions: AccountSessionEntry[] }>(response);
}

export async function revokeAccountSession(
  token: string,
  sessionId: string,
): Promise<{ ok: true; currentSessionRevoked: boolean }> {
  const response = await fetch(`/api/v1/account/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson<{ ok: true; currentSessionRevoked: boolean }>(response);
}

export async function logoutCurrentAccount(token: string): Promise<{ ok: true }> {
  const response = await fetch("/api/v1/account/logout", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
  return parseJson<{ ok: true }>(response);
}

export async function logoutOtherAccountSessions(token: string): Promise<{ ok: true }> {
  const response = await fetch("/api/v1/account/logout-others", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
  return parseJson<{ ok: true }>(response);
}

export async function exportAccountData(token: string): Promise<Record<string, unknown>> {
  const response = await fetch("/api/v1/account/export", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson<Record<string, unknown>>(response);
}

export async function deleteAccount(
  token: string,
  confirmHandle: string,
): Promise<{ ok: true; deleted: boolean }> {
  const response = await fetch("/api/v1/account", {
    method: "DELETE",
    headers: authHeaders(token),
    body: JSON.stringify({ confirmHandle }),
  });
  return parseJson<{ ok: true; deleted: boolean }>(response);
}

export async function requestFriend(token: string, handle: string): Promise<{
  ok: true;
  matched: boolean;
  requestId: string;
}> {
  const response = await fetch("/api/v1/friends/request", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ handle }),
  });
  return parseJson<{ ok: true; matched: boolean; requestId: string }>(response);
}

export async function respondFriend(
  token: string,
  requestId: string,
  accept: boolean,
): Promise<{ ok: true; status: "accepted" | "declined" }> {
  const response = await fetch("/api/v1/friends/respond", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ requestId, accept }),
  });
  return parseJson<{ ok: true; status: "accepted" | "declined" }>(response);
}

export async function fetchFriends(token: string): Promise<FriendListResponse> {
  const response = await fetch("/api/v1/friends/list", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson<FriendListResponse>(response);
}

export async function enqueueRanked(token: string): Promise<{
  status: "waiting" | "matched";
  queueSize?: number;
  duel?: DuelState;
}> {
  const response = await fetch("/api/v1/matchmaking/ranked/enqueue", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
  return parseJson<{ status: "waiting" | "matched"; queueSize?: number; duel?: DuelState }>(response);
}

export async function fetchRankedStatus(token: string): Promise<{
  status: "idle" | "waiting" | "matched";
  queuePosition?: number;
  queueSize?: number;
  duel?: DuelState;
}> {
  const response = await fetch("/api/v1/matchmaking/ranked/status", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson<{
    status: "idle" | "waiting" | "matched";
    queuePosition?: number;
    queueSize?: number;
    duel?: DuelState;
  }>(response);
}

export async function enqueueCasualDuel(token: string): Promise<{
  status: "waiting" | "matched";
  queueSize?: number;
  duel?: DuelState;
}> {
  const response = await fetch("/api/v1/duel/queue", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
  return parseJson<{ status: "waiting" | "matched"; queueSize?: number; duel?: DuelState }>(response);
}

export async function fetchDuelState(token: string, duelId?: string): Promise<{ duel: DuelState }> {
  const query = duelId ? `?duelId=${encodeURIComponent(duelId)}` : "";
  const response = await fetch(`/api/v1/duel/state${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson<{ duel: DuelState }>(response);
}

export async function updateDuelState(
  token: string,
  input: {
    duelId: string;
    progress: number;
    wpm: number;
    accuracy: number;
    finished: boolean;
  },
): Promise<{ ok: true; duel: DuelState }> {
  const response = await fetch("/api/v1/duel/update", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return parseJson<{ ok: true; duel: DuelState }>(response);
}

export async function shareReplay(input: {
  token?: string;
  mode: Mode;
  title: string;
  replay: Record<string, unknown>;
  isPublic: boolean;
}): Promise<{ id: string; url: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (input.token) {
    headers.Authorization = `Bearer ${input.token}`;
  }
  const response = await fetch("/api/v1/replay/share", {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: input.mode,
      title: input.title,
      replay: input.replay,
      isPublic: input.isPublic,
    }),
  });
  return parseJson<{ id: string; url: string }>(response);
}

export async function fetchSharedReplay(id: string): Promise<ReplaySharePayload> {
  const response = await fetch(`/api/v1/replay/share/${encodeURIComponent(id)}`);
  return parseJson<ReplaySharePayload>(response);
}

export async function listReplayShares(input: {
  mine?: boolean;
  token?: string;
}): Promise<{ entries: ReplayShareEntry[] }> {
  const query = new URLSearchParams();
  if (input.mine) {
    query.set("mine", "true");
  }
  const init: RequestInit = input.token
    ? { headers: { Authorization: `Bearer ${input.token}` } }
    : {};
  const response = await fetch(`/api/v1/replay/share?${query.toString()}`, init);
  return parseJson<{ entries: ReplayShareEntry[] }>(response);
}

export async function createWebhook(
  token: string,
  targetUrl: string,
  events: string[],
): Promise<WebhookEndpoint> {
  const response = await fetch("/api/v1/webhooks/register", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ targetUrl, events }),
  });
  return parseJson<WebhookEndpoint>(response);
}

export async function listWebhooks(token: string): Promise<{ entries: WebhookEndpoint[] }> {
  const response = await fetch("/api/v1/webhooks/list", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson<{ entries: WebhookEndpoint[] }>(response);
}

export async function deleteWebhook(token: string, webhookId: string): Promise<{ ok: true }> {
  const response = await fetch(`/api/v1/webhooks/${encodeURIComponent(webhookId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson<{ ok: true }>(response);
}

export async function testWebhook(token: string, webhookId: string): Promise<{ ok: true }> {
  const response = await fetch(`/api/v1/webhooks/test/${encodeURIComponent(webhookId)}`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
  return parseJson<{ ok: true }>(response);
}

export function sendPrivacyAnalytics(payload: PrivacyAnalyticsPayload): void {
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/v1/privacy/analytics", blob);
    return;
  }
  void fetch("/api/v1/privacy/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // intentionally ignored
  });
}

export async function fetchAnalyticsSummary(input: {
  token?: string;
  days?: number;
}): Promise<AnalyticsSummaryResponse> {
  const query = new URLSearchParams();
  query.set("days", String(input.days ?? 14));
  const headers: Record<string, string> = {};
  if (input.token) {
    headers["X-Metrics-Token"] = input.token;
  }
  const response = await fetch(`/api/v1/privacy/analytics/summary?${query.toString()}`, {
    headers,
  });
  return parseJson<AnalyticsSummaryResponse>(response);
}

export async function fetchAdminUsers(
  token: string,
  input: { query?: string; limit?: number } = {},
): Promise<AdminUsersResponse> {
  const query = new URLSearchParams();
  if (input.query?.trim()) {
    query.set("query", input.query.trim());
  }
  query.set("limit", String(input.limit ?? 30));
  const response = await fetch(`/api/v1/admin/users?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson<AdminUsersResponse>(response);
}

export async function deleteAdminUser(
  token: string,
  accountId: string,
  confirmHandle: string,
): Promise<{ ok: true; deleted: true }> {
  const response = await fetch(`/api/v1/admin/users/${encodeURIComponent(accountId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
    body: JSON.stringify({ confirmHandle }),
  });
  return parseJson<{ ok: true; deleted: true }>(response);
}

export async function fetchAdminLeaderboard(
  token: string,
  input: { query?: string; mode?: Mode | "all"; limit?: number } = {},
): Promise<AdminLeaderboardResponse> {
  const query = new URLSearchParams();
  if (input.query?.trim()) {
    query.set("query", input.query.trim());
  }
  query.set("mode", input.mode ?? "all");
  query.set("limit", String(input.limit ?? 50));
  const response = await fetch(`/api/v1/admin/leaderboard?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson<AdminLeaderboardResponse>(response);
}

export async function deleteAdminLeaderboardScore(
  token: string,
  scoreId: string,
): Promise<{ ok: true; deleted: true }> {
  const response = await fetch(`/api/v1/admin/leaderboard/${encodeURIComponent(scoreId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson<{ ok: true; deleted: true }>(response);
}
