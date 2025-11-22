# 🤖 Fedora Server MCP - AI Virtual Machine

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
![Fedora](https://img.shields.io/badge/fedora-server-purple.svg)

**A complete Linux virtual machine for AI agents with full system access, persistent memory, and Model Context Protocol (MCP) integration.**

---

## 🎯 Purpose

This project provides a **Dockerized Fedora Server environment** specifically designed for AI agents (Claude, Gemini, GPT-4, etc.) to operate as if they were working on a real Linux machine. It includes:

- ✅ **Full root and sudo access**
- ✅ **DNF package manager** for installing software
- ✅ **Persistent memory system** (MCP)
- ✅ **Internet connectivity** for updates and downloads
- ✅ **Interactive terminal** (TTY enabled)
- ✅ **File system watchers** for reactive behavior
- ✅ **Development environment** support (Python, Node.js, Go, Rust, Docker)
- ✅ **Graphics and design tools** (ImageMagick, GIMP, FFmpeg)
- ✅ **Multi-agent support** with separate contexts

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Host System (Linux)                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Docker Container: Fedora Server MCP            │ │
│  │                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │  AI Agent    │  │ MCP System   │  │   Watcher   │ │ │
│  │  │  (Claude)    │◄─┤ directives   │◄─┤  inotify    │ │ │
│  │  │              │  │ tasks        │  │             │ │ │
│  │  └──────┬───────┘  │ memory       │  └─────────────┘ │ │
│  │         │          └──────────────┘                   │ │
│  │         ▼                                             │ │
│  │  ┌──────────────────────────────────────────┐        │ │
│  │  │    Fedora Server (full system access)    │        │ │
│  │  │  • DNF package manager                   │        │ │
│  │  │  • Python, Node.js, Go, Rust             │        │ │
│  │  │  • Docker-in-Docker (optional)           │        │ │
│  │  │  • Graphics tools                        │        │ │
│  │  │  • Development environments              │        │ │
│  │  └──────────────────────────────────────────┘        │ │
│  │                                                        │ │
│  │  Volumes:                                             │ │
│  │  • ./data → /data (persistent data)                   │ │
│  │  • ./mcp/memory → /mcp/memory (AI memory)             │ │
│  │  • ./logs → /var/log/mcp (logs)                       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
fedora_server_mcp/
├── Dockerfile                 # Container image definition
├── docker-compose.yml         # Orchestration configuration
├── mcp_start.sh              # Container entry point
├── README.md                 # This file
│
├── mcp/                      # MCP System (Model Context Protocol)
│   ├── start.sh             # MCP initialization script
│   ├── watcher.sh           # File monitoring daemon
│   ├── install.sh           # AI tools installer
│   ├── directives.md        # AI behavioral guidelines
│   ├── tasks.md             # Task queue and tracking
│   ├── README_MCP.md        # MCP system documentation
│   └── memory/              # Persistent AI memory
│       ├── context.md       # Knowledge base and session memory
│       └── logs/            # Execution logs
│
├── data/                     # Persistent data directory (created on first run)
├── logs/                     # MCP logs (created on first run)
└── ai_home/                  # AI user workspace (created on first run)
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker** installed and running
- **Docker Compose** (v3.8+)
- At least **8GB RAM** recommended
- **20GB disk space** for container and tools

### Installation

1. **Clone or navigate to the project**:
   ```bash
   cd fedora_server_mcp
   ```

2. **Build the Docker image**:
   ```bash
   docker-compose build
   ```

3. **Start the container**:
   ```bash
   docker-compose up -d
   ```

4. **Verify it's running**:
   ```bash
   docker ps | grep fedora_server_mcp
   ```

5. **Access the container**:
   ```bash
   docker exec -it fedora_server_mcp_ai bash
   ```

---

## 💻 Usage

### Interactive Shell Access

```bash
# As root
docker exec -it fedora_server_mcp_ai bash

# As AI user 'ia'
docker exec -it -u ia fedora_server_mcp_ai bash
```

### Using MCP Shortcuts

Inside the container, as user `ia`:

```bash
# Navigate to MCP directory
mcp

# View MCP logs
logs

# Access persistent data
data

# View current tasks
cat /mcp/tasks.md

# View AI directives
cat /mcp/directives.md

# Check AI memory
cat /mcp/memory/context.md
```

### Running AI Tools Installation

```bash
# Inside container, as user ia
bash /mcp/install.sh
```

This installs:
- Python AI libraries (Anthropic, OpenAI, Google)
- Node.js and npm
- Rust and Cargo
- Go compiler
- Docker tools (docker-compose, ctop, lazydocker)
- Graphics tools (ImageMagick, GIMP, Inkscape, FFmpeg)
- Development tools (GCC, Make, CMake, debuggers)
- Monitoring tools (htop, glances, btop)

---

## 🧠 Model Context Protocol (MCP)

The MCP system provides AI agents with:

1. **Persistent Memory** (`memory/context.md`)
   - Stores learned knowledge across sessions
   - Maintains system state
   - Tracks performance metrics

2. **Task Management** (`tasks.md`)
   - Queue of pending tasks
   - Task status tracking
   - Completion history

3. **Behavioral Directives** (`directives.md`)
   - AI role definition
   - Capability guidelines
   - Security policies
   - Autonomy levels

4. **File System Watcher** (`watcher.sh`)
   - Monitors file changes
   - Triggers AI responses
   - Enables reactive behavior

5. **Comprehensive Logging** (`memory/logs/`)
   - Timestamped execution logs
   - Error tracking
   - Performance data

### MCP Workflow

```
AI Agent Startup
    ↓
Read directives.md (role & capabilities)
    ↓
Load context.md (restore memory)
    ↓
Parse tasks.md (identify pending work)
    ↓
Execute tasks & log results
    ↓
Update context.md (store new knowledge)
    ↓
Start watcher.sh (monitor for changes)
    ↓
Respond to file system events
```

**See [mcp/README_MCP.md](mcp/README_MCP.md) for detailed MCP documentation.**

---

## 🤖 AI Agent Integration

### For Claude Code CLI

Using Claude Code CLI with this VM:

```bash
# Set environment variable
export ANTHROPIC_API_KEY="your-api-key-here"

# Enter the container
docker exec -it -u ia fedora_server_mcp_ai bash

# Claude can now:
# - Read /mcp/directives.md for its role
# - Check /mcp/tasks.md for pending work
# - Access /mcp/memory/context.md for knowledge
# - Execute system commands with sudo
# - Install packages via DNF
# - Create and manage files
```

### Python Example

```python
import anthropic
import os

# Initialize Claude with MCP context
with open('/mcp/directives.md') as f:
    directives = f.read()

with open('/mcp/memory/context.md') as f:
    context = f.read()

with open('/mcp/tasks.md') as f:
    tasks = f.read()

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=4096,
    system=f"{directives}\n\nContext:\n{context}",
    messages=[{
        "role": "user",
        "content": f"Review these tasks and execute them:\n{tasks}"
    }]
)

# Log the response
with open('/var/log/mcp/claude.log', 'a') as f:
    f.write(f"[{datetime.now()}] {response.content}\n")
```

### For Other AI Models

The same pattern works for:
- **Google Gemini** (`google-generativeai` package)
- **OpenAI GPT-4** (`openai` package)
- **Comet Agents**
- Any AI system that can execute shell commands

---

## 🔧 Configuration

### Environment Variables

Edit `docker-compose.yml` or create `.env`:

```bash
# AI Configuration
AI_NAME=Claude
AI_MODE=autonomous

# API Keys (optional)
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here

# Timezone
TZ=Europe/Paris

# Debug
DEBUG=false
```

### Resource Limits

Modify in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 8G
    reservations:
      cpus: '2.0'
      memory: 4G
```

### Enable SSH (Optional)

1. In `docker-compose.yml`, ensure port 2222 is mapped
2. Inside container:
   ```bash
   sudo systemctl start sshd
   # or
   sudo /usr/sbin/sshd
   ```
3. Connect from host:
   ```bash
   ssh ia@localhost -p 2222
   # Password: skynet2025
   ```

### Enable Docker-in-Docker

Uncomment in `docker-compose.yml`:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

---

## 📊 Monitoring

### View Container Logs

```bash
docker-compose logs -f
```

### View MCP Logs

```bash
# From host
docker exec -it fedora_server_mcp_ai tail -f /var/log/mcp/mcp_$(date +%Y-%m-%d).log

# Inside container
tail -f /var/log/mcp/mcp_$(date +%Y-%m-%d).log
```

### Check System Resources

```bash
# Inside container
htop          # Interactive process monitor
glances       # System overview
df -h         # Disk usage
free -h       # Memory usage
```

### Monitor Docker Container

```bash
# From host
docker stats fedora_server_mcp_ai
```

---

## 🛠️ Maintenance

### Update System Packages

```bash
# Inside container
sudo dnf update -y
```

### Restart MCP System

```bash
# Inside container
bash /mcp/start.sh
```

### Backup MCP Data

```bash
# From host
tar -czf mcp_backup_$(date +%Y%m%d).tar.gz \
    fedora_server_mcp/mcp/memory \
    fedora_server_mcp/data \
    fedora_server_mcp/logs
```

### Restore MCP Data

```bash
tar -xzf mcp_backup_YYYYMMDD.tar.gz -C fedora_server_mcp/
```

### Clean Up Logs

```bash
# Inside container
find /var/log/mcp -name "*.log" -mtime +30 -delete
```

---

## 🔐 Security

### Default Credentials

- **User**: `ia`
- **Password**: `skynet2025`
- **Sudo**: NOPASSWD (no password required for sudo)

**⚠️ IMPORTANT**: Change the password in production:

```bash
# Inside container
passwd ia
```

### Security Best Practices

1. **Don't expose SSH publicly** without changing credentials
2. **Use .env file** for API keys (don't commit to git)
3. **Limit container capabilities** if not needed
4. **Regularly update** Fedora packages
5. **Monitor logs** for suspicious activity
6. **Use firewalls** if exposing ports
7. **Rotate credentials** periodically

### Privileged Mode

The container runs in **non-privileged mode** by default. To enable full system access:

```yaml
# In docker-compose.yml
privileged: true
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Rebuild image
docker-compose build --no-cache

# Remove old containers
docker-compose down
docker-compose up -d
```

### No Internet Connectivity

```bash
# Inside container
ping 1.1.1.1
ping google.com
dnf check-update

# Check DNS
cat /etc/resolv.conf
```

### DNF Not Working

```bash
# Inside container
sudo dnf clean all
sudo dnf makecache
sudo dnf update
```

### Watcher Not Running

```bash
# Check process
ps aux | grep watcher

# Restart watcher
bash /mcp/watcher.sh &
```

### Permission Errors

```bash
# Fix ownership
sudo chown -R ia:ia /mcp /data /var/log/mcp
```

---

## 📚 Documentation

- **Main README**: This file
- **MCP System**: [mcp/README_MCP.md](mcp/README_MCP.md)
- **AI Directives**: [mcp/directives.md](mcp/directives.md)
- **Docker Docs**: https://docs.docker.com
- **Fedora Docs**: https://docs.fedoraproject.org

---

## 🎯 Use Cases

### Development Environment Setup

```bash
# AI agent can install and configure development environments
# Example: Setting up a Python project

docker exec -it -u ia fedora_server_mcp_ai bash
cd /data
mkdir my_project && cd my_project
python3 -m venv venv
source venv/bin/activate
pip install flask django fastapi
```

### Server Administration

```bash
# AI can manage system services, install software, configure settings
sudo dnf install -y nginx
sudo systemctl start nginx
```

### Docker Container Management

```bash
# With Docker-in-Docker enabled
docker pull nginx
docker run -d -p 8080:80 nginx
```

### Graphics and Design

```bash
# Image manipulation
convert input.png -resize 50% output.png

# Create diagrams
dot -Tpng diagram.dot -o diagram.png
```

---

## 🔮 Roadmap

### Version 1.0 (Current)
- ✅ Fedora Server base image
- ✅ MCP system implementation
- ✅ File system watcher
- ✅ Persistent memory
- ✅ AI tools installation script

### Version 1.1 (Planned)
- [ ] Web UI for MCP management
- [ ] REST API for task submission
- [ ] Vector database for semantic memory (RAG)
- [ ] Multi-agent coordination
- [ ] Automated testing framework

### Version 2.0 (Future)
- [ ] Kubernetes deployment
- [ ] Distributed AI agents
- [ ] Advanced monitoring dashboard
- [ ] Plugin system for extensions
- [ ] AI-to-AI communication protocol

See [TODO.md](#-todo--future-improvements) for detailed roadmap.

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🙏 Acknowledgments

- **Fedora Project** - For the excellent Linux distribution
- **Docker** - For containerization technology
- **Anthropic** - For Claude AI
- **OpenAI** - For GPT models
- **Google** - For Gemini AI

---

## 📞 Support

For issues and questions:
- GitHub Issues: [Project Issues](https://github.com/yourusername/fedora_server_mcp/issues)
- Documentation: [mcp/README_MCP.md](mcp/README_MCP.md)

---

## ⚡ Quick Commands Reference

```bash
# Build and start
docker-compose up -d

# Access container
docker exec -it fedora_server_mcp_ai bash

# View logs
docker-compose logs -f

# Stop container
docker-compose down

# Restart container
docker-compose restart

# Inside container - MCP commands
mcp          # Go to MCP directory
logs         # Go to logs directory
data         # Go to data directory
cat /mcp/tasks.md        # View tasks
cat /mcp/directives.md   # View directives
bash /mcp/install.sh     # Install AI tools
```

---

**Built with ❤️ for AI Agents by Skynet Depot**

**Version**: 1.0.0
**Last Updated**: 2025-11-22
**Status**: Production Ready ✅
