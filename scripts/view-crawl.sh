#!/bin/bash
# Display the rendered Markdown content of a crawl result.
# Usage: ./view-crawl.sh <crawl_uuid> [lines=50|all]
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

API="${WATERCRAWL_API:-http://localhost:8765/api/v1}"
TOKEN="${WATERCRAWL_TOKEN:-}"
ID="${1:-}"
LINES="${2:-50}"

if [ -z "$TOKEN" ]; then
  TOKEN=$("$SCRIPT_DIR/get-token.sh")
fi

if [ -z "$ID" ]; then
  echo "Usage: $0 <crawl_uuid> [lines=50]"
  echo ""
  echo "Display the rendered Markdown from a crawl."
  echo "Pass 'all' as second argument to see the full output."
  exit 1
fi

echo "=== FETCHING CRAWL $ID ==="

URL=$(curl -s "$API/core/crawl-requests/$ID/" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{d[\"url\"]} (status={d[\"status\"]}, pages={d.get(\"number_of_documents\",0)}, duration={d.get(\"duration\",\"?\")})')")

echo "  $URL"

PRESIGNED=$(curl -s "$API/core/crawl-requests/$ID/results/" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; r=json.load(sys.stdin).get('results',[]); print(r[0]['result'] if r else '')" 2>/dev/null)

if [ -z "$PRESIGNED" ]; then
  echo "  No results found."
  exit 1
fi

PRESIGNED=$(echo "$PRESIGNED" | sed 's|http://localhost/|http://localhost:8765/|')

CONTENT=$(curl -s --max-time 15 "$PRESIGNED" | python3 -c "
import sys, json
d = json.load(sys.stdin)
md = d.get('markdown', '') or d.get('content_markdown', '')
print(md)
" 2>/dev/null)

if [ -z "$CONTENT" ]; then
  echo "  Empty content."
  exit 0
fi

TOTAL_LINES=$(echo "$CONTENT" | wc -l)
echo ""

if [ "$LINES" = "all" ]; then
  echo "=== CONTENT ($TOTAL_LINES lines) ==="
  echo "$CONTENT"
else
  echo "=== CONTENT ($LINES/$TOTAL_LINES lines) ==="
  echo "$CONTENT" | head -n "$LINES"
  echo ""
  echo "... (use '$0 $ID all' to see full output)"
fi
