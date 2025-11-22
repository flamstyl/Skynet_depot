#!/bin/bash
# Script d'installation automatique pour Linux/Mac

set -e

echo "════════════════════════════════════════════════════════"
echo "  Installation de l'Assistant IA Personnel Local"
echo "════════════════════════════════════════════════════════"
echo ""

# Vérifier Python
echo "🔍 Vérification de Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé"
    echo "   Installez Python 3.11+ depuis https://www.python.org/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ Python $PYTHON_VERSION trouvé"

# Vérifier Node.js
echo "🔍 Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    echo "   Installez Node.js 18+ depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION trouvé"

# Installer les dépendances du backend
echo ""
echo "📦 Installation des dépendances du backend..."
cd backend

# Créer un environnement virtuel
if [ ! -d "venv" ]; then
    echo "   Création de l'environnement virtuel..."
    python3 -m venv venv
fi

# Activer l'environnement
source venv/bin/activate

# Installer les dépendances
echo "   Installation des packages Python..."
pip install --upgrade pip > /dev/null
pip install -r requirements.txt > /dev/null

echo "✅ Backend installé"

# Configurer l'environnement
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️  Configuration de l'environnement..."
    cp .env.example .env
    echo "✅ Fichier .env créé"
    echo "⚠️  N'oubliez pas d'ajouter vos clés API dans backend/.env"
fi

cd ..

# Installer les dépendances du frontend
echo ""
echo "📦 Installation des dépendances du frontend..."
cd frontend

npm install > /dev/null

echo "✅ Frontend installé"

# Copier .env si nécessaire
if [ ! -f ".env" ]; then
    cp .env.example .env
fi

cd ..

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Installation terminée avec succès !"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📝 Prochaines étapes :"
echo ""
echo "1. Configurez vos clés API dans backend/.env"
echo "   Éditez le fichier et ajoutez votre clé OpenAI/Anthropic"
echo ""
echo "2. Démarrez le backend :"
echo "   cd backend && source venv/bin/activate && python main.py"
echo ""
echo "3. Dans un autre terminal, démarrez le frontend :"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Ouvrez http://localhost:5173 dans votre navigateur"
echo ""
echo "5. Installez l'extension Chrome :"
echo "   - Allez sur chrome://extensions/"
echo "   - Activez le mode développeur"
echo "   - Chargez le dossier 'extension/'"
echo ""
echo "📚 Documentation : README.md"
echo "🚀 Démarrage rapide : QUICKSTART.md"
echo ""
