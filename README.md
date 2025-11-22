# 🚀 Skynet MCP Servers - Suite DevOps + Mémoire IA

Collection de serveurs MCP (Model Context Protocol) pour transformer Claude Code en véritable poste de travail DevOps + environnement créatif avec mémoire distribuée.

## 📦 Serveurs inclus

### 1. **skynet-devops-mcp** - Mega Server DevOps & Tools
Server MCP tout-en-un regroupant 5 modules :

- **dev_env** : Gestion d'environnements de développement (Python, Node.js)
- **docker_admin** : Administration Docker complète
- **server_admin** : Monitoring et administration système (systemd, ressources)
- **project_ops** : Gestion de fichiers et opérations Git
- **graphics_tools** : Manipulation d'images (resize, convert, thumbnails)

### 2. **skynet-drive-memory-mcp** - Mémoire Distribuée + RAG
Server MCP dédié à la mémoire externe avec :

- **Google Drive Memory** : Stockage persistant sur Google Drive
- **RAG** : Recherche sémantique avec embeddings
- **Query intelligente** : Récupération de contexte pertinent

## 🎯 Objectif

Donner à l'IA (Claude Code) les capacités d'un vrai développeur/admin Linux :
- ✅ Créer et gérer des projets
- ✅ Administrer Docker et services système
- ✅ Monitorer la santé du serveur
- ✅ Manipuler fichiers et Git
- ✅ Traiter des images
- ✅ Avoir une mémoire longue durée distribuée

## 🚀 Installation rapide

```bash
# Cloner le repo
git clone <URL>
cd skynet-mcp-servers

# Installation complète
./install.sh

# OU installation individuelle
cd skynet-devops-mcp && npm install
cd skynet-drive-memory-mcp && npm install
```

## 📖 Documentation détaillée

- [Installation complète](./docs/INSTALLATION.md)
- [Configuration MCP](./docs/CONFIGURATION.md)
- [Guide d'utilisation](./docs/USAGE.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## 🛠️ Stack technique

- **Language** : TypeScript + Node.js
- **MCP SDK** : `@modelcontextprotocol/sdk`
- **Validation** : Zod
- **DevOps** : dockerode, systeminformation, simple-git
- **Graphics** : sharp
- **Drive + RAG** : googleapis, @xenova/transformers

## 📄 Licence

MIT

## 🤝 Contribution

Contributions bienvenues ! Voir [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Créé pour Skynet** 🤖✨
