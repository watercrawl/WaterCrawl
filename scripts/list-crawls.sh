#!/bin/bash
# List all crawl requests with their status, page count, and URL.
# Auto-logins if WATERCRAWL_TOKEN is not set.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

API="${WATERCRAWL_API:-http://localhost:8765/api/v1}"
TOKEN="${WATERCRAWL_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  TOKEN=$("$SCRIPT_DIR/get-token.sh")
fi

curl -s "$API/core/crawl-requests/" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
results = data.get('results', [])
print(f'Total: {data.get(\"count\", len(results))} crawls')
for item in results:
    uuid_ = item.get('uuid', 'N/A')
    status = item.get('status', 'N/A')
    pages = item.get('number_of_documents', 0)
    duration = item.get('duration', '?')
    url_ = item.get('url', 'N/A')
    print(f'{uuid_:<38} {status:<10} pages={pages:<4} {duration:<12} {url_[:60]}')
"
