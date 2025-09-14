#!/bin/bash

# Stop Script for Cyber Face Website
# Usage: ./stop.sh

PORT=3000
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}🛑 Stopping Cyber Face Website...${NC}"

# Kill any process using port 3000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}⚡ Stopping server on port $PORT...${NC}"
    lsof -Pi :$PORT -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
    sleep 1

    if ! lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Server stopped successfully${NC}"
    else
        echo -e "${RED}❌ Failed to stop server${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ No server running on port $PORT${NC}"
fi