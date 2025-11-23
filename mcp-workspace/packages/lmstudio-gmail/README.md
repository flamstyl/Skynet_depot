# 📧 MCP LM Studio Gmail

> **MCP Server** : Assistant email intelligent avec IA locale (LM Studio + Gmail API)

## 🎯 Concept

Ce MCP permet à un **LLM local (via LM Studio)** d'interagir intelligemment avec **Gmail** :
- 📖 Lire et résumer des emails
- ✍️ Générer des brouillons de réponses
- 🏷️ Classifier et organiser automatiquement
- 📊 Créer des digests quotidiens
- 🔍 Recherche sémantique (via IA)

**Privacy-first** : Tout le traitement IA se fait en local via LM Studio.

## 🚀 Prérequis

### 1. LM Studio
- **Installer** : [https://lmstudio.ai](https://lmstudio.ai)
- **Lancer le serveur** :
  - Ouvre LM Studio
  - Onglet "Local Server"
  - Start Server (port 1234 par défaut)
- **Charger un modèle** : Choisis un modèle compatible (ex: Llama 3, Mistral, etc.)

### 2. Gmail API
- **Créer un projet Google Cloud** : [console.cloud.google.com](https://console.cloud.google.com)
- **Activer Gmail API**
- **Créer des credentials OAuth 2.0** :
  - Type : Desktop app
  - Télécharger le JSON → `auth/credentials.json`

### 3. Node.js
- Node.js ≥ 18
- npm ≥ 9

## 📦 Installation

### 1. Build

```bash
cd mcp-workspace
npm install
npm run build -w packages/lmstudio-gmail
```

### 2. Configuration Gmail OAuth

Place ton fichier `credentials.json` (téléchargé depuis Google Cloud) :

```bash
cp ~/Downloads/credentials.json packages/lmstudio-gmail/auth/credentials.json
```

### 3. Setup OAuth (première fois)

```bash
cd packages/lmstudio-gmail
npm run setup-oauth
```

→ Ouvre le lien dans le navigateur, autorise l'application, copie le code.
→ Les tokens seront sauvés dans `auth/tokens.json`

### 4. Configuration Claude Code

Ajoute dans `~/.claude.json` :

```json
{
  "mcpServers": {
    "lmstudio-gmail": {
      "command": "node",
      "args": ["/chemin/vers/mcp-workspace/packages/lmstudio-gmail/dist/index.js"],
      "type": "stdio",
      "env": {
        "LMSTUDIO_BASE_URL": "http://localhost:1234/v1",
        "LMSTUDIO_MODEL": "local-model",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## 🛠️ Tools disponibles (10 tools)

### 📬 Gmail (6 tools)

| Tool | Description |
|------|-------------|
| `gmail_list_threads` | Liste threads récents |
| `gmail_get_thread` | Récupère thread complet |
| `gmail_search` | Recherche Gmail |
| `gmail_create_draft` | Crée un brouillon |
| `gmail_list_labels` | Liste labels |
| `gmail_account_info` | Infos compte |

### 🧠 LM Studio (4 tools)

| Tool | Description |
|------|-------------|
| `lmstudio_summarize_thread` | Résume un thread |
| `lmstudio_propose_reply` | Génère réponses |
| `lmstudio_daily_digest` | Digest quotidien |
| `lmstudio_classify_email` | Classifie email |

## 💡 Exemples d'utilisation

### Résumer la boîte de réception

```
User → AI : "Résume mes mails non lus"
AI → gmail_list_threads(label="UNREAD")
AI → lmstudio_summarize_thread(threadId="...")
AI → User : "Tu as 5 mails importants : ..."
```

### Générer une réponse

```
User → AI : "Réponds à l'email de Jean"
AI → gmail_search(query="from:jean@example.com")
AI → lmstudio_propose_reply(threadId="...", style="friendly")
AI → gmail_create_draft(to=["jean@example.com"], body="...")
AI → User : "Brouillon créé ! Va le relire dans Gmail."
```

### Digest quotidien

```
User → AI : "Que s'est-il passé dans ma boîte aujourd'hui ?"
AI → lmstudio_daily_digest()
AI → User : "Digest du jour : 25 mails (3 urgents, 15 travail, 7 newsletters)"
```

## 🔒 Sécurité & Privacy

### Privacy by design
- ✅ **LM Studio local** : aucune donnée n'est envoyée à des services tiers
- ✅ **Pas de logs de contenu** : seuls les métadonnées sont loggées
- ✅ **OAuth2 sécurisé** : tokens stockés localement

### Scopes Gmail
Par défaut, le MCP demande :
- `gmail.readonly` : Lecture seule
- `gmail.compose` : Création de brouillons (PAS d'envoi direct)
- `gmail.modify` : Gestion labels

**Aucun scope pour supprimer des emails.**

### Rate limiting
- Respect des quotas Gmail API
- Cache local (TTL 5min)

## 🐛 Dépannage

### Erreur : "LM Studio non disponible"
→ Vérifie que LM Studio est lancé et que le serveur est actif (http://localhost:1234)

### Erreur : "Tokens OAuth introuvables"
→ Exécute `npm run setup-oauth`

### Erreur : "Gmail API quota exceeded"
→ Limite atteinte (250 req/s/user). Attends 1 minute.

## 🚀 Roadmap

### V2
- Embeddings + RAG sur historique emails
- Smart search sémantique
- Auto-labeling basé sur l'apprentissage

### V3
- Multi-comptes Gmail
- Intégration Outlook/IMAP
- Dashboard web (Electron)

## 📄 Licence

MIT

---

**Assistant email local & privé** 🔒🚀
