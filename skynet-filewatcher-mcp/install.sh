#!/bin/bash
###############################################################################
# 🔍 Skynet FileWatcher MCP - Script d'installation
# Installation et configuration du serveur MCP FileWatcher
###############################################################################

set -e

echo "🔍 Installation de Skynet FileWatcher MCP"
echo "=========================================="
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    echo "   Installez Node.js 18+ depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ requis (version actuelle: $(node -v))"
    exit 1
fi

echo "✅ Node.js $(node -v) détecté"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

echo "✅ npm $(npm -v) détecté"
echo ""

# Installation des dépendances
echo "📦 Installation des dépendances npm..."
npm install

# Compilation TypeScript
echo "🔨 Compilation du TypeScript..."
npm run build

# Vérifier la compilation
if [ ! -f "dist/index.js" ]; then
    echo "❌ Erreur de compilation"
    exit 1
fi

echo "✅ Compilation réussie"
echo ""

# Créer les dossiers nécessaires
echo "📁 Création des dossiers..."
mkdir -p logs
mkdir -p config
touch logs/.gitkeep
echo "✅ Dossiers créés"
echo ""

# Installation globale (optionnelle)
read -p "Installer globalement ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌍 Installation globale..."
    npm install -g .
    echo "✅ Installé globalement : commande 'skynet-filewatcher' disponible"
fi

echo ""
echo "=========================================="
echo "✅ Installation terminée !"
echo ""
echo "📝 Prochaines étapes :"
echo ""
echo "1. Configurer Claude Code CLI :"
echo "   Ajoutez dans ~/.config/claude/config.json :"
echo ""
echo '   {
     "mcp": {
       "servers": {
         "filewatcher": {
           "command": "node",
           "args": ["'$(pwd)'/dist/index.js"]
         }
       }
     }
   }'
echo ""
echo "2. Tester le serveur :"
echo "   npm run dev"
echo ""
echo "3. Documentation complète :"
echo "   cat README.md"
echo ""
echo "=========================================="
