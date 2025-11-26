# Skynet Command Center v1.0

**The Central Control Hub for Skynet Multi-Agent Operating System**

---

## Overview

Skynet Command Center is a web-based control panel for managing, monitoring, and orchestrating multiple AI agents in the Skynet ecosystem. It provides a unified interface for:

- **Agent Management**: Start, stop, and monitor all Skynet agents
- **Memory Central**: Browse and synchronize the central memory system
- **System Logs**: View and filter real-time system logs
- **Internal Terminal**: Execute safe, whitelisted commands

---

## Features

### Dashboard (Main View)
- **4-Panel Layout**: Agents, Memory, Logs, and Terminal in one view
- **Auto-Refresh**: Live updates every 2 seconds
- **Quick Terminal**: Execute commands without leaving the dashboard

### Agent Control
- Real-time agent status monitoring (online/offline/error)
- Start/Stop/Restart individual agents
- View agent PIDs and last activity
- Detailed agent information

### Memory Explorer
- Hierarchical file tree visualization
- Memory statistics (file count, total size)
- Sync memory index from Skynet Drive
- Collapsible directory structure

### Log Viewer
- Real-time log streaming
- Filter by level (INFO, WARNING, ERROR)
- Search logs by keyword
- Clear logs functionality

### Terminal
- Safe internal terminal (no dangerous commands)
- Command history with arrow key navigation
- Whitelisted commands only
- Supports agent, memory, logs, and system commands

---

## Architecture

```
/skynet_command_center/
  ├── app/
  │     ├── server.py              # Flask application
  │     ├── config.py              # Configuration & constants
  │     ├── database.py            # SQLite database
  │     ├── routes/                # Flask blueprints
  │     │     ├── dashboard_routes.py
  │     │     ├── agents_routes.py
  │     │     ├── memory_routes.py
  │     │     ├── logs_routes.py
  │     │     └── terminal_routes.py
  │     └── services/              # Core services
  │           ├── agent_manager.py
  │           ├── memory_manager.py
  │           ├── logs_manager.py
  │           └── terminal_engine.py
  │
  ├── static/
  │     ├── css/
  │     │     └── style.css        # Dark mode theme
  │     └── js/
  │           ├── dashboard_refresh.js
  │           ├── agents_live.js
  │           ├── memory_viewer.js
  │           ├── logs_loader.js
  │           └── terminal.js
  │
  ├── templates/                   # HTML templates
  │     ├── dashboard.html
  │     ├── agents.html
  │     ├── memory.html
  │     ├── logs.html
  │     └── terminal.html
  │
  ├── data/                        # Data storage
  │     ├── agents.json            # Agent configurations
  │     ├── memory_index.json      # Memory index
  │     ├── logs/                  # Log files
  │     └── skynet_command.db      # SQLite database
  │
  ├── run.py                       # Entry point
  └── README.md                    # This file
```

---

## Installation

### Prerequisites

- Python 3.8+
- pip

### Dependencies

```bash
pip install flask psutil
```

### Configuration

Edit `app/config.py` to set your paths:

```python
SKYNET_ROOT = "C:/Users/rapha/Skynet_Drive_Core"
AGENTS_DIR = "C:/Users/rapha/IA/agents"
```

Or set environment variables:

```bash
export SKYNET_ROOT="/path/to/skynet/drive"
export AGENTS_DIR="/path/to/agents"
```

---

## Usage

### Start the Server

```bash
python run.py
```

The server will start on `http://localhost:6060`

### Access the Dashboard

Open your browser and navigate to:

```
http://localhost:6060/dashboard
```

### Available Pages

- **Dashboard**: http://localhost:6060/dashboard
- **Agents**: http://localhost:6060/agents
- **Memory**: http://localhost:6060/memory
- **Logs**: http://localhost:6060/logs
- **Terminal**: http://localhost:6060/terminal

---

## Terminal Commands

The internal terminal supports the following safe commands:

### Agent Commands
```
agent list                  # List all agents
agent start <name>          # Start an agent
agent stop <name>           # Stop an agent
agent restart <name>        # Restart an agent
```

### Memory Commands
```
memory sync                 # Synchronize memory index
memory list                 # List memory files
memory stats                # Show memory statistics
memory search <query>       # Search memory files
```

### Log Commands
```
logs tail [N]               # Show last N log entries
logs source <name>          # Show logs from specific source
logs level <level>          # Show logs by level
logs search <query>         # Search logs
logs clear                  # Clear all logs
logs stats                  # Show log statistics
```

### System Commands
```
status                      # Show overall system status
sync                        # Synchronize all systems
history [N]                 # Show command history
clear                       # Clear terminal
help                        # Show help
```

---

## API Endpoints

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/<name>` - Get agent status
- `POST /api/agents/<name>/start` - Start agent
- `POST /api/agents/<name>/stop` - Stop agent
- `POST /api/agents/<name>/restart` - Restart agent

### Memory
- `GET /api/memory/tree` - Get memory tree
- `GET /api/memory/stats` - Get memory stats
- `POST /api/memory/sync` - Sync memory
- `GET /api/memory/search?q=<query>` - Search memory

### Logs
- `GET /api/logs/latest?limit=N` - Get latest logs
- `GET /api/logs/source/<name>` - Get logs by source
- `GET /api/logs/level/<level>` - Get logs by level
- `GET /api/logs/search?q=<query>` - Search logs
- `POST /api/logs/clear` - Clear logs

### Terminal
- `POST /api/terminal/execute` - Execute command
- `GET /api/terminal/history` - Get command history

---

## Security

### Safe Design

- **Whitelisted Commands**: Only approved commands can be executed
- **No System Shell**: Terminal is internal, not a real shell
- **Blacklist Protection**: Dangerous commands are blocked
- **Read-Only Operations**: Most operations are non-destructive

### Blacklisted Commands

The following commands are **never** allowed:
- `rm`, `del`, `format`
- `shutdown`, `reboot`
- `kill`, `taskkill`

---

## Database Schema

### Tables

**agents_status**
- Tracks agent status history
- Fields: id, name, status, pid, last_seen, metadata

**terminal_history**
- Stores terminal command history
- Fields: id, timestamp, command, output, success

**sync_history**
- Logs memory synchronization events
- Fields: id, timestamp, sync_type, status, files_synced, details

---

## Theming

### Dark Mode Colors

```css
--bg-primary: #0C0C0C      /* Main background */
--bg-secondary: #181818    /* Panel background */
--bg-card: #1E1E1E         /* Card background */
--text-primary: #E0E0E0    /* Primary text */
--accent: #00AEEF          /* Accent color */
--error: #FF3B3B           /* Error color */
--success: #00E676         /* Success color */
--warning: #FFC107         /* Warning color */
```

---

## Development

### Project Structure

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Styling**: Pure CSS with dark mode
- **Database**: SQLite
- **Architecture**: Modular, service-based

### Adding New Features

1. Create service in `app/services/`
2. Add routes in `app/routes/`
3. Register blueprint in `app/server.py`
4. Create frontend JS in `static/js/`
5. Update templates in `templates/`

---

## Roadmap

### v1.0 (Current)
- Dashboard with 4 panels
- Agent management
- Memory explorer
- Log viewer
- Internal terminal

### v2.0 (Planned)
- WebSocket support for real-time updates
- Agent auto-restart on failure
- Memory search with full-text indexing
- Log filtering and export

### v3.0 (Future)
- Multi-machine agent control
- Distributed memory synchronization
- Advanced analytics dashboard
- Agent performance metrics

### v4.0 (Vision)
- Autonomous agent coordination
- Self-healing system
- AI-powered anomaly detection
- Command Center self-management

---

## Troubleshooting

### Server won't start

Check that:
- Port 6060 is available
- Python dependencies are installed
- Paths in `config.py` are correct

### Agents not showing

Verify:
- `data/agents.json` exists and is valid JSON
- Agent paths in configuration are correct

### Memory sync fails

Ensure:
- SKYNET_ROOT path is accessible
- Memory directory exists
- Sufficient permissions

---

## License

Part of the Skynet Multi-Agent Operating System.

---

## Author

**Skynet Architect**
Version 1.0 - 2025

---

## Support

For issues, feature requests, or contributions, contact the Skynet development team.

**Built with Python, Flask, and determination.**
