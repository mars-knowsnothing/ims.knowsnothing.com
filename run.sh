#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
FRONTEND_PORT=3000
BACKEND_PORT=8000
BACKEND_PID_FILE="backend.pid"
FRONTEND_PID_FILE="frontend.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Mars Training System Startup ===${NC}"

# --- Run Setup ---
echo -e "${YELLOW}Running setup script...${NC}"
./setup.sh
echo -e "${GREEN}✓ Setup completed${NC}"

# --- Port Cleanup Function ---
cleanup_port() {
    local port=$1
    local name=$2
    echo -e "${YELLOW}Checking for existing processes on port $port...${NC}"
    
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}Found running processes on port $port. Stopping them...${NC}"
        echo "$pids" | xargs --no-run-if-empty kill -15
        sleep 2
        # Force kill if still running
        local remaining_pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            echo -e "${RED}Force killing processes on port $port...${NC}"
            echo "$remaining_pids" | xargs --no-run-if-empty kill -9
        fi
        echo -e "${GREEN}✓ Port $port cleaned up${NC}"
    else
        echo -e "${GREEN}✓ Port $port is available${NC}"
    fi
}

# --- Health Check Function ---
wait_for_service() {
    local port=$1
    local name=$2
    local timeout=30
    local count=0
    
    echo -e "${YELLOW}Waiting for $name to start on port $port...${NC}"
    
    while [ $count -lt $timeout ]; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name is running on port $port${NC}"
            return 0
        fi
        count=$((count + 1))
        sleep 1
        echo -n "."
    done
    
    echo -e "${RED}✗ $name failed to start on port $port within $timeout seconds${NC}"
    return 1
}

# --- Cleanup existing processes ---
cleanup_port $BACKEND_PORT "Backend"
cleanup_port $FRONTEND_PORT "Frontend"

# Remove old PID files
rm -f $BACKEND_PID_FILE $FRONTEND_PID_FILE

# --- Start Backend Server ---
echo -e "${BLUE}Starting backend server on port $BACKEND_PORT...${NC}"
if [ -f "backend/requirements.txt" ]; then
    (cd backend && nohup uv run python main.py > ../backend.log 2>&1 & echo $! > ../$BACKEND_PID_FILE)
else
    echo -e "${RED}✗ Backend requirements.txt not found${NC}"
    exit 1
fi

# --- Start Frontend Server ---
echo -e "${BLUE}Starting frontend server on port $FRONTEND_PORT...${NC}"
if [ -f "frontend/package.json" ]; then
    (cd frontend && nohup yarn dev --port $FRONTEND_PORT > ../frontend.log 2>&1 & echo $! > ../$FRONTEND_PID_FILE)
else
    echo -e "${RED}✗ Frontend package.json not found${NC}"
    exit 1
fi

# --- Service Health Checks ---
echo -e "${BLUE}Performing health checks...${NC}"

# Wait for backend
if wait_for_service $BACKEND_PORT "Backend API"; then
    # Test backend endpoints
    echo -e "${YELLOW}Testing backend endpoints...${NC}"
    if curl -s "http://localhost:$BACKEND_PORT/" | grep -q "Welcome to the API"; then
        echo -e "${GREEN}✓ Backend root endpoint working${NC}"
    fi
    if curl -s "http://localhost:$BACKEND_PORT/posts" > /dev/null; then
        echo -e "${GREEN}✓ Backend posts endpoint working${NC}"
    fi
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo -e "${YELLOW}Backend Error Log:${NC}"
    tail -20 backend.log
    exit 1
fi

# Wait for frontend
if wait_for_service $FRONTEND_PORT "Frontend"; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend health check failed${NC}"
    echo -e "${YELLOW}Frontend Error Log:${NC}"
    tail -20 frontend.log
    echo -e "${YELLOW}Checking for frontend compilation errors...${NC}"
    if grep -q "Error:" frontend.log; then
        echo -e "${RED}Frontend compilation errors found:${NC}"
        grep -A 5 -B 5 "Error:" frontend.log
    fi
    if grep -q "Failed to compile" frontend.log; then
        echo -e "${RED}Frontend compilation failed:${NC}"
        grep -A 10 -B 5 "Failed to compile" frontend.log
    fi
    exit 1
fi

# --- Service Information ---
echo -e "${GREEN}=== Services Started Successfully ===${NC}"
echo -e "${BLUE}Frontend:${NC} http://localhost:$FRONTEND_PORT"
echo -e "${BLUE}Backend API:${NC} http://localhost:$BACKEND_PORT"
echo -e "${BLUE}API Documentation:${NC} http://localhost:$BACKEND_PORT/docs"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo -e "  Backend: ${BLUE}backend.log${NC}"
echo -e "  Frontend: ${BLUE}frontend.log${NC}"
echo ""
echo -e "${YELLOW}PIDs:${NC}"
if [ -f $BACKEND_PID_FILE ]; then
    echo -e "  Backend PID: ${BLUE}$(cat $BACKEND_PID_FILE)${NC}"
fi
if [ -f $FRONTEND_PID_FILE ]; then
    echo -e "  Frontend PID: ${BLUE}$(cat $FRONTEND_PID_FILE)${NC}"
fi
echo ""
echo -e "${YELLOW}To stop services:${NC}"
echo -e "  Kill processes: ${BLUE}./stop.sh${NC} (if available) or use PIDs above"
echo -e "  Or run: ${BLUE}lsof -ti:$FRONTEND_PORT,$BACKEND_PORT | xargs kill${NC}"
