#!/bin/bash
# Obtain a JWT token from the WaterCrawl API.
# Set WATERCRAWL_API, WATERCRAWL_EMAIL, WATERCRAWL_PASSWORD to override defaults.
set -euo pipefail

API="${WATERCRAWL_API:-http://localhost:8765/api/v1}"
EMAIL="${WATERCRAWL_EMAIL:-admin@test.com}"
PASSWORD="${WATERCRAWL_PASSWORD:-admin123}"

TOKEN=$(curl -s --max-time 5 -X POST "$API/user/auth/login/" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "ERROR: login failed for $EMAIL"
  echo "Check WATERCRAWL_API=$API"
  echo "Make sure the account exists with the correct password"
  exit 1
fi

echo "$TOKEN"
