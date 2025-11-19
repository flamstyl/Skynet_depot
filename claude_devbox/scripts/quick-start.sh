#!/bin/bash
# Claude DevBox - Quick Start Script
# This script sets up and starts the entire DevBox environment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Claude DevBox - Quick Start          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}[1/7] Checking prerequisites...${NC}"

command -v node >/dev/null 2>&1 || {
  echo -e "${RED}Error: Node.js not installed${NC}"
  echo "Install from: https://nodejs.org/"
  exit 1
}

command -v docker >/dev/null 2>&1 || {
  echo -e "${RED}Error: Docker not installed${NC}"
  echo "Install from: https://www.docker.com/"
  exit 1
}

echo -e "${GREEN}✓ Prerequisites OK${NC}"

# Install backend dependencies
echo -e "${BLUE}[2/7] Installing backend dependencies...${NC}"
cd server
npm install
cd ..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Install frontend dependencies
echo -e "${BLUE}[3/7] Installing frontend dependencies...${NC}"
cd editor
npm install
cd ..
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Build Docker sandbox
echo -e "${BLUE}[4/7] Building Docker sandbox...${NC}"
cd docker

if docker images | grep -q "devbox-sandbox"; then
  echo -e "${YELLOW}Sandbox image already exists, skipping build...${NC}"
else
  bash build.sh
fi

cd ..
echo -e "${GREEN}✓ Docker sandbox ready${NC}"

# Create necessary directories
echo -e "${BLUE}[5/7] Creating workspace directories...${NC}"
mkdir -p workspace/input workspace/output runs logs
echo -e "${GREEN}✓ Directories created${NC}"

# Setup configuration
echo -e "${BLUE}[6/7] Setting up configuration...${NC}"

if [ ! -f server/config.yaml ]; then
  cat > server/config.yaml <<EOF
server:
  port: 3000
  host: 0.0.0.0

docker:
  image: devbox-sandbox:latest
  memory: 512
  cpuQuota: 50000
  networkEnabled: true
  timeout: 300000

autofix:
  enabled: true
  maxAttempts: 5
  timeout: 60000

vm:
  linux:
    enabled: false
    sshPort: 2222
  windows:
    enabled: false

workspace:
  inputDir: ../workspace/input
  outputDir: ../workspace/output

logging:
  level: info
  retentionDays: 30

mcp:
  enabled: false
  claudeApiKey: ""
EOF
  echo -e "${GREEN}✓ Created default config.yaml${NC}"
else
  echo -e "${YELLOW}config.yaml already exists, skipping...${NC}"
fi

# Start services
echo -e "${BLUE}[7/7] Starting services...${NC}"
echo ""
echo -e "${YELLOW}Choose startup mode:${NC}"
echo -e "  ${GREEN}1)${NC} Development mode (hot reload)"
echo -e "  ${GREEN}2)${NC} Electron app (desktop)"
echo -e "  ${GREEN}3)${NC} Docker Compose (production)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo -e "${BLUE}Starting in development mode...${NC}"
    echo ""
    echo -e "${GREEN}Backend will start on:${NC} http://localhost:3000"
    echo -e "${GREEN}Frontend will start on:${NC} http://localhost:5173"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""

    # Start backend in background
    cd server
    npm run dev &
    BACKEND_PID=$!
    cd ..

    # Wait a bit for backend to start
    sleep 3

    # Start frontend
    cd editor
    npm run dev

    # Cleanup on exit
    kill $BACKEND_PID
    ;;

  2)
    echo -e "${BLUE}Starting Electron app...${NC}"
    cd editor
    npm run electron:dev
    ;;

  3)
    echo -e "${BLUE}Starting with Docker Compose...${NC}"
    docker-compose up -d
    echo ""
    echo -e "${GREEN}✓ Services started!${NC}"
    echo ""
    echo -e "Access the application:"
    echo -e "  Frontend: ${GREEN}http://localhost:5173${NC}"
    echo -e "  Backend API: ${GREEN}http://localhost:3000${NC}"
    echo -e "  Health check: ${GREEN}http://localhost:3000/health${NC}"
    echo ""
    echo -e "View logs:"
    echo -e "  ${BLUE}docker-compose logs -f${NC}"
    echo ""
    echo -e "Stop services:"
    echo -e "  ${BLUE}docker-compose down${NC}"
    ;;

  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Claude DevBox is ready! 🚀           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
