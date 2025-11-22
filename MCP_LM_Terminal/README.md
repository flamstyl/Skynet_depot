# 🟣 MCP_LM_Terminal - Local MCP Server for LM Studio + Terminal IA

**Serveur MCP local pour interfacer ChatGPT/Claude avec LM Studio et un terminal interactif**

---

## 📋 Description

MCP_LM_Terminal est un serveur MCP (Model Context Protocol) conçu pour :

✅ **Interfacer ChatGPT/Claude avec LM Studio** via son API locale
✅ **Ouvrir un terminal interactif** accessible à l'IA
✅ **Donner accès à des outils locaux** (fichiers, shell, logs)
✅ **Servir de backend multi-agents** pour orchestrer IA + LM Studio
✅ **Exporter les réponses en temps réel** via WebSocket (optionnel)

---

## 🎯 Fonctionnalités

### 🔹 Routes API MCP

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/status` | GET | État du serveur, modèle LM actif, info terminal |
| `/lm/query` | POST | Transmet une requête à LM Studio et retourne la réponse **avec statistiques complètes** |
| `/terminal/cmd` | POST | Exécute une commande shell et retourne stdout/stderr |
| `/terminal/stream` | WebSocket | Flux interactif bi-directionnel (terminal PTY) |

### 🔹 API LM Studio

- **Support API native v0** : `/api/v0/*` avec statistiques avancées
- **Support API OpenAI v1** : `/v1/*` compatible ChatGPT
- **Statistiques complètes** : tokens/sec, TTFT, generation_time, model_info, runtime
- **Paramètres avancés** : top_p, top_k, stop, ttl

### 🔹 Sécurité

- **Authentification via token API** (Header: `Authorization: Bearer <token>`)
- **Configuration centralisée** dans `config.json`
- **Timeout automatique** pour les commandes shell

### 🔹 Support Multi-Plateformes

- **Linux/Mac**: Terminal PTY complet (ptyprocess)
- **Windows**: Fallback subprocess automatique

---

## 📁 Structure du Projet

```
MCP_LM_Terminal/
├── server.py              # Serveur FastAPI principal
├── terminal_handler.py    # Gestionnaire terminal PTY/subprocess
├── lmstudio_client.py     # Client API LM Studio
├── config.json            # Configuration (TOKEN, HOST, PORT)
├── requirements.txt       # Dépendances Python
└── README.md              # Documentation (ce fichier)
```

---

## 🚀 Installation

### 1️⃣ Prérequis

- **Python 3.11+** (recommandé)
- **LM Studio** installé et lancé sur `http://localhost:1234`
- **Git** (optionnel)

### 2️⃣ Installation des dépendances

```bash
# Cloner le dépôt (ou télécharger les fichiers)
cd MCP_LM_Terminal

# Créer un environnement virtuel
python3 -m venv venv

# Activer l'environnement virtuel
# Linux/Mac:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt
```

### 3️⃣ Configuration

**Modifier le fichier `config.json` :**

```json
{
  "api_token": "VOTRE_TOKEN_SECRET_ICI",
  "lmstudio": {
    "host": "http://localhost:1234",
    "model": "default",
    "api_version": "v0"
  },
  "terminal": {
    "timeout": 20
  },
  "server": {
    "host": "0.0.0.0",
    "port": 8080
  }
}
```

**Paramètres de configuration :**
- `api_token` : **Changez obligatoirement ce token !**
- `api_version` : `"v0"` (API native avec stats) ou `"v1"` (API OpenAI-compatible)

---

## 🎮 Utilisation

### 🔹 Démarrage du Serveur

```bash
# S'assurer que l'environnement virtuel est activé
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Lancer le serveur
uvicorn server:app --host 0.0.0.0 --port 8080
```

**Le serveur sera accessible sur** `http://localhost:8080`

### 🔹 Vérification du Statut

```bash
curl -X GET http://localhost:8080/status \
  -H "Authorization: Bearer VOTRE_TOKEN_SECRET_ICI"
```

**Réponse :**

```json
{
  "status": "online",
  "lm_studio": {
    "connected": true,
    "host": "http://localhost:1234",
    "model": "default",
    "available": true
  },
  "terminal": {
    "status": "online",
    "timeout": "20s"
  },
  "version": "1.0.0"
}
```

### 🔹 Test Terminal

**Exécuter une commande shell :**

```bash
curl -X POST http://localhost:8080/terminal/cmd \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_SECRET_ICI" \
  -d '{"cmd": "ls -la"}'
```

**Réponse :**

```json
{
  "success": true,
  "command": "ls -la",
  "stdout": "total 48\ndrwxr-xr-x  6 user user 4096 ...",
  "stderr": "",
  "exit_code": 0,
  "execution_time": 0.12
}
```

### 🔹 Test LM Studio

**Envoyer une requête au modèle LM :**

```bash
curl -X POST http://localhost:8080/lm/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_SECRET_ICI" \
  -d '{
    "prompt": "Bonjour, qui es-tu ?",
    "temperature": 0.7,
    "max_tokens": 512
  }'
```

**Réponse (avec statistiques complètes) :**

```json
{
  "success": true,
  "content": "Je suis un assistant IA local exécuté via LM Studio...",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 48,
    "total_tokens": 63
  },
  "stats": {
    "tokens_per_second": 52.43,
    "time_to_first_token": 0.112,
    "generation_time": 0.915,
    "stop_reason": "eosFound"
  },
  "model_info": {
    "arch": "llama",
    "quant": "Q4_K_M",
    "format": "gguf",
    "context_length": 4096
  },
  "runtime": {
    "name": "llama.cpp-mac-arm64-apple-metal-advsimd",
    "version": "1.3.0",
    "supported_formats": ["gguf"]
  },
  "finish_reason": "stop",
  "model": "default"
}
```

**Note** : Les champs `stats`, `model_info` et `runtime` sont disponibles uniquement avec `api_version: "v0"` (API native LM Studio). Avec `api_version: "v1"`, seuls `content`, `usage` et `finish_reason` sont retournés.

---

## 🔗 Connexion avec ChatGPT/Claude

### 🔹 Avec ChatGPT (Custom Actions)

1. Aller dans **Settings > Actions**
2. Créer une nouvelle action **MCP_LM_Terminal**
3. **Schema OpenAPI** :

```yaml
openapi: 3.0.0
info:
  title: MCP LM Terminal
  version: 1.0.0
servers:
  - url: http://localhost:8080
paths:
  /lm/query:
    post:
      summary: Interroger LM Studio
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                prompt:
                  type: string
                temperature:
                  type: number
                max_tokens:
                  type: integer
      responses:
        '200':
          description: Réponse du modèle
  /terminal/cmd:
    post:
      summary: Exécuter une commande
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                cmd:
                  type: string
      responses:
        '200':
          description: Résultat de la commande
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
```

4. **Authentication** : Bearer Token avec votre `api_token`

### 🔹 Avec Claude Desktop (MCP)

**Ajouter dans `claude_desktop_config.json` :**

```json
{
  "mcpServers": {
    "lm-terminal": {
      "command": "uvicorn",
      "args": [
        "server:app",
        "--host", "0.0.0.0",
        "--port", "8080"
      ],
      "cwd": "/chemin/vers/MCP_LM_Terminal",
      "env": {
        "PYTHONPATH": "/chemin/vers/MCP_LM_Terminal/venv/lib/python3.11/site-packages"
      }
    }
  }
}
```

**Redémarrer Claude Desktop.**

---

## 🧪 Tests Manuels

### 🔹 Test du Terminal Handler

```bash
python3 terminal_handler.py
```

**Sortie attendue :**

```
🟣 Terminal Handler Info:
  system: Linux
  shell: /bin/bash
  pty_support: True
  platform: Linux-4.4.0-x86_64-with-glibc2.31

🧪 Test 1: ls -la
Exit code: 0
Output: total 48
drwxr-xr-x  6 user user ...
```

### 🔹 Test du Client LM Studio

```bash
python3 lmstudio_client.py
```

**Sortie attendue :**

```
🧪 Test LM Studio Client
==================================================

1️⃣ Vérification du statut...
Connecté : True
Disponible : True
Modèles : default, llama-3.2

2️⃣ Récupération des modèles...
Modèles trouvés : ['default', 'llama-3.2']

3️⃣ Test de completion...
Réponse : Hello! How can I help you today?

✅ Tests terminés
```

---

## 🔧 Configuration Avancée

### 🔹 Changer le Port

Dans `config.json` :

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 9000
  }
}
```

### 🔹 Utiliser un Modèle Spécifique

Dans `config.json` :

```json
{
  "lmstudio": {
    "host": "http://localhost:1234",
    "model": "llama-3.2-3b-instruct"
  }
}
```

### 🔹 Augmenter le Timeout Terminal

Dans `config.json` :

```json
{
  "terminal": {
    "timeout": 60
  }
}
```

---

## 🛡️ Sécurité

### 🔹 Token API

- **Ne partagez JAMAIS votre token**
- Utilisez un token complexe (minimum 32 caractères)
- Exemple de génération :

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 🔹 Accès Réseau

- Par défaut, le serveur écoute sur `0.0.0.0` (toutes les interfaces)
- En production, restreignez à `127.0.0.1` (localhost uniquement)

### 🔹 Commandes Terminal

- **Attention** : toutes les commandes sont exécutées avec les privilèges de l'utilisateur
- **Ne jamais exposer ce serveur publiquement** sans authentification renforcée
- Utilisez des restrictions shell (chroot, docker, etc.) en production

---

## 🐛 Résolution de Problèmes

### ❌ LM Studio non accessible

**Erreur :**
```
LM Studio non accessible (connexion refusée)
```

**Solution :**
1. Vérifiez que LM Studio est lancé
2. Vérifiez qu'un modèle est chargé
3. Vérifiez que le serveur local est sur `http://localhost:1234`
4. Testez manuellement :
   ```bash
   curl http://localhost:1234/v1/models
   ```

### ❌ Erreur ptyprocess sur Windows

**Erreur :**
```
ModuleNotFoundError: No module named 'ptyprocess'
```

**Solution :**
- C'est normal sur Windows
- Le code utilise automatiquement `subprocess` en fallback
- Aucune action requise

### ❌ Token invalide

**Erreur :**
```
403 Forbidden: Token d'authentification invalide
```

**Solution :**
- Vérifiez que le Header est bien : `Authorization: Bearer <token>`
- Vérifiez que le token correspond au `config.json`
- Pas d'espaces ou caractères spéciaux

---

## 📚 Documentation API Complète

### GET /status

**Headers :**
```
Authorization: Bearer <token>
```

**Réponse :**
```json
{
  "status": "online",
  "lm_studio": {
    "connected": true,
    "host": "http://localhost:1234",
    "model": "default",
    "available": true
  },
  "terminal": {
    "status": "online",
    "timeout": "20s"
  },
  "version": "1.0.0"
}
```

### POST /lm/query

**Headers :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**
```json
{
  "prompt": "Votre question",
  "temperature": 0.7,
  "max_tokens": 512,
  "model": "default"
}
```

**Réponse (avec API v0) :**
```json
{
  "success": true,
  "content": "Réponse du modèle...",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 50,
    "total_tokens": 60
  },
  "stats": {
    "tokens_per_second": 45.2,
    "time_to_first_token": 0.12,
    "generation_time": 1.1,
    "stop_reason": "eosFound"
  },
  "model_info": {
    "arch": "llama",
    "quant": "Q4_K_M",
    "format": "gguf",
    "context_length": 4096
  },
  "runtime": {
    "name": "llama.cpp-...",
    "version": "1.3.0",
    "supported_formats": ["gguf"]
  },
  "finish_reason": "stop",
  "model": "default"
}
```

### POST /terminal/cmd

**Headers :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**
```json
{
  "cmd": "ls -la",
  "timeout": 20
}
```

**Réponse :**
```json
{
  "success": true,
  "command": "ls -la",
  "stdout": "total 48\n...",
  "stderr": "",
  "exit_code": 0,
  "execution_time": 0.12
}
```

### WebSocket /terminal/stream

**Connexion :**
```javascript
const ws = new WebSocket('ws://localhost:8080/terminal/stream');

ws.onopen = () => {
  console.log('Terminal connecté');
  ws.send('ls -la');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commit vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Push vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

---

## 📄 Licence

Ce projet fait partie de **Skynet_depot** - Architecture multi-agents MCP

---

## 🆘 Support

Pour toute question ou problème :

1. Consultez la section **Résolution de Problèmes**
2. Vérifiez les logs du serveur
3. Ouvrez une issue sur GitHub

---

## 🔮 Roadmap

- [ ] Support du streaming LM Studio (réponses progressives)
- [ ] Interface Web de monitoring
- [ ] Support multi-sessions terminal
- [ ] Logs persistants et rotation
- [ ] Intégration avec d'autres modèles locaux (Ollama, etc.)
- [ ] Mode daemon (systemd/supervisor)

---

**🟣 MCP_LM_Terminal - Skynet Local Execution Unit**

*Propulsé par FastAPI, LM Studio, et Claude Code 4.5*
