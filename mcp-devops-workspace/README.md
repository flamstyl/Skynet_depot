# 🕸️ MCP DevOps Workspace

**Serveur MCP complet pour transformer Claude Code en véritable poste de travail DevOps/Créatif**

Un Model Context Protocol (MCP) server qui expose 50+ tools pour :
- 🐍 **Gestion des environnements de développement** (Python, Node.js, Go, Rust)
- 🐳 **Administration Docker** (containers, images, volumes, compose, stats)
- 🖥️ **Administration système** (métriques, services systemd, processus, GPU)
- 📁 **Gestion de projets** (fichiers, Git complet)
- 🎨 **Manipulation d'images** (resize, convert, compress, compose)

---

## 📚 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Prérequis](#prérequis)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Utilisation](#utilisation)
7. [Tools disponibles](#tools-disponibles)
8. [Sécurité](#sécurité)
9. [Dépannage](#dépannage)
10. [Extension](#extension)
11. [Sources](#sources)

---

## 🎯 Vue d'ensemble

Le **MCP DevOps Workspace** est un serveur Model Context Protocol qui donne à Claude Code (ou tout client MCP) des capacités avancées pour :

### 🔹 Développement
- Créer des projets structurés (Python, Node, Go, Rust)
- Configurer automatiquement les environnements (virtualenv, npm)
- Installer les dépendances depuis requirements.txt, package.json

### 🔹 Docker
- Lister, démarrer, arrêter, redémarrer des containers
- Consulter les logs en temps réel
- Gérer des stacks Docker Compose
- Monitorer les ressources (CPU, RAM) des containers

### 🔹 Système
- Récupérer les métriques système (CPU, RAM, disque, réseau)
- Gérer les services systemd
- Lister les processus top CPU/RAM
- Vérifier les ports ouverts
- Monitorer les GPU NVIDIA (si disponible)

### 🔹 Projets
- Naviguer dans les fichiers et dossiers
- Lire/écrire des fichiers (avec backup automatique)
- Opérations Git complètes (init, status, add, commit, push, pull, branch, checkout, log)

### 🔹 Graphisme
- Redimensionner des images
- Convertir entre formats (JPEG, PNG, WebP, AVIF, TIFF)
- Compresser des images
- Créer des miniatures
- Composer des images (watermark, overlay)

---

## 🏗️ Architecture

```
mcp-devops-workspace/
├── src/
│   ├── index.ts              # Point d'entrée (serveur MCP)
│   ├── server.ts             # Configuration serveur + routing tools
│   ├── types/
│   │   └── schemas.ts        # Zod schemas de validation
│   ├── utils/
│   │   ├── security.ts       # Sécurité (path traversal, validation)
│   │   └── errors.ts         # Gestion des erreurs MCP
│   └── tools/
│       ├── dev-env.ts        # 🐍 Dev environments
│       ├── docker-admin.ts   # 🐳 Docker admin
│       ├── server-admin.ts   # 🖥️ System admin
│       ├── project-ops.ts    # 📁 Files & Git
│       └── graphics.ts       # 🎨 Image manipulation
├── package.json
├── tsconfig.json
├── install.sh                # Script d'installation
├── .env.example
└── README.md
```

### Flux MCP

```
Claude Code (Client)
      ↓
[JSON-RPC over stdio]
      ↓
MCP Server (server.ts)
      ↓
Tool Routing (switch/case)
      ↓
Validation (Zod schemas)
      ↓
Sécurité (validatePath, etc.)
      ↓
Exécution (tools/*.ts)
      ↓
Réponse formatée (JSON)
```

---

## ⚙️ Prérequis

### Obligatoire
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **TypeScript** (installé automatiquement)

### Optionnel (selon les tools utilisés)
- **Docker** (pour docker_admin tools)
- **systemd** (pour server_admin services)
- **Git** (pour project_ops git_*)
- **ImageMagick** (pour graphics tools avancés, mais Sharp fonctionne standalone)
- **nvidia-smi** (pour get_gpu_info)
- **netcat (nc)** (pour check_port)

### OS supportés
- **Linux** (Ubuntu, Debian, Fedora, Arch, etc.)
- **macOS** (avec Docker Desktop si vous voulez docker_admin)
- **Windows WSL2** (non testé mais devrait fonctionner)

---

## 🚀 Installation

### Méthode 1 : Installation automatique (recommandée)

```bash
git clone <votre-repo>/mcp-devops-workspace.git
cd mcp-devops-workspace
./install.sh
```

Le script :
1. Vérifie Node.js >= 18
2. Détecte les dépendances optionnelles (Docker, systemd, etc.)
3. Installe les dépendances npm
4. Build le projet TypeScript
5. Crée le fichier `.env`
6. Affiche les instructions de configuration pour Claude Code

### Méthode 2 : Installation manuelle

```bash
# Cloner le repo
git clone <votre-repo>/mcp-devops-workspace.git
cd mcp-devops-workspace

# Installer les dépendances
npm install

# Build TypeScript
npm run build

# Créer .env
cp .env.example .env

# (Optionnel) Installer les dépendances système
sudo apt-get install docker.io imagemagick  # Debian/Ubuntu
```

---

## 🔧 Configuration

### 1. Configuration du MCP server

Le fichier `.env` permet de personnaliser le comportement :

```bash
# Chemins autorisés (séparer par virgule)
ALLOWED_PATHS=/home/user/projects,/opt/apps

# Limite de taille fichiers (MB)
MAX_FILE_SIZE_MB=10

# Docker socket
DOCKER_SOCKET=/var/run/docker.sock

# Log level
LOG_LEVEL=info
```

### 2. Configuration Claude Code

Ajoutez cette configuration dans votre fichier Claude Code :

**Fichier** : `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS/Linux)

```json
{
  "mcpServers": {
    "devops-workspace": {
      "command": "node",
      "args": ["/home/user/mcp-devops-workspace/build/index.js"]
    }
  }
}
```

**Windows** : `%APPDATA%\Claude\claude_desktop_config.json`

### 3. Vérification

```bash
# Vérifier que le MCP est détecté
claude mcp list

# Devrait afficher :
# - devops-workspace (50+ tools)
```

---

## 📖 Utilisation

### Exemples de commandes depuis Claude Code

#### 🐍 Créer un projet Python

```
Crée un nouveau projet Python nommé "mon-api" avec virtualenv
```

Claude appellera :
1. `create_project` → structure projet
2. `setup_python_env` → virtualenv + deps
3. `git_init` → initialisation Git

#### 🐳 Gérer Docker

```
Liste tous mes containers Docker et montre-moi les logs du container "web-app"
```

Claude appellera :
1. `docker_list_containers`
2. `docker_container_logs` avec containerId="web-app"

#### 🖥️ Monitorer le système

```
Donne-moi un rapport complet sur l'état de mon serveur : CPU, RAM, disque, processus top
```

Claude appellera :
1. `get_system_info`
2. `get_resource_usage`
3. `get_process_list`

#### 📁 Gestion Git

```
Dans le projet /home/user/mon-projet : fais un git status, puis commit tous les changements avec le message "feat: nouvelle fonctionnalité"
```

Claude appellera :
1. `git_status` → voir les fichiers modifiés
2. `git_add` → stage les fichiers
3. `git_commit` → commit avec message

#### 🎨 Manipulation d'images

```
Redimensionne l'image logo.png en 800x600 et crée aussi une miniature 200x200
```

Claude appellera :
1. `resize_image` → redimension
2. `create_thumbnail` → miniature

---

## 🛠️ Tools disponibles

### 🐍 Dev Env (5 tools)

| Tool | Description |
|------|-------------|
| `create_project` | Crée structure projet (Python/Node/Go/Rust) |
| `setup_python_env` | Configure virtualenv Python |
| `setup_node_env` | Configure environnement Node.js |
| `install_dependencies` | Installe deps depuis requirements.txt/package.json |
| `list_environments` | Liste les venv/node_modules disponibles |

### 🐳 Docker Admin (11 tools)

| Tool | Description |
|------|-------------|
| `docker_list_containers` | Liste containers (running/all) |
| `docker_container_status` | Détails d'un container |
| `docker_container_logs` | Logs container (tail, since) |
| `docker_start_container` | Démarre container |
| `docker_stop_container` | Arrête container |
| `docker_restart_container` | Redémarre container |
| `docker_list_images` | Liste images locales |
| `docker_list_volumes` | Liste volumes |
| `docker_compose_up` | Lance stack Compose |
| `docker_compose_down` | Arrête stack Compose |
| `docker_stats` | Stats temps réel (CPU/RAM) |

### 🖥️ Server Admin (8 tools)

| Tool | Description |
|------|-------------|
| `get_system_info` | Infos système (OS, CPU, RAM, disque) |
| `get_resource_usage` | Utilisation ressources (CPU%, RAM%) |
| `list_services` | Liste services systemd |
| `service_status` | Status d'un service |
| `restart_service` | Redémarre service (avec confirmation) |
| `get_process_list` | Top processes (CPU/RAM) |
| `check_port` | Vérifie si port ouvert |
| `get_gpu_info` | Infos GPU NVIDIA |

### 📁 Project Ops (14 tools)

| Tool | Description |
|------|-------------|
| `list_directory` | Liste contenu dossier |
| `read_file` | Lit fichier texte (max 10MB) |
| `write_file` | Écrit fichier (avec backup) |
| `delete_file` | Supprime fichier (avec confirmation) |
| `git_init` | Initialise dépôt Git |
| `git_status` | Statut Git |
| `git_add` | Stage fichiers |
| `git_commit` | Commit |
| `git_branch` | Liste/crée branches |
| `git_checkout` | Change de branche |
| `git_pull` | Pull depuis remote |
| `git_push` | Push vers remote |
| `git_log` | Historique commits |

### 🎨 Graphics (6 tools)

| Tool | Description |
|------|-------------|
| `resize_image` | Redimensionne image |
| `convert_image` | Convertit format (JPEG/PNG/WebP/AVIF) |
| `compress_image` | Compresse image (qualité) |
| `get_image_info` | Métadonnées image |
| `create_thumbnail` | Crée miniature |
| `compose_images` | Superpose images (watermark) |

**Total : 50+ tools**

---

## 🔒 Sécurité

### Protections implémentées

#### 1. Path Traversal Protection
```typescript
// Vérifie que les paths n'accèdent pas à des zones sensibles
validatePath(userInput) → bloque "..", "/etc/passwd", "/root", etc.
```

#### 2. Confirmation pour actions dangereuses
```typescript
// Actions nécessitant confirm: true
- delete_file
- restart_service
```

#### 3. Validation stricte des inputs
```typescript
// Zod schemas pour tous les tools
CreateProjectSchema.parse(args) → ValidationError si invalide
```

#### 4. Taille fichier limitée
```typescript
// Par défaut 10MB max pour read_file
validateFileSize(path, maxSizeMB: 10)
```

#### 5. Backup automatique
```typescript
// Avant write_file sur fichier existant
createBackup(path) → path.backup-timestamp
```

#### 6. Sanitization
```typescript
sanitizeFileName(name) → supprime caractères dangereux
sanitizeCommand(cmd) → détecte shell injection
```

### Paths protégés

- `/etc/passwd`, `/etc/shadow`, `/etc/sudoers`
- `/root`, `/boot`
- Tout path contenant `..`

---

## 🐛 Dépannage

### Problème : MCP non détecté par Claude Code

**Solution** :
1. Vérifiez le chemin dans `claude_desktop_config.json`
2. Vérifiez que le build existe : `ls build/index.js`
3. Redémarrez Claude Code
4. Logs : vérifier Console Claude Code

### Problème : "Docker non disponible"

**Solution** :
1. Vérifiez Docker : `docker ps`
2. Vérifiez socket : `ls -la /var/run/docker.sock`
3. Permissions : `sudo usermod -aG docker $USER` puis logout/login

### Problème : "systemd non disponible"

**Solution** :
- Normal sur macOS ou containers
- Les tools systemd ne fonctionneront que sur Linux avec systemd

### Problème : "nvidia-smi non trouvé"

**Solution** :
- Normal si pas de GPU NVIDIA
- Le tool `get_gpu_info` retournera `available: false`

### Problème : Erreur "EACCES" lors de write_file

**Solution** :
- Vérifiez les permissions du dossier
- Vérifiez que le path n'est pas protégé

### Problème : Build TypeScript échoue

**Solution** :
```bash
# Nettoyer et rebuilder
rm -rf node_modules build
npm install
npm run build
```

---

## 🔧 Extension

### Ajouter un nouveau tool

#### 1. Définir le schema (`src/types/schemas.ts`)

```typescript
export const MonNouveauToolSchema = z.object({
  param1: z.string(),
  param2: z.number().optional(),
});

export type MonNouveauToolInput = z.infer<typeof MonNouveauToolSchema>;
```

#### 2. Implémenter la fonction (`src/tools/mon-module.ts`)

```typescript
export async function monNouveauTool(input: MonNouveauToolInput) {
  // Logique
  return {
    success: true,
    result: 'ok',
  };
}
```

#### 3. Déclarer le tool (`src/server.ts`)

```typescript
const TOOLS: Tool[] = [
  // ...
  {
    name: 'mon_nouveau_tool',
    description: 'Description pour l\'IA',
    inputSchema: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: '...' },
        param2: { type: 'number', description: '...' },
      },
      required: ['param1'],
    },
  },
];
```

#### 4. Router l'appel (`src/server.ts`)

```typescript
switch (name) {
  // ...
  case 'mon_nouveau_tool':
    result = await monNouveauTool(MonNouveauToolSchema.parse(args));
    break;
}
```

#### 5. Rebuild et tester

```bash
npm run build
node build/index.js  # Tester manuellement
```

### Ajouter un nouveau module

1. Créer `src/tools/mon-nouveau-module.ts`
2. Exporter les fonctions
3. Importer dans `src/server.ts`
4. Ajouter les tools dans `TOOLS[]`
5. Ajouter les cases dans le switch
6. Documenter dans README

---

## 📚 Sources

Documentation et inspiration :

- [Model Context Protocol Official Docs](https://modelcontextprotocol.io/)
- [Claude Code MCP Integration](https://code.claude.com/docs/en/mcp)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Server Examples](https://github.com/modelcontextprotocol/servers)
- [Adding MCP Servers to Claude Code Guide](https://mcpcat.io/guides/adding-an-mcp-server-to-claude-code/)

Bibliothèques utilisées :
- `@modelcontextprotocol/sdk` - SDK MCP officiel
- `dockerode` - API Docker pour Node.js
- `systeminformation` - Métriques système
- `simple-git` - Wrapper Git
- `sharp` - Manipulation d'images
- `zod` - Validation de schemas

---

## 📝 Licence

MIT

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m "feat: ajout de ma feature"`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

---

## 🎉 Remerciements

- L'équipe Anthropic pour le Model Context Protocol
- La communauté open-source pour les bibliothèques utilisées

---

**Développé avec ❤️ pour Claude Code**
