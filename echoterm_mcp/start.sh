#!/bin/bash

echo "╔═══════════════════════════════════════════════╗"
echo "║  EchoTerm MCP - Starting...                   ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Check if config exists
if [ ! -f "app/backend_node/config.json" ]; then
    echo "[!] Config file not found. Creating from example..."
    cp "app/backend_node/config.json.example" "app/backend_node/config.json"
    echo "[!] Please edit app/backend_node/config.json and add your API key."
    exit 1
fi

# Check if node_modules exists in backend
if [ ! -d "app/backend_node/node_modules" ]; then
    echo "[*] Installing backend dependencies..."
    cd app/backend_node
    npm install
    cd ../..
fi

# Check if node_modules exists in electron
if [ ! -d "app/electron/node_modules" ]; then
    echo "[*] Installing Electron dependencies..."
    cd app/electron
    npm install
    cd ../..
fi

echo "[*] Starting backend server..."
cd app/backend_node
npm start &
BACKEND_PID=$!
cd ../..

sleep 3

echo "[*] Starting Electron UI..."
cd app/electron
npm start

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null

echo ""
echo "[*] EchoTerm stopped."
