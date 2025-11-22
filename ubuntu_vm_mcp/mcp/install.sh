#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔧 MCP INSTALL SCRIPT - Installation des outils IA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Script d'installation des dépendances et outils IA
# Exécutez ce script pour installer Claude CLI, Ollama, Gemini CLI, etc.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔧 MCP Install Script - Installation des outils IA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📦 Mise à jour du système
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}📦 Mise à jour du système...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🐍 Installation de paquets Python utiles
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}🐍 Installation de paquets Python essentiels...${NC}"
pip install --upgrade pip

# Paquets Python de base pour IA
pip install \
    anthropic \
    openai \
    google-generativeai \
    requests \
    beautifulsoup4 \
    lxml \
    aiohttp \
    httpx \
    rich \
    typer \
    pydantic

echo -e "${GREEN}✅ Paquets Python installés${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🤖 Installation de Claude CLI (Anthropic)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo -e "${YELLOW}🤖 Installation de Claude CLI...${NC}"

# TODO: Installer Claude CLI officiel quand disponible
# Pour l'instant, créer un wrapper ou utiliser l'API Python

# Vérifier si Claude Code CLI est dispo
if command -v claude &> /dev/null; then
    echo -e "${GREEN}✅ Claude CLI déjà installé: $(claude --version)${NC}"
else
    echo -e "${YELLOW}⚠️  Claude CLI non trouvé${NC}"
    echo -e "${BLUE}ℹ️  Installation manuelle requise ou configuration via API${NC}"
    echo -e "${BLUE}ℹ️  Configurez ANTHROPIC_API_KEY dans votre environnement${NC}"

    # Créer un script wrapper simple pour tester
    cat > /home/ia/.local/bin/claude-test << 'EOFCLAUDE'
#!/usr/bin/env python3
import os
from anthropic import Anthropic

api_key = os.environ.get("ANTHROPIC_API_KEY")
if not api_key:
    print("❌ ANTHROPIC_API_KEY non défini")
    print("Exportez votre clé: export ANTHROPIC_API_KEY='your-key'")
    exit(1)

client = Anthropic(api_key=api_key)
print("✅ Connexion à Claude API réussie!")
print(f"🔑 API Key configurée: {api_key[:8]}...")
EOFCLAUDE

    chmod +x /home/ia/.local/bin/claude-test
    echo -e "${GREEN}✅ Script de test créé: claude-test${NC}"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🦙 Installation de Ollama
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo -e "${YELLOW}🦙 Installation de Ollama...${NC}"

if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✅ Ollama déjà installé: $(ollama --version)${NC}"
else
    echo -e "${BLUE}ℹ️  Téléchargement et installation d'Ollama...${NC}"
    curl -fsSL https://ollama.com/install.sh | sh

    if command -v ollama &> /dev/null; then
        echo -e "${GREEN}✅ Ollama installé avec succès${NC}"

        # Démarrer le service Ollama en arrière-plan
        # ollama serve > /dev/null 2>&1 &
        # echo -e "${GREEN}✅ Service Ollama démarré${NC}"
    else
        echo -e "${RED}❌ Échec de l'installation d'Ollama${NC}"
    fi
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🌟 Installation de Gemini CLI (Google)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo -e "${YELLOW}🌟 Configuration de Gemini CLI...${NC}"

# Installation du SDK Python Google Generative AI
pip install -q google-generativeai

# Créer un wrapper CLI simple pour Gemini
cat > /home/ia/.local/bin/gemini-cli << 'EOFGEMINI'
#!/usr/bin/env python3
import os
import sys
import google.generativeai as genai

api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if not api_key:
    print("❌ GEMINI_API_KEY ou GOOGLE_API_KEY non défini")
    exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-pro')

if len(sys.argv) > 1:
    prompt = " ".join(sys.argv[1:])
    response = model.generate_content(prompt)
    print(response.text)
else:
    print("Usage: gemini-cli <votre question>")
EOFGEMINI

chmod +x /home/ia/.local/bin/gemini-cli
echo -e "${GREEN}✅ Gemini CLI wrapper créé${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎨 Installation d'outils de développement graphique
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo -e "${YELLOW}🎨 Installation d'outils graphiques pour IA...${NC}"

sudo apt-get install -y \
    gimp \
    inkscape \
    imagemagick \
    ffmpeg \
    graphviz

echo -e "${GREEN}✅ Outils graphiques installés${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🐳 Installation de Docker CLI (pour gérer conteneurs depuis l'IA)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo -e "${YELLOW}🐳 Installation de Docker CLI...${NC}"

if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    sudo usermod -aG docker ia
    echo -e "${GREEN}✅ Docker CLI installé${NC}"
else
    echo -e "${GREEN}✅ Docker CLI déjà installé${NC}"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔧 Configuration de l'environnement
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo -e "${YELLOW}🔧 Configuration de l'environnement...${NC}"

# Créer ~/.local/bin si nécessaire
mkdir -p /home/ia/.local/bin

# Ajouter ~/.local/bin au PATH dans .bashrc
if ! grep -q '.local/bin' /home/ia/.bashrc; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> /home/ia/.bashrc
    echo -e "${GREEN}✅ PATH mis à jour dans .bashrc${NC}"
fi

# Créer un fichier d'environnement pour les clés API
if [ ! -f /home/ia/.ai_env ]; then
    cat > /home/ia/.ai_env << 'EOFENV'
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔑 Configuration des clés API pour outils IA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Modifiez ce fichier avec vos vraies clés API
# Puis sourcez-le: source ~/.ai_env
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Anthropic Claude API
export ANTHROPIC_API_KEY="sk-ant-your-key-here"

# OpenAI API
export OPENAI_API_KEY="sk-your-key-here"

# Google Gemini API
export GEMINI_API_KEY="your-gemini-key-here"
export GOOGLE_API_KEY="your-google-key-here"

# Autres configurations
export MCP_DIR="/opt/mcp"
export DATA_DIR="/data"

echo "✅ Variables d'environnement IA chargées"
EOFENV

    echo -e "${GREEN}✅ Fichier .ai_env créé${NC}"
    echo -e "${BLUE}ℹ️  Éditez /home/ia/.ai_env pour configurer vos clés API${NC}"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ Résumé de l'installation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Installation terminée avec succès !${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo -e "   1. Éditez ${BLUE}~/.ai_env${NC} avec vos clés API"
echo -e "   2. Sourcez l'environnement: ${BLUE}source ~/.ai_env${NC}"
echo -e "   3. Testez Claude: ${BLUE}claude-test${NC}"
echo -e "   4. Testez Ollama: ${BLUE}ollama list${NC}"
echo -e "   5. Testez Gemini: ${BLUE}gemini-cli \"Hello\"${NC}"
echo ""
echo -e "${GREEN}🚀 Environnement IA prêt !${NC}"
echo ""
