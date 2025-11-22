# 🚀 Écosystème Skynet MCP - Documentation Globale

**Un ensemble complet de serveurs MCP pour transformer Claude Code CLI en véritable poste de travail DevOps + Créatif**

Version : 1.0.0
Date : 2025-11-22
Auteur : Skynet Depot

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture globale](#architecture-globale)
3. [Les 4 serveurs MCP](#les-4-serveurs-mcp)
4. [Installation complète](#installation-complète)
5. [Configuration Claude Code](#configuration-claude-code)
6. [Cas d'usage concrets](#cas-dusage-concrets)
7. [Workflow recommandés](#workflow-recommandés)
8. [Dépannage](#dépannage)
9. [Roadmap & Améliorations](#roadmap--améliorations)

---

## 🎯 Vue d'ensemble

L'écosystème Skynet MCP transforme Claude Code CLI en un **véritable environnement de travail autonome** avec 4 serveurs MCP complémentaires :

### 📊 Statistiques

- **4 serveurs MCP** indépendants et modulaires
- **143 outils MCP** au total
- **TypeScript + Node.js** pour cohérence et performance
- **100% open-source** sous licence MIT

### 🎯 Objectif

Permettre à Claude (via Claude Code CLI) de :
- ✅ Administrer des serveurs Linux complets
- ✅ Surveiller le système de fichiers en temps réel
- ✅ Gérer des projets Git avec workflow avancé
- ✅ Traiter des images et créer du contenu graphique
- ✅ Installer et configurer des environnements de dev
- ✅ Automatiser des tâches DevOps complètes

---

## 🏗️ Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                   CLAUDE CODE CLI                       │
│          (Interface utilisateur principale)             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ MCP Protocol (stdio)
                       │
       ┌───────────────┼───────────────┬─────────────┐
       │               │               │             │
       ▼               ▼               ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ MCP         │ │ Skynet      │ │ Skynet      │ │ Skynet      │
│ SysAdmin    │ │ FileWatcher │ │ Project     │ │ Creative    │
│             │ │             │ │             │ │             │
│ 112 tools   │ │ 10 tools    │ │ 14 tools    │ │ 7 tools     │
│             │ │             │ │             │ │             │
│ • Paquets   │ │ • Watch     │ │ • Git adv   │ │ • Images    │
│ • Docker    │ │ • Events    │ │ • GitHub    │ │ • Resize    │
│ • DevEnv    │ │ • Logs      │ │ • Scaffold  │ │ • Convert   │
│ • System    │ │ • Hash      │ │ • Remote    │ │ • Watermark │
│ • Media     │ │ • Stats     │ │ • Stash     │ │ • Compose   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### 📦 Principe de modularité

Chaque serveur MCP est **indépendant** :
- Peut être utilisé seul ou en combinaison
- A sa propre configuration
- Peut être démarré/arrêté indépendamment
- Partage les mêmes bonnes pratiques (TypeScript, Zod, stdio)

---

## 🛠️ Les 4 serveurs MCP

### 1️⃣ MCP SysAdmin (Existant)

**Objectif** : Administration système Linux complète

**Localisation** : `/MCP_SysAdmin/`

**112 outils** répartis en :
- 📦 **Gestion de paquets** (16) : APT, NPM, PIP, Cargo, Go, Snap, Flatpak
- 🐳 **Docker** (27) : containers, images, networks, volumes, compose
- 💻 **Environnements de dev** (18) : Node, Python, Go, Rust, Java, PostgreSQL, MySQL, MongoDB
- ⚙️ **Administration système** (31) : systemd, processus, monitoring, utilisateurs, firewall
- 🎨 **Graphisme de base** (15) : ImageMagick, FFmpeg, figlet, qrcode

**Status** : ✅ Déjà implémenté et fonctionnel

---

### 2️⃣ Skynet FileWatcher MCP (Nouveau)

**Objectif** : Surveillance en temps réel de fichiers et dossiers

**Localisation** : `/skynet-filewatcher-mcp/`

**10 outils** :

#### Watcher Management
- `start_watching` - Démarre la surveillance d'un dossier
- `stop_watching` - Arrête un watcher
- `list_watchers` - Liste les watchers actifs
- `get_watcher` - Détails d'un watcher
- `update_watcher` - Met à jour la config

#### Events Management
- `get_events` - Récupère les événements avec filtres
- `get_event_stats` - Statistiques d'événements
- `export_events` - Exporte (JSON, JSONL, CSV)
- `clear_events` - Nettoie les événements
- `get_file_hash` - Calcule le hash d'un fichier

**Features clés** :
- ✅ Détection temps réel (chokidar)
- ✅ Logs JSON structurés (JSONL)
- ✅ Hash SHA256/SHA1/MD5
- ✅ Patterns d'exclusion (node_modules, .git)
- ✅ Statistiques et analytics

**Status** : ✅ Implémenté dans cette session

---

### 3️⃣ Skynet Project MCP (Nouveau)

**Objectif** : Git workflow avancé et gestion de projets

**Localisation** : `/skynet-project-mcp/`

**14 outils Git** :
- `git_init` - Initialiser un dépôt
- `git_status` - Status détaillé
- `git_add` - Ajouter des fichiers
- `git_commit` - Créer un commit
- `git_branch_list` - Lister les branches
- `git_branch_create` - Créer une branche
- `git_checkout` - Changer de branche
- `git_merge` - Merger des branches
- `git_pull` - Pull depuis remote
- `git_push` - Push vers remote
- `git_add_remote` - Ajouter un remote
- `git_log` - Historique des commits
- `git_diff` - Voir les différences
- `git_stash` - Stash push/pop/list

**Features clés** :
- ✅ Wrapper simple-git robuste
- ✅ Support complet Git workflow
- ✅ Gestion des remotes
- ✅ Branch management avancé

**Status** : ✅ Implémenté dans cette session

---

### 4️⃣ Skynet Creative MCP (Nouveau)

**Objectif** : Traitement d'images avancé

**Localisation** : `/skynet-creative-mcp/`

**7 outils** :
- `image_resize` - Redimensionner (width, height, fit)
- `image_convert` - Convertir format (JPEG, PNG, WebP, AVIF, GIF)
- `image_rotate` - Rotation d'angle
- `image_watermark` - Ajouter watermark texte
- `image_compose` - Superposer deux images
- `image_metadata` - Extraire métadonnées EXIF
- `image_optimize` - Optimiser pour le web

**Features clés** :
- ✅ Sharp (library performante)
- ✅ Formats modernes (WebP, AVIF)
- ✅ Composition d'images
- ✅ Watermarking SVG

**Status** : ✅ Implémenté dans cette session

---

## 📦 Installation complète

### Prérequis système

```bash
# Vérifications
node -v    # Version 18+
npm -v     # Version 9+
git --version
```

### Installation des 4 MCP servers

```bash
# Se placer dans le dépôt
cd /home/user/Skynet_depot

# 1. MCP SysAdmin (déjà installé)
cd MCP_SysAdmin
npm install && npm run build

# 2. Skynet FileWatcher
cd ../skynet-filewatcher-mcp
npm install && npm run build

# 3. Skynet Project
cd ../skynet-project-mcp
npm install && npm run build

# 4. Skynet Creative
cd ../skynet-creative-mcp
npm install && npm run build
```

### Script d'installation automatique

```bash
#!/bin/bash
# install-all-mcp.sh

DIRS=("MCP_SysAdmin" "skynet-filewatcher-mcp" "skynet-project-mcp" "skynet-creative-mcp")

for dir in "${DIRS[@]}"; do
  echo "📦 Installing $dir..."
  cd "$dir"
  npm install
  npm run build
  cd ..
done

echo "✅ All MCP servers installed!"
```

---

## 🔧 Configuration Claude Code

### Fichier de configuration complet

Créez ou éditez `~/.config/claude/config.json` :

```json
{
  "mcp": {
    "servers": {
      "sysadmin": {
        "command": "node",
        "args": ["/home/user/Skynet_depot/MCP_SysAdmin/dist/index.js"]
      },
      "filewatcher": {
        "command": "node",
        "args": ["/home/user/Skynet_depot/skynet-filewatcher-mcp/dist/index.js"]
      },
      "project": {
        "command": "node",
        "args": ["/home/user/Skynet_depot/skynet-project-mcp/dist/index.js"]
      },
      "creative": {
        "command": "node",
        "args": ["/home/user/Skynet_depot/skynet-creative-mcp/dist/index.js"]
      }
    }
  }
}
```

### Configuration via CLI

```bash
# Ajouter chaque serveur via Claude CLI
claude mcp add --transport stdio sysadmin node /home/user/Skynet_depot/MCP_SysAdmin/dist/index.js
claude mcp add --transport stdio filewatcher node /home/user/Skynet_depot/skynet-filewatcher-mcp/dist/index.js
claude mcp add --transport stdio project node /home/user/Skynet_depot/skynet-project-mcp/dist/index.js
claude mcp add --transport stdio creative node /home/user/Skynet_depot/skynet-creative-mcp/dist/index.js
```

### Vérification

```bash
# Lister les serveurs MCP configurés
claude mcp list

# Tester un serveur
cd skynet-filewatcher-mcp
npm run dev
```

---

## 🎯 Cas d'usage concrets

### 1. Setup d'un nouveau projet full-stack

```
Claude, je veux créer un nouveau projet React + FastAPI :

1. [Project] Crée un dossier ~/projects/myapp
2. [Project] Initialise un dépôt Git
3. [SysAdmin] Installe Node.js LTS et Python 3.11
4. [Project] Crée une branche develop
5. [SysAdmin] Installe les dépendances (npm, pip)
6. [FileWatcher] Démarre la surveillance de ~/projects/myapp
7. [Project] Premier commit initial
```

### 2. Surveillance et synchronisation Drive

```
Claude, surveille mon dossier ~/Skynet_Drive_Core :

1. [FileWatcher] Démarre la surveillance récursive
2. [FileWatcher] Ignore node_modules, .git, dist
3. [FileWatcher] Active le calcul de hash SHA256
4. Quand un fichier est modifié :
   → Récupère l'événement
   → [Creative] Optimise les images si c'est une image
   → [Project] Commit automatique
```

### 3. Pipeline DevOps complet

```
Claude, je dois déployer mon app :

1. [Project] Pull depuis origin/main
2. [SysAdmin] Vérifie les ressources système
3. [SysAdmin] Build l'image Docker
4. [SysAdmin] Stop l'ancien container
5. [SysAdmin] Start le nouveau container
6. [SysAdmin] Vérifie les logs Docker
7. [FileWatcher] Surveille les logs d'erreur
```

### 4. Traitement batch d'images

```
Claude, optimise toutes les images du dossier ~/Photos :

1. [FileWatcher] Liste tous les fichiers images
2. Pour chaque image :
   → [Creative] Redimensionne à max 1920x1080
   → [Creative] Convertit en WebP qualité 85
   → [Creative] Ajoute watermark "© 2025"
3. [Project] Commit les résultats
```

---

## 🔄 Workflow recommandés

### Workflow 1 : Développement quotidien

```
Morning :
1. [SysAdmin] Vérifie ressources système
2. [Project] Pull tous les projets
3. [FileWatcher] Démarre la surveillance

During work :
4. [Project] Créer branches features
5. [SysAdmin] Installer dépendances si besoin
6. [FileWatcher] Logger toutes les modifications

Evening :
7. [Project] Stash/commit les changements
8. [FileWatcher] Export events du jour
9. [Project] Push vers remote
```

### Workflow 2 : Déploiement production

```
1. [Project] Merge develop → main
2. [SysAdmin] Run tests
3. [SysAdmin] Build Docker image
4. [SysAdmin] Tag image with version
5. [SysAdmin] Push to registry
6. [SysAdmin] Deploy to production
7. [FileWatcher] Monitor logs
8. [Project] Create GitHub release
```

### Workflow 3 : Content creation

```
1. [Creative] Resize toutes images à 800x600
2. [Creative] Convertir en WebP
3. [Creative] Ajouter watermarks
4. [Creative] Optimiser pour web
5. [Project] Commit les assets
6. [FileWatcher] Exporter statistiques
```

---

## 🔍 Dépannage

### Serveur MCP ne démarre pas

```bash
# Vérifier les dépendances
cd <mcp-directory>
npm install

# Recompiler
npm run build

# Vérifier la compilation
ls -la dist/index.js

# Tester manuellement
npm run dev
```

### Claude ne voit pas les outils

```bash
# Vérifier la config
cat ~/.config/claude/config.json

# Vérifier les chemins absolus
# ❌ "args": ["./dist/index.js"]
# ✅ "args": ["/home/user/Skynet_depot/skynet-filewatcher-mcp/dist/index.js"]

# Redémarrer Claude Code
```

### Permissions insuffisantes

```bash
# Pour MCP SysAdmin (si sudo requis)
# Configurer sudo sans mot de passe (optionnel, ATTENTION sécurité)
sudo visudo
# Ajouter : user ALL=(ALL) NOPASSWD: /usr/bin/apt,/usr/bin/systemctl
```

### Logs et debugging

```bash
# Activer les logs détaillés
cd <mcp-directory>
DEBUG=* npm run dev

# Voir les logs Claude Code
# (selon installation)
journalctl -fu claude-code
```

---

## 🚀 Roadmap & Améliorations

### Court terme (v1.1)

#### FileWatcher
- [ ] Support renamed event (heuristique améliorée)
- [ ] Filtres regex avancés
- [ ] Intégration webhook (n8n, Zapier)
- [ ] Rate limiting pour éviter flood d'events

#### Project
- [ ] GitHub CLI integration (`gh` commands)
- [ ] GitLab CLI integration (`glab`)
- [ ] Project scaffolding (templates)
- [ ] `.env` file management sécurisé

#### Creative
- [ ] OCR avec Tesseract
- [ ] PDF manipulation (pdf-lib)
- [ ] Génération de charts (plotly)
- [ ] Batch processing parallèle

#### SysAdmin
- [ ] Kubernetes support (kubectl)
- [ ] Ansible playbooks
- [ ] Prometheus metrics
- [ ] Grafana dashboards

### Moyen terme (v1.5)

- [ ] **MCP Registry** : Serveur central pour découvrir/installer MCP
- [ ] **MCP UI** : Interface web pour gérer les serveurs
- [ ] **Inter-MCP communication** : Permettre aux MCP de s'appeler entre eux
- [ ] **Event bus** : Bus d'événements pour orchestration complexe
- [ ] **Caching layer** : Redis pour performances
- [ ] **Multi-user** : Support de plusieurs utilisateurs
- [ ] **RBAC** : Role-Based Access Control

### Long terme (v2.0)

- [ ] **AI Agents** : Agents autonomes utilisant les MCP
- [ ] **Workflow engine** : Moteur de workflows visuels
- [ ] **Cloud integration** : AWS, GCP, Azure
- [ ] **Monitoring centralisé** : Dashboard unique
- [ ] **Auto-scaling** : Scalabilité automatique des MCP
- [ ] **Multi-language** : Support Python, Go, Rust MCP servers
- [ ] **Plugin system** : Système de plugins dynamiques

---

## 📊 Métriques de succès

### Actuellement implémenté

- ✅ 4 serveurs MCP fonctionnels
- ✅ 143 outils MCP au total
- ✅ 100% TypeScript pour cohérence
- ✅ Documentation complète en français
- ✅ Exemples d'utilisation concrets
- ✅ Architecture modulaire et extensible

### Objectifs atteints

- ✅ **Autonomie** : Claude peut gérer un serveur Linux complet
- ✅ **Surveillance** : Monitoring temps réel du système de fichiers
- ✅ **Git workflow** : Gestion professionnelle de code
- ✅ **Créativité** : Traitement d'images avancé
- ✅ **Modularité** : Chaque MCP indépendant et réutilisable

---

## 🙏 Remerciements

- **Anthropic** pour le Model Context Protocol et Claude
- **Communauté open-source** pour les libraries utilisées :
  - chokidar, simple-git, sharp
  - @modelcontextprotocol/sdk
  - TypeScript, Node.js, Zod

---

## 📄 Licence

Tous les serveurs MCP Skynet sont sous **licence MIT**.

---

## 👥 Auteur

**Skynet Depot**
Conçu pour transformer Claude Code CLI en véritable poste de travail DevOps + Créatif.

**Version :** 1.0.0
**Date :** 2025-11-22

---

**🌟 Bon coding avec votre nouvel écosystème MCP !**
