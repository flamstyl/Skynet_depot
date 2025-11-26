# Basic Flow Example - Claude ↔ Gemini Coordination

This example demonstrates a simple workflow where Claude (planner) coordinates with Gemini (researcher) to complete a research task.

## Scenario

**Goal:** Research the latest developments in RAG (Retrieval-Augmented Generation) and generate a summary.

**Participants:**
- **Claude (planner)**: Plans the task and coordinates the workflow
- **Gemini (researcher)**: Performs web research and gathers information

---

## Step-by-Step Workflow

### 1. Start Redis

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 2. Start MCP Server

```bash
cd skynet_linker_cli
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

Server should start on: `http://localhost:8000`

### 3. Connect Claude Agent (Terminal 1)

```bash
skynet-linker connect \
  --agent-id claude_cli \
  --type planner \
  --channels skynet_core,default \
  --priority 8
```

Expected output:
```
🔌 Connecting to MCP Server...
Server: ws://localhost:8000/ws
Agent ID: claude_cli
Type: planner
Channels: skynet_core,default
Priority: 8

✅ Connected successfully!

✅ Connected to MCP Server as claude_cli
Listening for messages...
Press Ctrl+C to disconnect
```

### 4. Connect Gemini Agent (Terminal 2)

```bash
skynet-linker connect \
  --agent-id gemini \
  --type researcher \
  --channels skynet_core,default \
  --priority 7
```

Expected output:
```
✅ Connected successfully!
Listening for messages...
```

### 5. Send Task from Claude to Gemini (Terminal 3)

```bash
skynet-linker send \
  --from claude_cli \
  --to gemini \
  --type task \
  --channel skynet_core \
  --content "Research the latest RAG (Retrieval-Augmented Generation) papers from 2025. Focus on improvements to retrieval quality and context integration."
```

Expected output:
```
📤 Sending message...
From: claude_cli
To: gemini
Type: task
Content: Research the latest RAG...

✅ Message sent successfully!
Message ID: 550e8400-e29b...
Recipients: gemini
```

### 6. Gemini Receives Task (Terminal 2)

You should see in Gemini's terminal:

```
📨 Message Received
From: claude_cli
To: gemini
Type: task
ID: 550e8400
Content:
Research the latest RAG (Retrieval-Augmented Generation) papers from 2025...
```

### 7. Gemini Sends Reply (Terminal 3)

```bash
skynet-linker send \
  --from gemini \
  --to claude_cli \
  --type reply \
  --content "Research complete! Found 10 recent RAG papers:

1. Enhanced RAG with Multi-Vector Retrieval (Jan 2025)
2. RAG-Fusion: Advanced Context Integration (Feb 2025)
3. Self-Improving RAG Systems (Mar 2025)
...

Key finding: Average accuracy improvement of 23% over baseline RAG."
```

### 8. Claude Receives Reply (Terminal 1)

Claude's terminal shows:

```
📨 Message Received
From: gemini
To: claude_cli
Type: reply
Content:
Research complete! Found 10 recent RAG papers...
```

### 9. Monitor All Messages (Terminal 4 - Optional)

```bash
skynet-linker monitor --channel skynet_core
```

Shows real-time message flow:

```
📊 Starting message monitor...
Channel: skynet_core
Listening for messages...

[12:34:56] claude_cli → gemini: task | Research the latest RAG...
[12:35:42] gemini → claude_cli: reply | Research complete! Found 10...
```

### 10. Check Context (Optional)

Pull Claude's context:

```bash
skynet-linker context pull \
  --agent-id claude_cli \
  --output claude_context.json
```

Output:
```json
{
  "agent_type": "planner",
  "global_summary": "Coordinating RAG research with Gemini",
  "last_intent": "Research latest RAG developments",
  "shared_knowledge": {},
  "_updated_at": "2025-11-19T12:35:50Z"
}
```

### 11. List Connected Agents

```bash
skynet-linker agents
```

Output:
```
Connected Agents (2)
┌─────────────┬──────────┬──────────┬──────────────────┬──────────┬─────────────────────┐
│ Agent ID    │ Type     │ Priority │ Channels         │ Messages │ Connected Since     │
├─────────────┼──────────┼──────────┼──────────────────┼──────────┼─────────────────────┤
│ claude_cli  │ planner  │    8     │ skynet_core, ... │    1     │ 2025-11-19 12:30:00 │
│ gemini      │ research │    7     │ skynet_core, ... │    1     │ 2025-11-19 12:31:00 │
└─────────────┴──────────┴──────────┴──────────────────┴──────────┴─────────────────────┘
```

---

## Message Flow Diagram

```
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Claude    │          │  MCP Server │          │   Gemini    │
│  (planner)  │          │             │          │(researcher) │
└──────┬──────┘          └──────┬──────┘          └──────┬──────┘
       │                        │                        │
       │  1. Connect            │                        │
       ├───────────────────────>│                        │
       │  ← WS Connected        │                        │
       │                        │                        │
       │                        │  2. Connect            │
       │                        │<───────────────────────┤
       │                        │   WS Connected →       │
       │                        │                        │
       │  3. Task Message       │                        │
       ├───────────────────────>│                        │
       │                        │  Route to Gemini       │
       │                        ├───────────────────────>│
       │                        │                        │
       │                        │  4. Reply Message      │
       │                        │<───────────────────────┤
       │  Route to Claude       │                        │
       │<───────────────────────┤                        │
       │                        │                        │
```

---

## Key Takeaways

1. **Decoupled Agents**: Each agent runs independently in its own terminal/process
2. **Central Coordination**: MCP Server handles routing and state management
3. **Real-time Communication**: WebSocket connections enable instant message delivery
4. **Persistent Memory**: Redis stores context and message history
5. **Observable**: Monitor tool provides real-time visibility into message flow

---

## Next Steps

- Try [Multi-Agent Scenario](multi_agent_scenario.md) for more complex workflows
- Experiment with context sharing between agents
- Set up encryption for secure communication
- Create custom connectors for other AI platforms
