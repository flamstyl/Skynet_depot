#!/bin/bash
# NoteVault MCP — Quick Start Script

echo "🟣 ════════════════════════════════════════"
echo "   NoteVault MCP — Starting All Services"
echo "🟣 ════════════════════════════════════════"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.11+"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install Python deps
echo "🐍 Python backend..."
cd app/backend_python
pip install -q -r requirements.txt
cd ../..

# Install MCP deps
echo "🔗 MCP server..."
cd app/mcp
npm install --silent
cd ../..

# Install Electron deps
echo "⚛️ Electron app..."
cd app/electron_app
npm install --silent
cd ../..

echo ""
echo "✅ Dependencies installed"
echo ""
echo "🚀 Starting services..."
echo ""

# Start backend in background
echo "🐍 Starting Python backend (port 5050)..."
cd app/backend_python
python vault_server.py &
BACKEND_PID=$!
cd ../..

# Wait for backend
sleep 3

# Start MCP in background
echo "🔗 Starting MCP server (port 3000)..."
cd app/mcp
node server.js &
MCP_PID=$!
cd ../..

# Wait for MCP
sleep 2

# Start Electron
echo "⚛️ Starting Electron app..."
cd app/electron_app
npm start

# Cleanup on exit
echo ""
echo "🛑 Shutting down..."
kill $BACKEND_PID
kill $MCP_PID

echo "👋 NoteVault stopped"
