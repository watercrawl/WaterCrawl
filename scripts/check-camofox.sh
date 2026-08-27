#!/bin/bash
# Check Camofox browser health: connectivity, open tabs, memory usage.
# Set CAMOFOX_URL to override the default (http://localhost:9377).
set -euo pipefail

CAMOFOX_URL="${CAMOFOX_URL:-http://localhost:9377}"

echo "=== CAMOFOX HEALTH ==="
HEALTH=$(curl -s "$CAMOFOX_URL/health" 2>&1 || echo '{"ok":false,"error":"unreachable"}')
echo "$HEALTH" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'  OK:              {d.get(\"ok\", False)}')
print(f'  Engine:          {d.get(\"engine\", \"?\")}')
print(f'  Browser running: {d.get(\"browserConnected\", \"?\")}')
print(f'  Active tabs:     {d.get(\"activeTabs\", \"?\")}')
print(f'  Active sessions: {d.get(\"activeSessions\", \"?\")}')
print(f'  Failures:        {d.get(\"consecutiveFailures\", \"?\")}')
print(f'  Memory RSS:      {d.get(\"memory\", {}).get(\"rssMb\", \"?\")} MB')
" 2>/dev/null

echo ""
echo "=== ORPHAN TABS ==="
TABS=$(curl -s "$CAMOFOX_URL/tabs?userId=watercrawl" 2>&1 || echo '{"tabs":[]}')
NB=$(echo "$TABS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('tabs',[])))" 2>/dev/null || echo "?")

if [ "$NB" = "0" ]; then
  echo "  No orphan tabs"
elif [ "$NB" != "?" ]; then
  echo "  WARNING: $NB orphan tab(s) detected!"
  echo "$TABS" | python3 -m json.tool 2>/dev/null
else
  echo "  Unable to list tabs"
fi
