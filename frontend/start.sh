#!/bin/bash

# Cyber Face Website Startup Script
# Checks and clears port conflicts before starting the development server

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PORT=3000
PROJECT_NAME="Cyber Face Website"

# Banner
echo -e "${CYAN}┌─────────────────────────────────────┐${NC}"
echo -e "${CYAN}│        ${GREEN}${PROJECT_NAME}${CYAN}         │${NC}"
echo -e "${CYAN}│     Smart Startup Script v1.0      │${NC}"
echo -e "${CYAN}└─────────────────────────────────────┐${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on port
kill_port() {
    local port=$1
    print_warning "Killing processes on port $port..."

    # Get PIDs using the port
    local pids=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null || echo "")

    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 2

        # Double check if port is still in use
        if check_port $port; then
            print_error "Failed to free port $port. Manual intervention required."
            exit 1
        else
            print_success "Port $port cleared successfully"
        fi
    fi
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    # Check if Yarn is installed
    if ! command -v yarn &> /dev/null; then
        print_error "Yarn is not installed. Please install Yarn first."
        exit 1
    fi

    print_success "System requirements satisfied"
    echo "  Node.js: $(node --version)"
    echo "  Yarn: $(yarn --version)"
    echo ""
}

# Function to check project structure
check_project() {
    print_status "Verifying project structure..."

    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi

    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        yarn install
    fi

    if [ ! -d "src" ]; then
        print_error "src directory not found. Invalid project structure."
        exit 1
    fi

    print_success "Project structure verified"
    echo ""
}

# Function to handle port conflicts
handle_port_conflicts() {
    print_status "Checking port $PORT availability..."

    if check_port $PORT; then
        print_warning "Port $PORT is currently in use"

        # Show what's using the port
        local process_info=$(lsof -Pi :$PORT -sTCP:LISTEN 2>/dev/null || echo "Unknown process")
        echo -e "${YELLOW}Process using port $PORT:${NC}"
        echo "$process_info"
        echo ""

        # Ask user what to do
        echo -e "${CYAN}Options:${NC}"
        echo "  1) Kill the process and continue"
        echo "  2) Use a different port"
        echo "  3) Exit"
        echo ""

        read -p "Choose an option (1-3): " choice

        case $choice in
            1)
                kill_port $PORT
                ;;
            2)
                read -p "Enter new port number: " new_port
                if [[ "$new_port" =~ ^[0-9]+$ ]] && [ "$new_port" -ge 1000 ] && [ "$new_port" -le 65535 ]; then
                    PORT=$new_port
                    print_status "Using port $PORT"
                    # Check the new port too
                    if check_port $PORT; then
                        print_warning "Port $PORT is also in use"
                        kill_port $PORT
                    fi
                else
                    print_error "Invalid port number"
                    exit 1
                fi
                ;;
            3)
                print_status "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid choice"
                exit 1
                ;;
        esac
    else
        print_success "Port $PORT is available"
    fi
    echo ""
}

# Function to start the development server
start_server() {
    print_status "Starting development server..."
    echo -e "${GREEN}┌─────────────────────────────────────┐${NC}"
    echo -e "${GREEN}│              STARTING               │${NC}"
    echo -e "${GREEN}│         Development Server          │${NC}"
    echo -e "${GREEN}│                                     │${NC}"
    echo -e "${GREEN}│   URL: ${CYAN}http://localhost:$PORT${GREEN}      │${NC}"
    echo -e "${GREEN}│                                     │${NC}"
    echo -e "${GREEN}│   Press Ctrl+C to stop              │${NC}"
    echo -e "${GREEN}└─────────────────────────────────────┘${NC}"
    echo ""

    # Set the port if it's not 3000
    if [ "$PORT" != "3000" ]; then
        export PORT=$PORT
    fi

    # Start the server
    exec yarn dev
}

# Function to handle cleanup on exit
cleanup() {
    echo ""
    print_status "Shutting down gracefully..."
    print_success "Server stopped. Goodbye! 👋"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    check_requirements
    check_project
    handle_port_conflicts
    start_server
}

# Run main function
main "$@"