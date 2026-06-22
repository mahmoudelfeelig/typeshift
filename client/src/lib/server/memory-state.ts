import type { Mode } from "./types";

export interface MemoryGameplaySession {
  id: string;
  mode: Mode;
  ipHash: string;
  userAgentHash: string;
  createdAtMs: number;
  expiresAtMs: number;
  consumedAtMs: number | null;
}

export interface MemoryAccount {
  id: string;
  handle: string;
  handleNormalized: string;
  passwordHash: string;
  passwordSalt: string;
  rating: number;
  locale: string;
  verifiedRuns: number;
  createdAtMs: number;
  updatedAtMs: number;
  deletedAtMs: number | null;
}

export interface MemoryAccountSession {
  id: string;
  accountId: string;
  label: string;
  userAgentHash: string;
  ipHash: string;
  createdAtMs: number;
  lastSeenAtMs: number;
  expiresAtMs: number;
  revokedAtMs: number | null;
}

export interface MemoryLeaderboardScore {
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
  clientVersion: string | null;
  telemetry: Record<string, unknown> | null;
  createdAtMs: number;
}

export interface MemoryChallengeScore {
  id: string;
  sessionId: string;
  accountId: string | null;
  challengeDate: string;
  seasonId: string;
  username: string;
  mode: Mode;
  points: number;
  wpm: number;
  raw: number;
  accuracy: number;
  errors: number;
  streak: number;
  durationMs: number;
  createdAtMs: number;
}

export interface MemoryReplayShare {
  id: string;
  accountId: string | null;
  mode: Mode;
  title: string;
  replay: Record<string, unknown>;
  isPublic: boolean;
  createdAtMs: number;
}

export interface MemoryAnalyticsAggregate {
  dimensionKey: string;
  dateKey: string;
  eventName: string;
  page: string | null;
  mode: Mode | null;
  theme: "dark" | "light" | null;
  viewportBucket: "sm" | "md" | "lg" | "xl" | null;
  reducedMotion: boolean | null;
  consentVersion: number | null;
  count: number;
  lastSeenAtMs: number;
}

export interface MemoryFriendRequest {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  status: "pending" | "accepted" | "declined";
  createdAtMs: number;
  respondedAtMs: number | null;
}

export interface MemoryRacePlayer {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  finished: boolean;
  finishedAtMs: number | null;
  lastSeenAtMs: number;
}

export interface MemoryRaceRoom {
  id: string;
  mode: Mode;
  status: "lobby" | "running" | "finished";
  createdAtMs: number;
  startedAtMs: number | null;
  hostPlayerId: string;
  players: Map<string, MemoryRacePlayer>;
}

export interface MemoryTournamentPlayer {
  id: string;
  name: string;
}

export interface MemoryTournamentMatch {
  id: string;
  round: number;
  index: number;
  playerAId: string | null;
  playerBId: string | null;
  winnerId: string | null;
}

export interface MemoryTournament {
  id: string;
  name: string;
  mode: Mode;
  status: "live" | "finished";
  createdAtMs: number;
  players: MemoryTournamentPlayer[];
  matches: MemoryTournamentMatch[];
}

export interface MemoryQueueEntry {
  accountId: string;
  handle: string;
  rating: number;
  queuedAtMs: number;
}

export interface MemoryDuel {
  id: string;
  kind: "ranked" | "casual";
  status: "running" | "finished";
  createdAtMs: number;
  updatedAtMs: number;
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

export interface MemoryWebhook {
  id: string;
  accountId: string;
  targetUrl: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAtMs: number;
}

export interface MemoryState {
  gameplaySessions: Map<string, MemoryGameplaySession>;
  accountsById: Map<string, MemoryAccount>;
  accountsByHandle: Map<string, MemoryAccount>;
  preferences: Map<string, Record<string, unknown>>;
  accountSessions: Map<string, MemoryAccountSession>;
  leaderboardScores: MemoryLeaderboardScore[];
  challengeScores: MemoryChallengeScore[];
  replayShares: Map<string, MemoryReplayShare>;
  analytics: Map<string, MemoryAnalyticsAggregate>;
  friendRequests: Map<string, MemoryFriendRequest>;
  raceRooms: Map<string, MemoryRaceRoom>;
  tournaments: Map<string, MemoryTournament>;
  rankedQueue: MemoryQueueEntry[];
  casualQueue: MemoryQueueEntry[];
  activeDuels: Map<string, MemoryDuel>;
  accountToDuel: Map<string, string>;
  webhooks: Map<string, MemoryWebhook>;
}

declare global {
  // eslint-disable-next-line no-var
  var __typeshiftMemoryState: MemoryState | undefined;
}

function createMemoryState(): MemoryState {
  return {
    gameplaySessions: new Map(),
    accountsById: new Map(),
    accountsByHandle: new Map(),
    preferences: new Map(),
    accountSessions: new Map(),
    leaderboardScores: [],
    challengeScores: [],
    replayShares: new Map(),
    analytics: new Map(),
    friendRequests: new Map(),
    raceRooms: new Map(),
    tournaments: new Map(),
    rankedQueue: [],
    casualQueue: [],
    activeDuels: new Map(),
    accountToDuel: new Map(),
    webhooks: new Map(),
  };
}

export function getMemoryState(): MemoryState {
  globalThis.__typeshiftMemoryState ??= createMemoryState();
  return globalThis.__typeshiftMemoryState;
}

export function resetMemoryState(): void {
  globalThis.__typeshiftMemoryState = createMemoryState();
}
