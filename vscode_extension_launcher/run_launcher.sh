#!/bin/bash
# ========================================
# VS Code Extension Launcher - Skynet Edition
# Linux/macOS Launcher Script
# ========================================

echo ""
echo "========================================"
echo "VS Code Extension Launcher - Skynet"
echo "========================================"
echo ""

# Change to the script directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[INFO] Dependencies not found. Installing..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies"
        exit 1
    fi
    echo ""
    echo "[SUCCESS] Dependencies installed successfully"
    echo ""
fi

# Launch the application
echo "[INFO] Starting VS Code Extension Launcher..."
echo ""
npm start

# Check if there was an error
if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Application exited with an error"
    exit 1
fi
