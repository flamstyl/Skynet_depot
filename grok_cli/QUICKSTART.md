# 🚀 Grok CLI - Quick Start Guide

Get up and running with Grok CLI in 5 minutes!

---

## 📋 Prerequisites

- Python 3.8+ (Python 3.10+ recommended)
- Node.js 18+ (for MCP server)
- Docker (optional, for sandbox execution)
- Git

---

## 🔧 Installation

### Step 1: Clone or Navigate to Grok CLI

```bash
cd /path/to/Skynet_depot/grok_cli
```

### Step 2: Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- FastAPI, Uvicorn (API server)
- Streamlit (dashboard)
- ChromaDB, sentence-transformers (RAG)
- Rich, Typer (CLI)
- And more...

### Step 3: Install MCP Dependencies

```bash
cd mcp
npm install
cd ..
```

### Step 4: Set Up Environment Variables

Create a `.env` file in the `grok_cli` directory:

```bash
# Choose one LLM provider
OPENAI_API_KEY=your_openai_api_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

---

## 🎯 First Run - Interactive Mode

### Test the CLI

```bash
python cli.py start
```

You should see:

```
🟣 Grok CLI v2.0.0 PRO
Initializing autonomous development copilot...

📂 Analyzing project structure...
✓ Project: grok_cli
✓ Type: python
✓ Files: 45
✓ Languages: Python

🧠 Indexing project for RAG...
✓ RAG index ready

✓ Initialization complete

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔧 Grok CLI prêt à prendre le contrôle ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Type your commands or questions. 'exit' to quit.

grok>
```

### Try Some Commands

```bash
# Natural language
grok> What does this project do?

# Direct shell command
grok> !ls -la

# Special commands
grok> /analyze
grok> /memory
grok> /help
```

### Exit

```bash
grok> exit
```

---

## 🌐 Service Mode - Full Stack

Launch all three services simultaneously:

### Terminal 1: API Server

```bash
python api/server.py
```

Expected output:
```
🟣 Grok CLI API Server starting...
Version: 2.0.0
Host: 0.0.0.0:8100
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8100
```

### Terminal 2: MCP Server

```bash
cd mcp
npm start
```

Expected output:
```
🟣 Grok CLI MCP Server running
Version: 2.0.0
API Endpoint: http://localhost:8100
Tools: 8
```

### Terminal 3: Dashboard

```bash
streamlit run dashboard/app.py
```

Expected output:
```
  You can now view your Streamlit app in your browser.

  Local URL: http://localhost:8501
  Network URL: http://192.168.x.x:8501
```

### Access the Dashboard

Open your browser to: **http://localhost:8501**

---

## 🐳 Optional: Build Docker Sandbox

If you want secure sandboxed execution:

```bash
cd docker
docker build -f Dockerfile.sandbox -t grok-cli-sandbox:latest .
```

This will take 2-5 minutes. Once complete, sandboxed execution will be enabled automatically.

Test it:

```bash
docker run --rm grok-cli-sandbox:latest python3 --version
```

---

## 🧪 Run Tests

Verify everything is working:

```bash
pytest tests/ -v
```

Expected output:
```
tests/test_analyzer.py::test_analyzer_initialization PASSED
tests/test_analyzer.py::test_analyze_empty_project PASSED
tests/test_memory.py::test_memory_initialization PASSED
tests/test_memory.py::test_store_short_term PASSED
...
```

---

## 📊 Check API Endpoints

With the API server running:

### Health Check

```bash
curl http://localhost:8100/health
```

Response:
```json
{
  "status": "healthy",
  "components": {
    "analyzer": true,
    "executor": true,
    "generator": true,
    "memory": true,
    "diagnostics": true,
    "vectorstore": true
  }
}
```

### API Documentation

Open: **http://localhost:8100/docs**

You'll see the full Swagger/OpenAPI documentation.

---

## 🔌 Connect to Agent CLI Launcher

### Windows

```cmd
copy grok.py C:\Users\YourName\IA\agents\grok_cli.py
```

### Linux/Mac

```bash
cp grok.py ~/agents/grok_cli.py
```

Then:
1. Launch `agent_cli_launcher`
2. Click "🔄 Refresh Agents"
3. Select "grok_cli"
4. Click "▶️ START"

---

## 💡 Common Use Cases

### 1. Analyze a Project

```bash
python cli.py start /path/to/your/project
```

Then:
```bash
grok> /analyze
```

### 2. Run Tests and Fix Errors

```bash
grok> /test
# Review results
grok> /fix
```

### 3. Generate Code

```bash
grok> Generate a FastAPI endpoint for user authentication
```

### 4. Execute Safe Commands

```bash
# With sandbox (safe)
grok> !pytest tests/

# Without sandbox (faster)
grok> !git status
```

---

## 🎓 Next Steps

### Learn More

1. **Read the full README**: `README.md`
2. **Explore the config**: `config/default_config.yaml`
3. **Check the system prompt**: `prompts/system_prompt.md`
4. **Try the dashboard**: `http://localhost:8501`
5. **Use the API**: `http://localhost:8100/docs`

### Customize

1. Edit `config/default_config.yaml` for your preferences
2. Modify `prompts/system_prompt.md` for custom behavior
3. Add your own tools to the MCP server
4. Extend the dashboard with custom components

### Integrate

1. Connect to Claude Desktop via MCP
2. Use the REST API from other tools
3. Build automation scripts
4. Create custom workflows

---

## ❓ Troubleshooting

### "Module not found" errors

```bash
pip install -r requirements.txt
```

### Docker not available

```bash
# Check Docker
docker --version

# Start Docker daemon (Linux)
sudo systemctl start docker
```

### Port already in use

```bash
# Change ports in config/default_config.yaml
api:
  port: 8101  # Change from 8100

dashboard:
  port: 8502  # Change from 8501
```

### RAG not working

```bash
# Reinstall ChromaDB
pip install --upgrade chromadb sentence-transformers

# Clear vector store
rm -rf data/vectorstore/*
```

---

## 🎉 You're Ready!

You now have:
- ✅ Interactive CLI running
- ✅ API server responding
- ✅ MCP server connected
- ✅ Dashboard accessible
- ✅ Docker sandbox ready (optional)
- ✅ Tests passing

**Start building with Grok CLI! 🟣**

---

## 📞 Need Help?

- Check logs in `logs/grok_cli.log`
- Review configuration in `config/default_config.yaml`
- Run tests: `pytest tests/ -v`
- Check API health: `curl http://localhost:8100/health`

---

**Happy coding! 🚀**
