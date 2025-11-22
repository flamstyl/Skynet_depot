#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 MCP START - Point d'entrée principal des services IA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Script de démarrage automatique appelé au boot du conteneur
# Lance tous les services et agents IA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

MCP_DIR="${MCP_DIR:-/opt/mcp}"
DATA_DIR="${DATA_DIR:-/data}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 MCP Start - Initialisation de l'environnement IA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔧 Chargement de l'environnement
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}🔧 Chargement de la configuration...${NC}"

# Charger les variables d'environnement IA si disponibles
if [ -f "$HOME/.ai_env" ]; then
    source "$HOME/.ai_env"
    echo -e "${GREEN}✅ Variables d'environnement IA chargées${NC}"
else
    echo -e "${YELLOW}⚠️  Fichier .ai_env non trouvé${NC}"
    echo -e "${BLUE}ℹ️  Exécutez ${MCP_DIR}/install.sh pour le créer${NC}"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📁 Vérification des répertoires
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}📁 Vérification des répertoires...${NC}"

for dir in "$MCP_DIR" "$DATA_DIR"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}  ✅ $dir${NC}"
    else
        echo -e "${RED}  ❌ $dir manquant${NC}"
        mkdir -p "$dir" 2>/dev/null || true
    fi
done

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🦙 Démarrage d'Ollama (si installé)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo -e "${YELLOW}🦙 Vérification d'Ollama...${NC}"

if command -v ollama &> /dev/null; then
    # Vérifier si Ollama tourne déjà
    if pgrep -x ollama > /dev/null; then
        echo -e "${GREEN}✅ Ollama déjà en cours d'exécution${NC}"
    else
        echo -e "${BLUE}ℹ️  Démarrage du serveur Ollama...${NC}"
        ollama serve > /tmp/ollama.log 2>&1 &
        sleep 2

        if pgrep -x ollama > /dev/null; then
            echo -e "${GREEN}✅ Ollama démarré avec succès${NC}"
        else
            echo -e "${RED}❌ Échec du démarrage d'Ollama${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Ollama non installé${NC}"
    echo -e "${BLUE}ℹ️  Exécutez ${MCP_DIR}/install.sh pour l'installer${NC}"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 👁️  Démarrage du watcher (optionnel, en arrière-plan)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo -e "${YELLOW}👁️  Configuration du watcher...${NC}"

# TODO: Décommenter pour activer le watcher automatiquement
# if [ -f "${MCP_DIR}/watcher.sh" ]; then
#     echo -e "${BLUE}ℹ️  Démarrage du watcher en arrière-plan...${NC}"
#     nohup bash "${MCP_DIR}/watcher.sh" > /tmp/watcher.log 2>&1 &
#     echo -e "${GREEN}✅ Watcher démarré (PID: $!)${NC}"
# else
#     echo -e "${YELLOW}⚠️  watcher.sh non trouvé${NC}"
# fi

echo -e "${BLUE}ℹ️  Watcher désactivé par défaut${NC}"
echo -e "${BLUE}ℹ️  Pour l'activer: bash ${MCP_DIR}/watcher.sh &${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🤖 Message de bienvenue et instructions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Environnement MCP initialisé avec succès !${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}📝 Scripts disponibles:${NC}"
echo -e "   ${CYAN}${MCP_DIR}/install.sh${NC}      - Installer outils IA"
echo -e "   ${CYAN}${MCP_DIR}/watcher.sh${NC}      - Surveiller fichiers"
echo -e "   ${CYAN}${MCP_DIR}/start-agent.sh${NC}  - Lancer agent IA"
echo ""

echo -e "${YELLOW}📁 Répertoires:${NC}"
echo -e "   ${CYAN}MCP:${NC}  ${MCP_DIR}"
echo -e "   ${CYAN}Data:${NC} ${DATA_DIR}"
echo ""

echo -e "${YELLOW}🎯 Pour démarrer un agent IA:${NC}"
echo -e "   ${BLUE}bash ${MCP_DIR}/start-agent.sh${NC}"
echo ""

echo -e "${GREEN}🚀 Prêt pour le travail !${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📝 TODO: Extensions possibles
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# TODO: Ajouter healthcheck des services
# TODO: Lancer automatiquement certains agents au boot
# TODO: Configurer des tâches cron pour actions périodiques
# TODO: Initialiser une base de données locale (SQLite, PostgreSQL)
# TODO: Démarrer un serveur web local pour UI de contrôle
# TODO: Configurer un reverse proxy pour accès aux services
# TODO: Synchroniser avec un dépôt git au démarrage
# TODO: Télécharger des modèles Ollama par défaut (llama2, mistral, etc.)
