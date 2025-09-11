#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔍 Debugging Frontend Startup Issues${NC}"
echo -e "${CYAN}====================================${NC}"
echo ""

# Stop existing services first
echo -e "${YELLOW}Stopping existing services...${NC}"
./stop.sh

# Clean up old logs
echo -e "${YELLOW}Cleaning up old logs...${NC}"
rm -f backend.log frontend.log *.pid

# Start backend first
echo -e "${BLUE}Starting backend...${NC}"
cd backend
nohup uv run python main.py > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
cd ..

# Wait for backend
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 3

if curl -s http://localhost:8000/ | grep -q "Welcome"; then
    echo -e "${GREEN}✓ Backend started successfully${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
    echo -e "${YELLOW}Backend log:${NC}"
    cat backend.log
    exit 1
fi

# Start frontend with verbose logging
echo -e "${BLUE}Starting frontend with detailed logging...${NC}"
cd frontend

# Check for TypeScript compilation issues first
echo -e "${YELLOW}Checking TypeScript compilation...${NC}"
npx tsc --noEmit --skipLibCheck 2>&1 | head -20

# Try to build first to catch compilation errors
echo -e "${YELLOW}Attempting to build frontend...${NC}"
yarn build 2>&1 | tee ../build.log | head -30

if grep -q "Failed to compile" ../build.log || grep -q "Type error" ../build.log; then
    echo -e "${RED}✗ Frontend build failed with TypeScript errors${NC}"
    echo -e "${YELLOW}Build errors:${NC}"
    grep -A 5 -B 2 -E "(Error|Failed)" ../build.log
    
    # Try to identify specific issues with our new components
    echo -e "${YELLOW}Checking CyberFace component...${NC}"
    if ! npx tsc --noEmit src/components/CyberFace.tsx 2>/dev/null; then
        echo -e "${RED}CyberFace.tsx has TypeScript errors:${NC}"
        npx tsc --noEmit src/components/CyberFace.tsx 2>&1 | head -10
    fi
    
    echo -e "${YELLOW}Checking emotion detector...${NC}"
    if ! npx tsc --noEmit src/lib/emotionDetector.ts 2>/dev/null; then
        echo -e "${RED}emotionDetector.ts has TypeScript errors:${NC}"
        npx tsc --noEmit src/lib/emotionDetector.ts 2>&1 | head -10
    fi
    
    echo -e "${YELLOW}Checking performance monitor...${NC}"
    if ! npx tsc --noEmit src/lib/performanceMonitor.ts 2>/dev/null; then
        echo -e "${RED}performanceMonitor.ts has TypeScript errors:${NC}"
        npx tsc --noEmit src/lib/performanceMonitor.ts 2>&1 | head -10
    fi
    
    echo -e "${YELLOW}Checking chat page...${NC}"
    if ! npx tsc --noEmit src/app/chat/page.tsx 2>/dev/null; then
        echo -e "${RED}chat/page.tsx has TypeScript errors:${NC}"
        npx tsc --noEmit src/app/chat/page.tsx 2>&1 | head -10
    fi
    
    cd ..
    exit 1
fi

# If build succeeds, try to start dev server
echo -e "${GREEN}✓ Build successful, starting dev server...${NC}"
echo -e "${YELLOW}Starting development server with detailed logs...${NC}"

# Start dev server in background
yarn dev --port 3000 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid

cd ..

# Monitor frontend startup
echo -e "${YELLOW}Monitoring frontend startup (30 seconds)...${NC}"
for i in {1..30}; do
    echo -n "."
    sleep 1
    
    # Check if process is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "\n${RED}✗ Frontend process died${NC}"
        echo -e "${YELLOW}Frontend log:${NC}"
        cat frontend.log
        exit 1
    fi
    
    # Check if server is ready
    if curl -s http://localhost:3000/ >/dev/null 2>&1; then
        echo -e "\n${GREEN}✓ Frontend is responding${NC}"
        break
    fi
    
    # Check for specific error patterns
    if grep -q "Error:" frontend.log; then
        echo -e "\n${RED}✗ Runtime error detected${NC}"
        echo -e "${YELLOW}Error details:${NC}"
        grep -A 5 -B 2 "Error:" frontend.log
        exit 1
    fi
    
    if [ $i -eq 30 ]; then
        echo -e "\n${RED}✗ Frontend timeout${NC}"
        echo -e "${YELLOW}Frontend log:${NC}"
        tail -50 frontend.log
        exit 1
    fi
done

# Test frontend response
echo -e "${YELLOW}Testing frontend response...${NC}"
response=$(curl -s http://localhost:3000/)

if echo "$response" | grep -q "Internal Server Error"; then
    echo -e "${RED}✗ Frontend returning 500 error${NC}"
    echo -e "${YELLOW}Server logs:${NC}"
    tail -30 frontend.log
    
    # Check for Next.js specific errors
    if grep -q "Unhandled Runtime Error" frontend.log; then
        echo -e "${RED}Unhandled Runtime Error found:${NC}"
        grep -A 10 -B 2 "Unhandled Runtime Error" frontend.log
    fi
    
elif echo "$response" | grep -q "<!DOCTYPE html>"; then
    echo -e "${GREEN}✓ Frontend is serving HTML correctly${NC}"
    
    # Test chat page specifically
    echo -e "${YELLOW}Testing chat page...${NC}"
    chat_response=$(curl -s http://localhost:3000/chat)
    
    if echo "$chat_response" | grep -q "Internal Server Error"; then
        echo -e "${RED}✗ Chat page has errors${NC}"
        echo -e "${YELLOW}Checking for component-specific errors...${NC}"
        tail -50 frontend.log | grep -E "(CyberFace|MatrixRain|emotionDetector|three)"
    else
        echo -e "${GREEN}✓ Chat page is working${NC}"
        echo -e "${GREEN}🎉 All services are running correctly!${NC}"
        echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
        echo -e "${BLUE}Chat: http://localhost:3000/chat${NC}"
        echo -e "${BLUE}Backend: http://localhost:8000${NC}"
    fi
else
    echo -e "${RED}✗ Unexpected frontend response${NC}"
    echo "Response (first 200 chars): ${response:0:200}"
fi

echo ""
echo -e "${CYAN}Debug Information:${NC}"
echo -e "${YELLOW}PIDs: Backend=$BACKEND_PID, Frontend=$FRONTEND_PID${NC}"
echo -e "${YELLOW}Logs: backend.log, frontend.log, build.log${NC}"