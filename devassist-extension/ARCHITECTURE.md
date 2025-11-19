# DevAssist AI - System Architecture

This document describes the high-level architecture of DevAssist AI, covering both the Chrome extension and backend services.

## Table of Contents

- [Overview](#overview)
- [Extension Architecture](#extension-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Flow](#data-flow)
- [Agentic System](#agentic-system)
- [Security & Privacy](#security--privacy)

---

## Overview

DevAssist is a distributed system consisting of:

1. **Chrome Extension** (Client) - User interface and browser integrations
2. **Backend API** (Server) - AI orchestration, agent execution, data persistence
3. **AI Providers** (External) - OpenAI, Anthropic, Google, DeepSeek APIs

```
┌─────────────────┐
│ Chrome Extension│
│  (TypeScript)   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐      ┌──────────────┐
│   Backend API   │◄────►│   Database   │
│  (Node.js/TS)   │      │ (PostgreSQL) │
└────────┬────────┘      └──────────────┘
         │
    ┌────┴────┬────────┬────────┐
    ▼         ▼        ▼        ▼
┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ OpenAI │ │Claude│ │Gemini│ │DeepSk│
└────────┘ └──────┘ └──────┘ └──────┘
```

---

## Extension Architecture

### Component Hierarchy

```
Extension
├── Background Service Worker (orchestrator)
│   ├── Message router
│   ├── API client
│   ├── Agent executor client
│   └── Auth manager
│
├── Content Scripts (injected into pages)
│   ├── Sidebar (main UI)
│   ├── Code Toolbar (selection actions)
│   └── Integrations
│       ├── GitHub (PR assistant, issue helper)
│       ├── StackOverflow (thread summarizer)
│       └── Documentation (navigator)
│
├── Popup (extension icon click)
│   └── Quick actions & settings
│
└── Side Panel (Chrome 114+)
    └── Advanced features & task builder
```

### Communication Flow

```
User Action
    ↓
Content Script
    ↓ (chrome.runtime.sendMessage)
Service Worker
    ↓ (fetch to backend)
Backend API
    ↓ (AI provider API call)
AI Model
    ↓ (response)
Backend API
    ↓ (WebSocket or polling)
Service Worker
    ↓ (chrome.runtime.sendMessage)
Content Script
    ↓
UI Update
```

### Key Technologies

- **React 18** - UI components
- **TypeScript** - Type safety
- **Vite** - Build tooling
- **Tailwind CSS** - Styling
- **Chrome Extension APIs** - Browser integration

---

## Backend Architecture

### Service Layer

```
API Gateway (Fastify)
    │
    ├── Auth Service
    │   ├── JWT validation
    │   ├── OAuth (GitHub, Google)
    │   └── Session management
    │
    ├── Chat Service
    │   ├── Message routing
    │   ├── Conversation history
    │   └── Streaming responses
    │
    ├── Agent Service
    │   ├── Agent execution engine
    │   ├── Tool registry
    │   └── Workflow orchestration
    │
    ├── Task Service
    │   ├── Scheduler (cron)
    │   ├── Queue (BullMQ)
    │   └── Task executor
    │
    └── AI Orchestration Layer
        ├── Model router
        ├── Cost optimizer
        └── Fallback handler
```

### Data Layer

**PostgreSQL** (Prisma ORM)
```sql
users
conversations
agents
scheduled_tasks
api_keys
usage_logs
```

**Redis**
- Session storage
- Rate limiting
- Cache
- Job queues (BullMQ)
- Pub/Sub (real-time updates)

**Qdrant** (Vector DB)
- Documentation embeddings
- Code snippets
- Conversation memory (RAG)

**S3 (Cloudflare R2)**
- File uploads
- Agent logs
- Backups

### Key Technologies

- **Fastify** - Web framework
- **Prisma** - ORM
- **Redis** - Cache & queues
- **Qdrant** - Vector search
- **BullMQ** - Job processing

---

## Data Flow

### Chat Request Flow

```
1. User types message in sidebar
   ↓
2. Content script sends to service worker
   ↓
3. Service worker calls /api/chat/completions
   ↓
4. Backend authenticates request (JWT)
   ↓
5. AI Orchestrator selects optimal model
   ↓
6. Call AI provider API (OpenAI, Anthropic, etc.)
   ↓
7. Stream response back to client
   ↓
8. Update UI in real-time
   ↓
9. Save to conversation history (async)
   ↓
10. Log usage for billing (async)
```

### Agent Execution Flow

```
1. User triggers agent (e.g., "Analyze PR")
   ↓
2. Service worker calls /api/agents/start
   ↓
3. Backend creates agent record in DB
   ↓
4. Agent Executor begins:
   │
   ├── PHASE 1: PLANNING
   │   ├── LLM generates execution plan
   │   ├── Selects tools to use
   │   └── Creates step-by-step workflow
   │
   ├── PHASE 2: EXECUTION
   │   ├── For each step:
   │   │   ├── Execute tool (API call, code analysis, etc.)
   │   │   ├── Handle errors (retry logic)
   │   │   └── Update state
   │   └── Broadcast progress via WebSocket
   │
   └── PHASE 3: SYNTHESIS
       ├── LLM synthesizes final result
       ├── Save to DB
       └── Notify user
```

---

## Agentic System

### Architecture

The agentic system uses a **ReAct pattern** (Reasoning + Acting):

```typescript
loop:
  1. Observe current state
  2. Reason about next action (LLM decides)
  3. Act (execute tool)
  4. Update state with result
  5. If goal achieved → exit
     else → continue loop
```

### Tools Available (V1)

| Tool | Description | Example |
|------|-------------|---------|
| `fetchGitHubPR` | Get PR details | Analyze PR changes |
| `analyzeCode` | Code analysis | Find bugs, optimize |
| `searchStackOverflow` | Search + summarize | Find error solutions |
| `searchDocumentation` | Semantic doc search | Navigate React docs |
| `executeCode` | Run code in sandbox | Test snippets |
| `postGitHubComment` | Post to PR/issue | Automated reviews |
| `sendNotification` | Notify user | Task completion |

### Pre-configured Agents (V1)

1. **PR Reviewer** - Security, quality, performance analysis
2. **Bug Investigator** - Stack trace debugging
3. **Doc Navigator** - Documentation search & summarization

---

## Security & Privacy

### Extension Security

**Permissions**
- Request minimal permissions (GitHub, StackOverflow only)
- NO `<all_urls>` permission (unlike competitors)
- User grants additional sites on-demand

**Data Handling**
- Code selected by user is sent to backend (opt-in per action)
- No passive data collection
- User can enable "strict privacy mode" (local processing only)

**Content Security**
- Shadow DOM isolation for UI (no style conflicts)
- Sandboxed iframes for sensitive operations
- CSP-compliant code execution

### Backend Security

**Authentication**
- JWT with short expiration (15 min access, 7 day refresh)
- HTTP-only cookies for tokens
- OAuth 2.0 for GitHub/Google

**Data Protection**
- TLS 1.3 encryption in transit
- AES-256 encryption at rest (sensitive data)
- PII anonymization in logs

**API Security**
- Rate limiting (per-user quotas)
- Input validation (JSON Schema)
- SQL injection prevention (Prisma)
- XSS prevention (sanitization)

**Compliance**
- SOC2 Type II (planned)
- GDPR compliant
- CCPA compliant
- Right to deletion

---

## Scaling Considerations

### Horizontal Scaling

**Stateless Services**
- API servers can scale horizontally (Kubernetes)
- Load balancing via Cloudflare or ALB
- Session storage in Redis (shared state)

**Background Jobs**
- BullMQ workers scale independently
- Agent execution can run on separate instances
- Queue-based decoupling

### Performance Optimizations

**Caching**
- Redis cache for frequent queries (docs, common prompts)
- CDN for static assets
- Browser cache for extension resources

**Database**
- Read replicas for heavy read workloads
- Connection pooling (Prisma)
- Indexed queries

**AI Calls**
- Prompt deduplication (cache identical requests)
- Streaming responses (perceived latency reduction)
- Model routing (use cheaper models when possible)

---

## Future Architecture

### V2 Additions

- **Real-time Collaboration** - WebSocket for multi-user workspaces
- **Plugin System** - SDK for community extensions
- **Local AI Models** - On-device inference (Ollama, llama.cpp)

### V3 Additions

- **Multi-agent Orchestration** - Agents working together
- **Fine-tuned Models** - Custom models for developer workflows
- **Edge Computing** - Deploy functions to edge (Cloudflare Workers)

---

## Deployment

### Infrastructure

**Extension**
- Chrome Web Store (primary distribution)
- Auto-updates via Chrome

**Backend**
- **Hosting**: Fly.io or Railway (V1), AWS/GCP (V2+)
- **Database**: Neon or Supabase (PostgreSQL)
- **Cache**: Upstash Redis
- **Vector DB**: Qdrant Cloud
- **CDN**: Cloudflare

### CI/CD

```
GitHub Actions
    │
    ├── On PR: Lint, Test, Type-check
    │
    ├── On merge to main:
    │   ├── Build extension
    │   ├── Build backend
    │   └── Deploy to staging
    │
    └── On tag (v*):
        ├── Deploy backend to production
        └── Submit extension to Chrome Web Store
```

---

## Monitoring & Observability

**Metrics**
- Request rates, latency (p50, p95, p99)
- Error rates by endpoint
- AI API costs per user/model
- Agent execution success rate

**Logging**
- Structured logs (JSON)
- Centralized (Axiom, Better Stack)
- Log levels: error, warn, info, debug

**Alerting**
- PagerDuty for critical errors
- Slack for warnings
- Email for daily summaries

**Tracing**
- Distributed tracing (OpenTelemetry)
- Request ID propagation
- Performance bottleneck identification

---

## Conclusion

This architecture is designed to be:

✅ **Scalable** - Handles 100K+ users
✅ **Maintainable** - Clear separation of concerns
✅ **Extensible** - Easy to add new features
✅ **Secure** - Privacy-first design
✅ **Cost-effective** - Optimized AI usage

For questions or suggestions, please open an issue or contact the team at dev@devassist.ai.
