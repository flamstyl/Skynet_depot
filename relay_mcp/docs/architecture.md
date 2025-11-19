# 📡 RelayMCP - Architecture Documentation

## 🎯 Vision

**RelayMCP** is Skynet's internal neural communication bus - a centralized message relay system enabling seamless coordination between multiple local AI agents (Claude CLI, GPT, Gemini, Perplexity, etc.) without relying on external backends.

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      AI AGENTS LAYER                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Claude  │  │   GPT    │  │  Gemini  │  │Perplexity│   │
│  │   CLI    │  │  Local   │  │   CLI    │  │  Bridge  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                         ▼
        ┌────────────────────────────────────────┐
        │       FastAPI REST Interface           │
        │    POST /mcp/send   GET /mcp/stats     │
        └────────────┬───────────────────────────┘
                     ▼
        ┌────────────────────────────────────────┐
        │         RELAY SERVER CORE              │
        │  ┌──────────────────────────────────┐  │
        │  │      Message Bus Engine          │  │
        │  │  - Routing                       │  │
        │  │  - Validation                    │  │
        │  │  - Queuing                       │  │
        │  └──────────────────────────────────┘  │
        │  ┌──────────────────────────────────┐  │
        │  │      Buffer Manager              │  │
        │  │  - Circular buffer (in-memory)   │  │
        │  │  - TTL management                │  │
        │  │  - Drop policies                 │  │
        │  └──────────────────────────────────┘  │
        │  ┌──────────────────────────────────┐  │
        │  │      Persistence Layer           │  │
        │  │  - SQLite (buffer.db)            │  │
        │  │  - JSONL logs (traffic)          │  │
        │  └──────────────────────────────────┘  │
        └────────────┬───────────────────────────┘
                     │
        ┌────────────┴───────────────────────────┐
        │                                        │
        ▼                                        ▼
┌───────────────────┐                  ┌─────────────────┐
│ Flask Dashboard   │                  │  File System    │
│  - Live stats     │                  │  - Logs         │
│  - Traffic viz    │                  │  - Snapshots    │
│  - Connection map │                  │  - Persistence  │
└───────────────────┘                  └─────────────────┘
```

---

## 🧩 Core Components

### 1. **MCP Protocol (`protocol_mcp.py`)**

The Message Communication Protocol defines standardized message formats.

#### Request Format:
```json
{
  "key": "unique_message_id",
  "from": "sender_ai_key",
  "to": "target_ai_key",
  "type": "request",
  "payload": {
    "content": "Message content or question",
    "context": {
      "conversation_id": "optional",
      "priority": "normal|high|critical"
    }
  },
  "metadata": {
    "timestamp": "ISO8601",
    "priority": "normal",
    "ttl": 3600
  }
}
```

#### Response Format:
```json
{
  "key": "same_message_id",
  "status": "ok|error|timeout",
  "response": {
    "content": "AI response content",
    "tokens_used": 1234,
    "model": "claude-sonnet-4.5"
  },
  "meta": {
    "latency_ms": 200,
    "timestamp": "ISO8601",
    "connector": "claude_cli"
  }
}
```

**Functions:**
- `build_request()` - Construct valid MCP request
- `build_response()` - Construct valid MCP response
- `validate_message()` - Validate message structure
- `parse_message()` - Parse incoming message

---

### 2. **Message Bus (`message_bus.py`)**

Central routing and queuing system.

**Responsibilities:**
- Enqueue incoming messages
- Route messages based on `to` field
- Dequeue messages for specific targets
- Maintain in-transit message queue
- Track message lifecycle (pending → processing → completed)
- Provide real-time statistics

**Key Functions:**
- `enqueue(message: dict) -> bool` - Add message to bus
- `dequeue_for(target_key: str) -> dict` - Get next message for target
- `route_message(message: dict)` - Route to appropriate connector
- `get_stats() -> dict` - Return bus statistics
- `get_active_connections() -> list` - List active AI connectors

**Data Structures:**
- `pending_queue: asyncio.Queue` - Messages awaiting processing
- `in_transit: dict` - Messages currently being processed
- `completed: collections.deque` - Recently completed messages (circular)

---

### 3. **Buffer Manager (`buffer_manager.py`)**

Manages the circular memory buffer for message history.

**Features:**
- Circular buffer with configurable size (default: 10,000 messages)
- TTL-based expiration
- Drop policies: `oldest_first`, `lowest_priority`
- Memory-efficient storage
- Fast query by time range or AI key

**Configuration:**
```yaml
buffer:
  max_size: 10000
  ttl_seconds: 86400  # 24 hours
  drop_policy: "oldest_first"
  persist_interval: 300  # 5 minutes
```

---

### 4. **Persistence Layer (`persistence.py`)**

Handles durable storage for messages and state.

**Storage Backends:**

1. **SQLite (`buffer.db`)**
   - Schema:
     ```sql
     CREATE TABLE messages (
       key TEXT PRIMARY KEY,
       from_ai TEXT,
       to_ai TEXT,
       type TEXT,
       payload TEXT,
       status TEXT,
       created_at TIMESTAMP,
       completed_at TIMESTAMP,
       metadata TEXT
     );

     CREATE INDEX idx_created_at ON messages(created_at);
     CREATE INDEX idx_from_to ON messages(from_ai, to_ai);
     ```

2. **JSONL Logs (`data/logs/mcp_traffic.jsonl`)**
   - One message per line
   - Append-only
   - Easy to parse with streaming tools

**Functions:**
- `save_message(message: dict)`
- `load_recent(limit: int)`
- `query_by_timerange(start, end)`
- `snapshot_buffer()` - Create point-in-time snapshot

---

### 5. **IA Connectors (`ia_connectors/`)**

Each connector implements the `IAConnector` interface to communicate with a specific AI.

**Base Interface:**
```python
class IAConnector:
    def __init__(self, config: dict):
        pass

    async def send(self, payload: dict) -> dict:
        """Send message to AI and return response"""
        raise NotImplementedError

    async def health_check(self) -> bool:
        """Check if connector is healthy"""
        raise NotImplementedError
```

**Implementations:**

1. **`claude_cli.py`**
   - Uses `subprocess` to call Claude CLI
   - Streams responses
   - Handles token limits

2. **`gpt_local.py`**
   - Supports OpenAI API (local or remote)
   - Or wraps a local GPT CLI

3. **`gemini_cli.py`**
   - Calls Gemini CLI
   - Handles Google-specific formats

4. **`perplexity_bridge.py`**
   - File watcher pattern (drop-in/outbox)
   - Or HTTP bridge if available

---

### 6. **Relay Server (`relay_server.py`)**

The main runtime orchestrator.

**Lifecycle:**
```
1. Load config
2. Initialize persistence layer
3. Create message bus
4. Register IA connectors
5. Start FastAPI server
6. Enter main event loop:
   - Poll incoming messages
   - Route via message bus
   - Call appropriate connector
   - Store response
   - Update stats
   - Log to JSONL
```

**Main Loop (Async):**
```python
async def process_messages():
    while True:
        message = await message_bus.dequeue()
        connector = get_connector(message['to'])
        response = await connector.send(message['payload'])
        await message_bus.complete(message['key'], response)
        await persistence.save_message(message, response)
        await logger.log_traffic(message, response)
```

---

### 7. **FastAPI Layer (`api/fastapi_app.py`)**

REST interface for external interaction.

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mcp/send` | Send MCP message |
| GET | `/mcp/stats` | Get bus statistics |
| GET | `/mcp/buffer` | Get buffer contents |
| GET | `/mcp/logs/recent` | Get recent traffic |
| GET | `/mcp/connections` | List active AI connections |
| GET | `/health` | Health check |

**Example Usage:**
```bash
curl -X POST http://localhost:8000/mcp/send \
  -H "Content-Type: application/json" \
  -d '{
    "from": "gemini",
    "to": "claude",
    "payload": {
      "content": "Analyze this error log...",
      "context": {"priority": "high"}
    }
  }'
```

---

### 8. **Dashboard (`dashboard/app.py`)**

Flask-based web UI for monitoring.

**Features:**
- Real-time traffic visualization
- Connection graph (who talks to whom)
- Message volume statistics
- Latency graphs
- Recent message log
- Buffer utilization

**Auto-refresh:**
- JavaScript polls `/mcp/stats` every 5 seconds
- Updates charts and tables dynamically

**Panels:**
1. **Connection Map** - Graph showing AI interconnections
2. **Traffic Stats** - Messages/min, avg latency, errors
3. **Recent Messages** - Last 50 messages with details
4. **Buffer Status** - Utilization, TTL warnings

---

## 🔁 Message Flow Example

### Scenario: Gemini asks Claude to analyze a log

1. **Gemini CLI** sends request:
   ```bash
   curl -X POST http://localhost:8000/mcp/send -d '{
     "from": "gemini",
     "to": "claude",
     "payload": {"content": "Analyze this error: NullPointerException..."}
   }'
   ```

2. **FastAPI** receives request, assigns message key

3. **Message Bus** validates and enqueues message

4. **Relay Server** dequeues and routes to `claude_cli` connector

5. **Claude Connector** executes:
   ```bash
   echo "Analyze this error: NullPointerException..." | claude
   ```

6. **Response** captured and formatted:
   ```json
   {
     "status": "ok",
     "response": {
       "content": "This is a null pointer error caused by...",
       "tokens_used": 450
     },
     "meta": {"latency_ms": 1200}
   }
   ```

7. **Persistence** saves to `buffer.db` and `mcp_traffic.jsonl`

8. **Dashboard** updates in real-time showing new exchange

---

## 🔒 Security & Isolation

- **No external network calls** by default
- All AI interactions via local CLI/API
- Configurable allowlist for AI keys
- Rate limiting per connector
- Message size limits
- Sanitization of payloads

---

## 📊 Monitoring & Observability

### Metrics Tracked:
- Total messages processed
- Messages per minute (per AI, total)
- Average latency per connector
- Error rate
- Buffer utilization
- Active connections

### Logs:
- `relay.log` - Application logs (startup, errors, warnings)
- `mcp_traffic.jsonl` - All MCP messages (structured)
- `snapshots/` - Periodic buffer snapshots

---

## 🚀 Deployment

### As Python Script:
```bash
python relay_mcp/core/relay_server.py
```

### As Windows Service (Future):
```bash
nssm install RelayMCP python.exe relay_server.py
```

### Docker (Future):
```bash
docker run -p 8000:8000 skynet/relay-mcp
```

---

## 🔮 Future Enhancements

1. **Consensus Engine** - Multi-AI voting/consensus on responses
2. **Orchestrator Layer** - Complex multi-step AI workflows
3. **Debate System** - AI jury deliberation
4. **Semantic Search** - Query historical messages by meaning
5. **WebSocket Support** - Real-time streaming
6. **Plugin System** - Custom connectors via plugins
7. **Distributed Mode** - Multi-node relay network

---

## 📚 Configuration Reference

See `core/config.yaml` for full configuration options.

**Key Settings:**
- `server.host` / `server.port` - API binding
- `buffer.max_size` - Circular buffer size
- `connectors.*` - Per-connector settings
- `logging.level` - Log verbosity
- `dashboard.enabled` - Enable/disable dashboard

---

## 🛠️ Development

### Adding a New Connector:

1. Create `ia_connectors/myai_connector.py`
2. Implement `IAConnector` interface
3. Register in `relay_server.py`
4. Add config to `config.yaml`

### Testing:

```bash
pytest tests/ -v
```

---

**RelayMCP: The neural backbone of Skynet's distributed intelligence.**
