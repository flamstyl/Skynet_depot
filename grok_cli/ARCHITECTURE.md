# 🏗️ Grok CLI - Architecture Documentation

Complete technical architecture of Grok CLI v2.0.0 PRO (Option 2 + 3)

---

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACES                         │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  CLI (Typer) │ Dashboard    │ REST API     │ MCP Protocol   │
│  Interactive │ (Streamlit)  │ (FastAPI)    │ (Node.js)      │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       │         CORE MODULES                  │
       ├───────────────────────────────────────┤
       │  • ProjectAnalyzer                    │
       │  • CommandExecutor                    │
       │  • CodeGenerator                      │
       │  • MemorySystem                       │
       │  • DiagnosticEngine                   │
       └───────────────┬───────────────────────┘
                       │
       ┌───────────────┴───────────────────────┐
       │      ADVANCED SYSTEMS                 │
       ├───────────────────────────────────────┤
       │  RAG System      │  Docker Sandbox    │
       │  • VectorStore   │  • Security        │
       │  • Embeddings    │  • Isolation       │
       │  • Retriever     │  • Resource Limits │
       └───────────────────────────────────────┘
```

---

## 🔧 Core Modules

### 1. ProjectAnalyzer (`core/analyzer.py`)

**Purpose**: Deep analysis of project structure and codebase

**Capabilities**:
- Recursive directory scanning (respects .gitignore patterns)
- Language detection (Python, JavaScript, Go, Rust, etc.)
- Dependency extraction (npm, pip, go.mod, etc.)
- Entry point identification
- Config file discovery
- Framework detection (React, Vue, Next.js, etc.)

**Key Methods**:
```python
async def analyze_full_project() -> Dict
    - Returns complete project metadata
    - Includes structure, languages, dependencies, entry points

def _detect_project_types() -> List[str]
    - Detects project type from indicator files

def _find_entry_points() -> List[str]
    - Identifies main execution files
```

**Output Format**:
```python
{
    "name": str,
    "path": str,
    "file_count": int,
    "languages": Dict[str, int],
    "types": List[str],
    "dependencies": Dict,
    "entry_points": List[str],
    "config_files": List[str]
}
```

---

### 2. CommandExecutor (`core/executor.py`)

**Purpose**: Safe shell command execution with sandbox support

**Security Features**:
- Blacklist of dangerous commands (`rm -rf /`, `mkfs`, etc.)
- Confirmation required for destructive operations
- Timeout protection (default 5 minutes)
- Execution history and audit log
- Optional Docker sandbox isolation

**Execution Modes**:

1. **Direct Execution** (Host System)
   - Fast, no overhead
   - Uses `asyncio.create_subprocess_shell`
   - stdout/stderr capture

2. **Sandboxed Execution** (Docker)
   - Secure, isolated
   - Resource limits (CPU, memory)
   - Security hardening
   - Volume mounting for workspace

**Key Methods**:
```python
async def execute_shell(
    command: str,
    cwd: Optional[Path] = None,
    use_sandbox: Optional[bool] = None
) -> ExecutionResult

async def execute_multiple(
    commands: List[str],
    sequential: bool = False
) -> List[ExecutionResult]
```

---

### 3. CodeGenerator (`core/generator.py`)

**Purpose**: AI-powered code generation and fixing

**LLM Integration**:
- Supports OpenAI (GPT-4, GPT-3.5)
- Supports Anthropic (Claude)
- Extensible for other providers

**Capabilities**:
- Generate code from natural language
- Fix code based on error messages
- Refactor code for improvements
- Multi-language support

**Key Methods**:
```python
async def generate_code(
    description: str,
    language: str = "python",
    context: Optional[str] = None
) -> GeneratedCode

async def fix_code(
    code: str,
    error: str,
    language: str = "python"
) -> GeneratedCode

async def refactor_code(
    code: str,
    language: str = "python",
    goal: str = "improve readability"
) -> GeneratedCode
```

---

### 4. MemorySystem (`core/memory.py`)

**Purpose**: Dual-layer memory for context retention

**Architecture**:

```
┌─────────────────────────────────────┐
│      SHORT-TERM MEMORY              │
│  (Recent 50 operations)             │
│  • Deque (FIFO)                     │
│  • In-memory only                   │
│  • Fast access                      │
└─────────────────────────────────────┘
                 │
┌─────────────────────────────────────┐
│      LONG-TERM MEMORY               │
│  (Persistent storage)               │
│  • JSON file storage                │
│  • Categorized entries              │
│  • Searchable                       │
└─────────────────────────────────────┘
```

**Storage Format**:
```python
MemoryEntry {
    key: str
    value: Any
    timestamp: datetime
    category: str
    metadata: Dict
}
```

**Key Methods**:
```python
def store_short_term(key: str, value: Any)
def store_long_term(key: str, value: Any)
def search_memory(query: str) -> List[MemoryEntry]
def get_statistics() -> Dict
```

---

### 5. DiagnosticEngine (`core/diagnostics.py`)

**Purpose**: Automated testing and error detection

**Supported Test Frameworks**:
- Python: pytest
- JavaScript: Jest, npm test
- Go: go test
- (Extensible for more)

**Features**:
- Auto-detection of test frameworks
- Parallel test execution
- Result parsing and visualization
- Failure extraction
- Auto-fix suggestions (future)

**Output Format**:
```python
TestResult {
    test_suite: str
    total: int
    passed: int
    failed: int
    skipped: int
    duration: float
    failures: List[Dict]
}
```

---

## 🧠 RAG System

### Architecture

```
┌──────────────────────────────────────┐
│     RAG PIPELINE                     │
├──────────────────────────────────────┤
│  1. Document Chunking                │
│     ↓                                │
│  2. Embedding Generation             │
│     ↓                                │
│  3. Vector Storage (ChromaDB)        │
│     ↓                                │
│  4. Similarity Search                │
│     ↓                                │
│  5. Context Retrieval                │
└──────────────────────────────────────┘
```

### Components

**1. VectorStore** (`rag/vectorstore.py`)
- Backend: ChromaDB (persistent)
- Automatic project indexing
- Semantic search
- Metadata filtering

**2. EmbeddingEngine** (`rag/embeddings.py`)
- Model: sentence-transformers/all-MiniLM-L6-v2
- Dimension: 384
- Fast inference (~10ms per doc)

**3. ContextRetriever** (`rag/retriever.py`)
- Top-K retrieval
- Similarity threshold filtering
- Context formatting for LLMs

---

## 🐳 Docker Sandbox

### Security Model

```
┌─────────────────────────────────────────┐
│         HOST SYSTEM                     │
│  ┌───────────────────────────────────┐  │
│  │    DOCKER CONTAINER (grok-sandbox)│  │
│  │                                   │  │
│  │  • Non-root user (uid 1000)       │  │
│  │  • Resource limits (2GB RAM, 2CPU)│  │
│  │  • Dropped capabilities           │  │
│  │  • No new privileges              │  │
│  │  • Network isolation (bridge)     │  │
│  │  • Volume mounts (workspace)      │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Security Features

1. **User Isolation**
   - Commands run as `grok` user (non-root)
   - UID 1000 for compatibility

2. **Resource Limits**
   - Memory: 2GB max
   - CPU: 2 cores max
   - Prevents resource exhaustion

3. **Capability Management**
   - Drop: ALL capabilities
   - Add: NET_BIND_SERVICE (if needed)
   - Minimal attack surface

4. **Security Options**
   - `no-new-privileges:true`
   - Read-only root (optional)
   - AppArmor/SELinux compatible

---

## 🔌 MCP Integration

### Protocol Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   MCP       │  stdio  │    MCP      │  HTTP   │  FastAPI    │
│   Client    │◄───────►│   Server    │◄───────►│  Backend    │
│  (Claude)   │         │  (Node.js)  │         │  (Python)   │
└─────────────┘         └─────────────┘         └─────────────┘
```

### Exposed Tools

1. **analyze_project** - Project analysis
2. **execute_command** - Shell execution
3. **generate_code** - Code generation
4. **fix_code** - Code fixing
5. **run_tests** - Test execution
6. **search_memory** - Memory search
7. **search_project** - RAG search
8. **get_diagnostics** - System diagnostics

### Communication

- **Transport**: stdio (stdin/stdout)
- **Protocol**: JSON-RPC 2.0
- **SDK**: @modelcontextprotocol/sdk

---

## 🌐 REST API

### Architecture

```
┌─────────────────────────────────────┐
│      FastAPI Application            │
├─────────────────────────────────────┤
│  • CORS Middleware                  │
│  • Async Request Handlers           │
│  • Lazy Component Loading           │
│  • Pydantic Validation              │
│  • Swagger/OpenAPI Docs             │
└─────────────────────────────────────┘
```

### Endpoints

```
GET  /              - API info
GET  /health        - Health check
POST /analyze       - Analyze project
POST /execute       - Execute command
POST /generate      - Generate code
POST /fix           - Fix code
POST /test          - Run tests
POST /search        - RAG search
POST /memory/search - Memory search
GET  /memory/stats  - Memory stats
POST /diagnostics   - Get diagnostics
```

### Request/Response

All use **Pydantic models** for validation:

```python
# Example: Execute Command
class ExecuteRequest(BaseModel):
    command: str
    use_sandbox: bool = True
    working_dir: Optional[str] = None

class ExecuteResponse(BaseModel):
    command: str
    stdout: str
    stderr: str
    returncode: int
    duration: float
    success: bool
```

---

## 📊 Dashboard

### Technology

- **Framework**: Streamlit
- **Update Interval**: 2 seconds (configurable)
- **Pages**: 7 functional pages

### Pages

1. **Overview** - System metrics and recent activity
2. **Project Analysis** - Project structure visualization
3. **Memory System** - Memory search and stats
4. **Command Executor** - Interactive command execution
5. **Code Generator** - AI code generation interface
6. **Test Results** - Test execution and results
7. **Docker Sandbox** - Sandbox management

---

## 🔄 Data Flow

### Example: Code Generation Request

```
1. User makes request
   CLI: "Generate a Flask API"
   OR
   API: POST /generate {"description": "Flask API"}
   OR
   MCP: call_tool("generate_code", {...})

2. Request reaches CodeGenerator
   - Load system prompt
   - Search RAG for context (optional)
   - Retrieve recent memory

3. LLM API call
   - OpenAI or Anthropic
   - System prompt + context + request
   - Temperature, max_tokens applied

4. Response parsing
   - Extract code block
   - Extract explanation
   - Validate result

5. Response delivery
   - CLI: Rich formatted display
   - API: JSON response
   - MCP: Tool result with markdown

6. Memory storage
   - Short-term: "Generated Flask API"
   - Long-term: Code stored for future reference
```

---

## 📁 File Structure

```
grok_cli/
├── core/                    # Core business logic
│   ├── analyzer.py         # Project analysis
│   ├── executor.py         # Command execution
│   ├── generator.py        # AI code generation
│   ├── memory.py           # Memory system
│   └── diagnostics.py      # Testing & diagnostics
│
├── rag/                     # RAG system
│   ├── vectorstore.py      # ChromaDB wrapper
│   ├── embeddings.py       # Sentence transformers
│   └── retriever.py        # Context retrieval
│
├── docker/                  # Docker sandbox
│   ├── Dockerfile.sandbox  # Container definition
│   ├── docker-compose.yml  # Composition
│   └── security.py         # Security manager
│
├── mcp/                     # MCP server
│   ├── server.js           # Main server
│   ├── config.mcp.json     # Tool configuration
│   └── package.json        # Dependencies
│
├── api/                     # REST API
│   ├── server.py           # FastAPI app
│   └── routes/             # Route modules
│
├── dashboard/               # Streamlit dashboard
│   ├── app.py              # Main app
│   └── components/         # UI components
│
├── config/                  # Configuration
│   └── default_config.yaml # Default settings
│
├── prompts/                 # System prompts
│   └── system_prompt.md    # Main prompt
│
├── tests/                   # Unit tests
│   ├── test_analyzer.py
│   └── test_memory.py
│
├── cli.py                   # CLI entry point
├── grok.py                  # Launcher wrapper
└── requirements.txt         # Python deps
```

---

## 🔐 Security Considerations

### 1. Command Execution
- ✅ Blacklist dangerous commands
- ✅ User confirmation for destructive ops
- ✅ Timeout protection
- ✅ Sandboxed execution option

### 2. Docker Sandbox
- ✅ Non-root user
- ✅ Resource limits
- ✅ Capability dropping
- ✅ Network isolation

### 3. API Security
- ⚠️ No authentication by default (localhost only)
- ✅ CORS configured
- ✅ Input validation (Pydantic)
- 📝 TODO: Add API key authentication

### 4. Data Security
- ✅ Local storage only
- ✅ No data sent to external services (except LLM APIs)
- ✅ API keys via environment variables

---

## 🚀 Performance

### Benchmarks (Approximate)

| Operation | Time | Notes |
|-----------|------|-------|
| Project analysis (medium) | 1-3s | ~500 files |
| Direct command | <100ms | Native execution |
| Sandbox command | 1-3s | Docker overhead |
| Code generation | 2-10s | Depends on LLM |
| RAG search | <100ms | After indexing |
| Memory search | <10ms | In-memory |

### Optimization Tips

1. **Disable RAG** if not needed (faster startup)
2. **Use direct execution** for safe commands
3. **Cache embeddings** for repeated searches
4. **Limit project scan depth** for large codebases

---

## 🔮 Future Enhancements

### Planned Features

- [ ] Multi-project workspace support
- [ ] Git integration (auto-commit, PR creation)
- [ ] Plugin system
- [ ] Voice control
- [ ] Multi-agent collaboration
- [ ] Cloud deployment
- [ ] Advanced code review
- [ ] Real-time pair programming

---

**This architecture supports the complete Grok CLI PRO system combining Option 2 (PRO features) and Option 3 (MCP integration).**
