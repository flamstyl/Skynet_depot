#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔥 UBUNTU VM MCP - Launch Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Script de lancement user-friendly pour l'environnement IA Ubuntu VM
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e  # Arrêt immédiat en cas d'erreur

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎨 Couleurs pour affichage
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎯 Fonctions utilitaires
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${MAGENTA}🔹 $1${NC}"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔍 Vérifications préalables
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header "🔥 Ubuntu VM MCP - Launcher v1.0"

# Vérification de Docker
print_step "Vérification de Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé ou n'est pas dans le PATH"
    print_info "Installation: https://docs.docker.com/get-docker/"
    exit 1
fi
print_success "Docker trouvé: $(docker --version)"

# Vérification de Docker Compose
print_step "Vérification de Docker Compose..."
if ! command -v docker compose version &> /dev/null; then
    print_error "Docker Compose n'est pas disponible"
    print_info "Installation: https://docs.docker.com/compose/install/"
    exit 1
fi
print_success "Docker Compose trouvé: $(docker compose version)"

# Vérification que Docker daemon tourne
print_step "Vérification du Docker daemon..."
if ! docker info &> /dev/null; then
    print_error "Docker daemon n'est pas démarré"
    print_info "Démarrez Docker et réessayez"
    exit 1
fi
print_success "Docker daemon actif"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📁 Vérification de la structure du projet
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_step "Vérification de la structure du projet..."

if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile introuvable dans le répertoire courant"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml introuvable"
    exit 1
fi

if [ ! -d "mcp" ]; then
    print_warning "Répertoire mcp/ introuvable, création..."
    mkdir -p mcp
fi

if [ ! -d "data" ]; then
    print_warning "Répertoire data/ introuvable, création..."
    mkdir -p data
fi

print_success "Structure du projet validée"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🛠️ Options de lancement
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Parsing des arguments
REBUILD=false
FORCE_RECREATE=false
NO_CACHE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --rebuild)
            REBUILD=true
            shift
            ;;
        --force-recreate)
            FORCE_RECREATE=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --help)
            echo "Usage: ./launch_vm.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --rebuild          Force rebuild de l'image Docker"
            echo "  --force-recreate   Force la recréation du conteneur"
            echo "  --no-cache         Build sans utiliser le cache Docker"
            echo "  --help             Affiche cette aide"
            exit 0
            ;;
        *)
            print_error "Option inconnue: $1"
            echo "Utilisez --help pour voir les options disponibles"
            exit 1
            ;;
    esac
done

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🏗️ Build de l'image Docker
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header "🏗️  Building Docker Image"

BUILD_ARGS=""
if [ "$NO_CACHE" = true ]; then
    BUILD_ARGS="--no-cache"
    print_info "Build sans cache activé"
fi

print_step "Construction de l'image ubuntu_vm_mcp..."
if docker compose build $BUILD_ARGS; then
    print_success "Image construite avec succès"
else
    print_error "Échec du build de l'image"
    exit 1
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 Lancement du conteneur
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header "🚀 Launching Container"

UP_ARGS="-d"
if [ "$FORCE_RECREATE" = true ]; then
    UP_ARGS="$UP_ARGS --force-recreate"
    print_info "Recréation forcée du conteneur"
fi

print_step "Démarrage du conteneur ubuntu_vm_mcp..."
if docker compose up $UP_ARGS; then
    print_success "Conteneur démarré avec succès"
else
    print_error "Échec du démarrage du conteneur"
    exit 1
fi

# Attendre que le conteneur soit prêt
print_step "Attente du démarrage complet (15s)..."
sleep 15

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ Vérification du statut
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header "✅ Status Check"

if docker compose ps | grep -q "ubuntu_vm_mcp.*Up"; then
    print_success "Conteneur ubuntu_vm_mcp est actif"
else
    print_error "Le conteneur ne semble pas démarré correctement"
    print_info "Vérifiez les logs avec: docker compose logs"
    exit 1
fi

# Vérification du processus VNC
print_step "Vérification du serveur VNC..."
if docker compose exec -T ubuntu_vm_mcp pgrep -u ia Xvnc > /dev/null 2>&1; then
    print_success "Serveur VNC actif"
else
    print_warning "Serveur VNC non détecté (peut prendre quelques secondes)"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📊 Informations de connexion
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header "📊 Connection Information"

echo ""
echo -e "${WHITE}🖥️  VNC Access (Interface Graphique)${NC}"
echo -e "   ${GREEN}Host:${NC}     localhost"
echo -e "   ${GREEN}Port:${NC}     5900"
echo -e "   ${GREEN}Password:${NC} vncpass"
echo -e "   ${GREEN}Client:${NC}   vncviewer localhost:5900"
echo -e "              ${BLUE}ou Remmina, TigerVNC Viewer, RealVNC${NC}"
echo ""

echo -e "${WHITE}🔐 SSH Access (Terminal)${NC}"
echo -e "   ${GREEN}Host:${NC}     localhost"
echo -e "   ${GREEN}Port:${NC}     2222"
echo -e "   ${GREEN}User:${NC}     ia"
echo -e "   ${GREEN}Password:${NC} ia"
echo -e "   ${GREEN}Command:${NC}  ssh ia@localhost -p 2222"
echo ""

echo -e "${WHITE}📁 Directories${NC}"
echo -e "   ${GREEN}MCP Scripts:${NC}  /opt/mcp/"
echo -e "   ${GREEN}Data Volume:${NC}  /data/"
echo -e "   ${GREEN}Home IA:${NC}      /home/ia/"
echo ""

echo -e "${WHITE}🔧 Management Commands${NC}"
echo -e "   ${CYAN}Logs:${NC}              docker compose logs -f"
echo -e "   ${CYAN}Shell Access:${NC}      docker compose exec ubuntu_vm_mcp bash"
echo -e "   ${CYAN}Stop:${NC}              docker compose stop"
echo -e "   ${CYAN}Restart:${NC}           docker compose restart"
echo -e "   ${CYAN}Remove:${NC}            docker compose down"
echo -e "   ${CYAN}Status:${NC}            docker compose ps"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🌐 Test de connectivité réseau
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header "🌐 Network Test"

print_step "Test de connectivité Internet..."
if docker compose exec -T ubuntu_vm_mcp ping -c 2 8.8.8.8 > /dev/null 2>&1; then
    print_success "Connectivité réseau OK"

    # Test DNS
    if docker compose exec -T ubuntu_vm_mcp ping -c 2 google.com > /dev/null 2>&1; then
        print_success "Résolution DNS OK"
    else
        print_warning "DNS pourrait avoir des problèmes"
    fi
else
    print_warning "Connectivité réseau limitée"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎉 Finalisation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print_header "🎉 Ubuntu VM MCP Ready!"

echo ""
echo -e "${GREEN}✨ L'environnement IA est prêt à l'emploi !${NC}"
echo ""
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo -e "   1. Connectez-vous via VNC: ${CYAN}vncviewer localhost:5900${NC}"
echo -e "   2. Ouvrez un terminal XFCE"
echo -e "   3. Explorez ${CYAN}/opt/mcp/${NC} pour les scripts IA"
echo -e "   4. Lancez ${CYAN}/opt/mcp/start-agent.sh${NC} pour démarrer Claude CLI"
echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
