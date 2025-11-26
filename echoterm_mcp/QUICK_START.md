# 🚀 Quick Start - EchoTerm MCP

Pour les pressés, voici comment lancer EchoTerm en **3 étapes** :

---

## ⚡ Windows

### 1. Configurer l'API
```bash
# Copier l'exemple de config
copy app\backend_node\config.json.example app\backend_node\config.json

# Éditer config.json et ajouter votre clé API
notepad app\backend_node\config.json
```

### 2. Lancer
```bash
start.bat
```

C'est tout ! 🎉

---

## ⚡ Linux / macOS

### 1. Configurer l'API
```bash
# Copier l'exemple de config
cp app/backend_node/config.json.example app/backend_node/config.json

# Éditer config.json et ajouter votre clé API
nano app/backend_node/config.json
# ou
code app/backend_node/config.json
```

### 2. Lancer
```bash
chmod +x start.sh
./start.sh
```

C'est tout ! 🎉

---

## 🔑 Obtenir une clé API

### Claude (Recommandé)
1. Va sur https://console.anthropic.com
2. Créer un compte / se connecter
3. Aller dans "API Keys"
4. Créer une nouvelle clé
5. Copier la clé dans `config.json` :
   ```json
   {
     "provider": "claude",
     "apiKey": "sk-ant-VOTRE_CLE_ICI",
     "model": "claude-sonnet-4-5"
   }
   ```

### GPT (Alternative)
1. Va sur https://platform.openai.com
2. Créer un compte / se connecter
3. Aller dans "API Keys"
4. Créer une nouvelle clé
5. Dans `config.json` :
   ```json
   {
     "provider": "gpt",
     "apiKey": "sk-VOTRE_CLE_ICI",
     "model": "gpt-4"
   }
   ```

### Gemini (Alternative)
1. Va sur https://makersuite.google.com/app/apikey
2. Créer une clé API
3. Dans `config.json` :
   ```json
   {
     "provider": "gemini",
     "apiKey": "VOTRE_CLE_ICI",
     "model": "gemini-pro"
   }
   ```

---

## ✨ Utilisation ultra-rapide

### Commandes classiques
```
λ git status
λ npm install
λ python main.py
```

### Langage naturel
```
λ démarre tous les agents
λ find all python files
λ what's my ip address
```

### Suggestions IA
Commence à taper → l'IA suggère → clique sur la suggestion

### Raccourcis
- `Ctrl+L` : Clear terminal
- `↑ / ↓` : Historique
- `Ctrl+Space` : Force suggestion IA

---

## 🐛 Problèmes ?

### Le backend ne démarre pas
```bash
# Vérifie que le port 3737 est libre
netstat -ano | findstr :3737

# Ou change le port dans server.js
```

### L'IA ne répond pas
1. Vérifie ta clé API dans `config.json`
2. Vérifie ta connexion internet
3. Regarde les logs dans le terminal backend

### Electron ne se lance pas
```bash
cd app/electron
rm -rf node_modules
npm install
```

---

## 📚 Documentation complète

Voir [README.md](README.md) pour plus de détails.

---

**EchoTerm = Terminal + IA. Simple. Puissant. 🚀🧠**
