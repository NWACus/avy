#!/bin/bash

echo "🧹 Running ESLint..."
if ! eslint --max-warnings=0 .; then
    echo
    echo "⚠️  ESLint failed"
    echo
    exit 1
fi
