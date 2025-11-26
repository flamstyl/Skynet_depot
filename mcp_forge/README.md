# 🔥 MCP Forge — Skynet Agent Builder

**Visual AI Agent Construction System for Skynet OS**

MCP Forge is the **God-Mode agent builder** — a visual, drag-and-drop interface to construct, simulate, validate, and deploy AI agents without coding.

Think: **Node-RED + LangGraph Studio + Godot Node System** → but for Skynet agents.

---

## 🎯 **What is MCP Forge?**

MCP Forge lets you:

- **Visually design** AI agents using drag-and-drop nodes
- **Configure** triggers, inputs, processing, and outputs
- **Validate** with AI (Claude/GPT/Gemini) for best practices
- **Simulate** agent execution with dry-run mode
- **Export** to YAML/JSON for Skynet Core or n8n workflows
- **Deploy** directly to your Skynet agents directory

### Who is this for?

- **AI enthusiasts** building autonomous agents
- **Developers** automating workflows with AI
- **Teams** managing multiple AI agents
- **Anyone** who wants to create AI agents without writing code

---

## 🚀 **Features**

### Visual Canvas Editor
- Drag & drop node system (inspired by Node-RED)
- Real-time connection validation
- Zoom, pan, undo/redo
- Auto-save every 30 seconds
- Dark mode (Skynet aesthetic)

### Node Library
**Agent Models**:
- Claude (Sonnet 4, Opus 4)
- GPT (GPT-4, GPT-4 Turbo)
- Gemini Pro
- Codestral

**Triggers**:
- Cron schedules
- Folder watchers
- Email monitors
- API webhooks

**Processing**:
- Memory blocks (persistent/temporary)
- Prompt templates
- Action chains
- Decision logic

**Outputs**:
- File/Drive export
- Webhooks
- Log writers
- Email senders

### AI-Powered Validation
- **Validate**: Check for errors and issues
- **Improve**: Get AI suggestions for optimization
- **Metadata**: Auto-generate descriptions and tags
- **Cycles**: Analyze execution flows

### Dry-Run Simulation
- Test agents without real execution
- Mock AI responses
- Step-by-step logging
- Performance analysis

### Export Formats
- **YAML**: Skynet Core agents
- **JSON**: Generic agent format
- **n8n**: Workflow JSON (coming soon)

### MCP Integration
- MCP tools for validation and deployment
- Sync agents to Skynet Core
- Version control and backups

---

## 📦 **Installation**

### Prerequisites

- **Node.js** 20+
- **Python** 3.11+ (for test tools)
- **Electron** (bundled)

### Quick Start

```bash
# Clone the repository
cd mcp_forge

# Install Electron app dependencies
cd forge_app/electron_app
npm install

# Install backend dependencies
cd ../backend_node
npm install

# Install MCP dependencies
cd ../mcp
npm install

# Start backend server
npm start
# Backend runs on http://localhost:3000

# Start Electron app (in another terminal)
cd ../electron_app
npm start
```

### Environment Variables

Create a `.env` file in `forge_app/backend_node/`:

```env
# AI API Keys (optional - for AI validation)
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Paths
SKYNET_AGENTS_PATH=/agents/
PORT=3000
```

---

## 🎨 **Usage**

### Creating Your First Agent

1. **Launch MCP Forge**
   ```bash
   npm start
   ```

2. **Click "New Agent"** on the dashboard

3. **Drag nodes** from the library onto the canvas:
   - Add a **Claude Agent** node (AI model)
   - Add a **Cron Trigger** node (schedule)
   - Add a **Drive Output** node (save results)

4. **Connect nodes** by dragging from output ports to input ports

5. **Configure nodes** by selecting them (properties panel on right)

6. **Test your agent**:
   - Click **"Simulate"** for dry-run
   - Review execution log

7. **Validate with AI**:
   - Click **"Validate"** for AI feedback
   - Review suggestions

8. **Export**:
   - Click **"YAML"** or **"JSON"**
   - Choose save location

9. **Deploy to Skynet**:
   - Save agent to `/agents/` directory
   - Agent is now ready to run

### Example Agent Workflow

```
Cron Trigger (hourly)
  ↓
Folder Watcher (./inbox)
  ↓
Claude Agent (process files)
  ↓
Drive Output (./reports)
  ↓
Log Writer (./logs)
```

---

## 📚 **Documentation**

- **[Architecture](docs/architecture.md)** — System design and components
- **[API Reference](docs/api.md)** — Backend API endpoints (coming soon)
- **[Node Types](docs/nodes.md)** — Complete node library (coming soon)
- **[Examples](data/exports/)** — Example agent configurations

---

## 🧪 **Testing**

### Python Test Tools

Test agent configurations:

```bash
# Test agent structure and configuration
python forge_app/python_tools/test_agent.py data/exports/example_email_assistant.yaml

# Simulate agent execution cycles
python forge_app/python_tools/simulate_cycle.py data/exports/example_email_assistant.yaml

# Run multiple cycles
python forge_app/python_tools/simulate_cycle.py data/exports/example_email_assistant.yaml 3
```

### Backend API Tests

```bash
cd forge_app/backend_node
npm test
```

---

## 🔧 **Development**

### Project Structure

```
mcp_forge/
├── forge_app/
│   ├── electron_app/       # Electron UI (canvas, editor)
│   ├── backend_node/       # Node.js backend (export, validate)
│   ├── mcp/                # MCP server (AI tools)
│   └── python_tools/       # Testing tools
├── data/
│   ├── agents_preview/     # Dry-run outputs
│   └── exports/            # Exported agents
├── ai_prompts/             # AI validation prompts
└── docs/                   # Documentation
```

### Tech Stack

- **Frontend**: Electron + Vanilla JS + Canvas API
- **Backend**: Node.js + Express
- **MCP**: Model Context Protocol SDK
- **Python**: Testing and simulation
- **Export**: YAML (js-yaml), JSON

### Running in Dev Mode

```bash
# Backend with hot reload
cd forge_app/backend_node
npm run dev

# Electron with DevTools
cd forge_app/electron_app
npm run dev

# MCP server
cd forge_app/mcp
node server.js
```

---

## 🌐 **API Endpoints**

Backend server (`http://localhost:3000`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/export/yaml` | POST | Export to YAML |
| `/api/export/json` | POST | Export to JSON |
| `/api/export/n8n` | POST | Export to n8n workflow |
| `/api/validate/structure` | POST | Validate structure |
| `/api/validate/ai` | POST | AI validation |
| `/api/dry-run` | POST | Dry-run simulation |
| `/api/save` | POST | Save agent project |
| `/api/load/:id` | GET | Load agent project |
| `/api/templates` | GET | List templates |
| `/api/deploy` | POST | Deploy to Skynet |

---

## 🤖 **MCP Tools**

MCP Forge provides these tools for Claude/AI:

- `validate_agent` — Validate with AI
- `improve_agent` — Get improvement suggestions
- `generate_metadata` — Auto-generate metadata
- `sync_to_skynet` — Deploy to Skynet
- `test_agent` — Run tests
- `export_agent` — Export to format

### Using MCP Tools

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "mcp-forge": {
      "command": "node",
      "args": ["/path/to/mcp_forge/forge_app/mcp/server.js"],
      "env": {
        "CLAUDE_API_KEY": "your-key",
        "SKYNET_AGENTS_PATH": "/agents/"
      }
    }
  }
}
```

---

## 📋 **Agent Configuration Format**

### YAML Format (Skynet Core)

```yaml
name: my_agent
version: 1.0.0
model: claude-sonnet-4

memory:
  type: persistent
  path: ./memory/my_agent.json

triggers:
  - type: cron
    schedule: "0 9 * * *"
    timezone: UTC

processing:
  role: "You are a helpful assistant."
  temperature: 0.7
  max_tokens: 4096

outputs:
  - type: drive
    path: ./output
```

### JSON Format (Generic)

```json
{
  "name": "my_agent",
  "version": "1.0.0",
  "model": "claude-sonnet-4",
  "memory": {
    "type": "persistent",
    "path": "./memory/my_agent.json"
  },
  "triggers": [
    {
      "type": "cron",
      "schedule": "0 9 * * *"
    }
  ],
  "processing": {
    "role": "You are a helpful assistant.",
    "temperature": 0.7,
    "max_tokens": 4096
  }
}
```

---

## 🎓 **Examples**

See `data/exports/` for complete examples:

- **Email Assistant** — Process emails and draft responses
- **File Organizer** — Watch folders and organize files
- **Data Analyzer** — Analyze data and generate reports
- **Notification Agent** — Monitor events and send alerts

---

## 🔐 **Security**

- **Never send credentials to AI validators** — Prompts are sanitized
- **Sandboxed dry-runs** — Simulations don't execute real actions
- **Export sanitization** — Sensitive data stripped from exports
- **Audit logging** — All operations logged

---

## 🚧 **Roadmap**

### Phase 1 (Current)
- ✅ Visual canvas editor
- ✅ YAML/JSON export
- ✅ Dry-run simulation
- ✅ AI validation
- ✅ MCP integration

### Phase 2
- [ ] Multi-agent orchestration
- [ ] Visual debugger
- [ ] Performance profiling
- [ ] Agent marketplace

### Phase 3
- [ ] Collaborative editing
- [ ] Cloud sync
- [ ] Template library
- [ ] Auto-optimization AI

### Phase 4
- [ ] Natural language agent creation
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] Version diffing

---

## 🤝 **Contributing**

Contributions welcome! See `CONTRIBUTING.md` (coming soon).

---

## 📄 **License**

MIT License - Part of Skynet Ecosystem

---

## 🙏 **Credits**

Built with:
- [Electron](https://www.electronjs.org/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude API](https://www.anthropic.com/)
- [js-yaml](https://github.com/nodeca/js-yaml)

Inspired by:
- Node-RED visual programming
- LangGraph Studio
- Godot Engine node system

---

## 📞 **Support**

- **Issues**: [GitHub Issues](https://github.com/flamstyl/Skynet_depot/issues)
- **Docs**: [Full Documentation](docs/)

---

**🔥 MCP Forge — Build AI agents visually, deploy instantly.**

Made with 🔥 for Skynet OS
