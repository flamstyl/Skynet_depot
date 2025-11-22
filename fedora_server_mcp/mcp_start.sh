#!/bin/bash
# ================================================================
# 🤖 MCP Start Script - Fedora Server AI VM Entry Point
# ================================================================
# Purpose: Initialize and start the AI Virtual Machine
# Author: Skynet Depot AI Team
# ================================================================

set -e

# ================================================================
# 🎨 COLORS
# ================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ================================================================
# 📊 VARIABLES
# ================================================================
MCP_PATH="/mcp"
DATA_PATH="/data"
LOG_PATH="/var/log/mcp"
LOG_FILE="${LOG_PATH}/startup_$(date +%Y-%m-%d_%H-%M-%S).log"

# ================================================================
# 🎭 BANNER
# ================================================================
print_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ███████╗███████╗██████╗  ██████╗ ██████╗  ██████╗      ║
║   ██╔════╝██╔════╝██╔══██╗██╔═══██╗██╔══██╗██╔═══██╗     ║
║   █████╗  █████╗  ██║  ██║██║   ██║██████╔╝██║   ██║     ║
║   ██╔══╝  ██╔══╝  ██║  ██║██║   ██║██╔══██╗██║   ██║     ║
║   ██║     ███████╗██████╔╝╚██████╔╝██║  ██║╚██████╔╝     ║
║   ╚═╝     ╚══════╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝      ║
║                                                           ║
║              🤖 FEDORA SERVER MCP AI VM 🤖                ║
║                                                           ║
║          Model Context Protocol Virtual Machine          ║
║                   Skynet Depot 2025                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# ================================================================
# 📝 LOGGING FUNCTION
# ================================================================
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case $level in
        INFO)
            echo -e "${GREEN}[INFO]${NC} ${message}"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} ${message}"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} ${message}"
            ;;
        DEBUG)
            echo -e "${BLUE}[DEBUG]${NC} ${message}"
            ;;
    esac

    echo "[${timestamp}] [${level}] ${message}" >> "${LOG_FILE}"
}

# ================================================================
# ✅ CHECKS
# ================================================================

check_internet() {
    log INFO "Checking internet connectivity..."

    if ping -c 3 1.1.1.1 >/dev/null 2>&1; then
        log INFO "✓ Internet connectivity OK (ping 1.1.1.1)"
    else
        log WARN "✗ Cannot ping 1.1.1.1"
    fi

    if curl -s --max-time 5 https://google.com >/dev/null 2>&1; then
        log INFO "✓ HTTPS connectivity OK (google.com)"
    else
        log WARN "✗ Cannot reach google.com"
    fi

    if dnf check-update >/dev/null 2>&1; then
        log INFO "✓ DNF connectivity OK"
    else
        log WARN "✗ DNF check-update failed"
    fi
}

check_directories() {
    log INFO "Checking directory structure..."

    for dir in "${MCP_PATH}" "${DATA_PATH}" "${LOG_PATH}" "${MCP_PATH}/memory"; do
        if [ -d "$dir" ]; then
            log INFO "✓ Directory exists: $dir"
        else
            log WARN "✗ Creating missing directory: $dir"
            mkdir -p "$dir"
            chown ia:ia "$dir" 2>/dev/null || true
        fi
    done
}

check_mcp_scripts() {
    log INFO "Checking MCP scripts..."

    if [ -f "${MCP_PATH}/start.sh" ]; then
        log INFO "✓ MCP start.sh found"
        chmod +x "${MCP_PATH}/start.sh"
    else
        log WARN "✗ MCP start.sh not found"
    fi

    if [ -f "${MCP_PATH}/watcher.sh" ]; then
        log INFO "✓ MCP watcher.sh found"
        chmod +x "${MCP_PATH}/watcher.sh"
    else
        log WARN "✗ MCP watcher.sh not found"
    fi
}

# ================================================================
# 🚀 STARTUP SEQUENCE
# ================================================================

startup() {
    log INFO "Starting Fedora Server MCP AI VM..."
    log INFO "Timestamp: $(date)"
    log INFO "Hostname: $(hostname)"
    log INFO "User: $(whoami)"
    log INFO "Working directory: $(pwd)"

    # Run checks
    check_directories
    check_internet
    check_mcp_scripts

    # Start MCP system
    if [ -f "${MCP_PATH}/start.sh" ]; then
        log INFO "Launching MCP system..."
        su - ia -c "bash ${MCP_PATH}/start.sh" &
    fi

    # Optional: Start SSH
    # log INFO "Starting SSH daemon..."
    # /usr/sbin/sshd -D &

    log INFO "Fedora Server MCP AI VM is ready!"
    log INFO "MCP Path: ${MCP_PATH}"
    log INFO "Data Path: ${DATA_PATH}"
    log INFO "Log Path: ${LOG_PATH}"
}

# ================================================================
# 🔄 KEEP ALIVE
# ================================================================

keep_alive() {
    log INFO "Entering keep-alive mode..."
    log INFO "Container will remain running. Use 'docker exec' to interact."

    # Infinite loop to keep container alive
    while true; do
        sleep 3600
        log DEBUG "Heartbeat: $(date)"
    done
}

# ================================================================
# 🎬 MAIN
# ================================================================

main() {
    print_banner
    startup
    keep_alive
}

# Trap SIGTERM and SIGINT for graceful shutdown
trap 'log INFO "Received shutdown signal. Stopping..."; exit 0' SIGTERM SIGINT

main
