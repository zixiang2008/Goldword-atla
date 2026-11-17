#!/usr/bin/env bash
# Download and unpack the third-party Word Atlas dataset/illustrations/audio.
# Source: https://github.com/H1DDENADM1N/word-atlas  (MIT code / CC BY 4.0 content)
# Run once after cloning; the downloaded files are intentionally NOT committed.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="$ROOT_DIR/.cache"
TARBALL="$CACHE_DIR/word-atlas-main.tar.gz"
EXTRACT_DIR="$CACHE_DIR/word-atlas-main"
REF="${ATLAS_REF:-main}"
URL="https://codeload.github.com/H1DDENADM1N/word-atlas/tar.gz/refs/heads/${REF}"

log()  { printf '[fetch-atlas] %s\n' "$*"; }
fail() { printf '[fetch-atlas] ERROR: %s\n' "$*" >&2; exit 1; }

command -v curl >/dev/null 2>&1 || fail "curl is required"
command -v tar  >/dev/null 2>&1 || fail "tar is required"

mkdir -p "$CACHE_DIR"

if [ -s "$TARBALL" ]; then
  log "Using cached tarball: $TARBALL"
else
  log "Downloading Word Atlas ($REF): $URL"
  log "This is about 566 MB and may take a while."
  curl -fL --retry 3 --retry-delay 2 -o "$TARBALL" "$URL" || fail "download failed"
fi

if [ ! -f "$EXTRACT_DIR/public/atlas/index.json" ]; then
  log "Extracting to $EXTRACT_DIR"
  rm -rf "$EXTRACT_DIR"
  mkdir -p "$EXTRACT_DIR"
  tar -xzf "$TARBALL" -C "$EXTRACT_DIR" --strip-components=1 || fail "extract failed"
fi

for required in \
  public/atlas/index.json \
  data/word-atlas.json \
  public/atlas/entries \
  public/atlas/img \
  public/atlas/thumb \
  public/atlas/audio \
  public/brand; do
  [ -e "$EXTRACT_DIR/$required" ] || fail "missing expected upstream path: $required"
done

log "Copying index and dataset..."
mkdir -p "$ROOT_DIR/www/atlas"
cp "$EXTRACT_DIR/public/atlas/index.json" "$ROOT_DIR/www/atlas/"
cp "$EXTRACT_DIR/data/word-atlas.json"   "$ROOT_DIR/www/atlas/"

for dir in entries img thumb audio; do
  log "Copying $dir/ ..."
  mkdir -p "$ROOT_DIR/www/atlas/$dir"
  cp -r "$EXTRACT_DIR/public/atlas/$dir/." "$ROOT_DIR/www/atlas/$dir/"
done

log "Copying brand assets..."
mkdir -p "$ROOT_DIR/www/brand"
cp -r "$EXTRACT_DIR/public/brand/." "$ROOT_DIR/www/brand/"

img_count="$(find "$ROOT_DIR/www/atlas/img"    -type f | wc -l | tr -d '[:space:]')"
audio_count="$(find "$ROOT_DIR/www/atlas/audio" -type f | wc -l | tr -d '[:space:]')"
entry_count="$(find "$ROOT_DIR/www/atlas/entries" -type f | wc -l | tr -d '[:space:]')"

log "Verifying: images=$img_count audio=$audio_count entries=$entry_count"
[ "$img_count"  -ge 7000  ] || fail "too few illustrations: $img_count"
[ "$audio_count" -ge 20000 ] || fail "too few recordings: $audio_count"
[ "$entry_count" -ge 50    ] || fail "too few entry chunks: $entry_count"

log "DONE. Next steps:"
log "  npx cap sync android"
log "  cd android && ./gradlew assembleRelease"
