#!/bin/bash
# ============================================================================
# MCP KALI LINUX - Script de Démarrage Principal
# ============================================================================
# Point d'entrée du conteneur Docker
# Lance les services nécessaires et initialise l'environnement MCP
# ============================================================================

set -e  # Exit on error

# ============================================================================
# VARIABLES DE CONFIGURATION
# ============================================================================
MCP_DIR="/mcp"
LOGS_DIR="/logs"
AI_CONTEXT_DIR="/ai_context"
TTYD_PORT=7681
SSH_ENABLED=${SSH_ENABLED:-false}
MCP_AGENT_ENABLED=${MCP_AGENT_ENABLED:-true}

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# FONCTION : Afficher la bannière
# ============================================================================
show_banner() {
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║            🟣 MCP KALI LINUX - AI Security Lab 🟣              ║"
    echo "║                                                                ║"
    echo "║  Environnement Kali Linux Dockerisé pour IA de Cybersécurité  ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# ============================================================================
# FONCTION : Logger avec timestamp
# ============================================================================
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case $level in
        INFO)
            echo -e "${GREEN}[INFO]${NC} ${timestamp} - ${message}"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} ${timestamp} - ${message}"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} ${timestamp} - ${message}"
            ;;
        DEBUG)
            echo -e "${CYAN}[DEBUG]${NC} ${timestamp} - ${message}"
            ;;
        *)
            echo "${timestamp} - ${message}"
            ;;
    esac

    # Log également dans un fichier
    echo "[${level}] ${timestamp} - ${message}" >> "${LOGS_DIR}/startup.log"
}

# ============================================================================
# FONCTION : Vérifier les prérequis
# ============================================================================
check_prerequisites() {
    log INFO "Vérification des prérequis..."

    # Vérifier que les dossiers existent
    for dir in "$MCP_DIR" "$LOGS_DIR" "$AI_CONTEXT_DIR"; do
        if [ ! -d "$dir" ]; then
            log WARN "Dossier $dir n'existe pas, création..."
            mkdir -p "$dir"
        fi
    done

    # Vérifier les scripts MCP
    if [ ! -f "${MCP_DIR}/mcp_agent.sh" ]; then
        log WARN "Script mcp_agent.sh non trouvé"
    fi

    if [ ! -f "${MCP_DIR}/analyze_logs.sh" ]; then
        log WARN "Script analyze_logs.sh non trouvé"
    fi

    log INFO "Prérequis vérifiés ✓"
}

# ============================================================================
# FONCTION : Tester la connectivité réseau
# ============================================================================
check_network() {
    log INFO "Test de connectivité réseau..."

    # Test ping vers Google DNS
    if ping -c 1 -W 2 8.8.8.8 &>/dev/null; then
        log INFO "Connectivité Internet : ${GREEN}✓ Disponible${NC}"
    else
        log WARN "Connectivité Internet : ${YELLOW}✗ Indisponible${NC}"
        log WARN "Certaines fonctionnalités nécessitant Internet ne seront pas disponibles"
    fi

    # Test DNS
    if ping -c 1 -W 2 google.com &>/dev/null; then
        log INFO "Résolution DNS : ${GREEN}✓ Fonctionnelle${NC}"
    else
        log WARN "Résolution DNS : ${YELLOW}✗ Non fonctionnelle${NC}"
    fi
}

# ============================================================================
# FONCTION : Initialiser le fichier de session
# ============================================================================
init_session() {
    log INFO "Initialisation de la session..."

    SESSION_ID=$(date '+%Y%m%d_%H%M%S')
    SESSION_LOG="${LOGS_DIR}/session_${SESSION_ID}.log"

    cat > "$SESSION_LOG" <<EOF
# MCP Kali Linux - Session Log
# ============================================================================
# Session ID: ${SESSION_ID}
# Start Time: $(date '+%Y-%m-%d %H:%M:%S')
# Container: $(hostname)
# User: ia
# ============================================================================

EOF

    log INFO "Session ID: ${SESSION_ID}"
    log INFO "Log de session: ${SESSION_LOG}"

    # Exporter pour utilisation par d'autres scripts
    export SESSION_ID
    export SESSION_LOG
}

# ============================================================================
# FONCTION : Démarrer le serveur SSH (optionnel)
# ============================================================================
start_ssh() {
    if [ "$SSH_ENABLED" = "true" ]; then
        log INFO "Démarrage du serveur SSH..."

        # Générer les clés SSH si elles n'existent pas
        if [ ! -f /etc/ssh/ssh_host_rsa_key ]; then
            log INFO "Génération des clés SSH..."
            ssh-keygen -A
        fi

        # Démarrer SSH
        /usr/sbin/sshd

        if [ $? -eq 0 ]; then
            log INFO "Serveur SSH démarré sur port 22 ✓"
        else
            log ERROR "Échec du démarrage SSH"
        fi
    else
        log DEBUG "SSH désactivé (variable SSH_ENABLED=false)"
    fi
}

# ============================================================================
# FONCTION : Démarrer TTYD (Terminal Web)
# ============================================================================
start_ttyd() {
    log INFO "Démarrage de TTYD (terminal web)..."

    # Options TTYD
    # -p : port
    # -i : interface (0.0.0.0 pour toutes, 127.0.0.1 pour local)
    # -W : writable (permet l'écriture)
    # -t : options du terminal

    # TODO: Ajouter authentification pour TTYD en production
    # Exemple avec basic auth: ttyd -c user:pass bash

    su - ia -c "ttyd -p ${TTYD_PORT} -i 0.0.0.0 -W bash" &
    TTYD_PID=$!

    sleep 2

    if ps -p $TTYD_PID > /dev/null; then
        log INFO "TTYD démarré sur port ${TTYD_PORT} (PID: ${TTYD_PID}) ✓"
        log INFO "Accès web: http://localhost:${TTYD_PORT}"
        echo $TTYD_PID > /var/run/ttyd.pid
    else
        log ERROR "Échec du démarrage de TTYD"
    fi
}

# ============================================================================
# FONCTION : Démarrer l'agent MCP
# ============================================================================
start_mcp_agent() {
    if [ "$MCP_AGENT_ENABLED" = "true" ]; then
        log INFO "Démarrage de l'agent MCP..."

        if [ -f "${MCP_DIR}/mcp_agent.sh" ]; then
            # Lancer en tant qu'utilisateur ia
            su - ia -c "${MCP_DIR}/mcp_agent.sh" &
            MCP_PID=$!

            sleep 1

            if ps -p $MCP_PID > /dev/null; then
                log INFO "Agent MCP démarré (PID: ${MCP_PID}) ✓"
                echo $MCP_PID > /var/run/mcp_agent.pid
            else
                log ERROR "Échec du démarrage de l'agent MCP"
            fi
        else
            log WARN "Script mcp_agent.sh non trouvé, agent non démarré"
        fi
    else
        log DEBUG "Agent MCP désactivé (variable MCP_AGENT_ENABLED=false)"
    fi
}

# ============================================================================
# FONCTION : Afficher les informations système
# ============================================================================
show_system_info() {
    log INFO "Informations système:"
    echo "  • Hostname: $(hostname)"
    echo "  • OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo "  • Kernel: $(uname -r)"
    echo "  • IP: $(hostname -I | awk '{print $1}')"
    echo "  • User: $(whoami)"
    echo "  • Working Directory: $(pwd)"
}

# ============================================================================
# FONCTION : Afficher les outils disponibles
# ============================================================================
show_available_tools() {
    log INFO "Outils de sécurité disponibles:"

    local tools=(
        "nmap:Scanner de ports réseau"
        "sqlmap:Exploitation SQL Injection"
        "nikto:Scanner de vulnérabilités web"
        "hydra:Brute force de mots de passe"
        "tcpdump:Capture de paquets réseau"
        "gobuster:Directory/DNS busting"
        "hashcat:Cassage de hash"
        "john:John the Ripper"
        "masscan:Scanner de ports ultra-rapide"
        "nuclei:Scanner de vulnérabilités basé sur templates"
    )

    for tool_info in "${tools[@]}"; do
        tool=$(echo $tool_info | cut -d':' -f1)
        desc=$(echo $tool_info | cut -d':' -f2)

        if command -v $tool &> /dev/null; then
            echo -e "  ${GREEN}✓${NC} $tool - $desc"
        else
            echo -e "  ${RED}✗${NC} $tool - $desc (non installé)"
        fi
    done
}

# ============================================================================
# FONCTION : Signal handler pour arrêt propre
# ============================================================================
cleanup() {
    log INFO "Signal d'arrêt reçu, nettoyage..."

    # Arrêter les processus lancés
    if [ -f /var/run/ttyd.pid ]; then
        kill $(cat /var/run/ttyd.pid) 2>/dev/null || true
    fi

    if [ -f /var/run/mcp_agent.pid ]; then
        kill $(cat /var/run/mcp_agent.pid) 2>/dev/null || true
    fi

    log INFO "Conteneur arrêté proprement"
    exit 0
}

# Capturer les signaux d'arrêt
trap cleanup SIGTERM SIGINT SIGQUIT

# ============================================================================
# MAIN - Point d'entrée principal
# ============================================================================
main() {
    # Afficher la bannière
    show_banner

    # Initialisation
    check_prerequisites
    init_session
    check_network

    # Informations système
    show_system_info
    show_available_tools

    # Démarrer les services
    start_ssh
    start_ttyd
    start_mcp_agent

    # Message final
    echo ""
    log INFO "=========================================="
    log INFO "Environnement MCP Kali prêt ! 🟣"
    log INFO "=========================================="
    echo ""
    log INFO "Accès terminal web: http://localhost:${TTYD_PORT}"
    log INFO "Accès shell: docker exec -it mcp_kali bash"
    log INFO "Session Log: ${SESSION_LOG}"
    echo ""
    log INFO "L'agent MCP surveille: ${AI_CONTEXT_DIR}/mission.json"
    echo ""

    # Garder le conteneur actif
    log INFO "Conteneur actif, en attente de commandes..."

    # Boucle infinie avec possibilité d'interruption
    while true; do
        sleep 60
        # TODO: Ajouter des checks de santé périodiques ici si besoin
    done
}

# Lancer le script principal
main "$@"
