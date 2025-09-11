#!/bin/bash

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

echo -e "${BLUE}=== Stopping Mars Training System ===${NC}"

# --- Stop services using PID files ---
stop_service_by_pid() {
    local pid_file=$1
    local name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"
            kill -15 "$pid"
            sleep 2
            
            # Check if still running and force kill if needed
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${RED}Force killing $name (PID: $pid)...${NC}"
                kill -9 "$pid"
            fi
            echo -e "${GREEN}✓ $name stopped${NC}"
        else
            echo -e "${YELLOW}$name process (PID: $pid) not found${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}No PID file found for $name${NC}"
    fi
}

# --- Stop by port if PID method fails ---
stop_by_port() {
    local port=$1
    local name=$2
    
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}Stopping $name processes on port $port...${NC}"
        echo "$pids" | xargs --no-run-if-empty kill -15
        sleep 2
        
        # Force kill if still running
        local remaining_pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            echo -e "${RED}Force killing $name processes on port $port...${NC}"
            echo "$remaining_pids" | xargs --no-run-if-empty kill -9
        fi
        echo -e "${GREEN}✓ All $name processes on port $port stopped${NC}"
    else
        echo -e "${GREEN}✓ No processes found on port $port${NC}"
    fi
}

# Stop services
stop_service_by_pid "$BACKEND_PID_FILE" "Backend"
stop_service_by_pid "$FRONTEND_PID_FILE" "Frontend"

# Fallback: stop by port
echo -e "${YELLOW}Checking for any remaining processes on ports...${NC}"
stop_by_port $BACKEND_PORT "Backend"
stop_by_port $FRONTEND_PORT "Frontend"

echo -e "${GREEN}=== All services stopped ===${NC}"