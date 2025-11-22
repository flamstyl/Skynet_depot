#!/bin/bash
###############################################################################
# 🚀 Installation globale de l'écosystème Skynet MCP
# Installe et compile les 4 serveurs MCP
###############################################################################

set -e

echo "🚀 Installation de l'écosystème Skynet MCP"
echo "=========================================="
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

echo "✅ Node.js $(node -v) détecté"
echo ""

# Liste des serveurs MCP à installer
SERVERS=(
    "MCP_SysAdmin"
    "skynet-filewatcher-mcp"
    "skynet-project-mcp"
    "skynet-creative-mcp"
)

TOTAL=${#SERVERS[@]}
CURRENT=0

# Installation de chaque serveur
for server in "${SERVERS[@]}"; do
    CURRENT=$((CURRENT + 1))
    echo "[$CURRENT/$TOTAL] 📦 Installation de $server..."

    if [ ! -d "$server" ]; then
        echo "⚠️  Dossier $server non trouvé, ignoré"
        continue
    fi

    cd "$server"

    # Installation des dépendances
    echo "  → npm install..."
    npm install --silent > /dev/null 2>&1

    # Compilation TypeScript
    echo "  → npm run build..."
    npm run build > /dev/null 2>&1

    # Vérification
    if [ -f "dist/index.js" ]; then
        echo "  ✅ $server compilé avec succès"
    else
        echo "  ❌ Erreur de compilation pour $server"
        cd ..
        continue
    fi

    cd ..
    echo ""
done

echo "=========================================="
echo "✅ Installation terminée !"
echo ""
echo "📊 Serveurs MCP installés :"
echo "  1. MCP SysAdmin        (112 tools)"
echo "  2. Skynet FileWatcher  (10 tools)"
echo "  3. Skynet Project      (14 tools)"
echo "  4. Skynet Creative     (7 tools)"
echo ""
echo "  TOTAL : 143 outils MCP disponibles"
echo ""
echo "📝 Prochaines étapes :"
echo ""
echo "1. Configurer Claude Code CLI :"
echo "   cp claude-mcp-config.example.json ~/.config/claude/config.json"
echo "   # Puis éditer pour ajuster les chemins absolus"
echo ""
echo "2. Vérifier la configuration :"
echo "   claude mcp list"
echo ""
echo "3. Documentation complète :"
echo "   cat SKYNET_MCP_ECOSYSTEM.md"
echo ""
echo "=========================================="
