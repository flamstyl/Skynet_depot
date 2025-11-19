# 🏗️ MCP Forge — Architecture Document

**Skynet Agent Builder — Visual Agent Construction System**

Version: 1.0.0
Created: 2025-11-19
Status: Initial Architecture

---

## 🎯 **VISION STATEMENT**

MCP Forge is the **God-Mode agent builder** for Skynet OS.
A visual, drag-and-drop interface to **construct, simulate, validate, and export** AI agents without coding.

Think: **Node-RED + LangGraph Studio + Godot Node System** → but for Skynet agents.

---

## 🧱 **CORE ARCHITECTURE**

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    🎨 ELECTRON UI LAYER                      │
│  Canvas Engine | Node Library | Visual Editor | Dark Mode   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  🔧 NODE.JS BACKEND LAYER                    │
│  Agent Templates | Exporters | Validator | Dry Runner       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    🔌 MCP SERVER LAYER                       │
│  AI Bridge | Sync Tools | Agent Deployment | API Gateway    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  🐍 PYTHON TOOLS LAYER                       │
│  Simulation Engine | Test Harness | Agent Validation        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 **MODULE BREAKDOWN**

### 1. **Electron Frontend** (`/forge_app/electron_app/`)

**Purpose**: Visual agent construction interface

**Components**:

#### Canvas Engine (`canvas_engine.js`)
- Drag & drop node system
- Connection management
- Real-time validation
- Auto-save functionality
- Undo/redo stack
- Zoom & pan controls

**Node Types**:
```
Agent Nodes:
  ├── Claude Agent
  ├── GPT Agent
  ├── Gemini Agent
  ├── Codestral Agent
  └── Custom Model

Input Nodes:
  ├── Email Watcher
  ├── Folder Watcher
  ├── API Trigger
  ├── Cron Schedule
  └── Event Listener

Processing Nodes:
  ├── Memory Block
  ├── Prompt Template
  ├── Action Chain
  ├── Decision Logic
  └── Filter Block

Output Nodes:
  ├── Drive Export
  ├── Webhook Call
  ├── Log Writer
  ├── Email Send
  └── AI Response
```

#### Node Library (`node_library.js`)
- Categorized node palette
- Search & filter
- Node templates
- Custom node creation
- Import/export node definitions

#### Agent Exporter (`agent_exporter.js`)
- Convert canvas → agent config
- YAML generation
- JSON generation
- n8n workflow export
- Skynet Core format

---

### 2. **Backend Services** (`/forge_app/backend_node/`)

**Purpose**: Agent processing & export logic

#### Server (`server.js`)

**REST API Endpoints**:
```
POST   /api/export/yaml          - Export agent to YAML
POST   /api/export/json          - Export agent to JSON
POST   /api/export/n8n           - Export as n8n workflow
POST   /api/validate/structure   - Validate agent structure
POST   /api/validate/ai          - AI-powered validation
POST   /api/dry-run              - Simulate agent execution
POST   /api/save                 - Save agent project
GET    /api/load/:id             - Load agent project
GET    /api/templates            - List agent templates
POST   /api/deploy               - Deploy to Skynet
```

#### Exporter (`exporter.js`)
```javascript
class AgentExporter {
  exportToYAML(canvasData)
  exportToJSON(canvasData)
  exportToN8N(canvasData)
  validateStructure(agentConfig)
  mergeTemplates(base, custom)
}
```

#### Validator (`validator.js`)
```javascript
class AgentValidator {
  validateLogic(agent)
  checkCycles(cycles)
  verifyConnections(nodes, edges)
  detectInfiniteLoops(flow)
  suggestImprovements(agent)
}
```

#### Dry Runner (`dry_runner.js`)
```javascript
class DryRunner {
  simulate(agent, input)
  mockTriggers(triggers)
  logExecution(steps)
  generateReport(results)
}
```

---

### 3. **MCP Integration** (`/forge_app/mcp/`)

**Purpose**: AI integration & agent deployment

#### MCP Server (`server.js`)

**MCP Tools**:
```javascript
{
  "validate_agent": {
    description: "Validate agent with Claude/GPT",
    parameters: { agent_config, model }
  },

  "improve_agent": {
    description: "Get AI suggestions for agent improvement",
    parameters: { agent_config, focus_areas }
  },

  "generate_metadata": {
    description: "Auto-generate agent metadata",
    parameters: { agent_config }
  },

  "sync_to_skynet": {
    description: "Deploy agent to Skynet Core",
    parameters: { agent_id, target_path }
  },

  "test_agent": {
    description: "Run comprehensive agent tests",
    parameters: { agent_config, test_scenarios }
  }
}
```

#### AI Bridge (`ai_bridge.js`)
```javascript
class AIBridge {
  callClaude(prompt, context)
  callGPT(prompt, context)
  callGemini(prompt, context)
  parseAIResponse(response)
  extractSuggestions(response)
}
```

#### Sync Agent (`sync_agents.js`)
```javascript
class AgentSync {
  pushToSkynet(agent, path)
  pullFromSkynet(agentId)
  syncToN8N(workflow)
  versionControl(agent)
  backup(agent)
}
```

---

### 4. **Python Tools** (`/forge_app/python_tools/`)

**Purpose**: Agent testing & simulation

#### Test Agent (`test_agent.py`)
```python
class AgentTester:
    def validate_structure(config)
    def test_triggers(triggers)
    def test_cycles(cycles, max_iterations)
    def test_memory(memory_config)
    def generate_report()
```

#### Simulate Cycle (`simulate_cycle.py`)
```python
class CycleSimulator:
    def setup_environment(config)
    def run_cycle(cycle_config, input_data)
    def mock_ai_responses(model, prompt)
    def log_steps(execution_log)
    def analyze_performance()
```

---

## 🔄 **DATA FLOW**

### Agent Creation Flow

```
User Action (Canvas)
    ↓
Canvas Engine (JSON structure)
    ↓
Validation (Structure check)
    ↓
Optional: AI Validator (Claude/GPT)
    ↓
Exporter (YAML/JSON/n8n)
    ↓
Optional: Dry Run (Simulation)
    ↓
Deployment (Skynet/n8n/Export)
    ↓
Version Control & Backup
```

### Validation Flow

```
Agent Config
    ↓
Structure Validator
    ├─> Check nodes
    ├─> Check connections
    ├─> Check cycles
    └─> Check logic
    ↓
AI Validator (Optional)
    ├─> Send to Claude/GPT
    ├─> Parse suggestions
    ├─> Apply improvements
    └─> Re-validate
    ↓
Final Config
```

### Dry Run Flow

```
Agent Config + Test Input
    ↓
Dry Runner Setup
    ├─> Mock triggers
    ├─> Mock AI responses
    ├─> Mock external services
    └─> Setup logging
    ↓
Execution Simulation
    ├─> Step 1: Trigger
    ├─> Step 2: Input processing
    ├─> Step 3: AI call (mocked)
    ├─> Step 4: Action execution (logged)
    └─> Step 5: Output generation
    ↓
Execution Report
    ├─> Performance metrics
    ├─> Error detection
    ├─> Resource usage
    └─> Optimization suggestions
```

---

## 📋 **AGENT SCHEMA**

### Canvas Data Structure (Internal)

```json
{
  "version": "1.0.0",
  "metadata": {
    "name": "Agent Name",
    "description": "Agent description",
    "author": "Creator",
    "created": "2025-11-19",
    "modified": "2025-11-19"
  },
  "nodes": [
    {
      "id": "node_1",
      "type": "agent_core",
      "model": "claude-sonnet-4",
      "position": {"x": 100, "y": 100},
      "config": {
        "role": "Assistant",
        "temperature": 0.7,
        "max_tokens": 4096
      }
    },
    {
      "id": "node_2",
      "type": "trigger_cron",
      "position": {"x": 300, "y": 100},
      "config": {
        "schedule": "0 9 * * *",
        "timezone": "UTC"
      }
    }
  ],
  "connections": [
    {
      "id": "conn_1",
      "from": "node_2",
      "to": "node_1",
      "type": "trigger"
    }
  ],
  "settings": {
    "autosave": true,
    "theme": "dark"
  }
}
```

### Exported YAML Structure (Skynet Compatible)

```yaml
name: agent_name
version: 1.0.0
model: claude-sonnet-4

memory:
  type: persistent
  path: ./memory/agent_name.json

triggers:
  - type: cron
    schedule: "0 9 * * *"
    timezone: UTC

inputs:
  - type: folder_watch
    path: ./inbox
    patterns: ["*.txt", "*.md"]

processing:
  role: "You are a helpful assistant..."
  temperature: 0.7
  max_tokens: 4096

cycles:
  - name: daily_check
    trigger: cron_morning
    steps:
      - check_inbox
      - process_files
      - generate_summary
      - send_report

outputs:
  - type: drive
    path: ./reports
  - type: log
    level: info
```

### Exported JSON Structure (Generic)

```json
{
  "name": "agent_name",
  "version": "1.0.0",
  "model": "claude-sonnet-4",
  "memory": {
    "type": "persistent",
    "path": "./memory/agent_name.json"
  },
  "triggers": [
    {
      "type": "cron",
      "schedule": "0 9 * * *"
    }
  ],
  "inputs": [
    {
      "type": "folder_watch",
      "path": "./inbox"
    }
  ],
  "outputs": [
    {
      "type": "drive",
      "path": "./reports"
    }
  ]
}
```

---

## 🧪 **TESTING STRATEGY**

### Unit Tests
- Canvas engine operations
- Node connection validation
- Export format validation
- AI prompt generation

### Integration Tests
- Full agent creation flow
- Export → Import round-trip
- Dry run accuracy
- AI validation integration

### E2E Tests
- Create agent → Export → Deploy
- Simulate agent execution
- Version control operations
- Multi-model support

---

## 🔐 **SECURITY CONSIDERATIONS**

1. **AI Validation**: Never send credentials or sensitive data to AI validators
2. **Sandboxed Dry Run**: All simulations run in isolated environment
3. **Export Sanitization**: Strip sensitive data from exports
4. **Access Control**: Implement user permissions for deployment
5. **Audit Logging**: Track all agent creations and modifications

---

## 🚀 **DEPLOYMENT TARGETS**

### Skynet Core
- Direct YAML export to `/agents/` directory
- Automatic validation
- Version control integration

### n8n
- Workflow JSON export
- Node mapping (Skynet → n8n)
- Credential management

### Standalone
- Portable agent packages
- Docker container export
- CLI-ready configs

---

## 📈 **FUTURE ENHANCEMENTS**

### Phase 2
- [ ] Multi-agent orchestration
- [ ] Visual debugger
- [ ] Performance profiling
- [ ] Agent marketplace

### Phase 3
- [ ] Collaborative editing
- [ ] Cloud sync
- [ ] Template library
- [ ] Auto-optimization AI

### Phase 4
- [ ] Natural language agent creation
- [ ] Agent analytics dashboard
- [ ] Cross-platform mobile app
- [ ] Agent version diffing

---

## 🛠️ **TECH STACK**

**Frontend**:
- Electron 28+
- Vanilla JS (no framework bloat)
- Canvas API for node rendering
- CSS Grid + Flexbox

**Backend**:
- Node.js 20+
- Express.js
- YAML parser (js-yaml)
- JSON Schema validation

**MCP Layer**:
- MCP SDK
- Anthropic Claude API
- OpenAI GPT API
- Google Gemini API

**Python Tools**:
- Python 3.11+
- PyYAML
- JSON validation
- Unit testing framework

---

## 📊 **PERFORMANCE TARGETS**

- Canvas rendering: < 16ms per frame (60 FPS)
- Node creation: < 50ms
- Export generation: < 200ms
- Dry run simulation: < 2s for typical agent
- AI validation: < 5s (dependent on API)

---

## 🔧 **CONFIGURATION**

### Default Paths
```
/mcp_forge/data/agents_preview/    - Dry run outputs
/mcp_forge/data/exports/            - Exported agents
/agents/                             - Skynet Core agents
~/.skynet/mcp_forge/                - User config
```

### Environment Variables
```
MCP_FORGE_PORT=3000
CLAUDE_API_KEY=xxx
OPENAI_API_KEY=xxx
GEMINI_API_KEY=xxx
SKYNET_AGENTS_PATH=/agents/
N8N_API_URL=http://localhost:5678
```

---

## 📝 **NOTES**

- Dark mode is default and mandatory (Skynet aesthetic)
- All AI interactions are logged but sanitized
- Canvas auto-saves every 30 seconds
- Maximum 100 nodes per canvas (performance limit)
- Export formats are backward-compatible
- Python tools are optional but recommended

---

**End of Architecture Document**

Generated by Claude Code 4.5
For: Skynet OS — MCP Forge Project
Date: 2025-11-19
