# 📖 Guide d'utilisation

## Vue d'ensemble

Les Skynet MCP Servers exposent **31 tools** au total pour automatiser vos workflows DevOps et gérer votre mémoire distribuée.

## 🛠️ Module Dev Env (5 tools)

### Créer un nouveau projet

```typescript
// Projet Python
{
  "name": "create_project",
  "arguments": {
    "name": "mon-super-projet",
    "type": "python"
  }
}

// Projet Node.js
{
  "name": "create_project",
  "arguments": {
    "name": "mon-app-web",
    "type": "node",
    "path": "/home/user/workspace"
  }
}
```

### Configurer un environnement Python

```typescript
{
  "name": "setup_python_env",
  "arguments": {
    "projectPath": "/home/user/projects/mon-projet",
    "pythonVersion": "python3.11"
  }
}
```

### Installer des dépendances

```typescript
// Python
{
  "name": "install_dependencies",
  "arguments": {
    "projectPath": "/home/user/projects/mon-projet",
    "type": "python",
    "dev": true
  }
}

// Node.js
{
  "name": "install_dependencies",
  "arguments": {
    "projectPath": "/home/user/projects/mon-app",
    "type": "node"
  }
}
```

## 🐳 Module Docker (6 tools)

### Lister les containers

```typescript
// Tous les containers (y compris arrêtés)
{
  "name": "list_containers",
  "arguments": {
    "all": true
  }
}

// Filtrer par nom
{
  "name": "list_containers",
  "arguments": {
    "filters": {
      "name": "postgres",
      "status": "running"
    }
  }
}
```

### Voir les logs d'un container

```typescript
{
  "name": "container_logs",
  "arguments": {
    "containerId": "abc123",
    "tail": 50,
    "timestamps": true
  }
}
```

### Contrôler les containers

```typescript
// Démarrer
{
  "name": "start_container",
  "arguments": {
    "containerId": "abc123"
  }
}

// Arrêter
{
  "name": "stop_container",
  "arguments": {
    "containerId": "abc123",
    "timeout": 10
  }
}

// Redémarrer
{
  "name": "restart_container",
  "arguments": {
    "containerId": "abc123"
  }
}
```

## ⚙️ Module System Admin (5 tools)

### Infos système

```typescript
{
  "name": "get_system_info",
  "arguments": {}
}
```

Retourne :
- OS, distribution, version
- CPU, cores, vitesse
- Hostname, uptime

### Usage des ressources

```typescript
{
  "name": "get_resource_usage",
  "arguments": {
    "includeProcesses": true,
    "topN": 10
  }
}
```

Retourne :
- CPU usage + load average
- Mémoire totale/utilisée/libre
- Disques et leur usage
- Top 10 des processus gourmands

### Gérer les services systemd

```typescript
// Lister les services
{
  "name": "list_services",
  "arguments": {
    "filter": "running",
    "pattern": "nginx|apache"
  }
}

// Statut d'un service
{
  "name": "service_status",
  "arguments": {
    "serviceName": "nginx"
  }
}

// Redémarrer un service (avec sudo)
{
  "name": "restart_service",
  "arguments": {
    "serviceName": "nginx",
    "sudo": true
  }
}
```

## 📁 Module Project Ops (6 tools)

### Manipuler des fichiers

```typescript
// Lister un dossier
{
  "name": "list_directory",
  "arguments": {
    "path": "/home/user/projects",
    "recursive": true,
    "includeHidden": false,
    "pattern": "*.py"
  }
}

// Lire un fichier
{
  "name": "read_file",
  "arguments": {
    "filePath": "/home/user/config.json",
    "encoding": "utf-8"
  }
}

// Écrire un fichier (avec backup)
{
  "name": "write_file",
  "arguments": {
    "filePath": "/home/user/notes.md",
    "content": "# Notes\n\nContenu...",
    "backup": true,
    "createDirs": true
  }
}
```

### Opérations Git

```typescript
// Statut Git
{
  "name": "git_status",
  "arguments": {
    "repositoryPath": "/home/user/mon-projet"
  }
}

// Créer un commit
{
  "name": "git_commit",
  "arguments": {
    "repositoryPath": "/home/user/mon-projet",
    "message": "feat: Ajout nouvelle fonctionnalité",
    "files": ["src/main.py"],
    "author": {
      "name": "Claude",
      "email": "claude@skynet.ai"
    }
  }
}

// Push
{
  "name": "git_push",
  "arguments": {
    "repositoryPath": "/home/user/mon-projet",
    "remote": "origin",
    "branch": "main"
  }
}
```

## 🎨 Module Graphics (3 tools)

### Redimensionner une image

```typescript
{
  "name": "resize_image",
  "arguments": {
    "inputPath": "/home/user/photo.jpg",
    "width": 800,
    "height": 600,
    "fit": "cover",
    "quality": 85
  }
}
```

### Convertir le format

```typescript
{
  "name": "convert_format",
  "arguments": {
    "inputPath": "/home/user/image.png",
    "outputFormat": "webp",
    "quality": 90
  }
}
```

### Générer une thumbnail

```typescript
{
  "name": "generate_thumbnail",
  "arguments": {
    "inputPath": "/home/user/photo.jpg",
    "size": 256,
    "format": "jpeg"
  }
}
```

## 🧠 Module Google Drive Memory + RAG (4 tools)

### Lister les fichiers Drive

```typescript
{
  "name": "list_files",
  "arguments": {
    "path": "Skynet_Memory",
    "mimeType": "text/plain",
    "maxResults": 50
  }
}
```

### Lire depuis la mémoire Drive

```typescript
{
  "name": "read_memory",
  "arguments": {
    "path": "Skynet_Memory/notes_2025.md",
    "convertFormat": true
  }
}

// Lire plusieurs fichiers avec pattern
{
  "name": "read_memory",
  "arguments": {
    "path": "Skynet_Memory",
    "match": "*.md"
  }
}
```

### Écrire dans la mémoire Drive

```typescript
// Créer/écraser
{
  "name": "write_memory",
  "arguments": {
    "path": "Skynet_Memory/journal_2025-11-22.md",
    "content": "# Journal du 22 novembre\n\nAujourd'hui...",
    "createPath": true
  }
}

// Ajouter à la fin (append)
{
  "name": "write_memory",
  "arguments": {
    "path": "Skynet_Memory/log.txt",
    "content": "[2025-11-22] Nouvelle entrée\n",
    "append": true
  }
}
```

### Recherche RAG (sémantique)

```typescript
{
  "name": "query_rag",
  "arguments": {
    "query": "Comment installer et configurer n8n avec Docker ?",
    "topK": 5,
    "threshold": 0.7,
    "path": "Skynet_Memory"
  }
}
```

Retourne :
- Les fichiers les plus pertinents
- Score de similarité
- Snippets extraits
- Métadonnées (taille, date, type)

## 🔄 Workflows complets

### Workflow 1 : Nouveau projet Python

```typescript
// 1. Créer le projet
{ "name": "create_project", "arguments": { "name": "ml-project", "type": "python" } }

// 2. Configurer l'environnement
{ "name": "setup_python_env", "arguments": { "projectPath": "/home/user/projects/ml-project" } }

// 3. Écrire requirements.txt
{ "name": "write_file", "arguments": {
  "filePath": "/home/user/projects/ml-project/requirements.txt",
  "content": "numpy\npandas\nscikit-learn"
}}

// 4. Installer les dépendances
{ "name": "install_dependencies", "arguments": {
  "projectPath": "/home/user/projects/ml-project",
  "type": "python"
}}

// 5. Commit initial
{ "name": "git_commit", "arguments": {
  "repositoryPath": "/home/user/projects/ml-project",
  "message": "Initial commit"
}}
```

### Workflow 2 : Monitoring système + journalisation

```typescript
// 1. Récupérer l'état système
{ "name": "get_resource_usage", "arguments": { "includeProcesses": true } }

// 2. Écrire dans Drive pour historique
{ "name": "write_memory", "arguments": {
  "path": "Skynet_Logs/system_health_2025-11-22.json",
  "content": "<JSON des ressources>"
}}

// 3. Si problème, chercher dans la mémoire
{ "name": "query_rag", "arguments": {
  "query": "haute utilisation CPU nginx",
  "topK": 3
}}
```

## 💡 Bonnes pratiques

### Sécurité
- ✅ Toujours vérifier avant de redémarrer des services critiques
- ✅ Utiliser `backup: true` avant d'écrire dans un fichier existant
- ✅ Limiter `maxResults` pour éviter de surcharger

### Performance
- ✅ Activer le cache des embeddings (`CACHE_EMBEDDINGS=true`)
- ✅ Utiliser des patterns précis pour filtrer les fichiers
- ✅ Limiter `topK` dans le RAG (3-5 suffit généralement)

### Organisation
- ✅ Structure de dossiers claire dans Google Drive
- ✅ Nommer les fichiers de manière descriptive
- ✅ Utiliser des tags/préfixes pour catégoriser

## 🆘 Besoin d'aide ?

→ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) pour résoudre les problèmes courants
