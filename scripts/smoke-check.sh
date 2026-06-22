#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8787}"

check() {
  local url="$1"
  echo "Checking $url"
  curl -fsS "$url" >/dev/null
}

check "$BASE_URL/api/health"
check "$BASE_URL/api/health/live"
check "$BASE_URL/api/health/ready"
check "$BASE_URL/api/v1/challenge/daily"

curl -fsS "$BASE_URL/api/v1/race/create" \
  -H 'content-type: application/json' \
  --data '{"mode":"time","name":"Smoke"}' >/dev/null

curl -fsS "$BASE_URL/api/v1/tournament/create" \
  -H 'content-type: application/json' \
  --data '{"mode":"time","name":"Smoke Cup","entrants":["alpha","beta"]}' >/dev/null

echo "Smoke checks passed for $BASE_URL"
