#!/bin/bash

# Grok CLI Setup Script
# Automated installation and configuration

set -e  # Exit on error

echo "🟣 =================================="
echo "🟣 Grok CLI v2.0.0 PRO Setup"
echo "🟣 =================================="
echo ""

# Check Python
echo "📋 Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo "✓ Python $PYTHON_VERSION found"

# Check Node.js
echo ""
echo "📋 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found. MCP server will not be available."
    echo "   Install from: https://nodejs.org/"
    NODE_AVAILABLE=false
else
    NODE_VERSION=$(node --version)
    echo "✓ Node.js $NODE_VERSION found"
    NODE_AVAILABLE=true
fi

# Check Docker
echo ""
echo "📋 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. Sandbox execution will not be available."
    echo "   Install from: https://docker.com/"
    DOCKER_AVAILABLE=false
else
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
    echo "✓ Docker $DOCKER_VERSION found"
    DOCKER_AVAILABLE=true
fi

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✓ Python dependencies installed"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Install Node.js dependencies
if [ "$NODE_AVAILABLE" = true ]; then
    echo ""
    echo "📦 Installing Node.js dependencies..."
    cd mcp
    npm install
    cd ..
    echo "✓ Node.js dependencies installed"
fi

# Create directories
echo ""
echo "📁 Creating directories..."
mkdir -p data/vectorstore
mkdir -p logs
mkdir -p workspace
echo "✓ Directories created"

# Build Docker sandbox (optional)
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo ""
    read -p "🐳 Build Docker sandbox image? (recommended) [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔨 Building Docker sandbox..."
        cd docker
        docker build -f Dockerfile.sandbox -t grok-cli-sandbox:latest .
        cd ..
        echo "✓ Docker sandbox built"
    fi
fi

# Setup environment
echo ""
echo "⚙️  Setting up environment..."

if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Grok CLI Environment Variables

# LLM Provider (choose one)
# OPENAI_API_KEY=your_openai_key_here
# ANTHROPIC_API_KEY=your_anthropic_key_here

# API Configuration (optional)
# GROK_API_URL=http://localhost:8100

# Add your API keys above
EOF
    echo "✓ .env file created - PLEASE ADD YOUR API KEYS!"
else
    echo "✓ .env file already exists"
fi

# Make scripts executable
chmod +x grok.py cli.py setup.sh

# Summary
echo ""
echo "🎉 =================================="
echo "🎉 Installation Complete!"
echo "🎉 =================================="
echo ""
echo "📋 Component Status:"
echo "   ✓ Python dependencies installed"
if [ "$NODE_AVAILABLE" = true ]; then
    echo "   ✓ Node.js dependencies installed"
else
    echo "   ⚠️  Node.js not available (MCP disabled)"
fi
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "   ✓ Docker available"
else
    echo "   ⚠️  Docker not available (sandbox disabled)"
fi
echo ""
echo "⚡ Next Steps:"
echo ""
echo "1. Add your API key to .env file:"
echo "   nano .env"
echo ""
echo "2. Run Grok CLI interactively:"
echo "   python3 cli.py start"
echo ""
echo "3. Or start all services:"
echo "   # Terminal 1:"
echo "   python3 api/server.py"
echo ""
echo "   # Terminal 2:"
echo "   cd mcp && npm start"
echo ""
echo "   # Terminal 3:"
echo "   streamlit run dashboard/app.py"
echo ""
echo "📖 Read QUICKSTART.md for detailed instructions"
echo "📖 Read README.md for full documentation"
echo ""
echo "🟣 Grok CLI ready! Happy coding! 🚀"
