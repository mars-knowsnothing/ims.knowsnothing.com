#!/bin/bash

# Exit on any error
set -e

# Function to kill any process running on a specific port
kill_process_on_port() {
  PORT=$1
  echo "Checking for process on port $PORT..."
  PID=$(lsof -t -i:$PORT)
  if [ ! -z "$PID" ]; then
    echo "Killing process $PID on port $PORT"
    kill -9 $PID
  else
    echo "No process found on port $PORT."
  fi
}

# Kill processes on ports 3000 and 8000 before starting servers
kill_process_on_port 3000
kill_process_on_port 8000

# --- Backend Setup ---
echo "--- Setting up backend ---"

# Check if uv is installed, if not, install it
if ! command -v uv &> /dev/null
then
    echo "uv could not be found, installing..."
    pip install uv
fi

# Create a virtual environment only if it doesn't exist
if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  uv venv
fi

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
  if [ ! -f ".env" ]; then
    cp .env.example .env
  fi
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
npm run dev > ../frontend.log 2>&1 &
