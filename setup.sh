#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Backend Dependencies ---
echo "Installing backend dependencies..."
# Ensure uv is installed
if ! command -v uv &> /dev/null
then
    echo "uv could not be found, please install it first."
    echo "See https://github.com/astral-sh/uv for installation instructions."
    exit 1
fi
uv pip install -r backend/requirements.txt

# --- Frontend Dependencies ---
echo "Installing frontend dependencies..."
(cd frontend && yarn)

echo "Setup complete."
