#!/bin/bash

# Claude DevBox - Setup Script
# Quick setup for development environment

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        Claude DevBox - Skynet Setup Wizard                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
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

# Check Docker
check_docker() {
    log_info "Checking Docker..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        log_info "Install from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    log_info "✓ Docker installed: $(docker --version)"
}

# Check Node.js
check_node() {
    log_info "Checking Node.js..."
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        log_info "Install from: https://nodejs.org/"
        exit 1
    fi
    log_info "✓ Node.js installed: $(node --version)"
}

# Install Node dependencies
install_node_deps() {
    log_info "Installing Node.js dependencies..."
    cd server
    npm install
    cd ..
    log_info "✓ Dependencies installed"
}

# Build Docker image
build_docker() {
    log_info "Building Docker image (this may take a while)..."
    cd docker
    docker build -t devbox:latest .
    cd ..
    log_info "✓ Docker image built successfully"
}

# Create directories
create_dirs() {
    log_info "Creating workspace directories..."
    mkdir -p workspace/input workspace/output runs server/logs vms/images
    log_info "✓ Directories created"
}

# Copy example files
copy_examples() {
    log_info "Copying example files..."
    if [ -f "workspace/input/example_python.py" ]; then
        log_info "✓ Examples already present"
    else
        log_warn "No examples found (expected, will be created on first run)"
    fi
}

# Create .env file
create_env() {
    if [ ! -f "server/.env" ]; then
        log_info "Creating .env file..."
        cat > server/.env << 'EOF'
# Claude DevBox Configuration

# Server
PORT=4000
NODE_ENV=development
LOG_LEVEL=info

# Docker
DOCKER_IMAGE=devbox:latest
DOCKER_MEMORY=4g
DOCKER_CPUS=2

# MCP (Claude CLI integration)
MCP_ENDPOINT=http://localhost:3000/mcp

# VMs
QEMU_VM_MEMORY=2048
QEMU_SSH_PORT=2222
VBOX_VM_NAME=devbox-windows-test
EOF
        log_info "✓ .env file created"
    else
        log_info "✓ .env file already exists"
    fi
}

# Set permissions
set_permissions() {
    log_info "Setting executable permissions..."
    chmod +x vms/*.sh 2>/dev/null || true
    chmod +x docker/entrypoint.sh
    chmod +x scripts/*.sh 2>/dev/null || true
    log_info "✓ Permissions set"
}

# Main setup
main() {
    log_info "Starting Claude DevBox setup..."
    echo ""

    check_docker
    check_node
    echo ""

    create_dirs
    create_env
    set_permissions
    echo ""

    install_node_deps
    echo ""

    log_info "Do you want to build the Docker image now? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        build_docker
    else
        log_warn "Skipping Docker build. Run './docker-build.sh' later to build."
    fi

    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              Setup Complete! 🎉                             ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    log_info "Next steps:"
    echo "  1. Start the server: cd server && npm start"
    echo "  2. Open http://localhost:4000 in your browser"
    echo "  3. Start coding with Claude DevBox!"
    echo ""
    log_info "For more information, see README.md"
}

main
