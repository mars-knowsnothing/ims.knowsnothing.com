#!/bin/bash

# Backend stop script for Anonymous Chat
# This script stops any FastAPI backend processes on port 8000

echo "🛑 Stopping Anonymous Chat Backend..."

# Kill any processes using port 8000
PORT_PID=$(lsof -ti:8000)
if [ ! -z "$PORT_PID" ]; then
    echo "   Found process(es) using port 8000: $PORT_PID"
    echo "   Stopping processes..."
    kill -TERM $PORT_PID 2>/dev/null || true
    sleep 2

    # Force kill if still running
    PORT_PID=$(lsof -ti:8000)
    if [ ! -z "$PORT_PID" ]; then
        echo "   Force killing processes..."
        kill -9 $PORT_PID 2>/dev/null || true
    fi

    echo "   ✅ Backend stopped"
else
    echo "   ✅ No backend processes found on port 8000"
fi

echo "🎭 Anonymous Chat Backend stopped successfully!"