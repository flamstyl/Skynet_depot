# ⚡ Quick Start Guide - Fedora Server MCP

Get your AI Virtual Machine running in 5 minutes!

---

## 📋 Prerequisites

```bash
# Verify Docker is installed
docker --version

# Verify Docker Compose is installed
docker-compose --version
```

If not installed, visit: https://docs.docker.com/get-docker/

---

## 🚀 Step 1: Build the Container

```bash
cd fedora_server_mcp
docker-compose build
```

**Expected time**: 5-10 minutes (depending on internet speed)

---

## 🎬 Step 2: Start the Container

```bash
docker-compose up -d
```

Verify it's running:
```bash
docker ps | grep fedora_server_mcp
```

You should see:
```
fedora_server_mcp_ai   Up 2 seconds   0.0.0.0:2222->22/tcp
```

---

## 🖥️ Step 3: Access the Container

```bash
docker exec -it fedora_server_mcp_ai bash
```

You're now inside the Fedora Server VM as root!

---

## 👤 Step 4: Switch to AI User

```bash
su - ia
```

Or directly access as AI user:
```bash
docker exec -it -u ia fedora_server_mcp_ai bash
```

---

## 🧠 Step 5: Explore MCP System

```bash
# Navigate to MCP directory
mcp  # alias for: cd /mcp

# View AI directives
cat directives.md

# Check pending tasks
cat tasks.md

# View AI memory
cat memory/context.md

# See MCP logs
logs  # alias for: cd /var/log/mcp
ls -lh
```

---

## 🔧 Step 6: Install AI Tools (Optional)

```bash
# Inside container, as user 'ia'
bash /mcp/install.sh
```

This installs:
- Python AI libraries (Claude, GPT, Gemini)
- Node.js
- Rust
- Go
- Docker tools
- Graphics tools
- Development tools

**Time**: 10-20 minutes

---

## ✅ Step 7: Verify System

```bash
# Test internet connectivity
ping -c 3 google.com

# Test DNF
sudo dnf check-update

# Test Python
python3 --version
pip3 --version

# Test sudo access
sudo whoami  # Should output: root
```

---

## 🎯 Step 8: Add Your First Task

```bash
# Edit tasks file
nano /mcp/tasks.md
```

Add this task:
```markdown
- [ ] Install htop and verify it works
```

Save and exit (`Ctrl+X`, then `Y`, then `Enter`)

The watcher will detect the change and log it!

---

## 📊 Step 9: View Logs

```bash
# View today's MCP log
tail -f /var/log/mcp/mcp_$(date +%Y-%m-%d).log

# View watcher log
tail -f /var/log/mcp/watcher_$(date +%Y-%m-%d).log
```

---

## 🛑 Step 10: Stop the Container

```bash
# Exit the container first
exit

# Stop the container (from host)
docker-compose down
```

Or to keep it running in background:
```bash
# Just exit the shell - container keeps running
exit
```

---

## 🔄 Restart the Container

```bash
docker-compose restart
```

---

## 🎓 What's Next?

### For AI Agents (Claude, GPT, Gemini)

1. **Read the directives**:
   ```bash
   cat /mcp/directives.md
   ```

2. **Load context**:
   ```bash
   cat /mcp/memory/context.md
   ```

3. **Check tasks**:
   ```bash
   cat /mcp/tasks.md
   ```

4. **Execute tasks and log results**:
   ```bash
   echo "[$(date)] Task completed: Installed htop" >> /var/log/mcp/session.log
   ```

5. **Update memory**:
   ```bash
   echo "- htop installed and verified" >> /mcp/memory/context.md
   ```

### Advanced Usage

- **Configure API keys**: Copy `.env.example` to `.env` and add your keys
- **Enable SSH**: See README.md section on SSH
- **Docker-in-Docker**: Uncomment volume mount in docker-compose.yml
- **Resource limits**: Adjust CPU/memory in docker-compose.yml

---

## 🐛 Troubleshooting

### Container won't start
```bash
docker-compose logs
docker-compose build --no-cache
```

### No internet in container
```bash
docker exec -it fedora_server_mcp_ai ping 1.1.1.1
docker exec -it fedora_server_mcp_ai cat /etc/resolv.conf
```

### Permission denied
```bash
docker exec -it fedora_server_mcp_ai chown -R ia:ia /mcp /data
```

---

## 📚 Full Documentation

See [README.md](README.md) for complete documentation.

See [mcp/README_MCP.md](mcp/README_MCP.md) for MCP system details.

---

## 🎉 You're Ready!

Your AI Virtual Machine is now running. You have:

✅ Full Linux environment (Fedora Server)
✅ Root and sudo access
✅ DNF package manager
✅ Internet connectivity
✅ MCP system (directives, tasks, memory)
✅ File watcher for reactive behavior
✅ Persistent storage
✅ Comprehensive logging

**Start building, installing, and automating!**

---

## 📋 Useful Commands Reference

```bash
# Access container
docker exec -it fedora_server_mcp_ai bash
docker exec -it -u ia fedora_server_mcp_ai bash

# View logs
docker-compose logs -f
docker exec -it fedora_server_mcp_ai tail -f /var/log/mcp/mcp_$(date +%Y-%m-%d).log

# Container management
docker-compose up -d        # Start
docker-compose down         # Stop
docker-compose restart      # Restart
docker-compose ps           # Status

# Inside container shortcuts (as user 'ia')
mcp      # Go to /mcp
logs     # Go to /var/log/mcp
data     # Go to /data
```

---

**Happy AI Development! 🤖**
