# 🚀 PhoenixTerm MCP - Quick Start

Get PhoenixTerm running in **3 minutes**!

---

## ⚡ Installation Express

```bash
cd phoenixterm_mcp
npm install
./start.sh
```

**C'est tout!** PhoenixTerm est maintenant en mode stdio, prêt à recevoir des requêtes MCP.

---

## 🎯 Premier Test

### Option 1: Via MCP Client (Claude Desktop, etc.)

Ajouter dans la config MCP:

```json
{
  "mcpServers": {
    "phoenixterm": {
      "command": "node",
      "args": ["/path/to/phoenixterm_mcp/server.js"]
    }
  }
}
```

### Option 2: Test Manuel (stdio)

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}' | node server.js
```

---

## 📋 Commandes Essentielles

### 1. Exécuter une commande simple

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "execute_interactive_command",
    "arguments": {
      "command": "echo 'Hello PhoenixTerm!'"
    }
  }
}
```

### 2. Commande avec sudo

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "execute_interactive_command",
    "arguments": {
      "command": "sudo apt update",
      "expect_prompt": "password:",
      "input": "YourPassword"
    }
  }
}
```

### 3. Valider une commande avant exécution

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "validate_command",
    "arguments": {
      "command": "rm -rf /data"
    }
  }
}
```

### 4. Lister les outils disponibles

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/list"
}
```

---

## 🔧 Configuration Rapide

### Changer le shell par défaut

Éditer `config/default.json`:

```json
{
  "shell": {
    "defaultShell": "zsh"  // ou bash, fish, etc.
  }
}
```

### Désactiver la validation de sécurité (⚠️ Non recommandé)

```json
{
  "security": {
    "enabled": false
  }
}
```

### Augmenter le timeout des commandes

```json
{
  "security": {
    "maxExecutionTime": 1200000  // 20 minutes
  }
}
```

---

## 🎮 Mode WebSocket

Pour tester avec un client HTTP/WebSocket:

```bash
# Modifier config/default.json
{
  "server": {
    "mode": "websocket",
    "websocket": {
      "enabled": true,
      "port": 3740
    }
  }
}

# Démarrer
./start.sh websocket
```

Puis connecter avec WebSocket à `ws://localhost:3740`

---

## 🐛 Problèmes Courants

### "Cannot find module 'node-pty'"

```bash
npm install
```

### "Permission denied" sur start.sh

```bash
chmod +x start.sh
```

### PTY spawn failed sur Linux

```bash
sudo apt install build-essential python3
npm rebuild node-pty
```

### Session timeout trop rapide

Modifier `config/default.json`:
```json
{
  "sessions": {
    "inactivityTimeout": 3600000  // 1 heure
  }
}
```

---

## 📚 Prochaines Étapes

1. **Lire le README complet**: `README.md`
2. **Explorer les exemples**: `EXAMPLES.md`
3. **Personnaliser la config**: `config/default.json`
4. **Créer des templates**: Utiliser l'outil `execute_template`

---

## 🎯 Cas d'Usage Rapides

### CI/CD Pipeline

```bash
# Créer un template
{
  "action": "save",
  "template_name": "deploy",
  "commands": ["git pull", "npm install", "npm test", "npm run build"]
}

# Exécuter
{
  "action": "execute",
  "template_name": "deploy"
}
```

### Monitoring de Logs

```bash
{
  "command": "tail -f /var/log/myapp.log",
  "streaming": true,
  "session_id": "monitor"
}
```

### Tests E2E

```bash
# Session 1: Backend
{
  "command": "npm run dev:backend",
  "session_id": "backend"
}

# Session 2: Tests
{
  "command": "npm run test:e2e",
  "session_id": "tests"
}
```

---

**🔥 Vous êtes prêt! Explorez la doc complète pour découvrir toutes les capacités de PhoenixTerm!**
