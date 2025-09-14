#!/bin/bash

# Quick Start Script for Cyber Face Website
# Usage: ./dev.sh

PORT=3000
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting Cyber Face Website...${NC}"

# Kill any process using port 3000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚡ Clearing port $PORT...${NC}"
    lsof -Pi :$PORT -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    yarn install
fi

echo -e "${GREEN}✨ Server starting at http://localhost:$PORT${NC}"
echo -e "${GREEN}   Press Ctrl+C to stop${NC}"
echo ""

# Start the development server
yarn dev