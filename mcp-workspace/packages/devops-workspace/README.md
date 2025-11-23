# 🛠️ MCP DevOps Workspace

> **MCP Server** pour Claude Code : Administration système, Docker, Git, et outils graphiques

## 📋 Vue d'ensemble

Ce MCP Server fournit un ensemble complet d'outils pour transformer Claude en un véritable assistant DevOps/Admin Linux. Il permet de :

- 🔧 **dev_env** : Gérer des environnements de développement (Python, Node.js)
- 🐳 **docker_admin** : Administrer Docker (containers, images, compose)
- ⚙️ **server_admin** : Monitorer le système (CPU, RAM, services systemd)
- 📁 **project_ops** : Manipuler fichiers et gérer Git
- 🎨 **graphics_tools** : Traiter des images (ImageMagick)

**Total : 40+ tools MCP disponibles**

## 🎯 Prérequis

### Système
- **OS** : Linux (Ubuntu/Debian recommandé)
- **Node.js** : ≥ 18.0.0
- **npm** : ≥ 9.0.0

### Outils optionnels
- **Docker** : pour les tools `docker_admin/*`
- **systemd** : pour les tools `server_admin/service_*`
- **ImageMagick** : pour les tools `graphics_tools/*`
  ```bash
  sudo apt install imagemagick
  ```

## 🚀 Installation

### 1. Depuis le monorepo

```bash
cd mcp-workspace
npm install
npm run build -w packages/devops-workspace
```

### 2. Installation globale (alternative)

```bash
cd packages/devops-workspace
npm install
npm run build
npm link
```

### 3. Configuration pour Claude Code

Ajoute dans `~/.claude.json` :

```json
{
  "mcpServers": {
    "devops-workspace": {
      "command": "node",
      "args": ["/chemin/vers/mcp-workspace/packages/devops-workspace/dist/index.js"],
      "type": "stdio",
      "env": {
        "LOG_LEVEL": "info",
        "WORKSPACE_ROOT": "/home/user/projects"
      }
    }
  }
}
```

Ou via CLI :

```bash
claude mcp add devops-workspace --scope local
```

## 📦 Tools disponibles

### 🔧 dev_env (6 tools)

| Tool | Description |
|------|-------------|
| `create_project` | Crée une structure de projet (Python/Node/Go/Rust) |
| `setup_python_env` | Crée un environnement virtuel Python |
| `setup_node_env` | Initialise un environnement Node.js |
| `install_dependencies` | Installe les dépendances |
| `list_envs` | Liste les environnements trouvés |

### 🐳 docker_admin (10 tools)

| Tool | Description |
|------|-------------|
| `list_containers` | Liste les containers |
| `container_logs` | Logs d'un container |
| `start_container` | Démarre un container |
| `stop_container` | Arrête un container |
| `restart_container` | Redémarre un container |
| `list_images` | Liste les images Docker |
| `container_stats` | Statistiques ressources |
| `inspect_container` | Détails complets |
| `docker_compose_up` | Lance une stack Compose |
| `docker_compose_down` | Arrête une stack Compose |

### ⚙️ server_admin (9 tools)

| Tool | Description |
|------|-------------|
| `get_system_info` | Infos système (OS, CPU, RAM) |
| `get_resource_usage` | Usage actuel (CPU%, RAM%, Disk) |
| `list_services` | Liste services systemd |
| `service_status` | Status d'un service |
| `start_service` | Démarre un service |
| `stop_service` | Arrête un service |
| `restart_service` | Redémarre un service |
| `get_process_info` | Top processus par CPU |
| `check_port` | Vérifie si un port est ouvert |

### 📁 project_ops (10 tools)

| Tool | Description |
|------|-------------|
| `list_directory` | Liste contenu d'un dossier |
| `read_file_safe` | Lit un fichier |
| `write_file_safe` | Écrit dans un fichier (avec backup) |
| `git_init` | Initialise un dépôt Git |
| `git_status` | Status Git |
| `git_add` | Stage des fichiers |
| `git_commit` | Commit |
| `git_push` | Push vers remote |
| `git_pull` | Pull depuis remote |
| `git_log` | Historique des commits |

### 🎨 graphics_tools (5 tools)

| Tool | Description |
|------|-------------|
| `image_info` | Métadonnées d'une image |
| `resize_image` | Redimensionne une image |
| `convert_format` | Convertit le format |
| `generate_thumbnail` | Crée une miniature |
| `optimize_image` | Optimise/compresse |

## 🔒 Sécurité

### Validation stricte
- ✅ Paths : empêche traversal directory (`../`)
- ✅ Noms : validation regex (containers, services)
- ✅ Commandes : whitelist, détection d'injection

### Confirmation requise
Par défaut, les actions dangereuses demandent `confirm: true` :
- `stop_service`
- `restart_service`
- `docker_compose_down` (avec volumes)

### Rate limiting
- 60 appels/minute par tool (configurable)

### Logs
- Stockés dans `/tmp/mcp-devops-workspace.log`
- Pas de contenu sensible (tokens/passwords masqués)

## 💡 Exemples d'utilisation

### Créer un nouveau projet Python

```
User → AI : "Crée-moi un nouveau projet Python appelé 'my-api'"
AI → create_project(name="my-api", type="python")
AI → setup_python_env(projectPath="/home/user/projects/my-api")
AI → User : "Projet créé ! Environnement virtuel prêt."
```

### Monitorer un serveur

```
User → AI : "Vérifie la santé de mon serveur"
AI → get_system_info()
AI → get_resource_usage()
AI → list_services(filter="nginx")
AI → User : "Serveur OK. CPU: 25%, RAM: 60%, nginx actif."
```

### Gérer Docker

```
User → AI : "Liste mes containers et redémarre celui qui s'appelle 'app'"
AI → list_containers(all=true)
AI → restart_container(container="app")
AI → User : "Container 'app' redémarré avec succès."
```

## 🧪 Tests

```bash
npm run test
npm run test:watch
```

## 🐛 Dépannage

### Erreur : "Docker socket not found"
→ Vérifie que Docker est installé et que `/var/run/docker.sock` existe
→ Ajoute l'utilisateur au groupe `docker` : `sudo usermod -aG docker $USER`

### Erreur : "ImageMagick non disponible"
→ Installe : `sudo apt install imagemagick`

### Erreur : "systemctl command not found"
→ systemd non disponible (peut arriver dans un container)

## 📄 Licence

MIT

---

**Développé pour Claude Code** 🚀
