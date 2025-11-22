# 🚀 MCP SysAdmin - Serveur MCP d'Administration Système

Un serveur MCP (Model Context Protocol) complet pour l'administration système Linux, spécialement conçu pour Claude Code CLI.

## 🎯 Vue d'ensemble

MCP SysAdmin est un serveur MCP qui expose **112 outils d'administration système** permettant à Claude d'installer des environnements de développement, administrer des serveurs via Docker, effectuer du traitement graphique, et bien plus encore - comme un véritable administrateur système sous Linux.

## ✨ Fonctionnalités

### 📦 Gestion de Paquets (16 outils)
- **APT** : Installation, recherche, suppression, mise à jour de paquets Debian/Ubuntu
- **NPM** : Gestion de paquets Node.js (global/local/dev)
- **PIP** : Installation de paquets Python (pip3, --user)
- **Cargo** : Installation de crates Rust
- **Go** : Installation de paquets Go
- **Snap** : Gestion de snaps (classic mode)
- **Flatpak** : Installation d'applications Flatpak

### 🐳 Docker (27 outils)
- **Containers** : ps, start, stop, restart, logs, exec, stats, remove, inspect
- **Images** : list, pull, build, rmi, tag
- **Networks** : list, create, remove
- **Volumes** : list, create, remove
- **Docker Compose** : up, down, logs, ps
- **System** : info, df, prune

### 💻 Environnements de Développement (18 outils)
- **Langages** : Node.js (via NVM), Python, Go, Rust, Java, PHP
- **Bases de données** : PostgreSQL, MySQL, MongoDB, Redis
- **Éditeurs** : VSCode, Neovim
- **Outils** : Git, Git LFS, GitHub CLI
- **Virtualisation** : Python venv

### ⚙️ Administration Système (31 outils)
- **Systemd** : status, start, stop, restart, enable, disable, logs
- **Processus** : list, kill, find, top
- **Monitoring** : CPU, RAM, disque, ressources
- **Utilisateurs** : create, delete, add to groups, list
- **Permissions** : chmod, chown
- **Réseau** : interfaces, connections, ping
- **Firewall UFW** : status, allow, deny, enable, disable
- **Logs** : view, journalctl

### 🎨 Graphisme & Multimédia (15 outils)
- **ImageMagick** : convert, resize, crop, rotate, effects, info
- **FFmpeg** : video convert, extract audio, resize, trim, info
- **Terminal** : figlet (ASCII art), qrcode
- **Installation** : imagemagick, ffmpeg, media tools

### 📊 Monitoring Système
- Ressources en temps réel (CPU, RAM, disque)
- Top processus par CPU/mémoire
- Utilisation réseau
- Logs système (journalctl, fichiers de log)
- Docker stats et system df

## 🚀 Installation

### Prérequis
- Node.js 18+ (avec npm)
- Linux (Ubuntu/Debian recommandé)
- Accès sudo pour certaines opérations

### Installation rapide

```bash
# Cloner le dépôt
cd MCP_SysAdmin

# Installer les dépendances
npm install

# Compiler le TypeScript
npm run build

# Tester le serveur
npm run dev
```

### Installation globale

```bash
# Installer globalement
npm install -g .

# Le serveur sera disponible via la commande
mcp-sysadmin
```

## 🔧 Configuration pour Claude Code

### Configuration du fichier `claude_desktop_config.json`

Ajoutez le serveur à votre configuration Claude Code :

```json
{
  "mcpServers": {
    "sysadmin": {
      "command": "node",
      "args": ["/chemin/vers/MCP_SysAdmin/dist/index.js"]
    }
  }
}
```

### Configuration alternative (si installé globalement)

```json
{
  "mcpServers": {
    "sysadmin": {
      "command": "mcp-sysadmin"
    }
  }
}
```

### Configuration pour Claude Code CLI

Si vous utilisez Claude Code CLI, ajoutez à votre `~/.config/claude/config.json` :

```json
{
  "mcp": {
    "servers": {
      "sysadmin": {
        "command": "node",
        "args": ["/chemin/vers/MCP_SysAdmin/dist/index.js"]
      }
    }
  }
}
```

## 📖 Guide d'utilisation

### Exemples de commandes

Une fois le serveur MCP configuré, vous pouvez demander à Claude :

#### Gestion de paquets
```
"Installe Docker et Docker Compose"
→ Utilise apt_install avec packages: ["docker.io", "docker-compose"]

"Recherche des paquets Node.js disponibles"
→ Utilise apt_search avec query: "nodejs"

"Installe Python 3.11 avec pip"
→ Utilise install_python avec version: "3.11"
```

#### Docker
```
"Liste tous les containers Docker"
→ Utilise docker_ps

"Démarre le container nginx"
→ Utilise docker_start avec containers: ["nginx"]

"Affiche les logs du container web"
→ Utilise docker_logs avec container: "web", tail: 100

"Nettoie le système Docker"
→ Utilise docker_system_prune
```

#### Environnements de dev
```
"Installe Node.js version LTS via NVM"
→ Utilise install_node avec version: "lts", useNvm: true

"Installe PostgreSQL et crée un utilisateur"
→ Utilise install_postgres avec createUser: true

"Configure Git avec mes informations"
→ Utilise configure_git avec name et email
```

#### Administration système
```
"Redémarre le service nginx"
→ Utilise systemd_restart avec services: ["nginx"]

"Affiche les ressources système"
→ Utilise system_resources

"Crée un utilisateur devops"
→ Utilise create_user avec username: "devops"

"Ouvre le port 8080 dans le firewall"
→ Utilise ufw_allow avec port: 8080
```

#### Graphisme
```
"Redimensionne l'image photo.jpg à 800x600"
→ Utilise image_resize

"Convertis la vidéo en MP4"
→ Utilise video_convert

"Crée un QR code pour cette URL"
→ Utilise qrcode
```

## 🛠️ Développement

### Structure du projet

```
MCP_SysAdmin/
├── src/
│   ├── index.ts              # Serveur MCP principal
│   ├── utils.ts              # Utilitaires communs
│   └── tools/
│       ├── package-tools.ts  # Outils de gestion de paquets
│       ├── docker-tools.ts   # Outils Docker
│       ├── devenv-tools.ts   # Outils d'environnement de dev
│       ├── system-tools.ts   # Outils système
│       └── media-tools.ts    # Outils graphiques/multimédia
├── dist/                     # Code compilé
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts disponibles

```bash
# Développement avec rechargement auto
npm run dev

# Compiler le TypeScript
npm run build

# Compiler en mode watch
npm run watch

# Démarrer le serveur compilé
npm start
```

## 🔒 Sécurité

### Permissions

Le serveur détecte automatiquement :
- ✅ Si l'utilisateur est root
- 🔐 Si sudo est disponible

Certains outils nécessitent des privilèges sudo :
- Installation de paquets (apt, snap, flatpak)
- Gestion de services systemd
- Modification de permissions/propriétaires
- Configuration réseau et firewall

### Bonnes pratiques

1. **Ne jamais exécuter le serveur en tant que root** (sauf nécessité absolue)
2. **Configurer sudo sans mot de passe** pour les opérations fréquentes (optionnel)
3. **Vérifier les commandes** avant exécution sur des systèmes de production
4. **Limiter l'accès** au serveur MCP aux utilisateurs de confiance

## 📊 Informations système

Au démarrage, le serveur affiche :

```
🚀 MCP SysAdmin Server v1.0.0
================================
📍 Hostname: myserver
🐧 Distro: Ubuntu 24.04.3 LTS
🔧 Kernel: 6.8.0-47-generic
⏱️  Uptime: up 2 days, 5 hours
👤 Root: ❌
🔐 Sudo: ✅
🛠️  112 outils disponibles
================================
```

## 🎯 Cas d'usage

### DevOps & CI/CD
- Installation automatique d'environnements de développement
- Configuration de pipelines Docker
- Déploiement de services
- Monitoring de serveurs

### Administration système
- Gestion de services systemd
- Monitoring des ressources
- Configuration réseau et firewall
- Gestion des utilisateurs et permissions

### Traitement multimédia
- Conversion d'images et vidéos en batch
- Génération de QR codes
- Création d'assets graphiques

### Développement
- Setup rapide d'environnements multi-langages
- Installation de bases de données
- Configuration Git et outils de dev

## 🔍 Diagnostic et dépannage

### Le serveur ne démarre pas

```bash
# Vérifier les dépendances
npm install

# Recompiler
npm run build

# Vérifier la compilation
ls -la dist/
```

### Les outils ne fonctionnent pas

```bash
# Vérifier les permissions sudo
sudo -n true 2>&1

# Vérifier que les commandes nécessaires sont installées
which docker apt systemctl
```

### Logs du serveur

Les logs du serveur sont affichés sur stderr. Pour les capturer :

```bash
node dist/index.js 2> server.log
```

## 📝 Contribuer

Les contributions sont les bienvenues ! Pour ajouter de nouveaux outils :

1. Créer les fonctions dans le fichier approprié dans `src/tools/`
2. Définir les schémas Zod pour la validation
3. Ajouter l'outil à la liste dans `src/index.ts`
4. Compiler et tester

## 📄 Licence

MIT - Voir le fichier LICENSE pour plus de détails

## 👥 Auteur

**Skynet Depot**

Conçu spécifiquement pour Claude Code CLI afin de faciliter l'administration système et le développement sous Linux.

## 🙏 Remerciements

- Anthropic pour le Model Context Protocol
- La communauté open-source pour les outils utilisés

---

**Version:** 1.0.0
**Dernière mise à jour:** 2025-11-22
