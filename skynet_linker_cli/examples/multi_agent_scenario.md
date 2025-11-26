# Multi-Agent Scenario - Collaborative Research & Code Generation

This example demonstrates a complex multi-agent workflow involving planning, research, code generation, and review.

## Scenario

**Goal:** Research RAG techniques, implement a prototype, and produce documentation.

**Participants:**
- **Claude (planner)**: Coordinates the entire workflow
- **Gemini (researcher)**: Performs web research on RAG techniques
- **GPT-4 (coder)**: Implements the RAG prototype code
- **Claude (reviewer)**: Reviews code quality and suggests improvements

---

## Complete Workflow

### Setup (Same as Basic Flow)

1. Start Redis: `docker run -d -p 6379:6379 redis:7-alpine`
2. Start MCP Server: `uvicorn server.main:app --reload`
3. Connect all agents in separate terminals

### Terminal 1: Claude Planner

```bash
skynet-linker connect \
  --agent-id claude_planner \
  --type planner \
  --channels skynet_core \
  --priority 9
```

### Terminal 2: Gemini Researcher

```bash
skynet-linker connect \
  --agent-id gemini_researcher \
  --type researcher \
  --channels skynet_core \
  --priority 7
```

### Terminal 3: GPT-4 Coder

```bash
skynet-linker connect \
  --agent-id gpt4_coder \
  --type coder \
  --channels skynet_core \
  --priority 8
```

### Terminal 4: Claude Reviewer

```bash
skynet-linker connect \
  --agent-id claude_reviewer \
  --type reviewer \
  --channels skynet_core \
  --priority 7
```

### Terminal 5: Monitor

```bash
skynet-linker monitor --channel skynet_core
```

---

## Workflow Steps

### Step 1: Create Collaboration Session

```bash
curl -X POST http://localhost:8000/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "participants": ["claude_planner", "gemini_researcher", "gpt4_coder", "claude_reviewer"],
    "goal": "Research, implement, and document RAG prototype",
    "metadata": {
      "deadline": "2025-11-20",
      "tags": ["research", "coding", "rag"]
    }
  }'
```

Response:
```json
{
  "session_id": "650e8400-e29b-41d4-a716-446655440001",
  "status": "active",
  "participants": [...],
  ...
}
```

### Step 2: Claude Broadcasts Task Breakdown

```bash
skynet-linker send \
  --from claude_planner \
  --type broadcast \
  --channel skynet_core \
  --content "🎯 New Project: RAG Prototype

Task Breakdown:
1. @gemini_researcher: Research latest RAG techniques (2025 papers)
2. @gpt4_coder: Implement basic RAG system in Python
3. @claude_reviewer: Review code for quality and best practices

Session ID: 650e8400-e29b-41d4-a716-446655440001

Let's start with research. @gemini_researcher, please begin."
```

All agents receive this broadcast.

### Step 3: Gemini Performs Research

```bash
skynet-linker send \
  --from gemini_researcher \
  --to claude_planner \
  --type reply \
  --content "📚 Research Complete!

Top RAG Techniques (2025):
1. Multi-Vector Retrieval
2. Hybrid Search (dense + sparse)
3. Reranking with cross-encoders
4. Contextual compression

Recommended approach: Start with hybrid search + reranking.
Full findings saved to shared context."
```

Gemini also updates shared context:

```bash
# Create context.json
cat > context.json <<EOF
{
  "research_findings": {
    "techniques": ["multi-vector", "hybrid-search", "reranking"],
    "recommended_stack": ["FAISS", "sentence-transformers", "cross-encoder"],
    "key_papers": [
      "Enhanced RAG with Multi-Vector Retrieval (2025)",
      "RAG-Fusion: Advanced Context Integration (2025)"
    ]
  }
}
EOF

# Push to shared context
skynet-linker context push \
  --agent-id gemini_researcher \
  --file context.json
```

### Step 4: Claude Assigns Coding Task to GPT-4

```bash
skynet-linker send \
  --from claude_planner \
  --to gpt4_coder \
  --type task \
  --content "@gpt4_coder:

Based on @gemini_researcher's findings, please implement:

**Task**: Basic RAG system with hybrid search
**Requirements**:
- Use FAISS for vector search
- Implement BM25 for sparse retrieval
- Add simple reranking
- Python, well-documented

**Context**: Check gemini_researcher's context for tech stack recommendations.

**Deadline**: End of day"
```

### Step 5: GPT-4 Generates Code

```bash
skynet-linker send \
  --from gpt4_coder \
  --to claude_planner \
  --type reply \
  --content "✅ RAG Prototype Complete!

Implementation includes:
- FAISS vector store (100K docs capacity)
- BM25 sparse retrieval
- Cross-encoder reranking
- Clean API with 3 methods: index(), retrieve(), search()

Code pushed to: /shared/rag_prototype.py
Tests included: /shared/test_rag.py

Ready for review by @claude_reviewer"
```

### Step 6: Claude Triggers Code Review

```bash
skynet-linker send \
  --from claude_planner \
  --to claude_reviewer \
  --type task \
  --content "@claude_reviewer:

Please review @gpt4_coder's RAG implementation:
- Location: /shared/rag_prototype.py
- Focus: Code quality, error handling, documentation

Provide feedback directly to @gpt4_coder if changes needed."
```

### Step 7: Claude Reviewer Provides Feedback

```bash
skynet-linker send \
  --from claude_reviewer \
  --to gpt4_coder \
  --type reply \
  --content "🔍 Code Review Complete

**✅ Strengths:**
- Clean architecture
- Good test coverage (85%)
- Proper type hints

**⚠️ Suggestions:**
1. Add input validation for empty queries
2. Implement batch indexing for large docs
3. Add logging for debugging

**Severity**: Low - ship as is, iterate later

Overall: Approve for deployment 👍"
```

### Step 8: Final Summary from Claude

```bash
skynet-linker send \
  --from claude_planner \
  --type broadcast \
  --channel skynet_core \
  --content "🎉 Project Complete!

✅ Research: Done (@gemini_researcher)
✅ Implementation: Done (@gpt4_coder)
✅ Review: Approved (@claude_reviewer)

**Deliverables:**
- RAG prototype: /shared/rag_prototype.py
- Tests: /shared/test_rag.py
- Research findings: Check gemini_researcher context

**Next Steps:**
- Deploy to staging
- Performance benchmarking

Session ID: 650e8400-e29b-41d4-a716-446655440001
Status: COMPLETED ✨

Great teamwork everyone! 🤖"
```

---

## Monitor View (Terminal 5)

Throughout the workflow, the monitor shows:

```
[12:30:00] claude_planner → broadcast: 🎯 New Project: RAG Prototype...
[12:32:15] gemini_researcher → claude_planner: 📚 Research Complete!...
[12:35:00] claude_planner → gpt4_coder: @gpt4_coder: Based on @gemini...
[12:42:30] gpt4_coder → claude_planner: ✅ RAG Prototype Complete!...
[12:45:00] claude_planner → claude_reviewer: @claude_reviewer: Please review...
[12:48:12] claude_reviewer → gpt4_coder: 🔍 Code Review Complete...
[12:50:00] claude_planner → broadcast: 🎉 Project Complete!...
```

---

## Session Analytics

Check session stats:

```bash
curl http://localhost:8000/sessions/650e8400-e29b-41d4-a716-446655440001
```

Response:
```json
{
  "session_id": "650e8400-e29b-41d4-a716-446655440001",
  "status": "completed",
  "participants": ["claude_planner", "gemini_researcher", "gpt4_coder", "claude_reviewer"],
  "created_at": "2025-11-19T12:30:00Z",
  "closed_at": "2025-11-19T12:50:00Z",
  "message_count": 8,
  "metadata": {
    "goal": "Research, implement, and document RAG prototype",
    "tags": ["research", "coding", "rag"],
    "summary": "Successfully completed RAG prototype with research, implementation, and review"
  }
}
```

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     MCP Server                               │
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────┐  │
│  │   Routing    │────>│    Redis     │<────│  Sessions  │  │
│  │   Engine     │     │   Memory     │     │  Manager   │  │
│  └──────────────┘     └──────────────┘     └────────────┘  │
│                                                              │
└───┬─────────────┬─────────────┬─────────────┬──────────────┘
    │             │             │             │
    │ WS          │ WS          │ WS          │ WS
    ↓             ↓             ↓             ↓
┌───────┐   ┌───────────┐   ┌────────┐   ┌──────────┐
│Claude │   │  Gemini   │   │  GPT-4 │   │  Claude  │
│Planner│   │Researcher │   │  Coder │   │ Reviewer │
└───────┘   └───────────┘   └────────┘   └──────────┘
    │             │             │             │
    └─────────────┴─────────────┴─────────────┘
              Collaboration Flow
```

---

## Key Patterns Demonstrated

1. **Broadcast Communication**: Claude uses broadcast to address all agents
2. **Directed Messages**: Specific task assignments to individual agents
3. **Session Management**: Structured collaboration with defined participants
4. **Context Sharing**: Agents push/pull shared knowledge (research findings)
5. **Sequential Workflow**: Research → Code → Review pipeline
6. **Role Specialization**: Each agent has a specific expertise

---

## Advanced Features to Try

### 1. Add Perplexity for Real-time Web Search

```bash
# Terminal 6
skynet-linker connect \
  --agent-id perplexity_search \
  --type researcher \
  --channels skynet_core \
  --priority 6
```

Task Perplexity with recent web queries during research phase.

### 2. Enable Encryption

In `server/config.yaml`:
```yaml
encryption:
  enabled: true
```

Regenerate keys and restart server.

### 3. Create Custom Workflows

Define workflow templates in `examples/workflows/`:
- `research_workflow.yaml`
- `code_review_workflow.yaml`
- `bug_fix_workflow.yaml`

---

## Troubleshooting

### Agents Not Receiving Messages
- Check channel subscriptions match
- Verify agents are connected: `skynet-linker agents`

### Redis Connection Failed
```bash
# Check Redis is running
docker ps | grep redis

# Restart if needed
docker restart <redis-container-id>
```

### Message Routing Issues
- Check MCP server logs
- Verify routing engine stats: `curl http://localhost:8000/stats`

---

## Conclusion

This multi-agent scenario demonstrates:
- ✅ Complex coordination between 4+ agents
- ✅ Session-based collaboration
- ✅ Context sharing across agents
- ✅ Specialized roles (planner, researcher, coder, reviewer)
- ✅ Real-time monitoring and observability

**Next:** Build your own custom workflows! 🚀
