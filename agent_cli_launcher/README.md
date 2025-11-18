# 🚀 Skynet Agent CLI Launcher v1.0

**An intelligent, GUI-based launcher and monitoring system for CLI agents.**

Effortlessly manage, monitor, and log all your AI CLI agents from a single, beautiful dark-themed interface.

---

## ✨ Features

- **🔍 Automatic Agent Discovery** - Scans `C:/Users/rapha/IA/agents/` and detects all `.py`, `.bat`, and `.exe` agents
- **▶️ Process Management** - Start, stop, and monitor agent processes with one click
- **📊 Real-time Output** - Live capture of stdout/stderr in the GUI terminal
- **📝 Session Logging** - Each agent session is logged to timestamped files: `/logs/{agent_name}/{timestamp}.log`
- **🎨 Dark Theme UI** - Professional dark interface built with PyQt5
- **🔄 Auto-refresh** - UI updates every 400ms to show current agent status
- **💾 Persistent Logs** - Complete session history for debugging and analysis
- **🛡️ Crash Detection** - Automatically detects when agents crash or exit unexpectedly

---

## 📁 Project Structure

```
agent_cli_launcher/
├── core/
│   ├── __init__.py
│   ├── agent_scanner.py       # Auto-detects agents in target directory
│   ├── agent_process.py       # Process management & output capture
│   ├── logger_manager.py      # Session-based logging system
│   └── launcher_app.py        # Main PyQt5 GUI application
│
├── ui/
│   ├── __init__.py
│   ├── main_window.ui         # PyQt5 UI layout (XML)
│   └── style.qss              # Dark theme stylesheet
│
├── logs/
│   └── {agent_name}/
│       └── {timestamp}.log
│
├── agents/
│   └── (auto-scanned from C:/Users/rapha/IA/agents/)
│
├── __init__.py
├── run_launcher.py            # Main entry point
└── README.md                  # This file
```

---

## 🛠️ Requirements

### Python Version
- **Python 3.7+**

### Dependencies
```bash
pip install PyQt5
```

That's it! The launcher has minimal dependencies.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install PyQt5
```

### 2. Run the Launcher

```bash
python run_launcher.py
```

Or navigate to the directory and run:

```bash
cd agent_cli_launcher
python run_launcher.py
```

### 3. Using the Interface

1. **Select an Agent** - Click on any agent in the left panel
2. **View Agent Info** - See path, type, and current status
3. **Start Agent** - Click the **▶️ START** button
4. **Monitor Output** - Watch real-time output in the terminal
5. **Stop Agent** - Click the **⏹️ STOP** button
6. **View Logs** - Click **📂 Open Logs** to access session logs

---

## 🎯 How It Works

### Agent Discovery

The scanner automatically detects executable files in:
```
C:/Users/rapha/IA/agents/
```

Supported file types:
- `.py` - Python scripts (executed with `python script.py`)
- `.bat` - Batch files (executed directly)
- `.exe` - Executables (executed directly)

### Process Management

Each agent runs in its own subprocess:
- **stdout/stderr** are captured in real-time using threads
- Process status is monitored continuously
- Graceful shutdown with 5-second timeout before force kill

### Logging System

Every agent session creates a unique log file:

```
logs/
├── gemini_cli/
│   ├── 2025-11-18_22-44-33.log
│   └── 2025-11-18_23-15-10.log
├── claude_cli/
│   └── 2025-11-18_22-50-00.log
```

Each log file contains:
- Session start timestamp
- All stdout/stderr output with timestamps
- System messages (start, stop, errors)
- Session end timestamp

---

## 🖥️ UI Components

### Left Panel
- **Agent List** - Shows all detected agents with 🤖 emoji
- **Refresh Button** - Re-scan the agents directory

### Right Panel

#### Agent Information
- Name, path, type, and current status
- Color-coded status: 🟢 Running | ⚪ Stopped | 🔴 Error

#### Control Buttons
- **▶️ START** - Launch the selected agent
- **⏹️ STOP** - Stop the running agent
- **📂 Open Logs** - Open the agent's log folder
- **🗑️ Clear** - Clear the output terminal

#### Live Terminal
- Real-time output display
- Monospace font for readability
- Auto-scroll to latest output
- Matrix green color scheme

---

## ⚙️ Configuration

### Change Agent Directory

Edit the scanner initialization in `core/agent_scanner.py`:

```python
def __init__(self, scan_directory: str = r"YOUR_CUSTOM_PATH"):
```

Or modify it in `launcher_app.py`:

```python
self.scanner = AgentScanner(scan_directory=r"C:/your/custom/path")
```

### Change Log Directory

Edit the logger initialization in `core/logger_manager.py`:

```python
self.logs_base_dir = Path("your/custom/logs/path")
```

### Customize UI Theme

Edit `ui/style.qss` to change colors, fonts, and styling.

---

## 🔧 Advanced Usage

### Running Individual Modules

Each core module can be tested independently:

```bash
# Test agent scanner
python core/agent_scanner.py

# Test process manager
python core/agent_process.py

# Test logger
python core/logger_manager.py
```

### Programmatic Usage

You can also use the modules in your own scripts:

```python
from core.agent_scanner import AgentScanner
from core.agent_process import AgentProcessManager
from core.logger_manager import LoggerManager

# Scan for agents
scanner = AgentScanner()
agents = scanner.scan()

# Start an agent
manager = AgentProcessManager()
manager.start_agent(agents[0])

# Log output
logger = LoggerManager()
logger.start_session("my_agent")
logger.write("my_agent", "Hello from agent!")
```

---

## 🐛 Troubleshooting

### Agents Not Detected

- Verify the scan directory path exists: `C:/Users/rapha/IA/agents/`
- Check file extensions: only `.py`, `.bat`, `.exe` are supported
- Click the **🔄 Refresh Agents** button

### Agent Won't Start

- Check that Python is in your system PATH (for .py files)
- Verify the agent file has proper permissions
- Check the logs folder for error messages

### Output Not Showing

- Ensure the agent writes to stdout/stderr
- Some applications may buffer output - this can delay display
- Check the log files directly for complete output

### PyQt5 Import Error

```bash
pip install --upgrade PyQt5
```

---

## 📊 Performance

- **UI Refresh Rate**: 400ms (configurable)
- **Max Output Lines**: 10,000 (prevents memory issues)
- **Thread-based Output**: Non-blocking real-time capture
- **Log Buffer**: Line-buffered for immediate writes

---

## 🔮 Future Enhancements (v2.0 Roadmap)

- **Multi-window Support** - Separate window per agent
- **CPU/Memory Monitoring** - Resource usage graphs
- **Auto-restart** - Automatic agent restart on crash
- **Agent Profiles** - Save start parameters and configurations
- **Scheduled Launches** - Start agents at specific times
- **Remote Agents** - SSH support for remote CLI agents
- **Export Logs** - Export to CSV, JSON, or HTML

---

## 📝 License

This project is part of the Skynet Development Suite.

---

## 👨‍💻 Author

Built with ❤️ for efficient agent management.

**Skynet Development Team**

---

## 🙏 Acknowledgments

- Built with **PyQt5** for the GUI framework
- Inspired by modern IDE terminal panels
- Designed for developers managing multiple AI agents

---

## 📞 Support

For issues or questions:
1. Check the logs in `/logs/{agent_name}/`
2. Run modules individually for debugging
3. Verify all dependencies are installed

---

**🚀 Happy Agent Managing!**
