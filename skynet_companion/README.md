# 🤖 Skynet Companion — Your AI Overlay for Windows

> *A persistent AI assistant overlay for Windows that's always there when you need it.*

**Skynet Companion** is a floating, always-on-top Windows application that provides instant access to multiple AI agents (Claude, ChatGPT, Gemini, etc.) through voice, clipboard monitoring, and chat. Think of it as your personal Jarvis.

---

## ✨ Features

### 🎤 Voice Activation
- **Hotkey**: Press `Ctrl+Space` anywhere in Windows
- Voice transcription via Whisper (local or API)
- Instant AI responses displayed in overlay

### 📋 Clipboard Intelligence
- **Auto-monitoring**: Detects when you copy text
- **Smart analysis**: Summarize, translate, explain, improve
- **Quick actions**: One-click AI operations on clipboard content

### 💬 Multi-Agent Chat
- **Switch agents** on the fly: Claude, ChatGPT, Gemini, Comet
- Real-time streaming responses
- Persistent chat history

### 🧠 Memory System
- **Short-term**: Local JSON storage of recent interactions
- **Long-term**: MCP-backed semantic memory
- **Search**: Find past conversations and clipboard items
- **Export/Import**: Backup your memory

### 🪟 Always-Visible Overlay
- **Draggable** and **resizable**
- **Semi-transparent** dark mode UI
- **Minimizable** to small bubble
- **Never intrusive** — stays out of your way

---

## 🎯 Use Cases

| Scenario | How Skynet Helps |
|----------|------------------|
| **Coding** | Copy code → Get explanation, improvements, bug fixes |
| **Writing** | Copy text → Get grammar fixes, translations, rewrites |
| **Research** | Voice ask: "Summarize this article" → Instant summary |
| **Learning** | Ask questions while working, build knowledge memory |
| **Productivity** | Quick AI actions without leaving your current app |

---

## 📁 Project Structure

```
skynet_companion/
├── src/                           # WinUI3 C# Application
│   └── SkynetCompanion/
│       ├── App.xaml               # Application entry
│       ├── MainWindow.xaml        # Main window (hidden/tray)
│       ├── Windows/
│       │   ├── OverlayWindow.xaml # Main overlay UI
│       │   └── SettingsWindow.xaml
│       ├── Controls/
│       │   ├── ChatPanel.xaml     # Chat interface
│       │   ├── QuickActions.xaml  # Clipboard quick actions
│       │   └── MemoryPanel.xaml   # Memory browser
│       ├── Services/
│       │   ├── HotkeyService.cs   # Global hotkey registration
│       │   ├── WhisperService.cs  # Voice transcription
│       │   ├── MCPClient.cs       # MCP API client
│       │   ├── ClipboardService.cs# Clipboard monitoring
│       │   └── MemoryService.cs   # Memory management
│       └── Models/
│           ├── MCPMessage.cs
│           ├── CompanionSettings.cs
│           └── MemoryEntry.cs
│
├── backend/                       # Python FastAPI Backend
│   ├── companion_api.py           # Main API endpoints
│   ├── websocket_bridge.py        # MCP WebSocket bridge
│   ├── config.yaml                # Configuration
│   └── requirements.txt
│
├── prompts/                       # AI Prompts
│   ├── clipboard_analyze.md
│   ├── voice_query.md
│   └── memory_update.md
│
├── data/                          # Application data
│   ├── memory_short.json          # Short-term memory
│   └── logs/
│       └── companion.log
│
└── docs/                          # Documentation
    ├── architecture.md            # Technical architecture
    └── usage_example.md           # Complete usage guide
```

---

## 🚀 Quick Start

### Prerequisites

**Windows**:
- Windows 10/11
- .NET 8 SDK
- Visual Studio 2022 (with Windows App SDK workload)

**Python**:
- Python 3.10+
- pip

### Installation

#### 1️⃣ Clone Repository
```bash
git clone https://github.com/your-org/skynet_companion.git
cd skynet_companion
```

#### 2️⃣ Setup Python Backend
```bash
cd backend
pip install -r requirements.txt
```

#### 3️⃣ Start Backend API
```bash
python companion_api.py
# Or using uvicorn directly:
uvicorn companion_api:app --host 127.0.0.1 --port 8765 --reload
```

Verify backend is running:
```bash
curl http://localhost:8765/health
```

#### 4️⃣ Build WinUI3 App
```bash
cd ../src
dotnet restore
dotnet build
```

#### 5️⃣ Run Application
```bash
dotnet run --project SkynetCompanion
```

The overlay should appear in the top-right corner of your screen!

---

## ⚙️ Configuration

### Backend Configuration

Edit `backend/config.yaml`:

```yaml
mcp:
  server_url: "ws://localhost:8080/mcp"  # Your MCP Server
  timeout: 30

agents:
  - name: "claude"
    enabled: true
  - name: "gpt"
    enabled: true
  - name: "gemini"
    enabled: true

features:
  voice_enabled: true
  clipboard_monitoring: true
  memory_enabled: true

api:
  host: "127.0.0.1"
  port: 8765
```

### Application Settings

Settings are stored in:
```
%LOCALAPPDATA%\SkynetCompanion\settings.json
```

Default settings:
```json
{
  "default_agent": "claude",
  "voice_enabled": true,
  "clipboard_monitoring": true,
  "backend_url": "http://localhost:8765",
  "hotkeys": {
    "voice_activation": "Ctrl+Space",
    "toggle_overlay": "Ctrl+Shift+A"
  },
  "overlay": {
    "opacity": 0.9,
    "position": "top-right",
    "width": 400,
    "height": 600
  }
}
```

---

## 🎮 Usage

### Voice Activation

1. Press `Ctrl+Space` anywhere in Windows
2. Speak your query (e.g., "Summarize my clipboard")
3. Overlay displays AI response
4. Interaction saved to memory

### Clipboard Quick Actions

1. Copy text (`Ctrl+C`)
2. Overlay detects and shows notification
3. Click quick action: **Summarize**, **Translate**, **Explain**, **Improve**
4. Result displayed with copy button

### Chat with AI

1. Click overlay to expand
2. Select **Chat** tab
3. Choose agent (Claude/GPT/Gemini)
4. Type message and press Enter
5. Get streaming response

### Search Memory

1. Select **Memory** tab
2. Search by keywords, tags, or dates
3. Click entry to view full details
4. Export memory to JSON file

---

## 🔌 MCP Integration

Skynet Companion connects to an MCP Server to route requests to different AI agents.

### Expected MCP Endpoints

```
ws://localhost:8080/mcp          # WebSocket connection
POST /agents/claude              # Claude Code
POST /agents/gpt                 # ChatGPT
POST /agents/gemini              # Gemini
POST /agents/comet               # Perplexity/Comet
```

### MCP Message Format

**Request**:
```json
{
  "agent": "claude",
  "content": "User query here",
  "context": {
    "type": "voice|chat|clipboard",
    "clipboard": "...",
    "memory": [...]
  },
  "type": "query"
}
```

**Response**:
```json
{
  "content": "AI response here",
  "agent": "claude",
  "success": true,
  "timestamp": "2025-11-19T12:00:00Z"
}
```

---

## 🛠️ Development

### MVP Features (Current)

- ✅ WinUI3 Overlay (draggable, always-on-top)
- ✅ Global hotkey registration (`Ctrl+Space`)
- ✅ Clipboard monitoring
- ✅ Mock Whisper service
- ✅ MCP Client (HTTP REST)
- ✅ Chat panel with agent selection
- ✅ Quick actions (6 actions)
- ✅ Local memory (JSON)
- ✅ Python backend API
- ✅ WebSocket bridge to MCP

### TODO: Phase 2

- [ ] Real Whisper.cpp integration (local transcription)
- [ ] Win32 window positioning (always-on-top, draggable)
- [ ] System tray icon with context menu
- [ ] Settings window UI
- [ ] Auto-start on Windows boot
- [ ] Streaming responses (WebSocket)
- [ ] Voice output (TTS)
- [ ] Multi-monitor support
- [ ] Custom themes
- [ ] Plugin system

### TODO: Phase 3

- [ ] Screen capture + Vision AI
- [ ] Gesture recognition
- [ ] 3D avatar (ReadyPlayerMe)
- [ ] Mobile companion app (sync)
- [ ] VR/AR HUD mode
- [ ] Advanced memory graph
- [ ] Custom agent training

---

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:8765/health

# Send message
curl -X POST http://localhost:8765/overlay/send \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test1",
    "agent": "claude",
    "content": "Hello!",
    "type": "query"
  }'

# Get agents
curl http://localhost:8765/overlay/agents
```

### Test Frontend (C#)

Run unit tests:
```bash
cd src
dotnet test
```

### Mock Mode

If MCP Server is not available, the backend uses **MockMCPBridge** which returns mock responses for testing.

---

## 📊 Architecture

See [docs/architecture.md](docs/architecture.md) for detailed technical architecture.

**High-Level Flow**:
```
User → Overlay (WinUI3)
  ├─► Hotkey → Voice → Whisper → Transcription
  ├─► Clipboard Monitor → Text Detection
  └─► Chat Input → Message

Overlay → MCPClient (C#)
  └─► HTTP/WebSocket → Backend API (Python)
      └─► WebSocket Bridge → MCP Server
          └─► Route to Agent (Claude/GPT/Gemini)
              └─► Response → Display in Overlay
                  └─► Save to Memory
```

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Credits

**Built with**:
- [WinUI 3](https://docs.microsoft.com/en-us/windows/apps/winui/winui3/) - Windows UI framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python backend
- [Whisper](https://github.com/openai/whisper) - Speech-to-text
- [MCP Protocol](https://github.com/your-mcp-repo) - Multi-agent communication

**Part of the Skynet AI Systems family**:
- Skynet Memory Visualizer
- Skynet Linker CLI
- Skynet HUD (coming soon)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/skynet_companion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/skynet_companion/discussions)
- **Email**: support@skynet-ai.dev

---

## 🎉 Fun Fact

This entire project was generated by **Claude Code 4.5** based on a single detailed prompt. The AI wrote:
- ✅ Complete WinUI3 application skeleton
- ✅ All C# services and models
- ✅ Python FastAPI backend
- ✅ AI prompts for clipboard/voice/memory
- ✅ Full documentation

**Meta**: An AI helping you build an AI assistant. 🤯

---

**Made with 🤖 by the Skynet Team**

*"Your AI companion, always by your side."*
