#!/bin/bash
# Batch-generate covers listed in covers-manifest.txt (id|prompt per line).
# Usage: gen-covers.sh <start-index> <count>
set -u
ROOT="/Users/yangyu/Documents/Kimi/Workspaces/语音产品/iCAR超级APP-KIMI"
TOOL="/Users/yangyu/Library/Application Support/kimi-desktop/daimon-share/daimon/runtime/kimi-code/home/plugins/managed/image_generation/scripts/image_generation_tool.py"
MANIFEST="$ROOT/qa/covers-manifest.txt"
STYLE=", photorealistic premium automotive lifestyle photography, cinematic lighting, deep blue night tones with warm amber accents, high detail, no text, no letters, no watermark, 16:9 composition"
START=${1:-1}; COUNT=${2:-17}
RUNID=$(date +%s)
mkdir -p "$ROOT/assets/covers"
i=0
while IFS='|' read -r id prompt; do
  i=$((i+1))
  [ "$i" -lt "$START" ] && continue
  [ "$i" -ge $((START+COUNT)) ] && break
  out="$ROOT/assets/covers/$id.png"
  [ -s "$out" ] && { echo "skip $id (exists)"; continue; }
  log="/tmp/imggen.$RUNID.$id.log"
  nohup python3 "$TOOL" generate --description "$prompt$STYLE" --size "1536x864" --background opaque --output "$out" > "$log" 2>&1 &
  echo "launched $id (log $log)"
done < "$MANIFEST"
echo "batch launched, run-id $RUNID"
