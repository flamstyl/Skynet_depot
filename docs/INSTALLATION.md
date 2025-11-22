# 📦 Guide d'installation complet

## Prérequis

### Système d'exploitation
- ✅ Linux (Ubuntu 20.04+, Debian 11+)
- ✅ macOS (avec Homebrew)
- ⚠️ Windows (WSL2 recommandé)

### Logiciels requis

#### Obligatoires
- **Node.js** : version 18.0.0 ou supérieure
- **npm** : version 8.0.0 ou supérieure

#### Optionnels (selon utilisation)
- **Docker** : pour utiliser les tools Docker
- **systemd** : pour la gestion des services système
- **Python 3** : pour créer des environnements Python
- **Git** : pour les opérations Git
- **ImageMagick** ou **Sharp** : pour le traitement d'images

## Installation rapide

### 1. Cloner le repository

```bash
git clone <URL_DU_REPO>
cd skynet-mcp-servers
```

### 2. Lancer le script d'installation

```bash
./install.sh
```

Ce script va :
- ✅ Vérifier la version de Node.js
- ✅ Installer les dépendances des deux servers
- ✅ Compiler le code TypeScript
- ✅ Créer les fichiers .env

## Installation manuelle

Si vous préférez installer manuellement :

### 1. Installer skynet-devops-mcp

```bash
cd skynet-devops-mcp
npm install
npm run build
```

### 2. Installer skynet-drive-memory-mcp

```bash
cd ../skynet-drive-memory-mcp
npm install
npm run build
```

## Configuration

### Configuration de skynet-devops-mcp

Éditer `skynet-devops-mcp/.env` :

```env
# Chemins
BASE_PROJECTS_PATH=/home/user/projects
TEMP_DIR=/tmp/skynet-mcp

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/skynet-devops-mcp.log

# Docker
DOCKER_SOCKET=/var/run/docker.sock

# Sécurité
ALLOW_DANGEROUS_OPERATIONS=false
REQUIRE_CONFIRMATION_FOR_SYSTEM_RESTART=true

# Limites
MAX_FILE_SIZE_MB=10
MAX_LOG_LINES=1000
COMMAND_TIMEOUT_MS=300000
```

### Configuration de skynet-drive-memory-mcp

#### 1. Créer un projet Google Cloud

1. Aller sur https://console.cloud.google.com
2. Créer un nouveau projet (par exemple "Skynet MCP")
3. Activer l'API Google Drive :
   - Menu → APIs & Services → Enable APIs and Services
   - Rechercher "Google Drive API"
   - Cliquer sur "Enable"

#### 2. Créer des credentials OAuth 2.0

1. Menu → APIs & Services → Credentials
2. Cliquer sur "Create Credentials" → "OAuth client ID"
3. Type d'application : "Desktop app"
4. Nom : "Skynet Drive MCP"
5. Télécharger le JSON des credentials

#### 3. Configurer le .env

Éditer `skynet-drive-memory-mcp/.env` :

```env
# Google Drive OAuth2
GOOGLE_CLIENT_ID=votre_client_id_ici
GOOGLE_CLIENT_SECRET=votre_client_secret_ici
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback

# Credentials storage
CREDENTIALS_PATH=./credentials/tokens.json

# Embedding mode
EMBEDDING_MODE=local

# Cache
CACHE_DIR=./cache
CACHE_EMBEDDINGS=true

# Logging
LOG_LEVEL=info

# Limites
MAX_FILE_SIZE_MB=50
MAX_FILES_TO_SCAN=1000
```

#### 4. Première authentification Google Drive

```bash
cd skynet-drive-memory-mcp
npm run dev
```

Suivre les instructions pour autoriser l'accès à Google Drive.

## Connexion à Claude Code CLI

### Méthode 1 : CLI (recommandée)

```bash
# DevOps MCP
claude mcp add skynet-devops \
  --transport stdio \
  --command 'node /chemin/absolu/vers/skynet-mcp-servers/skynet-devops-mcp/dist/index.js'

# Drive Memory MCP
claude mcp add skynet-drive \
  --transport stdio \
  --command 'node /chemin/absolu/vers/skynet-mcp-servers/skynet-drive-memory-mcp/dist/index.js'
```

### Méthode 2 : Fichier de configuration

Éditer `~/.config/Claude/claude_desktop_config.json` (Linux) ou `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) :

```json
{
  "mcpServers": {
    "skynet-devops": {
      "command": "node",
      "args": ["/chemin/absolu/vers/skynet-mcp-servers/skynet-devops-mcp/dist/index.js"],
      "env": {}
    },
    "skynet-drive": {
      "command": "node",
      "args": ["/chemin/absolu/vers/skynet-mcp-servers/skynet-drive-memory-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

## Vérification de l'installation

### Test skynet-devops-mcp

```bash
cd skynet-devops-mcp
npm start
```

Le server devrait démarrer et afficher :
```
Skynet DevOps MCP Server started
```

### Test skynet-drive-memory-mcp

```bash
cd skynet-drive-memory-mcp
npm start
```

Le server devrait démarrer et afficher :
```
Skynet Drive Memory MCP Server started
```

## Mise à jour

Pour mettre à jour les servers :

```bash
cd skynet-mcp-servers
git pull
./install.sh
```

## Désinstallation

```bash
# Supprimer de Claude Code CLI
claude mcp remove skynet-devops
claude mcp remove skynet-drive

# Supprimer le dossier
rm -rf skynet-mcp-servers
```

## Prochaines étapes

→ Consulter [USAGE.md](./USAGE.md) pour des exemples d'utilisation

→ Consulter [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) en cas de problème
