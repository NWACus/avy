#!/bin/bash

echo "⚙️  Checking typescript..."
if ! yarn tsc; then
    echo
    echo "⚠️  Typescript compilation failed"
    echo
    exit 1
fi
