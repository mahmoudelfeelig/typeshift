PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS gameplay_sessions (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER
);

CREATE INDEX IF NOT EXISTS gameplay_sessions_expiry_idx
  ON gameplay_sessions (expires_at);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL,
  handle_normalized TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 1000,
  locale TEXT NOT NULL DEFAULT 'en',
  verified_runs INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS account_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  label TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS account_sessions_account_idx
  ON account_sessions (account_id, revoked_at, expires_at, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS account_preferences (
  account_id TEXT PRIMARY KEY,
  preferences_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leaderboard_scores (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  account_id TEXT,
  username TEXT NOT NULL,
  mode TEXT NOT NULL,
  wpm REAL NOT NULL,
  raw REAL NOT NULL,
  accuracy REAL NOT NULL,
  errors INTEGER NOT NULL,
  streak INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  certified INTEGER NOT NULL DEFAULT 0,
  client_version TEXT,
  telemetry_json TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS leaderboard_scores_mode_idx
  ON leaderboard_scores (mode, certified, wpm DESC, accuracy DESC, raw DESC, created_at ASC);

CREATE TABLE IF NOT EXISTS challenge_scores (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  account_id TEXT,
  challenge_date TEXT NOT NULL,
  season_id TEXT NOT NULL,
  username TEXT NOT NULL,
  mode TEXT NOT NULL,
  points INTEGER NOT NULL,
  wpm REAL NOT NULL,
  raw REAL NOT NULL,
  accuracy REAL NOT NULL,
  errors INTEGER NOT NULL,
  streak INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS challenge_scores_date_idx
  ON challenge_scores (challenge_date, points DESC, wpm DESC, accuracy DESC, raw DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS challenge_scores_season_idx
  ON challenge_scores (season_id, username, created_at);

CREATE TABLE IF NOT EXISTS replay_shares (
  id TEXT PRIMARY KEY,
  account_id TEXT,
  mode TEXT NOT NULL,
  title TEXT NOT NULL,
  replay_json TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS replay_shares_public_idx
  ON replay_shares (is_public, created_at DESC);

CREATE TABLE IF NOT EXISTS account_friend_requests (
  id TEXT PRIMARY KEY,
  from_account_id TEXT NOT NULL,
  to_account_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at INTEGER NOT NULL,
  responded_at INTEGER,
  FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE (from_account_id, to_account_id)
);

CREATE INDEX IF NOT EXISTS account_friend_requests_incoming_idx
  ON account_friend_requests (to_account_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS account_friend_requests_outgoing_idx
  ON account_friend_requests (from_account_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS race_rooms (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('lobby', 'running', 'finished')),
  host_player_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  started_at INTEGER
);

CREATE INDEX IF NOT EXISTS race_rooms_created_idx
  ON race_rooms (created_at);

CREATE TABLE IF NOT EXISTS race_players (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  name TEXT NOT NULL,
  progress REAL NOT NULL DEFAULT 0,
  wpm REAL NOT NULL DEFAULT 0,
  accuracy REAL NOT NULL DEFAULT 100,
  finished INTEGER NOT NULL DEFAULT 0,
  finished_at INTEGER,
  last_seen_at INTEGER NOT NULL,
  FOREIGN KEY (room_id) REFERENCES race_rooms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS race_players_room_idx
  ON race_players (room_id, progress DESC, wpm DESC);

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('live', 'finished')),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tournament_players (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  name TEXT NOT NULL,
  seed_index INTEGER NOT NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS tournament_players_tournament_idx
  ON tournament_players (tournament_id, seed_index ASC);

CREATE TABLE IF NOT EXISTS tournament_matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  match_index INTEGER NOT NULL,
  player_a_id TEXT,
  player_b_id TEXT,
  winner_id TEXT,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS tournament_matches_tournament_idx
  ON tournament_matches (tournament_id, round ASC, match_index ASC);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  target_url TEXT NOT NULL,
  events_json TEXT NOT NULL,
  secret TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS webhook_endpoints_account_idx
  ON webhook_endpoints (account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS analytics_daily_aggregates (
  dimension_key TEXT PRIMARY KEY,
  date_key TEXT NOT NULL,
  event_name TEXT NOT NULL,
  page TEXT,
  mode TEXT,
  theme TEXT,
  viewport_bucket TEXT,
  reduced_motion INTEGER,
  consent_version INTEGER,
  count INTEGER NOT NULL DEFAULT 0,
  last_seen_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS analytics_daily_date_idx
  ON analytics_daily_aggregates (date_key DESC, count DESC, event_name ASC);
