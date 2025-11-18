#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <.env.example> <.env>" >&2
  exit 1
fi

EXAMPLE_FILE="$1"
ENV_FILE="$2"

if [[ ! -f "$EXAMPLE_FILE" ]]; then
  echo "Missing example file: $EXAMPLE_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

extract_keys() {
  local file="$1"
  grep -v '^#' "$file" | grep -E '^[A-Za-z0-9_]+\s*=' | sed 's/[[:space:]]*=[[:space:]]*.*$//' | sort -u
}

example_keys=$(extract_keys "$EXAMPLE_FILE")
env_keys=$(extract_keys "$ENV_FILE")

diff_output=$(comm -3 <(echo "$example_keys") <(echo "$env_keys")) || true

if [[ -n "$diff_output" ]]; then
  echo "Environment keys mismatch between $EXAMPLE_FILE and $ENV_FILE:" >&2
  echo "$diff_output" >&2
  exit 1
fi

echo "Environment files in sync: $EXAMPLE_FILE vs $ENV_FILE"
