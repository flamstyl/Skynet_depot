#!/bin/bash

###############################################################################
# Script d'installation - Skynet MCP Workspace
# Installation automatique des dépendances et configuration
###############################################################################

set -e  # Arrêt en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Bannière
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║           🚀 SKYNET MCP WORKSPACE - INSTALLATION          ║"
echo "║                                                           ║"
echo "║   DevOps + Graphics MCP Server pour Claude Code CLI      ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Détecter le répertoire du projet
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
log_info "Répertoire du projet: $PROJECT_DIR"

cd "$PROJECT_DIR"

# 1. Vérifier Node.js
log_info "Vérification de Node.js..."

if ! command -v node &> /dev/null; then
    log_error "Node.js n'est pas installé!"
    log_info "Installation de Node.js recommandée:"
    log_info "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    log_info "  sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node --version)
log_success "Node.js trouvé: $NODE_VERSION"

# Vérifier la version minimale (18.0.0)
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 18 ]; then
    log_error "Node.js version >= 18 requise (trouvé: $NODE_VERSION)"
    exit 1
fi

# 2. Vérifier npm
log_info "Vérification de npm..."

if ! command -v npm &> /dev/null; then
    log_error "npm n'est pas installé!"
    exit 1
fi

NPM_VERSION=$(npm --version)
log_success "npm trouvé: $NPM_VERSION"

# 3. Installer les dépendances Node.js
log_info "Installation des dépendances npm..."
npm install
log_success "Dépendances npm installées"

# 4. Compiler TypeScript
log_info "Compilation TypeScript..."
npm run build
log_success "Compilation réussie"

# 5. Vérifier les outils optionnels
log_info "Vérification des outils optionnels..."

# Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker trouvé: $DOCKER_VERSION"
else
    log_warn "Docker non trouvé (fonctionnalités docker_admin limitées)"
fi

# Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    log_success "Git trouvé: $GIT_VERSION"
else
    log_warn "Git non trouvé (fonctionnalités project_ops limitées)"
fi

# Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    log_success "Python trouvé: $PYTHON_VERSION"
else
    log_warn "Python non trouvé (fonctionnalités dev_env limitées)"
fi

# systemctl
if command -v systemctl &> /dev/null; then
    log_success "systemd trouvé"
else
    log_warn "systemd non trouvé (fonctionnalités server_admin limitées)"
fi

# 6. Configuration Claude Code (optionnel)
log_info "Configuration Claude Code..."

CLAUDE_CONFIG="$HOME/.claude.json"
BACKUP_CONFIG="$CLAUDE_CONFIG.backup-$(date +%s)"

if [ -f "$CLAUDE_CONFIG" ]; then
    log_warn "Fichier de config Claude existant trouvé"
    log_info "Création d'un backup: $BACKUP_CONFIG"
    cp "$CLAUDE_CONFIG" "$BACKUP_CONFIG"
fi

# Créer ou modifier la config
log_info "Pour ajouter Skynet MCP à Claude Code, exécutez:"
echo ""
echo "  claude mcp add-json --file $PROJECT_DIR/config/claude-mcp-config.json"
echo ""
log_info "Ou ajoutez manuellement dans ~/.claude.json:"
echo ""
cat "$PROJECT_DIR/config/claude-mcp-config.json"
echo ""

# 7. Test du serveur MCP
log_info "Test du serveur MCP..."

# Tentative de démarrage (timeout 5s)
timeout 5s node dist/index.js <<< '{"jsonrpc":"2.0","method":"ping","id":1}' &> /dev/null && \
    log_success "Serveur MCP opérationnel!" || \
    log_warn "Impossible de tester le serveur (ceci est normal)"

# 8. Permissions
log_info "Configuration des permissions..."
chmod +x dist/index.js
chmod +x scripts/*.sh
log_success "Permissions configurées"

# Résumé final
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║             ✅ INSTALLATION TERMINÉE                      ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

log_success "Skynet MCP Workspace installé avec succès!"
echo ""
log_info "Prochaines étapes:"
echo ""
echo "  1. Configurer Claude Code:"
echo "     claude mcp add-json --file $PROJECT_DIR/config/claude-mcp-config.json"
echo ""
echo "  2. Redémarrer Claude Code"
echo ""
echo "  3. Vérifier avec: /mcp"
echo ""
echo "  4. Tester avec MCP Inspector:"
echo "     npm run inspector"
echo ""

log_info "Documentation complète: $PROJECT_DIR/README.md"
echo ""
