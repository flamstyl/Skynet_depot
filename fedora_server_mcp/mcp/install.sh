#!/bin/bash
# ================================================================
# 🔧 MCP Install - AI Tools Installation Script
# ================================================================
# Purpose: Install AI CLI tools and development environments
# Tools: Claude CLI, Gemini CLI, OpenAI CLI, Node.js, Go, Rust, etc.
# ================================================================

set -e

# ================================================================
# 🎨 COLORS
# ================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ================================================================
# 📝 LOGGING
# ================================================================
log() {
    local level=$1
    shift
    local message="$@"

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
    esac
}

# ================================================================
# 🐍 PYTHON ENVIRONMENT
# ================================================================

install_python_tools() {
    log INFO "Installing Python AI tools..."

    # Anthropic Claude CLI
    log INFO "📦 Installing Claude CLI (Anthropic)..."
    pip3 install --upgrade anthropic

    # OpenAI CLI
    log INFO "📦 Installing OpenAI CLI..."
    pip3 install --upgrade openai

    # Google Gemini
    log INFO "📦 Installing Google Generative AI..."
    pip3 install --upgrade google-generativeai

    # Additional AI/ML tools
    log INFO "📦 Installing additional Python AI tools..."
    pip3 install --upgrade \
        langchain \
        langchain-community \
        transformers \
        torch \
        numpy \
        pandas \
        matplotlib \
        requests \
        aiohttp \
        pyyaml \
        markdown \
        beautifulsoup4 \
        lxml

    log INFO "✅ Python AI tools installed"
}

# ================================================================
# 🟢 NODE.JS ENVIRONMENT
# ================================================================

install_nodejs() {
    log INFO "Installing Node.js and npm..."

    if command -v node &> /dev/null; then
        log INFO "✓ Node.js already installed: $(node --version)"
    else
        log INFO "📦 Installing Node.js via DNF..."
        sudo dnf install -y nodejs npm

        # Update npm
        sudo npm install -g npm@latest

        log INFO "✅ Node.js installed: $(node --version)"
    fi

    # Install useful Node.js AI packages
    log INFO "📦 Installing Node.js AI packages..."
    sudo npm install -g \
        @anthropic-ai/sdk \
        openai \
        @google/generative-ai \
        axios \
        typescript \
        ts-node \
        prettier \
        eslint

    log INFO "✅ Node.js environment ready"
}

# ================================================================
# 🦀 RUST ENVIRONMENT
# ================================================================

install_rust() {
    log INFO "Installing Rust programming language..."

    if command -v rustc &> /dev/null; then
        log INFO "✓ Rust already installed: $(rustc --version)"
    else
        log INFO "📦 Installing Rust via rustup..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

        # Source Rust environment
        source "$HOME/.cargo/env"

        log INFO "✅ Rust installed: $(rustc --version)"
    fi
}

# ================================================================
# 🐹 GO ENVIRONMENT
# ================================================================

install_go() {
    log INFO "Installing Go programming language..."

    if command -v go &> /dev/null; then
        log INFO "✓ Go already installed: $(go version)"
    else
        log INFO "📦 Installing Go via DNF..."
        sudo dnf install -y golang

        # Setup Go environment
        mkdir -p ~/go/{bin,src,pkg}
        echo 'export GOPATH=$HOME/go' >> ~/.bashrc
        echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc

        log INFO "✅ Go installed: $(go version)"
    fi
}

# ================================================================
# 🐳 DOCKER TOOLS
# ================================================================

install_docker_tools() {
    log INFO "Installing Docker management tools..."

    # Docker Compose standalone (if not already present)
    if ! command -v docker-compose &> /dev/null; then
        log INFO "📦 Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
            -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi

    # ctop - container monitoring
    log INFO "📦 Installing ctop..."
    sudo curl -L https://github.com/bcicen/ctop/releases/latest/download/ctop-linux-amd64 \
        -o /usr/local/bin/ctop
    sudo chmod +x /usr/local/bin/ctop

    # lazydocker - Docker TUI
    log INFO "📦 Installing lazydocker..."
    curl https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh | bash

    log INFO "✅ Docker tools installed"
}

# ================================================================
# 🎨 GRAPHISM & DESIGN TOOLS
# ================================================================

install_graphics_tools() {
    log INFO "Installing graphics and design tools..."

    sudo dnf install -y \
        ImageMagick \
        gimp \
        inkscape \
        graphviz \
        ffmpeg \
        fontconfig

    # Python imaging libraries
    pip3 install --upgrade \
        Pillow \
        opencv-python \
        scikit-image

    log INFO "✅ Graphics tools installed"
}

# ================================================================
# 🛠️ DEVELOPMENT TOOLS
# ================================================================

install_dev_tools() {
    log INFO "Installing development tools..."

    sudo dnf install -y \
        make \
        cmake \
        gcc \
        gcc-c++ \
        clang \
        llvm \
        gdb \
        valgrind \
        strace \
        ltrace \
        perf \
        bpftrace

    log INFO "✅ Development tools installed"
}

# ================================================================
# 📊 MONITORING & OBSERVABILITY
# ================================================================

install_monitoring_tools() {
    log INFO "Installing monitoring tools..."

    sudo dnf install -y \
        htop \
        glances \
        iotop \
        iftop \
        nethogs \
        ncdu

    # btop - advanced system monitor
    log INFO "📦 Installing btop..."
    sudo dnf install -y btop || log WARN "btop not available in repos"

    log INFO "✅ Monitoring tools installed"
}

# ================================================================
# 🎬 MAIN INSTALLATION
# ================================================================

main() {
    echo -e "${CYAN}"
    cat << "EOF"
╔════════════════════════════════════════════════════════╗
║                                                        ║
║           🔧 MCP AI TOOLS INSTALLATION 🔧              ║
║                                                        ║
║              Installing AI Development                ║
║                   Environment                          ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    log INFO "Starting installation process..."

    # Update system first
    log INFO "🔄 Updating system packages..."
    sudo dnf update -y

    # Install components
    install_python_tools
    install_nodejs
    install_rust
    install_go
    install_docker_tools
    install_graphics_tools
    install_dev_tools
    install_monitoring_tools

    echo -e "${GREEN}"
    cat << "EOF"
╔════════════════════════════════════════════════════════╗
║                                                        ║
║         ✅ INSTALLATION COMPLETED SUCCESSFULLY         ║
║                                                        ║
║           All AI tools have been installed             ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    log INFO "Installation summary:"
    log INFO "  ✓ Python AI tools (Claude, OpenAI, Gemini)"
    log INFO "  ✓ Node.js environment"
    log INFO "  ✓ Rust compiler"
    log INFO "  ✓ Go compiler"
    log INFO "  ✓ Docker tools"
    log INFO "  ✓ Graphics tools"
    log INFO "  ✓ Development tools"
    log INFO "  ✓ Monitoring tools"
}

# Run installation
main
