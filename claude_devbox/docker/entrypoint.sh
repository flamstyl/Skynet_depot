#!/bin/bash

# Claude DevBox - Docker Entrypoint Script
# Prepares the container environment and executes user commands

set -e

echo "========================================"
echo "  Claude DevBox - Sandbox Environment"
echo "========================================"
echo ""

# Print environment info
echo "Container Information:"
echo "  User: $(whoami)"
echo "  Working Directory: $(pwd)"
echo "  Python: $(python3 --version)"
echo "  Node.js: $(node --version)"
echo "  Java: $(java --version 2>&1 | head -n1)"
echo "  Rust: $(rustc --version)"
echo "  Go: $(go version)"
echo "  .NET: $(dotnet --version)"
echo ""

# Check internet connectivity
echo "Testing Internet Connectivity..."
if curl -sSf --connect-timeout 5 https://www.google.com > /dev/null 2>&1; then
    echo "  ✓ Internet connection: Available"
else
    echo "  ✗ Internet connection: Not available"
fi
echo ""

# Ensure workspace permissions
sudo chown -R devbox:devbox /workspace 2>/dev/null || true

# Set up Python virtual environment if requirements.txt exists
if [ -f "/workspace/input/requirements.txt" ]; then
    echo "Installing Python dependencies..."
    pip3 install --quiet -r /workspace/input/requirements.txt
    echo "  ✓ Python dependencies installed"
    echo ""
fi

# Set up Node.js dependencies if package.json exists
if [ -f "/workspace/input/package.json" ]; then
    echo "Installing Node.js dependencies..."
    cd /workspace/input
    npm install --quiet
    echo "  ✓ Node.js dependencies installed"
    echo ""
fi

# Set up Rust dependencies if Cargo.toml exists
if [ -f "/workspace/input/Cargo.toml" ]; then
    echo "Building Rust project..."
    cd /workspace/input
    cargo build --quiet
    echo "  ✓ Rust project built"
    echo ""
fi

# Set up Go dependencies if go.mod exists
if [ -f "/workspace/input/go.mod" ]; then
    echo "Installing Go dependencies..."
    cd /workspace/input
    go mod download
    echo "  ✓ Go dependencies installed"
    echo ""
fi

echo "========================================"
echo "  Environment Ready"
echo "========================================"
echo ""

# Execute the command passed to the container
exec "$@"
