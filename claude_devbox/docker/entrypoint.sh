#!/bin/bash
# Claude DevBox Sandbox Entrypoint
# This script initializes the sandbox environment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Claude DevBox Sandbox ===${NC}"
echo -e "${GREEN}Initializing execution environment...${NC}"

# Display environment info
echo "User: $(whoami)"
echo "Working Directory: $(pwd)"
echo "Python: $(python --version 2>&1)"
echo "Node.js: $(node --version 2>&1)"
echo "Rust: $(rustc --version 2>&1)"
echo "Go: $(go version 2>&1)"

# Check internet connectivity
if ping -c 1 8.8.8.8 &> /dev/null; then
    echo -e "${GREEN}✓ Internet connectivity enabled${NC}"
else
    echo -e "${RED}⚠ No internet connectivity${NC}"
fi

# Ensure workspace directories exist
mkdir -p /workspace/input /workspace/output

# Set proper permissions
chmod 755 /workspace/input /workspace/output 2>/dev/null || true

echo -e "${GREEN}Environment ready!${NC}"
echo ""

# Execute the command passed to the container
if [ $# -eq 0 ]; then
    echo "No command specified, starting interactive shell..."
    exec /bin/bash
else
    echo "Executing: $@"
    echo ""
    exec "$@"
fi
