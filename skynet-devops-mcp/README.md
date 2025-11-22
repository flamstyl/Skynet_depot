# 🚀 Skynet DevOps MCP

Server MCP tout-en-un pour les opérations DevOps et l'administration système.

## 📋 Fonctionnalités

### 🛠️ Environnements de développement
- `create_project` : Créer un nouveau projet (Python, Node.js, générique)
- `setup_python_env` : Configurer un environnement Python (venv/conda)
- `setup_node_env` : Configurer un environnement Node.js
- `install_dependencies` : Installer les dépendances
- `list_envs` : Lister tous les environnements

### 🐳 Docker
- `list_containers` : Lister les containers
- `container_logs` : Voir les logs d'un container
- `start_container`, `stop_container`, `restart_container` : Contrôler les containers
- `list_images` : Lister les images Docker

### ⚙️ Administration système
- `get_system_info` : Informations système (OS, CPU, uptime)
- `get_resource_usage` : Usage des ressources (CPU, RAM, disque)
- `list_services` : Lister les services systemd
- `service_status` : Statut d'un service
- `restart_service` : Redémarrer un service (avec précautions)

### 📁 Projets et Git
- `list_directory` : Lister un dossier
- `read_file` : Lire un fichier
- `write_file` : Écrire un fichier (avec backup)
- `git_status`, `git_commit`, `git_push` : Opérations Git

### 🎨 Graphisme
- `resize_image` : Redimensionner une image
- `convert_format` : Convertir le format d'une image
- `generate_thumbnail` : Générer une miniature

## 🔧 Installation

```bash
npm install
npm run build
```

## ⚙️ Configuration

Copier `.env.example` vers `.env` et ajuster les variables :

```bash
cp .env.example .env
```

Variables principales :
- `BASE_PROJECTS_PATH` : Chemin de base pour les projets
- `LOG_LEVEL` : Niveau de logging (debug, info, warn, error)
- `ALLOW_DANGEROUS_OPERATIONS` : Autoriser les opérations sensibles

## 🚀 Utilisation

### En standalone
```bash
npm start
```

### Avec Claude Code CLI
```bash
claude mcp add skynet-devops --transport stdio --command 'node /path/to/dist/index.js'
```

## 📚 Exemples

### Créer un projet Python
```json
{
  "name": "create_project",
  "arguments": {
    "name": "mon-projet",
    "type": "python"
  }
}
```

### Lister les containers Docker
```json
{
  "name": "list_containers",
  "arguments": {
    "all": true
  }
}
```

### Voir l'usage des ressources
```json
{
  "name": "get_resource_usage",
  "arguments": {
    "includeProcesses": true,
    "topN": 10
  }
}
```

## 🔒 Sécurité

- Validation stricte des inputs avec Zod
- Protection contre les opérations dangereuses
- Confirmation requise pour redémarrer des services critiques
- Limite de taille pour la lecture de fichiers

## 📝 Licence

MIT
