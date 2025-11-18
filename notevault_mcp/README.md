# 🟣 NoteVault MCP — Encrypted Notes + AI + RAG

**Skynet Module v1.0**

> *Your personal encrypted knowledge vault with AI-powered organization and semantic search.*

---

## 🎯 Features

✅ **Zero-Knowledge Encryption**
- AES-256-GCM encryption
- PBKDF2 key derivation (100k iterations)
- Master key never stored on disk
- Encrypted sync across devices

✅ **AI-Powered**
- Automatic summarization (Claude)
- Thematic classification
- Tag suggestions
- Memory extraction (key ideas + TODOs)
- RAG-based semantic search

✅ **Notion Import**
- Convert Notion JSON exports
- Preserve metadata and tags
- Batch import support

✅ **Modern UI**
- Electron-based desktop app
- Dark mode
- Markdown editor
- Real-time search

✅ **MCP Integration**
- Model Context Protocol server
- Sync tools (push/pull/resolve)
- AI tools (summarize, classify, extract)
- RAG backup/restore

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│      Electron Frontend              │
│  (Vault UI + Markdown Editor)       │
└─────────────┬───────────────────────┘
              │
      ┌───────▼───────┐
      │ Python Backend│  (FastAPI)
      │ - Crypto      │  Port: 5050
      │ - Notes CRUD  │
      │ - RAG Index   │
      └───────┬───────┘
              │
      ┌───────▼───────┐
      │  MCP Server   │  (Node.js)
      │ - Sync        │  Port: 3000
      │ - AI Tools    │
      │ - Converter   │
      └───────────────┘
```

See [docs/architecture.md](docs/architecture.md) for details.

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **npm** or **yarn**

### Installation

#### 1. Backend (Python)

```bash
cd app/backend_python

# Install dependencies
pip install -r requirements.txt

# Start backend server
python vault_server.py
# → Runs on http://localhost:5050
```

#### 2. MCP Server (Node.js)

```bash
cd app/mcp

# Install dependencies
npm install

# Set Claude API key (optional, uses mocks if not set)
export ANTHROPIC_API_KEY="your-api-key"

# Start MCP server
npm start
# → Runs on http://localhost:3000
```

#### 3. Electron App

```bash
cd app/electron_app

# Install dependencies
npm install

# Start app
npm start
```

---

## 📖 Usage

### First Run

1. Launch the Electron app
2. Enter a strong password (will create new vault)
3. Start writing notes!

### Creating Notes

1. Click **➕ New Note**
2. Write in Markdown
3. Add tags (comma-separated)
4. Click **💾 Save**

### AI Features

- **✨ Summarize:** Generate note summary (3 formats)
- **🏷️ Classify:** Auto-suggest tags and themes
- **🔍 RAG Search:** Semantic search across all notes

### Importing from Notion

1. Export Notion workspace (JSON or Markdown)
2. Click **📥 Import Notion**
3. Select file(s)
4. Notes are converted and encrypted

### Sync Across Devices

1. Click **🔄 Sync** on Device A
2. Notes are encrypted and uploaded to MCP
3. On Device B, click **🔄 Sync** to pull
4. Conflict resolution: timestamp-based merge

---

## 🔐 Security

### Zero-Knowledge Architecture

- ✅ Notes **encrypted locally** before sync
- ✅ Master key **never** sent to server
- ✅ Server only stores **encrypted blobs**
- ✅ Password derivation: PBKDF2 (100k iterations)
- ✅ Encryption: AES-256-GCM

### Best Practices

- Use a **strong password** (12+ characters, mixed case, symbols)
- **Backup** your vault file regularly
- For AI features: content is sent to Claude API (consider anonymizing sensitive data)

---

## 📁 Project Structure

```
notevault_mcp/
├── vault/                    # Encrypted vault storage
│   ├── vault_local.nvault    # Encrypted notes
│   ├── vault_index.json      # Metadata index
│   └── attachments/
│
├── app/
│   ├── backend_python/       # Python backend
│   │   ├── crypto_engine.py
│   │   ├── note_manager.py
│   │   ├── notion_converter.py
│   │   ├── rag_indexer.py
│   │   ├── vault_server.py
│   │   └── requirements.txt
│   │
│   ├── mcp/                  # MCP server
│   │   ├── server.js
│   │   ├── tools/
│   │   └── package.json
│   │
│   └── electron_app/         # Electron UI
│       ├── main.js
│       ├── preload.js
│       ├── src/
│       └── package.json
│
├── ai_prompts/               # AI prompt templates
├── data/                     # RAG index + sync data
├── docs/                     # Documentation
└── README.md
```

---

## 🧪 Testing

### Backend

```bash
cd app/backend_python
pytest
```

### Crypto Engine

```bash
python crypto_engine.py
# → Runs demo encryption/decryption
```

### Note Manager

```bash
python note_manager.py
# → Creates sample notes
```

---

## 🔧 Configuration

### Backend (`app/backend_python/config.yaml`)

```yaml
server:
  port: 5050

vault:
  path: "./vault/vault_local.nvault"
  auto_save: true

crypto:
  algorithm: "AES-256-GCM"
  iterations: 100000

ai:
  backend: "mcp"
  mcp_url: "http://localhost:3000"
```

### MCP (`app/mcp/config.mcp.json`)

```json
{
  "sync_channel": "skynet_notevault",
  "encrypted_only": true,
  "ia_backend": "claude_api"
}
```

---

## 🚧 Roadmap

### v1.1
- [ ] Local embeddings (sentence-transformers)
- [ ] Note graph visualization
- [ ] Templates

### v1.2
- [ ] Mobile app (React Native)
- [ ] Shared vaults (encrypted collaboration)
- [ ] Plugin system

### v2.0
- [ ] Local AI (Llama/Mistral)
- [ ] Voice notes + transcription
- [ ] OCR for images

---

## 🐛 Troubleshooting

### "Vault is locked" error
→ Unlock vault from main screen first

### "Failed to connect to backend"
→ Ensure Python backend is running on port 5050

### "AI features not working"
→ Check MCP server is running + ANTHROPIC_API_KEY is set

### "Import Notion failed"
→ Ensure file is valid JSON or Markdown export from Notion

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📜 License

MIT License - see [LICENSE](LICENSE)

---

## 🔗 Part of Skynet

NoteVault MCP is a module of **Skynet** — the AI automation ecosystem.

**Other Skynet Modules:**
- Skynet Command Center (central hub)
- Prompt Syncer (universal prompt distribution)
- Synapse Planner (task orchestration)

**Coming Soon:**
- Memory Navigator (RAG knowledge graph)
- Context Mode (local AI context management)
- Semantic Notes (advanced note linking)

---

## 📧 Support

Issues? Questions? Ideas?

- 🐛 [Report bugs](https://github.com/flamstyl/Skynet_depot/issues)
- 💡 [Request features](https://github.com/flamstyl/Skynet_depot/issues/new)
- 📖 [Read docs](./docs/architecture.md)

---

**Built with 🟣 by Skynet**

*Encrypted. AI-powered. Zero-knowledge.*
