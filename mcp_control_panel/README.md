# MCP Control Panel

**Skynet Multi-Agent Management System**

A powerful Windows desktop application for managing and orchestrating multiple AI CLI agents from a centralized control panel.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.10+-green)
![PyQt5](https://img.shields.io/badge/PyQt5-5.15+-orange)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Overview

MCP Control Panel is a comprehensive GUI application designed to manage multiple AI CLI agents (Claude, Gemini, Codex, Comet, and more) from a single, intuitive interface. Think of it as your **mission control center** for AI agents.

### Key Features

- **Multi-Agent Management**: Launch, monitor, and stop multiple AI CLI agents simultaneously
- **Live Output Monitoring**: Real-time display of agent stdout/stderr
- **Context Management**: View and manage agent configurations and contexts
- **History Tracking**: Complete logging of all system events and agent activities
- **Quick Commands**: One-click access to frequently used tools (VS Code, Claude Code, etc.)
- **Dark Theme UI**: Professional, easy-on-the-eyes interface optimized for long sessions
- **Modular Design**: Easily add new agents by dropping JSON config files

---

## Architecture

```
mcp_control_panel/
├── core/                   # Core functionality modules
│   ├── __init__.py
│   ├── agent_manager.py    # Agent process lifecycle management
│   ├── context_loader.py   # Configuration loading and parsing
│   ├── history_manager.py  # Event logging and history
│   └── mcp_app.py          # Main PyQt5 application
│
├── agents/                 # Agent configuration files
│   ├── claude.json         # Claude CLI configuration
│   ├── gemini.json         # Gemini CLI configuration
│   ├── codex.json          # Codex CLI configuration
│   └── comet.json          # Comet CLI configuration
│
├── ui/                     # User interface resources
│   ├── main_window.ui      # Qt Designer UI definition
│   ├── style.qss           # Dark theme stylesheet
│   └── icons/              # Icon resources (future)
│
├── logs/                   # System logs directory
│   └── mcp_history.log     # Auto-generated log file
│
├── run_mcp.py              # Application launcher
└── README.md               # This file
```

---

## Installation

### Prerequisites

- **Python 3.10+** (Python 3.11 recommended)
- **PyQt5** for the GUI
- **Windows 10/11** (primary platform)

### Setup

1. **Clone or download this repository**

```bash
cd /path/to/mcp_control_panel
```

2. **Install dependencies**

```bash
pip install PyQt5
```

That's it! The application is self-contained and has minimal dependencies.

---

## Usage

### Launching the Control Panel

```bash
python run_mcp.py
```

Or on systems with multiple Python versions:

```bash
python3 run_mcp.py
```

### Quick Start Guide

1. **Select an Agent**: Click on an agent in the left sidebar (Claude, Gemini, Codex, or Comet)

2. **View Context**: The "Agent Context" tab shows the selected agent's configuration, capabilities, and settings

3. **Launch Agent**: Click the "Launch Agent" button to start the selected agent

4. **Monitor Output**: Switch to the "Live Output" tab to see real-time output from the running agent

5. **Stop Agent**: Click "Stop Agent" to gracefully terminate the running agent

6. **View History**: Check the "System History" tab for a complete log of all system events

---

## Agent Configuration

Each agent is configured via a JSON file in the `agents/` directory. Here's the structure:

```json
{
  "id": "agent_id",
  "name": "Agent Display Name",
  "description": "Brief description of the agent",
  "exec": "command-to-execute",
  "working_dir": "/path/to/working/directory",
  "env": {
    "ENV_VAR": "value"
  },
  "context": {
    "memory_dir": "/path/to/memory",
    "task_file": "tasks.json",
    "profile": "Agent Profile Name",
    "capabilities": [
      "Capability 1",
      "Capability 2"
    ]
  },
  "color": "#HexColor",
  "icon": "icon_filename.png"
}
```

### Adding a New Agent

1. Create a new JSON file in `agents/` directory (e.g., `myagent.json`)
2. Fill in the configuration following the template above
3. Click "Reload Agent Configs" in the Quick Commands tab
4. Your new agent will appear in the sidebar

### Example: Custom Agent

```json
{
  "id": "custom_ai",
  "name": "My Custom AI",
  "description": "Custom AI agent for specific tasks",
  "exec": "python custom_ai.py",
  "working_dir": "C:/AI/custom_ai",
  "env": {
    "API_KEY": "your_api_key_here"
  },
  "context": {
    "memory_dir": "C:/AI/memory",
    "task_file": "custom_tasks.json",
    "profile": "Custom Task Agent",
    "capabilities": [
      "Data analysis",
      "Report generation",
      "API integration"
    ]
  },
  "color": "#FF9500",
  "icon": "custom_icon.png"
}
```

---

## Features in Detail

### 1. Agent Manager

- **Launch agents** with custom commands, working directories, and environment variables
- **Monitor process status** (PID, uptime, exit codes)
- **Graceful shutdown** with fallback to force-kill if needed
- **Concurrent agent limit** (default: 5) to prevent resource exhaustion
- **Live output streaming** from stdout and stderr

### 2. Context Loader

- **Load agent configurations** from JSON files
- **Validation** of agent configurations before use
- **Hot-reload** capability to update configs without restarting
- **Search functionality** to find agents by name, description, or capabilities

### 3. History Manager

- **Comprehensive logging** of all system events
- **Automatic log rotation** when files exceed size limit
- **Filtering** by log level (INFO, WARNING, ERROR, SUCCESS, DEBUG)
- **Category-based filtering** (AGENT, SYSTEM, USER)
- **Export functionality** for long-term archival
- **Statistics** about log activity

### 4. User Interface

#### Tabs

- **Live Output**: Real-time agent stdout/stderr
- **Agent Context**: Configuration details for selected agent
- **System History**: Filtered view of system logs
- **Quick Commands**: One-click access to common operations

#### Controls

- **Launch Agent**: Start the selected agent
- **Stop Agent**: Gracefully stop the running agent
- **Refresh Status**: Update agent status display
- **Clear Output**: Clear the live output display
- **Export Logs**: Save logs to external file

#### Quick Commands

- **Open VS Code**: Launch VS Code in current directory
- **Open Claude Code**: Start Claude CLI
- **Clean Log Directory**: Clear all system logs (with backup)
- **Reload Agent Configs**: Reload all agent JSON files
- **Stop All Agents**: Emergency stop for all running agents

---

## Safety Features

### Concurrent Agent Limit

By default, MCP limits the number of simultaneously running agents to **5** to prevent:
- System resource exhaustion
- Unintentional agent spam
- Performance degradation

You can modify this limit in `agent_manager.py`:

```python
self.max_concurrent_agents = 5  # Change this value
```

### Graceful Shutdown

When closing the MCP Control Panel with running agents, you'll be prompted:
- **Stop all and exit**: Gracefully stops all agents and closes
- **Exit without stopping**: Leaves agents running (advanced users)
- **Cancel**: Returns to the application

### Log Rotation

Logs automatically rotate when they exceed **10 MB** to prevent disk space issues. Old logs are timestamped and backed up.

---

## Troubleshooting

### Issue: "Failed to launch agent"

**Possible causes:**
- Agent command not found in PATH
- Working directory doesn't exist
- Environment variables misconfigured
- Maximum concurrent agents reached

**Solutions:**
- Verify the `exec` command is correct and accessible
- Check that `working_dir` exists
- Review environment variables in agent JSON
- Stop unused agents to free up slots

### Issue: "No output appears in Live Output tab"

**Possible causes:**
- Agent hasn't produced output yet
- Agent is writing to a log file instead of stdout
- Agent process crashed immediately

**Solutions:**
- Wait a few seconds for agent initialization
- Check System History for error messages
- Verify agent command works in a regular terminal

### Issue: "PyQt5 import error"

**Solution:**
```bash
pip install --upgrade PyQt5
```

### Issue: "UI file not found"

**Possible cause:** Missing `ui/main_window.ui` file

**Solution:**
- Ensure the `ui/` directory contains `main_window.ui`
- Check file permissions
- The app will fall back to basic UI if file is missing

---

## Advanced Usage

### Custom Environment Variables

Add environment variables to your agent configuration:

```json
{
  "env": {
    "OPENAI_API_KEY": "sk-...",
    "CUSTOM_CONFIG_PATH": "/path/to/config",
    "DEBUG_MODE": "true"
  }
}
```

### Agent-Specific Working Directories

Set a custom working directory for each agent:

```json
{
  "working_dir": "C:/Projects/my_agent_workspace"
}
```

This is useful when agents need to access specific files or have context-dependent behavior.

### Viewing Specific Agent History

Use the history manager API to filter logs by agent:

```python
from core.history_manager import HistoryManager

history = HistoryManager('logs/mcp_history.log')
claude_history = history.get_agent_history('claude', lines=100)
```

---

## API Reference

### AgentManager

```python
class AgentManager:
    def launch_agent(agent_id: str, command: str,
                    working_dir: Optional[str] = None,
                    env: Optional[Dict] = None) -> tuple[bool, str]

    def stop_agent(agent_id: str, force: bool = False) -> tuple[bool, str]

    def get_agent_output(agent_id: str) -> tuple[list, list]

    def get_agent_status(agent_id: str) -> Optional[Dict]

    def stop_all_agents() -> Dict[str, str]
```

### ContextLoader

```python
class ContextLoader:
    def load_all_contexts() -> tuple[int, List[str]]

    def get_context(agent_id: str) -> Optional[AgentContext]

    def reload_context(agent_id: str) -> tuple[bool, Optional[str]]

    def add_new_agent(agent_data: Dict) -> tuple[bool, Optional[str]]
```

### HistoryManager

```python
class HistoryManager:
    def log(level: LogLevel, category: str, message: str,
           details: Optional[str] = None)

    def get_recent_logs(lines: int = 100) -> list[str]

    def export_logs(export_path: str,
                   start_date: Optional[datetime] = None,
                   end_date: Optional[datetime] = None) -> tuple[bool, Optional[str]]
```

---

## Roadmap

### Version 1.1 (Planned)

- [ ] WebSocket support for remote agent monitoring
- [ ] CPU/RAM usage tracking per agent
- [ ] Agent scheduling and automation
- [ ] Custom color themes
- [ ] Icon support for agents
- [ ] Notification system for agent events
- [ ] Multi-language support

### Version 2.0 (Future)

- [ ] Web-based interface option
- [ ] Agent collaboration features
- [ ] Distributed agent deployment
- [ ] Advanced analytics dashboard
- [ ] Plugin system for extensibility

---

## Contributing

Contributions are welcome! Here's how you can help:

1. **Report bugs**: Open an issue with reproduction steps
2. **Suggest features**: Describe your use case and proposed solution
3. **Submit pull requests**: Follow the existing code style
4. **Improve documentation**: Clarify confusing sections

---

## License

MIT License - feel free to use, modify, and distribute.

---

## Credits

Developed as part of the **Skynet Multi-Agent Management System**

**Technologies Used:**
- Python 3.10+
- PyQt5 for GUI
- Qt Designer for UI layout
- subprocess for process management

---

## Support

For issues, questions, or feature requests, please open an issue in the repository.

**Happy agent orchestration!** 🚀
