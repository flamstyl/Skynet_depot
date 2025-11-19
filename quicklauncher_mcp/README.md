# 🚀 QuickLauncher MCP — Skynet Universal Launcher

**QuickLauncher MCP** is a powerful, AI-enhanced universal launcher for Windows — your personal **Raycast** with full **Skynet ecosystem** integration.

---

## ✨ Features

- **⚡ Instant Search** - Find apps, files, and commands in <200ms
- **🤖 AI-Powered** - Integrated Claude/Gemini for intelligent actions
- **🔌 Plugin System** - Extensible with JavaScript plugins
- **🔄 Multi-Device Sync** - Sync your index and settings via MCP
- **⌨️ Global Hotkey** - Launch with `Alt+Space` from anywhere
- **🎨 Beautiful UI** - Clean, dark-mode interface
- **🌐 Web Integration** - Search multiple engines instantly
- **⚙️ System Control** - Quick system actions (shutdown, lock, etc.)

---

## 📦 Installation

### Prerequisites

- **Windows 10/11**
- **Node.js 18+** (for Electron & MCP)
- **Python 3.10+** (for backend)
- **Git** (for installation)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/flamstyl/Skynet_depot.git
cd Skynet_depot/quicklauncher_mcp

# Install dependencies

# 1. Electron frontend
cd launcher/electron_app
npm install
cd ../..

# 2. Python backend
cd backend/python_server
pip install -r requirements.txt
cd ../..

# 3. MCP server
cd backend/mcp
npm install
cd ../..
```

### Configuration

1. Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

2. Edit `.env` with your preferences:

```env
AI_BACKEND=claude_cli
MCP_PORT=3000
BACKEND_PORT=8765
```

3. (Optional) Configure settings in `launcher/config/settings.json`

---

## 🚀 Running QuickLauncher

You need to run **three components**:

### 1. Start Python Backend

```bash
cd backend/python_server
python server.py
```

The backend runs on `http://localhost:8765`

### 2. Start MCP Server (Optional - for sync features)

```bash
cd backend/mcp
npm start
```

The MCP server runs on `http://localhost:3000`

### 3. Start Electron App

```bash
cd launcher/electron_app
npm start
```

The launcher window opens with `Alt+Space`

---

## ⌨️ Usage

### Basic Search

1. Press `Alt+Space` to open QuickLauncher
2. Type to search:
   - **Apps**: `notepad`, `calculator`, `chrome`
   - **Files**: `resume.pdf`, `project`
   - **Commands**: `shutdown`, `restart`, `lock`
3. Navigate with arrow keys
4. Press `Enter` to execute

### AI Mode

1. Type `>` to enter AI mode
2. Ask questions or give commands:
   - `>open notepad and search for python tutorials`
   - `>what's my IP address`
   - `>shutdown my computer in 5 minutes`
3. AI suggests actions based on your query

### Keyboard Shortcuts

- `Alt+Space` - Open launcher
- `Escape` - Close launcher
- `↑` / `↓` - Navigate results
- `Enter` - Execute selected action
- `Ctrl+R` - Rebuild search index

---

## 🔌 Plugins

QuickLauncher supports custom JavaScript plugins.

### Default Plugins

1. **open_app** - Open applications
2. **search_web** - Search Google, DuckDuckGo, etc.
3. **system_actions** - Shutdown, restart, lock, etc.

### Creating a Custom Plugin

Create a file in `launcher/plugins/custom/my_plugin.plugin.js`:

```javascript
module.exports = {
    name: 'my_plugin',
    description: 'My custom plugin',
    version: '1.0.0',
    keywords: ['custom', 'my'],

    execute: async (input, context) => {
        // Your plugin logic
        return {
            type: 'action',
            data: { /* ... */ }
        };
    },

    search: async (query) => {
        // Return search results
        return [
            {
                title: 'My Action',
                subtitle: 'Description',
                action: { type: 'open', target: '...' }
            }
        ];
    }
};
```

Plugin API documentation: `docs/PLUGIN_API.md` (TODO)

---

## 🧠 AI Integration

QuickLauncher can connect to AI backends:

### Option 1: Claude CLI (Recommended)

Install Claude CLI and set in `.env`:

```env
AI_BACKEND=claude_cli
```

### Option 2: Gemini CLI

Install Gemini CLI and set in `.env`:

```env
AI_BACKEND=gemini_cli
```

### Option 3: API (Anthropic, OpenAI)

Set your API key in `.env`:

```env
AI_BACKEND=api
ANTHROPIC_API_KEY=your_key_here
```

---

## 🔄 Multi-Device Sync

Sync your search index across devices via MCP:

1. Start MCP server on a central machine
2. Configure `MCP_URL` in `.env` on each device
3. Enable sync in `launcher/config/settings.json`:

```json
{
  "mcp": {
    "enabled": true,
    "syncEnabled": true,
    "autoSync": true
  }
}
```

Your search index, frequency data, and custom plugins will sync automatically.

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│     Electron UI (Frontend)      │
│  - Search bar                   │
│  - Results display              │
│  - AI prompt mode               │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Python Backend (FastAPI)      │
│  - Indexer (SQLite)             │
│  - Actions Manager              │
│  - AI Bridge                    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│    MCP Server (Node.js)         │
│  - Index Sync                   │
│  - AI Routing                   │
│  - Plugin Distribution          │
└─────────────────────────────────┘
```

Full architecture: `docs/architecture.md`

---

## 📁 Project Structure

```
quicklauncher_mcp/
├── launcher/              # Electron frontend
│   ├── electron_app/      # Main Electron app
│   ├── plugins/           # Plugin system
│   └── config/            # Configuration files
│
├── backend/
│   ├── python_server/     # FastAPI backend
│   └── mcp/               # MCP server (Node.js)
│
├── data/                  # Database & cache
├── ai_prompts/            # AI prompt templates
└── docs/                  # Documentation
```

---

## 🛠️ Development

### Development Mode

Run in dev mode with auto-reload:

```bash
# Backend
cd backend/python_server
uvicorn server:app --reload --port 8765

# MCP
cd backend/mcp
npm run dev

# Electron
cd launcher/electron_app
npm run dev
```

### Building for Production

```bash
cd launcher/electron_app
npm run build
```

This creates a Windows installer in `dist/`

---

## 🔧 Configuration Files

- `launcher/config/settings.json` - Main app settings
- `launcher/config/plugins.json` - Plugin configuration
- `backend/python_server/config.yaml` - Indexer settings
- `backend/mcp/config.mcp.json` - MCP configuration
- `.env` - Environment variables

---

## 🐛 Troubleshooting

### Launcher doesn't open

- Check if backend is running: `http://localhost:8765/health`
- Check Electron logs in console
- Try different hotkey in settings

### Search not working

- Rebuild index: Press `Ctrl+R` in launcher
- Check backend logs
- Verify database file exists: `data/index.db`

### AI mode not responding

- Verify AI backend is installed and accessible
- Check `.env` configuration
- Try fallback to different AI backend

### MCP sync failing

- Ensure MCP server is running
- Check network connectivity
- Verify `MCP_URL` in configuration

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 TODO / Roadmap

- [ ] Float overlay mode (transparent launcher)
- [ ] Developer command palette
- [ ] Contextual AI mode (Raycast AI equivalent)
- [ ] Browser extension integration
- [ ] Mobile companion app
- [ ] Voice activation
- [ ] Workflow automation
- [ ] Cloud plugin registry
- [ ] Themes support
- [ ] Search history analytics

---

## 📄 License

MIT License - see `LICENSE` file

---

## 🙏 Credits

Built with:
- **Electron** - Cross-platform desktop apps
- **FastAPI** - Modern Python web framework
- **SQLite** - Embedded database
- **Node.js** - MCP server
- **Claude / Gemini** - AI integration

Part of the **Skynet Ecosystem** 🌐

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/flamstyl/Skynet_depot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/flamstyl/Skynet_depot/discussions)
- **Skynet Discord**: [Join here](#) (TODO)

---

**Made with 💜 by the Skynet Team**

*QuickLauncher MCP — Your universal command center.*
