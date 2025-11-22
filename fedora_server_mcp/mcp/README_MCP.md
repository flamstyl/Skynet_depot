# 🧠 MCP System Documentation

## Model Context Protocol for AI Agents

The **MCP (Model Context Protocol)** system provides a cognitive framework for AI agents operating in the Fedora Server VM. This system enables persistent memory, task management, and autonomous behavior.

---

## 🏗️ Architecture

### Core Components

```
/mcp/
├── start.sh          # Main initialization script
├── watcher.sh        # File system monitoring daemon
├── install.sh        # AI tools installation script
├── directives.md     # AI behavioral guidelines
├── tasks.md          # Task queue and tracking
└── memory/
    ├── context.md    # Persistent memory/knowledge base
    └── logs/         # Execution logs
        └── *.log
```

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                     AI Agent Boot                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Read directives.md │  ◄── Behavioral guidelines
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Load context.md    │  ◄── Long-term memory
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Parse tasks.md     │  ◄── Pending tasks
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Execute Tasks      │  ──► Log to memory/logs/
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Update context.md  │  ◄── Store new knowledge
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Start watcher.sh   │  ──► Monitor for changes
        └────────────────────┘
```

---

## 📋 File Specifications

### `directives.md`

**Purpose**: Define AI agent role, capabilities, and behavioral guidelines.

**Structure**:
- Identity & role definition
- Primary functions and capabilities
- Cognitive process workflow
- Behavior guidelines
- Autonomy levels
- Security policies

**Usage**: Read at every agent initialization. Defines "what the AI should be."

### `tasks.md`

**Purpose**: Task queue and execution tracking.

**Format**:
```markdown
## Pending Tasks
- [ ] Task description
- [~] In progress task
- [x] Completed task

## Completed Tasks
- [x] Previously completed task
```

**Usage**: AI checks this file for new assignments. Watcher monitors for changes.

### `memory/context.md`

**Purpose**: Persistent knowledge base and session memory.

**Contains**:
- System state and environment info
- Accumulated knowledge
- Performance metrics
- Project inventory
- Learned patterns and strategies
- Session history

**Usage**: Loaded at startup, updated after significant events. Acts as long-term memory.

### `memory/logs/*.log`

**Purpose**: Detailed execution logs with timestamps.

**Format**:
```
[2025-11-22 14:30:45] [INFO] Task started: Install package
[2025-11-22 14:30:47] [INFO] Package installed successfully
```

**Retention**: Logs rotated daily, kept for 30 days.

---

## 🔧 Scripts

### `start.sh`

Main MCP initialization script.

**Functions**:
- Load directives
- Read context
- Parse tasks
- Start watcher
- Initialize logging

**Usage**:
```bash
bash /mcp/start.sh
```

### `watcher.sh`

File system monitoring daemon using `inotifywait`.

**Monitors**:
- `/mcp/tasks.md` - New tasks
- `/mcp/directives.md` - Behavior changes
- `/mcp/memory/context.md` - Memory updates
- `/data/` - User data changes

**Actions**:
- Trigger task execution on task file modification
- Reload directives on directive file changes
- Sync context on memory updates
- Log data directory activity

**Usage**:
```bash
bash /mcp/watcher.sh &  # Run in background
```

### `install.sh`

AI tools and development environment installer.

**Installs**:
- Python AI libraries (Anthropic, OpenAI, Google)
- Node.js and npm packages
- Rust and Cargo
- Go compiler
- Docker tools
- Graphics tools (ImageMagick, GIMP, etc.)
- Development tools (compilers, debuggers)

**Usage**:
```bash
bash /mcp/install.sh
```

---

## 🤖 AI Agent Usage Guide

### For AI Agents (Claude, Gemini, GPT, etc.)

#### On Initialization:

1. **Read Directives**
   ```bash
   cat /mcp/directives.md
   ```
   Understand your role, capabilities, and guidelines.

2. **Load Context**
   ```bash
   cat /mcp/memory/context.md
   ```
   Restore memory from previous sessions.

3. **Check Tasks**
   ```bash
   cat /mcp/tasks.md
   ```
   Identify pending work.

4. **Start Logging**
   ```bash
   echo "[$(date)] Session started" >> /var/log/mcp/session.log
   ```

#### During Operation:

1. **Execute Tasks**
   - Read task from `tasks.md`
   - Log execution: `echo "[$(date)] [INFO] Task: ..." >> /var/log/mcp/...`
   - Perform task
   - Update task status: `- [x] Completed task`

2. **Update Memory**
   - Append new knowledge to `context.md`
   - Log significant events
   - Document learned patterns

3. **Handle Events**
   - Respond to watcher notifications
   - Process new tasks as they appear
   - Adapt to directive changes

#### On Shutdown:

1. **Finalize Logs**
   ```bash
   echo "[$(date)] Session ended" >> /var/log/mcp/session.log
   ```

2. **Update Context**
   - Summarize session activities
   - Update performance metrics
   - Note any issues

---

## 🔄 Workflows

### Task Execution Workflow

```
1. New task added to tasks.md
   ↓
2. Watcher detects change
   ↓
3. AI agent reads task
   ↓
4. Agent logs: "Starting task X"
   ↓
5. Agent executes task
   ↓
6. Agent logs results
   ↓
7. Agent updates context.md
   ↓
8. Agent marks task complete [x]
```

### Learning Workflow

```
1. AI encounters new situation
   ↓
2. AI analyzes and responds
   ↓
3. AI logs outcome
   ↓
4. AI updates context.md with learned pattern
   ↓
5. Pattern available for future reference
```

---

## 🔗 Integration Examples

### Claude CLI Integration

```python
# Example: Claude CLI using MCP

import anthropic
import os

# Read directives
with open('/mcp/directives.md', 'r') as f:
    directives = f.read()

# Read context
with open('/mcp/memory/context.md', 'r') as f:
    context = f.read()

# Read tasks
with open('/mcp/tasks.md', 'r') as f:
    tasks = f.read()

# Create prompt
system_prompt = f"{directives}\n\nContext:\n{context}\n\nTasks:\n{tasks}"

# Call Claude
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    system=system_prompt,
    messages=[{"role": "user", "content": "Execute pending tasks"}]
)

# Log response
with open('/var/log/mcp/claude.log', 'a') as f:
    f.write(f"[{datetime.now()}] {response.content}\n")
```

### Manual Task Addition

```bash
# Add task to tasks.md
echo "- [ ] Install PostgreSQL database" >> /mcp/tasks.md

# Watcher will detect and notify AI agent
```

---

## 📊 Monitoring

### Check System Status

```bash
# View recent logs
tail -f /var/log/mcp/mcp_$(date +%Y-%m-%d).log

# Check pending tasks
grep "^- \[ \]" /mcp/tasks.md

# View completed tasks
grep "^- \[x\]" /mcp/tasks.md

# Check watcher status
ps aux | grep watcher
```

---

## 🛠️ Customization

### Adding Custom Directives

Edit `/mcp/directives.md`:
```markdown
## Custom Behavior
- Always use tabs instead of spaces
- Prefer Rust over Python for system tools
- Log verbosely for debugging
```

### Creating Task Templates

In `tasks.md`:
```markdown
## Task Templates

### Package Installation Template
- [ ] Research package: <package_name>
- [ ] Verify availability: dnf search <package_name>
- [ ] Install: sudo dnf install -y <package_name>
- [ ] Verify: <package_name> --version
- [ ] Document in context.md
```

---

## 🔐 Security Considerations

### Access Control
- MCP files owned by `ia` user
- Logs world-readable but only ia-writable
- Sensitive data should never be in plain text

### Best Practices
- Rotate logs regularly
- Validate all task inputs
- Audit directive changes
- Monitor system resource usage

---

## 🐛 Troubleshooting

### Watcher Not Running

```bash
# Check if running
ps aux | grep watcher.sh

# Restart manually
bash /mcp/watcher.sh &
```

### Tasks Not Executing

```bash
# Verify file permissions
ls -la /mcp/tasks.md

# Check watcher logs
tail /var/log/mcp/watcher_$(date +%Y-%m-%d).log
```

### Context Not Persisting

```bash
# Check volume mount
df -h | grep /mcp/memory

# Verify file exists
cat /mcp/memory/context.md
```

---

## 📚 References

- **Directives**: See `/mcp/directives.md`
- **Main README**: See `/README.md` in project root
- **Docker Docs**: https://docs.docker.com
- **Fedora Docs**: https://docs.fedoraproject.org

---

**Version**: 1.0.0
**Last Updated**: 2025-11-22
**Maintainer**: Skynet Depot AI Team
