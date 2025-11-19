# Redis Namespaces Documentation

This document describes the Redis key namespaces used by Skynet Linker CLI.

## Overview

All data is stored in Redis using namespaced keys for organization and collision avoidance.

## Namespace Structure

### 1. `context:<agent_id>` (Hash)

Stores the current working context for an agent.

**Key Pattern:** `context:claude_cli`, `context:gemini`, etc.

**Fields:**
- `global_summary` - Current task summary
- `last_intent` - Last user intent
- `shared_knowledge` - Shared knowledge dictionary (JSON)
- `agent_type` - Type of agent
- `_updated_at` - Last update timestamp (ISO 8601)
- `_agent_id` - Agent identifier
- Custom fields based on agent type

**Example:**
```redis
HGETALL context:claude_cli

1) "global_summary"
2) "Analyzing RAG papers for research report"
3) "last_intent"
4) "Research latest RAG developments"
5) "agent_type"
6) "planner"
7) "_updated_at"
8) "2025-11-19T12:34:56.789Z"
9) "_agent_id"
10) "claude_cli"
```

**TTL:** None (persistent until deleted)

---

### 2. `session:<session_id>` (Hash)

Stores session state for multi-agent collaborations.

**Key Pattern:** `session:650e8400-e29b-41d4-a716-446655440001`

**Fields:**
- `session_id` - Session UUID
- `created_at` - Creation timestamp
- `status` - Session status (active | paused | completed)
- `participants` - JSON array of agent IDs
- `metadata` - JSON metadata (goal, tags, etc.)
- `message_count` - Total messages in session
- `updated_at` - Last update timestamp
- `closed_at` - Completion timestamp (if closed)

**Example:**
```redis
HGETALL session:650e8400-e29b-41d4-a716-446655440001

1) "session_id"
2) "650e8400-e29b-41d4-a716-446655440001"
3) "created_at"
4) "2025-11-19T10:00:00Z"
5) "status"
6) "active"
7) "participants"
8) "[\"claude_cli\", \"gemini\"]"
9) "metadata"
10) "{\"goal\": \"Research RAG papers\", \"tags\": [\"research\"]}"
11) "message_count"
12) "42"
```

**TTL:** None (persistent)

---

### 3. `history:<agent_id>` (List)

Stores message history for an agent (FIFO queue).

**Key Pattern:** `history:claude_cli`

**Structure:** List of JSON-encoded MCP messages

**Max Size:** 1000 messages (configurable)

**Example:**
```redis
LRANGE history:claude_cli 0 2

1) "{\"id\": \"msg-001\", \"from_agent\": \"claude_cli\", \"to_agent\": \"gemini\", ...}"
2) "{\"id\": \"msg-002\", \"from_agent\": \"gemini\", \"to_agent\": \"claude_cli\", ...}"
3) "{\"id\": \"msg-003\", \"from_agent\": \"claude_cli\", \"to_agent\": \"gpt4\", ...}"
```

**Operations:**
- `RPUSH` - Append new message
- `LTRIM` - Keep only last N messages
- `LRANGE` - Get recent messages

**TTL:** None (persistent)

---

### 4. `presence:<agent_id>` (String)

Tracks agent online/offline status with auto-expiry.

**Key Pattern:** `presence:claude_cli`

**Value:** `online` | `offline`

**TTL:** 60 seconds (refreshed by heartbeat)

**Example:**
```redis
GET presence:claude_cli
> "online"

TTL presence:claude_cli
> 45
```

**Behavior:**
- Set to `online` when agent connects
- Refreshed every 30 seconds via heartbeat
- Auto-expires to indicate offline if not refreshed

---

### 5. `channel:<channel_name>` (PubSub)

Redis Pub/Sub channels for broadcast messages.

**Key Pattern:** `channel:skynet_core`, `channel:default`

**Not stored** - ephemeral pub/sub only

**Operations:**
```redis
PUBLISH channel:skynet_core "{\"type\": \"broadcast\", ...}"
SUBSCRIBE channel:skynet_core
```

---

### 6. `snapshot:<timestamp>` (String)

Full server state snapshots for backup.

**Key Pattern:** `snapshot:2025-11-19T12:34:56.789Z`

**Value:** JSON-encoded full state snapshot

**Max Count:** 10 snapshots (oldest deleted)

**Example:**
```redis
GET snapshot:2025-11-19T12:34:56.789Z

{
  "timestamp": "2025-11-19T12:34:56.789Z",
  "version": "1.0",
  "server_state": {...},
  "routing_state": {...},
  "storage_state": {...}
}
```

**TTL:** None (manual cleanup)

---

### 7. `__global__` Context (Hash)

Special context shared by all agents.

**Key Pattern:** `context:__global__`

**Fields:**
- `global_summary` - Global task summary
- `last_user_intent` - Last user request
- `shared_knowledge` - Shared knowledge base (JSON)
- `_updated_at` - Last update timestamp

**Example:**
```redis
HGETALL context:__global__

1) "global_summary"
2) "Multi-agent research on RAG"
3) "last_user_intent"
4) "Find latest RAG papers and summarize"
5) "shared_knowledge"
6) "{\"fact1\": \"RAG combines retrieval with generation\", ...}"
```

---

## Key Patterns Summary

| Namespace | Type | TTL | Max Size | Purpose |
|-----------|------|-----|----------|---------|
| `context:<agent_id>` | Hash | None | N/A | Agent working context |
| `session:<session_id>` | Hash | None | N/A | Collaboration session state |
| `history:<agent_id>` | List | None | 1000 | Message history (FIFO) |
| `presence:<agent_id>` | String | 60s | N/A | Online/offline status |
| `channel:<name>` | PubSub | N/A | N/A | Broadcast channels |
| `snapshot:<timestamp>` | String | None | N/A | State snapshots |
| `context:__global__` | Hash | None | N/A | Global shared context |

---

## Data Access Patterns

### 1. Agent Connects
```redis
# Set presence
SETEX presence:claude_cli 60 "online"

# Initialize context if not exists
HSETNX context:claude_cli "agent_type" "planner"
HSETNX context:claude_cli "created_at" "2025-11-19T12:00:00Z"
```

### 2. Send Message
```redis
# Store in sender history
RPUSH history:claude_cli "{...message JSON...}"
LTRIM history:claude_cli -1000 -1

# Store in recipient history
RPUSH history:gemini "{...message JSON...}"
LTRIM history:gemini -1000 -1
```

### 3. Update Context
```redis
# Merge update
HSET context:claude_cli "global_summary" "New summary"
HSET context:claude_cli "_updated_at" "2025-11-19T12:35:00Z"
```

### 4. Heartbeat
```redis
# Refresh presence
SETEX presence:claude_cli 60 "online"
```

### 5. Create Session
```redis
# Initialize session
HSET session:uuid "session_id" "uuid"
HSET session:uuid "created_at" "2025-11-19T10:00:00Z"
HSET session:uuid "status" "active"
HSET session:uuid "participants" "[\"claude_cli\", \"gemini\"]"
```

---

## Cleanup & Maintenance

### Manual Cleanup Commands

```bash
# Delete all agent contexts
redis-cli --scan --pattern "context:*" | xargs redis-cli DEL

# Delete all history
redis-cli --scan --pattern "history:*" | xargs redis-cli DEL

# Delete all sessions
redis-cli --scan --pattern "session:*" | xargs redis-cli DEL

# Delete all snapshots
redis-cli --scan --pattern "snapshot:*" | xargs redis-cli DEL

# Flush entire database (⚠️ DANGER)
redis-cli FLUSHDB
```

### Automated Cleanup

- **History**: Auto-trimmed to 1000 messages via `LTRIM`
- **Presence**: Auto-expires after 60 seconds
- **Snapshots**: Kept to max 10 (oldest deleted automatically)

---

## Memory Estimation

### Per Agent
- Context: ~1-10 KB
- History (1000 messages): ~1-10 MB
- Presence: ~100 bytes

### Per Session
- Session metadata: ~1-5 KB
- Message references: Included in agent histories

### Total Estimate
For 100 agents with full history:
- Contexts: ~1 MB
- Histories: ~1 GB
- Sessions: ~1 MB
- **Total: ~1 GB**

---

## Performance Considerations

### Optimal Operations
- Hash operations (HGET, HSET): O(1)
- List operations (RPUSH, LRANGE): O(N) where N = range
- Presence lookups: O(1)

### Avoid
- Full key scans (`KEYS *`) - use `SCAN` instead
- Large LRANGE operations - limit to 50-100 messages

### Indexing
- No secondary indexes in MVP
- Use predictable key patterns for direct lookups

---

## Backup Strategy

### Redis Persistence
Enable RDB snapshots in `redis.conf`:
```
save 900 1
save 300 10
save 60 10000
```

### Application Snapshots
Periodic snapshots to JSON files (every 30 minutes).

### Manual Export
```bash
# Dump entire database
redis-cli --rdb /backup/dump.rdb

# Or use SAVE command
redis-cli SAVE
cp /var/lib/redis/dump.rdb /backup/
```

---

## Migration Notes

### Schema Evolution
If namespace structure changes:
1. Create migration script
2. Read old keys → transform → write new keys
3. Verify migration
4. Delete old keys

### Versioning
Include version in snapshots for compatibility checking.

---

## Security

### Access Control
- Use Redis ACLs to restrict key access
- Different users for read vs write operations

### Encryption
- Enable Redis TLS in production
- Encrypt sensitive fields before storing
- Use `encryption.py` for payload encryption

---

## Monitoring Queries

```redis
# Total keys
DBSIZE

# Keys by pattern
SCAN 0 MATCH "context:*" COUNT 100

# Memory usage
INFO memory

# Active connections
CLIENT LIST

# Key sample
RANDOMKEY
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-19
**Skynet Linker CLI - Memory Layer**
