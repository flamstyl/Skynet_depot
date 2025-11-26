# Installation Guide - Skynet Linker CLI

Complete installation and setup instructions for Skynet Linker CLI.

---

## System Requirements

- **Python**: 3.10 or higher
- **Redis**: 7.0 or higher
- **OS**: Linux, macOS, Windows (WSL recommended for Windows)
- **RAM**: Minimum 2GB, recommended 4GB+
- **Disk**: ~500MB for dependencies

---

## Quick Install (Recommended)

### 1. Install Python 3.10+

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3.10 python3.10-venv python3-pip
```

**macOS:**
```bash
brew install python@3.10
```

**Windows:**
Download from [python.org](https://www.python.org/downloads/)

### 2. Install Redis

**Docker (Recommended):**
```bash
docker run -d --name skynet-redis \
  -p 6379:6379 \
  redis:7-alpine
```

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

### 3. Clone Repository

```bash
git clone https://github.com/yourusername/skynet_linker_cli.git
cd skynet_linker_cli
```

### 4. Create Virtual Environment

```bash
python3.10 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 5. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 6. Install as CLI Tool

```bash
pip install -e .
```

This makes `skynet-linker` available globally (in your venv).

### 7. Verify Installation

```bash
skynet-linker version
```

Expected output:
```
🤖 Skynet Linker CLI
Version: 1.0.0
Protocol: MCP/1.0
```

---

## Development Install

For contributors and developers:

```bash
# Clone repo
git clone https://github.com/yourusername/skynet_linker_cli.git
cd skynet_linker_cli

# Create venv
python3.10 -m venv venv
source venv/bin/activate

# Install with dev dependencies
pip install -e ".[dev]"

# Install pre-commit hooks (optional)
pre-commit install

# Run tests
pytest tests/
```

---

## Configuration

### 1. Server Configuration

Copy example config:
```bash
cp server/config.yaml.example server/config.yaml
```

Edit `server/config.yaml`:
```yaml
server:
  host: "0.0.0.0"
  port: 8000

redis:
  url: "redis://localhost:6379/0"

encryption:
  enabled: false  # Set to true for production
```

### 2. CLI Configuration

Copy example config:
```bash
cp cli/config_example.yaml cli/config.yaml
```

Edit `cli/config.yaml`:
```yaml
server:
  ws_url: "ws://localhost:8000/ws"
  http_url: "http://localhost:8000"

agent:
  default_type: "generic"
  default_priority: 5
```

### 3. Generate Encryption Keys (Optional)

```python
python -c "
from security.key_manager import KeyManager
km = KeyManager()
km.generate_secret_key('default')
km.generate_keypair('server')
print('Keys generated in .skynet_linker.keys')
"
```

---

## Starting Services

### 1. Start Redis (if not using Docker)

```bash
redis-server
```

Or with Docker:
```bash
docker start skynet-redis
```

### 2. Start MCP Server

```bash
# Development (auto-reload)
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn server.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Server will be available at:
- REST API: `http://localhost:8000`
- WebSocket: `ws://localhost:8000/ws`
- API Docs: `http://localhost:8000/docs`

### 3. Verify Server

```bash
curl http://localhost:8000/health
```

Expected:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 42.5,
  "redis_connected": true,
  "total_agents": 0,
  "total_channels": 0
}
```

---

## First Agent Connection

### Terminal 1: Connect Claude

```bash
skynet-linker connect \
  --agent-id claude_cli \
  --type planner \
  --channels skynet_core
```

### Terminal 2: Connect Gemini

```bash
skynet-linker connect \
  --agent-id gemini \
  --type researcher \
  --channels skynet_core
```

### Terminal 3: Send Message

```bash
skynet-linker send \
  --from claude_cli \
  --to gemini \
  --content "Hello from Claude!"
```

You should see the message appear in Terminal 2! 🎉

---

## Troubleshooting

### Redis Connection Failed

**Problem:** `redis.exceptions.ConnectionError`

**Solution:**
```bash
# Check Redis is running
docker ps | grep redis
# Or
redis-cli ping

# Start Redis if needed
docker start skynet-redis
# Or
sudo systemctl start redis
```

### Import Errors

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
# Activate venv
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Port Already in Use

**Problem:** `OSError: [Errno 98] Address already in use`

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>

# Or use different port
uvicorn server.main:app --port 8001
```

### WebSocket Connection Refused

**Problem:** CLI can't connect to server

**Solution:**
```bash
# Check server is running
curl http://localhost:8000/health

# Check firewall
sudo ufw allow 8000

# Try different server URL
skynet-linker connect --server ws://127.0.0.1:8000/ws ...
```

---

## Docker Installation (Alternative)

Coming soon! Full Docker Compose setup.

---

## Uninstall

```bash
# Deactivate venv
deactivate

# Remove venv
rm -rf venv/

# Remove installed CLI tool
pip uninstall skynet-linker-cli

# Stop Redis
docker stop skynet-redis
docker rm skynet-redis
```

---

## Next Steps

After installation:

1. ✅ Read [README.md](README.md) for overview
2. ✅ Follow [Basic Flow Example](examples/basic_flow.md)
3. ✅ Try [Multi-Agent Scenario](examples/multi_agent_scenario.md)
4. ✅ Read [Architecture Docs](docs/architecture.md)
5. ✅ Build your own connectors!

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/skynet_linker_cli/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/skynet_linker_cli/discussions)

---

Happy linking! 🤖🔗
