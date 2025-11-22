# Makefile pour faciliter les commandes courantes

.PHONY: help install dev build docker-build docker-up docker-down clean

help:
	@echo "Commandes disponibles :"
	@echo "  make install       - Installer toutes les dépendances"
	@echo "  make dev          - Lancer en mode développement"
	@echo "  make build        - Builder le frontend"
	@echo "  make docker-build - Builder les images Docker"
	@echo "  make docker-up    - Démarrer avec Docker Compose"
	@echo "  make docker-down  - Arrêter les conteneurs Docker"
	@echo "  make clean        - Nettoyer les fichiers temporaires"

install:
	@echo "Installation des dépendances backend..."
	cd backend && pip install -r requirements.txt
	@echo "Installation des dépendances frontend..."
	cd frontend && npm install
	@echo "✅ Installation terminée"

dev:
	@echo "Démarrage du mode développement..."
	@echo "Backend : http://127.0.0.1:3333"
	@echo "Frontend : http://127.0.0.1:5173"
	@echo ""
	@make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && python main.py

dev-frontend:
	cd frontend && npm run dev

build:
	@echo "Build du frontend..."
	cd frontend && npm run build
	@echo "✅ Build terminé"

docker-build:
	@echo "Build des images Docker..."
	docker-compose build
	@echo "✅ Images créées"

docker-up:
	@echo "Démarrage des conteneurs..."
	docker-compose up -d
	@echo "✅ Conteneurs démarrés"
	@echo "Backend disponible sur http://127.0.0.1:3333"

docker-down:
	@echo "Arrêt des conteneurs..."
	docker-compose down
	@echo "✅ Conteneurs arrêtés"

docker-logs:
	docker-compose logs -f

clean:
	@echo "Nettoyage..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Nettoyage terminé"
