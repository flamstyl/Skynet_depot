#!/usr/bin/env bash
set -e

echo "🧠 Installation du Local LLM MCP..."

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create data directories
mkdir -p data/cache data/logs

# Create .env
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Fichier .env créé. Éditez-le avec vos configurations."
fi

echo ""
echo "✅ Installation terminée !"
echo ""
echo "Pour démarrer : npm start"
echo "Pour connecter à Claude Code CLI :"
echo "  claude mcp add llm-assistant stdio node $(pwd)/dist/server.js"
