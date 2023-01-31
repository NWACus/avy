# Download Snowbounds published API and fix it up locally
tmpfile=$(mktemp /tmp/openapi.XXXXXX)
./scripts/getSnowboundOpenAPISpec > $tmpfile

# Generate TS type definitions from Snowbound's published API
yarn openapi \
    --input "${tmpfile}" \
    --output ./types/generated/snowbound \
    --client axios \
    --indent 2 \
    --useOptions
