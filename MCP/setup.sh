#!/bin/bash
# MCP Obsidian Core - Setup Script
# Usage: bash setup.sh

set -e  # Exit on error

echo "=================================================="
echo "  MCP Obsidian Core - Installation"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier Python
echo -e "${BLUE}🔍 Vérification de Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 n'est pas installé${NC}"
    echo "Installez Python 3.9+ : https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✓ Python $PYTHON_VERSION détecté${NC}"

# Vérifier pip
echo -e "${BLUE}🔍 Vérification de pip...${NC}"
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}❌ pip n'est pas installé${NC}"
    echo "Installez pip : python3 -m ensurepip --upgrade"
    exit 1
fi
echo -e "${GREEN}✓ pip détecté${NC}"

# Créer un environnement virtuel (optionnel mais recommandé)
echo ""
read -p "Voulez-vous créer un environnement virtuel ? (recommandé) [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}📦 Création de l'environnement virtuel...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    echo -e "${GREEN}✓ Environnement virtuel activé${NC}"
fi

# Installer les dépendances Python
echo ""
echo -e "${BLUE}📦 Installation des dépendances Python...${NC}"
pip3 install -r MCP/core/watcher/requirements.txt
echo -e "${GREEN}✓ Dépendances installées${NC}"

# Rendre les scripts exécutables
echo ""
echo -e "${BLUE}🔧 Configuration des permissions...${NC}"
chmod +x MCP/core/watcher/watcher.py
chmod +x MCP/core/watcher/dispatcher.py
chmod +x MCP/core/watcher/rag_manager.py
chmod +x MCP/core/n8n_connector/webhook.py
echo -e "${GREEN}✓ Permissions configurées${NC}"

# Créer les dossiers manquants
echo ""
echo -e "${BLUE}📁 Vérification de la structure...${NC}"
for agent in Claude Gemini GPT; do
    mkdir -p "MCP/$agent/memory/events"
    mkdir -p "MCP/$agent/memory/log_raw"
    mkdir -p "MCP/$agent/rag/chunks"
    mkdir -p "MCP/$agent/output"
    mkdir -p "MCP/$agent/sync"
done
echo -e "${GREEN}✓ Structure vérifiée${NC}"

# Vérifier n8n (optionnel)
echo ""
echo -e "${BLUE}🔍 Vérification de n8n...${NC}"
if ! command -v n8n &> /dev/null; then
    echo -e "${RED}⚠ n8n n'est pas installé (optionnel)${NC}"
    echo "Pour l'installer : npm install -g n8n"
else
    N8N_VERSION=$(n8n --version)
    echo -e "${GREEN}✓ n8n $N8N_VERSION détecté${NC}"
fi

# Résumé
echo ""
echo "=================================================="
echo -e "${GREEN}✅ Installation terminée !${NC}"
echo "=================================================="
echo ""
echo "Prochaines étapes :"
echo ""
echo "1. Démarrer le watcher :"
echo "   cd MCP/core/watcher"
echo "   python3 watcher.py"
echo ""
echo "2. Dans un autre terminal, démarrer le dispatcher :"
echo "   cd MCP/core/watcher"
echo "   python3 dispatcher.py --watch"
echo ""
echo "3. (Optionnel) Démarrer n8n :"
echo "   n8n start"
echo ""
echo "4. Consulter la documentation :"
echo "   MCP/core/README.md"
echo ""
echo "=================================================="
echo ""

# Instructions pour l'environnement virtuel
if [[ -d "venv" ]]; then
    echo -e "${BLUE}💡 Pour activer l'environnement virtuel plus tard :${NC}"
    echo "   source venv/bin/activate"
    echo ""
fi

echo "Bon travail avec MCP Obsidian Core ! 🚀"
