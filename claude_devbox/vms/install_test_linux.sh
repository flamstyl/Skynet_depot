#!/bin/bash
# Linux VM - Test Environment Setup
# Installs necessary tools for testing code in Linux VM

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Setting up Linux VM for DevBox Testing ===${NC}"

# Update system
echo -e "${GREEN}Updating system...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Install build essentials
echo -e "${GREEN}Installing build tools...${NC}"
sudo apt-get install -y \
    build-essential \
    git \
    curl \
    wget \
    vim \
    htop \
    net-tools

# Install Python
echo -e "${GREEN}Installing Python...${NC}"
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv

# Install Node.js
echo -e "${GREEN}Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Rust
echo -e "${GREEN}Installing Rust...${NC}"
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# Install Go
echo -e "${GREEN}Installing Go...${NC}"
wget -q https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
rm go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc

# Install Java
echo -e "${GREEN}Installing Java...${NC}"
sudo apt-get install -y default-jdk default-jre

# Install additional tools
echo -e "${GREEN}Installing additional tools...${NC}"
sudo apt-get install -y \
    gcc \
    g++ \
    make \
    cmake \
    ruby \
    php

# Create test directory
echo -e "${GREEN}Creating test directory...${NC}"
mkdir -p ~/test
chmod 755 ~/test

# Configure SSH
echo -e "${GREEN}Configuring SSH...${NC}"
sudo systemctl enable ssh
sudo systemctl start ssh

echo ""
echo -e "${GREEN}✓ Linux VM setup complete!${NC}"
echo ""
echo "Installed tools:"
echo "  Python: $(python3 --version)"
echo "  Node.js: $(node --version)"
echo "  Rust: $(rustc --version 2>/dev/null || echo 'Restart shell to use')"
echo "  Go: $(go version 2>/dev/null || echo 'Restart shell to use')"
echo "  Java: $(java -version 2>&1 | head -n 1)"
echo ""
echo "Test directory: ~/test"
echo ""
echo -e "${BLUE}You can now use this VM for testing code remotely!${NC}"
