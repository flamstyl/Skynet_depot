# 🤖 Skynet Linker CLI

**Multi-AI Communication & Coordination Bus**

A distributed system for coordinating multiple AI agents (Claude, ChatGPT, Gemini, Perplexity, etc.) through a centralized message bus with shared memory and context management.

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 What is Skynet Linker?

Skynet Linker allows you to:

- **Connect multiple AI agents** (Claude Code, ChatGPT, Gemini, Perplexity, etc.) to a central coordination server
- **Share context and memory** across agents via Redis
- **Route messages** between specific agents or broadcast to channels
- **Coordinate complex workflows** (research → code → review → deploy)
- **Monitor in real-time** all inter-agent communication
- **Secure communication** with NaCl encryption (optional)

Think of it as a **nervous system for your AI swarm** 🧠🤖

---

## ✨ Features

### Core
- ✅ **MCP (Multi-agent Communication Protocol)** - Custom protocol for agent coordination
- ✅ **WebSocket + REST API** - Real-time bidirectional communication
- ✅ **Redis Memory Store** - Shared context, sessions, message history
- ✅ **Message Routing** - Direct, broadcast, round-robin, priority-based
- ✅ **Session Management** - Track multi-agent collaborations

### Security
- ✅ **NaCl Encryption** - Symmetric & asymmetric encryption for message payloads
- ✅ **Token Authentication** - Static tokens (MVP) or JWT (production-ready)
- ✅ **Key Rotation** - Versioned key management

### CLI
- ✅ **Typer-based CLI** - Intuitive command-line interface
- ✅ **Rich Output** - Beautiful terminal UI with tables and panels
- ✅ **Real-time Monitor** - Watch message flow live

### Observability
- ✅ **Health Checks** - `/health` endpoint with Redis status
- ✅ **Stats API** - Agent counts, message metrics, routing stats
- ✅ **Snapshots** - Periodic state backups for recovery

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Redis** (Docker recommended)

### Installation

```bash
# Clone repo
git clone https://github.com/yourusername/skynet_linker_cli.git
cd skynet_linker_cli

# Install dependencies
pip install -r requirements.txt

# Or install in development mode
pip install -e .
```

### 1. Start Redis

```bash
docker run -d -p 6379:6379 --name skynet-redis redis:7-alpine
```

### 2. Start MCP Server

```bash
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

Server starts on: `http://localhost:8000`

Check health: `curl http://localhost:8000/health`

### 3. Connect Your First Agent

**Terminal 1:**
```bash
skynet-linker connect \
  --agent-id claude_cli \
  --type planner \
  --channels skynet_core
```

**Terminal 2:**
```bash
skynet-linker connect \
  --agent-id gemini \
  --type researcher \
  --channels skynet_core
```

### 4. Send a Message

**Terminal 3:**
```bash
skynet-linker send \
  --from claude_cli \
  --to gemini \
  --content "Research latest RAG papers"
```

Gemini (Terminal 2) will receive the message instantly! 🎉

---

## 📖 Documentation

### Essential Docs
- [Architecture Overview](docs/architecture.md) - System design and components
- [Basic Flow Example](examples/basic_flow.md) - Simple Claude ↔ Gemini workflow
- [Multi-Agent Scenario](examples/multi_agent_scenario.md) - Complex 4-agent collaboration
- [Redis Namespaces](memory/namespaces.md) - Data storage patterns

### API Reference
- **REST API**: `http://localhost:8000/docs` (Swagger UI)
- **WebSocket**: `ws://localhost:8000/ws?agent_id=<id>&agent_type=<type>`

---

## 🛠️ CLI Commands

### `connect` - Connect Agent to Server

```bash
skynet-linker connect \
  --agent-id <id> \
  --type <planner|researcher|coder|reviewer|generic> \
  --channels <channel1,channel2> \
  --priority <1-10>
```

Establishes persistent WebSocket connection.

### `send` - Send Message

```bash
# Direct message
skynet-linker send \
  --from <sender> \
  --to <recipient> \
  --content "Message text"

# Broadcast
skynet-linker send \
  --from <sender> \
  --type broadcast \
  --channel <channel> \
  --content "Broadcast message"

# From JSON file
skynet-linker send \
  --from <sender> \
  --payload-file message.json
```

### `context` - Manage Context

```bash
# Push context to server
skynet-linker context push \
  --agent-id <id> \
  --file context.json

# Pull context from server
skynet-linker context pull \
  --agent-id <id> \
  --output context_local.json
```

### `agents` - List Connected Agents

```bash
skynet-linker agents
```

Shows table with agent IDs, types, priorities, channels, message counts.

### `monitor` - Real-time Message Monitor

```bash
skynet-linker monitor --channel skynet_core
```

Stream all messages on a channel in real-time.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CLI (Typer)                               │
│  skynet-linker connect | send | context | agents | monitor │
└────────────────────────┬────────────────────────────────────┘
                         │ WebSocket / REST
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  MCP Server (FastAPI)                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  WebSocket   │  │   Routing    │  │  Encryption  │     │
│  │   Router     │  │   Engine     │  │   (NaCl)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Context    │  │   Session    │  │   Snapshot   │     │
│  │   Manager    │  │   Manager    │  │   Manager    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Redis Memory Store                             │
│                                                             │
│  context:<agent>  │  session:<id>  │  history:<agent>      │
│  presence:<agent> │  snapshot:<ts> │  channel:<name>       │
└─────────────────────────────────────────────────────────────┘
                        ↑
                        │
┌───────────────────────┴─────────────────────────────────────┐
│              AI Connectors (Future)                         │
│  Claude | ChatGPT | Gemini | Perplexity | Codex            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Components

### Protocol Layer (`protocol/`)
- **MCP Message** - Standardized message format
- **Validation** - Pydantic models + JSON schema
- **Schema** - Message structure specification

### Server Layer (`server/`)
- **Main** - FastAPI app + lifespan events
- **WebSocket Router** - Connection management + message routing
- **Routing Engine** - Direct/broadcast/round-robin routing
- **Redis Store** - Memory operations (context, history, sessions)
- **Encryption** - NaCl-based payload encryption

### Memory Layer (`memory/`)
- **Context Manager** - Shared context between agents
- **Session Manager** - Multi-agent collaboration sessions
- **Snapshot Manager** - Periodic state backups

### Security Layer (`security/`)
- **Key Manager** - Cryptographic key generation/rotation
- **NaCl Utils** - Encryption/signing utilities
- **Auth Tokens** - Static tokens / JWT authentication

### CLI Layer (`cli/`)
- **Linker CLI** - Main Typer app
- **Commands** - Connect, send, context, agents, monitor

### Connectors (`connectors/`)
- **Base Connector** - Abstract interface
- **Claude** - Anthropic Claude integration (stub)
- **ChatGPT** - OpenAI GPT integration (stub)
- **Gemini** - Google Gemini integration (stub)
- **Perplexity** - Perplexity AI integration (stub)
- **Codex** - OpenAI Codex integration (stub)

---

## 📊 Example Workflows

### 1. Research → Code → Review Pipeline

```bash
# 1. Claude (planner) assigns research task to Gemini
skynet-linker send \
  --from claude_planner \
  --to gemini_researcher \
  --type task \
  --content "Research RAG papers from 2025"

# 2. Gemini completes research, sends results
skynet-linker send \
  --from gemini_researcher \
  --to claude_planner \
  --type reply \
  --content "Found 10 papers, key findings: ..."

# 3. Claude assigns coding to GPT-4
skynet-linker send \
  --from claude_planner \
  --to gpt4_coder \
  --type task \
  --content "Implement RAG prototype based on Gemini's research"

# 4. GPT-4 implements, requests review
skynet-linker send \
  --from gpt4_coder \
  --to claude_reviewer \
  --type task \
  --content "Code complete, please review: /shared/rag.py"

# 5. Claude reviewer approves
skynet-linker send \
  --from claude_reviewer \
  --to gpt4_coder \
  --type reply \
  --content "Approved! Ship it 🚀"
```

See [Multi-Agent Scenario](examples/multi_agent_scenario.md) for full walkthrough.

---

## 🔐 Security

### Encryption

Enable in `server/config.yaml`:

```yaml
encryption:
  enabled: true
  mode: symmetric  # or asymmetric
  secret_key_path: .skynet_linker.key
```

Messages will be encrypted using NaCl SecretBox.

### Authentication

Generate tokens:

```python
from security.auth_tokens import StaticTokenManager

manager = StaticTokenManager()
token = manager.generate_token("claude_cli", permissions=["read", "write"])
print(token)  # Save this!
```

Enable in `server/config.yaml`:

```yaml
security:
  auth_enabled: true
```

---

## 🧪 Testing

Run tests:

```bash
# Protocol tests
pytest tests/test_protocol.py

# Memory tests
pytest tests/test_memory.py

# Encryption tests
pytest tests/test_encryption.py

# All tests
pytest tests/
```

---

## 📈 Roadmap

### MVP (Phase 1) ✅
- ✅ MCP protocol
- ✅ FastAPI + WebSocket server
- ✅ Redis storage
- ✅ CLI with Typer
- ✅ Encryption (NaCl)
- ✅ Connector stubs

### Phase 2 (In Progress)
- [ ] Real AI connectors (OpenAI API, Gemini API)
- [ ] JWT authentication
- [ ] Advanced routing (round-robin, load balancing)
- [ ] Web dashboard (React + WebSocket)

### Phase 3 (Future)
- [ ] Kubernetes deployment
- [ ] Prometheus metrics
- [ ] Auto-scaling agents
- [ ] RAG on message history
- [ ] Agent swarm optimization

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

- **FastAPI** - Modern Python web framework
- **Typer** - CLI framework
- **PyNaCl** - Cryptography library
- **Redis** - In-memory data store
- **Rich** - Terminal formatting

---

## 📧 Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/skynet_linker_cli/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/skynet_linker_cli/discussions)

---

**Built with ❤️ for the AI agent coordination revolution** 🤖🚀
