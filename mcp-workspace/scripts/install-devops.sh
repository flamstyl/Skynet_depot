#!/bin/bash
set -e

echo "🛠️  Installation MCP DevOps Workspace"
echo "====================================="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifications
echo -e "${YELLOW}Vérification des prérequis...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js non trouvé. Installe Node.js >= 18${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version >= 18 requise. Version actuelle : $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm non trouvé${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Docker (optionnel)
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker $(docker -v)${NC}"
else
    echo -e "${YELLOW}⚠️  Docker non trouvé (optionnel pour docker_admin tools)${NC}"
fi

# systemd (optionnel)
if command -v systemctl &> /dev/null; then
    echo -e "${GREEN}✓ systemd disponible${NC}"
else
    echo -e "${YELLOW}⚠️  systemd non trouvé (optionnel pour server_admin tools)${NC}"
fi

# ImageMagick (optionnel)
if command -v convert &> /dev/null; then
    echo -e "${GREEN}✓ ImageMagick disponible${NC}"
else
    echo -e "${YELLOW}⚠️  ImageMagick non trouvé (optionnel pour graphics_tools)${NC}"
    echo -e "${YELLOW}   Pour installer : sudo apt install imagemagick${NC}"
fi

# Installation des dépendances
echo ""
echo -e "${YELLOW}Installation des dépendances npm...${NC}"

cd "$(dirname "$0")/.."

npm install

# Build du package
echo ""
echo -e "${YELLOW}Build du MCP DevOps Workspace...${NC}"

npm run build -w packages/devops-workspace

# Vérification du build
if [ ! -f "packages/devops-workspace/dist/index.js" ]; then
    echo -e "${RED}❌ Erreur de build${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build réussi${NC}"

# Configuration Claude Code
echo ""
echo -e "${YELLOW}Configuration pour Claude Code${NC}"
echo ""
echo "Ajoute ceci dans ~/.claude.json :"
echo ""
echo '{
  "mcpServers": {
    "devops-workspace": {
      "command": "node",
      "args": ["'$(pwd)'/packages/devops-workspace/dist/index.js"],
      "type": "stdio",
      "env": {
        "LOG_LEVEL": "info",
        "WORKSPACE_ROOT": "'$HOME'/projects"
      }
    }
  }
}'

echo ""
echo -e "${GREEN}✅ Installation terminée !${NC}"
echo ""
echo "Pour tester :"
echo "  node packages/devops-workspace/dist/index.js"
echo ""
echo "Ou avec Claude Code :"
echo "  claude mcp add devops-workspace --scope local"
