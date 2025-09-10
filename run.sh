#!/bin/bash

# Exit on any error
set -e

# --- Backend Setup ---
echo "--- Setting up backend ---"

# Check if uv is installed, if not, install it
if ! command -v uv &> /dev/null
then
    echo "uv could not be found, installing..."
    pip install uv
fi

# Create a virtual environment
uv venv

# Activate the virtual environment
source .venv/bin/activate

# Install backend dependencies
cd backend
uv pip install -r requirements.txt
cd ..

# Start the backend server in the background
echo "--- Starting backend server ---"
(
  source .venv/bin/activate
  cd backend
  cp .env.example .env
  echo "Starting backend server on http://localhost:8000"
  uvicorn main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
)


# --- Frontend Setup ---
echo "--- Setting up frontend ---"
cd frontend

# Install frontend dependencies
if [ -f "yarn.lock" ]; then
    yarn install
else
    npm install
fi

# Start the frontend server
echo "--- Starting frontend server ---"
echo "Starting frontend server on http://localhost:3000"
npm run dev
