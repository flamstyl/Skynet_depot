# 🟣 Grok CLI v2.0.0 PRO

**Advanced Local AI Development Copilot** - Option 2 + 3 Complete Implementation

Complete autonomous development assistant combining:
- 🧠 **Deep Project Analysis** - Understand any codebase instantly
- ⚡ **Safe Command Execution** - Docker sandbox with security
- 🤖 **AI Code Generation** - Generate, fix, and refactor code
- 💾 **RAG Memory System** - Vector-based project knowledge
- 🔌 **MCP Integration** - Full Skynet ecosystem compatibility
- 📊 **Real-time Dashboard** - Monitor everything
- 🚀 **REST API** - External control and automation

---

## ✨ Features

### Core Features (PRO)

- **📂 Project Analyzer**
  - Automatic project structure detection
  - Dependency analysis (npm, pip, go, etc.)
  - Entry point identification
  - Language detection
  - Config file discovery

- **⚙️ Command Executor**
  - Safe shell command execution
  - Docker sandbox support
  - Blacklist dangerous commands
  - Confirmation for destructive operations
  - Real-time output capture
  - Execution history

- **🤖 Code Generator**
  - AI-powered code generation (OpenAI, Anthropic)
  - Automatic code fixing
  - Code refactoring
  - Context-aware suggestions
  - Multiple language support

- **🧠 Memory System**
  - Short-term memory (recent operations)
  - Long-term persistent memory
  - Vector-based RAG search
  - Category-based organization
  - Full-text search

- **🧪 Diagnostic Engine**
  - Automated test running (pytest, jest, go test)
  - Error detection and parsing
  - Test result visualization
  - Auto-fix suggestions

### Advanced Features (PRO + MCP)

- **🐳 Docker Sandbox**
  - Secure isolated execution
  - Resource limits (CPU, memory)
  - Security hardening (no-new-privileges, cap-drop)
  - Multi-language support (Python, Node, Go, Java)
  - Auto-cleanup

- **🔍 RAG System**
  - ChromaDB vector store
  - Sentence-transformers embeddings
  - Semantic code search
  - Context retrieval for LLMs
  - Auto-indexing on startup

- **🔌 MCP Server**
  - Full Model Context Protocol support
  - 8 exposed tools for AI agents
  - WebSocket communication
  - Skynet ecosystem integration
  - Compatible with Claude Desktop, etc.

- **🌐 REST API**
  - FastAPI backend
  - Complete CRUD operations
  - CORS support
  - Async execution
  - Swagger documentation

- **📊 Streamlit Dashboard**
  - Real-time monitoring
  - Project overview
  - Memory visualization
  - Command history
  - Test results
  - Docker sandbox control

---

## 🚀 Quick Start

### 1. Installation

```bash
cd grok_cli

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies for MCP server
cd mcp
npm install
cd ..
```

### 2. Configuration

Edit `config/default_config.yaml` to configure:
- LLM provider (OpenAI, Anthropic, etc.)
- API keys (via environment variables)
- Docker settings
- RAG parameters
- API endpoints

### 3. Usage Modes

#### Interactive CLI Mode

```bash
python grok.py start
```

Or from the CLI app:

```bash
python cli.py start
```

Features:
- Natural language queries
- Direct shell commands with `!`
- Special commands with `/`
- Real-time analysis

#### Service Mode (API + MCP + Dashboard)

```bash
# Terminal 1: Start API server
python api/server.py

# Terminal 2: Start MCP server
cd mcp
npm start

# Terminal 3: Start Dashboard
streamlit run dashboard/app.py
```

#### Agent CLI Launcher Integration

Copy `grok.py` to your agents directory:

```bash
# For Windows
copy grok.py C:\Users\YourName\IA\agents\

# For Linux/Mac
cp grok.py ~/agents/
```

The agent_cli_launcher will automatically detect it!

---

## 📖 Usage Guide

### Interactive Commands

```bash
# Natural language
"Analyze this project"
"Generate a REST API for users"
"Fix the authentication bug"
"Run all tests and fix failures"

# Direct shell commands
!ls -la
!pytest tests/
!npm install

# Special commands
/analyze          # Analyze full project
/test             # Run all tests
/fix              # Auto-fix errors
/memory           # Show memory
/help             # Show help
```

### MCP Tools

When used via MCP protocol, Grok CLI exposes these tools:

1. **analyze_project** - Complete project analysis
2. **execute_command** - Execute shell command (sandboxed)
3. **generate_code** - AI code generation
4. **fix_code** - Automatic code fixing
5. **run_tests** - Run all tests with diagnostics
6. **search_memory** - Search Grok CLI memory
7. **search_project** - RAG-based project search
8. **get_diagnostics** - System health status

### REST API Endpoints

```bash
POST /analyze        # Analyze project
POST /execute        # Execute command
POST /generate       # Generate code
POST /fix            # Fix code
POST /test           # Run tests
POST /search         # Search project (RAG)
POST /memory/search  # Search memory
GET  /memory/stats   # Memory statistics
POST /diagnostics    # Get diagnostics
```

Full API docs at: `http://localhost:8100/docs`

---

## 🏗️ Architecture

```
grok_cli/
├── core/                    # Core modules
│   ├── analyzer.py         # Project analysis
│   ├── executor.py         # Command execution
│   ├── generator.py        # AI code generation
│   ├── memory.py           # Memory system
│   └── diagnostics.py      # Testing & diagnostics
├── rag/                     # RAG system
│   ├── vectorstore.py      # ChromaDB integration
│   ├── embeddings.py       # Sentence transformers
│   └── retriever.py        # Context retrieval
├── docker/                  # Docker sandbox
│   ├── Dockerfile.sandbox  # Secure container
│   ├── docker-compose.yml  # Orchestration
│   └── security.py         # Security manager
├── mcp/                     # MCP Server
│   ├── server.js           # Node.js MCP server
│   ├── config.mcp.json     # Tool definitions
│   └── tools/              # Tool implementations
├── api/                     # REST API
│   ├── server.py           # FastAPI app
│   └── routes/             # API routes
├── dashboard/               # Streamlit dashboard
│   ├── app.py              # Main dashboard
│   └── components/         # Dashboard components
├── prompts/                 # System prompts
│   └── system_prompt.md    # Main prompt
├── config/                  # Configuration
│   └── default_config.yaml # Default config
├── cli.py                   # CLI entry point
├── grok.py                  # Wrapper for launcher
└── requirements.txt         # Python dependencies
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_openai_key
# or
ANTHROPIC_API_KEY=your_anthropic_key

# Optional
GROK_API_URL=http://localhost:8100
```

### Docker Sandbox

To build the sandbox image:

```bash
cd docker
docker build -f Dockerfile.sandbox -t grok-cli-sandbox:latest .
```

Or use docker-compose:

```bash
docker-compose up -d
```

---

## 🌐 Skynet Integration

### Agent CLI Launcher

Grok CLI is automatically detected by `agent_cli_launcher`:

1. Place `grok.py` in your agents directory
2. Launch `agent_cli_launcher`
3. Select "grok" from the list
4. Click START

### MCP Ecosystem

Connect Grok CLI to other Skynet MCP servers:

```yaml
# In Claude Desktop config
{
  "mcpServers": {
    "grok-cli": {
      "command": "node",
      "args": ["/path/to/grok_cli/mcp/server.js"]
    }
  }
}
```

---

## 📊 Performance

- **Startup Time**: ~2-5 seconds (with RAG indexing)
- **Command Execution**: Near-instant (direct) / 1-3s (sandbox)
- **Code Generation**: 2-10s (depends on LLM)
- **Project Analysis**: 1-5s (depends on size)
- **RAG Search**: <100ms (after indexing)

### Resource Usage

- **Memory**: 200-500MB (base) + 500MB-1GB (with RAG)
- **Docker Sandbox**: 2GB RAM limit, 2 CPU cores
- **Disk**: ~1GB (including dependencies)

---

## 🔐 Security

### Sandbox Features

- ✅ Non-root user execution
- ✅ Resource limits (CPU, memory)
- ✅ Capability dropping (no ALL caps)
- ✅ Security options (no-new-privileges)
- ✅ Network isolation (bridge mode)
- ✅ Read-only root (optional)
- ✅ Tmpfs for temporary files

### Command Safety

- ❌ Blacklist: `rm -rf /`, `mkfs`, `dd`, fork bombs
- ⚠️ Confirmation required: `rm -rf`, `git push --force`, etc.
- ✅ Execution history and audit log
- ✅ Timeout protection (default 5 minutes)

---

## 🧪 Testing

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest --cov=grok_cli tests/

# Test specific module
pytest tests/test_analyzer.py
```

---

## 🐛 Troubleshooting

### Docker Issues

```bash
# Check Docker status
docker ps

# Build sandbox image
cd docker
docker build -f Dockerfile.sandbox -t grok-cli-sandbox:latest .

# Test sandbox
docker run --rm -it grok-cli-sandbox:latest /bin/bash
```

### RAG Issues

```bash
# Clear vector store
rm -rf data/vectorstore/*

# Reinstall dependencies
pip install --upgrade chromadb sentence-transformers
```

### API Issues

```bash
# Check API server
curl http://localhost:8100/health

# Check logs
tail -f logs/grok_cli.log
```

---

## 🗺️ Roadmap

### v2.1 (Next)

- [ ] Multi-project workspace support
- [ ] Git integration (auto-commit, PR creation)
- [ ] Voice control integration
- [ ] Plugin system
- [ ] Auto-documentation generation

### v3.0 (Future)

- [ ] Multi-agent collaboration
- [ ] Cloud deployment support
- [ ] Kubernetes integration
- [ ] Advanced code review AI
- [ ] Real-time pair programming

---

## 📝 License

Part of the Skynet Development Suite.

---

## 👨‍💻 Author

**Skynet Coalition**

Built with ❤️ for autonomous development.

---

## 🙏 Credits

- **FastAPI** - Modern API framework
- **Streamlit** - Dashboard framework
- **ChromaDB** - Vector database
- **Sentence Transformers** - Embeddings
- **Docker** - Containerization
- **Model Context Protocol** - AI agent communication

---

## 📞 Support

For issues or questions:

1. Check logs in `logs/`
2. Verify configuration in `config/`
3. Test components individually
4. Check Docker and API status

---

**🟣 Grok CLI - Take control of your development workflow!**
