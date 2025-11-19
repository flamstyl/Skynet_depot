#!/bin/bash
# QEMU Launcher for Linux VM Testing
# Claude DevBox - Linux VM Environment

set -e

# Configuration
VM_NAME="devbox-linux"
VM_IMAGE="devbox-ubuntu.qcow2"
VM_SIZE="20G"
VM_MEMORY="2048"
VM_CPUS="2"
SSH_PORT="2222"
ISO_URL="https://releases.ubuntu.com/22.04/ubuntu-22.04.3-live-server-amd64.iso"
ISO_FILE="ubuntu-22.04-server.iso"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== Claude DevBox Linux VM Launcher ===${NC}"

# Check if QEMU is installed
if ! command -v qemu-system-x86_64 &> /dev/null; then
    echo -e "${RED}Error: QEMU not installed${NC}"
    echo "Install with: sudo apt-get install qemu-system-x86 qemu-utils"
    exit 1
fi

# Create VM directory
mkdir -p vms
cd vms

# Create VM image if it doesn't exist
if [ ! -f "${VM_IMAGE}" ]; then
    echo -e "${YELLOW}VM image not found, creating...${NC}"

    # Download ISO if needed
    if [ ! -f "${ISO_FILE}" ]; then
        echo -e "${BLUE}Downloading Ubuntu Server ISO...${NC}"
        wget -O "${ISO_FILE}" "${ISO_URL}"
    fi

    # Create qcow2 image
    echo -e "${BLUE}Creating VM disk image (${VM_SIZE})...${NC}"
    qemu-img create -f qcow2 "${VM_IMAGE}" "${VM_SIZE}"

    echo -e "${YELLOW}First-time setup: Please install Ubuntu manually${NC}"
    echo -e "${YELLOW}User: devbox | Password: devbox${NC}"
    echo -e "${YELLOW}Enable SSH server during installation${NC}"

    # First boot with ISO for installation
    qemu-system-x86_64 \
        -name "${VM_NAME}" \
        -m "${VM_MEMORY}" \
        -smp "${VM_CPUS}" \
        -hda "${VM_IMAGE}" \
        -cdrom "${ISO_FILE}" \
        -boot d \
        -net nic -net user,hostfwd=tcp::${SSH_PORT}-:22 \
        -enable-kvm

    echo -e "${GREEN}Installation complete. Restart this script to boot the VM.${NC}"
    exit 0
fi

# Normal boot (VM already installed)
echo -e "${GREEN}Starting Linux VM...${NC}"
echo -e "SSH Port: ${SSH_PORT}"
echo -e "SSH Command: ${BLUE}ssh -p ${SSH_PORT} devbox@localhost${NC}"
echo ""

# Start VM in background
qemu-system-x86_64 \
    -name "${VM_NAME}" \
    -m "${VM_MEMORY}" \
    -smp "${VM_CPUS}" \
    -hda "${VM_IMAGE}" \
    -net nic -net user,hostfwd=tcp::${SSH_PORT}-:22 \
    -enable-kvm \
    -nographic \
    -daemonize \
    -pidfile "${VM_NAME}.pid"

echo -e "${GREEN}✓ Linux VM started${NC}"
echo "PID file: ${VM_NAME}.pid"
echo ""
echo "To connect:"
echo "  ssh -p ${SSH_PORT} devbox@localhost"
echo ""
echo "To stop:"
echo "  kill \$(cat ${VM_NAME}.pid)"
