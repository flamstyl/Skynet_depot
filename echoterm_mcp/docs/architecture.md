# 🧠 EchoTerm MCP — Architecture Technique

**Version:** 1.0
**Date:** 2025-11-19
**Projet:** Skynet Augmented Terminal

---

## 📋 Vue d'ensemble

**EchoTerm MCP** est un terminal Windows augmenté par l'IA qui combine :
- Une interface Electron moderne et réactive
- Un backend Node.js gérant l'exécution shell et l'IA
- Une couche MCP pour l'intégration dans l'écosystème Skynet
- Un système de mémoire contextuel (court/long terme)
- Des alias en langage naturel
- Un historique enrichi par l'IA

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERFACE ELECTRON                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Terminal UI │  │ Suggestions  │  │ Panels (Hist,│      │
│  │              │  │  (AI Live)   │  │ Alias, Mem)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘               │
│                            │                                  │
│                      Preload (IPC)                           │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND NODE.JS                            │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Shell Runner │  │  IA Bridge   │  │Alias Engine  │      │
│  │              │  │              │  │              │      │
│  └──────────────┘  └──────┬───────┘  └──────────────┘      │
│                            │                                  │
│  ┌──────────────┐  ┌──────┴───────┐  ┌──────────────┐      │
│  │History Mgr   │  │ Memory Mgr   │  │ HTTP Server  │      │
│  │              │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      MCP LAYER                               │
│                                                               │
│  ┌──────────────┐           ┌──────────────┐                │
│  │ Echo Bridge  │───────────│ Skynet Sync  │                │
│  │              │           │              │                │
│  └──────────────┘           └──────────────┘                │
│                                                               │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                    ╔═══════════════════╗
                    ║ SKYNET ECOSYSTEM  ║
                    ║ (Echo, Agents,    ║
                    ║  RAG, etc.)       ║
                    ╚═══════════════════╝
```

---

## 🔄 Flux de données principal

### 1️⃣ Saisie de commande

```
Utilisateur tape → Terminal UI → IPC → Backend Server
                                           │
                                           ├─→ Shell Runner (exec)
                                           │
                                           └─→ IA Bridge (suggestion)
```

### 2️⃣ Suggestion IA en temps réel

```
Texte partiel → IA Bridge → API Claude/GPT/Gemini
                               │
                               ▼
                     ┌─────────────────┐
                     │ Prompt template │
                     │ + Memory ctx    │
                     │ + History ctx   │
                     └─────────────────┘
                               │
                               ▼
                     ┌─────────────────┐
                     │  - Commande     │
                     │  - Variante safe│
                     │  - Explication  │
                     └─────────────────┘
                               │
                               ▼
                      Suggestions UI ← affichage
```

### 3️⃣ Exécution shell

```
Commande validée → Shell Runner → child_process.spawn()
                                          │
                      ┌───────────────────┼───────────────────┐
                      │                   │                   │
                      ▼                   ▼                   ▼
                   stdout              stderr              exit code
                      │                   │                   │
                      └───────────────────┴───────────────────┘
                                          │
                                          ▼
                                  Terminal UI (stream)
                                          │
                                          ▼
                                  History Manager (log)
```

### 4️⃣ Alias naturel

```
"démarre tous les agents" → Alias Engine → IA Bridge
                                               │
                                               ▼
                                    ┌──────────────────┐
                                    │ natural_alias.md │
                                    └──────────────────┘
                                               │
                                               ▼
                              "python skynet_launcher.py --start-all"
                                               │
                                               ▼
                                  Enregistré dans aliases.json
                                               │
                                               ▼
                                   Affiché à l'utilisateur
                                   (confirm avant exec)
```

### 5️⃣ Mémoire et contexte

```
Session en cours → Memory Manager
                        │
                        ├─→ memory_short.json (contexte session)
                        │     - Commandes récentes
                        │     - Erreurs
                        │     - Objectifs
                        │
                        └─→ memory_long.json (profil utilisateur)
                              - Patterns fréquents
                              - Préférences
                              - Habitudes
```

### 6️⃣ Synchronisation Skynet (MCP)

```
Résumé session → MCP Server → Echo Bridge → Agent Echo
                                   │
                                   └─→ Skynet Sync → RAG / Drive central
```

---

## 📦 Modules détaillés

### 🟢 ELECTRON LAYER

#### `main.js`
- Point d'entrée Electron
- Crée la fenêtre principale
- Configure IPC handlers
- Gère le lifecycle de l'app

#### `preload.js`
- Bridge sécurisé entre Electron et le renderer
- Expose APIs via `contextBridge`
- APIs exposées :
  - `shellAPI.run(command)`
  - `iaAPI.suggest(text)`
  - `aliasAPI.resolve(text)`
  - `historyAPI.get()`
  - `memoryAPI.getSession()` / `getLongTerm()`

#### `index.html`
- Structure de l'UI
- 3 zones principales :
  - Terminal (input/output)
  - Suggestions IA (panneau droit)
  - Sidebar (historique, alias, mémoire)

#### `terminal_ui.js`
- Gestion input/output terminal
- Navigation historique (↑/↓)
- Autocomplétion basique
- Stream stdout/stderr

#### `suggestions_ui.js`
- Affichage suggestions IA temps réel
- Click-to-insert
- Badges de sécurité (safe/danger/complex)

#### `history_panel.js`
- Liste commandes passées
- Filtres (date, statut, type)
- Re-exécution rapide

#### `alias_panel.js`
- Liste alias définis
- Édition/suppression
- Création assistée par IA

#### `memory_panel.js`
- Mémoire courte (session actuelle)
- Mémoire longue (profil)
- Résumés IA

---

### 🔵 BACKEND NODE.JS

#### `server.js`
- Serveur HTTP/Express local (port 3737)
- Routes :
  - `POST /shell/run` → exécuter commande
  - `POST /ia/suggest` → obtenir suggestion
  - `POST /alias/resolve` → résoudre alias naturel
  - `GET /history/list` → récupérer historique
  - `GET /memory/session` → mémoire courte
  - `GET /memory/longterm` → mémoire longue
  - `POST /memory/update` → mise à jour mémoire

#### `shell_runner.js`
- Exécution commandes shell
- Support PowerShell, cmd, bash (WSL)
- Gestion encodage Windows
- Stream output (stdout/stderr)
- Timeout / kill process
- Retour JSON structuré :
  ```json
  {
    "stdout": "...",
    "stderr": "...",
    "exitCode": 0,
    "duration": 1234
  }
  ```

#### `ia_bridge.js`
- Connexion aux APIs IA :
  - Claude (Anthropic)
  - GPT (OpenAI)
  - Gemini (Google)
- Load prompts depuis `/ai_prompts/`
- Gestion contexte (mémoire + historique)
- Rate limiting / retry logic
- Configuration :
  ```json
  {
    "provider": "claude",
    "apiKey": "...",
    "model": "claude-sonnet-4-5",
    "maxTokens": 1024
  }
  ```

#### `alias_engine.js`
- Résolution alias naturel → commande
- Storage dans `data/aliases.json`
- Structure alias :
  ```json
  {
    "natural": "démarre tous les agents",
    "command": "python skynet_launcher.py --start-all",
    "description": "Lance tous les agents Skynet",
    "createdAt": "2025-11-19T10:30:00Z"
  }
  ```
- Utilise IA pour proposer nouvelles commandes

#### `memory_manager.js`
- Gestion mémoire courte (session)
- Gestion mémoire longue (profil)
- Enrichissement par IA
- Résumés périodiques
- Structure mémoire courte :
  ```json
  {
    "sessionId": "uuid",
    "startedAt": "2025-11-19T10:00:00Z",
    "commands": [...],
    "objectives": ["fix bug", "deploy"],
    "errors": [...],
    "summary": "IA-generated summary"
  }
  ```
- Structure mémoire longue :
  ```json
  {
    "userId": "user",
    "patterns": {
      "mostUsedCommands": ["git status", "npm run dev"],
      "frequentErrors": ["port already in use"],
      "workingHours": "09:00-18:00",
      "preferredShell": "powershell"
    },
    "preferences": {
      "aiProvider": "claude",
      "suggestionMode": "auto"
    }
  }
  ```

#### `history_manager.js`
- Stockage historique JSONL
- Chaque ligne = 1 commande :
  ```json
  {
    "timestamp": "2025-11-19T10:15:23Z",
    "command": "git status",
    "stdout": "...",
    "stderr": "",
    "exitCode": 0,
    "duration": 123,
    "aiLabel": "safe",
    "context": "checking repo status"
  }
  ```
- Recherche / filtres
- Export (CSV, JSON)

---

### 🟣 MCP LAYER

#### `server.js` (MCP)
- Serveur MCP standard
- Tools exposés :
  - `get_terminal_session` → résumé session en cours
  - `get_command_history` → historique commandes
  - `sync_memory` → échange mémoire avec autres agents
  - `push_to_echo` → envoyer événement à Echo

#### `echo_bridge.js`
- Connexion à l'agent Echo
- Envoi résumés session
- Réception insights Echo
- Synchronisation bidirectionnelle

#### `skynet_sync.js`
- Push données vers RAG central
- Sync avec Google Drive
- Partage contexte inter-agents

---

## 🔐 Sécurité

### Exécution commandes
- **Jamais d'auto-exec** : l'IA suggère, l'utilisateur valide
- **Badges de sécurité** :
  - 🟢 SAFE : commandes lecture seule
  - 🟡 COMPLEX : commandes avancées
  - 🔴 DANGER : commandes destructives (rm, format, etc.)
- **Preview** : affichage commande avant exécution

### API Keys
- Stockage sécurisé (config.json gitignored)
- Pas de transmission secrets à l'IA
- Chiffrement optionnel (future)

### Shell injection
- Validation input
- Escape caractères dangereux
- Whitelist commandes (optionnel)

---

## 🎨 UI/UX

### Design
- **Dark mode** par défaut
- **Thème Skynet** : violet/cyan/noir
- **Monospace font** : Consolas, Fira Code, JetBrains Mono
- **Syntax highlighting** : stdout/stderr différenciés

### Raccourcis clavier
- `Ctrl+L` : clear terminal
- `Ctrl+R` : recherche historique
- `↑/↓` : navigation historique
- `Tab` : autocomplétion
- `Ctrl+Space` : forcer suggestion IA
- `Ctrl+Enter` : accepter suggestion IA

### Panels
- **Toggleable** : masquer/afficher sidebar
- **Responsive** : adaptatif selon taille fenêtre
- **Drag & drop** : réorganisation panels

---

## 📊 Stockage données

### Fichiers JSON
- `data/aliases.json` : alias utilisateur
- `data/memory_short.json` : session en cours
- `data/memory_long.json` : profil utilisateur
- `app/backend_node/config.json` : configuration

### Fichiers JSONL
- `data/history/echoterm_history.jsonl` : historique complet (append-only)

### Future : SQLite
- Pour recherches complexes
- Indexation full-text
- Analytics

---

## 🚀 Performance

### Optimisations
- **Streaming** : output shell en temps réel (pas de buffer complet)
- **Debounce IA** : suggestions uniquement après 500ms pause
- **Cache suggestions** : réutilisation pour commandes similaires
- **Lazy loading** : historique chargé par chunks

### Limites
- Historique : max 10 000 commandes en mémoire
- Suggestions IA : max 3 variantes
- MCP sync : toutes les 5 minutes (configurable)

---

## 🔄 Workflow typique

1. **Démarrage** :
   - Electron lance `main.js`
   - Backend Node démarre (`server.js`)
   - MCP server démarre (optionnel)
   - Load mémoire longue + session précédente

2. **Utilisation** :
   - User tape commande
   - IA suggère en temps réel
   - User valide → exécution
   - Output streamé → UI
   - Historique + mémoire mis à jour

3. **Alias naturel** :
   - User tape phrase naturelle
   - Alias engine check aliases existants
   - Si absent → demande IA
   - Propose commande + sauvegarde

4. **Fin session** :
   - Résumé IA généré
   - Mémoire courte → mémoire longue (merge)
   - Push résumé vers Echo/Skynet (MCP)
   - Sauvegarde état

---

## 🛠️ Technologies

### Frontend
- **Electron** 27+
- **HTML5 / CSS3**
- **Vanilla JS** (pas de framework lourd)

### Backend
- **Node.js** 18+
- **Express** 4.x
- **child_process** (shell exec)
- **fs/promises** (async file ops)

### IA
- **Claude API** (Anthropic)
- **OpenAI API** (GPT)
- **Google Gemini API**
- **Fetch API** (HTTP requests)

### MCP
- **MCP SDK** (Model Context Protocol)
- **WebSocket** (communication temps réel)

---

## 📈 Évolutions futures

### v1.1
- Support bash/zsh (Linux/macOS)
- Themes personnalisables
- Export historique avancé

### v1.2
- Multi-tabs (plusieurs sessions simultanées)
- Collaboration temps réel (partage session)
- Snippets / macros

### v2.0
- Plugin system
- Marketplace extensions
- IA locale (Ollama, LM Studio)
- Voice commands

---

## 🎯 Objectifs clés

✅ **Productivité** : suggestions IA pertinentes, alias naturels
✅ **Sécurité** : pas d'auto-exec, preview commandes dangereuses
✅ **Mémoire** : contexte session + long terme
✅ **Intégration** : MCP → Skynet ecosystem
✅ **UX** : interface fluide, dark mode, raccourcis

---

**EchoTerm = Le terminal de demain, augmenté par l'IA, intégré à Skynet.**
