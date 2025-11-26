# 📡 RelayMCP - Skynet AI Interlink Bus

**Multi-AI Communication Relay Server**

RelayMCP is a centralized message bus for coordinating multiple local AI agents (Claude, GPT, Gemini, Perplexity, etc.) without relying on external backends. It provides standardized message routing, persistent history, real-time monitoring, and meta-analysis capabilities.

---

## 🎯 Features

- **🔌 Multi-AI Connector Support**: Claude CLI, GPT API, Gemini CLI, Perplexity (file-based)
- **📨 MCP Protocol**: Standardized Message Communication Protocol for inter-AI messaging
- **🔄 Message Bus**: Async routing, queuing, and delivery with priority support
- **💾 Persistent Storage**: SQLite + JSONL logs for message history
- **⚡ Circular Buffer**: In-memory message cache with TTL and drop policies
- **📊 Real-time Dashboard**: Flask-based web UI with live statistics
- **🔍 REST API**: FastAPI endpoints for programmatic access
- **🧠 AI Meta-Analysis**: Prompts for traffic analysis, conflict resolution, and summarization
- **🛡️ Fault Tolerance**: Timeout handling, error tracking, health checks

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│             AI AGENTS (Claude, GPT, etc.)           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │  FastAPI REST │
         │   Interface   │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │  Relay Server │
         │  Core Runtime │
         └───────┬───────┘
                 │
      ┏━━━━━━━━━┻━━━━━━━━━┓
      ▼                    ▼
┌─────────────┐    ┌──────────────┐
│ Message Bus │    │  Persistence │
│  + Buffer   │    │   (DB+JSONL) │
└─────────────┘    └──────────────┘
      │
      ▼
┌─────────────┐
│  Dashboard  │
│   (Flask)   │
└─────────────┘
```

See [docs/architecture.md](docs/architecture.md) for detailed design.

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- pip

### Installation

1. **Clone the repository**
   ```bash
   cd relay_mcp
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure connectors**
   Edit `core/config.yaml` to enable/configure AI connectors:
   ```yaml
   connectors:
     claude:
       enabled: true
       command: "claude"
     gpt:
       enabled: true
       api_key: "${OPENAI_API_KEY}"
     gemini:
       enabled: true
   ```

4. **Start the relay server**
   ```bash
   # Terminal 1: Start FastAPI server
   python -m api.fastapi_app
   ```

5. **Start the dashboard (optional)**
   ```bash
   # Terminal 2: Start Flask dashboard
   python dashboard/app.py
   ```

6. **Access the dashboard**
   Open browser to: http://127.0.0.1:5000

---

## 📚 Usage

### Sending Messages via API

```bash
curl -X POST http://127.0.0.1:8000/mcp/send \
  -H "Content-Type: application/json" \
  -d '{
    "from": "gemini",
    "to": "claude",
    "payload": {
      "content": "Analyze this error: NullPointerException in main.java:42",
      "context": {"priority": "high"}
    }
  }'
```

### Getting Statistics

```bash
curl http://127.0.0.1:8000/mcp/stats
```

### Viewing Recent Messages

```bash
curl http://127.0.0.1:8000/mcp/logs/recent?limit=10
```

### Checking Buffer Status

```bash
curl http://127.0.0.1:8000/mcp/buffer?limit=50
```

---

## 🔌 Adding a New Connector

1. **Create connector file** in `core/ia_connectors/`:
   ```python
   # my_ai_connector.py
   from . import IAConnector

   class MyAIConnector(IAConnector):
       async def send(self, payload):
           # Implement AI communication
           return {"content": "...", "tokens_used": 100, "model": "my-ai"}

       async def health_check(self):
           return True
   ```

2. **Register in relay server** (`core/relay_server.py`):
   ```python
   from core.ia_connectors import MyAIConnector

   # In _register_connectors():
   if connectors_config.get("myai", {}).get("enabled", False):
       myai = MyAIConnector(connectors_config["myai"])
       self.message_bus.register_connector("myai", myai)
   ```

3. **Add to config** (`core/config.yaml`):
   ```yaml
   connectors:
     myai:
       enabled: true
       api_key: "..."
       timeout_seconds: 60
   ```

---

## 📊 Dashboard Features

The real-time dashboard shows:

- **Active Connections**: Which AI connectors are online
- **Traffic Statistics**: Messages processed, latency, error rates
- **Connection Graph**: Visual map of AI interactions
- **Message Activity**: Traffic breakdown by AI
- **Recent Messages**: Live message feed
- **Buffer Status**: Memory utilization

Auto-refreshes every 5 seconds.

---

## 🧠 AI Meta-Analysis

Use the prompts in `ai_prompts/` to analyze RelayMCP traffic:

### 1. Traffic Summary
```bash
# Export recent logs
curl http://127.0.0.1:8000/mcp/logs/recent?limit=1000 > traffic.json

# Send to Claude with ai_prompts/summarise_traffic.md
cat traffic.json | claude --prompt @ai_prompts/summarise_traffic.md
```

### 2. Conflict Resolution
When multiple AIs give different answers:
```bash
# Use ai_prompts/conflict_resolution.md to arbitrate
```

### 3. Meta Analysis
```bash
# Use ai_prompts/relay_meta.md for comprehensive analysis
```

---

## 🛠️ Configuration Reference

### Server Config (`core/config.yaml`)

```yaml
server:
  host: "127.0.0.1"
  port: 8000

dashboard:
  enabled: true
  port: 5000
  auto_refresh_seconds: 5

buffer:
  max_size: 10000
  ttl_seconds: 86400  # 24 hours
  drop_policy: "oldest_first"

persistence:
  db_path: "data/buffer.db"
  jsonl_path: "data/logs/mcp_traffic.jsonl"

connectors:
  claude:
    enabled: true
    command: "claude"
    timeout_seconds: 60
```

---

## 📁 Project Structure

```
relay_mcp/
├── core/                   # Core system components
│   ├── protocol_mcp.py     # MCP protocol definitions
│   ├── message_bus.py      # Message routing & queuing
│   ├── buffer_manager.py   # Circular buffer
│   ├── persistence.py      # SQLite + JSONL storage
│   ├── relay_server.py     # Main server runtime
│   ├── config.yaml         # Configuration
│   └── ia_connectors/      # AI connector implementations
│       ├── claude_cli.py
│       ├── gpt_local.py
│       ├── gemini_cli.py
│       └── perplexity_bridge.py
├── api/                    # FastAPI REST interface
│   ├── fastapi_app.py      # API endpoints
│   └── schemas.py          # Pydantic models
├── dashboard/              # Flask dashboard
│   ├── app.py
│   ├── templates/
│   └── static/
├── data/                   # Runtime data
│   ├── logs/
│   ├── buffer.db
│   └── snapshots/
├── ai_prompts/             # Meta-analysis prompts
│   ├── relay_meta.md
│   ├── conflict_resolution.md
│   └── summarise_traffic.md
├── docs/                   # Documentation
│   └── architecture.md
└── tests/                  # Unit tests
```

---

## 🧪 Testing

Run the test suite:

```bash
pytest tests/ -v
```

Test individual modules:

```bash
# Test protocol
python core/protocol_mcp.py

# Test buffer manager
python core/buffer_manager.py

# Test persistence
python core/persistence.py

# Test connectors
python core/ia_connectors/claude_cli.py
```

---

## 🔐 Security Considerations

- **Local-only by default**: All communication on 127.0.0.1
- **API key protection**: Store in environment variables
- **Input sanitization**: Payload size limits, content validation
- **Rate limiting**: Configurable per-connector limits
- **Audit logging**: All messages logged to JSONL

For production use:
1. Enable authentication on FastAPI endpoints
2. Use HTTPS/TLS for external access
3. Implement role-based access control
4. Set up monitoring and alerting

---

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ Core MCP protocol
- ✅ Message bus and routing
- ✅ Basic connectors (Claude, GPT, Gemini, Perplexity)
- ✅ FastAPI REST interface
- ✅ Flask dashboard
- ✅ SQLite persistence

### Phase 2 (Next)
- ⬜ Consensus engine (multi-AI voting)
- ⬜ Orchestrator layer (complex workflows)
- ⬜ WebSocket support (real-time streaming)
- ⬜ Advanced analytics dashboard
- ⬜ Plugin system for custom connectors

### Phase 3 (Future)
- ⬜ Distributed relay network (multi-node)
- ⬜ Semantic message search
- ⬜ AI debate/jury system
- ⬜ Windows service installer
- ⬜ Docker deployment

---

## 🤝 Contributing

Contributions welcome! Areas for improvement:

1. **Connectors**: Add support for more AI services
2. **Dashboard**: Enhanced visualizations, charts
3. **Analytics**: ML-based pattern detection
4. **Testing**: Increase test coverage
5. **Documentation**: More examples and tutorials

---

## 📄 License

[Specify your license here]

---

## 🙏 Acknowledgments

Part of the **Skynet Depot** project - building autonomous AI coordination systems.

---

## 📞 Support

- **Issues**: Report bugs or request features via GitHub issues
- **Documentation**: See [docs/architecture.md](docs/architecture.md)
- **Examples**: Check `ai_prompts/` for usage examples

---

**RelayMCP - The neural backbone of distributed AI intelligence.**
