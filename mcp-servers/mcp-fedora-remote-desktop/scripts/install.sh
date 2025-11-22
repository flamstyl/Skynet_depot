#!/bin/bash

##############################################################################
# Script d'installation pour MCP Fedora Remote Desktop Control
# Compatible: Fedora 39, 40, 41+
##############################################################################

set -e

echo "=============================================="
echo "MCP Fedora Remote Desktop - Installation"
echo "=============================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier Fedora
check_fedora() {
    if [ ! -f /etc/fedora-release ]; then
        log_error "Ce script est conçu pour Fedora Linux"
        exit 1
    fi
    FEDORA_VERSION=$(rpm -E %fedora)
    log_info "Fedora $FEDORA_VERSION détectée"
}

# Vérifier Node.js
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js installé: $NODE_VERSION"

        MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
        if [ "$MAJOR" -lt 18 ]; then
            log_warn "Node.js 18+ recommandé (version: $NODE_VERSION)"
        fi
    else
        log_error "Node.js non installé"
        echo "Installez avec: sudo dnf install nodejs"
        exit 1
    fi
}

# Détecter l'environnement
detect_display_server() {
    if [ "$XDG_SESSION_TYPE" = "wayland" ]; then
        log_info "Session Wayland détectée"
        DISPLAY_SERVER="wayland"
        RECOMMENDED_BACKEND="gnome-remote-desktop"
    elif [ "$XDG_SESSION_TYPE" = "x11" ]; then
        log_info "Session X11 détectée"
        DISPLAY_SERVER="x11"
        RECOMMENDED_BACKEND="tigervnc"
    else
        log_warn "Type de session inconnu, défaut: gnome-remote-desktop"
        DISPLAY_SERVER="unknown"
        RECOMMENDED_BACKEND="gnome-remote-desktop"
    fi
}

# Installer le backend recommandé
install_backend() {
    log_info "Backend recommandé: $RECOMMENDED_BACKEND"

    if rpm -q $RECOMMENDED_BACKEND &> /dev/null; then
        log_info "$RECOMMENDED_BACKEND déjà installé ✓"
    else
        read -p "Installer $RECOMMENDED_BACKEND ? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo dnf install -y $RECOMMENDED_BACKEND
            log_info "$RECOMMENDED_BACKEND installé ✓"
        fi
    fi
}

# Vérifier firewalld
check_firewalld() {
    if systemctl is-active --quiet firewalld; then
        log_info "firewalld actif ✓"
    else
        log_warn "firewalld non actif"
        read -p "Activer firewalld ? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo systemctl enable --now firewalld
        fi
    fi
}

# Installer dépendances npm
install_node_deps() {
    log_info "Installation des dépendances Node.js..."
    npm install
}

# Build
build_project() {
    log_info "Compilation TypeScript..."
    npm run build
}

# Test
run_test() {
    log_info "Test de démarrage..."
    timeout 2s node dist/index.js &> /tmp/mcp-fedora-rd-test.log || true

    if grep -q "MCP.*started" /tmp/mcp-fedora-rd-test.log; then
        log_info "✓ Serveur démarre correctement"
    else
        log_warn "Vérifiez les logs: /tmp/mcp-fedora-rd-test.log"
    fi
    rm -f /tmp/mcp-fedora-rd-test.log
}

# Main
main() {
    check_fedora
    check_node
    detect_display_server
    install_backend
    check_firewalld
    install_node_deps
    build_project
    run_test

    echo ""
    echo "=============================================="
    log_info "✓ Installation terminée !"
    echo "=============================================="
    echo ""
    echo "Prochaines étapes:"
    echo "  1. Ajoutez à Claude Code CLI:"
    echo "     claude mcp add fedora-remote-desktop --command node --args \"$(pwd)/dist/index.js\""
    echo ""
    echo "  2. Documentation: README.md"
    echo ""
}

main
