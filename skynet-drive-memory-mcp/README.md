# 🧠 Skynet Drive Memory MCP

Server MCP pour mémoire persistante sur Google Drive avec capacités RAG (Retrieval-Augmented Generation).

## 📋 Fonctionnalités

### 📂 Gestion Google Drive
- `list_files` : Lister les fichiers sur Google Drive
- `read_memory` : Lire des fichiers (mémoire persistante)
- `write_memory` : Écrire des fichiers (avec append)

### 🔍 RAG (Recherche sémantique)
- `query_rag` : Rechercher dans les fichiers via similarité sémantique
  - Embeddings locaux (transformers.js) ou Cloudflare Workers AI
  - Cache automatique des embeddings
  - Extraction de snippets pertinents

## 🔧 Installation

```bash
npm install
npm run build
```

## ⚙️ Configuration Google Drive OAuth2

### 1. Créer un projet Google Cloud

1. Aller sur https://console.cloud.google.com
2. Créer un nouveau projet
3. Activer l'API Google Drive
4. Créer des credentials OAuth 2.0 (Desktop App)

### 2. Configurer les variables d'environnement

Copier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Remplir :
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback

EMBEDDING_MODE=local
# OU
# EMBEDDING_MODE=cloudflare
# CLOUDFLARE_API_KEY=...
# CLOUDFLARE_ACCOUNT_ID=...
```

### 3. Première authentification

```javascript
// Obtenir l'URL d'authentification
const authUrl = driveClient.getAuthUrl();
console.log('Visitez:', authUrl);

// Après autorisation, sauvegarder le code
await driveClient.saveCredentials(code);
```

## 🚀 Utilisation

### En standalone
```bash
npm start
```

### Avec Claude Code CLI
```bash
claude mcp add skynet-drive --transport stdio --command 'node /path/to/dist/index.js'
```

## 📚 Exemples

### Écrire dans la mémoire
```json
{
  "name": "write_memory",
  "arguments": {
    "path": "Skynet_Memory/notes.md",
    "content": "# Notes importantes\n\nCeci est une note."
  }
}
```

### Lire depuis la mémoire
```json
{
  "name": "read_memory",
  "arguments": {
    "path": "Skynet_Memory",
    "match": "*.md"
  }
}
```

### Recherche RAG
```json
{
  "name": "query_rag",
  "arguments": {
    "query": "Comment installer n8n ?",
    "topK": 3,
    "threshold": 0.7
  }
}
```

## 🧠 Modes d'embeddings

### Local (transformers.js)
- ✅ Gratuit
- ✅ Privé
- ⚠️ Plus lent au premier démarrage (téléchargement du modèle)
- Modèle : `Xenova/all-MiniLM-L6-v2`

### Cloudflare Workers AI
- ✅ Rapide
- ✅ Scalable
- ⚠️ Nécessite un compte Cloudflare
- Modèle : `@cf/baai/bge-base-en-v1.5`

## 📝 Formats supportés

- ✅ Texte brut (txt, md, etc.)
- ✅ Google Docs → converti en texte
- ✅ Google Sheets → converti en CSV
- ✅ JSON
- ⚠️ Les fichiers binaires sont ignorés pour le RAG

## 🔒 Sécurité

- OAuth2 avec refresh automatique
- Tokens stockés localement dans `credentials/`
- Validation stricte avec Zod
- Limite de taille de fichiers configurable

## 📝 Licence

MIT
