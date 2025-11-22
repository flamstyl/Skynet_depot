#!/bin/bash

set -e

echo "============================================"
echo "Installation MCP Web Scraper Pro"
echo "============================================"
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    echo "Veuillez installer Node.js >= 18.0.0 depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js >= 18.0.0 requis (version actuelle: $(node -v))"
    exit 1
fi

echo "✅ Node.js $(node -v) détecté"
echo "✅ npm $(npm -v) détecté"

# Installer les dépendances Node.js
echo ""
echo "📦 Installation des dépendances npm..."
npm install

# Build TypeScript
echo ""
echo "🔨 Build du projet TypeScript..."
npm run build

# Créer .env si inexistant
if [ ! -f .env ]; then
    echo ""
    echo "📝 Création du fichier .env..."
    cat > .env <<EOF
# Configuration MCP Web Scraper Pro
DATABASE_PATH=./scraped_data.db
MAX_PAGES=100
TIMEOUT=10000
USER_AGENT=Mozilla/5.0 (compatible; MCPWebScraper/1.0)
EOF
    echo "✅ Fichier .env créé"
fi

# Créer dossier de données
mkdir -p scraped_data

echo ""
echo "============================================"
echo "✅ Installation terminée avec succès !"
echo "============================================"
echo ""
echo "Pour utiliser ce MCP avec Claude Code :"
echo ""
echo "Ajoutez dans ~/Library/Application Support/Claude/claude_desktop_config.json :"
echo ""
echo '{'
echo '  "mcpServers": {'
echo '    "web-scraper-pro": {'
echo '      "command": "node",'
echo '      "args": ["'$(pwd)'/build/index.js"]'
echo '    }'
echo '  }'
echo '}'
echo ""
echo "Redémarrez Claude Code et vérifiez avec: claude mcp list"
echo ""
