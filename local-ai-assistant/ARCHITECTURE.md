# Architecture du projet

Ce document décrit l'architecture technique de l'Assistant IA Personnel Local.

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                     Utilisateur                             │
└───────────┬─────────────────────────────────┬───────────────┘
            │                                 │
            │                                 │
      ┌─────▼─────┐                    ┌─────▼─────────┐
      │ Extension │                    │   Frontend    │
      │  Chrome   │                    │  React + Vite │
      └─────┬─────┘                    └─────┬─────────┘
            │                                 │
            │         HTTP/WebSocket          │
            └──────────────┬──────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Backend   │
                    │   FastAPI   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐    ┌─────▼─────┐
    │ OpenAI  │      │ Anthropic │    │  SQLite   │
    │   API   │      │    API    │    │  (local)  │
    └─────────┘      └───────────┘    └───────────┘
```

## Composants

### 1. Backend (FastAPI)

**Rôle** : API centrale gérant toute la logique métier

**Technologies** :
- Python 3.11+
- FastAPI (framework web asynchrone)
- SQLite + aiosqlite (base de données)
- Uvicorn (serveur ASGI)

**Modules** :

#### `main.py`
- Point d'entrée de l'application
- Configuration CORS
- Gestion du cycle de vie
- Génération du token d'authentification

#### `routers/`
- **`chat.py`** : Endpoints pour le chat (REST + WebSocket)
- **`utils.py`** : Résumé, traduction, génération
- **`config.py`** : Configuration et historique

#### `services/`
- **`llm_service.py`** : Interface avec les modèles IA
  - Support OpenAI, Anthropic, Custom
  - Gestion du streaming
  - Templates de prompts

- **`memory_service.py`** : Gestion de la mémoire
  - Stockage des conversations
  - Contexte par session
  - Résumés de pages

#### `utils/`
- **`encryption.py`** : Chiffrement AES-256 (Fernet)
  - Chiffrement/déchiffrement des données
  - Dérivation de clé (PBKDF2)

#### `models.py`
- Modèles Pydantic pour validation
- Schémas de requêtes/réponses

### 2. Frontend (React)

**Rôle** : Interface utilisateur web

**Technologies** :
- React 18
- Vite (bundler)
- Tailwind CSS
- Zustand (state management)
- React Router (navigation)

**Structure** :

#### `pages/`
- **`ChatPage.jsx`** : Interface de chat principale
  - Zone de messages
  - Input avec support streaming
  - Gestion WebSocket

- **`HistoryPage.jsx`** : Historique des conversations
  - Liste des sessions
  - Recherche et filtres

- **`SettingsPage.jsx`** : Configuration
  - Clés API
  - Préférences
  - Options de sécurité

#### `components/`
- **`Navbar.jsx`** : Navigation principale
- **`MessageBubble.jsx`** : Affichage message (avec Markdown)
- **`ChatInput.jsx`** : Zone de saisie avec raccourcis

#### `services/`
- **`api.js`** : Client API
  - Appels REST
  - WebSocket
  - Gestion des erreurs

#### `store/`
- **`useStore.js`** : State global (Zustand)
  - État d'authentification
  - Sessions et messages
  - Configuration

### 3. Extension Chrome

**Rôle** : Intégration navigateur

**Technologies** :
- Manifest V3
- JavaScript vanilla
- Chrome Extension APIs

**Composants** :

#### `background.js` (Service Worker)
- Création des menus contextuels
- Gestion des commandes
- Communication avec le backend
- Stockage du token

#### `contentScript.js`
- Injecté dans les pages web
- Extraction de contenu
- Raccourcis clavier

#### `popup.html/js`
- Interface utilisateur popup
- Actions rapides
- Configuration token

## Flux de données

### 1. Chat simple (REST)

```
User → Frontend → POST /api/chat
                     ↓
                  LLM Service → OpenAI/Claude
                     ↓
                  Memory Service (save)
                     ↓
                  Frontend ← Response
```

### 2. Chat avec streaming (WebSocket)

```
User → Frontend → WS /api/chat/ws/{session_id}
                     ↓
                  LLM Service → OpenAI (stream=true)
                     ↓
                  For each chunk:
                    → Send to WebSocket
                     ↓
                  Frontend ← Chunk (displayed in real-time)
```

### 3. Résumé depuis l'extension

```
User → Right-click → Extension (background.js)
                        ↓
                     Extract page content
                        ↓
                     POST /api/utils/summary
                        ↓
                     LLM Service → Generate summary
                        ↓
                     Extension ← Display result
```

## Sécurité

### Authentification

```
Backend startup → Generate random token
                    ↓
                 Store in data/.api_token
                    ↓
                 Display to user
                    ↓
Client (Frontend/Extension) → Store token
                    ↓
Every API call → Header: Authorization: Bearer {token}
                    ↓
Backend → Verify token → Allow/Deny
```

### Chiffrement des données

```
Data (conversation, config) → JSON string
                    ↓
                 Encrypt with Fernet (AES-256)
                    ↓
                 Key derived from MASTER_PASSWORD (PBKDF2)
                    ↓
                 Save to disk (encrypted)
```

### Protection CORS

```
Request from origin X → FastAPI CORS middleware
                           ↓
                        Check origin:
                         - localhost:3000 ✓
                         - localhost:5173 ✓
                         - chrome-extension://* ✓
                         - other domains ✗
```

## Base de données

### Schéma SQLite

```sql
sessions:
  - session_id (PK)
  - created_at
  - last_activity
  - title
  - tags (JSON)
  - metadata (JSON)

messages:
  - id (PK)
  - session_id (FK)
  - role (user/assistant/system)
  - content (encrypted)
  - timestamp
  - metadata (JSON)

page_summaries:
  - id (PK)
  - url
  - summary (encrypted)
  - created_at
  - session_id (FK)
```

## API Endpoints

### Chat
- `POST /api/chat/` - Envoyer un message
- `GET /api/chat/{session_id}` - Récupérer une session
- `DELETE /api/chat/{session_id}` - Supprimer une session
- `WS /api/chat/ws/{session_id}` - Chat avec streaming

### Utils
- `POST /api/utils/summary` - Résumer un contenu
- `POST /api/utils/translate` - Traduire
- `POST /api/utils/generate` - Générer du contenu
- `GET /api/utils/templates` - Lister les templates

### Config
- `GET /api/config` - Récupérer la configuration
- `POST /api/config` - Mettre à jour la configuration
- `GET /api/history` - Historique des sessions
- `GET /api/health` - Health check

### Auth
- `GET /api/auth/token` - Récupérer le token (localhost uniquement)

## Déploiement

### Développement

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production (Docker)

```bash
docker-compose up -d
```

### Variables d'environnement

```env
# Backend
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
MASTER_PASSWORD=...
API_AUTH_TOKEN=...
DEFAULT_PROVIDER=openai
DEFAULT_MODEL=gpt-4-turbo-preview

# Frontend (VITE_)
VITE_API_URL=http://127.0.0.1:3333
```

## Performance

### Optimisations

1. **Streaming WebSocket** : Réponses affichées en temps réel
2. **Cache des résumés** : Évite de recalculer les résumés de pages
3. **Context window** : Limite à 10 derniers messages pour réduire tokens
4. **SQLite local** : Lectures/écritures ultra-rapides
5. **React lazy loading** : Chargement des pages à la demande

### Limites

- Sessions simultanées : Illimitées (async)
- Taille max message : 2000 tokens (configurable)
- Taille base de données : Illimitée (SQLite)
- WebSocket concurrent : 1 par session

## Extensibilité

### Ajouter un nouveau fournisseur LLM

1. Étendre `LLMProvider` enum dans `models.py`
2. Ajouter la logique dans `llm_service.py`
3. Mettre à jour l'UI dans `SettingsPage.jsx`

### Ajouter un nouveau template

1. Ajouter dans `routers/utils.py` → `templates` dict
2. Documenter dans `/api/utils/templates`

### Ajouter une nouvelle fonctionnalité extension

1. Créer item menu dans `background.js`
2. Ajouter handler
3. Créer endpoint backend si nécessaire

## Monitoring

### Logs

- Backend : stdout (uvicorn logs)
- Frontend : console navigateur
- Extension : chrome://extensions → Inspect views

### Métriques

Disponibles via `/api/health` :
- Backend status
- Modèles disponibles
- Version

## Sauvegardes

### Données importantes

```
backend/data/
├── .api_token      # Token d'authentification
├── .key ou .salt   # Clés de chiffrement
├── config.json.enc # Configuration (chiffrée)
└── assistant.db    # Base de données (contenu chiffré)
```

**À sauvegarder régulièrement** : tout le dossier `backend/data/`

## Conclusion

Cette architecture modulaire permet :
- ✅ Confidentialité totale (données locales)
- ✅ Extensibilité facile
- ✅ Performance optimale
- ✅ Sécurité renforcée
- ✅ Expérience utilisateur fluide
