# 🤖 Assistant IA Personnel Local

Un assistant personnel IA intelligent fonctionnant **100% en local**, inspiré de Monica. Aucune donnée utilisateur n'est envoyée sur le cloud (sauf appels aux API de modèles IA configurées).

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.11+-green)
![React](https://img.shields.io/badge/react-18.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Extension Chrome](#-extension-chrome)
- [Déploiement Docker](#-déploiement-docker)
- [Sécurité](#-sécurité)
- [Développement](#-développement)
- [Dépannage](#-dépannage)

## ✨ Fonctionnalités

### Fonctionnalités principales

- **💬 Chat IA instantané** : Conversez avec l'IA via une interface web moderne
- **📝 Résumé automatique** : Résumez instantanément des pages web ou du texte
- **🌐 Traduction** : Traduisez du contenu dans différentes langues
- **✍️ Génération de contenu** : Rédigez emails, posts, documents avec des templates
- **🔍 Recherche augmentée (RAG)** : Recherche web intégrée pour des réponses à jour
- **💾 Mémoire contextuelle** : Historique des conversations par session/onglet
- **🔐 Chiffrement local** : Toutes les données sont chiffrées localement (AES-256)

### Extension Chrome

- **Menu contextuel** : Clic-droit pour résumer, traduire ou expliquer
- **Raccourci clavier** : `Ctrl+M` (ou `Cmd+M`) pour ouvrir le chat
- **Intégration transparente** : Fonctionne sur n'importe quel site web

### Modèles IA supportés

- **OpenAI** : GPT-3.5, GPT-4, GPT-4 Turbo
- **Anthropic** : Claude 3 (Opus, Sonnet, Haiku)
- **Modèles locaux** : Support pour LLMs locaux
- **API personnalisée** : Configurez votre propre endpoint

## 🏗️ Architecture

Le projet est divisé en 3 composants principaux :

```
local-ai-assistant/
├── backend/          # API FastAPI (Python)
│   ├── main.py       # Point d'entrée
│   ├── routers/      # Endpoints API
│   ├── services/     # Logique métier (LLM, mémoire)
│   ├── models.py     # Modèles Pydantic
│   └── utils/        # Utilitaires (chiffrement)
│
├── frontend/         # Application React + Tailwind CSS
│   ├── src/
│   │   ├── pages/    # Pages (Chat, Historique, Paramètres)
│   │   ├── components/  # Composants réutilisables
│   │   └── services/ # API client
│   └── package.json
│
└── extension/        # Extension Chrome (Manifest V3)
    ├── manifest.json
    ├── scripts/      # Background & content scripts
    └── popup.html    # Interface popup
```

### Flux de données

```
Extension Chrome → Backend FastAPI → Modèles IA (OpenAI/Claude/Local)
                                  ↓
Frontend React   ← Backend       → Base de données locale (chiffrée)
```

## 📦 Prérequis

### Logiciels requis

- **Python 3.11+**
- **Node.js 18+** et npm
- **Chrome/Chromium** (pour l'extension)
- **Docker** (optionnel, pour le déploiement)

### Clés API

Au moins une des clés API suivantes :
- Clé API OpenAI : https://platform.openai.com/api-keys
- Clé API Anthropic : https://console.anthropic.com/

## 🚀 Installation

### Méthode 1 : Installation manuelle (recommandée pour le développement)

#### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd local-ai-assistant
```

#### 2. Installer le backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement (Linux/Mac)
source venv/bin/activate
# Ou sur Windows :
# venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Copier le fichier d'exemple
cp .env.example .env
```

#### 3. Configurer les variables d'environnement

Éditez `backend/.env` :

```env
# Clés API
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Mot de passe maître pour le chiffrement
MASTER_PASSWORD=your-secure-master-password

# Configuration
DEFAULT_PROVIDER=openai
DEFAULT_MODEL=gpt-4-turbo-preview
```

#### 4. Démarrer le backend

```bash
python main.py
```

Le backend sera accessible sur **http://127.0.0.1:3333**

Au premier démarrage, un **token d'authentification** sera généré et affiché dans la console. **Notez-le**, vous en aurez besoin pour le frontend et l'extension !

#### 5. Installer et démarrer le frontend

Dans un nouveau terminal :

```bash
cd frontend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Démarrer en mode développement
npm run dev
```

Le frontend sera accessible sur **http://localhost:5173**

#### 6. Installer l'extension Chrome

1. Ouvrez Chrome et allez sur `chrome://extensions/`
2. Activez le **Mode développeur** (coin supérieur droit)
3. Cliquez sur **Charger l'extension non empaquetée**
4. Sélectionnez le dossier `extension/`

### Méthode 2 : Installation avec Make

Si vous avez `make` installé :

```bash
# Installer toutes les dépendances
make install

# Démarrer en mode développement
make dev
```

### Méthode 3 : Docker (production)

```bash
# Builder les images
docker-compose build

# Démarrer les conteneurs
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

Le backend sera sur **http://127.0.0.1:3333**

## ⚙️ Configuration

### 1. Configuration initiale du backend

Lors du premier lancement, le backend génère un token d'authentification. Vous pouvez également le récupérer :

```bash
curl http://127.0.0.1:3333/api/auth/token
```

### 2. Configuration du frontend

1. Ouvrez le dashboard sur http://localhost:5173
2. Allez dans **Paramètres**
3. Dans la section "Authentification API" :
   - Cliquez sur **Récupérer** pour obtenir le token automatiquement
   - Ou collez le token manuellement
   - Cliquez sur **Sauvegarder**

4. Dans la section "Modèles IA" :
   - Sélectionnez votre fournisseur préféré (OpenAI, Anthropic, etc.)
   - Entrez votre clé API
   - Choisissez le modèle
   - Cliquez sur **Sauvegarder la configuration**

### 3. Configuration de l'extension Chrome

1. Cliquez sur l'icône de l'extension
2. Dans la popup, collez votre token d'authentification
3. Cliquez sur **Sauvegarder le token**
4. Le voyant devrait passer au vert

## 📖 Utilisation

### Interface web (Dashboard)

#### Chat

1. Ouvrez http://localhost:5173
2. Tapez votre question dans la zone de texte
3. Appuyez sur `Ctrl+Enter` ou cliquez sur le bouton d'envoi
4. L'IA répondra en temps réel (streaming)

#### Historique

Consultez toutes vos conversations passées :
- Cliquez sur **Historique** dans la navigation
- Cliquez sur une conversation pour la reprendre
- Supprimez les conversations inutiles

#### Paramètres

Configurez l'assistant selon vos besoins :
- Clés API des différents fournisseurs
- Modèle par défaut
- Options de sécurité (chiffrement, journalisation)
- Recherche web augmentée

### Extension Chrome

#### Menus contextuels

Faites un **clic-droit** sur n'importe quelle page :

- **📝 Résumer cette page** : Résumé complet de la page
- **📝 Résumer la sélection** : Résumé du texte sélectionné
- **🌐 Traduire en français** : Traduction du texte sélectionné
- **💡 Expliquer la sélection** : Explication détaillée
- **✍️ Reformuler la sélection** : Reformulation professionnelle

#### Raccourci clavier

Appuyez sur **Ctrl+M** (ou **Cmd+M** sur Mac) pour ouvrir le dashboard

#### Popup

Cliquez sur l'icône de l'extension pour :
- Ouvrir le dashboard
- Accéder aux actions rapides
- Vérifier le statut de connexion

### API REST

L'API peut être utilisée directement :

```bash
# Envoyer un message au chat
curl -X POST http://127.0.0.1:3333/api/chat/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bonjour !",
    "session_id": "test-session",
    "temperature": 0.7
  }'

# Résumer un texte
curl -X POST http://127.0.0.1:3333/api/utils/summary \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Texte à résumer...",
    "session_id": "test-session",
    "max_length": 500
  }'
```

Documentation complète : http://127.0.0.1:3333/docs

## 🔐 Sécurité

### Chiffrement local

- Toutes les données sensibles (conversations, configurations) sont chiffrées avec **AES-256**
- Le chiffrement utilise un mot de passe maître (variable `MASTER_PASSWORD`)
- Les fichiers sont stockés dans `backend/data/` de manière chiffrée

### Authentification

- Un token d'authentification unique sécurise l'accès à l'API
- Le token est généré aléatoirement au premier démarrage
- Aucune requête n'est acceptée sans ce token

### Confidentialité

- **Aucune donnée** n'est envoyée à des services tiers (sauf appels API aux modèles IA)
- Les conversations restent **100% locales**
- Mode strict sans Internet disponible (désactive tous les appels externes)

### Bonnes pratiques

1. **Changez le mot de passe maître** dans `.env`
2. **Ne commitez jamais** les fichiers `.env` ou `data/`
3. **Sauvegardez** régulièrement le dossier `backend/data/` (chiffré)
4. **Utilisez HTTPS** en production (certificat auto-signé possible)

## 👨‍💻 Développement

### Structure du code

#### Backend (Python/FastAPI)

- `main.py` : Point d'entrée, configuration FastAPI
- `routers/` : Définition des endpoints API
  - `chat.py` : Chat et WebSocket
  - `utils.py` : Résumé, traduction, génération
  - `config.py` : Configuration et historique
- `services/` : Logique métier
  - `llm_service.py` : Interface avec les modèles IA
  - `memory_service.py` : Gestion de l'historique et sessions
- `utils/encryption.py` : Chiffrement/déchiffrement

#### Frontend (React)

- `pages/` : Pages principales
  - `ChatPage.jsx` : Interface de chat
  - `HistoryPage.jsx` : Historique
  - `SettingsPage.jsx` : Configuration
- `components/` : Composants réutilisables
- `services/api.js` : Client API
- `store/useStore.js` : State management (Zustand)

#### Extension Chrome

- `background.js` : Service Worker, gestion des menus
- `contentScript.js` : Script injecté dans les pages
- `popup.html/js` : Interface de la popup

### Commandes de développement

```bash
# Backend avec hot-reload
cd backend
uvicorn main:app --reload

# Frontend avec hot-reload
cd frontend
npm run dev

# Linter Python
cd backend
pylint **/*.py

# Linter JavaScript
cd frontend
npm run lint

# Build production du frontend
cd frontend
npm run build
```

### Tests

```bash
# Tests backend (à implémenter)
cd backend
pytest

# Tests frontend (à implémenter)
cd frontend
npm test
```

## 🔧 Dépannage

### Le backend ne démarre pas

**Problème** : Erreur `ModuleNotFoundError`
**Solution** :
```bash
cd backend
pip install -r requirements.txt
```

**Problème** : Port 3333 déjà utilisé
**Solution** : Modifiez le port dans `.env` ou tuez le processus :
```bash
# Linux/Mac
lsof -ti:3333 | xargs kill -9

# Windows
netstat -ano | findstr :3333
taskkill /PID <PID> /F
```

### L'extension ne se connecte pas

1. Vérifiez que le backend est démarré (`http://127.0.0.1:3333`)
2. Vérifiez le token d'authentification dans la popup
3. Consultez les logs du service worker :
   - `chrome://extensions/`
   - Détails de l'extension
   - Inspecter les vues > Service Worker

### Les réponses sont lentes

- Vérifiez votre connexion Internet
- Utilisez un modèle plus rapide (GPT-3.5 au lieu de GPT-4)
- Réduisez `max_tokens` dans les paramètres

### Erreur de chiffrement

Si vous changez `MASTER_PASSWORD`, les données précédentes ne seront plus déchiffrables.

**Solution** :
```bash
# Supprimer les anciennes données (ATTENTION: perte de données)
rm -rf backend/data/*

# Ou migrer manuellement avec l'ancien mot de passe
```

## 📝 Licence

MIT License - Voir le fichier [LICENSE](LICENSE)

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📧 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation : http://127.0.0.1:3333/docs

## 🙏 Remerciements

Inspiré par [Monica](https://monica.im/), cet assistant vise à offrir les mêmes fonctionnalités tout en garantissant une confidentialité totale grâce à un fonctionnement 100% local.

---

**Développé avec ❤️ pour la confidentialité et le contrôle de vos données**
