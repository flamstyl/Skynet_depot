# 🟣 MCP_Server — Skynet Local Bridge

**Version:** 1.0.0
**Auteur:** Skynet Development Team
**Date:** 2025-11-22

---

## 📖 Description

**MCP_Server** est un serveur local basé sur **FastAPI** qui sert de pont entre des IA (ChatGPT, Claude, Gemini, Comet) et votre système local.

Il permet aux IA de :

- 🗂️ **Lire et écrire des fichiers** locaux
- 💻 **Exécuter des commandes** dans un terminal sécurisé
- 🧠 **Maintenir une mémoire longue** (RAG interne)
- 🔍 **Rechercher dans vos dossiers**
- 🐳 **Interagir avec Docker** (sandbox IA)
- 🌐 **Accéder à Internet** via votre machine

Bref : **Votre cerveau + Votre disque dur + Votre terminal → Accessibles à vos IA, mais toujours sous contrôle.**

---

## 🏗️ Architecture

```
MCP_Server/
├── server.py                 # Application FastAPI principale
├── main.py                   # Point d'entrée
├── endpoints/
│   ├── filesystem.py         # Lecture/écriture de fichiers
│   ├── terminal.py           # Exécution de commandes
│   ├── memory.py             # Mémoire longue (RAG)
│   ├── internet.py           # Proxy Internet
│   └── docker_sandbox.py     # Exécution dans Docker
├── memory/
│   ├── index_memory.json     # Index de mémoire
│   ├── memory_index.md       # Version lisible
│   └── history/              # Logs quotidiens
│       └── YYYY-MM-DD.log
├── sandbox/
│   ├── Dockerfile            # Image Docker pour sandbox
│   └── run_sandbox.sh        # Script de lancement
├── .env                      # Configuration
├── requirements.txt          # Dépendances Python
└── README.md                 # Ce fichier
```

---

## ⚡ Installation

### 1. Prérequis

- **Python 3.10+**
- **pip** (gestionnaire de packages Python)
- **Docker** (optionnel, pour le sandbox)

### 2. Cloner le projet

```bash
cd MCP_Server
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Configurer l'environnement

Copiez `.env.example` vers `.env` et modifiez la clé API :

```bash
cp .env.example .env
nano .env  # ou vim, code, etc.
```

**Important :** Changez `MCP_API_KEY` pour une clé sécurisée !

```env
MCP_API_KEY=VOTRE_CLE_SECRETE_ICI
MCP_PORT=7860
LOG_LEVEL=INFO
```

### 5. Lancer le serveur

**Méthode 1 : Via main.py**

```bash
python main.py
```

**Méthode 2 : Via uvicorn directement**

```bash
uvicorn server:app --host 0.0.0.0 --port 7860 --reload
```

Le serveur démarre sur : **http://localhost:7860**

---

## 📚 Documentation interactive

Une fois le serveur lancé, accédez à la documentation Swagger :

🌐 **http://localhost:7860/docs**

Ou la documentation ReDoc :

🌐 **http://localhost:7860/redoc**

---

## 🔐 Sécurité

### Authentification

Toutes les requêtes nécessitent une clé API. Deux méthodes :

#### 1. Via header HTTP (recommandé)

```bash
curl -H "Authorization: YOUR_API_KEY" http://localhost:7860/
```

#### 2. Via le body JSON

```json
{
  "command": "ls -la",
  "auth": "YOUR_API_KEY"
}
```

### Protections intégrées

- ✅ **Anti-évasion de répertoire** (interdiction de `..`, `/etc`, `/root`)
- ✅ **Liste noire de commandes dangereuses** (`rm -rf /`, fork bombs, etc.)
- ✅ **Timeout configurable** pour éviter les blocages
- ✅ **Sandbox Docker isolé** (pas d'accès réseau, limites RAM/CPU)

---

## 🧪 Endpoints disponibles

### 1. 🗂️ Filesystem

#### Lire un fichier

```bash
POST /filesystem/read

{
  "path": "/home/user/Documents/test.txt",
  "auth": "YOUR_API_KEY"
}
```

#### Écrire un fichier

```bash
POST /filesystem/write

{
  "path": "/home/user/Documents/output.txt",
  "content": "Hello from AI!",
  "mode": "w",
  "auth": "YOUR_API_KEY"
}
```

#### Lister un répertoire

```bash
POST /filesystem/list

{
  "path": "/home/user/Documents",
  "recursive": false,
  "auth": "YOUR_API_KEY"
}
```

---

### 2. 💻 Terminal

#### Exécuter une commande

```bash
POST /terminal/execute

{
  "command": "ls -la",
  "timeout": 10,
  "auth": "YOUR_API_KEY"
}
```

**Windows :**

```json
{
  "command": "dir",
  "auth": "YOUR_API_KEY"
}
```

#### Informations système

```bash
POST /terminal/info

{
  "auth": "YOUR_API_KEY"
}
```

---

### 3. 🧠 Memory (Mémoire longue)

#### Ajouter à la mémoire

```bash
POST /memory/add

{
  "content": "L'utilisateur préfère Python pour le backend",
  "tags": ["preferences", "python"],
  "metadata": {"confidence": "high"},
  "auth": "YOUR_API_KEY"
}
```

#### Rechercher dans la mémoire

```bash
POST /memory/query

{
  "query": "python",
  "tags": ["preferences"],
  "limit": 5,
  "auth": "YOUR_API_KEY"
}
```

#### Historique

```bash
POST /memory/history

{
  "date": "2025-11-22",
  "auth": "YOUR_API_KEY"
}
```

---

### 4. 🌐 Internet

#### Fetch URL

```bash
POST /internet/fetch

{
  "url": "https://api.github.com/users/octocat",
  "method": "GET",
  "auth": "YOUR_API_KEY"
}
```

⚠️ **Attention :** Expose votre IP. Utilisez avec prudence.

---

### 5. 🐳 Docker Sandbox

#### Construire l'image sandbox

```bash
cd sandbox
docker build -t mcp-sandbox:latest .
```

Ou via l'endpoint :

```bash
POST /sandbox/build

{
  "auth": "YOUR_API_KEY"
}
```

#### Exécuter dans le sandbox

```bash
POST /sandbox/run

{
  "command": "python -c 'print(2+2)'",
  "timeout": 10,
  "auth": "YOUR_API_KEY"
}
```

**Avec du code :**

```json
{
  "language": "python",
  "code": "import sys\nprint(sys.version)",
  "auth": "YOUR_API_KEY"
}
```

---

## 🤖 Connexion avec les IA

### ChatGPT (via API ou DevTools)

**Exemple avec curl :**

```bash
curl -X POST http://localhost:7860/terminal/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "ls -la",
    "auth": "YOUR_API_KEY"
  }'
```

**Dans ChatGPT Custom Instructions :**

> "Tu as accès à un serveur MCP local sur http://localhost:7860. Utilise les endpoints /filesystem, /terminal, /memory pour interagir avec mon système."

---

### Claude Code / Claude Desktop

**Exemple :**

```bash
curl -X POST http://localhost:7860/filesystem/read \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/home/user/Documents/directives.md",
    "auth": "YOUR_API_KEY"
  }'
```

**Configuration Claude Desktop :**

Ajoutez dans `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "skynet-local": {
      "url": "http://localhost:7860",
      "apiKey": "YOUR_API_KEY"
    }
  }
}
```

---

### Autres IA (Gemini, Comet, etc.)

Utilisez les mêmes endpoints HTTP. Le serveur est compatible avec tout client HTTP.

---

## 🛠️ Développement

### Lancer en mode développement

```bash
python main.py  # Auto-reload activé par défaut
```

### Logs

Les logs sont affichés dans le terminal et également stockés dans `memory/history/`.

Niveau de logs configurable dans `.env` :

```env
LOG_LEVEL=DEBUG  # Pour plus de détails
```

---

## 🧩 Extensions possibles

### TODO Upgrades Skynet

- [ ] **Authentification multi-utilisateurs** (JWT tokens)
- [ ] **Support WebSocket** pour streaming en temps réel
- [ ] **Intégration base de données** (PostgreSQL, SQLite)
- [ ] **API de recherche web** (Google Custom Search, DuckDuckGo)
- [ ] **Système de plugins** pour ajouter des endpoints dynamiquement
- [ ] **Dashboard web** (React/Vue.js) pour monitoring
- [ ] **Rate limiting** pour éviter les abus
- [ ] **Encryption des données** de mémoire
- [ ] **Support multi-langues** (i18n)
- [ ] **Intégration avec LangChain** pour RAG avancé
- [ ] **Execution de notebooks Jupyter** dans le sandbox
- [ ] **Support GPU** pour le sandbox (ML/AI tasks)

---

## 🐳 Docker (Déploiement)

### Construire l'image du serveur

```bash
# TODO: Créer un Dockerfile pour le serveur lui-même
docker build -t mcp-server:latest .
```

### Lancer avec Docker Compose

```yaml
# TODO: Créer un docker-compose.yml
version: '3.8'
services:
  mcp-server:
    image: mcp-server:latest
    ports:
      - "7860:7860"
    volumes:
      - ./memory:/app/memory
    environment:
      - MCP_API_KEY=${MCP_API_KEY}
```

---

## 🧪 Tests

```bash
# TODO: Ajouter des tests unitaires
pytest tests/
```

---

## 📝 Logs et historique

### Consulter les logs du jour

```bash
cat memory/history/$(date +%Y-%m-%d).log | jq .
```

### Voir la mémoire au format Markdown

```bash
cat memory/memory_index.md
```

---

## ⚠️ Avertissements

- **Sécurité :** Ne exposez PAS ce serveur sur Internet sans sécurisation supplémentaire (HTTPS, firewall, etc.)
- **Permissions :** Le serveur a accès à votre système. Soyez prudent avec les clés API.
- **Docker :** Le sandbox Docker est isolé, mais pas infaillible. N'exécutez pas de code malveillant.

---

## 📄 Licence

MIT License — Libre d'utilisation et de modification.

---

## 🙏 Contributions

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amazing`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing`)
5. Ouvrez une Pull Request

---

## 📧 Support

Pour toute question ou problème :

- Ouvrir une issue sur GitHub
- Consulter la documentation interactive : `/docs`

---

## 🚀 Démarrage rapide (TL;DR)

```bash
# 1. Installer les dépendances
pip install -r requirements.txt

# 2. Configurer
cp .env.example .env
# Éditer .env et changer MCP_API_KEY

# 3. Lancer
python main.py

# 4. Tester
curl http://localhost:7860/
```

**Documentation :** http://localhost:7860/docs

**C'est tout ! 🎉**

---

**Fait avec 💜 par Skynet Development Team**
