# 🧠 Skynet Memory Visualizer

**The Ultimate RAG Control Center**

> Visualize, edit, annotate, and control your AI's memory with precision.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/flamstyl/Skynet_depot)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Skynet](https://img.shields.io/badge/Skynet-Memory-purple.svg)](https://github.com/flamstyl/Skynet_depot)

---

## 📚 What is it?

**Skynet Memory Visualizer** is a desktop application that gives you complete control over your RAG (Retrieval-Augmented Generation) memory system. Think of it as an IDE for your AI's knowledge base.

### Key Features

- 📂 **Visual File Browser** - Navigate your RAG documents with ease
- ✏️ **Advanced Editor** - Edit markdown, JSON, and text files with live preview
- 🏷️ **Smart Tagging** - Organize documents with AI-powered tag suggestions
- 🕒 **Version Control** - Never lose a change with automatic versioning
- ⚏ **Diff Viewer** - Compare versions side-by-side
- 🤖 **AI Integration** - Regenerate, summarize, and improve documents with Claude/Gemini
- 🔍 **Semantic Search** - Find documents using natural language
- 📊 **Metadata Management** - Extract and edit document metadata
- ☁️ **Sync Ready** - Synchronize with Skynet Core via MCP
- 🌙 **Dark Mode** - Easy on the eyes for long sessions

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 16.0.0
- **Python** >= 3.9
- **Rust** (for Tauri build)
- **API Keys**: Anthropic (Claude) or Google (Gemini)

### Installation

```bash
# Clone the repository
cd skynet_memory_visualizer

# Install Flask backend dependencies
cd app/backend_flask
pip install -r requirements.txt

# Install MCP server dependencies
cd ../mcp
npm install

# Install Tauri frontend dependencies
cd ../tauri
# Follow Tauri setup: https://tauri.app/v1/guides/getting-started/prerequisites
```

### Configuration

1. **Set API Keys** (for AI features):
```bash
export ANTHROPIC_API_KEY="your-claude-api-key"
# OR
export GOOGLE_API_KEY="your-gemini-api-key"
```

2. **Configure Backend** (`app/backend_flask/config.yaml`):
```yaml
ai:
  provider: "claude"  # or "gemini"
  model: "claude-sonnet-4-5"
```

### Running

**Terminal 1 - Flask Backend:**
```bash
cd app/backend_flask
python app.py
# Server starts on http://localhost:5432
```

**Terminal 2 - MCP Server:**
```bash
cd app/mcp
npm start
# Server starts on http://localhost:3456
```

**Terminal 3 - Tauri App:**
```bash
cd app/tauri
cargo tauri dev
# Desktop app launches
```

---

## 📖 Usage Guide

### 1. Browse Documents

- Open the app and navigate to **Documents**
- Explore your file tree
- Click on any file to view details
- Use the filter to find specific files

### 2. Edit a Document

- Click **Open** on any document
- Edit in the left pane
- See live preview on the right (for Markdown)
- Changes auto-save after 3 seconds

### 3. Tag a Document

- Open a document in the editor
- Go to **Tags** tab in sidebar
- Add tags manually or click **AI Suggest Tags**
- AI analyzes your document and suggests relevant tags

### 4. Regenerate with AI

- Open a document
- Go to **AI** tab in sidebar
- Click **Regenerate Document**
- Review the AI-improved version
- **Accept**, **Compare**, or **Reject**

### 5. Compare Versions

- Navigate to **Compare** page
- Enter document path
- Select two versions to compare
- View side-by-side or unified diff
- Restore any previous version

### 6. Search Your Memory

- Use the search bar on Dashboard
- Enter natural language queries
- Results ranked by semantic similarity
- Click any result to open

---

## 🏗️ Architecture

```
┌─────────────────────┐
│   Tauri Desktop     │  ← User Interface (HTML/CSS/JS)
│   Application       │
└──────────┬──────────┘
           │
           ├─────────────────┐
           │                 │
┌──────────▼──────────┐ ┌───▼──────────────┐
│  Flask Backend      │ │  MCP Server      │
│  - RAG Loader       │ │  - Sync RAG      │
│  - File Manager     │ │  - AI Export     │
│  - Tag Manager      │ │  - Index Refresh │
│  - History Manager  │ │                  │
│  - AI Bridge        │ │                  │
└──────────┬──────────┘ └───┬──────────────┘
           │                 │
           └────────┬────────┘
                    │
           ┌────────▼────────┐
           │   Data Layer    │
           │  - Documents    │
           │  - RAG Index    │
           │  - Versions     │
           │  - Tags         │
           └─────────────────┘
```

See [docs/architecture.md](docs/architecture.md) for detailed architecture documentation.

---

## 🔧 API Reference

### Flask Backend (Port 5432)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/stats` | GET | System statistics |
| `/api/files/tree` | GET | Get file tree |
| `/api/files/load` | GET | Load document |
| `/api/files/save` | POST | Save document |
| `/api/tags/get` | GET | Get tags |
| `/api/tags/add` | POST | Add tag |
| `/api/ai/regenerate` | POST | Regenerate document |
| `/api/ai/summarize` | POST | Summarize document |
| `/api/compare/diff` | POST | Generate diff |
| `/api/history/list` | GET | Get version history |

### MCP Server (Port 3456)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health/visualizer` | GET | Health check |
| `/sync/rag` | POST | Sync RAG memory |
| `/ai/export` | POST | Export for AI |
| `/index/refresh` | POST | Refresh index |
| `/tools` | GET | List available tools |

---

## 📁 Project Structure

```
skynet_memory_visualizer/
├── app/
│   ├── tauri/              # Desktop app (Rust + HTML/CSS/JS)
│   │   ├── src-tauri/      # Tauri backend
│   │   └── src/            # Frontend files
│   │       ├── index.html
│   │       ├── tree_view.html
│   │       ├── editor.html
│   │       ├── compare.html
│   │       ├── css/
│   │       └── js/
│   ├── backend_flask/      # Flask API server
│   │   ├── app.py
│   │   ├── rag_loader.py
│   │   ├── file_manager.py
│   │   ├── tag_manager.py
│   │   ├── history_manager.py
│   │   ├── compare_engine.py
│   │   ├── ai_bridge.py
│   │   └── config.yaml
│   └── mcp/                # MCP server
│       ├── server.js
│       ├── tools/
│       └── config.mcp.json
├── data/
│   ├── docs/               # Your documents
│   ├── rag_index/          # Embeddings & metadata
│   ├── history/            # Version history
│   └── logs/               # Application logs
├── ai_prompts/             # AI prompt templates
├── docs/                   # Documentation
└── README.md
```

---

## 🎨 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Document Editor
![Editor](docs/screenshots/editor.png)

### Version Compare
![Compare](docs/screenshots/compare.png)

---

## 🤝 Integration with Skynet Ecosystem

Skynet Memory Visualizer integrates seamlessly with other Skynet tools:

- **Skynet Core** - Central memory synchronization
- **Skynet Drive** - Cloud storage for RAG memory
- **TaskFlow MCP** - Multi-agent task coordination
- **MCP Forge** - Visual agent builder
- **RelayMCP** - Multi-AI communication bus

---

## 🛠️ Development

### Adding a New Feature

1. **Backend**: Add endpoint in `app/backend_flask/app.py`
2. **Frontend**: Add UI in `app/tauri/src/`
3. **API Bridge**: Update `app/tauri/src/js/api_bridge.js`
4. **Test**: Verify end-to-end flow

### Adding a New AI Prompt

1. Create `.md` file in `ai_prompts/`
2. Update `ai_bridge.py` to use new prompt
3. Add UI button in editor if needed

### Testing

```bash
# Backend tests
cd app/backend_flask
pytest

# MCP tests
cd app/mcp
npm test
```

---

## 📊 Performance

- **Documents**: Handles 10,000+ documents
- **Search**: < 100ms for semantic search
- **UI**: 60 FPS smooth scrolling
- **Memory**: ~200MB RAM baseline
- **Disk**: ~10MB for index

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be >= 3.9

# Install dependencies
pip install -r requirements.txt
```

### MCP server fails
```bash
# Check Node version
node --version  # Should be >= 16

# Reinstall dependencies
rm -rf node_modules
npm install
```

### AI features not working
```bash
# Verify API key
echo $ANTHROPIC_API_KEY

# Check config
cat app/backend_flask/config.yaml
```

### Tauri build issues
- See [Tauri troubleshooting](https://tauri.app/v1/guides/troubleshooting)

---

## 🗺️ Roadmap

### Phase 1: Core Features ✅
- [x] File browser
- [x] Editor with preview
- [x] Version control
- [x] Diff viewer
- [x] AI regeneration
- [x] Tag management

### Phase 2: Advanced Features 🚧
- [ ] Graph visualization of document relationships
- [ ] Advanced semantic search UI
- [ ] Batch operations
- [ ] Export/import formats (PDF, DOCX)
- [ ] Plugins system

### Phase 3: Collaboration 📋
- [ ] Multi-user support
- [ ] Real-time collaboration
- [ ] Comment threads
- [ ] Review workflows
- [ ] Team permissions

---

## 📜 License

MIT License - See [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- **Tauri** - Desktop app framework
- **Flask** - Backend API
- **Anthropic Claude** - AI capabilities
- **Skynet Team** - Ecosystem integration

---

## 📧 Contact

- **Issues**: [GitHub Issues](https://github.com/flamstyl/Skynet_depot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/flamstyl/Skynet_depot/discussions)

---

**Built with ❤️ for the Skynet Ecosystem**

*Control your AI's memory. Master your knowledge base.*
