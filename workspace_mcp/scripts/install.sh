#!/usr/bin/env bash

#################################################################
# Script d'installation du Workspace MCP
# Installation automatique des dépendances et configuration
#################################################################

set -e  # Exit on error

echo "🚀 Installation du Workspace MCP..."
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Vérifier Node.js
info "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé. Veuillez installer Node.js >= 18.0.0"
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js version trop ancienne. Requis: >= 18.0.0, Actuel: $(node -v)"
fi

info "Node.js $(node -v) détecté ✓"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé"
fi

info "npm $(npm -v) détecté ✓"

# Installer les dépendances Node.js
info "Installation des dépendances Node.js..."
npm install

# Compiler TypeScript
info "Compilation TypeScript..."
npm run build

# Créer les dossiers data
info "Création des dossiers data..."
mkdir -p data/cache data/logs

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    info "Création du fichier .env..."
    cp .env.example .env
    warn "⚠️  Veuillez éditer le fichier .env avec vos paramètres"
fi

# Vérifier Docker (optionnel)
info "Vérification de Docker..."
if command -v docker &> /dev/null; then
    info "Docker $(docker -v | cut -d ' ' -f 3 | tr -d ',') détecté ✓"
else
    warn "Docker non détecté. Le module docker_admin ne fonctionnera pas."
    warn "Pour installer Docker: https://docs.docker.com/engine/install/"
fi

# Vérifier ImageMagick (optionnel)
info "Vérification d'ImageMagick..."
if command -v convert &> /dev/null; then
    info "ImageMagick détecté ✓"
else
    warn "ImageMagick non détecté. Le module graphics_tools sera limité."
    warn "Pour installer: sudo apt-get install imagemagick (Ubuntu/Debian)"
fi

# Vérifier Git
info "Vérification de Git..."
if command -v git &> /dev/null; then
    info "Git $(git --version | cut -d ' ' -f 3) détecté ✓"
else
    warn "Git non détecté. Le module project_ops ne pourra pas gérer les dépôts Git."
fi

echo ""
info "✅ Installation terminée avec succès !"
echo ""
echo "Pour démarrer le serveur MCP:"
echo "  npm start          # Mode production"
echo "  npm run dev        # Mode développement (hot reload)"
echo ""
echo "Pour tester:"
echo "  curl http://localhost:3100/health"
echo ""
echo "Pour connecter à Claude Code CLI:"
echo "  claude mcp add workspace-mcp stdio node $(pwd)/dist/server.js"
echo ""
