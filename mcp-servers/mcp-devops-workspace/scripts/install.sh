#!/bin/bash

##############################################################################
# Script d'installation pour MCP DevOps Workspace
# Compatible: Ubuntu, Debian, Fedora, Arch Linux
##############################################################################

set -e  # Exit on error

echo "=========================================="
echo "MCP DevOps Workspace - Installation"
echo "=========================================="
echo ""

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour logger
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Détecter l'OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        log_info "OS détecté: $OS"
    else
        log_error "Impossible de détecter l'OS"
        exit 1
    fi
}

# Vérifier Node.js
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js est installé: $NODE_VERSION"

        # Vérifier version >= 18
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
        if [ "$MAJOR_VERSION" -lt 18 ]; then
            log_warn "Node.js version 18+ recommandée (actuellement: $NODE_VERSION)"
        fi
    else
        log_error "Node.js n'est pas installé"
        echo "Installez Node.js 18+ depuis: https://nodejs.org/"
        exit 1
    fi
}

# Installer les dépendances système optionnelles
install_optional_deps() {
    log_info "Installation des dépendances optionnelles..."

    case $OS in
        ubuntu|debian)
            # Docker (optionnel)
            if ! command -v docker &> /dev/null; then
                log_warn "Docker non trouvé. Les tools Docker ne fonctionneront pas."
                read -p "Installer Docker? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    sudo apt-get update
                    sudo apt-get install -y docker.io
                    sudo usermod -aG docker $USER
                    log_info "Docker installé. Vous devrez vous reconnecter pour que les changements prennent effet."
                fi
            else
                log_info "Docker déjà installé"
            fi

            # ImageMagick (optionnel)
            if ! command -v convert &> /dev/null; then
                log_warn "ImageMagick non trouvé. Les tools graphiques ne fonctionneront pas."
                read -p "Installer ImageMagick? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    sudo apt-get install -y imagemagick
                    log_info "ImageMagick installé"
                fi
            else
                log_info "ImageMagick déjà installé"
            fi
            ;;

        fedora)
            # Docker
            if ! command -v docker &> /dev/null; then
                log_warn "Docker non trouvé."
                read -p "Installer Docker? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    sudo dnf install -y docker
                    sudo systemctl enable --now docker
                    sudo usermod -aG docker $USER
                    log_info "Docker installé"
                fi
            else
                log_info "Docker déjà installé"
            fi

            # ImageMagick
            if ! command -v convert &> /dev/null; then
                read -p "Installer ImageMagick? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    sudo dnf install -y ImageMagick
                    log_info "ImageMagick installé"
                fi
            else
                log_info "ImageMagick déjà installé"
            fi
            ;;

        arch)
            if ! command -v docker &> /dev/null; then
                read -p "Installer Docker? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    sudo pacman -S --noconfirm docker
                    sudo systemctl enable --now docker
                    sudo usermod -aG docker $USER
                    log_info "Docker installé"
                fi
            else
                log_info "Docker déjà installé"
            fi

            if ! command -v convert &> /dev/null; then
                read -p "Installer ImageMagick? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    sudo pacman -S --noconfirm imagemagick
                    log_info "ImageMagick installé"
                fi
            else
                log_info "ImageMagick déjà installé"
            fi
            ;;
    esac
}

# Installer les dépendances Node.js
install_node_deps() {
    log_info "Installation des dépendances Node.js..."
    npm install
    log_info "Dépendances installées"
}

# Build le projet
build_project() {
    log_info "Compilation du projet TypeScript..."
    npm run build
    log_info "Projet compilé avec succès"
}

# Créer le fichier .env
create_env_file() {
    if [ ! -f .env ]; then
        log_info "Création du fichier .env..."
        cp .env.example .env

        # Personnaliser les chemins
        sed -i "s|PROJECTS_DIR=.*|PROJECTS_DIR=$HOME/projects|g" .env
        sed -i "s|ALLOWED_PATHS=.*|ALLOWED_PATHS=$HOME:/tmp:/var/log|g" .env

        log_info "Fichier .env créé. Personnalisez-le selon vos besoins."
    else
        log_warn "Fichier .env existe déjà"
    fi
}

# Créer le répertoire projects par défaut
create_projects_dir() {
    if [ ! -d "$HOME/projects" ]; then
        log_info "Création du répertoire ~/projects..."
        mkdir -p "$HOME/projects"
    fi
}

# Test rapide
run_test() {
    log_info "Test de démarrage du serveur..."

    # Démarrer le serveur en background pendant 2 secondes
    timeout 2s node dist/index.js &> /tmp/mcp-devops-test.log || true

    if grep -q "MCP DevOps Workspace Server started" /tmp/mcp-devops-test.log; then
        log_info "✓ Serveur démarré avec succès"
    else
        log_warn "Le test de démarrage a échoué. Vérifiez les logs: /tmp/mcp-devops-test.log"
    fi

    rm -f /tmp/mcp-devops-test.log
}

# Main
main() {
    detect_os
    check_node
    install_optional_deps
    install_node_deps
    build_project
    create_env_file
    create_projects_dir
    run_test

    echo ""
    echo "=========================================="
    log_info "✓ Installation terminée avec succès!"
    echo "=========================================="
    echo ""
    echo "Prochaines étapes:"
    echo "  1. Configurez le serveur dans Claude Code CLI:"
    echo "     cp mcp-config.example.json ~/.claude.json"
    echo ""
    echo "  2. Personnalisez .env si nécessaire"
    echo ""
    echo "  3. Testez avec:"
    echo "     npm start"
    echo ""
    echo "  4. Documentation complète: docs/README.md"
    echo ""
}

main
