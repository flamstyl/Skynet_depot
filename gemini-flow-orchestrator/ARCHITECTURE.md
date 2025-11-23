# Architecture Documentation

## System Overview

Gemini Flow Orchestrator is a modern workflow automation platform that combines the power of n8n's workflow engine with Google Gemini AI for intelligent automation.

## Design Principles

1. **AI-First**: Leverage Gemini AI for workflow generation, analysis, and optimization
2. **Security by Default**: SSRF protection, encrypted credentials, secure defaults
3. **Modular Architecture**: Clean separation of concerns via packages
4. **Type Safety**: Full TypeScript coverage
5. **Extensibility**: Easy to add new nodes and features
6. **Production Ready**: Scalable, maintainable, well-tested

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Interface                        │
│              (Model Context Protocol)                   │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  MCP Server  │  │  REST API    │  │  WebSocket   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                    Business Logic                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Workflow Eng │  │ Gemini Agent │  │ Node Registry│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                   Infrastructure                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Security    │  │Internet Tools│  │  Storage     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. MCP Server (apps/mcp-server)

**Purpose**: Main interface following Model Context Protocol spec 2025-06-18

**Responsibilities**:
- Expose MCP tools via stdio transport
- Handle tool calls and route to appropriate services
- Manage workflow state (currently in-memory)
- Coordinate between Gemini agent and workflow engine

**Key Files**:
- `src/index.ts`: Server setup and tool handlers

### 2. Gemini Agent (packages/gemini-agent)

**Purpose**: AI-powered workflow intelligence

**Components**:

#### GeminiClient
- Communicates with Google Gemini API
- Supports JSON mode for structured output
- Function calling capabilities
- Multi-turn chat sessions

#### WorkflowGenerator
- Generates workflows from natural language
- Validates generated plans
- Auto-positions nodes
- Supports refinement based on feedback

#### WorkflowAnalyzer
- Analyzes failed executions
- Identifies issues and root causes
- Provides optimization suggestions
- Performance analysis

#### AutoFixer
- Generates patches for broken workflows
- Applies fixes automatically
- Validates fixes before applying

### 3. Security (packages/security)

**Purpose**: Enterprise-grade security features

**Components**:

#### EncryptionService
- AES-256-GCM encryption
- Scrypt key derivation
- Unique IVs and salts
- Authentication tags

#### SSRFProtection
- URL validation (allowlist/blocklist)
- Private IP blocking
- Protocol validation
- Redirect safety checks

#### CredentialManager
- Secure credential storage
- Multiple auth types (API Key, OAuth2, Basic, Bearer)
- Encrypted at rest

### 4. Internet Tools (packages/internet-tools)

**Purpose**: Safe external communication

**Components**:

#### SecureHttpClient
- HTTP requests with SSRF validation
- Support for all methods (GET, POST, PUT, PATCH, DELETE)
- Authentication (Basic, Bearer, API Key, OAuth2)
- Timeout and redirect handling

#### WebScraper
- Cheerio-based scraping
- CSS selector support
- Table extraction
- SSRF protected

### 5. Node Registry (packages/node-registry)

**Purpose**: Catalog of workflow building blocks

**Node Categories**:

#### Core Nodes
- HTTP Request: Make API calls
- Code: Execute JavaScript
- Set: Set data values
- IF: Conditional branching
- Merge: Combine data streams

#### Trigger Nodes
- Webhook: HTTP endpoint
- Schedule: Cron-based triggers
- Manual: User-initiated

#### Action Nodes
- Email: Send emails
- Slack: Post to Slack
- Discord: Send Discord messages
- GitHub: GitHub API operations

### 6. Shared Types (packages/shared-types)

**Purpose**: Type definitions for the entire system

**Key Types**:
- Workflow, WorkflowNode, NodeConnection
- WorkflowExecution, ExecutionData
- NodeType, NodeProperty
- GeminiWorkflowPlan, GeminiAnalysisResult
- Security and HTTP types

## Data Flow

### Workflow Generation

```
1. User provides natural language description
   ↓
2. MCP tool: create_workflow_from_description
   ↓
3. WorkflowGenerator sends to Gemini API
   ↓
4. Gemini returns structured JSON plan
   ↓
5. Plan converted to Workflow object
   ↓
6. Workflow stored (in-memory/database)
   ↓
7. Result returned to user via MCP
```

### Workflow Execution (Future)

```
1. Workflow triggered (webhook/schedule/manual)
   ↓
2. WorkflowEngine initializes execution
   ↓
3. Nodes execute in order (following connections)
   ↓
4. Each node:
   - Validates input data
   - Loads credentials (if needed)
   - Executes operation
   - Produces output
   ↓
5. Results logged to ExecutionData
   ↓
6. On error: AutoFixer can analyze and fix
```

### SSRF Protection Flow

```
1. HTTP request initiated
   ↓
2. SSRFProtection.validateUrl()
   ↓
3. Checks:
   - Protocol (HTTP/HTTPS only)
   - Blocked hostnames
   - Allowlist/blocklist
   - Private IP ranges
   ↓
4. If valid: sanitize and proceed
5. If invalid: reject with reason
```

### Credential Encryption

```
1. Credential created with plaintext data
   ↓
2. EncryptionService.encryptObject()
   ↓
3. Generate random salt and IV
   ↓
4. Derive key from master key + salt
   ↓
5. Encrypt with AES-256-GCM
   ↓
6. Store: { iv, encryptedData, authTag, salt }
   ↓
7. On retrieval: reverse process with validation
```

## Scalability Considerations

### Current (v1.0)
- In-memory workflow storage
- Single process execution
- Stdio MCP transport

### Future Enhancements

#### Database Layer
- PostgreSQL for workflow/execution storage
- Redis for caching and queuing
- Migration system for schema updates

#### Execution Engine
- Worker queue (Bull/BullMQ)
- Distributed execution
- Parallel node execution
- Retry mechanisms

#### API Layer
- REST API for programmatic access
- WebSocket for real-time updates
- GraphQL for flexible queries

#### Frontend
- React-based UI
- Visual workflow editor
- Real-time execution logs
- Node library browser

## Security Architecture

### Defense in Depth

1. **Input Validation**: All inputs validated against JSON schemas
2. **SSRF Protection**: URL validation before any HTTP request
3. **Encryption**: Credentials encrypted at rest
4. **Least Privilege**: Minimal permissions by default
5. **Audit Logging**: All actions logged
6. **Rate Limiting**: Prevent abuse (future)

### Threat Model

**Protected Against**:
- Server-Side Request Forgery (SSRF)
- Credential theft
- Command injection
- XSS (in future web UI)
- CSRF (in future web UI)

**Out of Scope** (user responsibility):
- Phishing
- Social engineering
- Client-side malware
- Network-level attacks

## Performance Optimization

### Current Optimizations
- TypeScript compilation caching
- Turbo build system for monorepo
- Minimal dependencies

### Future Optimizations
- Node execution caching
- Workflow result caching
- Database query optimization
- CDN for frontend assets
- Worker pool for parallel execution

## Monitoring & Observability

### Current
- Console logging
- Error messages in MCP responses

### Future
- Structured logging (Winston/Pino)
- Metrics (Prometheus)
- Tracing (OpenTelemetry)
- Error tracking (Sentry)
- Performance monitoring

## Extension Points

### Adding New Nodes

1. Create node definition in `packages/node-registry/src/nodes/`
2. Define properties and validation
3. Implement execution logic
4. Register in NodeRegistry
5. Add tests

### Adding New MCP Tools

1. Define tool schema in `apps/mcp-server/src/index.ts`
2. Add handler in CallToolRequestSchema
3. Implement business logic
4. Update documentation

### Integrating New AI Models

1. Create new client in `packages/gemini-agent/`
2. Implement common interface
3. Add configuration
4. Update generator/analyzer to use new client

## Testing Strategy

### Unit Tests
- Pure functions in each package
- Mock external dependencies
- High coverage for critical paths

### Integration Tests
- Test package interactions
- Mock Gemini API
- Test MCP protocol compliance

### End-to-End Tests
- Full workflow generation
- Execution scenarios
- Error handling

## Deployment

### Development
```bash
npm run dev  # Watch mode
```

### Production
```bash
npm run build  # Compile TypeScript
npm start      # Run production server
```

### Docker (Future)
```bash
docker-compose up
```

### Environment Variables
- `GEMINI_API_KEY`: Required for AI features
- `ENCRYPTION_MASTER_KEY`: For credential encryption
- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis connection

## Maintenance

### Upgrading Dependencies
```bash
npm update
```

### Database Migrations (Future)
```bash
npm run db:migrate
```

### Backup & Restore (Future)
- Automated PostgreSQL backups
- Workflow export/import
- Credential vault backup

## Conclusion

This architecture provides:
- ✅ Modular, maintainable codebase
- ✅ AI-powered automation
- ✅ Enterprise security
- ✅ Clear extension points
- ✅ Production-ready foundation
- ✅ Future-proof design
