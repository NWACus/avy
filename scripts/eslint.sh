#!/bin/bash

echo "🧹 Running ESLint..."
if ! yarn eslint --report-unused-disable-directives --max-warnings=0 .; then
    echo
    echo "⚠️  ESLint failed"
    echo
    exit 1
fi
