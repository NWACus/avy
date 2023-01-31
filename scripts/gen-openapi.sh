#!/bin/bash
set -o errexit
set -o nounset
set -o pipefail

# Download Snowbounds published API and fix it up locally
tmpfile="$(mktemp /tmp/openapi.XXXXXX)"

function cleanup() {
    rm -rf "${tmpfile}"
}

trap EXIT cleanup

npx ts-node "scripts/getSnowboundOpenAPISpec.ts" > "$tmpfile"

# Generate TS type definitions from Snowbound's published API
yarn openapi \
    --input "${tmpfile}" \
    --output ./types/generated/snowbound \
    --client axios \
    --indent 2 \
    --useOptions
