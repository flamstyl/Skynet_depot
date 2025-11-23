# ⚡ Quick Start Guide

> Démarrage rapide pour MCP Workspace

## 📍 Tu es ici

Tu as maintenant un **monorepo complet** avec 2 MCP Servers professionnels :

```
/home/user/Skynet_depot/mcp-workspace/
├── packages/
│   ├── devops-workspace/    ← 40+ tools DevOps/Admin
│   └── lmstudio-gmail/      ← 10 tools Gmail + LM Studio
├── scripts/
│   ├── install-devops.sh
│   └── install-gmail.sh
└── README.md                ← Documentation principale
```

---

## 🚀 Installation en 3 étapes

### 1️⃣ Installe les dépendances

```bash
cd /home/user/Skynet_depot/mcp-workspace
npm install
```

### 2️⃣ Build les packages

```bash
# Build tout
npm run build

# Ou build un seul package
npm run build -w packages/devops-workspace
npm run build -w packages/lmstudio-gmail
```

### 3️⃣ Configure Claude Code

**Option A : Script automatique**

```bash
# DevOps Workspace
bash scripts/install-devops.sh

# LM Studio Gmail
bash scripts/install-gmail.sh
```

**Option B : Manuel**

Ajoute dans `~/.claude.json` :

```json
{
  "mcpServers": {
    "devops-workspace": {
      "command": "node",
      "args": ["/home/user/Skynet_depot/mcp-workspace/packages/devops-workspace/dist/index.js"],
      "type": "stdio"
    },
    "lmstudio-gmail": {
      "command": "node",
      "args": ["/home/user/Skynet_depot/mcp-workspace/packages/lmstudio-gmail/dist/index.js"],
      "type": "stdio",
      "env": {
        "LMSTUDIO_BASE_URL": "http://localhost:1234/v1"
      }
    }
  }
}
```

---

## 🧪 Test rapide

### Test DevOps Workspace

```bash
cd packages/devops-workspace
node dist/index.js
```

**Depuis Claude Code :**

```
User → AI : "Liste mes containers Docker"
AI → list_containers()
```

### Test LM Studio Gmail

**Prérequis :**
1. LM Studio lancé avec serveur actif (http://localhost:1234)
2. Gmail OAuth configuré (voir ci-dessous)

```bash
cd packages/lmstudio-gmail

# Setup OAuth (première fois seulement)
npm run setup-oauth

# Lance le serveur
node dist/index.js
```

**Depuis Claude Code :**

```
User → AI : "Résume mes mails non lus"
AI → gmail_list_threads(label="UNREAD")
AI → lmstudio_summarize_thread(...)
```

---

## 📧 Configuration Gmail (LM Studio Gmail)

### 1. Crée un projet Google Cloud

1. Va sur [console.cloud.google.com](https://console.cloud.google.com)
2. Crée un nouveau projet
3. Active **Gmail API**

### 2. Crée des credentials OAuth 2.0

1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth client ID**
3. Application type : **Desktop app**
4. Télécharge le JSON

### 3. Place le fichier credentials

```bash
# Crée le dossier auth
mkdir -p packages/lmstudio-gmail/auth

# Copie le fichier téléchargé
cp ~/Downloads/client_secret_*.json packages/lmstudio-gmail/auth/credentials.json
```

### 4. Autorise l'application

```bash
cd packages/lmstudio-gmail
npm run setup-oauth
```

→ Ouvre le lien dans ton navigateur
→ Autorise l'application
→ Copie le code d'autorisation
→ Les tokens seront sauvés dans `auth/tokens.json`

✅ **C'est prêt !**

---

## 🎯 Exemples d'utilisation

### DevOps Workspace

**Créer un nouveau projet Python :**

```
User : "Crée un projet Python appelé 'my-api' avec venv"

AI utilise :
→ create_project(name="my-api", type="python")
→ setup_python_env(projectPath="/home/user/projects/my-api")
→ git_init(path="/home/user/projects/my-api")

Résultat : Projet prêt en 10 secondes
```

**Monitorer le système :**

```
User : "Check la santé de mon serveur"

AI utilise :
→ get_system_info()
→ get_resource_usage()
→ list_services()

Résultat : Rapport complet (CPU, RAM, services)
```

### LM Studio Gmail

**Inbox Zero assisté :**

```
User : "Résume mes mails du jour et classe-les"

AI utilise :
→ lmstudio_daily_digest()
→ Pour chaque mail :
  → lmstudio_classify_email(...)
  → gmail_apply_labels(...)

Résultat : Digest + mails classés automatiquement
```

**Générer une réponse :**

```
User : "Réponds à l'email de Jean de manière amicale"

AI utilise :
→ gmail_search(query="from:jean")
→ lmstudio_propose_reply(threadId="...", style="friendly")
→ gmail_create_draft(...)

Résultat : Brouillon prêt à relire dans Gmail
```

---

## 🛠️ Commandes utiles

### Development

```bash
# Watch mode (rebuild auto)
npm run dev:devops
npm run dev:gmail

# Linter
npm run lint

# Tests
npm run test
```

### Production

```bash
# Build optimisé
npm run build

# Logs
tail -f /tmp/mcp-devops-workspace.log
tail -f /tmp/mcp-lmstudio-gmail.log
```

---

## 🐛 Troubleshooting

### DevOps Workspace

**Erreur : "Docker socket not found"**
```bash
# Vérifie Docker
docker ps

# Ajoute l'user au groupe docker
sudo usermod -aG docker $USER
newgrp docker
```

**Erreur : "ImageMagick non disponible"**
```bash
sudo apt install imagemagick
```

### LM Studio Gmail

**Erreur : "LM Studio non disponible"**
```bash
# Teste la connexion
curl http://localhost:1234/v1/models

# Lance LM Studio → Local Server → Start Server
```

**Erreur : "Tokens OAuth introuvables"**
```bash
cd packages/lmstudio-gmail
npm run setup-oauth
```

**Erreur : "Gmail API quota exceeded"**
→ Attends 1 minute (limite : 250 req/s/user)

---

## 📚 Ressources

- **Documentation principale** : [README.md](README.md)
- **DevOps Workspace** : [packages/devops-workspace/README.md](packages/devops-workspace/README.md)
- **LM Studio Gmail** : [packages/lmstudio-gmail/README.md](packages/lmstudio-gmail/README.md)
- **Roadmap** : [docs/BRAINSTORMING.md](docs/BRAINSTORMING.md)

---

## ❤️ Support

- 🐛 **Bug ?** → Ouvre une issue GitHub
- 💡 **Idée ?** → Contribue au brainstorming
- ⭐ **Satisfait ?** → Star le repo !

---

**Tu es prêt à utiliser Claude comme un vrai DevOps + Email Assistant !** 🚀
