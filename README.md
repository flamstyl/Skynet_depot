# 🚀 Skynet Depot - MCP Servers Collection

**Collection complète de Model Context Protocol (MCP) servers pour transformer Claude Code en véritable OS pour IA**

Dépôt de Skynet Coalition

---

## 📦 Projets inclus

### 1️⃣ MCP DevOps Workspace
**50+ tools pour développement, Docker, système, projets, graphisme**

🔗 **[Documentation complète](./mcp-devops-workspace/README.md)**

**Domaines couverts** :
- 🐍 **dev_env** : Environnements Python, Node.js, Go, Rust
- 🐳 **docker_admin** : Gestion complète Docker (containers, images, volumes, compose)
- 🖥️ **server_admin** : Métriques système, services systemd, processus, GPU
- 📁 **project_ops** : Fichiers, dossiers, Git complet
- 🎨 **graphics_tools** : Manipulation d'images (resize, convert, compress)

### 2️⃣ MCP Web Scraper Pro
**11 tools pour web scraping professionnel**

🔗 **[Documentation complète](./mcp-web-scraper-pro/README.md)**

**Fonctionnalités** :
- 🕸️ Scraping intelligent (HTML, Text, Structured JSON)
- 🧹 Nettoyage automatique (scripts, styles, trackers, ads)
- 🔍 Extraction structurée (headings, paragraphes, links, images, meta)
- 🤖 Crawler multi-pages avec respect robots.txt
- 💾 Stockage SQLite avec recherche full-text
- 🛡️ Sécurité : anti-SSRF, rate limiting, validation URLs

---

## 🏗️ Architecture

**Stack technique** : TypeScript + Node.js >= 18
**Protocole** : Model Context Protocol (MCP) via stdio
**SDK** : `@modelcontextprotocol/sdk` (officiel Anthropic)
**Validation** : Zod (JSON Schema)

```
Claude Code (Client)
      ↓
[MCP via JSON-RPC]
      ↓
MCP Servers (DevOps + Scraper)
      ↓
Tools exposés (60+ au total)
```

---

## 🚀 Installation rapide

```bash
# Cloner le dépôt
git clone https://github.com/flamstyl/Skynet_depot.git
cd Skynet_depot

# Installer MCP DevOps Workspace
cd mcp-devops-workspace
./install.sh

# Installer MCP Web Scraper Pro
cd ../mcp-web-scraper-pro
./install.sh
```

### Configuration Claude Code

Fichier : `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "devops-workspace": {
      "command": "node",
      "args": ["/home/user/Skynet_depot/mcp-devops-workspace/build/index.js"]
    },
    "web-scraper-pro": {
      "command": "node",
      "args": ["/home/user/Skynet_depot/mcp-web-scraper-pro/build/index.js"]
    }
  }
}
```

Redémarrez Claude Code et vérifiez : `claude mcp list`

---

## 📚 Documentation

- 🔧 **[MCP DevOps Workspace - README](./mcp-devops-workspace/README.md)**
- 🕸️ **[MCP Web Scraper Pro - README](./mcp-web-scraper-pro/README.md)**
- 📖 **[Guide Complet des MCP Servers](./MCP_SERVERS_GUIDE.md)**
- 🧠 **[Brainstorming & Roadmap](./BRAINSTORMING_ROADMAP.md)**

---

## 💡 Cas d'usage

### 🔥 Veille concurrentielle automatisée
Web Scraper Pro → Crawl blog concurrent → DevOps Workspace → Stocke + Commit + Push

### 🔥 Documentation technique automatique
Web Scraper Pro → Scrape docs API → DevOps Workspace → Crée projet + Setup env

### 🔥 Monitoring & health check
DevOps Workspace → Check système + Docker → Web Scraper Pro → Scrape status page → Rapport + Commit

---

## 🛠️ Tools disponibles

**Total : 60+ tools MCP professionnels**

- **DevOps Workspace** : 50+ tools (dev, docker, système, git, graphisme)
- **Web Scraper Pro** : 11 tools (scraping, parsing, crawling, stockage)

---

## 🚀 Roadmap

### Court terme
- [ ] Tests automatisés
- [ ] CI/CD GitHub Actions
- [ ] Export multi-formats

### Moyen terme
- [ ] Support Kubernetes
- [ ] Playwright (scraping JS)
- [ ] Multi-cloud (AWS, GCP, Azure)

### Long terme
- [ ] Dashboard web
- [ ] Crawler distribué
- [ ] Auto-healing & prédiction

🔗 **[Voir roadmap complète](./BRAINSTORMING_ROADMAP.md)**

---

## 📝 Licence

MIT

---

**🌟 Développé avec ❤️ pour Claude Code par Skynet Depot**

**Version** : 1.0.0 | **Date** : 2025-11-22
