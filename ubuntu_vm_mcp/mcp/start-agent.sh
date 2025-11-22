#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🤖 MCP START AGENT - Lanceur d'agents IA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Script pour démarrer Claude CLI, Ollama ou autres agents IA
# Peut être lancé manuellement ou via systemd
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

MCP_DIR="${MCP_DIR:-/opt/mcp}"
DATA_DIR="${DATA_DIR:-/data}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🤖 MCP Agent Launcher - Démarrage d'agent IA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔧 Chargement de l'environnement
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if [ -f "$HOME/.ai_env" ]; then
    source "$HOME/.ai_env"
    echo -e "${GREEN}✅ Variables d'environnement chargées${NC}"
else
    echo -e "${YELLOW}⚠️  Fichier .ai_env non trouvé${NC}"
    echo -e "${BLUE}ℹ️  Certaines fonctionnalités peuvent être limitées${NC}"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎯 Menu de sélection d'agent
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}🎯 Sélectionnez l'agent IA à lancer:${NC}"
echo ""
echo -e "  ${CYAN}1)${NC} Claude CLI (Anthropic)"
echo -e "  ${CYAN}2)${NC} Ollama (Local LLM)"
echo -e "  ${CYAN}3)${NC} Gemini CLI (Google)"
echo -e "  ${CYAN}4)${NC} Mode interactif Python (avec anthropic/openai)"
echo -e "  ${CYAN}5)${NC} Tous (démarrer tous les services)"
echo -e "  ${CYAN}0)${NC} Quitter"
echo ""

read -p "Votre choix [1-5]: " choice

case $choice in
    1)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 🤖 Claude CLI
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${CYAN}🤖 Lancement de Claude CLI${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""

        if [ -z "$ANTHROPIC_API_KEY" ]; then
            echo -e "${RED}❌ ANTHROPIC_API_KEY non défini${NC}"
            echo -e "${YELLOW}⚠️  Configurez votre clé dans ~/.ai_env${NC}"
            exit 1
        fi

        # TODO: Vérifier si Claude Code CLI est installé
        if command -v claude &> /dev/null; then
            echo -e "${GREEN}✅ Claude CLI trouvé${NC}"
            echo -e "${BLUE}ℹ️  Lancement de Claude...${NC}"
            echo ""
            # Lancer Claude CLI en mode interactif
            claude
        else
            echo -e "${YELLOW}⚠️  Claude CLI officiel non trouvé${NC}"
            echo -e "${BLUE}ℹ️  Lancement d'un wrapper Python interactif...${NC}"
            echo ""

            # Wrapper Python interactif pour Claude
            python3 << 'EOFCLAUDE'
import os
from anthropic import Anthropic

print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("🤖 Claude AI - Mode Interactif")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("Tapez 'exit' ou 'quit' pour quitter")
print()

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

while True:
    try:
        prompt = input("Vous > ")
        if prompt.lower() in ['exit', 'quit', 'q']:
            print("Au revoir!")
            break

        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}]
        )

        print(f"\nClaude > {message.content[0].text}\n")

    except KeyboardInterrupt:
        print("\nInterrompu. Au revoir!")
        break
    except Exception as e:
        print(f"❌ Erreur: {e}")
EOFCLAUDE
        fi
        ;;

    2)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 🦙 Ollama
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${CYAN}🦙 Lancement d'Ollama${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""

        if ! command -v ollama &> /dev/null; then
            echo -e "${RED}❌ Ollama non installé${NC}"
            echo -e "${YELLOW}Exécutez: bash ${MCP_DIR}/install.sh${NC}"
            exit 1
        fi

        # Vérifier si le serveur tourne
        if ! pgrep -x ollama > /dev/null; then
            echo -e "${YELLOW}⚠️  Serveur Ollama non démarré, lancement...${NC}"
            ollama serve > /tmp/ollama.log 2>&1 &
            sleep 3
        fi

        echo -e "${GREEN}✅ Serveur Ollama actif${NC}"
        echo ""

        # Liste des modèles disponibles
        echo -e "${YELLOW}📦 Modèles disponibles:${NC}"
        ollama list

        echo ""
        echo -e "${YELLOW}💡 Pour discuter avec un modèle:${NC}"
        echo -e "   ${CYAN}ollama run llama2${NC}"
        echo -e "   ${CYAN}ollama run mistral${NC}"
        echo ""

        read -p "Modèle à lancer (llama2/mistral/autre) [llama2]: " model
        model=${model:-llama2}

        echo -e "${BLUE}ℹ️  Lancement de ${model}...${NC}"
        ollama run "$model"
        ;;

    3)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 🌟 Gemini CLI
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${CYAN}🌟 Lancement de Gemini CLI${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""

        if [ -z "$GEMINI_API_KEY" ] && [ -z "$GOOGLE_API_KEY" ]; then
            echo -e "${RED}❌ GEMINI_API_KEY non défini${NC}"
            echo -e "${YELLOW}⚠️  Configurez votre clé dans ~/.ai_env${NC}"
            exit 1
        fi

        echo -e "${GREEN}✅ API Key configurée${NC}"
        echo ""

        # Mode interactif Gemini
        python3 << 'EOFGEMINI'
import os
import google.generativeai as genai

print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("🌟 Gemini AI - Mode Interactif")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("Tapez 'exit' ou 'quit' pour quitter")
print()

api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-pro')

while True:
    try:
        prompt = input("Vous > ")
        if prompt.lower() in ['exit', 'quit', 'q']:
            print("Au revoir!")
            break

        response = model.generate_content(prompt)
        print(f"\nGemini > {response.text}\n")

    except KeyboardInterrupt:
        print("\nInterrompu. Au revoir!")
        break
    except Exception as e:
        print(f"❌ Erreur: {e}")
EOFGEMINI
        ;;

    4)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 🐍 Mode Python interactif
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${CYAN}🐍 Mode Python Interactif avec SDK IA${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""

        python3 << 'EOFPYTHON'
import os
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("🐍 Python Interactive Mode - AI SDKs Available")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print()
print("Available imports:")
print("  from anthropic import Anthropic")
print("  from openai import OpenAI")
print("  import google.generativeai as genai")
print()
print("Example usage:")
print("  client = Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])")
print("  message = client.messages.create(...)")
print()

# Importer les modules disponibles
try:
    from anthropic import Anthropic
    print("✅ anthropic imported")
except: pass

try:
    from openai import OpenAI
    print("✅ openai imported")
except: pass

try:
    import google.generativeai as genai
    print("✅ google-generativeai imported")
except: pass

print()
EOFPYTHON

        python3 -i
        ;;

    5)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 🚀 Tous les services
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${CYAN}🚀 Démarrage de tous les services${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""

        # Démarrer Ollama
        if command -v ollama &> /dev/null; then
            if ! pgrep -x ollama > /dev/null; then
                echo -e "${YELLOW}🦙 Démarrage d'Ollama...${NC}"
                ollama serve > /tmp/ollama.log 2>&1 &
                echo -e "${GREEN}✅ Ollama démarré${NC}"
            fi
        fi

        # TODO: Ajouter d'autres services ici

        echo ""
        echo -e "${GREEN}✅ Services démarrés${NC}"
        echo -e "${BLUE}ℹ️  Consultez les logs dans /tmp/${NC}"
        ;;

    0|q|quit)
        echo "Au revoir!"
        exit 0
        ;;

    *)
        echo -e "${RED}❌ Choix invalide${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Session terminée${NC}"
echo ""
