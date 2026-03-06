# TypeShift Station

Typing game platform inspired by Monkeytype and zty.pe, with:
- multiple game modes
- custom dictionaries
- fast input response
- modern React + TypeScript frontend
- secure online leaderboard backend
- expanded accessibility support (screen-reader announcements, skip link, keyboard-first focus, text scaling, system motion/contrast support)

## Wanted Feature Checklist

### Numbered Additions Tracker

#### High-Value Additions
- [x] 1. Ghost pace racing per mode
- [x] 2. Replay capture + timeline viewer
- [x] 3. Replay export/share files
- [x] 4. Adaptive weak-pattern trainer
- [x] 5. Keyboard heatmap + finger analytics
- [x] 6. Real-time multiplayer race rooms
- [x] 7. Daily challenge + seasonal ladders
- [x] 8. Tournament brackets + spectator lookup
- [x] 9. Telemetry-aware anti-cheat checks
- [x] 10. Offline score queue + sync-on-online
- [x] 11. PWA service worker + app manifest
- [x] 12. Accessibility presets + selectable sound packs
- [x] 13. Account auth + cloud preferences sync
- [x] 14. Ranked matchmaking + duel queue
- [x] 15. Replay hub sharing + outbound webhooks

#### Creative Additions
- [x] 1. Pulse rhythm lane
- [x] 2. Cipher global shift mode
- [x] 3. Meteor spaceship lane
- [x] 4. Drift mode
- [x] 5. Reverse mode
- [x] 6. Echo memory mode
- [x] 7. Rogue perk draft mode
- [x] 8. Duel rival rhythm race

### Core Gameplay
- [x] Multiple game modes (`time`, `quote`, `meteor`, `zen`, `pulse`, `relay`, `cipher`, `drift`, `reverse`, `echo`, `rogue`, `duel`, `code`, `coach`, `blackout`, `chain`, `gravity`, `coop`, `infection`, `stealth`, `chart`)
- [x] Pulse mode reworked as beat-timed rhythm typing (timing judgement + BPM control)
- [x] Cipher mode configurable global shift (forward/backward + 1-25 steps)
- [x] Ghost race pacing against saved best run per mode
- [x] Replay viewer with key timeline scrub/playback
- [x] Replay export/import JSON files
- [x] Adaptive trainer from weak bigram/trigram patterns
- [x] Keyboard heatmap + finger-level accuracy stats
- [x] Real-time typing stats (WPM, raw, CPM, KPS, accuracy, efficiency, words, chars, streak)
- [x] Low-latency input path (frame-batched current-word updates, minimal DOM churn)
- [x] Global keyboard input in all modes (no dedicated typing text box)
- [x] Start button available in all modes
- [x] Auto start on first keypress for non-meteor modes
- [x] Focus run view (game fills the viewport while running)
- [x] Focus stat customization (choose which stats stay visible in focus mode)
- [x] Focus HUD docked below gameplay so it does not cover words
- [x] Meteor mode auto-lock by first typed letter (closest falling word wins)
- [x] Meteor mode supports instant unlock/back-out via `Space`
- [x] Meteor chip-save on `Space` (partial progress stays on word)
- [x] Meteor spaceship VFX + built-in laser/explosion SFX
- [x] Restart/remix/seed reset controls
- [x] Session reports + local best scores
- [x] Dark/light theme toggle with dark mode as default
- [x] Certified run toggle with stricter anti-cheat validation and certified leaderboard filtering
- [x] Creative non-generic UI direction (`TypeShift Atlas` theme)
- [x] Daily challenge preset (seeded words) + challenge leaderboard
- [x] Seasonal ladder endpoint + UI panel
- [x] Home-first page structure with section navbar (`home`, `modes`, `play`, `social`, `boards`, `lab`, `profile`, `settings`)
- [x] Account profile layer (register/login, cloud preferences sync, friends, ranked/casual duel queue, replay sharing, webhooks)

### Dictionary & Customization
- [x] Dictionary packs (`core`, `tech`, `myth`, `blitz`, `top1k`, `top5k`, `top10k`, `verbs`, `nouns`, `code`, `spanish`, `french`, `german`)
- [x] Custom user dictionary (saved in localStorage)
- [x] Optional punctuation, numbers, lowercase lock, custom-only mode
- [x] Large external dictionary (50,000 words, 2-12 letters)
- [x] Dictionary preload + local cache
- [x] Dictionary pull script (`scripts/pull-dictionary.sh`)

### Frontend Architecture
- [x] React 19 + Next.js 15 + TypeScript 5.9 workspace
- [x] App moved to React (`client/src/App.tsx`)
- [x] Root dev launcher that forwards host/port into the Next client workspace on Windows
- [x] Keyboard-first accessibility upgrades (skip link, focus targeting, live announcements, text scaling)

### Online Leaderboard
- [x] Server runtime (`server/src/index.ts`) with secure middleware
- [x] PostgreSQL schema + migration code for sessions/scores
- [x] Security primitives (JWT session tokens, input normalization, anti-cheat sanity checks)
- [x] Session init + score submit + fetch leaderboard routes
- [x] Client leaderboard UI wired to API
- [x] Local leaderboard cache for faster warm reloads
- [x] Authenticated score submission flow integrated in frontend
- [x] Real-time multiplayer race rooms (create/join/start/live progress)
- [x] Tournament brackets + spectator lookup
- [x] Race/tournament persistence in PostgreSQL (in-memory only as controlled fallback)
- [x] Daily challenge submit + challenge leaderboard endpoints
- [x] Season leaderboard endpoint

### Security Hardening
- [x] Parameterized SQL approach and constrained schema
- [x] Rate limiting + helmet + strict validation with Zod
- [x] Method allowlist + strict JSON-only mutation bodies + origin checks on writes
- [x] Session-bound token model to reduce replay abuse
- [x] JWT algorithm pinning + timing-safe token comparison for protected metrics access
- [x] Telemetry-aware anti-cheat validation on score submit
- [x] Input policy hardening for usernames and multiplayer display names
- [x] Offline score queue with online sync retry path
- [x] PWA service worker + manifest for offline-first behavior
- [x] Selectable sound packs for run SFX
- [x] Accessibility presets (reduced motion, high contrast, colorblind, dyslexia-friendly font)
- [x] Production startup policy (fail fast in prod when DB is unavailable)
- [x] API security headers hardening (CSP, HSTS, no-referrer policy)
- [x] Backup and restore scripts (`scripts/backup-db.sh`, `scripts/restore-db.sh`)
- [x] Retention worker for telemetry/data lifecycle policy

### Release Engineering
- [x] Server automated unit tests
- [x] Workspace test script (`npm run test`)
- [x] CI workflow (`.github/workflows/ci.yml`) running install, tests, and build
- [x] Client strict typecheck gate

## Dictionary Source

Primary source target:
- `https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt`

Current environment has outbound DNS/network restrictions, so the script falls back to local CMU dictionary data when remote fetch is unavailable:
- `/usr/share/pocketsphinx/model/en-us/cmudict-en-us.dict`

Output file:
- `data/english-2-12.txt` (filtered to alphabetic words of length 2-12, capped to 50,000 unique words)
- `client/public/data/english-2-12.txt` (client runtime copy)

## Regenerate Dictionary

```bash
./scripts/pull-dictionary.sh
```

## Workspace Layout

- `client/`: React 19 + Next.js 15 + TypeScript 5.9 frontend
- `server/`: Express 5 + TypeScript + PostgreSQL API
- `client/app/` + `client/src/App.tsx` + `client/src/styles.css`: Next App Router shell plus the main client runtime
- `src/app.ts`: TypeScript source mirror for current game runtime

## Local Development (target setup)

1. Install dependencies:
   - `npm install`
2. Start local Postgres (recommended):
   - `docker compose up -d postgres`
3. Start both apps:
   - `npm run dev`
   - custom host/port: `npm run dev -- --host 127.0.0.1 --port 5174`
4. Frontend:
   - `http://127.0.0.1:5174` (if using the command above)
5. API:
   - `http://localhost:8080`
6. If Postgres is not running:
   - API now starts in secure in-memory fallback mode (leaderboards persist only until restart).
   - When Postgres comes back, the API auto-recovers to DB-backed persistence without restart.

## Quick Start (PowerShell)

```powershell
cd D:\Stuff\Projects\Coding\Sites\Typeshit
npm install
docker compose up -d postgres
npm run dev -- --host 127.0.0.1 --port 5174
```

Then open `http://127.0.0.1:5174`.

App navigation uses the top route bar:
- `Play`: game arena + mode cards
- `Social`: race rooms + tournament
- `Boards`: leaderboard + daily + season
- `Lab`: custom dictionary + replay + heatmap
- `Settings`: setup, accessibility, focus HUD

## Environment Variables (server)

Create `server/.env` (or copy `server/.env.example`):

```env
NODE_ENV=development
PORT=8080
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/typeshift
DATABASE_SSL=false
JWT_SESSION_SECRET=replace-with-a-long-random-secret-at-least-32-chars
CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5174,http://localhost:5174
LOG_LEVEL=info
TRUST_PROXY_HOPS=0
ALLOW_IN_MEMORY_FALLBACK=true
REQUIRE_DATABASE_IN_PROD=true
METRICS_ENABLED=true
ENFORCE_HTTPS=false
STRICT_MUTATION_ORIGIN=true
MAX_JSON_BODY=16kb
METRICS_TOKEN=
SCORE_RETENTION_DAYS=365
TELEMETRY_RETENTION_DAYS=30
```

## Publish Runbook

1. Set `NODE_ENV=production` and `ALLOW_IN_MEMORY_FALLBACK=false`.
2. Set `ENFORCE_HTTPS=true`, `STRICT_MUTATION_ORIGIN=true`, and a correct `TRUST_PROXY_HOPS` value.
3. Set a strong `JWT_SESSION_SECRET` (32+ random chars).
4. Run migration and app deploy against managed Postgres:
   - `npm run build`
   - `npm run start -w server`
5. Validate health and readiness:
   - `GET /api/health/live`
   - `GET /api/health/ready`
6. Protect metrics:
   - set `METRICS_TOKEN`
   - scrape `GET /api/metrics` with `X-Metrics-Token`.
7. Configure backup/restore automation:
   - `npm run backup:db`
   - `npm run restore:db -- <backup-file>`
8. Follow the full publish hardening checklist:
   - `docs/publish-checklist.md`

## Notes on Your Reported Errors

- `connect ECONNREFUSED 127.0.0.1:5432`:
  - fixed behavior: API starts in in-memory mode only when fallback is explicitly allowed.
  - production can now fail fast if DB is unavailable.
- `Invalid hook call` from `@tanstack/react-query`:
  - fixed by removing react-query from the client runtime and using plain React effects + fetch.
