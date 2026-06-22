#!/usr/bin/env bash
set -euo pipefail

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required but was not found in PATH." >&2
  exit 1
fi

BACKUP_FILE="${1:-}"
TARGET_DB_NAME="${2:-${D1_DATABASE_NAME:-typeshift-prod}}"
WRANGLER_CONFIG="${WRANGLER_CONFIG:-client/wrangler.jsonc}"
if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: ./scripts/restore-db.sh <backup.sql> [d1-database-name]" >&2
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

npx wrangler d1 execute "$TARGET_DB_NAME" --config "$WRANGLER_CONFIG" --remote --file "$BACKUP_FILE"
echo "Restore completed into ${TARGET_DB_NAME} from ${BACKUP_FILE}"
