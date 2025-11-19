# 🟣 QuickLauncher MCP — Architecture Documentation

## Overview

**QuickLauncher MCP** is a universal launcher for Windows (Raycast/Alfred equivalent) integrated into the Skynet ecosystem. It provides ultra-fast search, AI-powered commands, plugin extensibility, and cross-device synchronization via MCP.

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                           │
│         (Electron App - Global Hotkey Triggered)            │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Search Bar + AI Prompt Mode                     │      │
│  │  ├─ Instant Results Display                      │      │
│  │  ├─ Plugin Actions                               │      │
│  │  └─ AI Response Rendering                        │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              PYTHON BACKEND (FastAPI)                       │
│                                                             │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────┐     │
│  │   Indexer     │  │   Actions    │  │  AI Bridge  │     │
│  │               │  │   Manager    │  │             │     │
│  │ - Apps        │  │              │  │ - Claude    │     │
│  │ - Files       │  │ - Open App   │  │ - Gemini    │     │
│  │ - Commands    │  │ - Run Script │  │ - via MCP   │     │
│  │ - Plugins     │  │ - Execute    │  │             │     │
│  └───────┬───────┘  └──────┬───────┘  └──────┬──────┘     │
│          │                  │                  │            │
│          └──────────────────┴──────────────────┘            │
│                       │                                     │
│                  SQLite Index                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                 MCP SERVER (Node.js)                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Index Sync   │  │  AI Bridge   │  │   Plugins    │     │
│  │              │  │              │  │   Manager    │     │
│  │ - Push/Pull  │  │ - CLI Route  │  │              │     │
│  │ - Multi-Dev  │  │ - API Route  │  │ - Distribute │     │
│  │              │  │              │  │ - Update     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│         Skynet MCP Hub Communication                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Components Breakdown

### 1. **Frontend Layer (Electron)**

**Technology:** Electron.js
**Location:** `/launcher/electron_app/`

#### Key Files:
- `main.js` - Main Electron process, global hotkey registration
- `preload.js` - Secure IPC bridge
- `index.html` - UI interface
- `src/js/search.js` - Search logic + backend communication
- `src/js/ai_prompt.js` - AI mode handling
- `src/js/plugins.js` - Plugin loader
- `src/js/actions.js` - Action executor

#### Features:
- Global hotkey trigger (default: `Alt+Space`)
- Instant search (<200ms response)
- Dual mode: Search / AI Prompt
- Plugin action display
- Dark mode UI
- Fuzzy matching display
- Keyboard navigation

---

### 2. **Backend Layer (Python)**

**Technology:** FastAPI
**Location:** `/backend/python_server/`

#### Key Files:
- `server.py` - FastAPI server with endpoints
- `indexer.py` - File/app indexation engine
- `actions_manager.py` - Action execution controller
- `ai_bridge.py` - AI integration bridge
- `models.py` - Data models

#### API Endpoints:

```
POST /search
  Body: { "query": "text" }
  Returns: [ { type, name, path, score, icon } ]

POST /ai
  Body: { "prompt": "text", "mode": "quick|contextual" }
  Returns: { "response": "...", "actions": [...] }

POST /action
  Body: { "type": "open|run|script", "target": "..." }
  Returns: { "status": "success|error", "message": "..." }

POST /index/rebuild
  Returns: { "indexed": 1234, "duration": "2.3s" }
```

#### Indexer Features:
- Scans Windows Start Menu
- Indexes user-specified directories
- Detects installed programs
- Stores in SQLite (`index.db`)
- Auto-rebuild on schedule
- Incremental updates

#### Database Schema:

```sql
CREATE TABLE indexed_items (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    type TEXT NOT NULL,  -- app|file|folder|command|plugin
    icon TEXT,
    tags TEXT,
    frequency INTEGER DEFAULT 0,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. **MCP Server Layer (Node.js)**

**Technology:** Node.js + Express
**Location:** `/backend/mcp/`

#### Key Files:
- `server.js` - MCP server
- `tools/index_sync.js` - Index synchronization
- `tools/ai_bridge.js` - AI CLI routing
- `tools/plugins_manager.js` - Plugin distribution

#### MCP Endpoints:

```
POST /sync/index/push
  Body: { index_data, device_id }

GET /sync/index/pull
  Returns: merged index from all devices

POST /ai/prompt
  Body: { prompt, context }
  Routes to: Claude CLI / Gemini CLI / API

GET /plugins/list
  Returns: available plugins

POST /plugins/install
  Body: { plugin_id }
```

#### Sync Strategy:
- Each device pushes index changes
- MCP merges + deduplicates
- Devices pull merged index
- Frequency tracking synced
- Conflict resolution: most recent wins

---

### 4. **Plugin System**

**Location:** `/launcher/plugins/`

#### Plugin API Structure:

```javascript
module.exports = {
    name: "plugin_name",
    description: "What it does",
    version: "1.0.0",
    keywords: ["trigger", "words"],

    // Main execution
    execute: async (input, context) => {
        // Plugin logic
        return {
            type: "action|result|ui",
            data: { ... }
        };
    },

    // Search integration
    search: async (query) => {
        return [
            { title, subtitle, action }
        ];
    }
};
```

#### Default Plugins:
- **open_app** - Launch applications
- **search_web** - Web search (Google/DDG)
- **system_actions** - System commands (shutdown, restart, etc.)

#### Custom Plugins:
Users can create plugins in `/plugins/custom/` following the API spec.

---

## 🔄 Data Flow

### Search Flow:
```
User types → Frontend captures
           → POST /search to Python backend
           → Indexer queries SQLite
           → Fuzzy match + ranking
           → Results returned
           → Frontend displays with icons
```

### AI Prompt Flow:
```
User types with ">" prefix → Frontend detects AI mode
                           → POST /ai to Python backend
                           → ai_bridge.py routes to MCP
                           → MCP calls Claude CLI / API
                           → Response streamed back
                           → Frontend renders formatted
```

### Action Execution Flow:
```
User selects result → Frontend sends action
                    → POST /action to Python backend
                    → actions_manager.py executes
                    → Updates frequency in index
                    → Returns status
```

---

## 🚀 Performance Targets

- **Search Response:** <200ms
- **Index Size:** 50,000+ items
- **Memory Footprint:** <150MB (idle)
- **Startup Time:** <500ms
- **Indexing Speed:** 1,000 items/sec

---

## 🔐 Security

- No admin rights required
- Sandboxed plugin execution
- Input sanitization on all endpoints
- No shell injection vulnerabilities
- Secure IPC (contextBridge)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Electron.js, HTML/CSS/JS |
| Backend | Python 3.10+, FastAPI |
| MCP Server | Node.js 18+, Express |
| Database | SQLite3 |
| AI Integration | Claude CLI, Gemini CLI, API fallback |
| Plugins | JavaScript modules |

---

## 📦 Deployment

1. **Frontend:** Packaged as Electron executable
2. **Backend:** Python server runs as background service
3. **MCP:** Node.js server (optional, for sync features)
4. **Auto-start:** Registered in Windows startup
5. **Updates:** MCP-based plugin/index updates

---

## 🔮 Future Enhancements

- [ ] Float overlay mode (transparent launcher)
- [ ] Developer command palette
- [ ] Contextual AI mode (Raycast AI equivalent)
- [ ] Browser extension integration
- [ ] Mobile companion app
- [ ] Voice activation
- [ ] Workflow automation (chains of actions)
- [ ] Cloud backup of custom plugins

---

**Architecture Version:** 1.0
**Last Updated:** 2025-11-18
**Skynet Ecosystem Integration:** Full MCP compatibility
