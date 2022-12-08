#!/bin/bash

echo "🎨  Checking prettier format..."
if ! yarn prettier --check .; then
    echo
    echo "⚠️  Run 'yarn prettify' to fix prettier errors & commit the result"
    echo
    exit 1
fi
