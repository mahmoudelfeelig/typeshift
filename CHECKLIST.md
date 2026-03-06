# Wanted Features Checklist

## Core Features
- [x] Ghost pace racing per mode
- [x] Replay capture + timeline viewer
- [x] Replay export/share files
- [x] Adaptive weak-pattern trainer
- [x] Keyboard heatmap + finger analytics
- [x] Real-time multiplayer race rooms
- [x] Daily challenge + seasonal ladders
- [x] Tournament brackets + spectator lookup
- [x] Telemetry-aware anti-cheat checks
- [x] Offline score queue + sync-on-online
- [x] PWA service worker + app manifest
- [x] Accessibility presets + selectable sound packs
- [x] Account auth + cloud preferences sync
- [x] Ranked matchmaking + duel queue
- [x] Replay hub sharing + outbound webhooks
- [x] Pulse rhythm lane
- [x] Cipher global shift mode
- [x] Meteor spaceship lane
- [x] Drift mode
- [x] Reverse mode
- [x] Echo memory mode
- [x] Rogue perk draft mode
- [x] Duel rival rhythm race

## Gameplay
- [x] Multiple modes (`time`, `quote`, `meteor`, `zen`, `pulse`, `relay`, `cipher`, `drift`, `reverse`, `echo`, `rogue`, `duel`, `code`, `coach`, `blackout`, `chain`, `gravity`, `coop`, `infection`, `stealth`, `chart`)
- [x] Pulse rhythm lane with timing judgement and BPM control
- [x] Cipher mode with configurable global shift direction + amount
- [x] Ghost race pace tracking
- [x] Replay viewer with scrub/playback
- [x] Replay JSON export/import
- [x] Adaptive weak-pattern trainer
- [x] Keyboard heatmap + finger stats
- [x] Fast input handling with low-latency updates
- [x] Expanded live stats (CPM, KPS, efficiency, words, correct/wrong chars, elapsed time)
- [x] Global keyboard capture in all modes (no typing text box)
- [x] Start button available in all modes
- [x] Auto start on first keypress for non-meteor modes
- [x] Focus mode on run start (full viewport game view)
- [x] Focus mode keeps user-selected stats
- [x] Focus stats docked below gameplay (no word overlap)
- [x] Meteor mode starts from raw typing (no launch click, no focus bar needed)
- [x] Meteor target auto-lock by first typed letter
- [x] Meteor tie-break picks the closest falling word (nearest to ground line)
- [x] Meteor back-out using `Space` (unlock target)
- [x] Meteor partial chip-save with `Space`
- [x] Meteor spaceship visuals + laser/explosion SFX
- [x] Live stats (WPM, raw, accuracy, errors, streak, lives)
- [x] Daily challenge preset + challenge leaderboard
- [x] Seasonal ladder panel

## Dictionaries
- [x] Large 2-12 letter dictionary (50k words)
- [x] Dictionary pull script (`scripts/pull-dictionary.sh`)
- [x] Dictionary options (`core`, `tech`, `myth`, `blitz`, `top1k`, `top5k`, `top10k`, `verbs`, `nouns`)
- [x] Custom dictionary saved locally

## Frontend
- [x] React + TypeScript codebase
- [x] Creative animated UI refresh
- [x] Dark/light theme toggle (dark by default, distinct visual styles)
- [x] Less robotic user-facing copy
- [x] Local prewarm queue for generated words
- [x] Local cache for dictionary + leaderboard reads

## Backend / Security
- [x] Online leaderboard API (session init, submit, fetch)
- [x] Token-bound score submission and anti-cheat checks
- [x] Telemetry-based anti-cheat validation
- [x] Parameterized SQL + schema constraints
- [x] Rate limiting, Helmet, validation
- [x] Controlled fallback policy (prod can fail fast if DB unavailable)
- [x] Real-time multiplayer race APIs
- [x] Tournament + spectator APIs
- [x] Race/tournament PostgreSQL persistence
- [x] Daily challenge submit + leaderboard APIs
- [x] Seasonal leaderboard API
- [x] Offline score queue + sync
- [x] PWA service worker + manifest
- [x] Sound pack system
- [x] Accessibility presets
- [x] Screen-reader live announcements, skip-to-game navigation, and text scale controls
- [x] Security headers hardening (CSP/HSTS/no-referrer)
- [x] Mutation hardening (strict JSON-only writes, origin checks, method allowlist, timing-safe token compare)
- [x] Metrics/observability endpoint
- [x] Retention worker for score/telemetry lifecycle
- [x] Backup/restore scripts

## CI / Tests
- [x] Automated server tests
- [x] Client strict typecheck gate
- [x] CI workflow running tests + build
