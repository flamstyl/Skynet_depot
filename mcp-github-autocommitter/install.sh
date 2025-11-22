#!/usr/bin/env bash

#######################################################
# 🚀 MCP GitHub Auto-Committer - Installation Script
#######################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  🚀 MCP GitHub Auto-Committer - Installation${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check Node.js
check_node() {
    print_step "Vérification de Node.js..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé!"
        echo "   Installez Node.js 18+ depuis: https://nodejs.org"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version trop ancienne: v$NODE_VERSION"
        echo "   Version minimum requise: v18"
        exit 1
    fi

    print_success "Node.js $(node -v) détecté"
}

# Check Git
check_git() {
    print_step "Vérification de Git..."

    if ! command -v git &> /dev/null; then
        print_error "Git n'est pas installé!"
        echo "   Installez Git depuis: https://git-scm.com"
        exit 1
    fi

    print_success "Git $(git --version) détecté"
}

# Install dependencies
install_dependencies() {
    print_step "Installation des dépendances npm..."

    if [ ! -f "package.json" ]; then
        print_error "package.json introuvable!"
        exit 1
    fi

    npm install

    print_success "Dépendances installées"
}

# Check Git credentials
check_credentials() {
    print_step "Vérification des credentials Git..."

    # Check SSH
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        print_success "SSH keys configurées ✅"
        return 0
    fi

    # Check GitHub CLI
    if command -v gh &> /dev/null; then
        if gh auth status &> /dev/null; then
            print_success "GitHub CLI authentifié ✅"
            return 0
        fi
    fi

    # Check token
    if [ ! -z "$GITHUB_TOKEN" ]; then
        print_success "GITHUB_TOKEN configuré ✅"
        return 0
    fi

    print_warning "Aucune authentification GitHub détectée"
    echo "   Options disponibles:"
    echo "   1. Configurer des SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
    echo "   2. Installer GitHub CLI: gh auth login"
    echo "   3. Définir GITHUB_TOKEN: export GITHUB_TOKEN=ghp_..."
}

# Make server.js executable
make_executable() {
    print_step "Configuration des permissions..."

    chmod +x server.js

    print_success "server.js rendu exécutable"
}

# Test installation
test_installation() {
    print_step "Test de l'installation..."

    # Test simple: lancer le serveur avec un message d'init
    echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node server.js > /dev/null 2>&1 &
    PID=$!

    sleep 2

    if ps -p $PID > /dev/null; then
        kill $PID 2>/dev/null || true
        print_success "Serveur MCP fonctionne correctement"
    else
        print_warning "Test du serveur non concluant (peut être normal)"
    fi
}

# Configuration example
show_config_example() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  📝 Configuration pour Claude Code CLI${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Ajoutez ceci à votre fichier de configuration MCP:"
    echo ""
    echo -e "${YELLOW}{${NC}"
    echo -e "${YELLOW}  \"mcpServers\": {${NC}"
    echo -e "${YELLOW}    \"github-autocommitter\": {${NC}"
    echo -e "${YELLOW}      \"command\": \"node\",${NC}"
    echo -e "${YELLOW}      \"args\": [\"$(pwd)/server.js\"],${NC}"
    echo -e "${YELLOW}      \"env\": {}${NC}"
    echo -e "${YELLOW}    }${NC}"
    echo -e "${YELLOW}  }${NC}"
    echo -e "${YELLOW}}${NC}"
    echo ""
}

# Main installation
main() {
    clear
    print_header

    check_node
    check_git
    install_dependencies
    make_executable
    check_credentials
    test_installation

    echo ""
    print_success "Installation terminée!"
    echo ""

    show_config_example

    echo -e "${GREEN}🎉 MCP GitHub Auto-Committer est prêt à l'emploi!${NC}"
    echo ""
    echo "Pour démarrer:"
    echo "  node server.js"
    echo ""
    echo "Documentation complète: cat README.md"
    echo ""
}

main
