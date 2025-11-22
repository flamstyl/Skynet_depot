# 🚀 Workspace MCP - DevOps + Créatif

**Serveur MCP (Model Context Protocol) pour Claude Code CLI**

Un serveur MCP complet qui transforme Claude en un véritable développeur/admin Linux avec accès à :
- 🔧 Gestion d'environnements de développement (Python, Node.js)
- 🐳 Administration Docker (containers, images, logs)
- ⚙️ Administration système (monitoring, services, health checks)
- 📁 Gestion de projets (fichiers, Git)
- 🎨 Manipulation d'images (redimensionnement, conversion, miniatures)

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Utilisation](#utilisation)
6. [Tools disponibles](#tools-disponibles)
7. [Exemples](#exemples)
8. [Dépannage](#dépannage)
9. [Extension](#extension)
10. [Architecture](#architecture)

---

## 🎯 Vue d'ensemble

### À quoi sert ce MCP ?

Ce serveur MCP expose **27+ tools** organisés en 5 modules :

| Module | Description | Tools |
|--------|-------------|-------|
| **dev_env** | Environnements de développement | `create_project`, `setup_python`, `setup_node`, `list_envs` |
| **docker_admin** | Administration Docker | `list_containers`, `container_logs`, `start/stop/restart_container` |
| **server_admin** | Administration système | `get_system_info`, `get_resource_usage`, `health_check` |
| **project_ops** | Fichiers & Git | `list_directory`, `read/write_file`, `git_status`, `git_commit`, `git_push` |
| **graphics_tools** | Manipulation d'images | `resize_image`, `convert_format`, `generate_thumbnail` |

### Architecture

```
┌──────────────────────────────────────────┐
│         CLAUDE CODE CLI                  │
│         (MCP Client Host)                │
└───────────────┬──────────────────────────┘
                │ MCP Protocol (stdio/HTTP)
                ▼
┌──────────────────────────────────────────┐
│      WORKSPACE MCP SERVER (Port 3100)    │
├──────────────────────────────────────────┤
│  Tools Registry | Validator | Logger     │
└──────────────────────────────────────────┘
        │       │       │       │       │
    ┌───┴──┬────┴──┬────┴──┬────┴──┬────┴──┐
    ▼      ▼       ▼       ▼       ▼       ▼
 dev_env docker server project graphics
         admin   admin    ops    tools
```

---

## 🔧 Prérequis

### Système d'exploitation
- **Linux** (Ubuntu 20.04+, Debian 11+, ou compatible)
- **macOS** (testé sur macOS 12+)

### Obligatoires
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**

### Optionnels (selon les modules utilisés)
- **Docker** (pour docker_admin)
- **Python 3** (pour dev_env Python)
- **ImageMagick** (pour graphics_tools)

### Vérification rapide

```bash
node -v    # >= v18.0.0
npm -v     # >= 9.0.0
git --version
docker -v  # Optionnel
convert -version  # ImageMagick, optionnel
```

---

## 📦 Installation

### Installation rapide

```bash
# Cloner ou télécharger le projet
cd workspace_mcp

# Lancer le script d'installation
chmod +x scripts/install.sh
./scripts/install.sh
```

Le script d'installation va :
1. Vérifier Node.js et npm
2. Installer les dépendances npm
3. Compiler TypeScript
4. Créer les dossiers `data/`
5. Copier `.env.example` vers `.env`
6. Vérifier Docker et ImageMagick (optionnels)

### Installation manuelle

```bash
# Installer les dépendances
npm install

# Compiler TypeScript
npm run build

# Créer les dossiers
mkdir -p data/cache data/logs

# Configurer l'environnement
cp .env.example .env
nano .env  # Éditer selon vos besoins
```

---

## ⚙️ Configuration

### Fichier `.env`

```bash
# Server
MCP_PORT=3100
NODE_ENV=development
LOG_LEVEL=info

# Paths
PROJECTS_ROOT=/home/user/projects
DATA_DIR=./data
CACHE_DIR=./data/cache
LOGS_DIR=./data/logs

# Docker
DOCKER_SOCKET=/var/run/docker.sock

# Security
MAX_FILE_SIZE=10485760
ENABLE_DANGEROUS_OPERATIONS=false

# Graphics
IMAGEMAGICK_PATH=/usr/bin/convert
```

### Connexion à Claude Code CLI

#### Méthode 1 : stdio (recommandé pour local)

```bash
claude mcp add workspace-mcp stdio node /path/to/workspace_mcp/dist/server.js
```

#### Méthode 2 : HTTP (pour accès distant)

```bash
# Démarrer le serveur
npm start

# Dans un autre terminal
claude mcp add workspace-mcp http://localhost:3100
```

### Vérification

```bash
# Lister les serveurs MCP
claude mcp list

# Devrait afficher:
# - workspace-mcp (http://localhost:3100)
#   Status: Connected
#   Tools: 27+
```

---

## 🎮 Utilisation

### Démarrer le serveur

```bash
# Mode production
npm start

# Mode développement (hot reload)
npm run dev

# Avec Docker
docker build -t workspace-mcp .
docker run -p 3100:3100 -v /var/run/docker.sock:/var/run/docker.sock workspace-mcp
```

### Vérifier que le serveur fonctionne

```bash
# Health check
curl http://localhost:3100/health

# Liste des tools
curl http://localhost:3100/tools

# Statistiques
curl http://localhost:3100/stats
```

### Test automatique

```bash
# Lancer les tests
./scripts/test_mcp.sh
```

---

## 🔨 Tools disponibles

### Module dev_env

#### `dev_env_create_project`
Crée un nouveau projet avec structure de dossiers

**Input:**
```json
{
  "name": "my-project",
  "type": "python",
  "git_init": true
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "project_path": "/home/user/projects/my-project",
    "structure": [...],
    "message": "Projet créé avec succès"
  }
}
```

#### `dev_env_setup_python`
Configure un environnement Python (venv)

**Input:**
```json
{
  "project_path": "/home/user/projects/my-project",
  "env_name": "venv",
  "install_deps": true
}
```

#### `dev_env_list`
Liste tous les environnements de développement

**Input:**
```json
{
  "filter": "all",
  "search_path": "/home/user/projects"
}
```

---

### Module docker_admin

#### `docker_list_containers`
Liste les containers Docker

**Input:**
```json
{
  "all": true,
  "format": "detailed"
}
```

#### `docker_container_logs`
Récupère les logs d'un container

**Input:**
```json
{
  "container": "my-container",
  "tail": 100
}
```

#### `docker_start_container` / `docker_stop_container` / `docker_restart_container`
Contrôle les containers

**Input:**
```json
{
  "container": "my-container",
  "timeout": 10
}
```

---

### Module server_admin

#### `server_get_system_info`
Informations système générales

**Output:**
```json
{
  "os": "Ubuntu 22.04",
  "kernel": "5.15.0",
  "hostname": "dev-server",
  "uptime": "48 heures"
}
```

#### `server_get_resource_usage`
Utilisation des ressources

**Input:**
```json
{
  "detailed": true,
  "include_gpu": true
}
```

**Output:**
```json
{
  "cpu": { "usage_percent": 45, "cores": 8 },
  "memory": { "total_gb": 32, "used_gb": 18, "percent": 56 },
  "disk": [...],
  "gpu": [...]
}
```

#### `server_health_check`
Health check global

**Output:**
```json
{
  "status": "healthy",
  "checks": { "cpu": "OK", "memory": "OK", "disk": "OK" },
  "alerts": []
}
```

---

### Module project_ops

#### `project_list_directory`
Liste le contenu d'un dossier

**Input:**
```json
{
  "path": "/home/user/projects",
  "recursive": false,
  "include_hidden": false
}
```

#### `project_read_file` / `project_write_file`
Lecture/écriture de fichiers

**Input (write):**
```json
{
  "path": "/home/user/test.txt",
  "content": "Hello World",
  "create_backup": true
}
```

#### `project_git_status` / `project_git_commit` / `project_git_push`
Opérations Git

**Input (commit):**
```json
{
  "repo_path": "/home/user/my-project",
  "message": "Initial commit",
  "files": ["src/", "README.md"]
}
```

---

### Module graphics_tools

#### `graphics_resize_image`
Redimensionne une image

**Input:**
```json
{
  "input_path": "/path/to/image.jpg",
  "output_path": "/path/to/resized.jpg",
  "width": 800,
  "height": 600,
  "maintain_aspect": true,
  "quality": 80
}
```

#### `graphics_convert_format`
Convertit une image

**Input:**
```json
{
  "input_path": "/path/to/image.png",
  "output_path": "/path/to/image.webp",
  "format": "webp",
  "quality": 85
}
```

#### `graphics_generate_thumbnail`
Génère une miniature

**Input:**
```json
{
  "input_path": "/path/to/image.jpg",
  "output_path": "/path/to/thumb.jpg",
  "max_size": 200,
  "crop": false
}
```

---

## 💡 Exemples d'utilisation

### Exemple 1 : Créer un nouveau projet Python

```typescript
// Via Claude Code CLI
"Crée un nouveau projet Python nommé 'data-analysis' avec un venv"

// Claude va appeler :
// 1. dev_env_create_project
// 2. dev_env_setup_python
```

### Exemple 2 : Monitorer des containers Docker

```typescript
"Montre-moi tous les containers Docker et les logs du container 'web-app'"

// Claude va appeler :
// 1. docker_list_containers
// 2. docker_container_logs
```

### Exemple 3 : Health check serveur

```typescript
"Fais un health check complet du serveur"

// Claude va appeler :
// 1. server_health_check
// 2. server_get_resource_usage
```

### Exemple 4 : Manipuler des fichiers et Git

```typescript
"Liste les fichiers du dossier /home/user/my-project, lis le README, puis fais un commit"

// Claude va appeler :
// 1. project_list_directory
// 2. project_read_file
// 3. project_git_commit
```

### Exemple 5 : Redimensionner des images

```typescript
"Redimensionne toutes les images PNG du dossier images/ en 800x600"

// Claude va appeler :
// 1. project_list_directory
// 2. graphics_resize_image (pour chaque image)
```

---

## 🐛 Dépannage

### Le serveur ne démarre pas

**Problème :** `Error: Cannot find module`
```bash
# Solution : Recompiler TypeScript
npm run build
```

**Problème :** `Port 3100 already in use`
```bash
# Solution : Changer le port dans .env
MCP_PORT=3200
```

### Docker tools ne fonctionnent pas

**Problème :** `Error: connect EACCES /var/run/docker.sock`
```bash
# Solution : Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER
# Puis se reconnecter
```

### Graphics tools ne fonctionnent pas

**Problème :** `sharp: Command failed`
```bash
# Solution : Réinstaller sharp
npm rebuild sharp
```

**Problème :** `ImageMagick not found`
```bash
# Solution : Installer ImageMagick
sudo apt-get install imagemagick  # Ubuntu/Debian
brew install imagemagick          # macOS
```

### Consulter les logs

```bash
# Logs du serveur
tail -f data/logs/workspace-mcp.log

# Logs d'erreurs uniquement
tail -f data/logs/error.log
```

---

## 🔧 Extension

### Ajouter un nouveau tool

1. **Créer le fichier tool** dans le module approprié :

```typescript
// src/modules/dev_env/tools/my_new_tool.ts
export async function myNewTool(input: any) {
  // Validation
  const validated = Validator.validate(input, mySchema);

  // Logique
  const result = await doSomething(validated);

  return result;
}
```

2. **Enregistrer le tool** dans `index.ts` du module :

```typescript
// src/modules/dev_env/index.ts
import { myNewTool } from './tools/my_new_tool.js';

export function registerDevEnvTools(): void {
  // ...
  ToolRegistry.register(
    createTool(
      'dev_env_my_new_tool',
      'Description de mon tool',
      { param1: { type: 'string' } },
      ['param1']
    )
  );
}

export const devEnvHandlers = {
  // ...
  dev_env_my_new_tool: async (input: any) =>
    MCPErrorHandler.executeTool('dev_env_my_new_tool', () => myNewTool(input))
};
```

3. **Recompiler et redémarrer** :

```bash
npm run build
npm start
```

### Ajouter un nouveau module

1. Créer la structure :
```bash
mkdir -p src/modules/my_module/{tools,utils}
touch src/modules/my_module/index.ts
```

2. Implémenter les tools (suivre le pattern des autres modules)

3. Importer dans `src/server.ts` :
```typescript
import { registerMyModuleTools, myModuleHandlers } from './modules/my_module/index.js';

// Dans registerAllTools()
registerMyModuleTools();

// Dans allHandlers
const allHandlers = {
  ...myModuleHandlers
};
```

---

## 📚 Documentation supplémentaire

- [INSTALLATION.md](docs/INSTALLATION.md) - Guide d'installation détaillé
- [USAGE.md](docs/USAGE.md) - Guide d'utilisation avancé
- [TOOLS_REFERENCE.md](docs/TOOLS_REFERENCE.md) - Référence complète des tools
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Guide de dépannage

---

## 📝 Licence

MIT License - Voir LICENSE pour plus de détails

---

## 👥 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche feature (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Pushez vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

---

## 🙏 Remerciements

- [Anthropic](https://www.anthropic.com) pour le Model Context Protocol
- [Claude Code CLI](https://code.claude.com) pour l'environnement de développement
- Communauté open-source pour les bibliothèques utilisées

---

**Créé avec ❤️ par Skynet AI Assistant**
