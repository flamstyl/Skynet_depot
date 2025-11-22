#!/bin/bash

set -e

echo "============================================"
echo "Installation MCP DevOps Workspace"
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

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

echo "✅ npm $(npm -v) détecté"

# Installer les dépendances système
echo ""
echo "📦 Installation des dépendances système optionnelles..."

# Docker (optionnel)
if command -v docker &> /dev/null; then
    echo "✅ Docker $(docker -v | cut -d' ' -f3 | tr -d ',') détecté"
else
    echo "⚠️  Docker non détecté (optionnel pour docker_admin)"
fi

# ImageMagick (optionnel pour graphics)
if command -v convert &> /dev/null; then
    echo "✅ ImageMagick détecté"
else
    echo "⚠️  ImageMagick non détecté (optionnel pour graphics_tools)"
    echo "    Installation: sudo apt-get install imagemagick (Debian/Ubuntu)"
fi

# systemd (optionnel)
if command -v systemctl &> /dev/null; then
    echo "✅ systemd détecté"
else
    echo "⚠️  systemd non détecté (optionnel pour server_admin)"
fi

# nvidia-smi (optionnel)
if command -v nvidia-smi &> /dev/null; then
    echo "✅ nvidia-smi détecté"
else
    echo "⚠️  nvidia-smi non détecté (optionnel pour GPU monitoring)"
fi

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
    cp .env.example .env
    echo "✅ Fichier .env créé (vous pouvez le personnaliser)"
fi

echo ""
echo "============================================"
echo "✅ Installation terminée avec succès !"
echo "============================================"
echo ""
echo "Pour utiliser ce MCP avec Claude Code :"
echo ""
echo "1. Ajoutez cette configuration dans votre fichier Claude Code config :"
echo "   (macOS/Linux: ~/Library/Application Support/Claude/claude_desktop_config.json)"
echo ""
echo '   {'
echo '     "mcpServers": {'
echo '       "devops-workspace": {'
echo '         "command": "node",'
echo '         "args": ["'$(pwd)'/build/index.js"]'
echo '       }'
echo '     }'
echo '   }'
echo ""
echo "2. Redémarrez Claude Code"
echo ""
echo "3. Vérifiez l'installation avec: claude mcp list"
echo ""
echo "Pour tester le MCP directement: node build/index.js"
echo ""
