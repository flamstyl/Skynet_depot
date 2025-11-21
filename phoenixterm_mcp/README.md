# 🔥 PhoenixTerm MCP v2.0.0

**Advanced PTY-based Terminal Server for AI Autonomy**

PhoenixTerm est un serveur MCP (Model Context Protocol) de nouvelle génération qui fournit un accès terminal **réellement interactif** via PTY (pseudo-terminal), conçu spécifiquement pour maximiser l'**autonomie des agents IA**.

---

## 🎯 Pourquoi PhoenixTerm ?

### Le Problème

Les serveurs de terminal existants ont des limitations critiques:
- ❌ **Pas de PTY réel** → impossible de gérer les prompts interactifs (sudo, ssh, etc.)
- ❌ **Pas de retry automatique** → les erreurs réseau bloquent l'agent
- ❌ **Pas de validation de sécurité** → risques d'exécution de commandes dangereuses
- ❌ **Pas de persistance de session** → perte de contexte entre les commandes
- ❌ **Pas de streaming temps réel** → impossible de suivre les commandes longues

### La Solution PhoenixTerm

✅ **PTY Véritable** avec `node-pty` → support complet des prompts interactifs
✅ **Auto-Retry Intelligent** → exponential backoff, stratégies configurables
✅ **Sécurité Avancée** → validation, dry-run, détection de patterns dangereux
✅ **Sessions Persistantes** → contexte maintenu, variables d'environnement, historique
✅ **Streaming Temps Réel** → output en direct, détection de progression
✅ **Multi-Shell** → bash, zsh, fish, PowerShell, cmd
✅ **Templates de Commandes** → macros réutilisables, pipelines complexes
✅ **Isolation & Resource Limits** → CPU, RAM, timeout configurables

---

## 🚀 Installation Rapide

### Prérequis

- **Node.js** 18+ ([télécharger](https://nodejs.org))
- **npm** ou **yarn**
- **Linux/macOS/Windows**

### Installation

```bash
cd phoenixterm_mcp
npm install
```

### Démarrage

**Linux/macOS:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

**Mode WebSocket (optionnel):**
```bash
./start.sh websocket
```

---

## 📖 Utilisation

PhoenixTerm expose **6 outils MCP** pour l'agent IA:

### 1. 🔥 `execute_interactive_command`

**L'outil principal** - Exécute des commandes avec support PTY complet.

#### Paramètres

| Paramètre | Type | Description | Défaut |
|-----------|------|-------------|--------|
| `command` | string | Commande à exécuter | **requis** |
| `input` | string | Input à envoyer au stdin (ex: mot de passe) | - |
| `expect_prompt` | string | Regex pour détecter un prompt | - |
| `session_id` | string | ID de session pour persistance | `"default"` |
| `timeout` | number | Timeout en secondes | `60` |
| `cwd` | string | Répertoire de travail | - |
| `env` | object | Variables d'environnement | - |
| `shell` | string | Shell à utiliser | `"auto"` |
| `streaming` | boolean | Activer le streaming temps réel | `true` |
| `retry` | boolean | Activer l'auto-retry | `true` |
| `validate` | boolean | Valider la sécurité avant exécution | `true` |

#### Exemple 1: Commande simple

```json
{
  "command": "ls -la /home/user"
}
```

**Réponse:**
```json
{
  "success": true,
  "stdout": "total 48\ndrwxr-xr-x 12 user user 4096 ...",
  "stderr": "",
  "exit_code": 0,
  "is_interactive_prompt_pending": false,
  "session_id": "default",
  "duration": 45,
  "timestamp": 1700000000000
}
```

#### Exemple 2: Commande interactive (sudo)

**Étape 1 - Exécuter la commande:**
```json
{
  "command": "sudo dnf install postgresql-server",
  "expect_prompt": "\\[sudo\\] password for .*:",
  "session_id": "install_session"
}
```

**Réponse:**
```json
{
  "success": true,
  "stdout": "[sudo] password for user: ",
  "is_interactive_prompt_pending": true,
  "prompt_message": "[sudo] password for user: ",
  "session_id": "install_session"
}
```

**Étape 2 - Envoyer le mot de passe:**
```json
{
  "command": "",
  "input": "MySecurePassword123",
  "session_id": "install_session"
}
```

**Réponse:**
```json
{
  "success": true,
  "stdout": "Installing postgresql-server...\nComplete!\n",
  "exit_code": 0,
  "is_interactive_prompt_pending": false,
  "session_id": "install_session"
}
```

#### Exemple 3: Avec retry automatique

```json
{
  "command": "wget https://example.com/large-file.tar.gz",
  "retry": true,
  "timeout": 300
}
```

Si la commande échoue (réseau, timeout), PhoenixTerm va automatiquement retry avec exponential backoff!

---

### 2. 🔍 `validate_command`

**Valide une commande** avant exécution (dry-run).

#### Paramètres

| Paramètre | Type | Description | Défaut |
|-----------|------|-------------|--------|
| `command` | string | Commande à valider | **requis** |
| `dry_run` | boolean | Simuler sans exécuter | `true` |
| `detailed` | boolean | Rapport détaillé | `true` |

#### Exemple

```json
{
  "command": "rm -rf /important/data",
  "detailed": true
}
```

**Réponse:**
```json
{
  "success": true,
  "command": "rm -rf /important/data",
  "sanitized": "rm -rf /important/data",
  "safe": false,
  "validation": {
    "valid": false,
    "blocked": true,
    "severity": "critical",
    "requiresConfirmation": true
  },
  "recommendation": "BLOCK: Command is too dangerous to execute",
  "warnings": [
    {
      "type": "dangerous_pattern",
      "message": "Attempting to delete critical data",
      "severity": "critical"
    }
  ],
  "impact": {
    "filesystemChanges": true,
    "networkActivity": false,
    "systemModification": false,
    "privilegeEscalation": false,
    "estimatedRisk": "high"
  },
  "riskLevel": "CRITICAL",
  "securityScore": 0
}
```

---

### 3. 📊 `get_session_state`

**Récupère l'état complet** d'une session terminal.

#### Paramètres

| Paramètre | Type | Description | Défaut |
|-----------|------|-------------|--------|
| `session_id` | string | ID de session | `"default"` |
| `include_history` | boolean | Inclure l'historique | `true` |
| `include_output` | boolean | Inclure le buffer de sortie | `false` |
| `history_limit` | number | Nombre max de commandes | `50` |

#### Exemple

```json
{
  "session_id": "default",
  "include_history": true,
  "history_limit": 10
}
```

**Réponse:**
```json
{
  "success": true,
  "session": {
    "id": "default",
    "created": 1700000000000,
    "lastActivity": 1700000300000,
    "uptime": 300000,
    "inactive": 0,
    "shell": "/bin/bash",
    "cwd": "/home/user/projects",
    "commandCount": 42,
    "recentCommands": [
      {
        "command": "git status",
        "timestamp": 1700000280000,
        "exitCode": 0,
        "cwd": "/home/user/projects"
      }
    ],
    "recentExitCodes": [0, 0, 1, 0],
    "variables": {},
    "status": "active",
    "pty": {
      "pid": 12345,
      "shell": "/bin/bash",
      "uptime": 300000,
      "lastActivity": 1700000300000
    }
  }
}
```

---

### 4. 📝 `execute_template`

**Exécute des templates** de commandes réutilisables.

#### Paramètres

| Paramètre | Type | Description | Défaut |
|-----------|------|-------------|--------|
| `action` | string | `execute`, `save`, `list`, `delete` | `"execute"` |
| `template_name` | string | Nom du template | - |
| `commands` | array | Liste de commandes (pour `save`) | - |
| `parameters` | object | Paramètres à substituer | - |
| `session_id` | string | ID de session | `"default"` |
| `chain_mode` | string | `sequential`, `parallel`, `conditional` | `"sequential"` |
| `stop_on_error` | boolean | Arrêter si erreur | `true` |

#### Exemple 1: Sauvegarder un template

```json
{
  "action": "save",
  "template_name": "deploy_app",
  "commands": [
    "cd {{project_dir}}",
    "git pull origin main",
    "npm install",
    "npm run build",
    "pm2 restart {{app_name}}"
  ]
}
```

#### Exemple 2: Exécuter un template

```json
{
  "action": "execute",
  "template_name": "deploy_app",
  "parameters": {
    "project_dir": "/var/www/myapp",
    "app_name": "myapp"
  },
  "chain_mode": "sequential",
  "stop_on_error": true
}
```

**Réponse:**
```json
{
  "success": true,
  "template": "deploy_app",
  "commands_executed": 5,
  "commands_total": 5,
  "successes": 5,
  "failures": 0,
  "results": [ ... ]
}
```

---

### 5. 📋 `list_sessions`

**Liste toutes les sessions** actives.

#### Exemple

```json
{
  "detailed": true
}
```

**Réponse:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "default",
      "created": 1700000000000,
      "lastActivity": 1700000300000,
      "uptime": 300000,
      "inactive": 0,
      "commandCount": 42,
      "cwd": "/home/user",
      "status": "active"
    }
  ],
  "count": 1
}
```

---

### 6. 🛑 `kill_session`

**Termine une session** et nettoie les ressources.

#### Exemple

```json
{
  "session_id": "old_session",
  "signal": "SIGTERM",
  "save_state": true
}
```

---

## 🛡️ Sécurité

PhoenixTerm intègre un **système de sécurité multi-couches**:

### Détection de Commandes Dangereuses

```bash
rm -rf /          → 🔴 BLOCKED (Critical)
dd if=/dev/zero   → 🔴 BLOCKED (Critical)
:(){ :|:& };:     → 🔴 BLOCKED (Fork bomb)
curl ... | sh     → 🟡 WARNING (High risk)
sudo su -         → 🟡 CONFIRMATION (Medium risk)
```

### Validation par Patterns

PhoenixTerm analyse **8 catégories de risques**:
- Suppression récursive
- Wipe de disque
- Fork bombs
- Téléchargement + exécution de scripts
- Escalade de privilèges
- Modification de permissions système
- Accès à des chemins protégés
- Commandes réseau suspectes

### Whitelist Mode (optionnel)

```json
{
  "security": {
    "whitelistMode": true,
    "allowedCommands": ["ls", "cat", "grep", "git", "npm"]
  }
}
```

### Resource Limits

```json
{
  "security": {
    "maxCpuPercent": 80,
    "maxMemoryMb": 2048,
    "maxExecutionTime": 600000
  }
}
```

---

## 🔄 Auto-Retry Intelligent

PhoenixTerm retry automatiquement les commandes qui échouent avec des **exit codes retryables**.

### Stratégies de Retry

| Stratégie | Description |
|-----------|-------------|
| `exponential_backoff` | Délai exponentiel (1s, 2s, 4s, 8s...) |
| `linear` | Délai linéaire (1s, 2s, 3s, 4s...) |
| `fixed` | Délai fixe |
| `random` | Délai aléatoire |

### Configuration

```json
{
  "retry": {
    "enabled": true,
    "strategy": "exponential_backoff",
    "maxRetries": 3,
    "initialDelay": 1000,
    "maxDelay": 10000,
    "retryableExitCodes": [1, 127, 130]
  }
}
```

### Exemple d'Utilisation

```bash
wget https://unstable-server.com/file.tar.gz
```

**Sans retry:**
- Tentative 1: ❌ ETIMEDOUT
- **Échec total**

**Avec retry:**
- Tentative 1: ❌ ETIMEDOUT → wait 1s
- Tentative 2: ❌ ECONNREFUSED → wait 2s
- Tentative 3: ✅ **Succès!**

---

## 📡 Streaming Temps Réel

PhoenixTerm supporte le **streaming de l'output** pour les commandes longues.

### Détection Automatique

- **Barres de progression** (npm, wget, apt, etc.)
- **Prompts interactifs** (sudo, ssh, etc.)
- **Pourcentages** (rsync, dd, etc.)

### Exemple

```json
{
  "command": "npm install",
  "streaming": true
}
```

PhoenixTerm détectera automatiquement:
```
npm WARN deprecated ...         → Type: warning
⸨░░░░░░░░░░⸩ ⠋ reify:tar      → Type: progress
added 423 packages in 12s       → Type: success
```

---

## 🔧 Configuration Avancée

### Fichier `config/default.json`

```json
{
  "server": {
    "mode": "stdio",  // ou "websocket"
    "websocket": {
      "enabled": false,
      "port": 3740
    }
  },
  "shell": {
    "defaultShell": "auto",  // bash, zsh, fish, powershell, cmd
    "env": {
      "TERM": "xterm-256color"
    }
  },
  "sessions": {
    "maxActiveSessions": 10,
    "inactivityTimeout": 1800000,  // 30 min
    "persistState": true
  },
  "security": {
    "enabled": true,
    "validateCommands": true
  },
  "retry": {
    "enabled": true,
    "maxRetries": 3
  },
  "streaming": {
    "enabled": true
  }
}
```

---

## 🏗️ Architecture

```
phoenixterm_mcp/
├── server.js               # Serveur MCP principal
├── core/
│   ├── pty_manager.js      # Gestion PTY (node-pty)
│   ├── session_manager.js  # Sessions persistantes
│   ├── security_manager.js # Validation & sécurité
│   ├── retry_engine.js     # Auto-retry logic
│   └── streaming_handler.js # Streaming temps réel
├── tools/
│   ├── execute_interactive.js  # Outil principal
│   ├── get_session_state.js
│   ├── validate_command.js
│   ├── execute_template.js
│   ├── list_sessions.js
│   └── kill_session.js
├── config/
│   ├── default.json
│   └── security_rules.json
├── data/
│   ├── sessions/           # États de sessions persistées
│   ├── templates/          # Templates de commandes
│   └── logs/               # Logs du serveur
└── README.md
```

---

## 📊 Comparaison avec d'autres solutions

| Feature | PhoenixTerm | Terminal classique | Serveur SSH |
|---------|-------------|-------------------|-------------|
| PTY réel | ✅ | ✅ | ✅ |
| Support MCP | ✅ | ❌ | ❌ |
| Auto-retry | ✅ | ❌ | ❌ |
| Validation sécurité | ✅ | ❌ | ❌ |
| Sessions persistantes | ✅ | ❌ | ⚠️ |
| Streaming temps réel | ✅ | ⚠️ | ⚠️ |
| Templates de commandes | ✅ | ❌ | ❌ |
| Multi-shell | ✅ | ⚠️ | ⚠️ |
| Resource limits | ✅ | ❌ | ⚠️ |

---

## 🎮 Exemples Avancés

### Workflow Complexe avec Retry

```json
{
  "action": "save",
  "template_name": "robust_deploy",
  "commands": [
    "git fetch origin",
    "git reset --hard origin/main",
    "npm ci",
    "npm run build",
    "npm test",
    "pm2 reload myapp --update-env"
  ]
}
```

Avec `retry: true`, chaque commande sera retryée en cas d'échec réseau!

### Multi-Session Workflow

```json
// Session 1: Backend
{
  "command": "npm run dev:backend",
  "session_id": "backend",
  "streaming": true
}

// Session 2: Frontend
{
  "command": "npm run dev:frontend",
  "session_id": "frontend",
  "streaming": true
}

// Session 3: Monitoring
{
  "command": "tail -f logs/app.log",
  "session_id": "monitor",
  "streaming": true
}
```

### Validation Avant Exécution Critique

```json
// Step 1: Valider
{
  "command": "rm -rf node_modules",
  "dry_run": true
}

// Step 2: Si safe, exécuter
{
  "command": "rm -rf node_modules",
  "validate": true
}
```

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

### PTY spawn failed

```bash
# Linux: Installer build-essential
sudo apt install build-essential python3

# macOS: Installer Xcode CLI tools
xcode-select --install
```

### Session timeout trop court

Modifier `config/default.json`:
```json
{
  "sessions": {
    "inactivityTimeout": 3600000  // 1 heure
  }
}
```

---

## 🚧 Roadmap

### v2.1 (Prochaine version)
- [ ] Support Docker/Podman exec
- [ ] Tunneling SSH intégré
- [ ] Recording/Playback de sessions
- [ ] Metrics & Analytics

### v2.2
- [ ] Multi-user isolation
- [ ] Role-based access control (RBAC)
- [ ] Audit logs
- [ ] Integration avec Vault pour secrets

### v3.0
- [ ] Kubernetes exec support
- [ ] Distributed sessions (Redis)
- [ ] GraphQL API
- [ ] Web UI pour monitoring

---

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE) pour détails.

---

## 🙏 Remerciements

- **node-pty** - PTY bindings pour Node.js
- **MCP Protocol** - Standard pour agents IA
- **Skynet Team** - Écosystème d'agents autonomes

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/flamstyl/Skynet_depot/issues)
- **Discord**: Skynet Community
- **Email**: support@skynet.ai

---

**🔥 PhoenixTerm - Le terminal de demain pour les agents IA d'aujourd'hui.**

Built with 💜 by the Skynet Team
