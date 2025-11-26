# 🎯 Skynet Companion - Complete Usage Example

This document walks through a complete end-to-end usage scenario of Skynet Companion.

---

## 🚀 Scenario: Developer Workflow Enhancement

**User**: Raphaël, a developer working on multiple projects
**Goal**: Use Skynet Companion to enhance productivity throughout the day

---

## 📅 Timeline of Interactions

### 🌅 Morning - 9:00 AM

#### 1️⃣ Startup

Raphaël starts his computer. Skynet Companion auto-launches and appears as a small overlay in the top-right corner:

```
┌─────────────────┐
│  🤖 Skynet      │
└─────────────────┘
```

**State**: Minimized, monitoring clipboard, waiting for hotkey.

---

### 2️⃣ Voice Query - Project Status Check

Raphaël presses **Ctrl+Space** (hotkey):

```
┌────────────────────────────────┐
│  🎤 Listening...               │
│  ●●●●●●●●○○ (wave animation)   │
└────────────────────────────────┘
```

**Raphaël**: *"What did I work on yesterday?"*

**Flow**:
1. `HotkeyService` detects `Ctrl+Space`
2. `OverlayWindow` shows listening indicator
3. `WhisperService` starts recording (3 seconds)
4. Transcription: "What did I work on yesterday?"
5. `MCPClient` sends to backend:
   ```json
   {
     "agent": "claude",
     "content": "What did I work on yesterday?",
     "type": "voice"
   }
   ```
6. Backend forwards to MCP → Claude Code
7. Claude retrieves from `MemoryService` and responds
8. Response displayed in overlay:

```
┌────────────────────────────────┐
│  Assistant (Claude)            │
│  Yesterday you worked on:      │
│  • Skynet Linker CLI           │
│  • Memory Visualizer UI        │
│  • Fixed bug in MCP bridge     │
└────────────────────────────────┘
```

**Memory saved**:
```json
{
  "summary": "Asked about yesterday's work",
  "tags": ["voice", "query", "history"],
  "source": "voice",
  "agent": "claude"
}
```

---

### 3️⃣ Clipboard Analysis - Code Review

Raphaël copies a code snippet from VS Code:

```python
def process_data(items):
    result = []
    for item in items:
        if item.valid:
            result.append(item.transform())
    return result
```

**Flow**:
1. `ClipboardService` detects change
2. Overlay shows notification:

```
┌────────────────────────────────┐
│  📋 Clipboard updated          │
│  "def process_data(items)..."  │
│  ───────────────────────────   │
│  Quick Actions:                │
│  [📝 Summarize] [💡 Explain]   │
│  [✨ Improve]   [🔍 Analyze]    │
└────────────────────────────────┘
```

3. Raphaël clicks **"✨ Improve"**
4. `MCPClient` calls `/overlay/clipboard/analyze`:
   ```json
   {
     "text": "def process_data...",
     "action": "improve"
   }
   ```
5. Backend uses `clipboard_analyze.md` prompt
6. Claude responds with improved version:

```python
def process_data(items: list[Item]) -> list[Any]:
    """
    Process valid items and transform them.

    Args:
        items: List of Item objects to process

    Returns:
        List of transformed valid items
    """
    return [
        item.transform()
        for item in items
        if item.valid
    ]
```

7. Result shown in QuickActions panel with **[Copy Result]** button

---

### 4️⃣ Chat Interaction - Technical Question

Raphaël opens the Chat panel (💬 tab) and types:

**Input**: *"How do I implement retry logic with exponential backoff in Python?"*

**Flow**:
1. `ChatPanel.SendMessageAsync()` called
2. Message sent to `MCPClient`:
   ```json
   {
     "agent": "claude",
     "content": "How do I implement retry logic...",
     "type": "chat"
   }
   ```
3. Backend forwards to MCP → Claude
4. Claude responds with code example
5. `ChatPanel` displays response with markdown formatting

**Response**:
```
Here's a clean implementation using a decorator:

```python
import time
from functools import wraps

def retry_with_backoff(max_attempts=3, base_delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    delay = base_delay * (2 ** attempt)
                    time.sleep(delay)
        return wrapper
    return decorator

@retry_with_backoff(max_attempts=4, base_delay=2)
def fetch_data():
    # Your code here
    pass
```
```

**Memory saved**:
```json
{
  "summary": "Retry logic with exponential backoff pattern",
  "tags": ["python", "code", "patterns", "retry"],
  "source": "chat",
  "agent": "claude"
}
```

---

### 5️⃣ Memory Search - Recall Previous Work

Later, Raphaël switches to **Memory** panel (🧠 tab) and searches: `"MCP"`

**Flow**:
1. `MemoryService.SearchMemoryAsync("MCP")` called
2. Searches local JSON + MCP long-term storage
3. Returns matching entries:

```
┌────────────────────────────────┐
│  🧠 Memory (3 entries)         │
│  Search: "MCP"                 │
│  ───────────────────────────   │
│  📋 clipboard • 2h ago         │
│  Fixed bug in MCP bridge       │
│  "Resolved WebSocket timeout"  │
│  [technical, bugfix]           │
│  ───────────────────────────   │
│  💬 chat • yesterday           │
│  MCP server integration guide  │
│  "Explained how to use MCP..." │
│  [chat, technical]             │
│  ───────────────────────────   │
│  🎤 voice • 3 days ago         │
│  Asked about MCP setup         │
│  "How to configure MCP..."     │
│  [voice, query]                │
└────────────────────────────────┘
```

Raphaël can click any entry to see full details.

---

### 6️⃣ Agent Switching - Gemini for Research

Raphaël wants to research a new framework. Switches agent to **Gemini**:

**Chat Panel**:
```
Agent: [✨ Gemini ▼]  ● Connected
```

**Input**: *"What's the latest on the Mojo programming language?"*

**Flow**:
1. `ChatPanel` sends to Gemini (agent selector value)
2. Backend routes to Gemini via MCP
3. Gemini provides research-focused response
4. Response displayed in chat

---

### 🌙 End of Day - Memory Export

Before closing, Raphaël exports his day's memories:

**Memory Panel** → **[Export]** button

**Flow**:
1. `MemoryService.ExportMemoryAsync()` called
2. Saves to: `C:\Users\Raphael\Documents\skynet_memory_2025-11-19.json`

**File content** (sample):
```json
[
  {
    "id": "mem_001",
    "summary": "Asked about yesterday's work",
    "content": "What did I work on yesterday?",
    "tags": ["voice", "query", "history"],
    "source": "voice",
    "agent": "claude",
    "created_at": "2025-11-19T09:00:00Z"
  },
  {
    "id": "mem_002",
    "summary": "Improved code snippet",
    "content": "def process_data...",
    "tags": ["clipboard", "code", "python"],
    "source": "clipboard",
    "agent": "claude",
    "created_at": "2025-11-19T10:30:00Z"
  }
]
```

---

## 🔁 Complete Flow Diagram

```
User Action
    │
    ├─► Hotkey (Ctrl+Space)
    │       └─► HotkeyService → WhisperService → Transcription
    │               └─► MCPClient → Backend API → MCP → Claude
    │                       └─► Response → Overlay Display
    │                               └─► MemoryService.AddMemory()
    │
    ├─► Clipboard (Ctrl+C)
    │       └─► ClipboardService → Notification
    │               └─► Quick Action clicked
    │                       └─► MCPClient → Backend → MCP → Response
    │
    ├─► Chat Message
    │       └─► ChatPanel → MCPClient → Backend → MCP → Agent
    │               └─► Streaming Response → Display
    │                       └─► MemoryService.AddMemory()
    │
    └─► Memory Search
            └─► MemoryService.SearchMemoryAsync()
                    └─► Local JSON + MCP Query → Results Display
```

---

## 📊 Data Flow Example

### Complete Request/Response Cycle

**1. User Voice Input**:
```
"Summarize my last 5 clipboard items"
```

**2. Whisper Transcription**:
```json
{
  "transcription": "Summarize my last 5 clipboard items",
  "confidence": 0.96
}
```

**3. C# MCPClient Request**:
```csharp
var message = new MCPMessage
{
    Id = "msg_12345",
    Agent = "claude",
    Content = "Summarize my last 5 clipboard items",
    Context = new Dictionary<string, object>
    {
        ["type"] = "voice",
        ["clipboard_history"] = clipboardService.GetLastItems(5)
    },
    Type = "voice"
};

var response = await mcpClient.ProcessVoiceQueryAsync(message.Content, message.Agent);
```

**4. Backend API Call**:
```http
POST http://localhost:8765/overlay/voice/query
Content-Type: application/json

{
  "query": "Summarize my last 5 clipboard items",
  "agent": "claude"
}
```

**5. MCP WebSocket Message**:
```json
{
  "agent": "claude",
  "content": "Summarize my last 5 clipboard items",
  "context": {
    "type": "voice",
    "clipboard_history": ["item1", "item2", ...]
  }
}
```

**6. Claude Response** (via MCP):
```json
{
  "content": "Your recent clipboard items:\n1. Python code snippet...\n2. Email address...\n3. URL to docs...\n4. JSON data...\n5. SQL query...",
  "agent": "claude",
  "success": true,
  "timestamp": "2025-11-19T14:30:00Z"
}
```

**7. Displayed in Overlay**:
```
┌────────────────────────────────┐
│  Assistant (Claude)            │
│  Your recent clipboard items:  │
│  1. Python code snippet...     │
│  2. Email address...           │
│  3. URL to docs...             │
│  4. JSON data...               │
│  5. SQL query...               │
└────────────────────────────────┘
```

**8. Memory Entry Created**:
```json
{
  "id": "mem_003",
  "summary": "Clipboard items summary request",
  "content": "Summarize my last 5 clipboard items",
  "tags": ["voice", "clipboard", "summary"],
  "source": "voice",
  "agent": "claude",
  "created_at": "2025-11-19T14:30:00Z"
}
```

---

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Space` | Activate voice input |
| `Ctrl+Shift+A` | Toggle overlay visibility |
| `Ctrl+Shift+Q` | Show quick actions |
| `Esc` | Close overlay / Cancel voice |

---

## 💡 Tips & Best Practices

1. **Keep overlay in corner**: Doesn't block your work
2. **Use voice for quick queries**: Faster than typing
3. **Tag clipboard actions**: Better memory search later
4. **Export memories weekly**: Build your knowledge base
5. **Switch agents per task**: Claude for code, Gemini for research, GPT for writing

---

## 🐛 Troubleshooting

### Overlay not appearing?
- Check if backend is running: `http://localhost:8765/health`
- Restart application
- Check Windows notification permissions

### Voice not working?
- Verify microphone permissions
- Check `WhisperService` logs
- Test with mock transcription first

### Agent not responding?
- Verify MCP Server connection
- Check backend logs: `data/logs/companion.log`
- Test with mock MCP bridge

---

**Enjoy your Jarvis-like Windows companion!** 🚀
