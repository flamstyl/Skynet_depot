# 🚀 MCP GitHub Auto-Committer

**Agent Git autonome pour scan, diff, changelog, commit et push automatique**

Version 1.0.0 | MIT License | Skynet Team

---

## 📖 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Outils MCP disponibles](#-outils-mcp-disponibles)
- [Exemples d'utilisation](#-exemples-dutilisation)
- [Sécurité](#-sécurité)
- [Dépannage](#-dépannage)
- [Extension et développement](#-extension-et-développement)
- [Roadmap](#-roadmap)
- [Licence](#-licence)

---

## 🎯 Vue d'ensemble

Le **MCP GitHub Auto-Committer** est un serveur MCP (Model Context Protocol) qui transforme l'IA Claude en un agent Git autonome capable de :

- ✅ **Scanner** un dépôt Git et détecter les changements
- ✅ **Analyser** sémantiquement les modifications (feat, fix, docs, etc.)
- ✅ **Générer** des changelogs structurés (JSON, Markdown, Conventional Commits)
- ✅ **Créer** des commits avec messages intelligents
- ✅ **Pusher** vers GitHub avec retry automatique
- ✅ **Détecter** les secrets et fichiers sensibles
- ✅ **Gérer** les conflits et divergences de branches

### Pourquoi ce MCP ?

Imaginez que vous êtes en train de coder avec Claude. À la fin de votre session, au lieu de devoir :
1. Faire `git status`
2. Analyser manuellement les changements
3. Rédiger un message de commit pertinent
4. Faire `git add`, `git commit`, `git push`

L'IA peut maintenant faire tout ça **automatiquement** avec un seul appel :

```json
{
  "tool": "auto_commit",
  "params": {
    "repo_path": "/home/user/mon-projet",
    "auto_message": true,
    "style": "conventional"
  }
}
```

Et ensuite :

```json
{
  "tool": "auto_push",
  "params": {
    "repo_path": "/home/user/mon-projet"
  }
}
```

**Résultat** : Commit créé avec un message intelligent type `feat: add user authentication system`, pushé vers GitHub, le tout en quelques secondes !

---

## ✨ Fonctionnalités

### 🔍 Scan et analyse
- Détection automatique des fichiers modifiés, ajoutés, supprimés
- Analyse sémantique des changements (feature, bugfix, doc, etc.)
- Statistiques détaillées (insertions, deletions, fichiers changés)
- Support des `.gitignore` patterns

### 📝 Génération intelligente
- **Changelogs** : JSON, Markdown, Conventional Commits, Keep a Changelog
- **Messages de commit** : Conventional Commits, détaillé, ou simple
- Catégorisation automatique (feat, fix, docs, style, refactor, etc.)
- Détection du type de changement principal

### 🛡️ Sécurité avancée
- Détection de **secrets** (API keys, tokens, passwords, private keys)
- Patterns configurables (GitHub PAT, AWS keys, Stripe, etc.)
- Validation des chemins (protection path traversal)
- Blocage de fichiers sensibles (`.env`, `*.pem`, etc.)
- Scan avant commit

### 🔄 Robustesse
- **Retry automatique** pour les push (exponential backoff)
- Détection de divergence de branches
- Gestion des conflits de merge
- Protection des branches (main, master, develop)
- Rollback safety net

### 🎨 Flexibilité
- Support multi-branches
- Support multi-remotes
- Stratégies de pull : merge ou rebase
- Patterns glob pour staging sélectif
- Dry-run mode pour simulation

---

## 🏗️ Architecture

```
mcp-github-autocommitter/
├── server.js                    # Point d'entrée MCP (JSON-RPC)
├── package.json                 # Dépendances Node.js
├── install.sh                   # Script d'installation
│
├── config/                      # Configuration
│   ├── default.json             # Config par défaut
│   └── patterns.json            # Patterns de secrets et types de commits
│
├── core/                        # Logique métier
│   ├── git_manager.js           # Interface Git (simple-git)
│   ├── security_checker.js      # Détection de secrets
│   ├── diff_analyzer.js         # Analyse sémantique de diff
│   ├── changelog_generator.js   # Génération de changelog
│   ├── commit_message_ai.js     # Génération de messages intelligents
│   └── retry_engine.js          # Retry logic avec backoff
│
├── tools/                       # Outils MCP
│   ├── scan_repository.js       # Scan du repo
│   ├── generate_diff_summary.js # Résumé des changements
│   ├── generate_changelog.js    # Génération changelog
│   ├── stage_changes.js         # Staging de fichiers
│   ├── auto_commit.js           # Commit automatique
│   ├── auto_push.js             # Push automatique
│   ├── sync_pull.js             # Pull/sync
│   ├── get_repo_status.js       # État du repo
│   └── rollback_last_commit.js  # Rollback
│
├── utils/                       # Utilitaires
│   ├── errors.js                # Classes d'erreurs
│   ├── logger.js                # Système de logs
│   └── path_validator.js        # Validation de chemins
│
├── data/                        # Données
│   └── commit_history.json      # Historique des commits
│
└── tests/                       # Tests
    ├── tools/                   # Tests des tools
    ├── core/                    # Tests du core
    └── integration/             # Tests d'intégration
```

### Flux de données

```
┌─────────────────────┐
│   Claude Code CLI   │
└──────────┬──────────┘
           │ JSON-RPC
           ▼
┌─────────────────────┐
│   server.js (MCP)   │
│  ┌───────────────┐  │
│  │  Tool Router  │  │
│  └───────┬───────┘  │
└──────────┼──────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Tool Layer (scan, commit, etc) │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Core Layer (git, security, AI) │
│  ┌──────────┐  ┌──────────────┐ │
│  │ simple-  │  │  Security    │ │
│  │   git    │  │  Checker     │ │
│  └──────────┘  └──────────────┘ │
└──────────┬──────────────────────┘
           │
           ▼
    ┌──────────────┐
    │   Git Repo   │
    └──────────────┘
```

---

## 📋 Prérequis

### Obligatoires

- **Node.js** 18+ ([télécharger](https://nodejs.org))
- **Git** 2.30+ ([télécharger](https://git-scm.com))
- **npm** (inclus avec Node.js)

### Recommandés

- **SSH Keys** configurées pour GitHub ([guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh))
- **GitHub CLI** (`gh`) pour authentification simplifiée ([installer](https://cli.github.com/))

### Optionnels

- **Claude Code CLI** ([docs](https://docs.claude.com/en/docs/claude-code))

---

## 🚀 Installation

### Installation automatique (recommandée)

```bash
cd mcp-github-autocommitter
./install.sh
```

Le script va :
1. Vérifier Node.js et Git
2. Installer les dépendances npm
3. Configurer les permissions
4. Vérifier les credentials GitHub
5. Tester l'installation

### Installation manuelle

```bash
# 1. Cloner ou télécharger le projet
cd mcp-github-autocommitter

# 2. Installer les dépendances
npm install

# 3. Rendre le serveur exécutable
chmod +x server.js

# 4. Tester
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node server.js
```

---

## ⚙️ Configuration

### 1. Configuration du MCP

Créez ou éditez `~/.config/claude/mcp.json` (ou équivalent selon votre OS) :

```json
{
  "mcpServers": {
    "github-autocommitter": {
      "command": "node",
      "args": ["/chemin/absolu/vers/mcp-github-autocommitter/server.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_votre_token_optionnel"
      }
    }
  }
}
```

### 2. Configuration des credentials GitHub

**Option 1 : SSH Keys (recommandé)**

```bash
# Générer une clé SSH
ssh-keygen -t ed25519 -C "votre@email.com"

# Ajouter à ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Ajouter la clé publique à GitHub
cat ~/.ssh/id_ed25519.pub
# Copier et ajouter sur : https://github.com/settings/keys
```

**Option 2 : GitHub CLI**

```bash
# Installer gh CLI
# macOS: brew install gh
# Linux: https://cli.github.com/manual/installation

# Authentification
gh auth login
```

**Option 3 : Personal Access Token**

```bash
# Créer un token sur: https://github.com/settings/tokens
# Permissions requises: repo

# Définir la variable d'environnement
export GITHUB_TOKEN=ghp_votre_token_ici
```

### 3. Configuration avancée

Éditez `config/default.json` pour personnaliser :

```json
{
  "git": {
    "defaultRemote": "origin",
    "author": {
      "name": "Votre Nom",
      "email": "votre@email.com"
    }
  },
  "commit": {
    "style": "conventional",
    "maxMessageLength": 200
  },
  "push": {
    "retry": {
      "enabled": true,
      "maxAttempts": 3,
      "backoff": "exponential"
    },
    "forcePushProtectedBranches": ["main", "master", "develop"]
  },
  "security": {
    "scanForSecrets": true,
    "blockedPatterns": [".env", "*.pem", "*.key"]
  }
}
```

---

## 🔧 Outils MCP disponibles

### 1. `scan_repository`

Scanne un dépôt Git et récupère son état actuel.

**Inputs :**
```json
{
  "repo_path": "/home/user/mon-projet",
  "include_untracked": true,
  "max_files": 1000
}
```

**Outputs :**
```json
{
  "success": true,
  "repo": {
    "path": "/home/user/mon-projet",
    "branch": "main",
    "is_clean": false,
    "ahead": 1,
    "behind": 0
  },
  "changes": {
    "staged": [],
    "unstaged": ["src/index.js"],
    "untracked": ["temp.log"]
  },
  "stats": {
    "total_files_changed": 2
  }
}
```

---

### 2. `generate_diff_summary`

Génère un résumé détaillé des changements.

**Inputs :**
```json
{
  "repo_path": "/home/user/mon-projet",
  "format": "semantic"
}
```

**Outputs :**
```json
{
  "success": true,
  "summary": {
    "files_changed": 3,
    "insertions": 145,
    "deletions": 28,
    "changes_by_type": {
      "feat": ["src/auth.js"],
      "fix": ["src/login.js"],
      "docs": ["README.md"]
    }
  },
  "files": [
    {
      "path": "src/auth.js",
      "semantic_type": "feat",
      "insertions": 120,
      "deletions": 5
    }
  ]
}
```

---

### 3. `generate_changelog`

Génère un changelog structuré.

**Inputs :**
```json
{
  "repo_path": "/home/user/mon-projet",
  "format": "markdown",
  "style": "conventional-commits"
}
```

**Outputs :**
```json
{
  "success": true,
  "changelog": {
    "version": "minor",
    "date": "2025-11-22",
    "categories": {
      "feat": {
        "label": "Features",
        "emoji": "✨",
        "items": ["Add user authentication system"]
      }
    }
  },
  "formatted": "## [minor] - 2025-11-22\n\n### ✨ Features\n- Add user authentication system\n"
}
```

---

### 4. `stage_changes`

Stage des fichiers pour commit.

**Inputs :**
```json
{
  "repo_path": "/home/user/mon-projet",
  "files": ["src/index.js", "README.md"],
  "exclude_patterns": ["*.log"]
}
```

**Outputs :**
```json
{
  "success": true,
  "staged_files": ["src/index.js", "README.md"],
  "total_staged": 2
}
```

---

### 5. `auto_commit`

Crée un commit avec message intelligent.

**Inputs :**
```json
{
  "repo_path": "/home/user/mon-projet",
  "auto_message": true,
  "style": "conventional"
}
```

**Outputs :**
```json
{
  "success": true,
  "commit": {
    "hash": "a1b2c3d",
    "message": "feat: add user authentication system\n\n- Implemented OAuth2 support\n- Added login/logout endpoints",
    "branch": "main",
    "files_committed": 3
  }
}
```

---

### 6. `auto_push`

Push vers remote avec retry automatique.

**Inputs :**
```json
{
  "repo_path": "/home/user/mon-projet",
  "remote": "origin"
}
```

**Outputs :**
```json
{
  "success": true,
  "push": {
    "remote": "origin",
    "branch": "main",
    "commits_pushed": 1
  }
}
```

---

### 7. `sync_pull`

Pull depuis remote pour synchroniser.

**Inputs :**
```json
{
  "repo_path": "/home/user/mon-projet",
  "strategy": "rebase"
}
```

---

### 8. `get_repo_status`

État complet du repo.

**Inputs :**
```json
{
  "repo_path": "/home/user/mon-projet",
  "include_log": true
}
```

**Outputs :**
```json
{
  "success": true,
  "repo": { ... },
  "changes": { ... },
  "health": {
    "can_commit": true,
    "can_push": true,
    "needs_pull": false,
    "issues": []
  }
}
```

---

### 9. `rollback_last_commit`

Annule le dernier commit.

**Inputs :**
```json
{
  "repo_path": "/home/user/mon-projet",
  "mode": "soft",
  "steps": 1
}
```

---

## 💡 Exemples d'utilisation

### Workflow complet : Scan → Commit → Push

```javascript
// 1. Scanner le repo
await callTool('get_repo_status', {
  repo_path: '/home/user/mon-projet'
});

// 2. Stager tous les changements
await callTool('stage_changes', {
  repo_path: '/home/user/mon-projet',
  files: []  // Vide = tous les fichiers
});

// 3. Créer un commit avec message auto
await callTool('auto_commit', {
  repo_path: '/home/user/mon-projet',
  auto_message: true,
  style: 'conventional'
});

// 4. Pusher vers GitHub
await callTool('auto_push', {
  repo_path: '/home/user/mon-projet'
});
```

### Générer un changelog sans committer

```javascript
await callTool('generate_changelog', {
  repo_path: '/home/user/mon-projet',
  format: 'markdown',
  style: 'keep-a-changelog'
});

// Résultat utilisable pour release notes
```

### Staging sélectif avec patterns

```javascript
// Stager seulement les fichiers .js
await callTool('stage_changes', {
  repo_path: '/home/user/mon-projet',
  pattern: '*.js',
  exclude_patterns: ['*.test.js', '*.spec.js']
});
```

### Rollback d'un commit accidentel

```javascript
await callTool('rollback_last_commit', {
  repo_path: '/home/user/mon-projet',
  mode: 'soft',  // Garde les changements
  steps: 1
});
```

---

## 🛡️ Sécurité

### Détection de secrets

Le MCP scanne automatiquement les fichiers avant commit pour détecter :

- ✅ API keys génériques
- ✅ Passwords
- ✅ Private keys (RSA, EC, etc.)
- ✅ GitHub Personal Access Tokens
- ✅ AWS keys
- ✅ Stripe keys
- ✅ Slack tokens
- ✅ JWT tokens

**Exemple de blocage :**

```json
{
  "success": false,
  "error": "Security violations detected",
  "issues": [
    {
      "type": "secret_detected",
      "severity": "critical",
      "file": ".env",
      "line": 3,
      "secret_type": "github_token",
      "snippet": "GITHUB_TOKEN=ghp_abcdef1234567890...",
      "recommendation": "Remove secret or use environment variables"
    }
  ]
}
```

### Fichiers bloqués

Par défaut, ces patterns sont bloqués :

- `.env`, `.env.*`
- `*.pem`, `*.key`, `*_rsa`
- `*.p12`, `*.pfx`
- `credentials.json`, `secrets.json`

### Protection des branches

Force push bloqué sur :
- `main`
- `master`
- `develop`
- `production`

### Validation des chemins

- ✅ Pas de path traversal (`../`)
- ✅ Chemins absolus uniquement
- ✅ Vérification d'existence
- ✅ Vérification que c'est un repo Git

---

## 🐛 Dépannage

### Le serveur ne démarre pas

```bash
# Vérifier Node.js
node -v  # Doit être >= 18

# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### "Not a git repository"

```bash
# Vérifier que vous êtes dans un repo Git
ls -la .git

# Initialiser si nécessaire
git init
```

### "No credentials available"

```bash
# Tester SSH
ssh -T git@github.com

# Ou installer gh CLI
gh auth login

# Ou définir un token
export GITHUB_TOKEN=ghp_...
```

### Push échoue (réseau)

Le MCP retry automatiquement avec exponential backoff (2s, 4s, 8s, 16s).

Si le push échoue après 3 tentatives, vérifiez :
- Connexion réseau
- Permissions sur le repo
- Remote correctement configuré

### Secrets détectés par erreur (faux positif)

Éditez `config/patterns.json` pour ajuster les patterns.

---

## 🔧 Extension et développement

### Ajouter un nouveau tool MCP

1. Créez `tools/mon_tool.js` :

```javascript
export const mon_tool = {
  name: 'mon_tool',
  description: 'Description',
  inputSchema: {
    type: 'object',
    properties: { ... },
    required: [...]
  },
  async execute(params, context) {
    // Logique
    return { success: true, ... };
  }
};
```

2. Ajoutez dans `server.js` :

```javascript
import { mon_tool } from './tools/mon_tool.js';

// Dans le constructor
this.tools = [
  ...,
  mon_tool,
];
```

### Ajouter des patterns de secrets

Éditez `config/patterns.json` :

```json
{
  "secrets": [
    {
      "name": "mon_secret",
      "pattern": "API_KEY_\\w{32}",
      "severity": "high"
    }
  ]
}
```

### Tester localement

```bash
# Tests unitaires
npm test

# Test d'un tool spécifique
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node server.js
```

---

## 🚧 Roadmap

### V1.1 (Court terme)
- [ ] Support des templates de commit personnalisés
- [ ] Export de l'historique des commits en CSV
- [ ] Mode dry-run global (simulation de tout le workflow)
- [ ] Détection améliorée de secrets (machine learning)

### V1.2 (Moyen terme)
- [ ] Support multi-repos (orchestration de plusieurs projets)
- [ ] Auto-tagging sémantique (semver)
- [ ] Génération automatique de Pull Requests
- [ ] Intégration avec GitHub Actions / GitLab CI

### V2.0 (Long terme)
- [ ] Analyse sémantique avancée du code (AST parsing)
- [ ] Support GitLab, Bitbucket, Gitea
- [ ] UI web pour monitoring
- [ ] Mode collaboratif (multi-utilisateurs)
- [ ] Plugin system pour extensions

---

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE) pour détails.

---

## 🙏 Remerciements

- **simple-git** - Interface Git pour Node.js
- **Model Context Protocol (MCP)** - Standard pour agents IA
- **Conventional Commits** - Spécification des messages de commit
- **Skynet Team** - Écosystème d'agents autonomes

---

## 💬 Support

- **Issues** : [GitHub Issues](https://github.com/flamstyl/Skynet_depot/issues)
- **Documentation MCP** : [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Claude Code** : [docs.claude.com](https://docs.claude.com)

---

**🚀 MCP GitHub Auto-Committer - L'agent Git autonome pour Claude AI**

Built with 💜 by the Skynet Team
