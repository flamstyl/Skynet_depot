# 🧠 EchoTerm MCP - Skynet Augmented Terminal

**Le terminal Windows augmenté par l'IA, intégré à l'écosystème Skynet.**

---

## 📖 Qu'est-ce que c'est ?

**EchoTerm MCP** est un terminal moderne pour Windows qui combine :

✨ **Interface Electron** - UI fluide et réactive, dark mode Skynet
🤖 **Suggestions IA** - Claude/GPT/Gemini suggèrent des commandes en temps réel
🔖 **Alias naturels** - Tape en langage humain, EchoTerm traduit en commandes shell
🧠 **Mémoire contextuelle** - Se souvient de tes sessions (court et long terme)
📜 **Historique enrichi** - Tous tes commandes, analysées et taggées par l'IA
🔗 **Intégration MCP** - Se connecte à Echo et aux autres agents Skynet

---

## 🎯 Pourquoi EchoTerm ?

### Problème
Les terminaux classiques (cmd, PowerShell) sont :
- Pas intuitifs pour les non-experts
- Pas de suggestions intelligentes
- Pas de mémoire contextuelle
- Pas d'intégration avec des agents IA

### Solution
EchoTerm résout tout ça :
- **Suggestions IA en temps réel** - L'IA comprend ce que tu veux faire
- **Alias naturels** - "démarre tous les agents" → commande shell
- **Mémoire de session** - EchoTerm se souvient de ton contexte
- **Protection** - Détecte les commandes dangereuses avant exécution
- **Intégration Skynet** - Partage ton contexte avec Echo et autres agents

---

## 🚀 Installation

### Prérequis

- **Node.js** 18+ ([télécharger](https://nodejs.org))
- **npm** ou **yarn**
- **Windows** 10/11 (PowerShell ou cmd)
- **Clé API IA** (Claude, GPT, ou Gemini)

### Étape 1 : Cloner le repo

```bash
git clone https://github.com/votre-org/echoterm_mcp.git
cd echoterm_mcp
```

### Étape 2 : Installer les dépendances

**Backend Node.js :**
```bash
cd app/backend_node
npm install
```

**Electron :**
```bash
cd ../electron
npm install
```

**MCP (optionnel) :**
```bash
cd ../mcp
npm install
```

### Étape 3 : Configuration

**1. Configuration du backend**

Éditer `app/backend_node/config.json` :

```json
{
  "provider": "claude",
  "apiKey": "VOTRE_CLE_API_CLAUDE",
  "model": "claude-sonnet-4-5",
  "maxTokens": 1024
}
```

**Options de provider :**
- `"claude"` - Anthropic Claude (recommandé)
- `"gpt"` - OpenAI GPT-4
- `"gemini"` - Google Gemini

**2. Configuration MCP (optionnel)**

Si tu veux activer l'intégration Skynet, éditer `app/mcp/config.mcp.json` :

```json
{
  "enabled": true,
  "echoAgentUrl": "http://localhost:4000",
  "skynetHubUrl": "http://localhost:5000"
}
```

### Étape 4 : Lancer EchoTerm

**Démarrer le backend :**
```bash
cd app/backend_node
npm start
```

Le backend démarre sur `http://localhost:3737`

**Dans un autre terminal, démarrer Electron :**
```bash
cd app/electron
npm start
```

**EchoTerm s'ouvre !** 🎉

---

## 🎮 Utilisation

### Commandes classiques

Tape n'importe quelle commande PowerShell/cmd :

```powershell
λ git status
λ npm install
λ python main.py
λ dir /s /b *.txt
```

### Suggestions IA

Commence à taper → l'IA suggère :

```
Tape: "find all python"

Suggestions IA :
🟢 SAFE
Get-ChildItem -Recurse -Filter *.py
Lists all Python files in current directory and subdirectories

🟢 SAFE
dir /s /b *.py
CMD equivalent - shows full paths of all .py files
```

**Clique sur une suggestion** → elle s'insère dans le terminal

### Alias naturels

Tape en langage naturel :

```
λ démarre tous les agents
```

EchoTerm demande confirmation :

```
Execute this command?

python C:\Users\rapha\IA\skynet_launcher\skynet_launcher.py --start-all

Description: Lance tous les agents Skynet via le launcher

[OK] [Cancel]
```

Clique **OK** → la commande s'exécute et l'alias est sauvegardé.

**Prochaine fois**, même phrase → exécution immédiate (après confirmation).

### Créer un alias manuellement

Panneau **Alias** → Bouton **+ New** :

1. Phrase naturelle : `"lance le serveur de dev"`
2. Commande shell : `npm run dev -- --port 3001`
3. Description : `Démarre le serveur de développement sur le port 3001`
4. **Save**

### Historique

Panneau **History** :
- Liste toutes tes commandes passées
- Indicateur de statut (✅ succès / ❌ erreur)
- **Recherche** : filtre par mot-clé
- **Click** sur une entrée → re-exécution

### Mémoire de session

Panneau **Memory** :
- **Current Session** : résumé de la session en cours
- **Long-term Memory** : patterns, préférences, habitudes

Bouton **📝 Summary** (en-tête) → génère un résumé IA de ta session.

### Raccourcis clavier

- `Enter` : Exécuter commande
- `↑ / ↓` : Naviguer dans l'historique
- `Ctrl+L` : Clear terminal
- `Ctrl+Space` : Forcer suggestion IA
- `Ctrl+Enter` : Accepter suggestion IA

---

## 🔧 Configuration avancée

### Changer de provider IA

**Pour utiliser GPT au lieu de Claude :**

`app/backend_node/config.json` :
```json
{
  "provider": "gpt",
  "apiKey": "sk-...",
  "model": "gpt-4",
  "maxTokens": 1024
}
```

**Variables d'environnement (alternative) :**
```bash
set ANTHROPIC_API_KEY=sk-ant-...
set OPENAI_API_KEY=sk-...
set GOOGLE_API_KEY=...
```

### Personnaliser les prompts IA

Les prompts sont dans `ai_prompts/` :

- `suggest_command.md` - Suggestions de commandes
- `natural_alias.md` - Résolution alias naturels
- `session_summary.md` - Résumés de session
- `context_enricher.md` - Enrichissement contextuel

Tu peux les éditer pour adapter l'IA à tes besoins.

### Activer l'intégration Skynet (MCP)

**1. Démarrer le serveur MCP :**
```bash
cd app/mcp
npm start
```

Le serveur MCP démarre sur `http://localhost:3738`

**2. Activer dans la config :**

`app/mcp/config.mcp.json` :
```json
{
  "enabled": true,
  "echoAgentUrl": "http://localhost:4000",
  "tools": {
    "push_to_echo": {
      "enabled": true
    }
  }
}
```

**3. Maintenant EchoTerm peut :**
- Envoyer des résumés de session à Echo
- Recevoir des insights de Echo
- Syncer la mémoire avec autres agents Skynet
- Pusher l'historique vers le RAG central

---

## 📁 Structure du projet

```
echoterm_mcp/
├── app/
│   ├── electron/          # Interface Electron
│   │   ├── main.js
│   │   ├── preload.js
│   │   ├── src/
│   │   │   ├── index.html
│   │   │   ├── css/style.css
│   │   │   └── js/
│   │   │       ├── terminal_ui.js
│   │   │       ├── suggestions_ui.js
│   │   │       ├── history_panel.js
│   │   │       ├── alias_panel.js
│   │   │       └── memory_panel.js
│   │   └── package.json
│   ├── backend_node/      # Backend Node.js
│   │   ├── server.js
│   │   ├── shell_runner.js
│   │   ├── ia_bridge.js
│   │   ├── alias_engine.js
│   │   ├── memory_manager.js
│   │   ├── history_manager.js
│   │   ├── config.json
│   │   └── package.json
│   └── mcp/               # MCP Layer
│       ├── server.js
│       ├── tools/
│       │   ├── echo_bridge.js
│       │   └── skynet_sync.js
│       ├── config.mcp.json
│       └── package.json
├── data/                  # Données persistantes
│   ├── history/
│   │   └── echoterm_history.jsonl
│   ├── aliases.json
│   ├── memory_short.json
│   └── memory_long.json
├── ai_prompts/            # Templates prompts IA
│   ├── suggest_command.md
│   ├── natural_alias.md
│   ├── session_summary.md
│   └── context_enricher.md
├── docs/                  # Documentation
│   ├── architecture.md
│   └── examples.md
└── README.md
```

---

## 🤝 Intégration avec Skynet

### Avec Echo (Agent réflexif)

```javascript
// Envoyer un résumé de session à Echo
POST http://localhost:3738/mcp/tools/push_to_echo
{
  "summary": "User worked on bug fixes, 34 commands, 2 errors resolved",
  "tags": ["debugging", "terminal"]
}
```

### Avec RAG (Base de connaissances)

```javascript
// Pusher l'historique vers le RAG
POST http://localhost:3738/mcp/tools/sync_memory
{
  "targetAgent": "rag_system",
  "memoryType": "history"
}
```

### Avec Google Drive

```javascript
// Sauvegarder la session sur Drive
// (via Skynet Hub)
```

---

## 🛡️ Sécurité

### Commandes dangereuses

EchoTerm détecte et signale les commandes dangereuses :

- `rm -rf /`
- `del /s /q C:\`
- `format C:`
- etc.

**Badge 🔴 DANGER** dans les suggestions + confirmation supplémentaire.

### API Keys

- Jamais dans le code
- Stockées dans `config.json` (gitignored)
- Ou dans variables d'environnement

### Pas d'auto-exec

L'IA **suggère**, l'utilisateur **valide**. Jamais d'exécution automatique sans confirmation.

---

## 🐛 Dépannage

### Le backend ne démarre pas

```bash
# Vérifier que le port 3737 est libre
netstat -ano | findstr :3737

# Si occupé, tuer le processus
taskkill /F /PID <PID>
```

### L'IA ne répond pas

1. Vérifier que la clé API est correcte dans `config.json`
2. Vérifier la connexion internet
3. Vérifier les logs dans la console backend

### Electron ne se lance pas

```bash
# Réinstaller les dépendances
cd app/electron
rm -rf node_modules package-lock.json
npm install
```

### L'historique ne se sauvegarde pas

Vérifier les permissions du dossier `data/history/`.

---

## 📊 Performance

### Optimisations

- **Streaming** : output shell en temps réel
- **Debounce** : suggestions IA après 500ms pause
- **Cache** : suggestions réutilisées pour commandes similaires
- **Lazy loading** : historique chargé par chunks

### Limites

- Historique : max 10 000 commandes en mémoire
- Suggestions : max 3 variantes par requête
- Timeout shell : 30s par défaut

---

## 🎨 Personnalisation

### Thème

Éditer `app/electron/src/css/style.css` :

```css
:root {
  --color-primary: #8b5cf6; /* Violet */
  --color-secondary: #06b6d4; /* Cyan */
  --color-accent: #ec4899; /* Pink */
}
```

### Font

```css
:root {
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

---

## 🚧 Roadmap

### v1.1 (Prochaine version)

- [ ] Support Linux/macOS (bash, zsh)
- [ ] Themes personnalisables (light mode, etc.)
- [ ] Export historique (CSV, JSON, PDF)
- [ ] Statistiques avancées

### v1.2

- [ ] Multi-tabs (plusieurs sessions simultanées)
- [ ] Collaboration temps réel (partage session)
- [ ] Snippets / macros
- [ ] Voice commands

### v2.0

- [ ] Plugin system
- [ ] Marketplace extensions
- [ ] IA locale (Ollama, LM Studio)
- [ ] Mobile companion app

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le repo
2. Crée une branche (`git checkout -b feature/amazing-feature`)
3. Commit tes changements (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvre une Pull Request

---

## 📄 Licence

MIT License - voir [LICENSE](LICENSE) pour détails.

---

## 💬 Support

- **Issues** : [GitHub Issues](https://github.com/votre-org/echoterm_mcp/issues)
- **Discussions** : [GitHub Discussions](https://github.com/votre-org/echoterm_mcp/discussions)
- **Discord** : [Skynet Community](https://discord.gg/skynet)

---

## 🙏 Remerciements

- **Anthropic** pour Claude API
- **OpenAI** pour GPT API
- **Google** pour Gemini API
- **Electron** pour le framework
- **Skynet Team** pour l'écosystème

---

## 📸 Captures d'écran

### Interface principale
![EchoTerm Main UI](docs/screenshots/main_ui.png)

### Suggestions IA
![AI Suggestions](docs/screenshots/suggestions.png)

### Historique
![History Panel](docs/screenshots/history.png)

---

**EchoTerm MCP - Le terminal de demain, aujourd'hui. 🚀🧠**

Built with 💜 by the Skynet Team
