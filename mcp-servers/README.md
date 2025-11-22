# 🤖 MCP Servers - Skynet Depot

**Collection de serveurs MCP (Model Context Protocol) pour Claude Code CLI**

Cette collection fournit deux serveurs MCP professionnels et sécurisés pour étendre les capacités de Claude dans un environnement Linux.

---

## 📦 Serveurs MCP disponibles

### 1. 🚀 MCP DevOps Workspace

**Environnement de travail complet pour DevOps, développement et administration système**

**Fonctionnalités** :
- ⚙️ Gestion d'environnements de développement (Python, Node.js)
- 🐳 Administration Docker (containers, images, logs)
- 🖥️ Monitoring système (CPU, RAM, disque, services)
- 📁 Gestion de projets et Git
- 🎨 Outils graphiques (ImageMagick)

**Emplacement** : `mcp-devops-workspace/`
**Documentation** : [README DevOps Workspace](./mcp-devops-workspace/README.md)

---

### 2. 🖥️ MCP Fedora Remote Desktop Control

**Gestion du bureau à distance sur Fedora Linux (VNC, RDP, Wayland)**

**Fonctionnalités** :
- 🔍 Détection automatique de l'environnement (Wayland/X11)
- 📦 Installation et configuration de backends (GNOME RD, TigerVNC, WayVNC, xrdp)
- 🔐 Configuration sécurisée (SSH tunnels, firewall, mots de passe)
- 🌐 Gestion réseau et multi-hôtes
- 📝 Génération d'instructions de connexion

**Emplacement** : `mcp-fedora-remote-desktop/`
**Documentation** : [README Fedora Remote Desktop](./mcp-fedora-remote-desktop/README.md)

---

## 🎯 Installation rapide

### Prérequis globaux

- **OS** : Linux (Ubuntu, Debian, Fedora, Arch)
- **Node.js** : >= 18.0.0
- **Claude Code CLI** : Installé et configuré

### Installation des deux MCP servers

```bash
# MCP #1 : DevOps Workspace
cd mcp-devops-workspace
chmod +x scripts/install.sh
./scripts/install.sh

# MCP #2 : Fedora Remote Desktop (sur Fedora uniquement)
cd ../mcp-fedora-remote-desktop
chmod +x scripts/install.sh
./scripts/install.sh
```

### Configuration dans Claude Code CLI

Ajoutez les serveurs dans `~/.claude.json` :

```json
{
  "mcpServers": {
    "devops-workspace": {
      "command": "node",
      "args": [
        "/home/user/Skynet_depot/mcp-servers/mcp-devops-workspace/dist/index.js"
      ],
      "env": {
        "LOG_LEVEL": "info",
        "PROJECTS_DIR": "/home/user/projects"
      }
    },
    "fedora-remote-desktop": {
      "command": "node",
      "args": [
        "/home/user/Skynet_depot/mcp-servers/mcp-fedora-remote-desktop/dist/index.js"
      ],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

Ou utilisez la CLI :

```bash
# Ajouter DevOps Workspace
claude mcp add devops-workspace \
  --command node \
  --args "/path/to/mcp-devops-workspace/dist/index.js"

# Ajouter Fedora Remote Desktop
claude mcp add fedora-remote-desktop \
  --command node \
  --args "/path/to/mcp-fedora-remote-desktop/dist/index.js"
```

### Vérification

```bash
# Lister les MCP servers
claude mcp list

# Démarrer Claude Code
claude
```

---

## 📚 Documentation

Chaque MCP server possède sa propre documentation détaillée :

- **DevOps Workspace** : [README.md](./mcp-devops-workspace/README.md)
  - Liste des tools
  - Exemples d'utilisation
  - Configuration
  - Sécurité
  - Dépannage

- **Fedora Remote Desktop** : [README.md](./mcp-fedora-remote-desktop/README.md)
  - Comparatif des backends
  - Guide de sécurité
  - Tunnels SSH
  - Multi-hôtes

---

## 🔒 Sécurité

Les deux MCP servers implémentent des mesures de sécurité strictes :

✅ **Whitelist de commandes** - Pas d'exécution arbitraire
✅ **Validation des paths** - Protection path traversal
✅ **Validation des inputs** - Schémas Zod
✅ **Logs sans secrets** - Filtrage automatique
✅ **Confirmation pour actions dangereuses**
✅ **Principe du moindre privilège**

---

## 🛠️ Développement

### Structure des projets

Chaque MCP server suit une architecture modulaire :

```
mcp-*/
├── src/
│   ├── tools/          # Tools MCP par module
│   ├── services/       # Services (wrappers commandes)
│   ├── models/         # Types, schémas, erreurs
│   ├── utils/          # Utilitaires (logger, validators)
│   ├── config/         # Configuration
│   ├── server.ts       # Serveur MCP
│   └── index.ts        # Point d'entrée
├── tests/
│   ├── unit/
│   └── integration/
├── scripts/
│   └── install.sh
├── docs/
├── package.json
├── tsconfig.json
└── README.md
```

### Commandes de développement

```bash
# Build
npm run build

# Watch mode (développement)
npm run dev

# Tests
npm test

# Lint
npm run lint

# Format
npm run format
```

---

## 🎯 Cas d'usage

### DevOps Workspace

1. **Création de projet** : "Crée un projet Python Flask avec Git"
2. **Admin Docker** : "Liste mes containers et montre les logs du container web"
3. **Monitoring** : "Fais un health check de mon serveur"
4. **Graphisme** : "Redimensionne toutes les images du dossier /tmp/photos en 800x600"

### Fedora Remote Desktop

1. **Setup initial** : "Active le bureau à distance sur ma Fedora"
2. **Accès sécurisé** : "Configure un tunnel SSH pour me connecter"
3. **Multi-machines** : "Configure le remote desktop sur mes 3 serveurs"
4. **Debugging** : "Je n'arrive pas à me connecter, aide-moi"

---

## 🚀 Roadmap & Améliorations futures

### Court terme (V1.1)

- [ ] Tests automatisés complets
- [ ] Support de containers Docker pour les MCP servers
- [ ] Interface de configuration web (optionnelle)
- [ ] Logs structurés (JSON)
- [ ] Métriques et monitoring (Prometheus)

### Moyen terme (V2.0)

- [ ] Support multi-OS (macOS, Windows WSL)
- [ ] Intégration CI/CD (GitHub Actions, GitLab CI)
- [ ] MCP Server pour Kubernetes
- [ ] Panel de contrôle central pour tous les MCP
- [ ] Support de plugins tiers

### Long terme (V3.0)

- [ ] Cluster mode (multi-machines orchestrées)
- [ ] Intelligence prédictive (anticipation des besoins)
- [ ] Intégration avec outils cloud (AWS, GCP, Azure)
- [ ] API REST pour intégration externe

---

## 📄 Licence

MIT

---

## 🙏 Contribution

Les contributions sont bienvenues !

1. Fork le projet
2. Créez une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez (`git commit -m 'Ajout fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

---

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/flamstyl/Skynet_depot/issues)
- **Documentation** : READMEs individuels de chaque MCP
- **Communauté** : Discussions GitHub

---

**Fait avec ❤️ pour Claude Code CLI - Skynet Depot**
