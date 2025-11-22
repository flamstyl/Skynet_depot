# 🚀 Guide Complet des MCP Servers Skynet

Ce document regroupe les deux MCP servers développés pour transformer Claude Code en véritable poste de travail DevOps/Créatif + Web Scraping.

---

## 📦 Vue d'ensemble des projets

### 1️⃣ MCP DevOps Workspace
**50+ tools pour développement, Docker, système, projets, graphisme**

### 2️⃣ MCP Web Scraper Pro
**11 tools pour scraping, parsing, nettoyage, crawling, stockage**

---

## 🏗️ Architecture globale

Les deux MCP servers suivent la même architecture :

```
TypeScript + Node.js >= 18
     ↓
@modelcontextprotocol/sdk (officiel)
     ↓
Tools MCP exposés via JSON-RPC
     ↓
Claude Code (Client MCP)
```

### Stack technique commune

- **Langage** : TypeScript (type-safety + SDK officiel mature)
- **Runtime** : Node.js >= 18
- **Validation** : Zod (schemas JSON Schema)
- **Protocole** : MCP via stdio (JSON-RPC)
- **Déploiement** : npx (zero-config)

---

## 📊 Comparaison des deux MCP

| Aspect | DevOps Workspace | Web Scraper Pro |
|--------|------------------|-----------------|
| **Nombre de tools** | 50+ | 11 |
| **Domaines** | 5 (dev, docker, système, projets, graphisme) | 1 (web scraping) |
| **Dépendances principales** | dockerode, systeminformation, sharp, simple-git | cheerio, axios, better-sqlite3, turndown |
| **Stockage** | Aucun (actions en temps réel) | SQLite local |
| **Sécurité** | Path traversal, confirmation actions | Anti-SSRF, robots.txt, rate limiting |
| **Cas d'usage** | Admin serveur, dev env, gestion projets | Veille, data mining, doc scraping |

---

## 🚀 Installation rapide (les deux)

```bash
cd /home/user/Skynet_depot

# MCP DevOps Workspace
cd mcp-devops-workspace
./install.sh

# MCP Web Scraper Pro
cd ../mcp-web-scraper-pro
./install.sh
```

### Configuration Claude Code (les deux en parallèle)

`~/Library/Application Support/Claude/claude_desktop_config.json` :

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

Redémarrez Claude Code → `claude mcp list` → Devrait afficher les 2 MCP

---

## 💡 Cas d'usage combinés (les deux MCP ensemble)

### 🔥 Scénario 1 : Veille concurrentielle automatisée

```
1. Web Scraper Pro → Crawl le blog concurrent
2. DevOps Workspace → Stocke le résumé dans un projet Git
3. DevOps Workspace → Commit et push automatique
```

**Commande Claude** :
```
Scrape les 10 derniers articles de https://blog.concurrent.com,
résume-les et crée un fichier veille-concurrent.md dans mon projet,
puis commit et push sur GitHub
```

### 🔥 Scénario 2 : Documentation technique automatique

```
1. Web Scraper Pro → Scrape docs API (ex: docs.stripe.com)
2. DevOps Workspace → Crée un projet Python avec exemples
3. DevOps Workspace → Configure virtualenv + install deps
```

**Commande Claude** :
```
Scrape la doc de l'API Stripe pour les paiements,
crée un projet Python "stripe-integration",
génère des exemples de code et installe les dépendances
```

### 🔥 Scénario 3 : Monitoring & health check

```
1. DevOps Workspace → Check ressources système (CPU, RAM, disque)
2. DevOps Workspace → Liste containers Docker + logs
3. Web Scraper Pro → Scrape status page externe
4. DevOps Workspace → Créer rapport et commit
```

**Commande Claude** :
```
Fais-moi un rapport complet sur l'état de mon serveur :
- ressources système
- état des containers Docker
- scrape https://status.myservice.com pour vérifier uptime
- génère un rapport Markdown et commit-le
```

---

## 🎯 Workflows recommandés

### Workflow 1 : Setup nouveau projet full-stack

```bash
# Via DevOps Workspace
1. create_project (structure projet)
2. setup_python_env (backend)
3. setup_node_env (frontend)
4. git_init + git_commit
5. docker_compose_up (si stack Docker)
```

### Workflow 2 : Scraping + analyse + stockage

```bash
# Via Web Scraper Pro + DevOps Workspace
1. scrape_url (récupérer contenu)
2. clean_html (nettoyer)
3. extract_structured (structurer)
4. store_scraped_data (SQLite)
5. write_file (exporter en Markdown via DevOps)
6. git_add + git_commit (version control)
```

### Workflow 3 : Monitoring quotidien

```bash
# Via DevOps Workspace
1. get_system_info
2. get_resource_usage
3. docker_stats
4. list_services
5. Générer rapport automatique
```

---

## 🔒 Sécurité globale

### Protections communes

✅ **Validation stricte** : Zod schemas pour tous les inputs
✅ **Gestion d'erreurs** : Try/catch + formatError MCP
✅ **Logs** : console.error pour debugging

### DevOps Workspace - Sécurité spécifique

✅ Path traversal protection
✅ Paths protégés (/etc/passwd, /root, etc.)
✅ Confirmation pour actions dangereuses (delete_file, restart_service)
✅ Backup automatique avant write_file
✅ Taille max fichiers (10MB)

### Web Scraper Pro - Sécurité spécifique

✅ Anti-SSRF (blocage IPs privées)
✅ Respect robots.txt obligatoire
✅ Rate limiting (1s minimum entre requêtes)
✅ Timeout 10s par requête
✅ Max 100 pages par crawl
✅ Retry avec exponential backoff

---

## 📚 Documentation

- **DevOps Workspace** : `/mcp-devops-workspace/README.md`
- **Web Scraper Pro** : `/mcp-web-scraper-pro/README.md`

---

## 🧪 Tests recommandés

### Tests DevOps Workspace

```bash
# Test create_project
node build/index.js
# Dans Claude : "Crée un projet Python test-project"

# Test Docker (si Docker installé)
# Dans Claude : "Liste mes containers Docker"

# Test Git
# Dans Claude : "Dans /tmp/test, init git et commit"
```

### Tests Web Scraper Pro

```bash
# Test scrape simple
# Dans Claude : "Scrape https://example.com en mode structuré"

# Test crawl
# Dans Claude : "Crawl https://example.com sur 5 pages"

# Test stockage
# Dans Claude : "Stocke la page scrappée et recherche 'example'"
```

---

## 🐛 Dépannage global

### MCP non détecté par Claude Code

**Solutions** :
1. Vérifier le chemin dans `claude_desktop_config.json`
2. Vérifier que `build/index.js` existe pour les deux projets
3. Rebuild : `npm run build` dans chaque projet
4. Redémarrer Claude Code
5. Logs : chercher erreurs dans Console Claude Code

### Build TypeScript échoue

**Solution** :
```bash
# Pour chaque projet
rm -rf node_modules build
npm install
npm run build
```

### Permissions insuffisantes

**DevOps Workspace** :
- Docker : `sudo usermod -aG docker $USER` puis logout/login
- systemd : certaines commandes nécessitent sudo

**Web Scraper Pro** :
- SQLite : vérifier permissions dossier `scraped_data/`

---

## 🚀 Roadmap globale

### Court terme (1-2 mois)

**DevOps Workspace** :
- [ ] Support Kubernetes (kubectl)
- [ ] Monitoring Prometheus/Grafana
- [ ] CI/CD GitHub Actions
- [ ] Support bases de données (PostgreSQL, MySQL, Redis)

**Web Scraper Pro** :
- [ ] Support Playwright (pages JavaScript)
- [ ] Export CSV/JSON/Markdown
- [ ] Webhooks pour notifications
- [ ] Pagination automatique

### Moyen terme (3-6 mois)

**DevOps Workspace** :
- [ ] Dashboard web de monitoring
- [ ] Intégration Terraform/Ansible
- [ ] Support multi-cloud (AWS, GCP, Azure via SDK)
- [ ] Alerting automatique (Slack, Discord, Email)

**Web Scraper Pro** :
- [ ] Extraction sémantique (embeddings)
- [ ] Classification automatique (ML)
- [ ] Détection de langue
- [ ] Support PDF/DOCX

### Long terme (6-12 mois)

**DevOps Workspace** :
- [ ] Multi-serveurs (SSH remote)
- [ ] Orchestration complète (déploiements)
- [ ] Intégration complète CI/CD
- [ ] Backup/restore automatique

**Web Scraper Pro** :
- [ ] Crawler distribué (Redis queue)
- [ ] Cache intelligent
- [ ] API REST en plus de MCP
- [ ] Dashboard web monitoring

---

## 🤝 Contribution

Les deux projets sont open-source (MIT). Contributions bienvenues !

**Process** :
1. Fork le projet
2. Créer branche : `git checkout -b feature/ma-feature`
3. Commit : `git commit -m "feat: ma feature"`
4. Push : `git push origin feature/ma-feature`
5. Ouvrir PR

---

## 📊 Statistiques

**MCP DevOps Workspace** :
- 50+ tools
- 16 fichiers source
- ~3500 lignes de code TypeScript
- 5 modules (dev_env, docker_admin, server_admin, project_ops, graphics_tools)

**MCP Web Scraper Pro** :
- 11 tools
- 13 fichiers source
- ~1900 lignes de code TypeScript
- 5 modules scraper (http-client, parser, cleaner, crawler, storage)

**Total : 60+ tools MCP professionnels pour Claude Code**

---

## 🎉 Remerciements

- **Anthropic** : Model Context Protocol + Claude
- **Communauté open-source** : Bibliothèques utilisées (dockerode, cheerio, sharp, etc.)

---

## 📝 Licence

MIT

---

**Développé avec ❤️ pour Claude Code par Skynet Depot**
