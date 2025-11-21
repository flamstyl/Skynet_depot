# 🔥 PhoenixTerm MCP - Exemples d'Utilisation

Ce document contient des **exemples pratiques** d'utilisation de PhoenixTerm pour différents cas d'usage d'agents IA autonomes.

---

## 📦 Exemple 1: Installation de Packages avec Sudo

### Scénario
L'agent doit installer PostgreSQL sur un système Linux.

### Workflow

**1. Valider la commande d'abord:**
```json
{
  "tool": "validate_command",
  "params": {
    "command": "sudo dnf install postgresql-server",
    "detailed": true
  }
}
```

**Réponse:**
```json
{
  "safe": true,
  "validation": {
    "severity": "medium",
    "requiresConfirmation": true
  },
  "impact": {
    "systemModification": true,
    "privilegeEscalation": true
  },
  "recommendation": "CAUTION: Requires sudo - ensure credentials are available"
}
```

**2. Exécuter avec gestion du prompt sudo:**
```json
{
  "tool": "execute_interactive_command",
  "params": {
    "command": "sudo dnf install postgresql-server -y",
    "expect_prompt": "\\[sudo\\] password for .*:",
    "input": "MySecurePassword123",
    "session_id": "install_postgres",
    "timeout": 300,
    "retry": true
  }
}
```

**Réponse:**
```json
{
  "success": true,
  "exit_code": 0,
  "stdout": "Installing postgresql-server...\nComplete!\n"
}
```

---

## 🔄 Exemple 2: Déploiement avec Retry Automatique

### Scénario
Déployer une application avec retry en cas d'échec réseau.

### Template: robust_deploy

**1. Créer le template:**
```json
{
  "tool": "execute_template",
  "params": {
    "action": "save",
    "template_name": "robust_deploy",
    "commands": [
      "git fetch origin",
      "git reset --hard origin/{{branch}}",
      "npm ci",
      "npm run build",
      "npm test",
      "pm2 reload {{app_name}} --update-env"
    ]
  }
}
```

**2. Exécuter le template avec retry:**
```json
{
  "tool": "execute_template",
  "params": {
    "action": "execute",
    "template_name": "robust_deploy",
    "parameters": {
      "branch": "main",
      "app_name": "myapp"
    },
    "chain_mode": "sequential",
    "stop_on_error": true,
    "retry": true
  }
}
```

Si `git fetch` échoue (réseau), PhoenixTerm retry automatiquement!

---

## 🧪 Exemple 3: Tests E2E avec Sessions Multiples

### Scénario
Lancer backend + frontend + tests E2E en parallèle.

**1. Démarrer le backend:**
```json
{
  "tool": "execute_interactive_command",
  "params": {
    "command": "npm run dev:backend",
    "session_id": "backend_server",
    "streaming": true,
    "timeout": 0
  }
}
```

**2. Démarrer le frontend:**
```json
{
  "tool": "execute_interactive_command",
  "params": {
    "command": "npm run dev:frontend",
    "session_id": "frontend_server",
    "streaming": true,
    "timeout": 0
  }
}
```

**3. Attendre que les serveurs soient prêts (vérifier les logs):**
```json
{
  "tool": "get_session_state",
  "params": {
    "session_id": "backend_server",
    "include_output": true
  }
}
```

**4. Lancer les tests E2E:**
```json
{
  "tool": "execute_interactive_command",
  "params": {
    "command": "npm run test:e2e",
    "session_id": "e2e_tests",
    "timeout": 600
  }
}
```

**5. Tout terminer:**
```json
{
  "tool": "kill_session",
  "params": {
    "session_id": "backend_server"
  }
}
{
  "tool": "kill_session",
  "params": {
    "session_id": "frontend_server"
  }
}
```

---

## 🔐 Exemple 4: Commande SSH Interactive

### Scénario
Se connecter à un serveur distant via SSH.

**1. Connexion SSH:**
```json
{
  "tool": "execute_interactive_command",
  "params": {
    "command": "ssh user@remote-server.com",
    "expect_prompt": "password:",
    "input": "MySSHPassword",
    "session_id": "ssh_remote",
    "timeout": 30
  }
}
```

**2. Exécuter une commande sur le serveur distant:**
```json
{
  "tool": "execute_interactive_command",
  "params": {
    "command": "ls -la /var/www",
    "session_id": "ssh_remote"
  }
}
```

**3. Se déconnecter:**
```json
{
  "tool": "execute_interactive_command",
  "params": {
    "command": "exit",
    "session_id": "ssh_remote"
  }
}
```

---

## 🐳 Exemple 5: Pipeline Docker

### Template: docker_build_push

```json
{
  "tool": "execute_template",
  "params": {
    "action": "save",
    "template_name": "docker_build_push",
    "commands": [
      "docker build -t {{registry}}/{{image}}:{{tag}} .",
      "docker login {{registry}} -u {{username}} -p {{password}}",
      "docker push {{registry}}/{{image}}:{{tag}}",
      "docker logout {{registry}}"
    ]
  }
}
```

**Exécution:**
```json
{
  "tool": "execute_template",
  "params": {
    "action": "execute",
    "template_name": "docker_build_push",
    "parameters": {
      "registry": "ghcr.io",
      "image": "myorg/myapp",
      "tag": "v1.2.3",
      "username": "bot-account",
      "password": "ghp_xxxxxxxxxxxx"
    },
    "chain_mode": "sequential",
    "stop_on_error": true
  }
}
```

---

## 📊 Exemple 6: Monitoring avec Streaming

### Scénario
Surveiller les logs d'une application en temps réel.

**1. Démarrer le monitoring:**
```json
{
  "tool": "execute_interactive_command",
  "params": {
    "command": "tail -f /var/log/myapp/app.log",
    "session_id": "log_monitor",
    "streaming": true,
    "timeout": 0
  }
}
```

**2. Récupérer les logs périodiquement:**
```json
{
  "tool": "get_session_state",
  "params": {
    "session_id": "log_monitor",
    "include_output": true
  }
}
```

PhoenixTerm détecte automatiquement les patterns dans les logs (erreurs, warnings, etc.)!

---

## 🔄 Exemple 7: Workflow de CI/CD Complet

### Template: full_ci_cd

```json
{
  "tool": "execute_template",
  "params": {
    "action": "save",
    "template_name": "full_ci_cd",
    "commands": [
      "git pull origin main",
      "npm ci",
      "npm run lint",
      "npm run test:unit",
      "npm run test:integration",
      "npm run build",
      "docker build -t myapp:latest .",
      "docker tag myapp:latest registry.com/myapp:{{version}}",
      "docker push registry.com/myapp:{{version}}",
      "kubectl set image deployment/myapp myapp=registry.com/myapp:{{version}}",
      "kubectl rollout status deployment/myapp"
    ]
  }
}
```

**Exécution avec retry automatique:**
```json
{
  "tool": "execute_template",
  "params": {
    "action": "execute",
    "template_name": "full_ci_cd",
    "parameters": {
      "version": "1.2.3"
    },
    "chain_mode": "sequential",
    "stop_on_error": true,
    "retry": true,
    "session_id": "ci_cd_pipeline"
  }
}
```

---

## 🧠 Exemple 8: L'Agent IA Autonome

### Scénario Complet
L'agent doit diagnostiquer et corriger un problème de serveur web.

**1. Vérifier l'état du service:**
```json
{
  "tool": "execute_interactive_command",
  "params": {
    "command": "systemctl status nginx"
  }
}
```

**Réponse:** `exit_code: 3` (service arrêté)

**2. Valider la commande de redémarrage:**
```json
{
  "tool": "validate_command",
  "params": {
    "command": "sudo systemctl restart nginx"
  }
}
```

**Réponse:** `safe: true` mais `requiresConfirmation: true`

**3. Redémarrer le service:**
```json
{
  "tool": "execute_interactive_command",
  "params": {
    "command": "sudo systemctl restart nginx",
    "expect_prompt": "password:",
    "input": "SecurePassword123",
    "retry": true
  }
}
```

**4. Vérifier les logs:**
```json
{
  "tool": "execute_interactive_command",
  "params": {
    "command": "journalctl -u nginx -n 50"
  }
}
```

**5. Tester la connectivité:**
```json
{
  "tool": "execute_interactive_command",
  "params": {
    "command": "curl -I http://localhost:80"
  }
}
```

**Réponse:** `HTTP/1.1 200 OK` → Problème résolu! ✅

---

## 🎯 Bonnes Pratiques

### 1. Toujours Valider les Commandes Critiques

```json
// ❌ BAD
{
  "command": "rm -rf /data",
  "validate": false
}

// ✅ GOOD
{
  "tool": "validate_command",
  "params": {
    "command": "rm -rf /data"
  }
}
// Puis décider si on exécute ou pas
```

### 2. Utiliser des Sessions Nommées

```json
// ❌ BAD - Tout dans "default"
{
  "command": "npm run dev",
  "session_id": "default"
}

// ✅ GOOD - Sessions descriptives
{
  "command": "npm run dev",
  "session_id": "dev_server_frontend"
}
```

### 3. Activer Retry pour les Opérations Réseau

```json
// ✅ GOOD
{
  "command": "git clone https://github.com/large/repo.git",
  "retry": true,
  "timeout": 300
}
```

### 4. Utiliser Templates pour les Workflows Récurrents

```json
// ✅ GOOD - Créer un template réutilisable
{
  "action": "save",
  "template_name": "deploy_microservice",
  "commands": [ ... ]
}
```

### 5. Streaming pour les Commandes Longues

```json
// ✅ GOOD
{
  "command": "npm install",
  "streaming": true
}
```

---

## 💡 Cas d'Usage Avancés

### Auto-Healing d'Infrastructure

L'agent détecte un problème → valide la solution → applique le fix → vérifie.

### Déploiement Multi-Environnements

Templates avec paramètres différents pour dev/staging/prod.

### Tests de Charge Automatisés

Lancer des tests de charge, monitorer, analyser les résultats.

### Backup & Restore Automatiques

Planifier des backups, vérifier leur intégrité, restaurer si nécessaire.

---

**🔥 PhoenixTerm - L'autonomie IA sans limites!**
