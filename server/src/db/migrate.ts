import { MODE_VALUES } from "../types.js";
import { pool } from "./pool.js";

const modeCheckSql = MODE_VALUES.map((value) => `'${value}'`).join(", ");

const migrationSql = `
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN (${modeCheckSql})),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  ip_hash TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY,
  session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  username TEXT NOT NULL CHECK (char_length(username) BETWEEN 2 AND 24),
  mode TEXT NOT NULL CHECK (mode IN (${modeCheckSql})),
  wpm NUMERIC(6, 2) NOT NULL CHECK (wpm >= 0 AND wpm <= 400),
  raw NUMERIC(6, 2) NOT NULL CHECK (raw >= 0 AND raw <= 500),
  accuracy NUMERIC(5, 2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
  errors INTEGER NOT NULL CHECK (errors >= 0 AND errors <= 5000),
  streak INTEGER NOT NULL CHECK (streak >= 0 AND streak <= 5000),
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 5000 AND duration_ms <= 7200000),
  client_version TEXT,
  telemetry JSONB,
  certified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scores ADD COLUMN IF NOT EXISTS telemetry JSONB;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS certified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_scores_mode_rank
  ON scores (mode, wpm DESC, accuracy DESC, raw DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_scores_mode_certified_rank
  ON scores (mode, certified, wpm DESC, accuracy DESC, raw DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_scores_created_at
  ON scores (created_at ASC);

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_mode_check;
ALTER TABLE sessions
  ADD CONSTRAINT sessions_mode_check
  CHECK (mode IN (${modeCheckSql}));

ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_mode_check;
ALTER TABLE scores
  ADD CONSTRAINT scores_mode_check
  CHECK (mode IN (${modeCheckSql}));

CREATE TABLE IF NOT EXISTS race_rooms (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN (${modeCheckSql})),
  status TEXT NOT NULL CHECK (status IN ('lobby', 'running', 'finished')),
  host_player_id UUID NOT NULL,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS race_players (
  id UUID PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES race_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 24),
  progress NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  wpm NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (wpm >= 0 AND wpm <= 400),
  accuracy NUMERIC(5, 2) NOT NULL DEFAULT 100 CHECK (accuracy >= 0 AND accuracy <= 100),
  finished BOOLEAN NOT NULL DEFAULT FALSE,
  finished_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_race_players_room_id ON race_players(room_id);
CREATE INDEX IF NOT EXISTS idx_race_players_last_seen_at ON race_players(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_race_rooms_created_at ON race_rooms(created_at);

CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 48),
  mode TEXT NOT NULL CHECK (mode IN (${modeCheckSql})),
  status TEXT NOT NULL CHECK (status IN ('live', 'finished')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_players (
  id UUID PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 24),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL CHECK (round >= 1),
  match_index INTEGER NOT NULL CHECK (match_index >= 0),
  player_a_id UUID,
  player_b_id UUID,
  winner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, round, match_index)
);

CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament_id ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches(tournament_id, round, match_index);

CREATE TABLE IF NOT EXISTS challenge_scores (
  id UUID PRIMARY KEY,
  session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  username TEXT NOT NULL CHECK (char_length(username) BETWEEN 2 AND 24),
  mode TEXT NOT NULL CHECK (mode IN (${modeCheckSql})),
  wpm NUMERIC(6, 2) NOT NULL CHECK (wpm >= 0 AND wpm <= 400),
  raw NUMERIC(6, 2) NOT NULL CHECK (raw >= 0 AND raw <= 500),
  accuracy NUMERIC(5, 2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
  errors INTEGER NOT NULL CHECK (errors >= 0 AND errors <= 5000),
  streak INTEGER NOT NULL CHECK (streak >= 0 AND streak <= 5000),
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 5000 AND duration_ms <= 7200000),
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_scores_date_rank
  ON challenge_scores (challenge_date, points DESC, wpm DESC, accuracy DESC, raw DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_challenge_scores_created_at
  ON challenge_scores (created_at ASC);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY,
  handle TEXT NOT NULL CHECK (char_length(handle) BETWEEN 2 AND 24),
  handle_normalized TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 1000 CHECK (rating BETWEEN 100 AND 5000),
  locale TEXT NOT NULL DEFAULT 'en',
  verified_runs INTEGER NOT NULL DEFAULT 0 CHECK (verified_runs >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_preferences (
  account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_friend_requests (
  id UUID PRIMARY KEY,
  from_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE (from_account_id, to_account_id)
);

CREATE TABLE IF NOT EXISTS shared_replays (
  id TEXT PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  mode TEXT NOT NULL CHECK (mode IN (${modeCheckSql})),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 80),
  replay JSONB NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['score.submitted'],
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok', 'failed')),
  response_code INTEGER,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_handle_normalized ON accounts(handle_normalized);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON account_friend_requests(to_account_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON account_friend_requests(from_account_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_replays_public ON shared_replays(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_account ON webhook_endpoints(account_id, active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);

CREATE TABLE IF NOT EXISTS analytics_daily_aggregates (
  dimension_key TEXT PRIMARY KEY,
  date_key DATE NOT NULL,
  event_name TEXT NOT NULL,
  page TEXT,
  mode TEXT CHECK (mode IN (${modeCheckSql})),
  theme TEXT CHECK (theme IN ('dark', 'light')),
  viewport_bucket TEXT CHECK (viewport_bucket IN ('sm', 'md', 'lg', 'xl')),
  reduced_motion BOOLEAN,
  consent_version INTEGER,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE analytics_daily_aggregates ADD COLUMN IF NOT EXISTS dimension_key TEXT;
UPDATE analytics_daily_aggregates
   SET dimension_key = CONCAT_WS(
     '|',
     date_key::text,
     event_name,
     COALESCE(page, ''),
     COALESCE(mode, ''),
     COALESCE(theme, ''),
     COALESCE(viewport_bucket, ''),
     COALESCE(reduced_motion::text, ''),
     COALESCE(consent_version::text, '')
   )
 WHERE dimension_key IS NULL;
ALTER TABLE analytics_daily_aggregates DROP CONSTRAINT IF EXISTS analytics_daily_aggregates_pkey;
ALTER TABLE analytics_daily_aggregates ALTER COLUMN dimension_key SET NOT NULL;
ALTER TABLE analytics_daily_aggregates ADD PRIMARY KEY (dimension_key);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily_aggregates(date_key DESC, event_name);
`;

export async function migrateDatabase(): Promise<void> {
  await pool.query(migrationSql);
}
