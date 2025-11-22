#!/bin/bash
# ============================================================================
# Skynet VM MCP - Quick Start Script
# ============================================================================
# This script helps you get started quickly with the Fedora VM MCP
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "============================================================================"
echo -e "${PURPLE}🟣 Skynet VM MCP - Quick Start${NC}"
echo "============================================================================"
echo ""

# ============================================================================
# Check Prerequisites
# ============================================================================
echo -e "${CYAN}Checking prerequisites...${NC}"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found!${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker found"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose not found!${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker Compose found"

# Check KVM (optional)
if [ -e /dev/kvm ]; then
    echo -e "${GREEN}✓${NC} KVM available (hardware acceleration enabled)"
    KVM_AVAILABLE=true
else
    echo -e "${YELLOW}⚠${NC}  KVM not available (will use emulation - slower)"
    KVM_AVAILABLE=false
fi

echo ""

# ============================================================================
# Setup Menu
# ============================================================================
echo "What would you like to do?"
echo ""
echo "  1) Build Docker image"
echo "  2) Create VM disk (50GB)"
echo "  3) Download Fedora ISO"
echo "  4) Install Fedora (requires ISO)"
echo "  5) Start VM (normal operation)"
echo "  6) Stop VM"
echo "  7) Connect to VM (VNC instructions)"
echo "  8) Full setup (build + create disk + instructions)"
echo "  9) Exit"
echo ""
read -p "Enter your choice [1-9]: " choice

case $choice in
    1)
        echo ""
        echo -e "${CYAN}Building Docker image...${NC}"
        docker build -t fedora-vm-mcp .
        echo ""
        echo -e "${GREEN}✅ Docker image built successfully!${NC}"
        ;;

    2)
        echo ""
        echo -e "${CYAN}Creating VM disk...${NC}"

        # Create volume if it doesn't exist
        docker volume create skynet-vm-data

        # Create disk
        docker run --rm \
            -v skynet-vm-data:/vm \
            fedora-vm-mcp \
            qemu-img create -f qcow2 /vm/fedora.qcow2 50G

        echo ""
        echo -e "${GREEN}✅ VM disk created (50GB)${NC}"
        ;;

    3)
        echo ""
        echo -e "${CYAN}Downloading Fedora ISO...${NC}"
        echo ""
        echo "Latest Fedora Workstation: https://fedoraproject.org/workstation/download"
        echo ""
        echo "Download command example:"
        echo "  wget https://download.fedoraproject.org/pub/fedora/linux/releases/40/Workstation/x86_64/iso/Fedora-Workstation-Live-x86_64-40-1.14.iso"
        echo ""
        read -p "Press Enter to open download page in browser (if available)..."

        if command -v xdg-open &> /dev/null; then
            xdg-open "https://fedoraproject.org/workstation/download" &
        elif command -v open &> /dev/null; then
            open "https://fedoraproject.org/workstation/download" &
        fi
        ;;

    4)
        echo ""
        ISO_PATH=""
        read -p "Enter path to Fedora ISO: " ISO_PATH

        if [ ! -f "$ISO_PATH" ]; then
            echo -e "${RED}❌ ISO not found: $ISO_PATH${NC}"
            exit 1
        fi

        echo ""
        echo -e "${CYAN}Starting Fedora installation...${NC}"
        echo ""
        echo "The VM will boot from the ISO."
        echo "Connect via VNC to complete the installation:"
        echo ""
        echo -e "  ${YELLOW}VNC: localhost:5901${NC}"
        echo -e "  ${YELLOW}Password: skynet2025${NC}"
        echo ""
        echo "Installation steps:"
        echo "  1. Select language"
        echo "  2. Configure installation destination"
        echo "  3. Set root password"
        echo "  4. Create user (recommend: aiuser)"
        echo "  5. Begin installation"
        echo "  6. Reboot when complete"
        echo ""
        read -p "Press Enter to continue..."

        docker run -it --rm \
            --name skynet-vm-installer \
            --device /dev/kvm:/dev/kvm 2>/dev/null || true \
            -p 5901:5901 \
            -p 2222:2222 \
            -v skynet-vm-data:/vm \
            -v "$ISO_PATH":/vm/fedora.iso:ro \
            fedora-vm-mcp \
            /usr/local/bin/launch_vm.sh install
        ;;

    5)
        echo ""
        echo -e "${CYAN}Starting VM...${NC}"
        docker-compose up -d

        echo ""
        echo -e "${GREEN}✅ VM started!${NC}"
        echo ""
        echo "Connection info:"
        echo -e "  VNC: ${YELLOW}localhost:5901${NC} (password: skynet2025)"
        echo -e "  SSH: ${YELLOW}ssh -p 2222 aiuser@localhost${NC}"
        echo ""
        echo "Useful commands:"
        echo "  Logs:  docker-compose logs -f"
        echo "  Shell: docker exec -it skynet-vm bash"
        echo "  Stop:  docker-compose down"
        ;;

    6)
        echo ""
        echo -e "${CYAN}Stopping VM...${NC}"
        docker-compose down
        echo -e "${GREEN}✅ VM stopped${NC}"
        ;;

    7)
        echo ""
        echo -e "${CYAN}🖥️  VNC Connection Instructions${NC}"
        echo ""
        echo "1. Install a VNC viewer if you haven't:"
        echo "   - TigerVNC: https://tigervnc.org/"
        echo "   - RealVNC: https://www.realvnc.com/"
        echo "   - macOS: Use built-in Screen Sharing"
        echo ""
        echo "2. Connect to:"
        echo -e "   ${YELLOW}localhost:5901${NC} or ${YELLOW}localhost:1${NC}"
        echo ""
        echo "3. Password:"
        echo -e "   ${YELLOW}skynet2025${NC}"
        echo ""
        echo "4. Command line:"
        echo "   vncviewer localhost:5901"
        echo ""
        ;;

    8)
        echo ""
        echo -e "${CYAN}Running full setup...${NC}"
        echo ""

        # Build image
        echo -e "${BLUE}Step 1/3: Building Docker image...${NC}"
        docker build -t fedora-vm-mcp .

        # Create volume and disk
        echo ""
        echo -e "${BLUE}Step 2/3: Creating VM disk...${NC}"
        docker volume create skynet-vm-data
        docker run --rm \
            -v skynet-vm-data:/vm \
            fedora-vm-mcp \
            qemu-img create -f qcow2 /vm/fedora.qcow2 50G

        echo ""
        echo -e "${BLUE}Step 3/3: Next steps${NC}"
        echo ""
        echo -e "${GREEN}✅ Setup complete!${NC}"
        echo ""
        echo "Next steps:"
        echo ""
        echo "1. Download Fedora ISO:"
        echo "   wget https://download.fedoraproject.org/pub/fedora/linux/releases/40/Workstation/x86_64/iso/Fedora-Workstation-Live-x86_64-40-1.14.iso"
        echo ""
        echo "2. Install Fedora:"
        echo "   ./quick-start.sh"
        echo "   (choose option 4)"
        echo ""
        echo "3. Start VM:"
        echo "   docker-compose up -d"
        echo ""
        echo "4. Connect via VNC:"
        echo "   vncviewer localhost:5901"
        echo "   Password: skynet2025"
        echo ""
        ;;

    9)
        echo ""
        echo "Goodbye!"
        exit 0
        ;;

    *)
        echo ""
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "============================================================================"
echo -e "${GREEN}✅ Done!${NC}"
echo "============================================================================"
echo ""
