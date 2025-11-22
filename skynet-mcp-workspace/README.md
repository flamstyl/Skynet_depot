# 🚀 Skynet MCP Workspace

**Serveur MCP complet pour environnement DevOps + Graphics**
Workspace AI ultime pour Claude Code CLI

---

## 📖 Vue d'ensemble

Skynet MCP Workspace est un **serveur Model Context Protocol (MCP)** qui transforme Claude Code en un véritable poste de travail DevOps et créatif. Il expose **36 tools** répartis en **5 modules** :

### 🧩 Modules

| Module | Description | Tools |
|--------|-------------|-------|
| **dev_env** | Gestion environnements de développement (Python, Node.js) | 4 tools |
| **docker_admin** | Administration Docker (containers, images, stats) | 10 tools |
| **server_admin** | Monitoring système, services systemd, health checks | 5 tools |
| **project_ops** | Gestion fichiers, dossiers, Git | 11 tools |
| **graphics_tools** | Manipulation d'images (resize, convert, filters) | 6 tools |

**Total : 36 tools MCP**

---

## ⚙️ Architecture

```
skynet-mcp-workspace/
├── src/
│   ├── dev_env/          # Environnements dev (Python, Node)
│   ├── docker_admin/     # Admin Docker via Dockerode
│   ├── server_admin/     # Monitoring système (systeminformation)
│   ├── project_ops/      # Fichiers + Git (simple-git)
│   ├── graphics_tools/   # Manipulation images (sharp)
│   ├── utils/            # Logger, executor, types
│   ├── server.ts         # Serveur MCP principal
│   └── index.ts          # Point d'entrée
├── config/
│   └── claude-mcp-config.json  # Config Claude Code
├── scripts/
│   └── install.sh        # Script d'installation
├── tests/                # Tests (Vitest)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📋 Prérequis

### Système

- **OS** : Linux (Ubuntu/Debian compatible)
- **Node.js** : >= 18.0.0
- **npm** : >= 9.0.0

### Outils optionnels (selon modules utilisés)

- **Docker** : pour `docker_admin`
- **Git** : pour `project_ops`
- **Python 3** : pour `dev_env` (création projets Python)
- **systemd** : pour `server_admin` (gestion services)

---

## 🛠️ Installation

### Méthode 1 : Script automatique (recommandé)

```bash
cd skynet-mcp-workspace
chmod +x scripts/install.sh
./scripts/install.sh
```

Le script :
- ✅ Vérifie Node.js >= 18
- ✅ Installe les dépendances npm
- ✅ Compile TypeScript
- ✅ Vérifie les outils optionnels (Docker, Git, Python)
- ✅ Configure les permissions
- ✅ Affiche les instructions de configuration Claude Code

### Méthode 2 : Manuelle

```bash
# Installation des dépendances
npm install

# Compilation TypeScript
npm run build

# Vérification
node dist/index.js --help
```

---

## ⚙️ Configuration

### Configuration Claude Code

**Option A : CLI (recommandé)**

```bash
claude mcp add-json --file ./config/claude-mcp-config.json
```

**Option B : Manuelle**

Ajoutez dans `~/.claude.json` :

```json
{
  "mcpServers": {
    "skynet-workspace": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/home/user/Skynet_depot/skynet-mcp-workspace/dist/index.js"
      ],
      "env": {
        "DEBUG": "false"
      }
    }
  }
}
```

**Remplacez le chemin par votre installation.**

### Redémarrer Claude Code

```bash
# Vérifier la configuration
claude mcp list

# Redémarrer (si nécessaire)
claude restart
```

### Vérification

Dans Claude Code :

```
/mcp
```

Vous devriez voir **skynet-workspace** avec **36 tools** disponibles.

---

## 🎯 Utilisation

### Exemples par module

#### 📦 dev_env - Environnements de développement

```
Crée-moi un nouveau projet Python nommé "mon-api"

→ Utilise create_project
→ Utilise setup_python_env pour créer le venv
→ Utilise install_dependencies pour installer requirements.txt
```

#### 🐳 docker_admin - Docker

```
Liste-moi tous les containers Docker en cours

→ Utilise list_containers

Montre-moi les logs du container "nginx"

→ Utilise container_logs

Redémarre le container "postgres"

→ Utilise restart_container
```

#### ⚙️ server_admin - Système

```
Quel est l'état du serveur ?

→ Utilise get_resource_usage pour CPU/RAM/Disk
→ Utilise get_system_info pour infos détaillées

Redémarre le service nginx

→ Utilise service_action avec action=restart
```

#### 📁 project_ops - Fichiers et Git

```
Initialise un dépôt Git dans mon projet

→ Utilise git_init
→ Utilise git_add avec files=["."]
→ Utilise git_commit

Liste les fichiers du dossier /home/user/projects

→ Utilise list_files
```

#### 🎨 graphics_tools - Images

```
Redimensionne l'image logo.png en 500x500

→ Utilise resize_image

Convertis toutes mes images en WebP

→ Utilise convert_format avec format=webp

Génère une thumbnail de 200px

→ Utilise generate_thumbnail
```

---

## 🔧 Développement

### Structure de code

Chaque module expose ses tools via :

```typescript
export const moduleTools = {
  tool_name: {
    description: "Description du tool",
    inputSchema: ZodSchema,
    handler: async (args) => Promise<ToolResult>
  }
};
```

### Ajouter un nouveau tool

1. Créer le schéma Zod dans le module concerné
2. Implémenter la fonction handler
3. Ajouter l'export dans `moduleTools`
4. Le serveur MCP l'expose automatiquement

### Tests

```bash
# Lancer les tests
npm test

# Coverage
npm run test:coverage

# Mode watch
npm run test:watch
```

### Debugging

```bash
# Mode debug
DEBUG=true npm start

# Avec MCP Inspector
npm run inspector
```

---

## 📊 Liste complète des Tools

### dev_env (4 tools)

| Tool | Description |
|------|-------------|
| `create_project` | Crée un projet (Python/Node/Generic) |
| `setup_python_env` | Configure environnement virtuel Python |
| `install_dependencies` | Installe dépendances (pip/npm) |
| `list_envs` | Liste environnements disponibles |

### docker_admin (10 tools)

| Tool | Description |
|------|-------------|
| `list_containers` | Liste containers Docker |
| `start_container` | Démarre un container |
| `stop_container` | Arrête un container |
| `restart_container` | Redémarre un container |
| `remove_container` | Supprime un container |
| `container_logs` | Récupère les logs |
| `container_stats` | Stats CPU/RAM container |
| `list_images` | Liste images Docker |
| `pull_image` | Pull une image Docker |
| `create_container` | Crée un nouveau container |

### server_admin (5 tools)

| Tool | Description |
|------|-------------|
| `get_system_info` | Infos système (OS, CPU, RAM) |
| `get_resource_usage` | Utilisation ressources temps réel |
| `list_services` | Liste services systemd |
| `service_action` | Action sur service (start/stop/restart) |
| `get_processes` | Top processus CPU/RAM |

### project_ops (11 tools)

| Tool | Description |
|------|-------------|
| `list_files` | Liste fichiers d'un dossier |
| `read_file` | Lit un fichier texte |
| `write_file` | Écrit dans un fichier |
| `delete_path` | Supprime fichier/dossier |
| `git_init` | Initialise dépôt Git |
| `git_status` | Status Git |
| `git_add` | Ajoute au staging |
| `git_commit` | Crée un commit |
| `git_push` | Push vers remote |
| `git_pull` | Pull depuis remote |
| `git_branch` | Gestion branches (list/create/delete/checkout) |

### graphics_tools (6 tools)

| Tool | Description |
|------|-------------|
| `resize_image` | Redimensionne une image |
| `convert_format` | Convertit format (jpeg/png/webp/avif) |
| `generate_thumbnail` | Génère miniature |
| `compose_images` | Superpose deux images |
| `image_info` | Métadonnées image |
| `apply_filter` | Applique filtre (grayscale/blur/sepia) |

---

## 🔒 Sécurité

### Mesures implémentées

- ✅ **Validation stricte** : Tous les arguments validés via Zod
- ✅ **Commandes interdites** : Liste noire (rm -rf /, dd, mkfs, fork bomb)
- ✅ **Timeouts** : Limite d'exécution par défaut (30s-120s selon tool)
- ✅ **Sandbox** : Interdiction suppression racine/home
- ✅ **Backup** : Sauvegarde auto avant écriture fichier
- ✅ **Logs audit** : Toutes les actions loggées

### Permissions nécessaires

- **Docker** : Accès au socket `/var/run/docker.sock` (ajouter utilisateur au groupe `docker`)
- **systemd** : Opérations start/stop/restart nécessitent `sudo`
- **Fichiers** : Permissions standard utilisateur

---

## 🐛 Dépannage

### Erreur "Docker socket non disponible"

```bash
# Ajouter utilisateur au groupe docker
sudo usermod -aG docker $USER

# Redémarrer session ou :
newgrp docker
```

### Erreur "systemd non trouvé"

Système non compatible systemd (ex: containers). Module `server_admin` partiellement fonctionnel.

### Erreur "Sharp installation failed"

```bash
# Réinstaller Sharp avec natives
npm rebuild sharp

# Ou forcer platform
npm install --platform=linux --arch=x64 sharp
```

### MCP Server non détecté dans Claude Code

```bash
# Vérifier config
cat ~/.claude.json

# Tester manuellement
node dist/index.js

# Logs Claude Code
tail -f ~/.claude/logs/mcp.log
```

---

## 🚀 Extension & Roadmap

### V2 - Améliorations prévues

- [ ] Support **Kubernetes** (kubectl tools)
- [ ] Support **n8n API** (gestion workflows)
- [ ] Support **Oracle Cloud** (compute instances)
- [ ] Support **Terraform** (infrastructure as code)
- [ ] Support **Ansible** (automation)
- [ ] Monitoring **Prometheus/Grafana**
- [ ] CI/CD pipelines (GitHub Actions, GitLab CI)
- [ ] GPU monitoring (nvidia-smi intégration)

### Ajouter un nouveau module

1. Créer `src/nouveau_module/index.ts`
2. Définir les tools et schémas Zod
3. Exporter `nouveauModuleTools`
4. Importer dans `src/server.ts`
5. Ajouter à `ALL_TOOLS`

---

## 📜 License

MIT License - Skynet Project

---

## 🙏 Remerciements

- **Anthropic** : Model Context Protocol & Claude
- **MCP SDK** : TypeScript SDK officiel
- **Communauté Open Source** : Dockerode, Sharp, simple-git, systeminformation

---

## 📞 Support

- 📖 Documentation : Ce README
- 🐛 Issues : [GitHub Issues](https://github.com/skynet/mcp-workspace/issues)
- 💬 Discussions : [GitHub Discussions](https://github.com/skynet/mcp-workspace/discussions)

---

**Créé avec ❤️ par Skynet Project pour la communauté IA**

**Bon dev ! 🚀**
