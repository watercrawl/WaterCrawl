#!/bin/bash
# Save the rendered Markdown of a crawl result to a local file.
# Usage: ./save-crawl.sh <crawl_uuid>
# Output directory can be set via CRAWL_ARCHIVE (default: ./crawl-archive).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

API="${WATERCRAWL_API:-http://localhost:8765/api/v1}"
TOKEN="${WATERCRAWL_TOKEN:-}"
ID="${1:-}"
OUTPUT_DIR="${CRAWL_ARCHIVE:-./crawl-archive}"

if [ -z "$TOKEN" ]; then
  TOKEN=$("$SCRIPT_DIR/get-token.sh")
fi

if [ -z "$ID" ]; then
  echo "Usage: $0 <crawl_uuid>"
  echo "       CRAWL_ARCHIVE sets the output directory (default: ./crawl-archive)"
  exit 1
fi

URL=$(curl -s "$API/core/crawl-requests/$ID/" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('url','unknown'))")

SLUG=$(echo "$URL" | sed 's|https\?://||' | sed 's|[^a-zA-Z0-9._-]|_|g' | cut -c1-60)
OUTFILE="$OUTPUT_DIR/${ID}_${SLUG}.md"

mkdir -p "$OUTPUT_DIR"

echo "Saving crawl $ID"
echo "  URL: $URL"

PRESIGNED=$(curl -s "$API/core/crawl-requests/$ID/results/" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; r=json.load(sys.stdin).get('results',[]); print(r[0]['result'] if r else '')" 2>/dev/null)

if [ -n "$PRESIGNED" ]; then
  PRESIGNED=$(echo "$PRESIGNED" | sed 's|http://localhost/|http://localhost:8765/|')
  curl -s --max-time 15 "$PRESIGNED" | python3 -c "
import sys, json
d = json.load(sys.stdin)
md = d.get('markdown', '') or d.get('content_markdown', '')
print(md)
" 2>/dev/null > "$OUTFILE"
fi

SIZE=$(wc -c < "$OUTFILE" 2>/dev/null || echo 0)
echo "  Saved: $OUTFILE ($SIZE bytes)"
