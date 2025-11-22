#!/bin/bash
# Script de démarrage rapide pour Linux/Mac

echo "🚀 Démarrage de l'Assistant IA Local..."
echo ""

# Fonction pour démarrer le backend
start_backend() {
    echo "📡 Démarrage du backend..."
    cd backend

    # Activer l'environnement virtuel
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    else
        echo "❌ Environnement virtuel non trouvé"
        echo "   Exécutez d'abord : ./scripts/install.sh"
        exit 1
    fi

    # Démarrer le serveur
    python main.py &
    BACKEND_PID=$!
    echo "✅ Backend démarré (PID: $BACKEND_PID)"

    cd ..
}

# Fonction pour démarrer le frontend
start_frontend() {
    echo "🎨 Démarrage du frontend..."
    cd frontend

    # Vérifier que node_modules existe
    if [ ! -d "node_modules" ]; then
        echo "❌ Dépendances frontend non installées"
        echo "   Exécutez d'abord : ./scripts/install.sh"
        exit 1
    fi

    # Démarrer le serveur de dev
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ Frontend démarré (PID: $FRONTEND_PID)"

    cd ..
}

# Démarrer les services
start_backend
sleep 2
start_frontend

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Assistant IA Local démarré !"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🌐 Dashboard : http://localhost:5173"
echo "📡 API Backend : http://127.0.0.1:3333"
echo "📚 Documentation API : http://127.0.0.1:3333/docs"
echo ""
echo "Pour arrêter les services, appuyez sur Ctrl+C"
echo ""

# Garder le script en cours d'exécution
wait
