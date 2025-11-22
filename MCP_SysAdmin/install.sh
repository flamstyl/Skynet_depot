#!/bin/bash
# 🚀 Script d'installation automatique de MCP SysAdmin
# Pour Claude Code CLI

set -e

echo "🚀 Installation de MCP SysAdmin"
echo "================================"
echo ""

# Vérifier Node.js
echo "📦 Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé!"
    echo "📥 Installation de Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js est installé: $NODE_VERSION"
fi

# Vérifier npm
echo ""
echo "📦 Vérification de npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé!"
    exit 1
else
    NPM_VERSION=$(npm --version)
    echo "✅ npm est installé: $NPM_VERSION"
fi

# Installation des dépendances
echo ""
echo "📦 Installation des dépendances npm..."
npm install

# Compilation TypeScript
echo ""
echo "🔨 Compilation du code TypeScript..."
npm run build

# Vérification de la compilation
if [ -f "dist/index.js" ]; then
    echo "✅ Compilation réussie!"
else
    echo "❌ Erreur lors de la compilation"
    exit 1
fi

# Test du serveur
echo ""
echo "🧪 Test du serveur MCP..."
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | node dist/index.js > /tmp/mcp_test.txt 2>&1
if grep -q "outils disponibles" /tmp/mcp_test.txt; then
    TOOL_COUNT=$(grep -o "[0-9]\+ outils disponibles" /tmp/mcp_test.txt | grep -o "[0-9]\+")
    echo "✅ Serveur MCP opérationnel! ($TOOL_COUNT outils disponibles)"
else
    echo "❌ Erreur lors du test du serveur"
    cat /tmp/mcp_test.txt
    exit 1
fi

# Obtenir le chemin absolu
INSTALL_PATH=$(pwd)

echo ""
echo "================================"
echo "✅ Installation terminée avec succès!"
echo ""
echo "📋 Configuration pour Claude Code:"
echo ""
echo "Ajoutez ceci à votre configuration Claude (~/.config/claude/config.json) :"
echo ""
echo '{
  "mcp": {
    "servers": {
      "sysadmin": {
        "command": "node",
        "args": ["'$INSTALL_PATH'/dist/index.js"]
      }
    }
  }
}'
echo ""
echo "📖 Consultez README.md et GUIDE_FRANCAIS.md pour plus d'informations"
echo ""
echo "🎉 Profitez bien de MCP SysAdmin!"
