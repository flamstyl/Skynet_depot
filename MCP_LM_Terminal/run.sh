#!/bin/bash
# 🟣 MCP_LM_Terminal - Script de lancement rapide

echo "🟣 MCP_LM_Terminal - Démarrage..."
echo "=================================="

# Vérification de l'environnement virtuel
if [ ! -d "venv" ]; then
    echo "⚠️  Environnement virtuel non trouvé"
    echo "📦 Création de l'environnement virtuel..."
    python3 -m venv venv

    echo "📥 Installation des dépendances..."
    source venv/bin/activate
    pip install -r requirements.txt
else
    echo "✅ Environnement virtuel trouvé"
    source venv/bin/activate
fi

# Vérification du fichier de configuration
if [ ! -f "config.json" ]; then
    echo "❌ Fichier config.json introuvable !"
    exit 1
fi

# Vérification du token
TOKEN=$(grep -o '"api_token": "[^"]*"' config.json | cut -d'"' -f4)
if [ "$TOKEN" == "CHANGEZ_MOI_IMMEDIATEMENT" ] || [ "$TOKEN" == "A_CHANGER" ]; then
    echo "❌ ERREUR : Vous devez changer le api_token dans config.json !"
    echo "💡 Générez un token avec : python3 -c \"import secrets; print(secrets.token_urlsafe(32))\""
    exit 1
fi

echo "✅ Configuration validée"
echo ""
echo "🚀 Lancement du serveur MCP..."
echo ""

# Lancement du serveur
uvicorn server:app --host 0.0.0.0 --port 8080 --reload
