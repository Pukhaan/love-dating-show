#!/usr/bin/env bash
# Render every slide at 1920x1080 with headless Chrome, then build a PDF and a PPTX.
# Needs the local server running: python3 -m http.server 8931
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/slides/export"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE="${BASE_URL:-http://127.0.0.1:8931/slides/}"
COUNT="$(grep -c '<section class="slide' "$ROOT/slides/index.html")"

mkdir -p "$OUT/png"
for i in $(seq 1 "$COUNT"); do
  n="$(printf '%02d' "$i")"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1920,1080 --virtual-time-budget=4000 \
    --screenshot="$OUT/png/slide-$n.png" "${BASE}?still&slide=$i" >/dev/null 2>&1
  echo "slide $n"
done

python3 "$ROOT/tools/build_decks.py" "$OUT/png" "$OUT"
