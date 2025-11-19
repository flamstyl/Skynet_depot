# Claude DevBox - Skynet Autonomous Development Environment

## 🎯 Vision

Claude DevBox est une infrastructure MCP complète permettant à Claude CLI de devenir un développeur autonome capable de :
- **Coder** : Générer du code dans n'importe quel langage
- **Compiler** : Builder et packager les projets
- **Exécuter** : Lancer le code dans un environnement sandboxé
- **Tester** : Valider sur Linux et Windows
- **Corriger** : Auto-correction basée sur stderr en boucle
- **Livrer** : Produire des artifacts fonctionnels et testés

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLAUDE CLI / CLAUDE CODE                    │
│                    (Brain - Code Generation)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ MCP Protocol
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                     WEB EDITOR INTERFACE                         │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │  File    │  Code    │  Output  │  Stderr  │ Terminal │      │
│  │  Tree    │  Editor  │  Panel   │  Panel   │  Panel   │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
│                Monaco Editor + xterm.js                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ WebSocket + REST API
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NODE.JS BACKEND SERVER                        │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  API Routes  │  │  WebSocket   │  │ File Manager │          │
│  │  /run /exec  │  │  Live Logs   │  │  Workspace   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Docker Runner │  │  MCP Bridge  │  │ Auto-Fixer   │          │
│  │  Orchestrate │  │  Claude Sync │  │  Loop Logic  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────┬───────────────────┬─────────────────────────────────┘
            │                   │
            ↓                   ↓
┌─────────────────────┐  ┌─────────────────────┐
│  DOCKER SANDBOX     │  │   VM ORCHESTRATOR   │
│                     │  │                     │
│  ┌───────────────┐  │  │  ┌──────────────┐  │
│  │ Ubuntu/Debian │  │  │  │ QEMU Linux   │  │
│  │               │  │  │  │              │  │
│  │ - Python      │  │  │  │ Test Runner  │  │
│  │ - Node.js     │  │  │  └──────────────┘  │
│  │ - Build Tools │  │  │                     │
│  │ - Git         │  │  │  ┌──────────────┐  │
│  │               │  │  │  │ VirtualBox   │  │
│  │ /workspace/   │  │  │  │ Windows Test │  │
│  │   input/      │  │  │  │              │  │
│  │   output/     │  │  │  │ PowerShell   │  │
│  └───────────────┘  │  │  └──────────────┘  │
│                     │  │                     │
│  Captures:          │  │  Captures:          │
│  - stdout.log       │  │  - install.log      │
│  - stderr.log       │  │  - test_results.xml │
│  - exitcode         │  │  - screenshots      │
└─────────────────────┘  └─────────────────────┘
```

## 🔄 Workflow - Pipeline d'Auto-Correction

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User Request                                               │
│    "Create a Python script that scrapes weather data"        │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Claude Generates Code                                      │
│    code.py + requirements.txt                                 │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. DevBox Saves to /workspace/input/                         │
│    Snapshots to /runs/<timestamp>/code_snapshot/             │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Docker Execution                                           │
│    - Creates container                                        │
│    - Mounts /workspace                                        │
│    - Runs: python code.py                                     │
│    - Captures stdout, stderr, exitcode                        │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
              ┌──────┴───────┐
              │              │
         exitcode=0      exitcode≠0
              │              │
              ↓              ↓
    ┌──────────────┐  ┌──────────────────────────────────┐
    │   SUCCESS!   │  │ 5. Error Detected                │
    │              │  │    stderr contains traceback     │
    │  Save logs   │  └──────────┬───────────────────────┘
    │  Move output │             ↓
    │  to /output/ │  ┌──────────────────────────────────┐
    └──────────────┘  │ 6. Send to Claude for Fix        │
                      │    Prompt:                       │
                      │    "Here's the code: <code>      │
                      │     Here's the error: <stderr>   │
                      │     Fix it and return working    │
                      │     code."                       │
                      └──────────┬───────────────────────┘
                                 ↓
                      ┌──────────────────────────────────┐
                      │ 7. Claude Returns Fixed Code     │
                      │    attempt_2.py                  │
                      └──────────┬───────────────────────┘
                                 ↓
                      ┌──────────────────────────────────┐
                      │ 8. Replace code & Re-execute     │
                      │    Loop back to step 4           │
                      │    Max retries: 5                │
                      │    Timeout: 300s per attempt     │
                      └──────────────────────────────────┘
```

## 📦 Component Details

### 1. Web Editor Interface

**Technology Stack:**
- **Frontend Framework**: Vanilla JS / React (lightweight)
- **Code Editor**: Monaco Editor (VS Code engine)
- **Terminal**: xterm.js + xterm-addon-fit
- **UI Components**: Custom CSS Grid layout
- **Real-time Communication**: WebSocket

**Panels:**
1. **File Tree Panel**: Browse /workspace structure
2. **Code Editor Panel**: Monaco with syntax highlighting
3. **Output Panel**: Live stdout stream
4. **Stderr Panel**: Error logs with stack traces
5. **Terminal Panel**: Direct Docker shell access
6. **Build Panel**: Compilation outputs

**Features:**
- Split-view resizable panels
- Syntax highlighting for 50+ languages
- Auto-save on change
- Keyboard shortcuts (Ctrl+S, Ctrl+R)
- Dark/Light themes

### 2. Node.js Backend Server

**Core Modules:**

#### 2.1 API Routes (`server/routes/api.js`)
```
POST /api/run
  - Executes code in Docker sandbox
  - Body: { language, code, args, env }
  - Response: { runId, stdout, stderr, exitCode }

POST /api/exec
  - Executes arbitrary command in container
  - Body: { command, workdir }

POST /api/lint
  - Runs linters (eslint, pylint, etc.)

POST /api/build
  - Builds project (npm build, cargo build, etc.)

GET /api/logs/:runId
  - Retrieves historical logs

POST /api/autofix
  - Triggers auto-correction loop
  - Body: { code, error, language, maxRetries }
```

#### 2.2 WebSocket Service (`server/services/ws.js`)
```javascript
Events:
- 'execute' → Run code
- 'stdout' → Stream stdout
- 'stderr' → Stream stderr
- 'exit' → Process completed
- 'docker_log' → Container logs
- 'fix_attempt' → Correction iteration
```

#### 2.3 Docker Runner (`server/services/docker_runner.js`)
- Creates ephemeral containers
- Mounts /workspace as volume
- Sets resource limits (CPU: 2, RAM: 4GB)
- Network isolation with internet access
- Captures all streams
- Auto-cleanup after execution

#### 2.4 File Manager (`server/services/file_manager.js`)
- CRUD operations on /workspace
- Snapshot creation
- File watching
- Git integration

#### 2.5 MCP Bridge (`server/services/mcp_bridge.js`)
- Connects to Claude CLI via MCP protocol
- Sends code for review/fixing
- Receives corrections
- Maintains conversation context

#### 2.6 Auto-Fixer (`server/services/auto_fixer.js`)
```javascript
Algorithm:
1. Execute code
2. If error → Extract stderr
3. Send to Claude with context
4. Receive fix
5. Apply fix
6. Retry (max 5 attempts)
7. Return final result
```

### 3. Docker Sandbox

**Dockerfile:**
```dockerfile
FROM ubuntu:22.04

# Install essentials
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    nodejs npm \
    git wget curl \
    build-essential gcc g++ make cmake \
    openjdk-17-jdk \
    rustc cargo \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -s /bin/bash devbox

# Workspace
RUN mkdir -p /workspace/input /workspace/output
RUN chown -R devbox:devbox /workspace

USER devbox
WORKDIR /workspace

CMD ["/bin/bash"]
```

**Security:**
- Non-root execution
- Read-only filesystem (except /workspace)
- Network egress allowed (for package downloads)
- No privileged mode
- Resource limits enforced

### 4. VM Orchestrator

**Linux VM (QEMU):**
```bash
# Boot headless Ubuntu VM
qemu-system-x86_64 \
  -m 2048 \
  -smp 2 \
  -hda ubuntu-test.qcow2 \
  -nographic \
  -device e1000,netdev=net0 \
  -netdev user,id=net0,hostfwd=tcp::2222-:22

# SSH into VM
ssh -p 2222 testuser@localhost

# Copy code
scp -P 2222 code.py testuser@localhost:/home/testuser/

# Run test
ssh -p 2222 testuser@localhost "python3 code.py"

# Retrieve results
scp -P 2222 testuser@localhost:/home/testuser/output.log ./
```

**Windows VM (VirtualBox):**
```powershell
# Start headless Windows VM
VBoxManage startvm "Windows-Test" --type headless

# Execute via VBoxManage
VBoxManage guestcontrol "Windows-Test" run \
  --exe "C:\Python39\python.exe" \
  --username testuser \
  --password testpass \
  -- code.py

# Retrieve logs
VBoxManage guestcontrol "Windows-Test" copyfrom \
  "C:\output.log" ./output_windows.log
```

**Test Automation:**
- Pre-configured VM images
- Snapshot/restore for clean state
- Automated test execution
- Result collection
- Screenshot capture on failure

### 5. Auto-Correction System

**Correction Loop Flow:**

```javascript
async function autofixLoop(code, language, maxRetries = 5) {
  let attempt = 0;
  let currentCode = code;

  while (attempt < maxRetries) {
    // Execute
    const result = await dockerRunner.execute(currentCode, language);

    // Check success
    if (result.exitCode === 0 && result.stderr === '') {
      return { success: true, code: currentCode, attempts: attempt + 1 };
    }

    // Send to Claude for fix
    const fixPrompt = `
      The following ${language} code has errors:

      \`\`\`${language}
      ${currentCode}
      \`\`\`

      Error output:
      \`\`\`
      ${result.stderr}
      \`\`\`

      Please fix the code and return ONLY the corrected code.
    `;

    const fixedCode = await mcpBridge.sendToClaude(fixPrompt);
    currentCode = extractCode(fixedCode);

    // Log attempt
    await logger.logFixAttempt(attempt, result.stderr, fixedCode);

    attempt++;
  }

  return { success: false, code: currentCode, attempts: maxRetries };
}
```

### 6. Logging & Persistence

**Run Directory Structure:**
```
/runs/<timestamp>/
  ├── code_snapshot/
  │   ├── main.py
  │   ├── requirements.txt
  │   └── config.json
  ├── stdout.log
  ├── stderr.log
  ├── container_info.json
  ├── fixed_attempts.json
  │   └── [
  │         { attempt: 1, error: "...", fix: "..." },
  │         { attempt: 2, error: "...", fix: "..." }
  │       ]
  ├── metadata.json
  └── output/
      └── result.txt
```

**Metadata Format:**
```json
{
  "runId": "20250119_143022_a3f2",
  "language": "python",
  "startTime": "2025-01-19T14:30:22Z",
  "endTime": "2025-01-19T14:30:45Z",
  "duration": 23000,
  "exitCode": 0,
  "attempts": 2,
  "success": true,
  "dockerImage": "devbox:latest",
  "containerId": "abc123def456"
}
```

## 🔐 Security Considerations

1. **Sandbox Isolation**: All code runs in Docker containers
2. **Resource Limits**: CPU/RAM/Disk quotas enforced
3. **Network Policy**: Egress allowed, ingress blocked
4. **File Permissions**: Non-root user in containers
5. **Input Validation**: Sanitize all user inputs
6. **Secret Management**: Never log sensitive data
7. **VM Isolation**: Snapshots prevent persistence attacks

## 🚀 Deployment Models

### Local Development
```bash
npm install
npm run dev
# Editor: http://localhost:3000
# API: http://localhost:4000
```

### Docker Compose
```yaml
version: '3.8'
services:
  editor:
    build: ./editor
    ports: ["3000:3000"]

  server:
    build: ./server
    ports: ["4000:4000"]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./workspace:/workspace
```

### Cloud (Skynet Infrastructure)
- Kubernetes deployment
- Persistent volumes for /workspace
- Horizontal scaling of backend
- Load balancer for editor

## 📊 Performance Targets

- **Code Execution**: < 5s for simple scripts
- **Docker Startup**: < 2s per container
- **VM Boot**: < 30s for Linux, < 60s for Windows
- **Auto-Fix Loop**: < 60s for 3 iterations
- **WebSocket Latency**: < 100ms for logs

## 🧩 Extension Points

1. **Language Support**: Add new runtimes to Dockerfile
2. **Linters/Formatters**: Plugin system for code quality tools
3. **Cloud Providers**: Deploy to AWS/GCP/Azure
4. **CI/CD Integration**: GitHub Actions, GitLab CI
5. **MCP Extensions**: Custom tools for Claude

## 📚 API Reference

See [api_reference.md](./api_reference.md) for complete REST API documentation.

## 🎓 Learning Resources

- Monaco Editor: https://microsoft.github.io/monaco-editor/
- xterm.js: https://xtermjs.org/
- dockerode: https://github.com/apocas/dockerode
- QEMU: https://www.qemu.org/documentation/
- MCP Protocol: https://modelcontextprotocol.io/

## 🔮 Future Enhancements

1. **Multi-file Projects**: Support for complex codebases
2. **Debugger Integration**: Step-through debugging in UI
3. **Collaboration**: Multi-user real-time editing
4. **AI Planning**: Task decomposition before coding
5. **GitOps**: Auto-commit successful runs
6. **Metrics Dashboard**: Success rate, avg fix time
7. **Cloud VMs**: On-demand VM provisioning
8. **Mobile Testing**: Android/iOS emulators

---

**Built with 🔥 for Skynet by Claude Code**
