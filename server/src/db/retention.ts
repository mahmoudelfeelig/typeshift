import type pino from "pino";
import { config } from "../config.js";
import { migrateDatabase } from "./migrate.js";
import { isDatabaseOnline, setDatabaseOnline } from "./state.js";
import { pool } from "./pool.js";

const RETENTION_INTERVAL_MS = 1000 * 60 * 30;
const DB_CHECK_INTERVAL_MS = 1000 * 15;
let workerId: NodeJS.Timeout | null = null;
let lastRetentionAtMs = 0;

async function ensureDatabaseReady(logger: pino.Logger): Promise<boolean> {
  const wasOnline = isDatabaseOnline();
  try {
    await pool.query("SELECT 1");
    // Safe to run repeatedly and ensures tables exist if DB comes back after startup fallback.
    await migrateDatabase();
    setDatabaseOnline(true);
    if (!wasOnline) {
      logger.info("Database connectivity restored; switched API persistence to Postgres");
    }
    return true;
  } catch (error) {
    setDatabaseOnline(false);
    if (wasOnline) {
      logger.warn({ err: error }, "Database became unavailable; API remains in in-memory fallback mode");
    } else {
      logger.debug({ err: error }, "Database still unavailable");
    }
    return false;
  }
}

async function runRetentionPass(logger: pino.Logger): Promise<void> {
  const ready = await ensureDatabaseReady(logger);
  if (!ready) {
    return;
  }

  const now = Date.now();
  if (lastRetentionAtMs > 0 && now - lastRetentionAtMs < RETENTION_INTERVAL_MS) {
    return;
  }
  lastRetentionAtMs = now;

  try {
    const redactTelemetryResult = await pool.query(
      `UPDATE scores
          SET telemetry = NULL
        WHERE telemetry IS NOT NULL
          AND created_at < NOW() - ($1 * INTERVAL '1 day')`,
      [config.TELEMETRY_RETENTION_DAYS],
    );

    const deleteOldScoresResult = await pool.query(
      `DELETE FROM scores
        WHERE created_at < NOW() - ($1 * INTERVAL '1 day')`,
      [config.SCORE_RETENTION_DAYS],
    );

    const deleteChallengeScoresResult = await pool.query(
      `DELETE FROM challenge_scores
        WHERE created_at < NOW() - ($1 * INTERVAL '1 day')`,
      [config.SCORE_RETENTION_DAYS],
    );

    const deleteOldSessionsResult = await pool.query(
      `DELETE FROM sessions
        WHERE (consumed_at IS NOT NULL AND consumed_at < NOW() - INTERVAL '7 days')
           OR expires_at < NOW() - INTERVAL '7 days'`,
    );

    const cleanupRacePlayersResult = await pool.query(
      `DELETE FROM race_players
        WHERE last_seen_at < NOW() - INTERVAL '15 minutes'`,
    );

    const cleanupRaceRoomsResult = await pool.query(
      `DELETE FROM race_rooms rr
        WHERE rr.created_at < NOW() - INTERVAL '4 hours'
           OR NOT EXISTS (
             SELECT 1
               FROM race_players rp
              WHERE rp.room_id = rr.id
           )`,
    );

    const cleanupTournamentsResult = await pool.query(
      `DELETE FROM tournaments
        WHERE created_at < NOW() - INTERVAL '60 days'`,
    );

    const cleanupWebhookDeliveriesResult = await pool.query(
      `DELETE FROM webhook_deliveries
        WHERE created_at < NOW() - INTERVAL '30 days'`,
    );

    const cleanupFriendRequestsResult = await pool.query(
      `DELETE FROM account_friend_requests
        WHERE status IN ('declined')
          AND created_at < NOW() - INTERVAL '120 days'`,
    );

    logger.info(
      {
        telemetryRedacted: redactTelemetryResult.rowCount ?? 0,
        scoresDeleted: deleteOldScoresResult.rowCount ?? 0,
        challengeScoresDeleted: deleteChallengeScoresResult.rowCount ?? 0,
        sessionsDeleted: deleteOldSessionsResult.rowCount ?? 0,
        racePlayersDeleted: cleanupRacePlayersResult.rowCount ?? 0,
        raceRoomsDeleted: cleanupRaceRoomsResult.rowCount ?? 0,
        tournamentsDeleted: cleanupTournamentsResult.rowCount ?? 0,
        webhookDeliveriesDeleted: cleanupWebhookDeliveriesResult.rowCount ?? 0,
        friendRequestsDeleted: cleanupFriendRequestsResult.rowCount ?? 0,
      },
      "Retention pass completed",
    );
  } catch (error) {
    setDatabaseOnline(false);
    logger.error({ err: error }, "Retention pass failed");
  }
}

export function startRetentionWorker(logger: pino.Logger): void {
  if (workerId) {
    return;
  }
  lastRetentionAtMs = 0;
  void runRetentionPass(logger);
  workerId = setInterval(() => {
    void runRetentionPass(logger);
  }, DB_CHECK_INTERVAL_MS);
  workerId.unref();
}

export function stopRetentionWorker(): void {
  if (!workerId) {
    return;
  }
  clearInterval(workerId);
  workerId = null;
}
