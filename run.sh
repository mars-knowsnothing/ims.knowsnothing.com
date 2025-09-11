#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Run Setup ---
echo "Running setup script..."
./setup.sh

# --- Port Configuration ---
FRONTEND_PORT=3000
BACKEND_PORT=8000

# --- Kill Existing Processes ---
echo "Checking for existing processes on ports $FRONTEND_PORT and $BACKEND_PORT..."
lsof -ti:$FRONTEND_PORT | xargs --no-run-if-empty kill -9
lsof -ti:$BACKEND_PORT | xargs --no-run-if-empty kill -9

# --- Start Backend Server ---
echo "Starting backend server on port $BACKEND_PORT..."
(cd backend && uv uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT > ../backend.log 2>&1 &)

# --- Start Frontend Server ---
echo "Starting frontend server on port $FRONTEND_PORT..."
(cd frontend && yarn dev --port $FRONTEND_PORT > ../frontend.log 2>&1 &)

echo "Servers started."
echo "Backend logs: backend.log"
echo "Frontend logs: frontend.log"
