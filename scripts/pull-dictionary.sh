#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_FILE="/tmp/typeshift_words_alpha.txt"
FILTERED_TMP="/tmp/typeshift_words_filtered.txt"
OUT_FILE="$ROOT_DIR/data/english-2-12.txt"
CLIENT_COPY_FILE="$ROOT_DIR/client/public/data/english-2-12.txt"
SOURCE_URL="https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt"
FALLBACK_SOURCE="/usr/share/pocketsphinx/model/en-us/cmudict-en-us.dict"

mkdir -p "$ROOT_DIR/data"

SOURCE_FILE="$TMP_FILE"

if ! curl -fL -o "$TMP_FILE" "$SOURCE_URL"; then
  if [[ -f "$FALLBACK_SOURCE" ]]; then
    SOURCE_FILE="$FALLBACK_SOURCE"
  else
    echo "Failed to download remote dictionary and no local fallback was found." >&2
    exit 1
  fi
fi

awk '
  {
    w = tolower($1);
    sub(/\(.+\)$/, "", w);
    gsub(/[^a-z]/, "", w);
    if (length(w) >= 2 && length(w) <= 12) {
      print w;
    }
  }
' "$SOURCE_FILE" | sort -u > "$FILTERED_TMP"

head -n 50000 "$FILTERED_TMP" > "$OUT_FILE"
mkdir -p "$(dirname "$CLIENT_COPY_FILE")"
cp "$OUT_FILE" "$CLIENT_COPY_FILE"

echo "Generated $OUT_FILE with $(wc -l < "$OUT_FILE") words"
echo "Updated client copy at $CLIENT_COPY_FILE"
