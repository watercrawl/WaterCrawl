#!/bin/bash
# Display full details and result list for a single crawl request.
# Usage: ./inspect-crawl.sh <crawl_uuid>
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

API="${WATERCRAWL_API:-http://localhost:8765/api/v1}"
TOKEN="${WATERCRAWL_TOKEN:-}"
ID="${1:-}"

if [ -z "$TOKEN" ]; then
  TOKEN=$("$SCRIPT_DIR/get-token.sh")
fi

if [ -z "$ID" ]; then
  echo "Usage: $0 <crawl_uuid>"
  exit 1
fi

echo "=== CRAWL DETAILS ($ID) ==="
curl -s "$API/core/crawl-requests/$ID/" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool

echo ""
echo "=== RESULTS ==="
curl -s "$API/core/crawl-requests/$ID/results/" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
results = data.get('results', [])
print(f'Result count: {len(results)}')
for r in results[:5]:
    print(f'  {r[\"uuid\"]}  {r[\"url\"]}')
if len(results) > 5:
    print(f'  ... and {len(results)-5} more')
"
