#!/bin/bash
set -e

echo "📧 Installation MCP LM Studio Gmail"
echo "===================================="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifications
echo -e "${YELLOW}Vérification des prérequis...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js non trouvé${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version >= 18 requise${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Vérification LM Studio
echo ""
echo -e "${YELLOW}Vérification LM Studio...${NC}"

if curl -s http://localhost:1234/v1/models > /dev/null 2>&1; then
    echo -e "${GREEN}✓ LM Studio serveur actif (http://localhost:1234)${NC}"
else
    echo -e "${YELLOW}⚠️  LM Studio serveur non détecté${NC}"
    echo -e "${YELLOW}   Assure-toi que LM Studio est lancé avec le serveur actif${NC}"
fi

# Installation
cd "$(dirname "$0")/.."

echo ""
echo -e "${YELLOW}Installation des dépendances...${NC}"

npm install

echo ""
echo -e "${YELLOW}Build du MCP LM Studio Gmail...${NC}"

npm run build -w packages/lmstudio-gmail

if [ ! -f "packages/lmstudio-gmail/dist/index.js" ]; then
    echo -e "${RED}❌ Erreur de build${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build réussi${NC}"

# Configuration OAuth
echo ""
echo -e "${YELLOW}Configuration Gmail OAuth${NC}"
echo ""

CREDS_PATH="packages/lmstudio-gmail/auth/credentials.json"

if [ ! -f "$CREDS_PATH" ]; then
    echo -e "${RED}❌ Fichier credentials.json manquant${NC}"
    echo ""
    echo "Étapes :"
    echo "1. Va sur https://console.cloud.google.com"
    echo "2. Crée un projet et active Gmail API"
    echo "3. Crée des credentials OAuth 2.0 (Desktop app)"
    echo "4. Télécharge le JSON et place-le ici :"
    echo "   $CREDS_PATH"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ credentials.json trouvé${NC}"

# Setup OAuth
echo ""
echo -e "${YELLOW}Setup OAuth (première fois)${NC}"
echo "Lance : cd packages/lmstudio-gmail && npm run setup-oauth"
echo ""

# Configuration Claude Code
echo -e "${YELLOW}Configuration pour Claude Code${NC}"
echo ""
echo "Ajoute ceci dans ~/.claude.json :"
echo ""
echo '{
  "mcpServers": {
    "lmstudio-gmail": {
      "command": "node",
      "args": ["'$(pwd)'/packages/lmstudio-gmail/dist/index.js"],
      "type": "stdio",
      "env": {
        "LMSTUDIO_BASE_URL": "http://localhost:1234/v1",
        "LMSTUDIO_MODEL": "local-model",
        "LOG_LEVEL": "info"
      }
    }
  }
}'

echo ""
echo -e "${GREEN}✅ Installation terminée !${NC}"
echo ""
echo "Prochaines étapes :"
echo "1. Configure OAuth : cd packages/lmstudio-gmail && npm run setup-oauth"
echo "2. Lance LM Studio avec un modèle chargé"
echo "3. Teste : node packages/lmstudio-gmail/dist/index.js"
