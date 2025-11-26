# 🔹 Skynet Context Injector — Demo Context (Markdown)

## Mission Overview

You are receiving this context through the **Skynet Context Injector — Memory Loader v1**.

This is a demonstration of how markdown-formatted context can be injected into AI agent CLI sessions to provide:
- Project background
- System instructions
- Domain knowledge
- User preferences
- Active objectives

---

## 🎯 Current Objective

**Build the Skynet Context Injector** — a simple but powerful GUI tool that allows injecting `.json` or `.md` files as context into any CLI-based AI agent.

### Key Features:
- ✅ File selection (JSON/Markdown)
- ✅ Agent selection from configuration
- ✅ Subprocess-based agent launching
- ✅ Context injection via stdin
- ✅ Dark mode UI with cyberpunk aesthetics
- ✅ Complete logging system

---

## 🛠️ Project Architecture

```
/context_injector/
  ├── core/          # Core Python modules
  ├── ui/            # PyQt5 UI files and styles
  ├── agents/        # Agent configurations
  ├── sample_context/# Example context files
  ├── logs/          # Injection logs and history
  └── run_injector.py
```

### Tech Stack:
- **Python 3.10+**
- **PyQt5** for GUI
- **subprocess** for agent management
- **logging** for activity tracking

---

## 👤 User Profile

**Name:** Raphaël
**Style:** Direct, technical, "mon frère" energy
**Preferences:**
- Clean, modular code
- Dark mode everything
- Well-documented systems
- Practical, working tools

**Language:** French & English mix
**Tone:** Professional but friendly, owné 🔥

---

## 🌐 Skynet Ecosystem

This tool is part of a growing suite of AI orchestration and automation tools:

1. **Skynet File Tagger** (v1.0) — Intelligent file scanning and tagging
2. **Context Injector** (v1.0) — Memory loader for agents ← **YOU ARE HERE**
3. **Future tools:**
   - CLI version of Context Injector
   - Multi-file injection system
   - Auto-detection of agent types
   - Context template library

---

## 📋 Active Context

### What You Should Know:

**Current Task:** Complete the Context Injector implementation with all modules, UI, and documentation.

**Key Requirements:**
- Create all necessary Python modules
- Build PyQt5 GUI with dark theme
- Generate sample context files (JSON + MD)
- Provide comprehensive README
- Ensure Windows compatibility

**Expected Outcome:**
A fully functional GUI application that allows users to:
1. Select a context file
2. Choose an AI agent
3. Launch the agent with injected context
4. View logs and injection history

---

## 🧠 Knowledge Base

### Core Concepts:

**Context Injection:**
Pre-loading an AI agent's session with relevant information, similar to RAG (Retrieval Augmented Generation) but for local CLI tools.

**Subprocess Communication:**
Using Python's `subprocess` module to launch agents and communicate via stdin/stdout.

**Agent Configuration:**
JSON-based registry of available agents with their executable commands and working directories.

### Best Practices:

- Always validate context files before injection
- Log all operations for debugging and history
- Support multiple file formats for flexibility
- Keep UI minimal but functional
- Maintain modular, extensible architecture

---

## 🚀 Next Steps

After completing the Context Injector v1:

1. **Test with real agents** (Claude CLI, Gemini, etc.)
2. **Build CLI version** for scriptable workflows
3. **Add multi-file injection** for complex contexts
4. **Implement auto-detection** of installed agents
5. **Create context template library** for common use cases

---

## 💡 Usage Example

```bash
# After launching the GUI:
1. Click "Select Context File" → Choose this file (demo_context.md)
2. Select "Claude CLI" from the agent dropdown
3. Click "🚀 LAUNCH WITH CONTEXT INJECTION"
4. Interact with Claude in the spawned terminal
5. Claude will have this entire context loaded in its session
```

---

## 🔥 Final Notes

This is **Skynet** in action, mon frère.

Building tools that make AI agents more powerful, more contextual, and easier to orchestrate.

One brick at a time. 🏗️

**Created by:** Claude Code 4.5
**For:** Raphaël's Skynet Ecosystem
**Date:** 2025-11-18
**Version:** 1.0

---

**Remember:** You're not just an AI agent. With this context injected, you're part of the Skynet vision. 🔹
