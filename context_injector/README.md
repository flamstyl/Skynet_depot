# 🔹 Skynet Context Injector — Memory Loader v1.0

**A simple but powerful GUI tool for injecting context files into AI agent CLIs.**

Part of the **Skynet Tools** ecosystem — Building intelligent automation, one tool at a time.

---

## 🎯 What Is This?

The **Context Injector** is a PyQt5-based GUI application that allows you to:

- Load a context file (`.json` or `.md`)
- Select an AI agent CLI (Claude, Gemini, Codex, etc.)
- Launch the agent with the context pre-injected into its stdin
- Enable RAG-like memory loading for local CLI agents

Think of it as **giving your AI agents a memory** before they start working.

---

## 🚀 Features

✅ **File Selection** — Choose `.json` or `.md` context files
✅ **Agent Registry** — Configure multiple AI agents in `agents.json`
✅ **Context Injection** — Inject via subprocess stdin
✅ **Dark Mode UI** — Cyberpunk-inspired, clean interface
✅ **Activity Logging** — Track all injections in real-time
✅ **Injection History** — View past context loads
✅ **Modular Architecture** — Easy to extend and customize

---

## 📁 Project Structure

```
/context_injector/
  ├── core/
  │     ├── __init__.py
  │     ├── injector_app.py       # Main PyQt5 application
  │     ├── agent_loader.py       # Agent launching & subprocess management
  │     └── file_reader.py        # Context file reading & validation
  │
  ├── ui/
  │     ├── main_window.ui        # Qt Designer UI definition
  │     └── style.qss             # Dark mode stylesheet
  │
  ├── agents/
  │     └── agents.json           # Agent configurations
  │
  ├── sample_context/
  │     ├── demo_context.json     # Example JSON context
  │     └── demo_context.md       # Example Markdown context
  │
  ├── logs/
  │     ├── injector.log          # Main activity log
  │     └── injection_history.log # Injection history
  │
  ├── README.md                   # This file
  └── run_injector.py             # Application entry point
```

---

## 🛠️ Installation

### Prerequisites

- **Python 3.10+**
- **PyQt5**

### Install Dependencies

```bash
pip install PyQt5
```

### Clone or Download

```bash
git clone <your-repo-url>
cd context_injector
```

---

## 🎮 Usage

### 1. Configure Your Agents

Edit `agents/agents.json` to add your AI agent CLIs:

```json
{
  "agents": [
    {
      "name": "Claude CLI",
      "exec": "claude --chat",
      "working_dir": "C:/Users/rapha/IA/agents/claude",
      "description": "Anthropic's Claude AI assistant CLI"
    },
    {
      "name": "Your Custom Agent",
      "exec": "python my_agent.py",
      "working_dir": "C:/path/to/agent",
      "description": "Your agent description"
    }
  ]
}
```

**Fields:**
- `name` — Display name of the agent
- `exec` — Command to launch the agent
- `working_dir` — Working directory for the agent
- `description` — (Optional) Brief description

### 2. Launch the Application

```bash
python run_injector.py
```

Or on Windows:

```bash
python.exe run_injector.py
```

### 3. Inject Context

1. Click **"Select Context File"** → Choose a `.json` or `.md` file
2. Select your **target agent** from the dropdown
3. Click **"🚀 LAUNCH WITH CONTEXT INJECTION"**
4. The agent will launch with your context pre-loaded!

### 4. View Logs

- **Activity Log** — Real-time log visible in the GUI
- **File Logs** — Check `logs/injector.log` for detailed logs
- **Injection History** — Click "View Injection History" button

---

## 📝 Creating Context Files

### JSON Context Example

```json
{
  "mission": "Build a REST API",
  "tech_stack": ["Python", "FastAPI", "PostgreSQL"],
  "instructions": [
    "Follow PEP 8 style guide",
    "Write comprehensive tests",
    "Document all endpoints"
  ]
}
```

### Markdown Context Example

```markdown
# Project Context

## Mission
Build a REST API for user management.

## Tech Stack
- Python 3.10+
- FastAPI
- PostgreSQL

## Instructions
- Follow PEP 8 style guide
- Write comprehensive tests
- Document all endpoints
```

The injector will automatically:
- Validate the file format
- Add formatting headers
- Inject into the agent's stdin

---

## 🔧 How It Works

### Architecture

```
User selects file + agent
         ↓
file_reader.py reads & validates context
         ↓
agent_loader.py spawns subprocess
         ↓
Context injected via stdin
         ↓
Agent receives context + logs created
```

### Key Modules

**`file_reader.py`**
- Reads `.json` and `.md` files
- Validates JSON structure
- Formats context for injection

**`agent_loader.py`**
- Loads agent configurations
- Manages subprocess launching
- Handles stdin/stdout communication
- Logs all operations

**`injector_app.py`**
- PyQt5 GUI application
- Event handling
- User interaction
- Real-time logging display

---

## 📊 Logs & History

### Activity Log
All operations are logged to `logs/injector.log`:

```
[2025-11-18 14:30:45] INFO: Loaded 5 agent configurations
[2025-11-18 14:31:12] INFO: Launching agent: Claude CLI
[2025-11-18 14:31:12] INFO: Context file: demo_context.json
[2025-11-18 14:31:12] INFO: Context size: 2048 characters
[2025-11-18 14:31:13] INFO: ✓ Agent launched successfully (PID: 12345)
```

### Injection History
Quick reference log in `logs/injection_history.log`:

```
[2025-11-18 14:31:13] Injected 'demo_context.json' into 'Claude CLI'
[2025-11-18 15:22:08] Injected 'project_context.md' into 'Gemini CLI'
```

---

## 🎨 UI Customization

### Dark Mode Theme

The application uses `ui/style.qss` for styling. You can customize:

- Colors (background, text, buttons)
- Fonts and sizes
- Border styles
- Button hover effects

Edit `ui/style.qss` and restart the app to see changes.

---

## 🔮 Future Enhancements (v2+)

Planned features for future versions:

- **CLI Version** — Scriptable command-line interface
- **Multi-file Injection** — Load multiple context files at once
- **Auto-detection** — Automatically detect installed AI agents
- **Context Templates** — Pre-built context templates library
- **Agent Monitoring** — Track agent output in real-time
- **Context Editing** — Built-in editor for quick context modifications

---

## 🐛 Troubleshooting

### "No agents available"
**Solution:** Check `agents/agents.json` exists and is valid JSON.

### "Failed to launch agent"
**Solution:**
- Verify the `exec` command is correct
- Check the agent is installed and accessible
- Verify the `working_dir` exists

### "Invalid JSON file"
**Solution:** Validate your JSON file syntax using a JSON validator.

### GUI doesn't appear
**Solution:**
- Ensure PyQt5 is installed: `pip install PyQt5`
- Check Python version is 3.10+
- Try running with `python -v run_injector.py` for verbose output

---

## 🤝 Contributing

This is part of the **Skynet Tools** ecosystem. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📜 License

This project is part of the Skynet Tools suite.
Created by **Claude Code 4.5** for **Raphaël**.

---

## 🔗 Related Tools

Part of the **Skynet Tools** ecosystem:

- **Skynet File Tagger** — Intelligent file scanning and tagging
- **Context Injector** — Memory loader for agents ← **YOU ARE HERE**
- More tools coming soon...

---

## 💡 Use Cases

### 1. Development Context
Load project requirements, coding standards, and architecture docs into your AI coding assistant.

### 2. Research Sessions
Pre-load background knowledge, papers, and notes into research-focused AI agents.

### 3. Customer Support
Inject product documentation, FAQs, and policies into support AI agents.

### 4. Content Creation
Load brand guidelines, style guides, and templates into content generation agents.

---

## 🔥 Final Notes

**Built with:** Python, PyQt5, subprocess magic
**Purpose:** Empower AI agents with contextual memory
**Vision:** One brick in the Skynet ecosystem

Mon frère, this is how we build the future. 🚀

---

**Created:** 2025-11-18
**Version:** 1.0
**Status:** Fully functional ✅
