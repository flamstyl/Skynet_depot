# Claude DevBox - API Reference

## REST API Endpoints

Base URL: `http://localhost:4000/api`

### Execution Endpoints

#### POST /api/run

Execute code in Docker sandbox.

**Request:**
```json
{
  "language": "python|javascript|java|rust|go|cpp",
  "code": "print('Hello World')",
  "files": {
    "main.py": "...",
    "utils.py": "..."
  },
  "args": ["--verbose"],
  "env": {
    "DEBUG": "true"
  },
  "timeout": 30000,
  "autofix": true,
  "maxRetries": 5
}
```

**Response:**
```json
{
  "runId": "20250119_143022_a3f2",
  "success": true,
  "exitCode": 0,
  "stdout": "Hello World\n",
  "stderr": "",
  "duration": 1234,
  "attempts": 1,
  "containerInfo": {
    "id": "abc123",
    "image": "devbox:latest"
  },
  "logs": [
    {
      "timestamp": "2025-01-19T14:30:22Z",
      "level": "info",
      "message": "Container started"
    }
  ]
}
```

#### POST /api/exec

Execute arbitrary command in existing container.

**Request:**
```json
{
  "command": "ls -la",
  "workdir": "/workspace",
  "containerId": "abc123" // optional, creates new if not provided
}
```

**Response:**
```json
{
  "stdout": "total 12\ndrwxr-xr-x ...",
  "stderr": "",
  "exitCode": 0
}
```

#### POST /api/lint

Run linters/formatters on code.

**Request:**
```json
{
  "language": "python",
  "code": "...",
  "linters": ["pylint", "black", "mypy"]
}
```

**Response:**
```json
{
  "results": {
    "pylint": {
      "score": 8.5,
      "issues": [
        {
          "line": 10,
          "column": 5,
          "severity": "warning",
          "message": "Line too long (120/100)"
        }
      ]
    },
    "black": {
      "formatted": true,
      "diff": "..."
    }
  }
}
```

#### POST /api/build

Build project using appropriate build tool.

**Request:**
```json
{
  "language": "rust",
  "buildTool": "cargo",
  "command": "build --release",
  "workdir": "/workspace"
}
```

**Response:**
```json
{
  "success": true,
  "stdout": "Compiling myproject v0.1.0...",
  "artifacts": [
    "/workspace/target/release/myproject"
  ],
  "duration": 45000
}
```

### Auto-Fix Endpoints

#### POST /api/autofix

Trigger auto-correction loop.

**Request:**
```json
{
  "language": "python",
  "code": "...",
  "maxRetries": 5,
  "timeout": 300000,
  "context": "This script should scrape weather data"
}
```

**Response:**
```json
{
  "success": true,
  "finalCode": "...",
  "attempts": 3,
  "history": [
    {
      "attempt": 1,
      "error": "ModuleNotFoundError: No module named 'requests'",
      "fix": "Added requests to requirements.txt"
    },
    {
      "attempt": 2,
      "error": "AttributeError: 'NoneType' object has no attribute 'text'",
      "fix": "Added null check for response"
    },
    {
      "attempt": 3,
      "error": null,
      "success": true
    }
  ]
}
```

### File Management

#### GET /api/files

List files in workspace.

**Query Params:**
- `path`: Directory path (default: /workspace)

**Response:**
```json
{
  "files": [
    {
      "name": "main.py",
      "path": "/workspace/main.py",
      "size": 1234,
      "type": "file",
      "modified": "2025-01-19T14:30:22Z"
    },
    {
      "name": "utils",
      "path": "/workspace/utils",
      "type": "directory",
      "children": 5
    }
  ]
}
```

#### GET /api/files/read

Read file content.

**Query Params:**
- `path`: File path

**Response:**
```json
{
  "path": "/workspace/main.py",
  "content": "print('Hello')",
  "encoding": "utf-8",
  "size": 15
}
```

#### POST /api/files/write

Write file to workspace.

**Request:**
```json
{
  "path": "/workspace/main.py",
  "content": "print('Hello World')",
  "encoding": "utf-8"
}
```

#### DELETE /api/files

Delete file or directory.

**Request:**
```json
{
  "path": "/workspace/old_file.py"
}
```

### Logs & History

#### GET /api/logs/:runId

Retrieve logs for specific run.

**Response:**
```json
{
  "runId": "20250119_143022_a3f2",
  "logs": [
    {
      "timestamp": "2025-01-19T14:30:22Z",
      "level": "info",
      "source": "docker",
      "message": "Container started"
    }
  ],
  "stdout": "...",
  "stderr": "...",
  "metadata": { ... }
}
```

#### GET /api/runs

List recent runs.

**Query Params:**
- `limit`: Max results (default: 20)
- `offset`: Pagination offset
- `success`: Filter by success status

**Response:**
```json
{
  "runs": [
    {
      "runId": "...",
      "language": "python",
      "success": true,
      "duration": 1234,
      "timestamp": "2025-01-19T14:30:22Z"
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

### VM Testing

#### POST /api/vm/test/linux

Test code in Linux VM.

**Request:**
```json
{
  "code": "...",
  "distribution": "ubuntu-22.04|debian-11",
  "testScript": "pytest tests/",
  "snapshot": "clean-state"
}
```

**Response:**
```json
{
  "success": true,
  "vmId": "linux-vm-1",
  "stdout": "...",
  "stderr": "...",
  "testResults": {
    "passed": 45,
    "failed": 2,
    "skipped": 1
  },
  "screenshots": [
    "/runs/.../screenshot_1.png"
  ]
}
```

#### POST /api/vm/test/windows

Test code in Windows VM.

**Request:**
```json
{
  "code": "...",
  "version": "Windows-10|Windows-11",
  "testScript": "pytest tests/",
  "snapshot": "clean-state"
}
```

### Health & Status

#### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 123456,
  "docker": {
    "connected": true,
    "version": "24.0.7"
  },
  "vms": {
    "linux": "running",
    "windows": "stopped"
  },
  "disk": {
    "workspace": "5.2 GB",
    "runs": "12.8 GB"
  }
}
```

## WebSocket API

Connect to: `ws://localhost:4000/ws`

### Client → Server Events

#### `execute`

Execute code with real-time streaming.

```json
{
  "event": "execute",
  "data": {
    "language": "python",
    "code": "for i in range(10): print(i)"
  }
}
```

#### `terminal`

Send input to Docker terminal.

```json
{
  "event": "terminal",
  "data": {
    "input": "ls -la\n",
    "containerId": "abc123"
  }
}
```

#### `subscribe`

Subscribe to specific log streams.

```json
{
  "event": "subscribe",
  "data": {
    "streams": ["stdout", "stderr", "docker", "autofix"]
  }
}
```

### Server → Client Events

#### `stdout`

Real-time stdout stream.

```json
{
  "event": "stdout",
  "data": {
    "runId": "...",
    "chunk": "Hello World\n",
    "timestamp": "2025-01-19T14:30:22Z"
  }
}
```

#### `stderr`

Real-time stderr stream.

```json
{
  "event": "stderr",
  "data": {
    "runId": "...",
    "chunk": "Error: ...\n",
    "timestamp": "2025-01-19T14:30:23Z"
  }
}
```

#### `exit`

Process completed.

```json
{
  "event": "exit",
  "data": {
    "runId": "...",
    "exitCode": 0,
    "duration": 1234
  }
}
```

#### `docker_log`

Container management logs.

```json
{
  "event": "docker_log",
  "data": {
    "level": "info",
    "message": "Container created",
    "containerId": "abc123"
  }
}
```

#### `fix_attempt`

Auto-correction iteration.

```json
{
  "event": "fix_attempt",
  "data": {
    "attempt": 2,
    "totalAttempts": 5,
    "error": "...",
    "status": "fixing"
  }
}
```

#### `fix_success`

Auto-correction completed successfully.

```json
{
  "event": "fix_success",
  "data": {
    "attempts": 3,
    "finalCode": "...",
    "duration": 45000
  }
}
```

## MCP Bridge API

Internal API for Claude CLI integration.

### Send to Claude

```javascript
const response = await mcpBridge.sendToClaude({
  prompt: "Fix this code: ...",
  context: {
    language: "python",
    error: "...",
    previousAttempts: 2
  },
  stream: true
});
```

### Receive from Claude

```javascript
mcpBridge.on('response', (data) => {
  const { code, explanation } = data;
  // Apply fix
});
```

## Error Codes

| Code | Description |
|------|-------------|
| 1000 | Success |
| 2000 | Execution timeout |
| 2001 | Out of memory |
| 2002 | Container creation failed |
| 3000 | Compilation error |
| 3001 | Runtime error |
| 4000 | Auto-fix max retries exceeded |
| 4001 | Auto-fix timeout |
| 5000 | VM not available |
| 5001 | VM snapshot restore failed |
| 6000 | File not found |
| 6001 | Permission denied |
| 9000 | Internal server error |

## Rate Limits

- **Execution**: 60 requests/minute
- **Auto-fix**: 10 requests/minute
- **VM Tests**: 5 requests/minute
- **File Operations**: 120 requests/minute

## Authentication

For production deployments, use API keys:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:4000/api/run
```

## Examples

### Complete Auto-Fix Flow

```javascript
// 1. Execute code
const response = await fetch('http://localhost:4000/api/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    language: 'python',
    code: 'import requests\nprint(requests.get("https://api.github.com").json())',
    autofix: true,
    maxRetries: 5
  })
});

const result = await response.json();
console.log('Success:', result.success);
console.log('Attempts:', result.attempts);
console.log('Final code:', result.finalCode);
```

### WebSocket Real-Time Execution

```javascript
const ws = new WebSocket('ws://localhost:4000/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    event: 'execute',
    data: {
      language: 'python',
      code: 'for i in range(100):\n    print(i)\n    time.sleep(0.1)'
    }
  }));
};

ws.onmessage = (event) => {
  const { event: eventType, data } = JSON.parse(event.data);

  if (eventType === 'stdout') {
    console.log(data.chunk);
  } else if (eventType === 'exit') {
    console.log('Completed with exit code:', data.exitCode);
  }
};
```

---

**Questions? Check the full documentation at [architecture.md](./architecture.md)**
