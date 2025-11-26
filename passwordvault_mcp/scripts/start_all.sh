#!/bin/bash
# PasswordVault MCP — Start All Services
# Skynet Secure Vault v1.0

set -e

echo "🔐 Starting PasswordVault MCP..."
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Windows (Git Bash / WSL)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "⚠️  Detected Windows - Use PowerShell script instead: start_all.ps1"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."

# Check dependencies
echo ""
echo "📋 Checking dependencies..."

# Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.11+"
    exit 1
fi
echo -e "${GREEN}✓${NC} Python 3 found: $(python3 --version)"

# Node.js
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found. MCP server will not start."
    NODE_AVAILABLE=false
else
    echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"
    NODE_AVAILABLE=true
fi

# Check if backend dependencies are installed
if [ ! -d "$PROJECT_ROOT/app/backend_python/venv" ]; then
    echo ""
    echo "📦 Installing Python dependencies..."
    cd "$PROJECT_ROOT/app/backend_python"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    echo -e "${GREEN}✓${NC} Python dependencies installed"
fi

# Check if MCP dependencies are installed
if [ "$NODE_AVAILABLE" = true ] && [ ! -d "$PROJECT_ROOT/app/mcp/node_modules" ]; then
    echo ""
    echo "📦 Installing Node.js dependencies..."
    cd "$PROJECT_ROOT/app/mcp"
    npm install
    echo -e "${GREEN}✓${NC} Node.js dependencies installed"
fi

# Start services
echo ""
echo "🚀 Starting services..."
echo ""

# Start Python backend
echo "1️⃣  Starting Python backend..."
cd "$PROJECT_ROOT/app/backend_python"
source venv/bin/activate
python vault_server.py &
PYTHON_PID=$!
echo -e "${GREEN}✓${NC} Python backend started (PID: $PYTHON_PID)"

# Wait for backend to start
sleep 2

# Start MCP server (if Node.js is available)
if [ "$NODE_AVAILABLE" = true ]; then
    echo ""
    echo "2️⃣  Starting MCP server..."
    cd "$PROJECT_ROOT/app/mcp"
    node server.js &
    MCP_PID=$!
    echo -e "${GREEN}✓${NC} MCP server started (PID: $MCP_PID)"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "Python Backend: http://127.0.0.1:5555"
if [ "$NODE_AVAILABLE" = true ]; then
    echo "MCP Server:     http://127.0.0.1:3000"
fi
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Trap Ctrl+C
trap 'echo ""; echo "🛑 Stopping services..."; kill $PYTHON_PID 2>/dev/null; [ "$NODE_AVAILABLE" = true ] && kill $MCP_PID 2>/dev/null; echo "✓ Services stopped"; exit 0' INT

# Wait
wait
