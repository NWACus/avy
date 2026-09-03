#!/bin/bash

# Enforces ordering constraints between Expo config plugins in app.json.
# Expo applies plugins in array order, so plugins that our own plugins depend on
# (or that would clobber our changes) must be listed in a specific position.

BEFORE="./plugins/withAndroidSplashBranding"
AFTER="expo-splash-screen"
CONFIG="${1:-app.json}"

echo "🔌  Checking config plugin order in $CONFIG..."

if ! command -v jq > /dev/null 2>&1; then
    echo
    echo "⚠️  jq is required by scripts/ci-check-plugin-integrity.sh but was not found on PATH"
    echo
    exit 1
fi

if ! jq --arg before "$BEFORE" --arg after "$AFTER" '
    # A plugin entry is either "name" or ["name", {...options}]
    def plugin_name: if type == "array" then .[0] else . end;

    (.expo.plugins // [] | map(plugin_name)) as $names
    | ($names | index($before)) as $before_index
    | ($names | index($after)) as $after_index
    | if $before_index == null then
        "\($before) is missing from expo.plugins\n" | halt_error(1)
      elif $after_index == null then
        "\($after) is missing from expo.plugins\n" | halt_error(1)
      elif $before_index > $after_index then
        "\($before) is at index \($before_index) but must come before \($after) at index \($after_index)\n" | halt_error(1)
      else
        empty
      end
' "$CONFIG"; then
    echo
    echo "⚠️  Plugin integrity check failed"
    echo "   In app.json, expo.plugins must list '$BEFORE' before '$AFTER'."
    echo
    exit 1
fi
