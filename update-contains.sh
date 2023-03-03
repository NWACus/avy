#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

function usage() {
  missing="$1";
  echo "[ERROR] \$${missing} is required."
  echo "$0: check to see the relationship of a commit to the update."
  echo "For instance, determine if a specific update introduced a commit"
  echo "to users on that platform, or if the channel already contained it."
  echo "PLATFORM=<ios|android> CHANNEL=<preview|release> GROUP_ID=<uuid> UPDATE_ID=<uuid> COMMIT=<sha> ${0}"
  exit 1
}

if [[ -z "${PLATFORM:-}" ]]; then
  usage 'PLATFORM'
fi
if [[ -z "${CHANNEL:-}" ]]; then
  usage 'CHANNEL'
fi
if [[ -z "${GROUP_ID:-}" ]]; then
  usage 'GROUP_ID'
fi
if [[ -z "${UPDATE_ID:-}" ]]; then
  usage 'UPDATE_ID'
fi
if [[ -z "${COMMIT:-}" ]]; then
  usage 'COMMIT'
fi

# let's check the degenerate case that the commit we're searching for is not even in the branch to save us some time
if [[ -z "$( git branch "${CHANNEL}" --contains "${COMMIT}" )" ]]; then
  echo "[ERROR] The ${CHANNEL} branch doesn't contain commit ${COMMIT}!"
  exit 1
fi

# first, let's get the history of updates to this channel until we find the update we need
overall_limit=50;
page_size=10;
offset=0;
previous_update_group='';
while true; do
  updates="$( eas update:list --branch "${CHANNEL}" --limit "${page_size}" --offset "${offset}" --json --non-interactive )"
  update_index="$( jq <<<"${updates}" --raw-output --arg GROUP_ID "${GROUP_ID}" '.currentPage | map(.group == $GROUP_ID) | index(true)')"
  if [[ "${update_index}" != "null" ]]; then
    # found the update in this page - however, we might need the next page to find the previous update
    if (( update_index + 1 == page_size )); then
      # we need to fetch the next page to find the previous update
      offset=$(( offset + page_size - 1 ));
      continue;
    else
      previous_update_group="$( jq <<<"${updates}" --raw-output --argjson index "$(( update_index + 1 ))" '.currentPage[$index].group')";
      break;
    fi
  fi
  # could not find the update in this page, continue
  offset=$(( offset + page_size ));
  if (( overall_limit >= offset )); then
    echo "[ERROR] Could not find update group ${GROUP_ID} in the first ${offset} updates, quitting..."
    exit 1
  fi
done

update="$( eas update:view "${GROUP_ID}" --json )"
update_commit="$( jq <<<"${update}" --raw-output --arg id "${UPDATE_ID}" '.[] | select(.id == $id) | .gitCommitHash' )";
echo "[INFO] Found update (${UPDATE_ID}) in group (${GROUP_ID}) published from commit (${update_commit})."

previous_update="$( eas update:view "${previous_update_group}" --json )"
previous_update_commit="$( jq <<<"${previous_update}" --raw-output --arg platform "${PLATFORM}" '.[] | select(.platform == $platform) | .gitCommitHash' )";
previous_update_id="$( jq <<<"${previous_update}" --raw-output --arg platform "${PLATFORM}" '.[] | select(.platform == $platform) | .id' )";
echo "[INFO] The previous update (${previous_update_id}) in group (${previous_update_group}) was published from commit (${previous_update_commit})."

# we have a couple of cases, now:
# - the commit we are searching for is not in the branch (checked above)
# - the commit we are searching for came before the previous update
if git merge-base --is-ancestor "${COMMIT}" "${previous_update_commit}"; then
  echo "[INFO] Commit ${COMMIT} was introduced to the ${CHANNEL} channel before the previous update."
  exit 0
fi
# - the commit we are searching for came between the update in question and the previous one
if git merge-base --is-ancestor "${COMMIT}" "${update_commit}"; then
  echo "[INFO] Commit ${COMMIT} was introduced to the ${CHANNEL} channel in the specified update (${UPDATE_ID}) in group (${GROUP_ID})."
  exit 0
fi
# - the commit we are searching for came after the update in question
if git merge-base --is-ancestor "${update_commit}" "${COMMIT}"; then
  echo "[INFO] Commit ${COMMIT} was introduced to the ${CHANNEL} channel after the specified update (${UPDATE_ID}) in group (${GROUP_ID})."
  exit 0
fi
