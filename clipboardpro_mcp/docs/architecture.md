# ClipboardPro MCP — Architecture

## 🏗️ Vue d'ensemble

ClipboardPro MCP est une application intelligente de gestion du presse-papiers qui combine :
- **Frontend Desktop** (WinUI 3) : Interface utilisateur Windows native
- **Backend Local** (Node.js) : Logique métier et gestion de données
- **Serveur MCP** (Node.js) : Synchronisation multi-device et services IA
- **Base de données** (SQLite) : Historique local persistant

---

## 📊 Schéma d'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIPBOARDPRO MCP SYSTEM                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   WinUI 3 Desktop    │         │   MCP Server         │
│   ┌──────────────┐   │         │   (Node.js)          │
│   │ TrayIcon     │   │         │   ┌──────────────┐   │
│   │ HistoryPage  │◄──┼─────────┼──►│ Sync Tool    │   │
│   │ OCRPage      │   │  HTTP   │   │ OCR Tool     │   │
│   │ AIPage       │   │         │   │ AI Bridge    │   │
│   │ SettingsPage │   │         │   └──────────────┘   │
│   └──────────────┘   │         │                      │
│   ┌──────────────┐   │         │   ┌──────────────┐   │
│   │ClipboardWatch│   │         │   │ Device Sync  │   │
│   │McpClient     │   │         │   │ Manager      │   │
│   │HistoryService│   │         │   └──────────────┘   │
│   └──────────────┘   │         └──────────────────────┘
└──────────┬───────────┘                    │
           │                                │
           │ IPC/HTTP                       │
           ▼                                ▼
┌──────────────────────┐         ┌──────────────────────┐
│  Local Backend       │         │  Claude/Gemini CLI   │
│  (Node.js)           │         │                      │
│  ┌──────────────┐    │         │  ┌──────────────┐    │
│  │ Database     │    │         │  │ AI Engine    │    │
│  │ (SQLite)     │    │         │  │ - Rewrite    │    │
│  │              │    │         │  │ - Translate  │    │
│  │ history.db   │    │         │  │ - Summarize  │    │
│  └──────────────┘    │         │  │ - Clean      │    │
│  ┌──────────────┐    │         │  └──────────────┘    │
│  │HistoryMgr    │    │         └──────────────────────┘
│  │ OCRManager   │    │
│  │ AIManager    │    │
│  │ClipboardWatch│    │
│  └──────────────┘    │
└──────────────────────┘
```

---

## 🔄 Flux de données

### 1. Capture du presse-papiers

```
User copie texte/image
       │
       ▼
ClipboardWatcher (WinUI Service)
       │
       ▼
HistoryService.AddEntry()
       │
       ▼
Local API: POST /history
       │
       ▼
database.js → SQLite (history.db)
       │
       ▼
UI mise à jour (HistoryPage)
```

### 2. Synchronisation multi-device

```
Device A: Clipboard change
       │
       ▼
McpClient.Sync()
       │
       ▼
MCP Server: POST /sync/push
       │
       ├──► Store in sync_cache
       │
       └──► Broadcast to connected devices
              │
              ▼
       Device B: Pull sync
              │
              ▼
       MCP Server: GET /sync/pull
              │
              ▼
       Device B: Update local history
```

### 3. OCR sur images

```
User copie image
       │
       ▼
ClipboardWatcher détecte format image
       │
       ▼
McpClient.OCR(imageData)
       │
       ▼
MCP Server: POST /ocr
       │
       ├──► Tesseract/Vision API
       │
       └──► Retourne texte extrait
              │
              ▼
       Affichage dans OCRPage
       │
       ▼
       Stockage dans history.db
```

### 4. Transformation IA

```
User sélectionne entrée historique
       │
       ▼
Choisit action IA (rewrite/translate/etc.)
       │
       ▼
AIPage.Execute()
       │
       ▼
McpClient.AI(action, text)
       │
       ▼
MCP Server: POST /ai/{action}
       │
       ├──► Charge prompt depuis /ai_prompts/
       │
       ├──► Appelle Claude CLI ou Gemini CLI
       │
       └──► Retourne résultat
              │
              ▼
       Affichage dans AIPage
       │
       ▼
       Option: Copier dans clipboard
```

---

## 📦 Modules et responsabilités

### WinUI 3 Desktop App

#### Pages
- **HistoryPage.xaml** : Liste l'historique complet, recherche, filtres
- **OCRPage.xaml** : Affiche résultats OCR, permet édition
- **AIPage.xaml** : Interface pour transformations IA
- **SettingsPage.xaml** : Config sync, API keys, préférences

#### Services
- **TrayIcon.cs** : Gestion icône système, menu contextuel
- **ClipboardWatcher.cs** : Surveillance clipboard Windows
- **HistoryService.cs** : CRUD historique via API locale
- **McpClient.cs** : Communication avec serveur MCP

#### ViewModels
- **HistoryViewModel.cs**
- **OCRViewModel.cs**
- **AIViewModel.cs**
- **SettingsViewModel.cs**

---

### MCP Server (Node.js)

#### server.js
- Serveur Express principal
- Routes MCP endpoints
- Gestion connexions WebSocket (sync temps réel)

#### tools/sync.js
- `pushClipboard()` : Envoie entrée vers serveur
- `pullClipboard()` : Récupère entrées depuis serveur
- `syncDevices()` : Synchronise tous devices connectés

#### tools/ocr.js
- `extractText(imageBuffer)` : OCR via Tesseract
- `processImage()` : Prétraitement image
- Mock initial : retourne texte fictif

#### tools/ai_bridge.js
- `callClaude(prompt, text)` : Appel Claude CLI
- `callGemini(prompt, text)` : Appel Gemini CLI
- `loadPrompt(action)` : Charge prompt depuis /ai_prompts/
- Gère retry et fallback

---

### Backend Local (Node.js)

#### database.js
- Initialisation SQLite
- Migrations schema
- Queries CRUD

#### history_manager.js
- `addEntry(type, content, metadata)`
- `getHistory(limit, offset, filter)`
- `searchHistory(query)`
- `deleteEntry(id)`

#### ocr_manager.js
- `processClipboardImage(data)`
- Interface avec MCP OCR tool

#### ai_manager.js
- `rewrite(text)` → POST /ai/rewrite
- `translate(text, lang)` → POST /ai/translate
- `summarize(text)` → POST /ai/summarize
- `clean(text)` → POST /ai/clean

#### clipboard_watcher.js
- Alternative backend pour clipboard monitoring
- Utilisé si WinUI watcher échoue

---

### API Locale (Node.js)

#### routes.js
```
GET    /history            → Liste historique
GET    /history/:id        → Détail entrée
POST   /history            → Ajoute entrée
DELETE /history/:id        → Supprime entrée
POST   /ocr                → Lance OCR
POST   /ai                 → Lance transformation IA
GET    /settings           → Config app
PUT    /settings           → Update config
POST   /sync               → Déclenche sync MCP
```

#### server.js
- Express server sur port 3001
- Middleware CORS
- Error handling

---

## 💾 Base de données SQLite

### Schema `history.db`

```sql
CREATE TABLE clipboard_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,           -- 'text' | 'image' | 'file'
    content TEXT,                 -- Texte ou chemin image
    ocr_text TEXT,                -- Texte extrait si image
    metadata TEXT,                -- JSON: source app, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced BOOLEAN DEFAULT 0,
    device_id TEXT
);

CREATE TABLE ai_transformations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    history_id INTEGER,
    action TEXT NOT NULL,         -- 'rewrite' | 'translate' | etc.
    input_text TEXT,
    output_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (history_id) REFERENCES clipboard_history(id)
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

---

## 🔌 Endpoints MCP

### Sync
```
POST /sync/push
Body: { device_id, entry: {...} }
Response: { success, sync_id }

GET /sync/pull?device_id=xxx&since=timestamp
Response: { entries: [...] }
```

### OCR
```
POST /ocr
Body: { image: base64, options: {...} }
Response: { text, confidence }
```

### IA
```
POST /ai/rewrite
POST /ai/translate
POST /ai/summarize
POST /ai/clean
Body: { text, options: {...} }
Response: { result, usage }
```

---

## 🚀 Démarrage système

1. **Backend Local** démarre (port 3001)
2. **MCP Server** démarre (port 3002)
3. **WinUI App** démarre
4. **TrayIcon** s'affiche
5. **ClipboardWatcher** s'active
6. **Sync** se connecte au MCP (si activé)

---

## 🔒 Sécurité

- API locale accessible uniquement localhost
- MCP server nécessite authentification (API key)
- Clipboard data chiffré avant sync (TODO)
- Pas de stockage permanent sur MCP server
- SQLite avec permissions restreintes

---

## 📱 Multi-device sync

```
Device A                MCP Server              Device B
   │                         │                      │
   │─── Push new entry ─────►│                      │
   │                         │                      │
   │                         │◄─── Pull updates ────│
   │                         │                      │
   │                         │──── Broadcast ──────►│
   │                         │                      │
   │◄─── Confirm sync ───────│                      │
   │                         │                      │
```

---

## 🧪 Tests

- **Unit tests** : Backend modules
- **Integration tests** : API endpoints
- **E2E tests** : WinUI automation
- **Mock data** : Exemples clipboard/OCR/IA

---

## 📈 Extensions futures

- [ ] Chiffrement end-to-end
- [ ] Support macOS/Linux
- [ ] Plugin système pour apps tierces
- [ ] IA custom models (local LLM)
- [ ] Analytics usage
- [ ] Cloud storage option (S3/Azure)

---

**Version:** 1.0.0
**Dernière mise à jour:** 2025-11-18
