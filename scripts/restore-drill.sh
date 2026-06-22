#!/usr/bin/env bash
set -euo pipefail

BACKUP_FILE="${1:-}"
RECOVERY_DB_NAME="${2:-${D1_RECOVERY_DB_NAME:-typeshift-restore-drill}}"
WRANGLER_CONFIG="${WRANGLER_CONFIG:-client/wrangler.jsonc}"

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: ./scripts/restore-drill.sh <backup.sql> [recovery-d1-database-name]" >&2
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required for restore drills." >&2
  exit 1
fi

echo "Importing backup into recovery database: ${RECOVERY_DB_NAME}"
npx wrangler d1 execute "$RECOVERY_DB_NAME" --config "$WRANGLER_CONFIG" --remote --file "$BACKUP_FILE"

echo "Restore drill completed. Core table counts:"
npx wrangler d1 execute "$RECOVERY_DB_NAME" --config "$WRANGLER_CONFIG" --remote --command \
  "SELECT 'accounts' AS table_name, COUNT(*) AS row_count FROM accounts
   UNION ALL
   SELECT 'leaderboard_scores', COUNT(*) FROM leaderboard_scores
   UNION ALL
   SELECT 'gameplay_sessions', COUNT(*) FROM gameplay_sessions
   UNION ALL
   SELECT 'challenge_scores', COUNT(*) FROM challenge_scores;"
