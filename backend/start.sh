#!/bin/bash

# Backend startup script for Anonymous Chat
# This script starts the FastAPI backend using uv

echo "🎭 Starting Anonymous Chat Backend..."

# Check if .env file exists and load it
if [ -f .env ]; then
    echo "📦 Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
else
    echo "⚠️  Warning: No .env file found. Create one with your GOOGLE_API_KEY"
    echo "   Example: echo 'GOOGLE_API_KEY=your_key_here' > .env"
fi

# Check if GOOGLE_API_KEY is set
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "❌ Error: GOOGLE_API_KEY environment variable is not set"
    echo "   Please set your Google API key:"
    echo "   export GOOGLE_API_KEY=your_key_here"
    echo "   Or create a .env file with: GOOGLE_API_KEY=your_key_here"
    exit 1
fi

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed"
    echo "   Please install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "🔧 Creating virtual environment..."
    uv venv
fi

# Install dependencies
echo "📚 Installing dependencies..."
uv sync

# Clean up any existing processes on port 8000
echo "🧹 Cleaning up port 8000..."
PORT_PID=$(lsof -ti:8000)
if [ ! -z "$PORT_PID" ]; then
    echo "   Found process(es) using port 8000: $PORT_PID"
    echo "   Killing existing processes..."
    kill -9 $PORT_PID 2>/dev/null || true
    sleep 1
    echo "   ✅ Port 8000 cleaned up"
else
    echo "   ✅ Port 8000 is available"
fi

# Clear rate limits from database
echo "🗂️  Clearing rate limits from database..."
uv run python clear_rate_limits.py

# Start the server
echo "🚀 Starting FastAPI server on http://localhost:8000"
echo "📖 API Documentation: http://localhost:8000/docs"
echo "🔍 Health Check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the server with uv
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload