#!/bin/bash
# Compare two crawl results: size, line count, and block detection.
# Usage: ./compare-crawls.sh <id1> <id2> [label1] [label2]
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

API="${WATERCRAWL_API:-http://localhost:8765/api/v1}"
TOKEN="${WATERCRAWL_TOKEN:-}"
ID1="${1:-}"
ID2="${2:-}"
LABEL1="${3:-Crawl 1}"
LABEL2="${4:-Crawl 2}"

if [ -z "$TOKEN" ]; then
  TOKEN=$("$SCRIPT_DIR/get-token.sh")
fi

if [ -z "$ID1" ] || [ -z "$ID2" ]; then
  echo "Usage: $0 <id1> <id2> [label1] [label2]"
  exit 1
fi

fetch_info() {
  local id="$1"
  curl -s "$API/core/crawl-requests/$id/" -H "Authorization: Bearer $TOKEN" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{d[\"status\"]}|{d.get(\"number_of_documents\",0)}|{d.get(\"duration\",\"?\")}')"
}

fetch_content() {
  local id="$1"
  local tmp=$(mktemp)
  local presigned=$(curl -s "$API/core/crawl-requests/$id/results/" \
    -H "Authorization: Bearer $TOKEN" \
    | python3 -c "import sys,json; r=json.load(sys.stdin).get('results',[]); print(r[0]['result'] if r else '')" 2>/dev/null)
  if [ -n "$presigned" ]; then
    presigned=$(echo "$presigned" | sed 's|http://localhost/|http://localhost:8765/|')
    curl -s --max-time 10 "$presigned" | python3 -c "
import sys, json
d = json.load(sys.stdin)
md = d.get('markdown', '') or d.get('content_markdown', '')
print(md)
" 2>/dev/null > "$tmp"
  fi
  echo "$tmp"
}

check_blocked() {
  local file="$1"
  for sig in "verify you are human" "please enable javascript" "checking your browser" "cf-browser-verification" "Attention Required"; do
    if grep -qi "$sig" "$file" 2>/dev/null; then
      echo "YES ($sig)"
      return 0
    fi
  done
  echo "NO"
}

INFO1=$(fetch_info "$ID1")
INFO2=$(fetch_info "$ID2")
TMP1=$(fetch_content "$ID1")
TMP2=$(fetch_content "$ID2")

SIZE1=$(wc -c < "$TMP1" 2>/dev/null || echo 0)
SIZE2=$(wc -c < "$TMP2" 2>/dev/null || echo 0)
LINES1=$(wc -l < "$TMP1" 2>/dev/null || echo 0)
LINES2=$(wc -l < "$TMP2" 2>/dev/null || echo 0)

echo "=== COMPARISON ==="
printf "%-20s | %-20s | %-20s\n" "" "$LABEL1" "$LABEL2"
echo "---------------------|----------------------|---------------------"
printf "%-20s | %-20s | %-20s\n" "Info" "$INFO1" "$INFO2"
printf "%-20s | %-20s | %-20s\n" "Size" "$SIZE1 bytes" "$SIZE2 bytes"
printf "%-20s | %-20s | %-20s\n" "Lines" "$LINES1" "$LINES2"
printf "%-20s | %-20s | %-20s\n" "Blocked" "$(check_blocked "$TMP1")" "$(check_blocked "$TMP2")"

rm -f "$TMP1" "$TMP2"
