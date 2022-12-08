#!/bin/bash

echo "🎨  Checking prettier format..."
if ! yarn prettier --check .; then
    echo
    echo "⚠️  Run 'yarn prettify' to fix prettier errors & commit the result"
    echo
    exit 1
fi

echo "⚙️  Checking typescript..."
if ! yarn tsc; then
    echo
    echo "⚠️  Typescript compilation failed"
    echo
    exit 1
fi


echo "👊  CI checks succeeded!"
