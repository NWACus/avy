#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

if [[ -z "${IOS_USER_ID:-}" ]]; then
  echo "[ERROR] \$IOS_USER_ID is required."
  exit 1
fi
if [[ -z "${IOS_TEAM_ID:-}" ]]; then
  echo "[ERROR] \$IOS_TEAM_ID is required."
  exit 1
fi
if [[ -z "${IOS_APP_ID:-}" ]]; then
  echo "[ERROR] \$IOS_APP_ID is required."
  exit 1
fi
if [[ -z "${PROFILE:-}" ]]; then
  echo "[ERROR] \$PROFILE is required."
  exit 1
fi
if [[ -z "${PLATFORM:-}" ]]; then
  echo "[ERROR] \$PLATFORM is required."
  exit 1
fi

function cleanup() {
  mv eas.json.tmpl eas.json
}
trap cleanup EXIT

mv eas.json eas.json.tmpl
jq  < eas.json.tmpl > eas.json \
  --arg IOS_USER_ID "${IOS_USER_ID}" \
  --arg IOS_TEAM_ID "${IOS_TEAM_ID}" \
  --arg IOS_APP_ID "${IOS_APP_ID}" \
  '.submit.release.ios={appleId:$IOS_USER_ID,appleTeamId:$IOS_TEAM_ID,ascAppId:$IOS_APP_ID} | .submit.preview.ios=.submit.release.ios'

set -o xtrace
EXPO_PUBLIC_GIT_REVISION=$(git rev-parse --short HEAD) eas build --non-interactive --platform "${PLATFORM}" --profile "${PROFILE}" --auto-submit
set +o xtrace
