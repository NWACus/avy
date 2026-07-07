#!/usr/bin/env bash
#
# Idempotent environment setup for running Avy (Expo) in the Alloy sandbox.
#
# The Avy app is designed to boot for local development with an essentially
# empty .env file (see CONTRIBUTING.md: "For development with Expo Go, you
# should be able to run the app with an empty .env file"). This script makes
# sure a .env exists and fills in only local-dev-safe defaults for values that
# are required to boot. It never overwrites user-provided, non-placeholder
# values.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

touch "$ENV_FILE"

# get_env KEY -> prints current value from process env or the .env file
current_value() {
  local key="$1"
  # Process env takes precedence
  if [[ -n "${!key:-}" ]]; then
    printf '%s' "${!key}"
    return 0
  fi
  # Fall back to any value already present in the .env file
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n1 || true)"
  if [[ -n "$line" ]]; then
    printf '%s' "${line#*=}"
  fi
}

is_placeholder() {
  # blank or common placeholder tokens are considered "unset"
  local v="$1"
  [[ -z "$v" || "$v" == "changeme" || "$v" == "REPLACE_ME" || "$v" == "LOADED_FROM_ENVIRONMENT" ]]
}

# set_default KEY DEFAULT -> only writes if not already set to a real value
set_default() {
  local key="$1" default="$2" existing
  existing="$(current_value "$key")"
  if ! is_placeholder "$existing"; then
    # Keep the real value; make sure it's reflected in the file.
    if ! grep -qE "^${key}=" "$ENV_FILE"; then
      printf '%s=%s\n' "$key" "$existing" >> "$ENV_FILE"
    fi
    return 0
  fi
  if grep -qE "^${key}=" "$ENV_FILE"; then
    # Replace the existing (placeholder/blank) line in place.
    local tmp
    tmp="$(mktemp)"
    grep -vE "^${key}=" "$ENV_FILE" > "$tmp"
    mv "$tmp" "$ENV_FILE"
  fi
  printf '%s=%s\n' "$key" "$default" >> "$ENV_FILE"
}

# Local-dev-safe defaults. These are optional integrations that the app tolerates
# being empty in development.
set_default SENTRY_AUTH_TOKEN ""
set_default EXPO_PUBLIC_SENTRY_DSN ""
set_default EXPO_PUBLIC_POSTHOG_API_KEY ""

# Mapbox access token. The app reads MAPBOX_API_KEY (see app.config.ts). Accept
# any of the common env var names a Mapbox token might be provided under so the
# real token flows into .env when the sandbox has one; otherwise fall back to an
# empty value (the web preview renders empty map containers without a token).
MAPBOX_TOKEN_VALUE="${MAPBOX_API_KEY:-${EXPO_PUBLIC_MAPBOX_API_KEY:-${MAPBOX_ACCESS_TOKEN:-${MAPBOX_PUBLIC_TOKEN:-${MAPBOX_DOWNLOAD_TOKEN:-}}}}}"
set_default MAPBOX_API_KEY "$MAPBOX_TOKEN_VALUE"

# Keep on-screen error/warning boxes suppressed so the web preview renders
# cleanly even when optional forecast data is missing.
set_default EXPO_PUBLIC_DISABLE_LOGBOX "1"

# Expose the Alloy runtime flag to the app if it wants to branch on it.
set_default IS_ALLOY "${IS_ALLOY:-true}"

echo "populate-env.sh: .env is ready at $ENV_FILE"
