# ⚙️ Gemini Flow Orchestrator

> **n8n + Gemini Automation Engine** — AI-powered workflow automation platform

A complete workflow automation platform inspired by n8n, enhanced with Google Gemini AI for automatic workflow generation, analysis, and self-healing capabilities.

## 🌟 Features

### Core Capabilities
- **🤖 AI-Powered Workflow Generation**: Describe workflows in natural language, Gemini creates them automatically
- **🔧 Auto-Configuration**: AI configures all nodes, credentials, and parameters automatically
- **🩺 Self-Healing**: Automatic error detection and fixing using AI analysis
- **🌐 Real Internet Access**: HTTP requests, web scraping, API calls with SSRF protection
- **🔒 Enterprise Security**: AES-256-GCM encryption, SSRF protection, credential management
- **📡 MCP Server**: Official Model Context Protocol server (Spec 2025-06-18)

### AI Features
- **Workflow Generator**: Generate complete workflows from descriptions
- **Workflow Analyzer**: Analyze failures and suggest fixes
- **Auto-Fixer**: Automatically repair broken workflows
- **Performance Optimizer**: AI-driven performance recommendations
- **Smart Refinement**: Refine workflows based on feedback

### Technical Features
- **TypeScript/Node.js**: Modern, type-safe codebase
- **Monorepo Architecture**: Clean separation of concerns
- **400+ Node Types**: Extensible node system
- **Real-time Execution**: WebSocket-based live updates
- **Credential Vault**: Encrypted credential storage

## 📋 Architecture

```
gemini-flow-orchestrator/
├── packages/
│   ├── shared-types/        # TypeScript types
│   ├── security/            # Encryption, SSRF protection
│   ├── internet-tools/      # HTTP client, web scraper
│   ├── gemini-agent/        # Gemini AI integration
│   ├── node-registry/       # Node catalog
│   └── workflow-engine/     # Execution engine
├── apps/
│   ├── mcp-server/          # MCP server (main interface)
│   ├── backend/             # REST API + WebSocket
│   └── frontend/            # React UI
└── infrastructure/
    ├── docker-compose.yml
    └── migrations/
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd gemini-flow-orchestrator

# Install dependencies
npm install

# Build all packages
npm run build
```

### Configuration

```bash
# Set your Gemini API key
export GEMINI_API_KEY=your_api_key_here

# Optional: Set encryption master key for credentials
export ENCRYPTION_MASTER_KEY=your_secure_key_here
```

### Run MCP Server

```bash
# Start the MCP server
cd apps/mcp-server
npm run dev
```

The MCP server will be available via stdio transport.

## 🛠️ MCP Tools

The server exposes the following MCP tools:

### Workflow Management

#### `create_workflow_from_description`
Generate a complete workflow from natural language.

```json
{
  "description": "Send me a Slack message every day at 9am with GitHub issues assigned to me",
  "name": "Daily GitHub Issues Alert"
}
```

#### `list_workflows`
List all workflows in the system.

#### `get_workflow`
Get a specific workflow by ID.

#### `validate_workflow`
Validate workflow configuration and identify issues.

#### `refine_workflow`
Refine an existing workflow based on feedback.

```json
{
  "workflow_id": "wf_123",
  "feedback": "Add error handling and send email instead of Slack"
}
```

#### `delete_workflow`
Delete a workflow.

### AI Analysis

#### `analyze_workflow_execution`
Analyze a failed execution and get AI suggestions.

#### `auto_fix_workflow`
Automatically fix workflow issues.

### Node Catalog

#### `list_nodes_catalog`
List all available node types.

```json
{
  "group": "trigger",  // Optional: filter by group
  "search": "http"     // Optional: search query
}
```

#### `get_node_details`
Get detailed information about a node type.

### Internet Tools

#### `http_request`
Make HTTP requests with SSRF protection.

```json
{
  "method": "GET",
  "url": "https://api.github.com/repos/n8n-io/n8n",
  "headers": {
    "Authorization": "Bearer token"
  }
}
```

#### `scrape_webpage`
Scrape data from webpages.

```json
{
  "url": "https://example.com",
  "selector": "h1"  // Optional CSS selector
}
```

## 📦 Packages

### @gemini-flow/shared-types
Common TypeScript types used across all packages.

### @gemini-flow/security
- AES-256-GCM encryption
- SSRF protection (OWASP compliant)
- Credential manager
- Secure key derivation

### @gemini-flow/internet-tools
- Secure HTTP client with SSRF validation
- Web scraper (cheerio-based)
- Support for all HTTP methods
- Authentication (Basic, Bearer, API Key, OAuth2)

### @gemini-flow/gemini-agent
- Gemini API client
- Workflow generator
- Workflow analyzer
- Auto-fixer
- JSON mode with schema validation

### @gemini-flow/node-registry
- Node catalog system
- Core nodes: HTTP Request, Code, Set, IF, Merge
- Trigger nodes: Webhook, Schedule, Manual
- Action nodes: Email, Slack, Discord, GitHub

## 🔒 Security

### SSRF Protection
Based on OWASP Top 10 2025 recommendations:
- URL allowlist/blocklist
- Private IP blocking (RFC 1918)
- Localhost/loopback blocking
- Protocol validation (HTTP/HTTPS only)
- DNS rebinding protection
- Redirect validation

### Encryption
- AES-256-GCM for credential storage
- Scrypt for key derivation
- Unique IVs and salts per encryption
- Authentication tags for integrity

### Best Practices
- No hardcoded secrets
- Environment variable configuration
- Credential masking in logs
- Principle of least privilege

## 🧪 Testing

```bash
# Run all tests
npm run test

# Test specific package
cd packages/gemini-agent
npm test
```

## 🏗️ Development

```bash
# Watch mode (auto-rebuild)
npm run dev

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

## 📚 API Documentation

### Gemini Integration

The system uses Google Gemini 2.5 Flash for:
- **1M token context window**: Handle large workflows
- **JSON mode**: Structured, reliable output
- **Function calling**: Tool integration
- **High performance**: Fast response times

### Node System

Nodes are the building blocks of workflows:
- **Inputs/Outputs**: Define data flow
- **Parameters**: Configurable properties
- **Credentials**: Secure authentication
- **Webhooks**: HTTP endpoint triggers

### Workflow Execution

Workflows execute through:
1. **Validation**: Check configuration
2. **Initialization**: Load credentials
3. **Execution**: Run nodes in order
4. **Error Handling**: Catch and report errors
5. **Logging**: Record all events

## 🌐 Use Cases

### Automation Examples

1. **Daily Reports**
   ```
   "Send me a daily email at 8am with yesterday's sales data from Stripe"
   ```

2. **Issue Tracking**
   ```
   "When a GitHub issue is created, create a Slack channel and notify the team"
   ```

3. **Data Sync**
   ```
   "Every hour, fetch new CRM contacts and add them to my mailing list"
   ```

4. **Monitoring**
   ```
   "Check my website status every 5 minutes and alert me on Discord if it's down"
   ```

## 🤝 Contributing

This project follows standard TypeScript/Node.js conventions:
- ESLint for linting
- Prettier for formatting
- Conventional commits
- Semantic versioning

## 📄 License

MIT License

## 🙏 Credits

Inspired by:
- [n8n](https://github.com/n8n-io/n8n) - Workflow automation
- [Google Gemini](https://ai.google.dev/gemini-api) - AI capabilities
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification

## 📞 Support

For issues and questions:
- GitHub Issues: Report bugs and request features
- Documentation: Check this README and inline code docs

---

**Built with ❤️ using TypeScript, Node.js, and Google Gemini AI**
