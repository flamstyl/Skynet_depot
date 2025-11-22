# 🕸️ MCP Web Scraper Pro

**Serveur MCP professionnel pour web scraping intelligent : récupération, nettoyage, structuration et stockage automatique de contenu web**

Un Model Context Protocol (MCP) server complet qui permet à Claude Code de scraper, parser, nettoyer et analyser n'importe quel site web de manière éthique et efficace.

---

## 🎯 Fonctionnalités principales

### ✨ Scraping intelligent
- **Mode HTML** : Récupération du HTML brut nettoyé
- **Mode Text** : Extraction du texte pur (sans balises)
- **Mode Structured** : JSON structuré avec title, headings, paragraphes, links, images, meta

### 🧹 Nettoyage automatique
- Suppression scripts/styles/trackers/publicités
- Élimination du "boilerplate" (header, footer, sidebar)
- Extraction du contenu principal
- Détection et suppression de spam

### 🔍 Extraction structurée
- Titre et métadonnées (Open Graph, Twitter Cards)
- Headings (H1, H2, H3) hiérarchisés
- Paragraphes et sections
- Liens internes/externes avec contexte
- Images avec métadonnées (alt, title, dimensions)
- Détection automatique du type de page (article, produit, doc, homepage)

### 🤖 Crawler multi-pages
- Crawl limité et contrôlé (max pages, same domain)
- Respect strict du robots.txt
- Rate limiting automatique + Crawl-delay
- Ignore patterns configurables
- Retry avec exponential backoff

### 💾 Stockage local (SQLite)
- Base de données SQLite intégrée
- Recherche full-text dans le contenu
- Métadonnées enrichies
- Déduplication par URL

### 🛡️ Sécurité & Éthique
- Validation stricte des URLs (anti-SSRF)
- Respect obligatoire du robots.txt
- Rate limiting par domaine
- Blocage des IPs privées
- User-Agent identifiable

---

## 📚 Architecture

```
mcp-web-scraper-pro/
├── src/
│   ├── index.ts                 # Point d'entrée
│   ├── server.ts                # Serveur MCP + routing tools
│   ├── types/
│   │   └── schemas.ts           # Types et schemas Zod
│   └── scraper/
│       ├── http-client.ts       # Client HTTP (axios, retries, robots.txt)
│       ├── parser.ts            # Parsing HTML (Cheerio, Turndown)
│       ├── cleaner.ts           # Nettoyage HTML
│       ├── crawler.ts           # Crawler multi-pages
│       └── storage.ts           # Stockage SQLite
├── package.json
├── tsconfig.json
├── install.sh
└── README.md
```

---

## ⚙️ Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

---

## 🚀 Installation

```bash
git clone <repo>/mcp-web-scraper-pro.git
cd mcp-web-scraper-pro
./install.sh
```

Le script installe automatiquement les dépendances, build le projet et configure l'environnement.

---

## 🔧 Configuration Claude Code

Fichier : `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "web-scraper-pro": {
      "command": "node",
      "args": ["/home/user/mcp-web-scraper-pro/build/index.js"]
    }
  }
}
```

Redémarrez Claude Code et vérifiez : `claude mcp list`

---

## 📖 Utilisation

### Exemples de commandes Claude Code

#### Scraper une page

```
Scrape cette page https://example.com et extrais son contenu structuré
```

Claude appellera : `scrape_url` avec mode `structured`

#### Crawl un site

```
Crawl le site https://docs.example.com sur 20 pages maximum et stocke tout
```

Claude appellera :
1. `crawl` avec maxPages=20
2. `store_scraped_data` pour chaque page

#### Nettoyer du HTML

```
J'ai du HTML avec plein de scripts et pubs, nettoie-le :
<html>...</html>
```

Claude appellera : `clean_html`

#### Rechercher dans les données stockées

```
Cherche "machine learning" dans toutes les pages que j'ai scrappées
```

Claude appellera : `search_stored_pages` avec query="machine learning"

---

## 🛠️ Tools MCP disponibles

| Tool | Description |
|------|-------------|
| `scrape_url` | Scrape une URL (modes: html, text, structured) |
| `clean_html` | Nettoie HTML (supprime scripts/styles/trackers) |
| `extract_structured` | Extrait contenu structuré d'un HTML |
| `list_links` | Liste tous les liens (internes/externes) |
| `crawl` | Crawl multi-pages avec limites |
| `store_scraped_data` | Stocke une page en SQLite |
| `get_stored_page` | Récupère page par URL ou ID |
| `delete_stored_page` | Supprime page stockée |
| `search_stored_pages` | Recherche full-text |
| `validate_url` | Valide URL (robots.txt, HTTPS) |
| `scraper_status` | Stats du scraper |

**Total : 11 tools**

---

## 🔒 Sécurité

### Protections implémentées

✅ **Anti-SSRF** : Blocage des IPs privées (127.0.0.1, 10.x.x.x, 192.168.x.x, localhost)
✅ **Robots.txt** : Respect strict (vérification automatique avant chaque scrape)
✅ **Rate limiting** : Minimum 1 seconde entre requêtes sur même domaine
✅ **Crawl-delay** : Détection et respect du Crawl-delay défini dans robots.txt
✅ **Timeout** : Limite de 10 secondes par requête (configurable)
✅ **Max pages** : Limité à 100 pages par crawl
✅ **Retry logic** : Exponential backoff (1s, 2s, 4s) avec max 3 tentatives
✅ **User-Agent** : Identifiable (`MCPWebScraper/1.0`)

### URLs interdites

- IPs privées : `127.0.0.1`, `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`
- Localhost : `localhost`, `0.0.0.0`
- Protocoles non-HTTP : `file://`, `ftp://`, etc.

---

## 🐛 Dépannage

### Problème : "Robots.txt interdit l'accès"

**Solution** : Normal, le site bloque les scrapers. Vous pouvez :
- Respecter la décision du site
- Utiliser `respectRobotsTxt: false` (déconseillé éthiquement)

### Problème : "Erreur HTTP 403 Forbidden"

**Solution** :
- Le site détecte le User-Agent du scraper
- Certains sites bloquent les scrapers
- Respectez la politique du site

### Problème : "Timeout après 10 secondes"

**Solution** :
- Augmenter le timeout : `scrape_url` avec `timeout: 30000`
- Vérifier votre connexion internet

### Problème : Base de données SQLite verrouillée

**Solution** :
```bash
rm scraped_data.db
# Relancer le serveur
```

---

## 🔧 Extension

### Ajouter un nouveau pattern de nettoyage

Modifiez `src/scraper/cleaner.ts` :

```typescript
private removeCustomElements($: cheerio.CheerioAPI): void {
  $('.my-custom-class, #my-custom-id').remove();
}
```

### Ajouter un nouveau format d'export

Modifiez `src/scraper/storage.ts` pour supporter JSON, CSV, Markdown, etc.

---

## 📊 Cas d'usage

### 1. Veille concurrentielle
Crawl les blogs/sites concurrents et analyse automatique des nouveaux articles.

### 2. Documentation technique
Scrape des docs techniques (API, frameworks) pour analyse par l'IA.

### 3. Résumé automatique
Scrape un article → Claude résume → Stockage du résumé.

### 4. Data mining
Extraction de données structurées depuis des sites (prix, produits, articles).

### 5. Monitoring de changements
Scrape régulier + comparaison pour détecter modifications.

---

## 🚀 Roadmap V2

### Court terme
- [ ] Support Playwright pour pages JS-heavy
- [ ] Export CSV/JSON/Markdown
- [ ] Webhooks pour notifications
- [ ] Support pagination automatique

### Moyen terme
- [ ] Extraction sémantique (embeddings)
- [ ] Classification automatique du contenu
- [ ] Détection de langue
- [ ] Support multi-format (PDF, DOCX via conversion)

### Long terme
- [ ] Crawler distribué (Redis queue)
- [ ] Cache intelligent (éviter re-scrape)
- [ ] API REST en plus de MCP
- [ ] Dashboard web de monitoring

---

## 📝 Licence

MIT

---

## 🤝 Contribution

Les contributions sont bienvenues ! Ouvrez une issue ou une PR.

---

## 📚 Sources

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code MCP Docs](https://code.claude.com/docs/en/mcp)
- [Cheerio Documentation](https://cheerio.js.org/)
- [Robots.txt Spec](https://www.robotstxt.org/)

---

**Développé avec ❤️ pour Claude Code**
