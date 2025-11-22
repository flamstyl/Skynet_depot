# 🚀 MCP DevOps Workspace

**Serveur MCP (Model Context Protocol) complet pour environnements DevOps, administration système, gestion de projets et graphisme.**

Ce MCP server permet à une IA (comme Claude via Claude Code CLI) de travailler comme un véritable développeur/administrateur Linux, avec accès à :

- ⚙️ **Environnements de développement** (Python, Node.js)
- 🐳 **Administration Docker**
- 🖥️ **Monitoring et gestion système**
- 📁 **Gestion de projets et Git**
- 🎨 **Outils graphiques** (ImageMagick)

---

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Tools disponibles](#tools-disponibles)
- [Exemples](#exemples)
- [Sécurité](#sécurité)
- [Dépannage](#dépannage)
- [Extension](#extension)

---

## 🎯 Prérequis

### Système

- **OS** : Linux (Ubuntu, Debian, Fedora, Arch)
- **Node.js** : >= 18.0.0
- **npm** : >= 9.0.0

### Outils optionnels

- **Docker** : Pour les tools d'administration Docker
- **Git** : Pour les opérations Git (généralement préinstallé)
- **ImageMagick** : Pour les outils graphiques
- **systemd** : Pour la gestion des services (généralement préinstallé)

---

## 📦 Installation

### Installation automatique

```bash
cd mcp-servers/mcp-devops-workspace
chmod +x scripts/install.sh
./scripts/install.sh
```

Le script d'installation :
- ✅ Vérifie Node.js
- ✅ Propose d'installer Docker et ImageMagick
- ✅ Installe les dépendances npm
- ✅ Compile le projet TypeScript
- ✅ Crée le fichier .env
- ✅ Teste le démarrage

### Installation manuelle

```bash
# Installer les dépendances
npm install

# Compiler le projet
npm run build

# Créer la configuration
cp .env.example .env

# Créer le répertoire projets
mkdir -p ~/projects
```

---

## ⚙️ Configuration

### 1. Configuration du MCP Server (.env)

Éditez `.env` pour personnaliser :

```bash
# Chemins autorisés (séparés par :)
ALLOWED_PATHS=/home:/tmp:/var/log

# Répertoire projets par défaut
PROJECTS_DIR=/home/user/projects

# Niveau de log (debug, info, warn, error)
LOG_LEVEL=info

# Activer les tools graphiques
ENABLE_GRAPHICS_TOOLS=true

# Docker socket path
DOCKER_SOCKET=/var/run/docker.sock

# Timeout commandes (ms)
COMMAND_TIMEOUT=30000
```

### 2. Configuration dans Claude Code CLI

Ajoutez le serveur MCP dans `~/.claude.json` :

```json
{
  "mcpServers": {
    "devops-workspace": {
      "command": "node",
      "args": [
        "/home/user/Skynet_depot/mcp-servers/mcp-devops-workspace/dist/index.js"
      ],
      "env": {
        "LOG_LEVEL": "info",
        "PROJECTS_DIR": "/home/user/projects"
      }
    }
  }
}
```

Ou utilisez la commande Claude CLI :

```bash
claude mcp add devops-workspace \
  --command "node" \
  --args "/path/to/dist/index.js" \
  --env "LOG_LEVEL=info"
```

### 3. Vérification

```bash
# Test manuel du serveur
npm start

# Lister les serveurs MCP dans Claude Code
claude mcp list

# Vérifier que devops-workspace est actif
```

---

## 🛠️ Tools disponibles

### Module : dev_env (Environnements de développement)

| Tool | Description |
|------|-------------|
| `create_project` | Crée un nouveau projet (Python/Node/générique) avec structure |
| `setup_python_env` | Crée un environnement virtuel Python (venv) |
| `setup_node_env` | Initialise un projet Node.js |
| `install_dependencies` | Installe les dépendances (requirements.txt, package.json) |
| `list_envs` | Liste tous les environnements de développement |

### Module : docker (Administration Docker)

| Tool | Description |
|------|-------------|
| `list_containers` | Liste les containers Docker |
| `container_logs` | Récupère les logs d'un container |
| `start_container` | Démarre un container |
| `stop_container` | Arrête un container |
| `restart_container` | Redémarre un container |
| `list_images` | Liste les images Docker |

### Module : system (Monitoring système)

| Tool | Description |
|------|-------------|
| `get_system_info` | Informations système (OS, uptime, etc.) |
| `get_resource_usage` | Utilisation CPU, RAM, disque |
| `list_services` | Liste les services systemd |
| `service_status` | Statut détaillé d'un service |
| `restart_service` | Redémarre un service (nécessite sudo) |

### Module : project (Gestion fichiers & Git)

| Tool | Description |
|------|-------------|
| `list_directory` | Liste le contenu d'un dossier |
| `read_file` | Lit un fichier texte |
| `write_file` | Écrit/modifie un fichier (avec backup) |
| `git_init` | Initialise un dépôt Git |
| `git_status` | Affiche le statut Git |
| `git_commit` | Commit des changements |
| `git_push` | Push vers remote |

### Module : graphics (Graphisme)

| Tool | Description |
|------|-------------|
| `resize_image` | Redimensionne une image |
| `convert_format` | Convertit une image (png, jpg, webp, etc.) |
| `generate_thumbnail` | Génère un thumbnail |

---

## 💡 Exemples d'utilisation

### Exemple 1 : Créer un nouveau projet Python complet

```
Humain: "Crée un nouveau projet Python appelé 'my-api' avec Flask"

IA utilise:
1. create_project({name: "my-api", type: "python"})
2. setup_python_env({projectPath: "/home/user/projects/my-api"})
3. write_file({
     filePath: "/home/user/projects/my-api/requirements.txt",
     content: "flask==3.0.0\nrequests==2.31.0"
   })
4. install_dependencies({
     projectPath: "/home/user/projects/my-api",
     projectType: "python"
   })
5. git_init({projectPath: "/home/user/projects/my-api"})
6. git_commit({
     projectPath: "/home/user/projects/my-api",
     message: "Initial commit - Flask API project"
   })

Résultat: Projet Python prêt avec venv, dépendances installées, Git initialisé
```

### Exemple 2 : Health check système complet

```
Humain: "Fais un health check de mon serveur"

IA utilise:
1. get_system_info() → OS, uptime, hostname
2. get_resource_usage({detailed: true}) → CPU 15%, RAM 45%, Disque 60%
3. list_services({state: "failed"}) → aucun service en échec ✓
4. list_containers({all: false}) → 3 containers actifs

Résultat: Rapport complet de santé du système
```

### Exemple 3 : Debugging Docker

```
Humain: "Mon container 'web-app' ne répond pas, aide-moi"

IA utilise:
1. list_containers({filters: {name: "web-app"}})
   → Trouve container ID: abc123, status: running
2. container_logs({containerId: "abc123", tail: 200})
   → Détecte erreur: "Connection refused to database"
3. list_containers({filters: {name: "db"}})
   → Container 'db' est stopped !
4. start_container({containerId: "db-container-id"})
5. restart_container({containerId: "abc123"})

Résultat: Problème identifié et résolu
```

---

## 🔒 Sécurité

### Principes de sécurité implémentés

1. **Whitelist de commandes**
   - Seules les commandes autorisées dans `src/config/commands.ts` peuvent être exécutées
   - Pas d'exécution shell arbitraire

2. **Validation stricte des paths**
   - Protection contre path traversal (`..`, `~`)
   - Chemins limités aux répertoires autorisés (définis dans `.env`)
   - Chemins interdits (blacklist) : `/etc/passwd`, `/root`, etc.

3. **Validation des inputs**
   - Tous les inputs validés via schémas Zod
   - Sanitization des inputs pour éviter injection de commandes

4. **Pas de secrets dans les logs**
   - Filtrage automatique des mots de passe, tokens, API keys
   - Logs sanitisés via `utils/logger.ts`

5. **Confirmation pour actions destructrices**
   - Restart de services nécessite `confirm: true`
   - Backup automatique avant écriture de fichiers

6. **Limites de taille**
   - Fichiers limités à 10 MB
   - Extensions de fichiers validées

### Recommandations

- ⚠️ **Évitez d'exposer le MCP sur Internet** (utilisez localhost uniquement)
- ⚠️ **Exécutez avec un utilisateur non-root** quand possible
- ⚠️ **Vérifiez les permissions Docker** (groupe docker)
- ⚠️ **Auditez les logs régulièrement**

---

## 🐛 Dépannage

### Problème : "Docker daemon is not running"

```bash
# Démarrer Docker
sudo systemctl start docker

# Vérifier le statut
sudo systemctl status docker

# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker  # ou se reconnecter
```

### Problème : "Path not in allowed directories"

Éditez `.env` et ajoutez le chemin à `ALLOWED_PATHS` :

```bash
ALLOWED_PATHS=/home:/tmp:/var/log:/opt/myapp
```

### Problème : "ImageMagick not found"

```bash
# Ubuntu/Debian
sudo apt-get install imagemagick

# Fedora
sudo dnf install ImageMagick

# Arch
sudo pacman -S imagemagick
```

### Problème : Logs trop verbeux

Changez le niveau de log dans `.env` :

```bash
LOG_LEVEL=warn  # ou error
```

### Problème : Timeout sur commandes lentes

Augmentez le timeout dans `.env` :

```bash
COMMAND_TIMEOUT=60000  # 60 secondes
```

---

## 🔧 Extension

### Ajouter un nouveau tool

1. **Créer le fichier du tool** :

```typescript
// src/tools/my-module/my-tool.ts

import { z } from "zod";

const MyToolInputSchema = z.object({
  param1: z.string(),
  param2: z.number().optional(),
});

const MyToolOutputSchema = z.object({
  success: z.boolean(),
  result: z.string(),
});

export async function myTool(input: unknown) {
  const params = MyToolInputSchema.parse(input);

  // Votre logique ici

  return MyToolOutputSchema.parse({
    success: true,
    result: "Done!",
  });
}

export const myToolDefinition = {
  name: "my_tool",
  description: "Description de mon tool",
  inputSchema: MyToolInputSchema,
  outputSchema: MyToolOutputSchema,
  handler: myTool,
};
```

2. **Enregistrer le tool** dans `src/server.ts` :

```typescript
import { myToolDefinition } from "./tools/my-module/my-tool.js";

const tools = [
  // ... tools existants
  myToolDefinition,
];
```

3. **Rebuild** :

```bash
npm run build
```

### Ajouter un nouveau module

1. Créer le dossier : `src/tools/my-module/`
2. Créer un service si nécessaire : `src/services/my-service.ts`
3. Créer les tools du module
4. Enregistrer dans `src/server.ts`
5. Documenter dans `README.md`

---

## 📄 Licence

MIT

---

## 🙏 Contribution

Les contributions sont bienvenues ! Pour ajouter des fonctionnalités :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committez (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Push (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

---

## 📞 Support

Pour toute question ou problème :

- Ouvrir une issue sur GitHub
- Consulter la documentation complète dans `/docs`

---

**Fait avec ❤️ pour Claude Code CLI**
