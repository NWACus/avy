#!/bin/bash

eas branch:list --json --non-interactive \
| jq '.[] | del(.updates)| select( .name | startswith("xxx-pr-")) | .name' -r \
| xargs -n 1 -I {} sh -c "eas channel:delete --non-interactive {}; eas branch:delete --non-interactive {}"
