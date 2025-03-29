#!/bin/bash

REPO="watercrawl/watercrawl"  # <-- Change this

LABELS_FILE=".github/labels.yml"

# Loop through each label in YAML
yq -o=json eval '.[]' "$LABELS_FILE" | jq -c '. | {
  name: .name,
  color: .color,
  description: .description
}' | while read -r label; do
  name=$(echo "$label" | jq -r '.name')
  color=$(echo "$label" | jq -r '.color')
  desc=$(echo "$label" | jq -r '.description')

  # Try to create or update
  echo "🔁 Syncing label: $name"
  if gh label list -R "$REPO" | grep -Fq "$name"; then
    gh label edit "$name" -R "$REPO" --color "$color" --description "$desc"
  else
    gh label create "$name" -R "$REPO" --color "$color" --description "$desc"
  fi
done
