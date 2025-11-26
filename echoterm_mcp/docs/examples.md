# 🎯 EchoTerm MCP - Exemples d'utilisation

Ce document présente des exemples concrets d'utilisation d'EchoTerm MCP.

---

## 📝 Exemple 1 : Commande classique avec suggestions IA

### Scénario
L'utilisateur veut lister tous les fichiers Python dans son projet.

### Workflow

1. **L'utilisateur tape** (dans EchoTerm) :
   ```
   find python files
   ```

2. **L'IA suggère** (panneau suggestions) :
   ```json
   [
     {
       "command": "Get-ChildItem -Recurse -Filter *.py",
       "safety": "safe",
       "explanation": "Lists all Python files in current directory and subdirectories"
     },
     {
       "command": "dir /s /b *.py",
       "safety": "safe",
       "explanation": "CMD equivalent - shows full paths of all .py files"
     }
   ]
   ```

3. **L'utilisateur clique** sur la première suggestion

4. **La commande est insérée** dans le terminal :
   ```
   λ Get-ChildItem -Recurse -Filter *.py
   ```

5. **L'utilisateur appuie sur Entrée**

6. **Output affiché** :
   ```
   λ Get-ChildItem -Recurse -Filter *.py

       Directory: C:\Users\rapha\IA\skynet_depot

   Mode                 LastWriteTime         Length Name
   ----                 -------------         ------ ----
   -a---          19/11/2025    10:30           1523 main.py
   -a---          18/11/2025    15:22           3421 agent.py
   -a---          17/11/2025    09:15           892  utils.py

   Exit code: 0 | Duration: 156ms
   ```

7. **Historique enregistré** dans `data/history/echoterm_history.jsonl` :
   ```json
   {"timestamp":"2025-11-19T10:35:12Z","command":"Get-ChildItem -Recurse -Filter *.py","stdout":"...","stderr":"","exitCode":0,"duration":156,"aiLabel":"safe","context":"listing python files"}
   ```

---

## 🔖 Exemple 2 : Alias naturel

### Scénario
L'utilisateur veut créer un alias pour démarrer tous ses agents Skynet.

### Workflow

1. **L'utilisateur tape** :
   ```
   démarre tous les agents
   ```

2. **Alias Engine** détecte que ce n'est pas une commande shell standard

3. **IA Bridge** appelle l'API Claude avec le prompt `natural_alias.md`

4. **Claude répond** :
   ```json
   {
     "command": "python C:\\Users\\rapha\\IA\\skynet_launcher\\skynet_launcher.py --start-all",
     "description": "Lance tous les agents Skynet via le launcher",
     "alias": "start all agents"
   }
   ```

5. **EchoTerm affiche une confirmation** :
   ```
   Execute this command?

   python C:\Users\rapha\IA\skynet_launcher\skynet_launcher.py --start-all

   Description: Lance tous les agents Skynet via le launcher

   [OK] [Cancel]
   ```

6. **L'utilisateur clique OK**

7. **La commande s'exécute**

8. **L'alias est sauvegardé** dans `data/aliases.json` :
   ```json
   [
     {
       "natural": "démarre tous les agents",
       "command": "python C:\\Users\\rapha\\IA\\skynet_launcher\\skynet_launcher.py --start-all",
       "description": "Lance tous les agents Skynet via le launcher",
       "createdAt": "2025-11-19T10:40:00Z"
     }
   ]
   ```

9. **Prochaine fois**, taper `démarre tous les agents` → exécution directe (après confirmation)

---

## 🧠 Exemple 3 : Mémoire de session

### Scénario
L'utilisateur travaille sur un projet, rencontre des erreurs, et veut un résumé en fin de session.

### Workflow

1. **Commandes exécutées** :
   ```
   λ git clone https://github.com/user/project.git
   λ cd project
   λ npm install
   ❌ Exit code: 1 | network timeout

   λ npm install
   ✅ Exit code: 0

   λ npm run dev
   ❌ Exit code: 1 | port 3000 already in use

   λ npm run dev -- --port 3001
   ✅ Exit code: 0
   ```

2. **Mémoire de session mise à jour** automatiquement :
   ```json
   {
     "sessionId": "a3b2c1d4-...",
     "startedAt": "2025-11-19T14:00:00Z",
     "commands": [
       {"command": "git clone ...", "exitCode": 0},
       {"command": "cd project", "exitCode": 0},
       {"command": "npm install", "exitCode": 1},
       {"command": "npm install", "exitCode": 0},
       {"command": "npm run dev", "exitCode": 1},
       {"command": "npm run dev -- --port 3001", "exitCode": 0}
     ],
     "objectives": ["setup new project"],
     "errors": [
       {"command": "npm install", "stderr": "network timeout"},
       {"command": "npm run dev", "stderr": "port 3000 already in use"}
     ],
     "summary": ""
   }
   ```

3. **L'utilisateur clique** "📝 Summary" dans l'en-tête

4. **Backend génère un résumé IA** via `session_summary.md`

5. **Claude répond** :
   ```
   ## Session Summary

   ### Overview
   Successfully set up new project after resolving npm and port conflict issues. Session lasted 45m with 6 commands executed.

   ### Key Activities
   - Cloned project repository from GitHub
   - Resolved npm installation network timeout by retrying
   - Fixed port conflict by using alternative port 3001
   - Successfully started development server

   ### Issues Encountered
   - npm install failed once due to network timeout (resolved on retry)
   - npm run dev failed due to port 3000 already in use (resolved with --port 3001)

   ### Recommendations
   - Consider using a local npm registry mirror to avoid network timeouts
   - Add port configuration to package.json to avoid future conflicts
   - Project is ready for development
   ```

6. **Le résumé est affiché** à l'utilisateur

7. **Mémoire de session mise à jour** avec le résumé

8. **À la fermeture d'EchoTerm**, la session est fusionnée dans la mémoire long terme :
   - `npm install` et `npm run dev` ajoutés aux commandes les plus utilisées
   - Pattern d'erreur "port already in use" ajouté aux erreurs fréquentes

---

## ⚠️ Exemple 4 : Détection de commande dangereuse

### Scénario
L'utilisateur tape une commande potentiellement destructive.

### Workflow

1. **L'utilisateur tape** :
   ```
   del /s /q C:\temp\*
   ```

2. **IA détecte le danger** :
   ```json
   [
     {
       "command": "Get-ChildItem -Path C:\\temp -Recurse | Remove-Item -WhatIf",
       "safety": "complex",
       "explanation": "SAFE preview - shows what would be deleted without actually deleting"
     },
     {
       "command": "del /s /q C:\\temp\\*",
       "safety": "danger",
       "explanation": "⚠️ DESTRUCTIVE - permanently deletes all files in C:\\temp"
     }
   ]
   ```

3. **Panneau suggestions affiche** :
   - 🔴 DANGER badge sur la commande originale
   - 🟡 COMPLEX badge sur la variante sûre

4. **Si l'utilisateur exécute quand même** :
   - Confirmation popup supplémentaire :
     ```
     ⚠️ WARNING: This command is DESTRUCTIVE

     del /s /q C:\temp\*

     This will permanently delete files.

     Are you sure?

     [I understand the risk, proceed] [Cancel]
     ```

---

## 📊 Exemple 5 : Historique enrichi

### Fichier `data/history/echoterm_history.jsonl`

```jsonl
{"timestamp":"2025-11-19T10:15:23Z","command":"git status","stdout":"On branch main\nYour branch is up to date...","stderr":"","exitCode":0,"duration":123,"aiLabel":"safe","context":"checking repo status"}
{"timestamp":"2025-11-19T10:16:45Z","command":"git add .","stdout":"","stderr":"","exitCode":0,"duration":89,"aiLabel":"safe","context":"staging changes"}
{"timestamp":"2025-11-19T10:17:12Z","command":"git commit -m \"add feature\"","stdout":"[main abc123] add feature\n 2 files changed...","stderr":"","exitCode":0,"duration":234,"aiLabel":"safe","context":"committing changes"}
{"timestamp":"2025-11-19T10:17:30Z","command":"git push","stdout":"Enumerating objects...\nCounting objects...","stderr":"","exitCode":0,"duration":1523,"aiLabel":"safe","context":"pushing to remote"}
{"timestamp":"2025-11-19T10:20:15Z","command":"npm run build","stdout":"> build\n> webpack...","stderr":"","exitCode":0,"duration":15234,"aiLabel":"complex","context":"building project"}
```

### Visualisation dans l'UI

**Panneau History** affiche :

```
┌─────────────────────────────────────────┐
│ 📜 Command History                      │
│ ┌─────────────────────────────────────┐ │
│ │ git push                        🟢  │ │
│ │ 5m ago                              │ │
│ ├─────────────────────────────────────┤ │
│ │ git commit -m "add feature"     🟢  │ │
│ │ 6m ago                              │ │
│ ├─────────────────────────────────────┤ │
│ │ git add .                       🟢  │ │
│ │ 7m ago                              │ │
│ ├─────────────────────────────────────┤ │
│ │ git status                      🟢  │ │
│ │ 8m ago                              │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Cliquer sur une entrée** → commande insérée dans le terminal

---

## 🔗 Exemple 6 : Intégration MCP avec Echo

### Scénario
EchoTerm envoie un résumé de session à l'agent Echo pour analyse réflexive.

### Workflow

1. **Session terminée**, résumé généré :
   ```
   Session Summary: User worked on bug fixes for 2h, executed 34 commands, encountered 2 errors (both resolved).
   ```

2. **MCP activé** dans `config.mcp.json` :
   ```json
   {
     "enabled": true,
     "echoAgentUrl": "http://localhost:4000"
   }
   ```

3. **Backend appelle** `echo_bridge.pushToEcho()` :
   ```javascript
   await echoBridge.pushToEcho(sessionSummary, ['terminal', 'skynet', 'bug-fix']);
   ```

4. **Requête HTTP vers Echo** :
   ```http
   POST http://localhost:4000/api/ingest
   Content-Type: application/json

   {
     "source": "echoterm_mcp",
     "type": "terminal_session_summary",
     "content": "Session Summary: User worked on bug fixes...",
     "tags": ["terminal", "skynet", "bug-fix"],
     "timestamp": "2025-11-19T16:30:00Z"
   }
   ```

5. **Echo répond** :
   ```json
   {
     "success": true,
     "messageId": "echo_msg_123",
     "reflection": "User is actively debugging. Consider suggesting automated testing to prevent future bugs."
   }
   ```

6. **EchoTerm peut ensuite demander des insights** :
   ```javascript
   await echoBridge.getInsightsFromEcho({ topic: 'debugging' });
   ```

7. **Echo répond avec des conseils** basés sur l'historique global de l'utilisateur

---

## 🎓 Cas d'usage réels

### Use Case 1 : Développeur fullstack
- Commandes fréquentes : `git`, `npm`, `docker`, `python`
- Alias créés :
  - `"lance le backend"` → `python backend/manage.py runserver`
  - `"démarre docker"` → `docker-compose up -d`
  - `"build front"` → `cd frontend && npm run build`

### Use Case 2 : Data scientist
- Commandes fréquentes : `python`, `jupyter`, `conda`
- Alias créés :
  - `"active env"` → `conda activate ml_env`
  - `"lance notebook"` → `jupyter notebook`
  - `"train model"` → `python scripts/train.py --config config.yml`

### Use Case 3 : DevOps
- Commandes fréquentes : `kubectl`, `docker`, `terraform`, `ansible`
- Alias créés :
  - `"check pods"` → `kubectl get pods -A`
  - `"deploy staging"` → `kubectl apply -f k8s/staging/`
  - `"tail logs"` → `kubectl logs -f deployment/app --tail=100`

---

## 📈 Statistiques d'exemple

Après 1 mois d'utilisation, `history_manager.getStatistics()` pourrait retourner :

```json
{
  "totalCommands": 2847,
  "successCount": 2654,
  "errorCount": 193,
  "successRate": "93.22%",
  "topCommands": [
    {"command": "git", "count": 523},
    {"command": "npm", "count": 412},
    {"command": "python", "count": 387},
    {"command": "docker", "count": 234},
    {"command": "cd", "count": 189},
    {"command": "ls", "count": 156},
    {"command": "Get-ChildItem", "count": 134},
    {"command": "code", "count": 98},
    {"command": "curl", "count": 76},
    {"command": "ssh", "count": 64}
  ]
}
```

---

## 🚀 Conclusion

EchoTerm MCP transforme le terminal Windows en un assistant intelligent qui :
- **Suggère** des commandes pertinentes
- **Apprend** de vos habitudes
- **Protège** contre les erreurs
- **Mémorise** votre contexte
- **S'intègre** à l'écosystème Skynet

**C'est ton terminal, mais en mieux. Augmenté par l'IA. 🧠✨**
