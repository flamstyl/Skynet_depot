# 🟣 NoteVault MCP — Architecture System

**Version:** 1.0
**Skynet Module:** Encrypted Notes + AI + RAG + Notion Import
**Chiffrement:** AES-256-GCM, Zero-Knowledge Sync
**Stack:** Electron + Python + Node.js MCP

---

## 🎯 VISION

NoteVault MCP est un **coffre-fort de pensée** :
- 🔒 **Chiffrement local** (AES-256-GCM)
- 🧠 **IA-native** (résumés, classification, extraction mémoire)
- 🔄 **Sync multi-device** via MCP (zero-knowledge)
- 📦 **Import Notion** → conversion Markdown
- 🔍 **RAG Engine** (indexation sémantique)
- ✍️ **Éditeur Markdown** moderne (Electron)
- 🌙 **Dark mode**

---

## 🏗️ ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────┐
│                  ELECTRON FRONTEND                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐    │
│  │ Vault UI │  │ Editor   │  │ Notion Importer   │    │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘    │
│       │             │                  │                │
│       └─────────────┴──────────────────┘                │
│                     │                                   │
│              ┌──────▼──────┐                           │
│              │ Vault API   │ (IPC)                     │
│              └──────┬──────┘                           │
└─────────────────────┼────────────────────────────────┘
                      │
         ┌────────────▼────────────┐
         │  PYTHON BACKEND         │
         │  ┌──────────────────┐  │
         │  │ Flask/FastAPI    │  │
         │  │ REST API         │  │
         │  └────────┬─────────┘  │
         │           │             │
         │  ┌────────▼─────────┐  │
         │  │ Crypto Engine    │  │ AES-256-GCM
         │  │ (PBKDF2 + AES)   │  │ Zero-Knowledge
         │  └────────┬─────────┘  │
         │           │             │
         │  ┌────────▼─────────┐  │
         │  │ Note Manager     │  │ CRUD + Metadata
         │  └────────┬─────────┘  │
         │           │             │
         │  ┌────────▼─────────┐  │
         │  │ RAG Indexer      │  │ Semantic Search
         │  └────────┬─────────┘  │
         │           │             │
         │  ┌────────▼─────────┐  │
         │  │ Notion Converter │  │ JSON → Markdown
         │  └──────────────────┘  │
         └─────────────┬───────────┘
                       │
          ┌────────────▼────────────┐
          │   MCP SERVER (Node.js)  │
          │  ┌──────────────────┐  │
          │  │ Sync Tool        │  │ Push/Pull encrypted vault
          │  ├──────────────────┤  │
          │  │ AI Bridge        │  │ Claude API integration
          │  ├──────────────────┤  │
          │  │ Converter Tool   │  │ Format conversions
          │  ├──────────────────┤  │
          │  │ RAG Backup       │  │ Backup RAG index
          │  └──────────────────┘  │
          └─────────────────────────┘
                       │
                ┌──────▼──────┐
                │ STORAGE     │
                ├─────────────┤
                │ vault.nvault│ (encrypted)
                │ vault_index │ (metadata)
                │ rag_index/  │ (embeddings)
                └─────────────┘
```

---

## 📦 MODULES DÉTAILLÉS

### 🔐 1. CRYPTO ENGINE (Python)

**Fichier:** `backend_python/crypto_engine.py`

**Responsabilités:**
- Dérivation de clé maître (PBKDF2-SHA256, 100k iterations)
- Chiffrement/déchiffrement AES-256-GCM
- Format `.nvault` = JSON chiffré avec salt + nonce

**API:**
```python
def derive_key(password: str, salt: bytes) -> bytes
def encrypt_note(master_key: bytes, note_dict: dict) -> bytes
def decrypt_note(master_key: bytes, blob: bytes) -> dict
def encrypt_vault(master_key: bytes, notes: list) -> bytes
def decrypt_vault(master_key: bytes, blob: bytes) -> list
```

**Schéma de chiffrement:**
```
Password → PBKDF2(100k iter) → Master Key (32 bytes)
Note (JSON) → AES-256-GCM(Master Key, nonce) → Ciphertext + Tag
Format: {salt: base64, nonce: base64, ciphertext: base64, tag: base64}
```

---

### 📝 2. NOTE MANAGER (Python)

**Fichier:** `backend_python/note_manager.py`

**Responsabilités:**
- CRUD notes (Create, Read, Update, Delete)
- Gestion métadonnées (tags, timestamp, titre auto)
- Mise à jour index JSON
- Recherche et filtrage

**Structure Note:**
```json
{
  "id": "uuid-v4",
  "title": "Ma note",
  "content": "# Markdown content...",
  "tags": ["skynet", "ai", "crypto"],
  "created_at": "2025-11-18T10:00:00Z",
  "updated_at": "2025-11-18T15:30:00Z",
  "metadata": {
    "ai_summary": "...",
    "themes": ["security", "architecture"],
    "links": ["note-id-2", "note-id-5"]
  }
}
```

**API:**
```python
def create_note(title: str, content: str, tags: list) -> dict
def get_note(note_id: str) -> dict
def update_note(note_id: str, updates: dict) -> dict
def delete_note(note_id: str) -> bool
def search_notes(query: str, tags: list) -> list
def get_all_notes() -> list
```

---

### 🧠 3. RAG INDEXER (Python)

**Fichier:** `backend_python/rag_indexer.py`

**Responsabilités:**
- Indexation sémantique locale
- Génération embeddings (mock pour MVP, OpenAI/local pour prod)
- Recherche par similarité
- Backup/restore index

**API:**
```python
def index_note(note: dict) -> bool
def search_similar(query: str, top_k: int) -> list
def update_index(note_id: str, note: dict) -> bool
def backup_index() -> bytes
def restore_index(backup: bytes) -> bool
```

**Format Index:**
```json
{
  "notes": {
    "note-id": {
      "embedding": [0.1, 0.2, ...],
      "title": "...",
      "summary": "...",
      "tags": [...]
    }
  },
  "version": "1.0"
}
```

---

### 🔄 4. NOTION CONVERTER (Python)

**Fichier:** `backend_python/notion_converter.py`

**Responsabilités:**
- Lecture export Notion (JSON ou Markdown)
- Conversion propriétés Notion → métadonnées NoteVault
- Extraction tags, dates, types
- Génération Markdown propre

**Propriétés Notion supportées:**
- Title → title
- Tags → tags
- Date → created_at
- Type/Category → metadata.type
- Relations → metadata.links

**API:**
```python
def convert_notion_json(json_path: str) -> list[dict]
def convert_notion_md(md_path: str) -> dict
def batch_import(folder_path: str) -> list[dict]
```

---

### 🌐 5. PYTHON BACKEND SERVER

**Fichier:** `backend_python/vault_server.py`

**Framework:** Flask ou FastAPI
**Port:** 5050

**Endpoints:**

```
POST   /api/vault/unlock        # Déverrouiller vault (password → master key)
POST   /api/vault/lock          # Verrouiller vault
GET    /api/notes               # Liste toutes notes
POST   /api/notes               # Créer note
GET    /api/notes/:id           # Récupérer note
PUT    /api/notes/:id           # Mettre à jour
DELETE /api/notes/:id           # Supprimer
POST   /api/search              # Recherche notes
POST   /api/import/notion       # Import Notion
GET    /api/rag/search          # RAG search
POST   /api/ai/summarize        # Résumer note
POST   /api/ai/classify         # Classer note
```

**Sécurité:**
- Master key en mémoire uniquement
- Sessions temporaires
- Pas de logs du contenu décrypté

---

### 🔗 6. MCP SERVER (Node.js)

**Fichier:** `mcp/server.js`

**Port:** 3000
**Protocol:** MCP (Model Context Protocol)

**Tools:**

#### 🔄 `sync.js` — Synchronisation
```javascript
// Push vault chiffré vers MCP storage
mcp.tools.sync_push({
  vault_blob: base64_encrypted_vault,
  version: timestamp,
  device_id: uuid
})

// Pull vault depuis MCP
mcp.tools.sync_pull({
  device_id: uuid,
  last_version: timestamp
})

// Résolution conflits
mcp.tools.sync_resolve({
  local_version: vault_local,
  remote_version: vault_remote,
  strategy: "merge|local|remote"
})
```

#### 🧠 `ai_bridge.js` — IA Integration
```javascript
// Résumé via Claude
mcp.tools.ai_summarize({
  content: markdown_text,
  format: "short|medium|detailed"
})

// Classification thématique
mcp.tools.ai_classify({
  content: markdown_text,
  existing_tags: [...]
})

// Extraction mémoire
mcp.tools.ai_extract_memory({
  content: markdown_text
})

// RAG multi-notes
mcp.tools.ai_rag_summary({
  note_ids: [...],
  query: "question"
})
```

#### 🔧 `converter.js` — Conversions
```javascript
// TXT → Markdown
mcp.tools.convert_to_markdown({
  content: txt_content,
  format: "txt|json|html"
})
```

#### 💾 `rag_backup.js` — Backup RAG
```javascript
// Backup index RAG chiffré
mcp.tools.rag_backup({
  index_blob: encrypted_index
})

// Restore index
mcp.tools.rag_restore({
  backup_id: uuid
})
```

**Config MCP:**
```json
{
  "name": "notevault-mcp",
  "version": "1.0.0",
  "sync_channel": "skynet_notevault",
  "encrypted_only": true,
  "ia_backend": "claude_api",
  "storage": {
    "type": "local",
    "path": "./data/sync/"
  }
}
```

---

### 🖥️ 7. ELECTRON FRONTEND

**Structure:**
```
electron_app/
  ├── main.js          # Process principal
  ├── preload.js       # Bridge sécurisé IPC
  ├── src/
  │   ├── index.html   # Vault UI (liste notes)
  │   ├── editor.html  # Éditeur Markdown
  │   ├── css/
  │   │   └── style.css
  │   └── js/
  │       ├── editor.js         # Éditeur Markdown
  │       ├── vault_api.js      # Client API Python
  │       ├── ai_tools.js       # Client MCP AI
  │       └── notion_importer.js
```

**Pages:**

#### 📋 `index.html` — Vault Dashboard
- Liste notes (titre, tags, date)
- Recherche (titre, tags, contenu)
- Filtres (date, tags, thèmes)
- Boutons:
  - ➕ Nouvelle note
  - 📥 Import Notion
  - 🔄 Sync
  - 🔒 Verrouiller vault

#### ✍️ `editor.html` — Note Editor
- Éditeur Markdown (Monaco Editor ou CodeMirror)
- Preview live
- Actions IA:
  - ✨ Résumer
  - 🏷️ Classer/suggérer tags
  - 💡 Extraire idées clés
  - 📊 Générer plan
- Métadonnées (tags, date, liens)
- Sauvegarde auto

**IPC Communication:**
```javascript
// Renderer → Main → Python Backend
window.electronAPI.createNote(note)
window.electronAPI.updateNote(id, updates)
window.electronAPI.deleteNote(id)
window.electronAPI.searchNotes(query)
window.electronAPI.importNotion(jsonPath)
window.electronAPI.aiSummarize(content)
window.electronAPI.sync()
```

---

## 🔐 FLUX DE CHIFFREMENT

### 🔓 Unlock Vault
```
1. User entre password
2. Backend dérive master key (PBKDF2)
3. Backend déchiffre vault.nvault
4. Notes chargées en mémoire (décryptées)
5. Master key gardée en mémoire session
6. Frontend reçoit notes décryptées via API
```

### 💾 Sauvegarde Note
```
1. User édite note dans Electron
2. Frontend → API /api/notes/:id (PUT)
3. Backend met à jour note en mémoire
4. Backend re-chiffre tout le vault
5. Vault.nvault écrasé (atomic write)
6. Index JSON mis à jour
7. RAG indexer appelé (async)
```

### 🔄 Synchronisation
```
1. User clique "Sync"
2. Backend chiffre vault complet
3. Frontend → MCP sync_push(vault_blob)
4. MCP stocke vault chiffré + version
5. Autres devices → sync_pull()
6. Résolution conflits si nécessaire
7. Merge + re-chiffrement local
```

### 🧠 Résumé IA (Zero-Knowledge)
```
Option A (anonymisé):
1. User demande résumé
2. Backend extrait contenu
3. Backend anonymise (supprime noms propres/données sensibles)
4. Frontend → MCP ai_summarize(anonymized_content)
5. Claude génère résumé
6. Résumé ajouté aux métadonnées

Option B (local):
1. Contenu reste local
2. IA locale (si disponible)
3. Sinon: user consent avant envoi Claude
```

---

## 📊 FORMAT FICHIERS

### 🔒 `vault_local.nvault`
```json
{
  "version": "1.0",
  "salt": "base64...",
  "nonce": "base64...",
  "ciphertext": "base64...",
  "tag": "base64...",
  "metadata": {
    "created": "2025-11-18T10:00:00Z",
    "notes_count": 42,
    "last_sync": "2025-11-18T15:00:00Z"
  }
}
```

### 📇 `vault_index.json`
```json
{
  "version": "1.0",
  "notes": [
    {
      "id": "uuid",
      "title": "Ma note",
      "tags": ["skynet", "ai"],
      "created_at": "2025-11-18T10:00:00Z",
      "updated_at": "2025-11-18T15:30:00Z",
      "summary": "..."
    }
  ],
  "tags": {
    "skynet": 15,
    "ai": 23,
    "crypto": 8
  },
  "total_notes": 42
}
```

---

## 🎨 AI PROMPTS

### ✨ `summarize_note.md`
```markdown
Tu es un assistant expert en prise de notes.
Résume cette note en 3 formats :

**Note:**
{content}

**Formats:**
1. **1 phrase** (tweet-style)
2. **5 lignes** (executive summary)
3. **Version détaillée** (bullet points clés)
```

### 🏷️ `thematic_sort.md`
```markdown
Analyse cette note et extrais :
1. **Thèmes dominants** (3-5 mots-clés)
2. **Tags suggérés**
3. **Liens potentiels** avec autres notes (indices)

**Note:**
{content}
```

### 💡 `memory_extract.md`
```markdown
Extrais de cette note :
- **Idées clés** (insights importants)
- **Points actionnables** (TODOs)
- **Concepts à retenir**

**Note:**
{content}
```

### 🔍 `rag_summary.md`
```markdown
Contexte : {query}
Notes pertinentes : {note_excerpts}

Génère un résumé synthétique répondant à la question,
en citant les sources (IDs des notes).
```

---

## 🚀 WORKFLOW UTILISATEUR

### ✍️ Créer une note
```
1. User clique "Nouvelle note"
2. Éditeur s'ouvre (Markdown)
3. User écrit contenu
4. Sauvegarde auto → backend chiffre → vault.nvault
5. IA suggère tags/thèmes (optionnel)
6. Note indexée RAG
```

### 📥 Importer Notion
```
1. User exporte Notion → JSON/Markdown
2. User clique "Import Notion"
3. Sélectionne fichiers
4. Backend convertit → notes NoteVault
5. Notes chiffrées → ajoutées vault
6. Index mis à jour
```

### 🔄 Sync multi-device
```
1. Device A: édite note → sync push
2. MCP stocke vault chiffré
3. Device B: sync pull
4. Device B: merge + déchiffrement local
5. Conflit? → stratégie merge (timestamp/user choice)
```

### 🧠 Résumé IA
```
1. User sélectionne note
2. Clique "Résumer"
3. Frontend → MCP ai_summarize
4. Claude génère résumé
5. Résumé ajouté métadonnées note
6. Affiché dans UI
```

### 🔍 Recherche RAG
```
1. User tape requête
2. Frontend → RAG search
3. Backend trouve notes similaires (embeddings)
4. Résultats triés par pertinence
5. User clique → note ouverte
```

---

## 🛡️ SÉCURITÉ

### Principes
1. **Zero-Knowledge**: Vault toujours chiffré avant sync
2. **Master Key**: Jamais stockée sur disque
3. **Session-based**: Master key en RAM uniquement
4. **No logs**: Contenu décrypté jamais loggé
5. **IA Privacy**: Contenu anonymisé avant envoi Claude (ou consent)

### Menaces & Mitigations
| Menace | Mitigation |
|--------|------------|
| Vol fichier vault | AES-256-GCM + PBKDF2 100k iter |
| Keylogger password | TODO: U2F/biométrie |
| Man-in-the-middle sync | HTTPS + chiffrement end-to-end |
| Fuite mémoire | Secrets effacés après usage |
| IA leak | Anonymisation ou consent |

---

## 🧪 TESTS

### Backend Python
- Unit tests crypto (encrypt/decrypt)
- Integration tests API
- Notion converter tests

### MCP Server
- Sync conflict resolution
- AI tools response validation

### Electron
- E2E tests (Spectron/Playwright)
- UI tests (recherche, éditeur, import)

---

## 📈 ROADMAP

### MVP (v1.0)
- ✅ Crypto engine
- ✅ Note manager
- ✅ Éditeur Markdown
- ✅ Sync MCP basique
- ✅ Import Notion
- ✅ Résumé IA

### v1.1
- Embeddings locaux (no OpenAI)
- Graphe de notes (liens)
- Templates

### v1.2
- Mobile app (React Native)
- Collaboration (partage notes chiffrées)
- Plugins

### v2.0
- IA locale complète (Llama/Mistral)
- Voice notes → transcription
- OCR images

---

## 🔧 STACK TECHNIQUE

| Composant | Techno |
|-----------|--------|
| Frontend | Electron 28+ |
| Backend | Python 3.11+ Flask/FastAPI |
| MCP | Node.js 20+ |
| Crypto | cryptography (Python) |
| Markdown | Monaco Editor / CodeMirror |
| RAG | FAISS / ChromaDB (local) |
| IA | Claude API / Claude CLI |
| Storage | SQLite (index) + JSON (vault) |

---

## 📦 DÉPLOIEMENT

### Build Electron
```bash
npm run build
# → Génère .exe / .dmg / .AppImage
```

### Backend
```bash
python vault_server.py
# ou
uvicorn vault_server:app --port 5050
```

### MCP Server
```bash
node mcp/server.js
```

---

## 🎯 CONCLUSION

NoteVault MCP = **Notion + Obsidian + 1Password + RAG + IA**

**Différenciateurs:**
- 🔒 Chiffrement zero-knowledge
- 🧠 IA-native (résumés, classif, mémoire)
- 🔄 Sync multi-device sécurisé
- 📥 Import Notion seamless
- 🔍 RAG local
- 🎨 UI moderne (Electron)
- 🌙 Dark mode
- 🔌 Extensible (MCP tools)

**Skynet-ready** pour intégration future :
- Memory Navigator
- Context Mode
- Semantic Notes
- Multi-agent collaboration

---

**Next:** Implémentation complète des modules 🚀
