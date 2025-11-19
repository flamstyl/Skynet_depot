# ClipboardPro MCP — Skynet Clipboard Intelligence

> **The ultimate AI-powered clipboard manager with OCR and multi-device sync**

ClipboardPro MCP is a comprehensive clipboard management solution that combines intelligent history tracking, OCR text extraction, AI-powered text transformations, and seamless multi-device synchronization through the Model Context Protocol (MCP).

---

## Features

### Core Features
- **Automatic Clipboard Monitoring** — Captures all clipboard content automatically
- **Smart History Management** — SQLite-based persistent storage with full-text search
- **OCR Text Extraction** — Extract text from images using Tesseract/Vision API
- **AI Transformations** — Rewrite, translate, summarize, and clean text using Claude/Gemini
- **Multi-Device Sync** — Synchronize clipboard across devices via MCP server
- **System Tray Integration** — Runs silently in Windows system tray
- **Dark Mode UI** — Beautiful WinUI 3 interface with dark theme

### AI Capabilities
- **Rewrite**: Transform text style (professional, casual, formal)
- **Translate**: Translate to any language
- **Summarize**: Create concise summaries (short, medium, long)
- **Clean**: Remove formatting, fix grammar, normalize whitespace

### Technical Features
- **WinUI 3 Desktop App** — Modern Windows native interface
- **Node.js MCP Server** — Synchronization and AI bridge
- **SQLite Database** — Fast local storage
- **REST API** — Local HTTP API for extensibility
- **Mock OCR** — Development-ready OCR simulation (easily swappable)

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│  WinUI 3 App    │◄───────►│  Local API      │
│  (Frontend)     │  HTTP   │  (Node.js)      │
└─────────────────┘         └─────────────────┘
                                    │
                                    ▼
                            ┌─────────────────┐
                            │  SQLite DB      │
                            │  (History)      │
                            └─────────────────┘

┌─────────────────┐         ┌─────────────────┐
│  MCP Server     │◄───────►│ Claude/Gemini   │
│  (Sync + AI)    │         │ CLI             │
└─────────────────┘         └─────────────────┘
```

See [docs/architecture.md](docs/architecture.md) for detailed architecture documentation.

---

## Quick Start

### Prerequisites

**System Requirements:**
- Windows 10/11 (for WinUI 3 app)
- Node.js 18+ (for backend and MCP server)
- SQLite3 (included)

**Dependencies:**
```bash
# For backend/API/MCP
npm install express cors sqlite3 axios morgan

# For OCR (optional, when ready)
npm install tesseract.js

# For WinUI 3 (use Visual Studio)
# Install WinUI 3 SDK and templates
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/skynet/clipboardpro_mcp.git
cd clipboardpro_mcp
```

2. **Install backend dependencies**
```bash
cd app/backend && npm install
cd ../api && npm install
cd ../mcp && npm install
```

3. **Set up environment**
```bash
# Create .env file
cp .env.example .env

# Configure:
# - MCP_SERVER_URL=http://localhost:3002
# - MCP_API_KEY=your-api-key
# - AI_PROVIDER=claude (or gemini)
```

4. **Start the services**

**Terminal 1 - Local API:**
```bash
cd app/api
node server.js
# Running on http://localhost:3001
```

**Terminal 2 - MCP Server:**
```bash
cd app/mcp
node server.js
# Running on http://localhost:3002
```

**Terminal 3 - WinUI App:**
```bash
# Open ClipboardPro.Desktop.sln in Visual Studio
# Build and run (F5)
```

---

## Usage

### Basic Workflow

1. **Copy Anything** — ClipboardPro automatically captures it
2. **View History** — Browse all clipboard entries in the History page
3. **Extract Text** — Use OCR page for images
4. **Transform with AI** — Rewrite, translate, summarize, or clean text
5. **Sync Devices** — Enable sync in Settings to share across devices

### Keyboard Shortcuts

- `Ctrl+Shift+V` — Open ClipboardPro window
- `Ctrl+H` — View history
- `Ctrl+O` — OCR page
- `Ctrl+I` — AI transformations
- `Ctrl+,` — Settings

### API Usage

**Add clipboard entry:**
```bash
curl -X POST http://localhost:3001/api/history \
  -H "Content-Type: application/json" \
  -d '{"type": "text", "content": "Hello World"}'
```

**Get history:**
```bash
curl http://localhost:3001/api/history?limit=10
```

**OCR processing:**
```bash
curl -X POST http://localhost:3001/api/ocr \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image"}'
```

**AI transformation:**
```bash
curl -X POST http://localhost:3001/api/ai/rewrite \
  -H "Content-Type: application/json" \
  -d '{"text": "your text", "style": "professional"}'
```

---

## Configuration

### Settings (UI)

Access via Settings page in the app:

- **General**: Startup behavior, tray settings
- **Sync**: MCP server URL, API key, device ID
- **AI**: Provider selection (Claude/Gemini), auto-OCR
- **History**: Entry limits, auto-delete rules

### Environment Variables

```bash
# Backend/API
PORT=3001
NODE_ENV=development

# MCP Server
MCP_MODE=http          # or 'stdio' for MCP mode
MCP_SERVER_PORT=3002
MCP_API_KEY=dev-key

# AI Configuration
AI_PROVIDER=claude     # or 'gemini'
AI_PROMPTS_PATH=../../ai_prompts
```

---

## Development

### Project Structure

```
clipboardpro_mcp/
├── app/
│   ├── ClipboardPro.Desktop/     # WinUI 3 application
│   │   ├── Views/                # XAML pages
│   │   ├── ViewModels/           # View models
│   │   └── Services/             # App services
│   ├── mcp/                      # MCP server
│   │   ├── server.js
│   │   └── tools/                # Sync, OCR, AI tools
│   ├── backend/                  # Local backend
│   │   ├── database.js
│   │   ├── history_manager.js
│   │   └── ...
│   └── api/                      # REST API
│       ├── server.js
│       └── routes.js
├── data/                         # SQLite database
├── ai_prompts/                   # AI prompt templates
├── examples/                     # Mock data examples
└── docs/                         # Documentation
```

### Adding New Features

**Example: Add a new AI transformation**

1. Create prompt in `ai_prompts/your_action.md`
2. Add tool definition in `app/mcp/config.mcp.json`
3. Implement handler in `app/mcp/tools/ai_bridge.js`
4. Add API route in `app/api/routes.js`
5. Update UI in WinUI app

### Running Tests

```bash
# Backend tests
cd app/backend
npm test

# API tests
cd app/api
npm test

# MCP tests
cd app/mcp
npm test
```

---

## MCP Integration

ClipboardPro can run in two modes:

### HTTP Mode (Default)
Standard REST API server for local communication.

### MCP Mode (STDIO)
For integration with MCP-compatible tools:

```bash
export MCP_MODE=stdio
node app/mcp/server.js
```

Add to Claude Desktop config:
```json
{
  "mcpServers": {
    "clipboardpro": {
      "command": "node",
      "args": ["path/to/app/mcp/server.js"],
      "env": {
        "MCP_MODE": "stdio"
      }
    }
  }
}
```

---

## Troubleshooting

### Common Issues

**Clipboard not being captured:**
- Check if ClipboardWatcher service is running
- Verify app has clipboard access permissions
- Check Windows privacy settings

**OCR not working:**
- Mock OCR is enabled by default for development
- To use real OCR, install Tesseract.js: `npm install tesseract.js`
- Uncomment real implementation in `app/mcp/tools/ocr.js`

**Sync not connecting:**
- Verify MCP server is running (`http://localhost:3002/health`)
- Check API key in Settings
- Ensure firewall allows local connections

**AI transformations failing:**
- Verify Claude/Gemini CLI is installed and in PATH
- Check AI provider in Settings
- Review API key configuration

---

## Roadmap

- [x] Basic clipboard monitoring
- [x] History management with SQLite
- [x] OCR mock implementation
- [x] AI transformations (mock)
- [x] Multi-device sync architecture
- [x] WinUI 3 interface
- [ ] Real OCR integration (Tesseract.js)
- [ ] Real Claude/Gemini CLI integration
- [ ] End-to-end encryption for sync
- [ ] Plugin system for extensibility
- [ ] macOS/Linux support
- [ ] Mobile app (React Native)
- [ ] Cloud backup option
- [ ] Analytics dashboard

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/skynet/clipboardpro_mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/skynet/clipboardpro_mcp/discussions)

---

## Credits

**Built with:**
- [WinUI 3](https://docs.microsoft.com/windows/apps/winui/winui3/) - Modern Windows UI framework
- [Express.js](https://expressjs.com/) - Web framework for Node.js
- [SQLite](https://www.sqlite.org/) - Lightweight database
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) - AI integration standard
- [Claude](https://www.anthropic.com/claude) - AI language model
- [Gemini](https://deepmind.google/technologies/gemini/) - Google AI model

**Part of the Skynet Depot ecosystem**

---

**Version:** 1.0.0
**Last Updated:** 2025-11-18
**Maintainer:** Skynet Depot Team
