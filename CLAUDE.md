# CLAUDE.md - AI Assistant Guide for Skynet Depot

**Version**: 1.0.0
**Last Updated**: 2025-11-23
**Purpose**: Comprehensive guide for AI assistants working with the Skynet MCP Ecosystem

---

## Table of Contents

1. [Repository Overview](#repository-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Structure](#project-structure)
4. [Development Workflows](#development-workflows)
5. [Key Conventions & Patterns](#key-conventions--patterns)
6. [MCP Server Architecture](#mcp-server-architecture)
7. [Installation & Setup](#installation--setup)
8. [Git Workflow](#git-workflow)
9. [Testing Strategy](#testing-strategy)
10. [Common Tasks & Examples](#common-tasks--examples)
11. [Security Considerations](#security-considerations)
12. [Performance Guidelines](#performance-guidelines)
13. [Troubleshooting](#troubleshooting)
14. [Future Roadmap](#future-roadmap)

---

## Repository Overview

### Purpose

**Skynet Depot** is a comprehensive monorepo containing an ecosystem of **Model Context Protocol (MCP) servers** designed to transform Claude Code CLI into a complete "OS for AI" with capabilities equivalent to a senior DevOps engineer, system administrator, and creative professional.

### Key Statistics

- **Total Projects**: 51 standalone tools/servers
- **MCP Tools Available**: 143+ across 4 core servers
- **Primary Language**: TypeScript (40+ projects)
- **Repository Size**: ~9.9MB (source code)
- **License**: MIT (all projects)

### Core MCP Servers (Production Ready v1.0.0)

1. **MCP_SysAdmin** (112 tools)
   - Complete Linux system administration
   - Package management (APT, NPM, PIP, Cargo, Go, Snap, Flatpak)
   - Docker orchestration (27 tools)
   - Development environments (18 tools)
   - System administration (31 tools)
   - Graphics/Media processing (15 tools)

2. **skynet-filewatcher-mcp** (10 tools)
   - Real-time file system monitoring
   - Event filtering and statistics
   - Hash calculation (SHA256/SHA1/MD5)
   - JSONL structured logging

3. **skynet-project-mcp** (14 tools)
   - Advanced Git workflow (init, status, commit, push, pull, branch, merge, stash)
   - Project management
   - simple-git wrapper

4. **skynet-creative-mcp** (7 tools)
   - Advanced image processing with Sharp
   - Resize, convert, rotate, watermark, compose
   - Metadata extraction and optimization
   - Format support: JPEG, PNG, WebP, AVIF, GIF

### Additional Notable Projects

- **local-ai-assistant**: Full-stack AI assistant (FastAPI + React + Chrome Extension)
- **mcp-devops-workspace**: Comprehensive DevOps workspace (50+ tools)
- **mcp-web-scraper-pro**: Professional web scraping with SQLite storage (11 tools)
- **grok_cli**: CLI tool for Grok AI with MCP support
- Various specialized MCP servers (clipboard, notes, passwords, tasks, etc.)

---

## Architecture & Tech Stack

### Primary Stack (MCP Servers)

**Runtime & Language**
```json
{
  "runtime": "Node.js >= 18.0.0",
  "language": "TypeScript 5.3.3 - 5.9.3",
  "module_system": "ES Modules (type: module)",
  "build_tool": "tsc (TypeScript compiler)",
  "dev_tool": "tsx (TypeScript executor)"
}
```

**Core Libraries**
- `@modelcontextprotocol/sdk`: v1.0.4 - v1.22.0 (Official Anthropic MCP SDK)
- `zod`: v3.23.8 - v4.1.12 (Schema validation and type safety)
- `zod-to-json-schema`: v3.24.1 (Convert Zod schemas to JSON Schema)

**Domain-Specific Libraries**

| Domain | Libraries |
|--------|-----------|
| System Admin | dockerode (v4.0.2), systeminformation (v5.21.20 - v5.23.5) |
| File & Git | simple-git (v3.21.0 - v3.27.0), chokidar (v4.0.3), mime-types (v2.1.35) |
| Image Processing | sharp (v0.33.1 - v0.33.5) |
| Web Scraping | cheerio, axios, better-sqlite3, turndown |
| Utilities | uuid (v11.0.3), chalk (v5.3.0), dotenv (v16.3.1 - v16.4.5), winston (v3.11.0) |

### Secondary Stack (Applications)

**Backend**: Python 3.11+ (FastAPI), Express (Node.js)
**Frontend**: React 18.2, Tailwind CSS, Vite
**Browser Extensions**: Chrome Manifest V3, TypeScript
**Testing**: Jest (v29.7.0), ts-jest, eslint, prettier
**Infrastructure**: Docker, Docker Compose, SQLite, PostgreSQL, MySQL, MongoDB, Redis

### MCP Protocol

All MCP servers communicate via:
- **Transport**: `StdioServerTransport` (JSON-RPC over standard input/output)
- **Pattern**: Synchronous request-response
- **No HTTP**: Direct process communication for security
- **Logging**: stderr for server logs, stdout for JSON-RPC protocol

---

## Project Structure

### Repository Organization

```
Skynet_depot/
├── Core MCP Servers (Production v1.0.0)
│   ├── MCP_SysAdmin/              # 112 tools - Linux system administration
│   ├── skynet-filewatcher-mcp/    # 10 tools - Real-time file monitoring
│   ├── skynet-project-mcp/        # 14 tools - Git workflow & project management
│   └── skynet-creative-mcp/       # 7 tools - Image processing with Sharp
│
├── DevOps & Workspace Tools
│   ├── mcp-devops-workspace/      # 50+ tools - Alternative DevOps workspace
│   ├── mcp-web-scraper-pro/       # 11 tools - Professional web scraping
│   └── workspace_mcp/             # Alternative workspace implementation
│
├── Full Applications
│   ├── local-ai-assistant/        # FastAPI + React + Chrome Extension
│   └── grok_cli/                  # CLI for Grok AI with MCP support
│
├── Specialized MCP Servers
│   ├── MCP_KALI_LINUX/           # Security tools integration
│   ├── MCP_Browser_LMStudio/     # Browser automation
│   ├── clipboardpro_mcp/         # Clipboard management
│   ├── notevault_mcp/            # Note management with Electron
│   ├── passwordvault_mcp/        # Password management
│   ├── taskflow_mcp/             # Task workflow management
│   └── [40+ more projects...]
│
├── Configuration & Documentation
│   ├── README.md                 # Main overview
│   ├── SKYNET_MCP_ECOSYSTEM.md  # Complete ecosystem documentation
│   ├── MCP_SERVERS_GUIDE.md     # Combined server guide
│   ├── ROADMAP_AND_IMPROVEMENTS.md  # Development roadmap
│   ├── claude-mcp-config.example.json  # MCP configuration template
│   └── install-all-mcp.sh       # Automated installation script
│
└── [Supporting tools, extensions, and utilities...]
```

### Standard MCP Server Structure

Each MCP server follows this consistent pattern:

```
<mcp-server-name>/
├── src/
│   ├── index.ts              # Server entry point
│   ├── tools/
│   │   ├── package-tools.ts  # Package management tools
│   │   ├── docker-tools.ts   # Docker operations
│   │   ├── system-tools.ts   # System administration
│   │   └── ...               # Domain-specific tools
│   └── utils.ts              # Shared utilities
│
├── dist/                     # Compiled JavaScript (gitignored)
├── node_modules/             # Dependencies (gitignored)
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── README.md                 # Project documentation
├── install.sh                # Installation script (optional)
└── .env.example              # Environment variables template (optional)
```

---

## Development Workflows

### Installation Workflows

**1. Automated Installation (Recommended)**
```bash
# Install all 4 core MCP servers
./install-all-mcp.sh
```

**2. Individual Installation**
```bash
cd <project-directory>
./install.sh  # If available
# OR manual:
npm install
npm run build
```

**3. Manual Installation**
```bash
npm install
npm run build
```

### Build Workflow

**Standard Scripts** (from package.json):
```json
{
  "scripts": {
    "build": "tsc",                    // Compile TypeScript
    "start": "node dist/index.js",     // Run compiled code
    "dev": "tsx src/index.ts",         // Development mode with tsx
    "watch": "tsc --watch",            // Watch mode for development
    "test": "jest",                    // Run tests (where implemented)
    "lint": "eslint src/**/*.ts",      // Lint code
    "format": "prettier --write src/**/*.ts"  // Format code
  }
}
```

**Build Output**:
- Directory: `/dist/` or `/build/` (depending on project)
- Artifacts: `.js`, `.d.ts`, `.d.ts.map`, `.js.map`

### Development Mode

```bash
# Terminal 1: Watch mode compilation
npm run watch

# Terminal 2: Run the server
npm run dev

# Terminal 3: Test with Claude Code CLI
claude mcp list
```

---

## Key Conventions & Patterns

### 1. Naming Conventions

**Files**:
- Tool files: `<domain>-tools.ts` (e.g., `package-tools.ts`, `docker-tools.ts`)
- Utils: `utils.ts`, `helpers.ts`
- Index: `index.ts` (entry point)

**Functions**:
- Tool names: `snake_case` for MCP tool names (e.g., `apt_install`, `docker_ps`)
- TypeScript functions: `camelCase` (e.g., `aptInstall`, `dockerPs`)
- Schemas: `<toolName>Schema` (e.g., `aptInstallSchema`)

**Variables**:
- Constants: `UPPER_SNAKE_CASE` or `camelCase`
- Local variables: `camelCase`

### 2. Code Structure Patterns

**Tool Definition Pattern**:
```typescript
// 1. Import dependencies
import { z } from 'zod';
import { executeCommand, formatOutput } from '../utils.js';

// 2. Define Zod schema
export const aptInstallSchema = z.object({
  packages: z.array(z.string()).describe('Liste des paquets à installer'),
  update: z.boolean().optional().describe('Faire apt update avant'),
  yes: z.boolean().optional().describe('Accepter automatiquement'),
});

// 3. Implement handler function
export async function aptInstall(args: z.infer<typeof aptInstallSchema>) {
  const { packages, update = true, yes = true } = args;

  try {
    // Implementation
    const result = await executeCommand(`sudo apt-get install ${packages.join(' ')}`);
    return formatOutput(result);
  } catch (error) {
    throw new Error(`Failed to install packages: ${error.message}`);
  }
}
```

**Server Registration Pattern** (in `index.ts`):
```typescript
const tools = [
  {
    name: 'apt_install',
    description: '📦 Installer des paquets via APT (Debian/Ubuntu)',
    inputSchema: PackageTools.aptInstallSchema,
    handler: PackageTools.aptInstall,
  },
  // ... more tools
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema),
    })),
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const tool = tools.find((t) => t.name === toolName);

  if (!tool) {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
  }

  const validatedArgs = tool.inputSchema.parse(request.params.arguments);
  const result = await tool.handler(validatedArgs);

  return {
    content: [{ type: 'text', text: String(result) }],
  };
});
```

### 3. Error Handling Pattern

**Standard Error Handling**:
```typescript
try {
  // Tool execution
  const result = await someOperation();
  return {
    content: [{ type: 'text', text: result }]
  };
} catch (error) {
  return {
    content: [{
      type: 'text',
      text: `❌ Error: ${error.message}`
    }],
    isError: true
  };
}
```

**Validation with Zod**:
```typescript
// Zod automatically throws validation errors
const validatedArgs = schema.parse(args); // Throws if invalid

// Or use safeParse for custom error handling
const result = schema.safeParse(args);
if (!result.success) {
  throw new Error(`Invalid arguments: ${result.error.message}`);
}
```

### 4. Logging Conventions

**Server Logs** (stderr):
```typescript
console.error('🚀 MCP Server v1.0.0');
console.error('✅ Server started successfully');
console.error('❌ Error occurred:', error);
```

**Emoji Indicators**:
- 🚀 Startup/Launch
- ✅ Success
- ❌ Error/Failure
- 📦 Package/Installation
- 🔍 Search/Find
- 🐳 Docker
- 📊 Statistics/Metrics
- 🔄 Update/Refresh
- ⚡ Execute/Run
- 🛡️ Security/Firewall

### 5. TypeScript Configuration

**Standard tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",              // or "ES2022"
    "moduleResolution": "Node16",    // or "node"
    "outDir": "./dist",              // or "./build"
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

### 6. Package.json Standards

```json
{
  "type": "module",                    // ES modules
  "engines": {
    "node": ">=18.0.0"
  },
  "main": "dist/index.js",
  "bin": {
    "mcp-server-name": "dist/index.js"
  }
}
```

---

## MCP Server Architecture

### Architecture Overview

```
Claude Code CLI (Client)
       ↓
[MCP Protocol - JSON-RPC over stdio]
       ↓
MCP Server (@modelcontextprotocol/sdk)
       ↓
StdioServerTransport
       ↓
Request Handlers
  ├── ListToolsRequestSchema → List available tools
  └── CallToolRequestSchema → Execute tool
       ↓
Tool Definitions
  ├── name: string
  ├── description: string
  ├── inputSchema: Zod schema
  └── handler: async function
       ↓
Validation (Zod) → Execution → Response Formatting
```

### Design Patterns Used

1. **Factory Pattern**: Creating watchers, stores, Git instances
2. **Strategy Pattern**: Different processing strategies (scraping, image processing)
3. **Observer Pattern**: File watching with event callbacks
4. **Command Pattern**: Each MCP tool is a command
5. **Repository Pattern**: Data stores for events, cache, etc.
6. **Dependency Injection**: Event stores and managers passed to tools

### Security Layers

**Path Traversal Protection**:
```typescript
function validatePath(userPath: string): string {
  const resolved = path.resolve(userPath);
  if (!resolved.startsWith(ALLOWED_BASE_PATH)) {
    throw new Error('Path traversal attempt detected');
  }
  return resolved;
}
```

**Anti-SSRF** (for web scraping):
```typescript
function isPrivateIP(hostname: string): boolean {
  // Block 127.0.0.1, 10.x.x.x, 192.168.x.x, 169.254.x.x, etc.
  return PRIVATE_IP_REGEX.test(hostname);
}
```

**Rate Limiting**:
```typescript
const limiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
});
```

**Confirmation for Destructive Actions**:
```typescript
if (isDestructive && !args.confirm) {
  throw new Error('This action requires confirmation. Set confirm: true');
}
```

---

## Installation & Setup

### Prerequisites

```bash
# Required
node --version  # >= 18.0.0
npm --version   # >= 8.0.0

# Optional (depending on MCP server)
docker --version
git --version
python3 --version  # >= 3.11
```

### Quick Start

**1. Clone Repository**:
```bash
git clone https://github.com/flamstyl/Skynet_depot.git
cd Skynet_depot
```

**2. Install Core MCP Servers**:
```bash
./install-all-mcp.sh
```

**3. Configure Claude Code CLI**:
```bash
# Create config directory
mkdir -p ~/.config/claude

# Copy example config
cp claude-mcp-config.example.json ~/.config/claude/config.json

# Edit config with absolute paths
# Replace /home/user/Skynet_depot with your actual path
nano ~/.config/claude/config.json
```

**4. Verify Installation**:
```bash
claude mcp list
# Should show: sysadmin, filewatcher, project, creative
```

### Configuration File Format

**Location**: `~/.config/claude/config.json` (Linux) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "$schema": "https://modelcontextprotocol.io/schema/config.json",
  "mcp": {
    "servers": {
      "sysadmin": {
        "description": "Administration système Linux complète (112 tools)",
        "command": "node",
        "args": ["/absolute/path/to/Skynet_depot/MCP_SysAdmin/dist/index.js"],
        "env": {}
      },
      "filewatcher": {
        "description": "Surveillance temps réel de fichiers (10 tools)",
        "command": "node",
        "args": ["/absolute/path/to/Skynet_depot/skynet-filewatcher-mcp/dist/index.js"],
        "env": {}
      },
      "project": {
        "description": "Git workflow avancé (14 tools)",
        "command": "node",
        "args": ["/absolute/path/to/Skynet_depot/skynet-project-mcp/dist/index.js"],
        "env": {}
      },
      "creative": {
        "description": "Traitement d'images avancé (7 tools)",
        "command": "node",
        "args": ["/absolute/path/to/Skynet_depot/skynet-creative-mcp/dist/index.js"],
        "env": {}
      }
    }
  }
}
```

**Important**:
- Use **absolute paths** (not relative)
- Paths must point to compiled `.js` files in `dist/` or `build/`
- Restart Claude Code CLI after config changes

---

## Git Workflow

### Branch Strategy

**Main Branch**: `main` (production-ready code)

**Feature Branches**: `claude/<feature-name>-<session-id>`
- Example: `claude/implement-mcp-servers-01MPK6yJ1nDVNjoprbeAKm9u`
- Example: `claude/local-ai-assistant-012S2AXTwFw1u3S9WAcfwsYi`

### Commit Message Conventions

**Format**: `<type>: <description>`

**Types**:
- `feat`: New feature (e.g., `feat: add GitHub CLI integration`)
- `fix`: Bug fix (e.g., `fix: handle renamed events correctly`)
- `docs`: Documentation changes (e.g., `docs: update README with examples`)
- `refactor`: Code refactoring (e.g., `refactor: extract common utilities`)
- `test`: Add/update tests (e.g., `test: add unit tests for package tools`)
- `chore`: Maintenance tasks (e.g., `chore: update dependencies`)
- `perf`: Performance improvements (e.g., `perf: optimize image processing`)

**Examples from Recent Commits**:
```
🚀 Add MCP Workspace: DevOps + LM Studio Gmail servers
📋 Ajout ROADMAP complète avec brainstorming améliorations futures
Merge pull request #57 from flamstyl/claude/implement-mcp-servers-01MPK6yJ1nDVNjoprbeAKm9u
```

### Pull Request Workflow

**1. Create Feature Branch**:
```bash
git checkout -b claude/feature-name-<session-id>
```

**2. Develop & Commit**:
```bash
# Make changes
npm run build  # Ensure it compiles
git add .
git commit -m "feat: add new feature"
```

**3. Push to Remote**:
```bash
git push -u origin claude/feature-name-<session-id>
```

**4. Create Pull Request**:
```bash
gh pr create --title "Add new feature" --body "Description of changes"
```

**5. Merge to Main**:
```bash
# After review and approval
gh pr merge <pr-number> --merge
```

### Git Best Practices

- **Never push to main directly** without a PR
- **Always compile before committing** (`npm run build`)
- **Include meaningful commit messages** that explain the "why"
- **Keep commits atomic** - one logical change per commit
- **Don't commit build artifacts** (dist/, node_modules/, .env)

---

## Testing Strategy

### Current State

**Test Coverage**: Minimal (<10% of projects have tests)

**Projects with Tests**:
- `workspace_mcp/tests/unit/dev_env.test.ts`

**Test Infrastructure Available**:
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  }
}
```

### Testing Guidelines (When Adding Tests)

**1. Unit Tests**:
```typescript
// Example: tests/unit/package-tools.test.ts
import { describe, it, expect } from '@jest/globals';
import { aptInstall, aptInstallSchema } from '../src/tools/package-tools';

describe('aptInstall', () => {
  it('should validate schema correctly', () => {
    const validArgs = { packages: ['vim'], update: true, yes: true };
    expect(() => aptInstallSchema.parse(validArgs)).not.toThrow();
  });

  it('should reject invalid packages', () => {
    const invalidArgs = { packages: 'vim' }; // Should be array
    expect(() => aptInstallSchema.parse(invalidArgs)).toThrow();
  });
});
```

**2. Integration Tests**:
```typescript
// Example: tests/integration/mcp-server.test.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

describe('MCP Server', () => {
  it('should list all tools', async () => {
    const response = await server.request({ method: 'tools/list' });
    expect(response.tools).toHaveLength(112);
  });
});
```

**3. Run Tests**:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run lint          # Check code style
npm run format        # Auto-format code
```

### Priority Testing Targets (from Roadmap)

**High Priority**:
1. Schema validation tests (Zod schemas)
2. Critical tool functions (package install, Docker operations)
3. File path validation and security checks
4. Error handling and edge cases

**Target**: Minimum 70% code coverage

---

## Common Tasks & Examples

### Task 1: Add a New MCP Tool

**Example**: Add a new `apt_autoremove` tool to MCP_SysAdmin

**1. Define Schema & Handler** (in `src/tools/package-tools.ts`):
```typescript
export async function aptAutoremove() {
  const result = await executeCommand('sudo apt-get autoremove -y');
  return formatOutput(result);
}
```

**2. Register Tool** (in `src/index.ts`):
```typescript
const tools = [
  // ... existing tools
  {
    name: 'apt_autoremove',
    description: '🧹 Remove unused packages automatically (APT)',
    inputSchema: { type: 'object', properties: {} },
    handler: PackageTools.aptAutoremove,
  },
];
```

**3. Build & Test**:
```bash
npm run build
npm start  # Test manually with Claude Code CLI
```

### Task 2: Create a New MCP Server

**Example**: Create a minimal MCP server from scratch

**1. Create Project Structure**:
```bash
mkdir my-mcp-server
cd my-mcp-server
npm init -y
```

**2. Update package.json**:
```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.22.0",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@types/node": "^24.10.1",
    "tsx": "^4.20.6",
    "typescript": "^5.9.3"
  }
}
```

**3. Create tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}
```

**4. Create src/index.ts**:
```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'my-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const tools = [
  {
    name: 'hello_world',
    description: '👋 Say hello',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => 'Hello from MCP!',
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }))
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find(t => t.name === request.params.name);
  const result = await tool.handler();
  return { content: [{ type: 'text', text: String(result) }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ MCP Server running');
}

main();
```

**5. Build & Test**:
```bash
npm install
npm run build
node dist/index.js
```

### Task 3: Debug an MCP Server

**Enable Debug Logging**:
```typescript
// In index.ts, before server.connect()
process.env.DEBUG = 'mcp:*';

// Add verbose logging
console.error('🔍 Debug: Tool called:', toolName);
console.error('🔍 Debug: Arguments:', JSON.stringify(args, null, 2));
```

**Test with Manual Input**:
```bash
# Start server
node dist/index.js

# Send JSON-RPC request (paste this as stdin)
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### Task 4: Update Documentation

**When to Update Docs**:
- New MCP server added
- New tools added to existing server
- Configuration changes
- Breaking changes

**Files to Update**:
1. Project README.md
2. Root README.md (if major change)
3. SKYNET_MCP_ECOSYSTEM.md (if adding to core servers)
4. CLAUDE.md (this file - for architectural changes)

---

## Security Considerations

### 1. Path Traversal Protection

**Problem**: Users could access files outside allowed directories

**Solution**:
```typescript
import path from 'path';

function validateFilePath(userPath: string, basePath: string): string {
  const resolved = path.resolve(basePath, userPath);
  if (!resolved.startsWith(basePath)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}
```

### 2. Command Injection Prevention

**Problem**: User input could execute arbitrary commands

**Bad**:
```typescript
// NEVER DO THIS
await exec(`ls ${userInput}`);
```

**Good**:
```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Use execFile with argument array
await execFileAsync('ls', [userInput]);
```

### 3. Anti-SSRF (Server-Side Request Forgery)

**For Web Scraping Tools**:
```typescript
const PRIVATE_IP_PATTERNS = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private class A
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // Private class B
  /^192\.168\./,               // Private class C
  /^169\.254\./,               // Link-local
];

function isPrivateIP(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some(pattern => pattern.test(hostname));
}
```

### 4. Rate Limiting

**Prevent Abuse**:
```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const recentRequests = requests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }
}
```

### 5. Input Validation with Zod

**Always Validate**:
```typescript
const schema = z.object({
  email: z.string().email(),
  port: z.number().min(1).max(65535),
  url: z.string().url(),
  path: z.string().regex(/^[a-zA-Z0-9/_-]+$/), // Whitelist chars
});

// Throws if invalid
const validated = schema.parse(userInput);
```

### 6. Secrets Management

**Never Commit Secrets**:
```bash
# .gitignore
.env
*.pem
*.key
credentials.json
config.local.json
```

**Use Environment Variables**:
```typescript
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable required');
}
```

---

## Performance Guidelines

### 1. Lazy Loading

**Load tools on-demand** instead of all at startup:
```typescript
// Instead of importing all tools at once
const tools = {
  async getDockerTools() {
    return await import('./tools/docker-tools.js');
  },
};
```

### 2. Connection Pooling

**For Git Operations**:
```typescript
class GitPool {
  private pool: SimpleGit[] = [];

  async getGit(repoPath: string): Promise<SimpleGit> {
    // Reuse existing Git instance if available
    const existing = this.pool.find(g => g.cwd === repoPath);
    if (existing) return existing;

    const git = simpleGit(repoPath);
    this.pool.push(git);
    return git;
  }
}
```

### 3. Caching

**Cache Expensive Operations**:
```typescript
class CachedExecutor {
  private cache = new Map<string, { result: any, timestamp: number }>();

  async execute(command: string, ttl: number = 60000): Promise<any> {
    const cached = this.cache.get(command);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.result;
    }

    const result = await executeCommand(command);
    this.cache.set(command, { result, timestamp: Date.now() });
    return result;
  }
}
```

### 4. Parallel Processing

**Process Multiple Items in Parallel**:
```typescript
// Sequential (slow)
for (const image of images) {
  await processImage(image);
}

// Parallel (fast)
await Promise.all(images.map(image => processImage(image)));

// Parallel with concurrency limit
const limit = pLimit(5); // Max 5 concurrent
await Promise.all(images.map(image => limit(() => processImage(image))));
```

### 5. Streaming for Large Files

**Instead of Loading Entire File**:
```typescript
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

async function processLargeFile(filePath: string) {
  const fileStream = createReadStream(filePath);
  const rl = createInterface({ input: fileStream });

  for await (const line of rl) {
    processLine(line); // Process line-by-line
  }
}
```

### 6. Debouncing File Watcher Events

**Prevent Event Flooding**:
```typescript
import { debounce } from 'lodash-es';

const debouncedHandler = debounce((event) => {
  processEvent(event);
}, 300); // Wait 300ms after last event

watcher.on('change', debouncedHandler);
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: "Module not found" Error

**Symptoms**: `Error: Cannot find module '@modelcontextprotocol/sdk'`

**Solution**:
```bash
# Ensure dependencies are installed
npm install

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be >= 18.0.0
```

#### Issue 2: MCP Server Not Appearing in Claude Code

**Symptoms**: `claude mcp list` doesn't show your server

**Solution**:
```bash
# 1. Verify config file location
ls ~/.config/claude/config.json  # Linux
ls ~/Library/Application\ Support/Claude/claude_desktop_config.json  # macOS

# 2. Verify config JSON is valid
cat ~/.config/claude/config.json | jq .  # Should not error

# 3. Check paths are absolute
cat ~/.config/claude/config.json | grep args
# Should show: "/absolute/path/to/dist/index.js"

# 4. Verify compiled file exists
ls /absolute/path/to/dist/index.js

# 5. Restart Claude Code CLI
```

#### Issue 3: TypeScript Compilation Errors

**Symptoms**: `npm run build` fails with type errors

**Solution**:
```bash
# Clear build cache
rm -rf dist/

# Check TypeScript version
npx tsc --version

# Install/update TypeScript
npm install -D typescript@latest

# Check tsconfig.json is correct
cat tsconfig.json

# Build with verbose output
npx tsc --verbose
```

#### Issue 4: Tool Returns Empty Result

**Symptoms**: MCP tool executes but returns nothing

**Debug**:
```typescript
// Add debug logging
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error('🔍 Tool called:', request.params.name);
  console.error('🔍 Arguments:', JSON.stringify(request.params.arguments, null, 2));

  try {
    const result = await tool.handler(args);
    console.error('🔍 Result:', result);
    return { content: [{ type: 'text', text: String(result) }] };
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
});
```

#### Issue 5: Permission Denied Errors

**Symptoms**: `EACCES: permission denied` or `sudo: no tty present`

**Solution**:
```bash
# For file operations - fix permissions
chmod +r file.txt

# For sudo commands - configure sudoers (careful!)
# Add to /etc/sudoers.d/claude-mcp
your_username ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/systemctl

# Or run Claude Code CLI with sudo (not recommended)
```

#### Issue 6: High Memory Usage

**Symptoms**: Server consumes excessive memory

**Debug & Fix**:
```typescript
// Monitor memory
console.error('Memory usage:', process.memoryUsage());

// Fix: Clear caches periodically
setInterval(() => {
  cache.clear();
  console.error('Cache cleared');
}, 60000); // Every minute

// Fix: Limit concurrent operations
import pLimit from 'p-limit';
const limit = pLimit(3); // Max 3 concurrent
```

### Debugging Checklist

- [ ] Node.js version >= 18.0.0
- [ ] Dependencies installed (`npm install`)
- [ ] Code compiles (`npm run build`)
- [ ] Config file exists and is valid JSON
- [ ] Paths in config are absolute
- [ ] Compiled file (`dist/index.js`) exists
- [ ] File has execute permissions
- [ ] Claude Code CLI restarted after config changes
- [ ] Check stderr output for error messages
- [ ] Environment variables set (if needed)

---

## Future Roadmap

### Short Term (v1.1-1.2) - Next 1-2 Months

**Priority: HIGH**

1. **Testing & CI/CD**
   - Add unit tests (Jest) - target 70% coverage
   - Integration tests for MCP tools
   - GitHub Actions CI/CD pipeline
   - Automated builds on PR
   - ESLint + Prettier enforcement

2. **GitHub/GitLab CLI Integration** (skynet-project-mcp)
   - Wrap `gh` CLI: PR create/list/merge, Issue create/list/close
   - Wrap `glab` CLI: MR create/list, Pipeline status
   - Auto-detect platform from `.git/config`

3. **FileWatcher Enhancements** (skynet-filewatcher-mcp)
   - Improve `renamed` event detection (hash comparison)
   - Add webhook notifications (n8n, Discord, Slack)
   - Rate limiting and batching (max 100 events/sec)
   - Circuit breaker for event flooding

4. **Creative Enhancements** (skynet-creative-mcp)
   - OCR integration (Tesseract) for text extraction
   - PDF manipulation (pdf-lib): merge, split, extract images
   - Multi-language OCR support

### Medium Term (v1.3-1.5) - 2-3 Months

**Priority: MEDIUM**

1. **Performance Optimizations**
   - Redis caching layer
   - Connection pooling (Git, Sharp)
   - Lazy loading of tools
   - Parallel batch processing

2. **Security Hardening**
   - RBAC (Role-Based Access Control)
   - API key authentication
   - Audit logging (all tool calls)
   - Rate limiting per user/tool
   - Security scanning in CI/CD

3. **Monitoring & Observability**
   - Prometheus metrics export
   - Grafana dashboards
   - Distributed tracing (OpenTelemetry)
   - Structured JSON logging
   - Error tracking (Sentry)

4. **Procedural Generation** (skynet-creative-mcp)
   - Chart generation (plotly.js): bar, line, pie, scatter
   - Diagram generation (mermaid): flowchart, sequence, class
   - Placeholder image generation
   - Gradient and pattern generation

5. **MCP Registry**
   - Central discovery and installation
   - CLI: `skynet mcp install <name>`
   - Versioning and auto-updates
   - Ratings and reviews

### Long Term (v2.0+) - 6-12 Months

**Priority: LOW**

1. **MCP Control Panel (Web UI)**
   - Real-time dashboard (status, metrics, logs)
   - Visual configuration editor
   - Tool playground (test tools interactively)
   - User management (RBAC)

2. **Inter-MCP Communication**
   - Event bus (Redis Pub/Sub)
   - Message queue (BullMQ)
   - Orchestrator for chaining tools
   - Example: FileWatcher → Creative → Project MCP

3. **AI Agents**
   - Autonomous DevOps agent (monitor → test → build → deploy)
   - Content agent (watch → optimize → commit → publish)
   - LangChain + Claude API integration

4. **Multi-Cloud Support**
   - `skynet-aws-mcp`: EC2, S3, Lambda, etc.
   - `skynet-gcp-mcp`: Compute Engine, Cloud Storage, etc.
   - `skynet-azure-mcp`: VMs, Blob Storage, etc.

5. **Workflow Engine**
   - Visual workflow builder (drag-and-drop)
   - Nodes = MCP tools
   - Conditions, loops, parallel execution
   - Scheduler (cron)
   - Event-driven triggers (webhooks)

6. **Plugin System**
   - Hot reload plugins without restart
   - Sandboxed execution (isolate plugins)
   - Plugin marketplace
   - Automatic versioning

### Success Metrics (KPIs)

**Adoption**:
- Active users: >1,000 (Year 1), >10,000 (Year 2)
- Deployed instances: >500
- Tool calls per day: >100,000

**Quality**:
- Uptime: >99.9%
- P95 latency: <100ms
- Error rate: <0.1%

**Community**:
- GitHub stars: >1,000 (Year 1), >5,000 (Year 2)
- Contributors: >10 (Year 1), >50 (Year 2)
- Issue resolution: >90% within 7 days

---

## Best Practices for AI Assistants

### When Working with This Codebase

1. **Always Read Before Modifying**
   - Never propose changes to code you haven't read
   - Use `Read` tool to examine files first
   - Understand context before suggesting modifications

2. **Follow Existing Patterns**
   - Study similar tools in the same MCP server
   - Match naming conventions (snake_case for tools, camelCase for TypeScript)
   - Use existing utility functions (`executeCommand`, `formatOutput`)
   - Keep consistent with Zod schema patterns

3. **Validate & Build Before Committing**
   - Always run `npm run build` after changes
   - Fix TypeScript errors before committing
   - Test manually with Claude Code CLI if possible
   - Check that no build artifacts are committed

4. **Security First**
   - Validate all user inputs with Zod
   - Sanitize file paths (prevent traversal)
   - Escape command arguments (prevent injection)
   - Add confirmation for destructive operations

5. **Document Your Changes**
   - Update README.md if adding new tools
   - Add JSDoc comments for complex functions
   - Update CLAUDE.md for architectural changes
   - Write clear commit messages

6. **Error Handling**
   - Always wrap tool execution in try-catch
   - Return meaningful error messages
   - Use emoji indicators (❌ for errors, ✅ for success)
   - Log errors to stderr, not stdout

7. **Performance Awareness**
   - Don't block on long-running operations
   - Use streaming for large files
   - Implement caching for expensive operations
   - Consider rate limiting for external APIs

8. **Test Incrementally**
   - Test each new tool individually
   - Verify error cases work correctly
   - Check edge cases (empty input, null, undefined)
   - Add unit tests when possible

### When Helping Users

1. **Understand Their Goal**
   - Ask clarifying questions if unclear
   - Determine if they want to use existing tools or create new ones
   - Check if the feature already exists elsewhere in the repo

2. **Provide Complete Solutions**
   - Include all necessary imports
   - Show full file paths
   - Explain configuration steps
   - Provide testing instructions

3. **Reference Documentation**
   - Point users to relevant README files
   - Reference SKYNET_MCP_ECOSYSTEM.md for architecture
   - Direct to ROADMAP for future features
   - Link to official MCP SDK docs when needed

4. **Be Proactive About Issues**
   - Warn about potential security issues
   - Suggest performance optimizations
   - Recommend testing approaches
   - Point out potential breaking changes

---

## Quick Reference

### Essential Commands

```bash
# Installation
./install-all-mcp.sh              # Install all core MCP servers
cd <project> && ./install.sh      # Install individual project
npm install && npm run build      # Manual installation

# Development
npm run dev                        # Run in development mode
npm run watch                      # Watch mode (auto-rebuild)
npm run build                      # Compile TypeScript
npm start                          # Run compiled code

# Testing
npm test                           # Run tests
npm run lint                       # Lint code
npm run format                     # Format code

# Git
git checkout -b claude/<feature>   # Create feature branch
git add . && git commit -m "msg"   # Commit changes
git push -u origin <branch>        # Push to remote
gh pr create                       # Create pull request

# MCP
claude mcp list                    # List configured servers
claude mcp status                  # Check server status
```

### Important File Locations

```
~/.config/claude/config.json                      # MCP config (Linux)
~/Library/Application Support/Claude/...          # MCP config (macOS)
/home/user/Skynet_depot/README.md                 # Main README
/home/user/Skynet_depot/SKYNET_MCP_ECOSYSTEM.md   # Architecture guide
/home/user/Skynet_depot/ROADMAP_AND_IMPROVEMENTS.md  # Future plans
/home/user/Skynet_depot/claude-mcp-config.example.json  # Config template
```

### Key Documentation

- **README.md**: Project overview and quick start
- **SKYNET_MCP_ECOSYSTEM.md**: Complete ecosystem documentation
- **MCP_SERVERS_GUIDE.md**: Combined server guide
- **ROADMAP_AND_IMPROVEMENTS.md**: Development roadmap and priorities
- **DEVASSIST_COMPLETE_SPECS.md**: DevAssist specifications
- **Individual READMEs**: Project-specific documentation

### Support & Resources

- **GitHub Repository**: https://github.com/flamstyl/Skynet_depot
- **MCP SDK Documentation**: https://modelcontextprotocol.io/
- **TypeScript Docs**: https://www.typescriptlang.org/docs/
- **Zod Documentation**: https://zod.dev/

---

## Conclusion

This guide provides comprehensive information for AI assistants working with the Skynet MCP Ecosystem. The repository follows consistent patterns, uses modern TypeScript best practices, and implements a modular architecture that makes it easy to add new capabilities.

**Key Takeaways**:

1. **Consistent Patterns**: All MCP servers follow the same structure
2. **Type Safety**: Zod schemas ensure runtime type safety
3. **Modularity**: Tools are organized by domain (package, docker, system, etc.)
4. **Security**: Multiple layers of protection (validation, sanitization, rate limiting)
5. **Documentation**: Extensive docs available for guidance
6. **Active Development**: Roadmap shows clear direction for future enhancements

When in doubt, consult existing code for examples, follow the patterns established in this repository, and prioritize security and type safety in all implementations.

**Happy Coding! 🚀**

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-23
**Maintained By**: Skynet Depot
**License**: MIT
