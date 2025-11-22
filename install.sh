#!/bin/bash

# Script d'installation pour Skynet MCP Servers

set -e

echo "🚀 Installation de Skynet MCP Servers"
echo "======================================"
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer (version 18+)"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ requis (version actuelle: $NODE_VERSION)"
    exit 1
fi

echo "✅ Node.js $(node -v) détecté"
echo ""

# Installer skynet-devops-mcp
echo "📦 Installation de skynet-devops-mcp..."
cd skynet-devops-mcp
npm install
npm run build
cd ..
echo "✅ skynet-devops-mcp installé"
echo ""

# Installer skynet-drive-memory-mcp
echo "📦 Installation de skynet-drive-memory-mcp..."
cd skynet-drive-memory-mcp
npm install
npm run build
cd ..
echo "✅ skynet-drive-memory-mcp installé"
echo ""

# Créer les fichiers .env s'ils n'existent pas
if [ ! -f "skynet-devops-mcp/.env" ]; then
    echo "📝 Création de skynet-devops-mcp/.env"
    cp skynet-devops-mcp/.env.example skynet-devops-mcp/.env
fi

if [ ! -f "skynet-drive-memory-mcp/.env" ]; then
    echo "📝 Création de skynet-drive-memory-mcp/.env"
    cp skynet-drive-memory-mcp/.env.example skynet-drive-memory-mcp/.env
fi

echo ""
echo "✨ Installation terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "1. Configurer les variables d'environnement :"
echo "   - skynet-devops-mcp/.env"
echo "   - skynet-drive-memory-mcp/.env"
echo ""
echo "2. Pour Google Drive, configurer OAuth2 :"
echo "   - Aller sur https://console.cloud.google.com"
echo "   - Créer un projet et activer Google Drive API"
echo "   - Créer des credentials OAuth 2.0"
echo "   - Ajouter GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env"
echo ""
echo "3. Ajouter les MCP servers à Claude Code CLI :"
echo "   claude mcp add skynet-devops --transport stdio --command 'node $(pwd)/skynet-devops-mcp/dist/index.js'"
echo "   claude mcp add skynet-drive --transport stdio --command 'node $(pwd)/skynet-drive-memory-mcp/dist/index.js'"
echo ""
echo "4. Tester les servers :"
echo "   cd skynet-devops-mcp && npm start"
echo "   cd skynet-drive-memory-mcp && npm start"
echo ""
echo "📚 Documentation complète : README.md"
echo ""
