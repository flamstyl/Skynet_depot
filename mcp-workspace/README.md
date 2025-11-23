# 🚀 MCP Workspace

> **Collection de MCP Servers** pour Claude Code : DevOps, Gmail, et plus encore

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)

## 📦 Packages inclus

Ce monorepo contient **2 MCP Servers** professionnels et prêts à l'emploi :

### 1. 🛠️ **DevOps Workspace** (`packages/devops-workspace`)

**Assistant DevOps/Admin Linux complet pour Claude**

- 🔧 **dev_env** : Gestion environnements Python/Node.js
- 🐳 **docker_admin** : Administration Docker complète
- ⚙️ **server_admin** : Monitoring système + services systemd
- 📁 **project_ops** : Fichiers + Git
- 🎨 **graphics_tools** : Traitement d'images (ImageMagick)

**40+ tools MCP** | [Documentation →](packages/devops-workspace/README.md)

---

### 2. 📧 **LM Studio Gmail** (`packages/lmstudio-gmail`)

**Assistant email intelligent avec IA locale**

Combine **LM Studio** (LLM local) + **Gmail API** pour :
- 📖 Résumer emails et threads
- ✍️ Générer brouillons de réponses
- 🏷️ Classifier automatiquement
- 📊 Digests quotidiens
- 🔍 Recherche sémantique

**10 tools MCP** | [Documentation →](packages/lmstudio-gmail/README.md)

---

## 🎯 Pourquoi ce projet ?

Ces MCP transforment Claude Code en un véritable **assistant DevOps + Email** :

✅ **Privacy-first** : LM Studio = IA 100% locale (pas de cloud)
✅ **Production-ready** : Code TypeScript strict, gestion d'erreurs, logs
✅ **Sécurisé** : Validation inputs, rate limiting, OAuth2
✅ **Modulaire** : Choisis ce dont tu as besoin

## 🚀 Installation rapide

### Prérequis

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Claude Code CLI** installé

### Installation complète

```bash
# Clone le repo
git clone https://github.com/flamstyl/mcp-workspace.git
cd mcp-workspace

# Installe toutes les dépendances
npm install

# Build tous les packages
npm run build

# Installe DevOps Workspace
bash scripts/install-devops.sh

# Installe LM Studio Gmail
bash scripts/install-gmail.sh
```

### Installation sélective

```bash
# Seulement DevOps Workspace
cd packages/devops-workspace
npm install && npm run build

# Seulement LM Studio Gmail
cd packages/lmstudio-gmail
npm install && npm run build
```

## ⚙️ Configuration Claude Code

Ajoute dans `~/.claude.json` :

```json
{
  "mcpServers": {
    "devops-workspace": {
      "command": "node",
      "args": ["/path/to/mcp-workspace/packages/devops-workspace/dist/index.js"],
      "type": "stdio"
    },
    "lmstudio-gmail": {
      "command": "node",
      "args": ["/path/to/mcp-workspace/packages/lmstudio-gmail/dist/index.js"],
      "type": "stdio",
      "env": {
        "LMSTUDIO_BASE_URL": "http://localhost:1234/v1"
      }
    }
  }
}
```

Ou via CLI :

```bash
claude mcp add devops-workspace --scope local
claude mcp add lmstudio-gmail --scope local
```

## 💡 Cas d'usage

### Scénario 1 : Gestion de projet full-stack

```
User → AI : "Crée un nouveau projet Python avec Docker"

AI utilise :
→ create_project(name="my-api", type="python")
→ setup_python_env(projectPath="/projects/my-api")
→ git_init(path="/projects/my-api")
→ docker_compose_up(composePath="/projects/my-api/docker-compose.yml")

Résultat : Projet prêt en 30 secondes
```

### Scénario 2 : Inbox Zero assisté par IA

```
User → AI : "Résume mes mails et réponds à Jean"

AI utilise :
→ lmstudio_daily_digest()
→ gmail_search(query="from:jean")
→ lmstudio_propose_reply(threadId="...")
→ gmail_create_draft(...)

Résultat : Digest + brouillon prêt à relire
```

### Scénario 3 : DevOps automation

```
User → AI : "Check la santé de mon serveur et redémarre nginx si besoin"

AI utilise :
→ get_system_info()
→ get_resource_usage()
→ service_status(name="nginx")
→ restart_service(name="nginx", confirm=true)

Résultat : Rapport complet + actions
```

## 🏗️ Architecture

```
mcp-workspace/
├── packages/
│   ├── devops-workspace/          # MCP 1 : DevOps Tools
│   │   ├── src/
│   │   │   ├── tools/
│   │   │   │   ├── dev_env/
│   │   │   │   ├── docker_admin/
│   │   │   │   ├── server_admin/
│   │   │   │   ├── project_ops/
│   │   │   │   └── graphics_tools/
│   │   │   ├── services/
│   │   │   └── models/
│   │   └── README.md
│   │
│   └── lmstudio-gmail/            # MCP 2 : LM Studio + Gmail
│       ├── src/
│       │   ├── tools/
│       │   │   ├── gmail/
│       │   │   └── lmstudio/
│       │   ├── services/
│       │   └── models/
│       └── README.md
│
├── scripts/
│   ├── install-devops.sh
│   └── install-gmail.sh
│
├── docs/                          # Documentation détaillée
├── package.json                   # Workspace root
└── README.md                      # Ce fichier
```

## 🧪 Tests

```bash
# Tous les tests
npm run test

# Tests d'un package spécifique
npm run test -w packages/devops-workspace
npm run test -w packages/lmstudio-gmail

# Watch mode
npm run test:watch -w packages/devops-workspace
```

## 📊 Stack technique

- **Langage** : TypeScript 5.7
- **Runtime** : Node.js ≥ 18
- **MCP SDK** : `@modelcontextprotocol/sdk` (officiel)
- **Gmail** : `googleapis` (officiel Google)
- **LM Studio** : `openai` SDK (OpenAI-compatible)
- **Git** : `simple-git`
- **Docker** : CLI wrapper (`execa`)
- **Système** : `systeminformation`
- **Images** : ImageMagick (via shell)
- **Validation** : Zod
- **Logs** : Winston

## 🔒 Sécurité

### Validation stricte
- ✅ Paths : anti-traversal, whitelist
- ✅ Commandes : détection injection
- ✅ Noms : regex validation

### Privacy
- ✅ LM Studio : 100% local
- ✅ Logs : pas de contenu sensible
- ✅ OAuth : tokens chiffrés localement

### Rate limiting
- ✅ 60 appels/minute/tool par défaut
- ✅ Respect quotas Gmail API

## 🗺️ Roadmap

### V1.1 (Q2 2025)
- [ ] Tests end-to-end complets
- [ ] CI/CD (GitHub Actions)
- [ ] Docker images pour déploiement
- [ ] MCP Server HTTP (en plus de stdio)

### V2.0 (Q3 2025)
- [ ] **MCP #3** : Kubernetes admin
- [ ] **MCP #4** : GitHub/GitLab integration
- [ ] RAG + Embeddings pour Gmail
- [ ] Dashboard web (Electron)

### V3.0 (Q4 2025)
- [ ] Multi-utilisateurs
- [ ] Intégration Prometheus/Grafana
- [ ] LLM function calling optimisé
- [ ] Plugins system

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md) (à créer).

### Quick start dev

```bash
git clone https://github.com/flamstyl/mcp-workspace.git
cd mcp-workspace
npm install
npm run dev:devops    # Watch mode DevOps
npm run dev:gmail     # Watch mode Gmail
```

## 📄 Licence

MIT © flamstyl

---

## 🙏 Remerciements

- [Anthropic](https://anthropic.com) pour Claude et le Model Context Protocol
- [LM Studio](https://lmstudio.ai) pour l'IA locale
- La communauté [awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers)

---

**Développé avec ❤️ pour Claude Code** 🚀

[⭐ Star ce repo](https://github.com/flamstyl/mcp-workspace) si tu le trouves utile !
