#!/bin/bash

###############################################################################
# 🔥 PhoenixTerm MCP - Start Script (Linux/macOS)
# Advanced PTY Terminal Server for AI Autonomy
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║  🔥 PhoenixTerm MCP Server v2.0.0                ║"
echo "║  Advanced PTY Terminal for AI Autonomy          ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Vérifier Node.js
echo -e "${CYAN}[PhoenixTerm]${NC} Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Node.js is not installed!"
    echo -e "${YELLOW}[INFO]${NC} Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}[ERROR]${NC} Node.js version must be 18 or higher (current: $(node -v))"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Node.js $(node -v) detected"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} npm is not installed!"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} npm $(npm -v) detected"

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo -e "${CYAN}[PhoenixTerm]${NC} Installing dependencies..."
    npm install
    echo -e "${GREEN}[OK]${NC} Dependencies installed"
else
    echo -e "${GREEN}[OK]${NC} Dependencies already installed"
fi

# Créer les répertoires de données si nécessaires
mkdir -p data/sessions
mkdir -p data/templates
mkdir -p data/logs

echo -e "${GREEN}[OK]${NC} Data directories ready"

# Mode de démarrage
MODE="${1:-stdio}"

if [ "$MODE" = "websocket" ] || [ "$MODE" = "ws" ]; then
    echo -e "${CYAN}[PhoenixTerm]${NC} Starting in WebSocket mode..."
    export PHOENIXTERM_MODE=websocket
    node server.js
elif [ "$MODE" = "stdio" ]; then
    echo -e "${CYAN}[PhoenixTerm]${NC} Starting in stdio mode..."
    export PHOENIXTERM_MODE=stdio
    node server.js
else
    echo -e "${RED}[ERROR]${NC} Unknown mode: $MODE"
    echo -e "${YELLOW}[INFO]${NC} Usage: ./start.sh [stdio|websocket]"
    exit 1
fi
