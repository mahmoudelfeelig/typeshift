#!/usr/bin/env bash
set -euo pipefail

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required but was not found in PATH." >&2
  exit 1
fi

OUT_DIR="${1:-./backups}"
D1_DATABASE_NAME="${D1_DATABASE_NAME:-typeshift-prod}"
WRANGLER_CONFIG="${WRANGLER_CONFIG:-client/wrangler.jsonc}"
R2_BUCKET_NAME="${R2_BUCKET_NAME:-typeshift-backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="$OUT_DIR/typeshift_$STAMP.sql"

mkdir -p "$OUT_DIR"
npx wrangler d1 export "$D1_DATABASE_NAME" --config "$WRANGLER_CONFIG" --remote --output "$OUT_FILE"
npx wrangler r2 object put "${R2_BUCKET_NAME}/$(basename "$OUT_FILE")" --file "$OUT_FILE"

echo "Backup created and uploaded: $OUT_FILE"
