import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { isDatabaseOnline } from "../db/state.js";
import { displayNameMeetsPolicy, normalizeDisplayName } from "../lib/security.js";
import { modeSchema } from "../types.js";

type RaceStatus = "lobby" | "running" | "finished";

interface RacePlayer {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  finished: boolean;
  finishedAt: number | null;
  lastSeenAt: number;
}

interface RaceRoom {
  id: string;
  mode: z.infer<typeof modeSchema>;
  createdAt: number;
  startedAt: number | null;
  hostPlayerId: string;
  status: RaceStatus;
  players: Map<string, RacePlayer>;
}

interface SerializedRaceRoom {
  roomId: string;
  mode: z.infer<typeof modeSchema>;
  status: RaceStatus;
  startedAt: number | null;
  hostPlayerId: string;
  players: Array<{
    id: string;
    name: string;
    progress: number;
    wpm: number;
    accuracy: number;
    finished: boolean;
    finishedAt: number | null;
  }>;
}

interface TournamentPlayer {
  id: string;
  name: string;
}

interface TournamentMatch {
  id: string;
  round: number;
  index: number;
  playerAId: string | null;
  playerBId: string | null;
  winnerId: string | null;
}

interface TournamentState {
  id: string;
  name: string;
  mode: z.infer<typeof modeSchema>;
  createdAt: number;
  status: "live" | "finished";
  players: TournamentPlayer[];
  matches: TournamentMatch[];
}

const MAX_RACE_ROOM_AGE_MS = 1000 * 60 * 60 * 2;
const PLAYER_TIMEOUT_MS = 1000 * 60 * 5;

const raceRooms = new Map<string, RaceRoom>();
const tournaments = new Map<string, TournamentState>();

const raceCreateSchema = z.object({
  mode: modeSchema,
  name: z.string().trim().min(2).max(24).refine((value) => displayNameMeetsPolicy(value, 24)),
});

const raceJoinSchema = z.object({
  roomId: z.string().trim().min(6).max(24),
  name: z.string().trim().min(2).max(24).refine((value) => displayNameMeetsPolicy(value, 24)),
});

const raceStateQuerySchema = z.object({
  roomId: z.string().trim().min(6).max(24),
});

const raceStartSchema = z.object({
  roomId: z.string().trim().min(6).max(24),
  playerId: z.string().uuid(),
});

const raceUpdateSchema = z.object({
  roomId: z.string().trim().min(6).max(24),
  playerId: z.string().uuid(),
  progress: z.number().finite().min(0).max(100),
  wpm: z.number().finite().min(0).max(400),
  accuracy: z.number().finite().min(0).max(100),
  finished: z.boolean().default(false),
});

const tournamentCreateSchema = z.object({
  mode: modeSchema,
  name: z.string().trim().min(2).max(48).refine((value) => displayNameMeetsPolicy(value, 48)),
  entrants: z
    .array(z.string().trim().min(2).max(24).refine((value) => displayNameMeetsPolicy(value, 24)))
    .min(2)
    .max(32),
});

const tournamentReportSchema = z.object({
  tournamentId: z.string().uuid(),
  matchId: z.string().uuid(),
  winnerId: z.string().uuid(),
});

const tournamentStateQuerySchema = z.object({
  tournamentId: z.string().uuid(),
});

function normalizeName(raw: string): string {
  return normalizeDisplayName(raw);
}

function serializeRoom(room: RaceRoom): SerializedRaceRoom {
  const players = [...room.players.values()]
    .map((player) => ({
      id: player.id,
      name: player.name,
      progress: Number(player.progress.toFixed(2)),
      wpm: Number(player.wpm.toFixed(1)),
      accuracy: Number(player.accuracy.toFixed(1)),
      finished: player.finished,
      finishedAt: player.finishedAt,
    }))
    .sort((a, b) => {
      if (a.finished !== b.finished) {
        return a.finished ? -1 : 1;
      }
      if (b.progress !== a.progress) {
        return b.progress - a.progress;
      }
      return b.wpm - a.wpm;
    });

  return {
    roomId: room.id,
    mode: room.mode,
    status: room.status,
    startedAt: room.startedAt,
    hostPlayerId: room.hostPlayerId,
    players,
  };
}

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function createBracket(players: TournamentPlayer[]): TournamentMatch[] {
  const participantCount = players.length;
  let bracketSize = 1;
  while (bracketSize < participantCount) {
    bracketSize *= 2;
  }

  const seeded: Array<TournamentPlayer | null> = [...players];
  while (seeded.length < bracketSize) {
    seeded.push(null);
  }

  const rounds = Math.log2(bracketSize);
  const matches: TournamentMatch[] = [];

  for (let round = 1; round <= rounds; round += 1) {
    const matchCount = bracketSize / 2 ** round;
    for (let index = 0; index < matchCount; index += 1) {
      let playerAId: string | null = null;
      let playerBId: string | null = null;
      if (round === 1) {
        playerAId = seeded[index * 2]?.id ?? null;
        playerBId = seeded[index * 2 + 1]?.id ?? null;
      }
      matches.push({
        id: randomUUID(),
        round,
        index,
        playerAId,
        playerBId,
        winnerId: null,
      });
    }
  }

  return matches;
}

function recomputeTournament(tournament: TournamentState): void {
  const maxRound = Math.max(...tournament.matches.map((match) => match.round));

  for (const match of tournament.matches) {
    if (match.round === 1 && !match.winnerId) {
      if (match.playerAId && !match.playerBId) {
        match.winnerId = match.playerAId;
      } else if (!match.playerAId && match.playerBId) {
        match.winnerId = match.playerBId;
      }
    }
  }

  for (let round = 2; round <= maxRound; round += 1) {
    const previous = tournament.matches
      .filter((match) => match.round === round - 1)
      .sort((a, b) => a.index - b.index);
    const current = tournament.matches
      .filter((match) => match.round === round)
      .sort((a, b) => a.index - b.index);

    for (const match of current) {
      const sourceA = previous[match.index * 2];
      const sourceB = previous[match.index * 2 + 1];
      match.playerAId = sourceA?.winnerId ?? null;
      match.playerBId = sourceB?.winnerId ?? null;
      if (match.winnerId && match.winnerId !== match.playerAId && match.winnerId !== match.playerBId) {
        match.winnerId = null;
      }
      if (!match.winnerId) {
        if (match.playerAId && !match.playerBId) {
          match.winnerId = match.playerAId;
        } else if (!match.playerAId && match.playerBId) {
          match.winnerId = match.playerBId;
        }
      }
    }
  }

  const finalMatch = tournament.matches.find((match) => match.round === maxRound && match.index === 0);
  tournament.status = finalMatch?.winnerId ? "finished" : "live";
}

function serializeTournament(tournament: TournamentState) {
  return {
    id: tournament.id,
    name: tournament.name,
    mode: tournament.mode,
    status: tournament.status,
    createdAt: tournament.createdAt,
    players: tournament.players,
    matches: tournament.matches.map((match) => ({
      id: match.id,
      round: match.round,
      index: match.index,
      playerAId: match.playerAId,
      playerBId: match.playerBId,
      winnerId: match.winnerId,
    })),
  };
}

function cleanupRaceRoomsInMemory(now = Date.now()): void {
  for (const [roomId, room] of raceRooms.entries()) {
    if (now - room.createdAt > MAX_RACE_ROOM_AGE_MS) {
      raceRooms.delete(roomId);
      continue;
    }
    for (const [playerId, player] of room.players.entries()) {
      if (now - player.lastSeenAt > PLAYER_TIMEOUT_MS) {
        room.players.delete(playerId);
      }
    }
    if (room.players.size === 0) {
      raceRooms.delete(roomId);
      continue;
    }
    if (!room.players.has(room.hostPlayerId)) {
      const nextHost = room.players.values().next().value as RacePlayer | undefined;
      if (nextHost) {
        room.hostPlayerId = nextHost.id;
      }
    }
  }
}

async function cleanupRaceRoomsInDatabase(): Promise<void> {
  await pool.query(
    `DELETE FROM race_players
      WHERE last_seen_at < NOW() - ($1 * INTERVAL '1 millisecond')`,
    [PLAYER_TIMEOUT_MS],
  );

  await pool.query(
    `UPDATE race_rooms rr
        SET host_player_id = next_host.id
       FROM LATERAL (
         SELECT rp.id
           FROM race_players rp
          WHERE rp.room_id = rr.id
          ORDER BY rp.created_at ASC
          LIMIT 1
       ) AS next_host
      WHERE NOT EXISTS (
        SELECT 1
          FROM race_players hp
         WHERE hp.room_id = rr.id
           AND hp.id = rr.host_player_id
      )`,
  );

  await pool.query(
    `DELETE FROM race_rooms rr
      WHERE rr.created_at < NOW() - ($1 * INTERVAL '1 millisecond')
         OR NOT EXISTS (
           SELECT 1
             FROM race_players rp
            WHERE rp.room_id = rr.id
         )`,
    [MAX_RACE_ROOM_AGE_MS],
  );
}

async function loadRaceRoomFromDatabase(roomId: string): Promise<SerializedRaceRoom | null> {
  const roomResult = await pool.query(
    `SELECT id, mode, status, host_player_id, EXTRACT(EPOCH FROM started_at) * 1000 AS started_at_ms
       FROM race_rooms
      WHERE id = $1`,
    [roomId],
  );
  if (roomResult.rowCount !== 1) {
    return null;
  }
  const roomRow = roomResult.rows[0] as {
    id: string;
    mode: z.infer<typeof modeSchema>;
    status: RaceStatus;
    host_player_id: string;
    started_at_ms: number | null;
  };

  const playersResult = await pool.query(
    `SELECT id, name, progress, wpm, accuracy, finished,
            EXTRACT(EPOCH FROM finished_at) * 1000 AS finished_at_ms
       FROM race_players
      WHERE room_id = $1
      ORDER BY created_at ASC`,
    [roomId],
  );

  const players = playersResult.rows
    .map((row) => ({
      id: row.id as string,
      name: row.name as string,
      progress: Number(row.progress),
      wpm: Number(row.wpm),
      accuracy: Number(row.accuracy),
      finished: Boolean(row.finished),
      finishedAt: row.finished_at_ms == null ? null : Math.round(Number(row.finished_at_ms)),
    }))
    .sort((a, b) => {
      if (a.finished !== b.finished) {
        return a.finished ? -1 : 1;
      }
      if (b.progress !== a.progress) {
        return b.progress - a.progress;
      }
      return b.wpm - a.wpm;
    });

  return {
    roomId: roomRow.id,
    mode: roomRow.mode,
    status: roomRow.status,
    startedAt: roomRow.started_at_ms == null ? null : Math.round(Number(roomRow.started_at_ms)),
    hostPlayerId: roomRow.host_player_id,
    players,
  };
}

async function loadTournamentFromDatabase(tournamentId: string): Promise<TournamentState | null> {
  const tournamentResult = await pool.query(
    `SELECT id, name, mode, status, EXTRACT(EPOCH FROM created_at) * 1000 AS created_at_ms
       FROM tournaments
      WHERE id = $1`,
    [tournamentId],
  );
  if (tournamentResult.rowCount !== 1) {
    return null;
  }

  const tournamentRow = tournamentResult.rows[0] as {
    id: string;
    name: string;
    mode: z.infer<typeof modeSchema>;
    status: "live" | "finished";
    created_at_ms: number;
  };

  const playersResult = await pool.query(
    `SELECT id, name
       FROM tournament_players
      WHERE tournament_id = $1
      ORDER BY created_at ASC`,
    [tournamentId],
  );

  const matchesResult = await pool.query(
    `SELECT id, round, match_index, player_a_id, player_b_id, winner_id
       FROM tournament_matches
      WHERE tournament_id = $1
      ORDER BY round ASC, match_index ASC`,
    [tournamentId],
  );

  const state: TournamentState = {
    id: tournamentRow.id,
    name: tournamentRow.name,
    mode: tournamentRow.mode,
    status: tournamentRow.status,
    createdAt: Math.round(Number(tournamentRow.created_at_ms)),
    players: playersResult.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
    })),
    matches: matchesResult.rows.map((row) => ({
      id: row.id as string,
      round: Number(row.round),
      index: Number(row.match_index),
      playerAId: (row.player_a_id as string | null) ?? null,
      playerBId: (row.player_b_id as string | null) ?? null,
      winnerId: (row.winner_id as string | null) ?? null,
    })),
  };

  return state;
}

async function saveTournamentToDatabase(tournament: TournamentState): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE tournaments SET status = $2 WHERE id = $1`, [tournament.id, tournament.status]);
    for (const match of tournament.matches) {
      await client.query(
        `UPDATE tournament_matches
            SET player_a_id = $2,
                player_b_id = $3,
                winner_id = $4
          WHERE id = $1`,
        [match.id, match.playerAId, match.playerBId, match.winnerId],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

const router = Router();

router.post("/race/create", async (req, res, next) => {
  try {
    const parsed = raceCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid race creation payload" });
    }
    const name = normalizeName(parsed.data.name);

    if (!isDatabaseOnline()) {
      cleanupRaceRoomsInMemory();

      let roomId = generateRoomCode();
      while (raceRooms.has(roomId)) {
        roomId = generateRoomCode();
      }
      const playerId = randomUUID();
      const now = Date.now();
      const room: RaceRoom = {
        id: roomId,
        mode: parsed.data.mode,
        createdAt: now,
        startedAt: null,
        hostPlayerId: playerId,
        status: "lobby",
        players: new Map<string, RacePlayer>(),
      };

      room.players.set(playerId, {
        id: playerId,
        name,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
        finishedAt: null,
        lastSeenAt: now,
      });
      raceRooms.set(roomId, room);

      return res.status(201).json({ roomId, playerId, room: serializeRoom(room) });
    }

    await cleanupRaceRoomsInDatabase();
    const playerId = randomUUID();
    let createdRoomId: string | null = null;
    for (let attempt = 0; attempt < 12 && !createdRoomId; attempt += 1) {
      const roomId = generateRoomCode();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO race_rooms (id, mode, status, host_player_id)
           VALUES ($1, $2, 'lobby', $3)`,
          [roomId, parsed.data.mode, playerId],
        );
        await client.query(
          `INSERT INTO race_players (id, room_id, name, progress, wpm, accuracy, finished, last_seen_at)
           VALUES ($1, $2, $3, 0, 0, 100, FALSE, NOW())`,
          [playerId, roomId, name],
        );
        await client.query("COMMIT");
        createdRoomId = roomId;
      } catch (error) {
        await client.query("ROLLBACK");
        if ((error as { code?: string }).code === "23505") {
          continue;
        }
        throw error;
      } finally {
        client.release();
      }
    }
    if (!createdRoomId) {
      return res.status(503).json({ error: "Failed to allocate race room code" });
    }
    const room = await loadRaceRoomFromDatabase(createdRoomId);
    if (!room) {
      return res.status(500).json({ error: "Failed to load race room" });
    }
    return res.status(201).json({ roomId: createdRoomId, playerId, room });
  } catch (error) {
    return next(error);
  }
});

router.post("/race/join", async (req, res, next) => {
  try {
    const parsed = raceJoinSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid race join payload" });
    }
    const roomId = parsed.data.roomId.toUpperCase();
    const name = normalizeName(parsed.data.name);

    if (!isDatabaseOnline()) {
      cleanupRaceRoomsInMemory();
      const room = raceRooms.get(roomId);
      if (!room) {
        return res.status(404).json({ error: "Race room not found" });
      }
      if (room.players.size >= 8) {
        return res.status(409).json({ error: "Race room is full" });
      }
      const playerId = randomUUID();
      room.players.set(playerId, {
        id: playerId,
        name,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
        finishedAt: null,
        lastSeenAt: Date.now(),
      });
      return res.status(201).json({ roomId: room.id, playerId, room: serializeRoom(room) });
    }

    await cleanupRaceRoomsInDatabase();
    const playerId = randomUUID();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const roomCheckResult = await client.query(
        `SELECT id
           FROM race_rooms
          WHERE id = $1
          FOR UPDATE`,
        [roomId],
      );
      if (roomCheckResult.rowCount !== 1) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Race room not found" });
      }

      const playerCountResult = await client.query(
        `SELECT COUNT(*)::int AS count
           FROM race_players
          WHERE room_id = $1`,
        [roomId],
      );
      const playerCount = Number(playerCountResult.rows[0]?.count ?? 0);
      if (playerCount >= 8) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Race room is full" });
      }

      await client.query(
        `INSERT INTO race_players (id, room_id, name, progress, wpm, accuracy, finished, last_seen_at)
         VALUES ($1, $2, $3, 0, 0, 100, FALSE, NOW())`,
        [playerId, roomId, name],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    const room = await loadRaceRoomFromDatabase(roomId);
    if (!room) {
      return res.status(500).json({ error: "Failed to load race room" });
    }
    return res.status(201).json({ roomId, playerId, room });
  } catch (error) {
    return next(error);
  }
});

router.post("/race/start", async (req, res, next) => {
  try {
    const parsed = raceStartSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid race start payload" });
    }
    const roomId = parsed.data.roomId.toUpperCase();

    if (!isDatabaseOnline()) {
      cleanupRaceRoomsInMemory();
      const room = raceRooms.get(roomId);
      if (!room) {
        return res.status(404).json({ error: "Race room not found" });
      }
      if (room.hostPlayerId !== parsed.data.playerId) {
        return res.status(403).json({ error: "Only the host can start the race" });
      }
      room.status = "running";
      room.startedAt = Date.now();
      for (const player of room.players.values()) {
        player.progress = 0;
        player.wpm = 0;
        player.accuracy = 100;
        player.finished = false;
        player.finishedAt = null;
        player.lastSeenAt = Date.now();
      }
      return res.json({ ok: true, room: serializeRoom(room) });
    }

    await cleanupRaceRoomsInDatabase();
    const roomResult = await pool.query(
      `SELECT host_player_id
         FROM race_rooms
        WHERE id = $1`,
      [roomId],
    );
    if (roomResult.rowCount !== 1) {
      return res.status(404).json({ error: "Race room not found" });
    }
    const hostPlayerId = roomResult.rows[0]?.host_player_id as string;
    if (hostPlayerId !== parsed.data.playerId) {
      return res.status(403).json({ error: "Only the host can start the race" });
    }

    await pool.query(
      `UPDATE race_rooms
          SET status = 'running',
              started_at = NOW()
        WHERE id = $1`,
      [roomId],
    );
    await pool.query(
      `UPDATE race_players
          SET progress = 0,
              wpm = 0,
              accuracy = 100,
              finished = FALSE,
              finished_at = NULL,
              last_seen_at = NOW()
        WHERE room_id = $1`,
      [roomId],
    );
    const room = await loadRaceRoomFromDatabase(roomId);
    if (!room) {
      return res.status(500).json({ error: "Failed to load race room" });
    }
    return res.json({ ok: true, room });
  } catch (error) {
    return next(error);
  }
});

router.post("/race/update", async (req, res, next) => {
  try {
    const parsed = raceUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid race update payload" });
    }
    const roomId = parsed.data.roomId.toUpperCase();

    if (!isDatabaseOnline()) {
      cleanupRaceRoomsInMemory();
      const room = raceRooms.get(roomId);
      if (!room) {
        return res.status(404).json({ error: "Race room not found" });
      }
      const player = room.players.get(parsed.data.playerId);
      if (!player) {
        return res.status(404).json({ error: "Player not found in race room" });
      }
      player.progress = parsed.data.progress;
      player.wpm = parsed.data.wpm;
      player.accuracy = parsed.data.accuracy;
      player.lastSeenAt = Date.now();
      if (parsed.data.finished && !player.finished) {
        player.finished = true;
        player.finishedAt = Date.now();
      }
      if (room.status === "running" && [...room.players.values()].every((member) => member.finished)) {
        room.status = "finished";
      }
      return res.json({ ok: true });
    }

    await cleanupRaceRoomsInDatabase();
    const roomResult = await pool.query(
      `SELECT id, status
         FROM race_rooms
        WHERE id = $1`,
      [roomId],
    );
    if (roomResult.rowCount !== 1) {
      return res.status(404).json({ error: "Race room not found" });
    }

    const updateResult = await pool.query(
      `UPDATE race_players
          SET progress = $3,
              wpm = $4,
              accuracy = $5,
              finished = CASE WHEN $6 THEN TRUE ELSE finished END,
              finished_at = CASE WHEN $6 AND NOT finished THEN NOW() ELSE finished_at END,
              last_seen_at = NOW()
        WHERE room_id = $1
          AND id = $2`,
      [
        roomId,
        parsed.data.playerId,
        parsed.data.progress,
        parsed.data.wpm,
        parsed.data.accuracy,
        parsed.data.finished,
      ],
    );
    if (updateResult.rowCount !== 1) {
      return res.status(404).json({ error: "Player not found in race room" });
    }

    const finishedResult = await pool.query(
      `SELECT BOOL_AND(finished) AS all_finished
         FROM race_players
        WHERE room_id = $1`,
      [roomId],
    );
    const allFinished = Boolean(finishedResult.rows[0]?.all_finished);
    if (allFinished) {
      await pool.query(
        `UPDATE race_rooms
            SET status = 'finished'
          WHERE id = $1
            AND status = 'running'`,
        [roomId],
      );
    }
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/race/state", async (req, res, next) => {
  try {
    const parsed = raceStateQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid race room query" });
    }
    const roomId = parsed.data.roomId.toUpperCase();

    if (!isDatabaseOnline()) {
      cleanupRaceRoomsInMemory();
      const room = raceRooms.get(roomId);
      if (!room) {
        return res.status(404).json({ error: "Race room not found" });
      }
      return res.json({ room: serializeRoom(room) });
    }

    await cleanupRaceRoomsInDatabase();
    const room = await loadRaceRoomFromDatabase(roomId);
    if (!room) {
      return res.status(404).json({ error: "Race room not found" });
    }
    return res.json({ room });
  } catch (error) {
    return next(error);
  }
});

router.post("/tournament/create", async (req, res, next) => {
  try {
    const parsed = tournamentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid tournament payload" });
    }

    const players = [...new Set(parsed.data.entrants.map(normalizeName))]
      .slice(0, 32)
      .map((name) => ({ id: randomUUID(), name }));
    if (players.length < 2) {
      return res.status(422).json({ error: "At least two unique entrants are required" });
    }

    const tournament: TournamentState = {
      id: randomUUID(),
      name: parsed.data.name,
      mode: parsed.data.mode,
      createdAt: Date.now(),
      status: "live",
      players,
      matches: createBracket(players),
    };
    recomputeTournament(tournament);

    if (!isDatabaseOnline()) {
      tournaments.set(tournament.id, tournament);
      return res.status(201).json({ tournament: serializeTournament(tournament) });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO tournaments (id, name, mode, status, created_at)
         VALUES ($1, $2, $3, $4, TO_TIMESTAMP($5 / 1000.0))`,
        [tournament.id, tournament.name, tournament.mode, tournament.status, tournament.createdAt],
      );
      for (const player of tournament.players) {
        await client.query(
          `INSERT INTO tournament_players (id, tournament_id, name)
           VALUES ($1, $2, $3)`,
          [player.id, tournament.id, player.name],
        );
      }
      for (const match of tournament.matches) {
        await client.query(
          `INSERT INTO tournament_matches
           (id, tournament_id, round, match_index, player_a_id, player_b_id, winner_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            match.id,
            tournament.id,
            match.round,
            match.index,
            match.playerAId,
            match.playerBId,
            match.winnerId,
          ],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const persisted = await loadTournamentFromDatabase(tournament.id);
    if (!persisted) {
      return res.status(500).json({ error: "Failed to load tournament" });
    }
    return res.status(201).json({ tournament: serializeTournament(persisted) });
  } catch (error) {
    return next(error);
  }
});

router.post("/tournament/report", async (req, res, next) => {
  try {
    const parsed = tournamentReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid tournament report payload" });
    }

    if (!isDatabaseOnline()) {
      const tournament = tournaments.get(parsed.data.tournamentId);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      const match = tournament.matches.find((item) => item.id === parsed.data.matchId);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }
      if (parsed.data.winnerId !== match.playerAId && parsed.data.winnerId !== match.playerBId) {
        return res.status(422).json({ error: "Winner must belong to the selected match" });
      }
      match.winnerId = parsed.data.winnerId;
      recomputeTournament(tournament);
      return res.json({ tournament: serializeTournament(tournament) });
    }

    const tournament = await loadTournamentFromDatabase(parsed.data.tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    const match = tournament.matches.find((item) => item.id === parsed.data.matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }
    if (parsed.data.winnerId !== match.playerAId && parsed.data.winnerId !== match.playerBId) {
      return res.status(422).json({ error: "Winner must belong to the selected match" });
    }

    match.winnerId = parsed.data.winnerId;
    recomputeTournament(tournament);
    await saveTournamentToDatabase(tournament);
    return res.json({ tournament: serializeTournament(tournament) });
  } catch (error) {
    return next(error);
  }
});

router.get("/tournament/state", async (req, res, next) => {
  try {
    const parsed = tournamentStateQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid tournament query" });
    }

    if (!isDatabaseOnline()) {
      const tournament = tournaments.get(parsed.data.tournamentId);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      return res.json({ tournament: serializeTournament(tournament) });
    }

    const tournament = await loadTournamentFromDatabase(parsed.data.tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    return res.json({ tournament: serializeTournament(tournament) });
  } catch (error) {
    return next(error);
  }
});

export { router as liveRouter };
