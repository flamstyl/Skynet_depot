# 🏗️ Skynet Linker CLI — Architecture Technique

## Vue d'ensemble

**Skynet Linker CLI** est un système de coordination multi-agents IA basé sur un protocole MCP (Multi-agent Communication Protocol) personnalisé. Il permet à plusieurs intelligences artificielles (Claude, ChatGPT, Gemini, Perplexity, Codex, etc.) de :

- **Partager un contexte unifié** via une mémoire centralisée Redis
- **Coordonner leurs actions** via un bus de messages WebSocket
- **Sécuriser leurs échanges** via chiffrement NaCl
- **Collaborer sur des tâches complexes** nécessitant plusieurs expertises

---

## 🎯 Objectifs architecturaux

1. **Décentralisation des agents** : chaque IA peut s'exécuter sur une machine différente
2. **Centralisation de la mémoire** : Redis comme source de vérité partagée
3. **Évolutivité** : ajout facile de nouveaux types d'agents
4. **Sécurité** : chiffrement de bout en bout avec PyNaCl
5. **Observabilité** : monitoring en temps réel des échanges
6. **Simplicité** : CLI intuitive pour contrôle humain

---

## 📐 Architecture en couches

```
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE UTILISATEUR                        │
│  CLI Typer (skynet-linker connect/send/monitor/context)     │
└──────────────────────┬──────────────────────────────────────┘
                       │ WebSocket Client
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   COUCHE SERVEUR MCP                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  WebSocket   │  │  REST API    │  │   Routing    │      │
│  │   Router     │  │  (admin)     │  │   Engine     │      │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘      │
│         │                                    │              │
│         └────────────┬───────────────────────┘              │
│                      ↓                                      │
│         ┌────────────────────────┐                          │
│         │   Encryption Layer     │                          │
│         │   (PyNaCl)             │                          │
│         └────────────────────────┘                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   COUCHE MÉMOIRE                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Context    │  │   Session    │  │   Snapshot   │      │
│  │   Manager    │  │   Manager    │  │   Manager    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         └────────────┬─────────────────────┘               │
│                      ↓                                      │
│         ┌────────────────────────┐                          │
│         │    Redis Store         │                          │
│         │  - context:<agent>     │                          │
│         │  - session:<id>        │                          │
│         │  - history:<agent>     │                          │
│         └────────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                       ↑
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                 COUCHE CONNECTEURS IA                        │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Claude  │ │ ChatGPT  │ │  Gemini  │ │Perplexity│       │
│  │Connector │ │Connector │ │Connector │ │Connector │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  Interface commune : BaseConnector.send(message)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Composants principaux

### 1. **Protocole MCP** (`protocol/`)

Le protocole MCP définit le format standard de communication entre agents.

#### Structure du message MCP

```json
{
  "id": "uuid-v4",
  "from_agent": "claude_cli",
  "to_agent": "gemini" | null,
  "type": "context_update | task | reply | broadcast",
  "channel": "skynet_core",
  "payload": {
    "content": "texte ou données structurées",
    "context": {
      "session_id": "...",
      "parent_message_id": "...",
      "priority": 1-10
    },
    "meta": {
      "timestamp": "ISO8601",
      "ttl": 3600,
      "requires_ack": true
    }
  },
  "timestamp": "2025-11-19T12:34:56Z",
  "trace_id": "uuid-chain",
  "encrypted": true,
  "signature": "nacl_signature"
}
```

#### Types de messages

- **`task`** : demande d'exécution d'une tâche
- **`reply`** : réponse à un message précédent
- **`context_update`** : mise à jour du contexte partagé
- **`broadcast`** : message diffusé à tous les agents d'un canal
- **`heartbeat`** : keep-alive pour connexion WebSocket

#### Validation

- Schéma JSON strict (`schema.json`)
- Validation Pydantic models
- Vérification signatures cryptographiques

---

### 2. **Serveur MCP** (`server/`)

Le serveur est le cœur du système, construit avec **FastAPI**.

#### Composants

##### `main.py`
- Point d'entrée ASGI
- Configuration via `config.yaml`
- Montage routes REST + WebSocket
- Initialisation Redis connection pool
- Health checks (`/health`, `/metrics`)

##### `websocket_router.py`
- Gestion connexions WebSocket persistantes
- Registre des agents connectés :
  ```python
  {
    "agent_id": "claude_cli",
    "agent_type": "planner",
    "connection": WebSocket,
    "connected_at": datetime,
    "metadata": {...}
  }
  ```
- Heartbeat automatique toutes les 30s
- Reconnexion automatique côté client

##### `routing_engine.py`
- **Routage direct** : `to_agent` spécifié → 1-to-1
- **Routage broadcast** : `channel` spécifié → 1-to-many
- **Routage intelligent** (future) :
  - Round-robin par type d'agent
  - Load balancing
  - Priority queues

##### `redis_store.py`
- Abstraction Redis avec connection pooling
- Namespaces :
  - `context:<agent_id>` : contexte courant (hash)
  - `session:<session_id>` : état session (hash)
  - `history:<agent_id>` : historique messages (list)
  - `presence:<agent_id>` : statut online (string + TTL)
- Fonctions :
  ```python
  set_context(agent_id, context_dict)
  get_context(agent_id) -> dict
  append_history(agent_id, message_dict)
  get_history(agent_id, limit=50) -> list
  create_session(session_id, metadata)
  update_session(session_id, updates)
  ```

##### `encryption.py`
- Chiffrement/déchiffrement payload via PyNaCl
- Utilise clés symétriques (SecretBox) ou asymétriques (Box)
- Fonctions :
  ```python
  encrypt_message(message_dict, key) -> bytes
  decrypt_message(encrypted_bytes, key) -> dict
  ```

---

### 3. **Couche Mémoire** (`memory/`)

La mémoire partagée est le cerveau du système.

#### `context_manager.py`

Gère le **contexte global partagé** entre agents :

```python
{
  "global_summary": "État actuel de la tâche globale",
  "last_user_intent": "Ce que l'utilisateur a demandé",
  "shared_knowledge": {
    "facts": [...],
    "decisions": [...]
  },
  "updated_by": "claude_cli",
  "updated_at": "2025-11-19T12:34:56Z"
}
```

Fonctions :
- `push_context(agent_id, context_update)`
- `pull_context(agent_id) -> dict`
- `merge_context(updates)` : fusion intelligente

#### `session_manager.py`

Gère les **sessions de collaboration** :

```python
{
  "session_id": "uuid",
  "participants": ["claude_cli", "gemini"],
  "created_at": "...",
  "status": "active | paused | completed",
  "messages": [
    {
      "from": "claude_cli",
      "to": "gemini",
      "timestamp": "...",
      "message_id": "..."
    }
  ],
  "metadata": {
    "goal": "Analyser et générer rapport",
    "deadline": "..."
  }
}
```

Fonctions :
- `create_session(participants, metadata)`
- `add_message_to_session(session_id, message)`
- `get_session_state(session_id)`
- `close_session(session_id)`

#### `snapshot_manager.py`

Sauvegarde périodique de l'état complet :

- Export JSON toutes les N minutes
- Utile pour :
  - Backup
  - RAG (Retrieval-Augmented Generation)
  - Audit/debug
  - Reprise après crash

---

### 4. **Couche Sécurité** (`security/`)

#### `key_manager.py`

Gestion des clés cryptographiques :

```python
class KeyManager:
    def generate_keypair() -> (public_key, private_key)
    def load_keys(path: str)
    def save_keys(path: str, keys: dict)
    def rotate_keys()
```

Stockage : fichier `.skynet_linker.keys` (JSON chiffré)

#### `nacl_utils.py`

Wrappers haut niveau PyNaCl :

```python
def encrypt_payload(data: dict, secret_key: bytes) -> bytes
def decrypt_payload(encrypted: bytes, secret_key: bytes) -> dict
def sign_message(message: dict, private_key: bytes) -> str
def verify_signature(message: dict, signature: str, public_key: bytes) -> bool
```

#### `auth_tokens.py`

Authentification clients CLI :

- JWT tokens (optionnel MVP)
- Tokens statiques en config (MVP simple)
- Validation à chaque connexion WebSocket

---

### 5. **CLI Typer** (`cli/`)

Interface utilisateur principale.

#### Commandes

##### `skynet-linker connect`

Connecte un agent au serveur MCP.

```bash
skynet-linker connect \
  --agent-id claude_cli \
  --agent-type planner \
  --server ws://localhost:8000/ws \
  --channel skynet_core
```

Ouvre une connexion WebSocket persistante et attend les messages.

##### `skynet-linker send`

Envoie un message MCP.

```bash
# Message direct
skynet-linker send \
  --to gemini \
  --type task \
  --content "Recherche sur les LLM quantiques"

# Avec payload JSON
skynet-linker send \
  --to gemini \
  --type task \
  --payload-file task.json
```

##### `skynet-linker context`

Gère le contexte partagé.

```bash
# Push contexte local vers serveur
skynet-linker context push \
  --agent-id claude_cli \
  --context-file context.json

# Pull contexte depuis serveur
skynet-linker context pull \
  --agent-id claude_cli \
  --output context_local.json
```

##### `skynet-linker agents`

Liste les agents connectés.

```bash
skynet-linker agents list
# Output:
# - claude_cli (planner) - online
# - gemini (researcher) - online
# - gpt4 (coder) - offline (last seen: 5m ago)
```

##### `skynet-linker monitor`

Stream en temps réel des messages.

```bash
skynet-linker monitor --channel skynet_core
# [12:34:56] claude_cli → gemini: task "Recherche XYZ"
# [12:35:12] gemini → claude_cli: reply "Voici les résultats..."
```

---

### 6. **Connecteurs IA** (`connectors/`)

Interface standardisée pour chaque IA.

#### Base abstraite

```python
class BaseConnector(ABC):
    @abstractmethod
    def send(self, message: dict) -> dict:
        """
        Envoie un message à l'IA cible.

        Args:
            message: Message MCP formaté

        Returns:
            Réponse MCP normalisée
        """
        pass

    @abstractmethod
    def receive(self) -> dict:
        """
        Reçoit un message de l'IA (si mode pull).
        """
        pass
```

#### Implémentations

- **`claude_connector.py`** : Wrapper Claude CLI / API
- **`chatgpt_connector.py`** : OpenAI API
- **`gemini_connector.py`** : Google Gemini API
- **`perplexity_connector.py`** : Perplexity API (Comet)
- **`codex_connector.py`** : Stub historique

MVP = stubs avec logs, évolution vers vraies API.

---

## 🔄 Flux de données typique

### Scénario : Claude demande à Gemini de faire une recherche

```
1. Utilisateur (terminal 1)
   ↓
   $ skynet-linker connect --agent-id claude_cli --agent-type planner
   [Connexion WebSocket établie]

2. Utilisateur (terminal 2)
   ↓
   $ skynet-linker connect --agent-id gemini --agent-type researcher
   [Connexion WebSocket établie]

3. Claude génère une tâche
   ↓
   Message MCP:
   {
     "from_agent": "claude_cli",
     "to_agent": "gemini",
     "type": "task",
     "payload": {
       "content": "Recherche les derniers papiers sur RAG",
       "context": {"session_id": "sess_123"}
     }
   }

4. Serveur MCP reçoit le message
   ↓
   - Valide le message (protocol/validation.py)
   - Déchiffre si nécessaire (encryption.py)
   - Route vers gemini (routing_engine.py)
   - Stocke dans history (redis_store.py)

5. Gemini reçoit le message via WebSocket
   ↓
   - Exécute la recherche
   - Génère une réponse MCP

6. Gemini envoie la réponse
   ↓
   Message MCP:
   {
     "from_agent": "gemini",
     "to_agent": "claude_cli",
     "type": "reply",
     "payload": {
       "content": "Voici 10 papiers récents...",
       "context": {"session_id": "sess_123"}
     }
   }

7. Claude reçoit la réponse
   ↓
   - Update contexte local
   - Continue le workflow

8. Contexte partagé dans Redis
   ↓
   context:claude_cli = {"last_task": "RAG research", ...}
   context:gemini = {"last_search": "RAG papers", ...}
   session:sess_123 = {
     "participants": ["claude_cli", "gemini"],
     "messages": [msg1, msg2]
   }
```

---

## 🔒 Sécurité

### Chiffrement de bout en bout

- Chaque `payload` est chiffré avec PyNaCl (SecretBox)
- Clés partagées via configuration sécurisée
- Option : asymétrique (Box) pour agents inconnus

### Authentification

- Tokens d'accès pour connexion WebSocket
- Validation à chaque connexion
- Rate limiting sur REST API

### Audit trail

- Tous les messages stockés dans Redis history
- Snapshots périodiques chiffrés
- Logs serveur avec trace_id pour corrélation

---

## 📊 Stockage Redis

### Namespaces

```
context:<agent_id>         # Hash - contexte courant de l'agent
session:<session_id>       # Hash - état d'une session collaborative
history:<agent_id>         # List - historique messages (FIFO, max 1000)
presence:<agent_id>        # String + TTL - statut online/offline
channel:<channel_name>     # PubSub - broadcast messages
snapshot:<timestamp>       # String - backup complet JSON
```

### Exemple de données

```redis
HGETALL context:claude_cli
  "global_summary" -> "Analyse RAG en cours"
  "last_intent" -> "Recherche papiers récents"
  "updated_at" -> "2025-11-19T12:34:56Z"

LRANGE history:claude_cli 0 10
  [message_json_1, message_json_2, ...]

GET presence:claude_cli
  "online" (TTL: 60s)
```

---

## 🚀 Extensibilité

### Ajout d'un nouvel agent IA

1. Créer `connectors/new_ai_connector.py`
2. Implémenter `BaseConnector`
3. Déclarer dans `config.yaml`
4. Connecter via CLI : `skynet-linker connect --agent-id new_ai`

### Ajout d'un nouveau type de message

1. Modifier `protocol/schema.json`
2. Ajouter validation dans `validation.py`
3. Implémenter logique routage si nécessaire

### Ajout d'une nouvelle commande CLI

1. Créer `cli/commands/new_command.py`
2. Définir fonction Typer
3. Importer dans `linker_cli.py`

---

## 🔍 Observabilité

### Logs structurés

- Format JSON
- Niveaux : DEBUG, INFO, WARNING, ERROR
- Champs : `trace_id`, `agent_id`, `timestamp`, `event_type`

### Métriques (future)

- Prometheus endpoints
- Métriques clés :
  - Messages/seconde par agent
  - Latence P50/P95/P99
  - Taux d'erreur
  - Nombre d'agents connectés

### Monitoring CLI

```bash
skynet-linker monitor --channel skynet_core --format json | jq
```

---

## 🧪 Tests

### Niveaux de test

1. **Unit tests** : chaque module isolé
   - `test_protocol.py` : validation messages
   - `test_encryption.py` : NaCl encrypt/decrypt
   - `test_memory.py` : Redis operations

2. **Integration tests** :
   - Flux complet : CLI → Serveur → Redis
   - WebSocket connexion/déconnexion

3. **End-to-end tests** :
   - Scénario multi-agents réel
   - Load testing avec N agents

---

## 📦 Déploiement

### Local (développement)

```bash
# Terminal 1 : Redis
docker run -p 6379:6379 redis:7-alpine

# Terminal 2 : Serveur MCP
cd server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3+ : Agents CLI
skynet-linker connect --agent-id claude_cli
```

### Production (future)

- Docker Compose : serveur + Redis + monitoring
- Kubernetes : scaling horizontal
- Redis Cluster : haute disponibilité
- Nginx : reverse proxy + SSL

---

## 🛣️ Roadmap

### MVP (Phase 1) ✅

- ✅ Protocole MCP de base
- ✅ Serveur FastAPI + WebSocket
- ✅ Redis store
- ✅ Chiffrement NaCl
- ✅ CLI Typer basique
- ✅ Stubs connecteurs

### Phase 2

- [ ] Connecteurs IA réels (OpenAI, Gemini API)
- [ ] Routage intelligent (round-robin, priority)
- [ ] Session management avancé
- [ ] Authentification JWT

### Phase 3

- [ ] Dashboard web temps réel
- [ ] Métriques Prometheus
- [ ] RAG sur historique
- [ ] Auto-scaling agents

---

## 📚 Références techniques

- **FastAPI** : https://fastapi.tiangolo.com/
- **Typer** : https://typer.tiangolo.com/
- **PyNaCl** : https://pynacl.readthedocs.io/
- **Redis** : https://redis.io/docs/
- **WebSocket** : RFC 6455

---

## 🎯 Conclusion

**Skynet Linker CLI** est une infrastructure de coordination multi-agents IA conçue pour :

- **Scalabilité** : ajout facile de nouveaux agents
- **Sécurité** : chiffrement et authentification natives
- **Observabilité** : monitoring complet des échanges
- **Simplicité** : CLI intuitive pour contrôle humain

Architecture modulaire, extensible, prête pour production.

**Next step** : implémentation du MVP ! 🚀
