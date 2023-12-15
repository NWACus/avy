#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

function usage() {
  missing="$1";
  echo "[ERROR] \$${missing} is required."
  echo "$0: desribe the contents of the latest OTA in a channel."
  echo "CHANNEL=<preview|release> ${0}"
  exit 1
}

if [[ -z "${CHANNEL:-}" ]]; then
  usage 'CHANNEL'
fi

# first, let's grab the two latest updates
updates="$( eas update:list --branch "${CHANNEL}" --limit "2" --json --non-interactive )"

function commit_for_update() {
  updates="$1"
  index="$2"

  update_group="$( jq <<<"${updates}" --raw-output --argjson index "${index}" '.currentPage[$index].group')";
  update="$( eas update:view "${update_group}" --json )"
  update_commit="$( jq <<<"${update}" --raw-output '.[0].gitCommitHash' )";
  echo "${update_commit}"
}

latest_commit="$( commit_for_update "${updates}" "0" )"
previous_commit="$( commit_for_update "${updates}" "1" )"

git log --no-merges --oneline --pretty="%h %s" "${previous_commit}...${latest_commit}"