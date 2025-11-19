# 🏗️ Skynet Companion — Architecture

## Vue d'ensemble

**Skynet Companion** est un overlay IA permanent pour Windows qui agit comme un copilote intelligent toujours disponible.

```
┌─────────────────────────────────────────────────────────────────┐
│                        WINDOWS DESKTOP                          │
│                                                                 │
│  ┌──────────────────────────────────────────┐                 │
│  │     Skynet Companion Overlay (WinUI3)    │◄────┐           │
│  │  ┌────────────────────────────────────┐  │     │           │
│  │  │  💬 Chat    ⚡ Actions   🧠 Memory │  │     │           │
│  │  └────────────────────────────────────┘  │     │           │
│  │         Always-On-Top, Draggable         │     │           │
│  └──────────────────────────────────────────┘     │           │
│                    ▲                               │           │
│                    │ Hotkey (Ctrl+Space)           │           │
│                    │ Clipboard Monitor             │           │
│                    │                               │           │
└────────────────────┼───────────────────────────────┼───────────┘
                     │                               │
                     │                               │
         ┌───────────▼────────────┐      ┌───────────▼─────────┐
         │   C# Services Layer    │      │  Global Input Hook  │
         ├────────────────────────┤      │   (Keyboard/Mouse)  │
         │ • HotkeyService        │      └─────────────────────┘
         │ • WhisperService       │
         │ • MCPClient            │
         │ • ClipboardService     │
         │ • MemoryService        │
         └───────────┬────────────┘
                     │
                     │ HTTP/WebSocket
                     │
         ┌───────────▼────────────────────────────────────────┐
         │          Python Backend API (FastAPI)              │
         ├────────────────────────────────────────────────────┤
         │  Endpoints:                                        │
         │  • POST /overlay/send                              │
         │  • GET  /overlay/context                           │
         │  • POST /overlay/clipboard/analyze                 │
         │  • POST /overlay/voice/query                       │
         │  • WS   /overlay/stream                            │
         └───────────┬────────────────────────────────────────┘
                     │
                     │ MCP Protocol
                     │
         ┌───────────▼────────────────────────────────────────┐
         │            MCP Server / Router                     │
         ├────────────────────────────────────────────────────┤
         │  Routes to:                                        │
         │  • Claude Code                                     │
         │  • ChatGPT (via API)                               │
         │  • Comet/Perplexity                                │
         │  • Gemini                                          │
         │  • Custom Agents                                   │
         └────────────────────────────────────────────────────┘
```

---

## 🧩 Composants Principaux

### 1️⃣ WinUI3 Frontend (C#)

**Responsabilités :**
- Affichage de l'overlay toujours visible
- Gestion des interactions utilisateur
- Hotkey global (Ctrl+Space)
- Monitoring du clipboard
- Enregistrement/transcription audio
- Communication avec le backend

**Technologies :**
- WinUI 3 (.NET 8)
- Windows App SDK
- MVVM pattern (minimal pour MVP)

**Fenêtres principales :**

```
MainWindow (hidden, tray icon)
    │
    ├── OverlayWindow (always-on-top, semi-transparent)
    │       ├── ChatPanel
    │       ├── QuickActionsPanel
    │       └── MemoryPanel
    │
    └── SettingsWindow (configuration)
```

---

### 2️⃣ Services Layer (C#)

#### **HotkeyService**
- Enregistre hotkeys globaux Windows (Win32 API)
- Détecte `Ctrl+Space` partout dans l'OS
- Trigger : focus overlay + activation microphone

```csharp
public class HotkeyService
{
    public event EventHandler HotkeyPressed;
    public void RegisterHotkey(ModifierKeys modifiers, Key key);
    public void UnregisterHotkey();
}
```

#### **WhisperService**
- MVP : mock retournant texte fixe
- Architecture extensible pour :
  - Whisper.cpp local
  - OpenAI Whisper API
  - Azure Speech

```csharp
public class WhisperService
{
    public async Task<string> TranscribeAudioAsync(byte[] audioData);
    public bool IsRecording { get; }
    public void StartRecording();
    public void StopRecording();
}
```

#### **MCPClient**
- Client HTTP + WebSocket pour backend Python
- Envoie messages aux agents IA
- Reçoit réponses (streaming supporté)

```csharp
public class MCPClient
{
    public async Task<MCPResponse> SendMessageAsync(MCPMessage message);
    public async Task<List<Agent>> GetAvailableAgentsAsync();
    public async Task UpdateContextAsync(ContextData context);
}
```

#### **ClipboardService**
- Monitore changements du presse-papier Windows
- Stocke historique (derniers 10 items)
- Trigger quick-actions automatiques

```csharp
public class ClipboardService
{
    public event EventHandler<ClipboardChangedEventArgs> ClipboardChanged;
    public string GetLastText();
    public void SetText(string text);
}
```

#### **MemoryService**
- Mémoire courte : JSON local (`data/memory_short.json`)
- Mémoire longue : via MCP MemoryStore
- CRUD sur entrées mémoire

```csharp
public class MemoryService
{
    public async Task<List<MemoryEntry>> GetRecentMemoriesAsync(int count);
    public async Task AddMemoryAsync(MemoryEntry entry);
    public async Task<List<MemoryEntry>> SearchMemoryAsync(string query);
}
```

---

### 3️⃣ Backend API (Python - FastAPI)

**Fichier : `companion_api.py`**

Expose les endpoints pour l'overlay :

```python
@app.post("/overlay/send")
async def send_to_agent(message: OverlayMessage):
    """Envoie message à l'agent IA sélectionné via MCP"""

@app.get("/overlay/context")
async def get_context():
    """Récupère contexte actuel (clipboard, mémoire, etc.)"""

@app.post("/overlay/clipboard/analyze")
async def analyze_clipboard(content: ClipboardContent):
    """Analyse contenu clipboard avec prompt spécifique"""

@app.post("/overlay/voice/query")
async def process_voice_query(query: VoiceQuery):
    """Traite requête vocale transcrite"""

@app.websocket("/overlay/stream")
async def websocket_stream(websocket: WebSocket):
    """Streaming bidirectionnel pour réponses temps réel"""
```

**Fichier : `websocket_bridge.py`**

Proxy WebSocket vers MCP Server :

```python
class MCPBridge:
    async def connect_to_mcp(self):
        """Établit connexion WebSocket avec MCP Server"""

    async def send_message(self, message: dict):
        """Envoie message au MCP"""

    async def receive_stream(self) -> AsyncIterator[dict]:
        """Reçoit stream de réponses"""

    async def heartbeat(self):
        """Maintient connexion active"""
```

---

### 4️⃣ Data Models (C#)

**MCPMessage.cs**
```csharp
public class MCPMessage
{
    public string Id { get; set; }
    public string Agent { get; set; }  // "claude", "gpt", "gemini"
    public string Content { get; set; }
    public Dictionary<string, object> Context { get; set; }
    public DateTime Timestamp { get; set; }
}
```

**CompanionSettings.cs**
```csharp
public class CompanionSettings
{
    public string DefaultAgent { get; set; }
    public bool VoiceEnabled { get; set; }
    public bool ClipboardMonitoring { get; set; }
    public string BackendUrl { get; set; }
    public HotkeyConfig Hotkeys { get; set; }
}
```

**MemoryEntry.cs**
```csharp
public class MemoryEntry
{
    public string Id { get; set; }
    public string Content { get; set; }
    public string Summary { get; set; }
    public List<string> Tags { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

---

## 🔄 Flux de Données

### Scénario 1 : Requête Vocale

```
1. User presse Ctrl+Space
   └─► HotkeyService déclenche événement
       └─► OverlayWindow affiche indicateur "Listening..."
           └─► WhisperService.StartRecording()
               └─► User parle : "Résume-moi ce texte"
                   └─► WhisperService.StopRecording()
                       └─► Transcription → texte
                           └─► MCPClient.SendMessageAsync()
                               └─► Backend /overlay/voice/query
                                   └─► MCP Server → Claude/GPT
                                       └─► Réponse streaming
                                           └─► OverlayWindow affiche réponse
                                               └─► MemoryService.AddMemoryAsync()
```

### Scénario 2 : Clipboard Analysis

```
1. User copie du texte (Ctrl+C)
   └─► ClipboardService détecte changement
       └─► Event ClipboardChanged déclenché
           └─► OverlayWindow affiche notification
               └─► Quick-actions proposées :
                   • Résumer
                   • Traduire
                   • Analyser
               └─► User clique "Résumer"
                   └─► MCPClient.SendMessageAsync()
                       └─► Backend /overlay/clipboard/analyze
                           └─► Prompt : clipboard_analyze.md
                               └─► MCP → Agent IA
                                   └─► Résultat dans overlay
```

### Scénario 3 : Chat Direct

```
1. User ouvre ChatPanel dans overlay
   └─► Sélectionne agent (Claude/GPT/Gemini)
       └─► Tape message
           └─► MCPClient.SendMessageAsync()
               └─► Backend /overlay/send
                   └─► MCP route vers agent sélectionné
                       └─► Streaming response
                           └─► ChatPanel affiche avec markdown
                               └─► Mémoire mise à jour
```

---

## 🎨 UI/UX Design

### Overlay Window States

**1. Minimized (default)**
```
┌─────────────┐
│  🤖 Skynet  │  ← Petite bulle draggable
└─────────────┘
```

**2. Expanded**
```
┌────────────────────────────────┐
│  🤖 Skynet Companion           │
├────────────────────────────────┤
│ [Chat] [Actions] [Memory]      │
├────────────────────────────────┤
│                                │
│  Panel content here...         │
│                                │
└────────────────────────────────┘
```

**3. Listening (Ctrl+Space pressed)**
```
┌────────────────────────────────┐
│  🎤 Listening...               │
│  ●●●●●●●●○○ (wave animation)   │
└────────────────────────────────┘
```

### Color Scheme (Dark Mode)

```
Background:     #1E1E1E (80% opacity)
Accent:         #6366F1 (Indigo)
Text:           #E5E7EB
Border:         #374151
Success:        #10B981
Error:          #EF4444
```

---

## 🔐 Security Considerations

1. **Input Sanitization**
   - Tout input user doit être nettoyé avant envoi à l'IA
   - Validation des payloads JSON

2. **Local API Only**
   - Backend Python écoute sur `127.0.0.1` uniquement
   - Pas d'exposition externe

3. **Clipboard Privacy**
   - Option pour désactiver monitoring clipboard
   - Blacklist de patterns sensibles (passwords, tokens)

4. **Memory Storage**
   - Mémoire locale chiffrée (optionnel)
   - Pas de log des données sensibles

---

## 📊 Performance Targets

- **Overlay Footprint:** < 100 MB RAM
- **Hotkey Response:** < 50ms
- **Voice Transcription:** < 2s (local), < 1s (API)
- **IA Response Display:** Streaming real-time
- **Clipboard Detection:** < 10ms

---

## 🚀 MVP Features (Phase 1)

✅ Core overlay window (draggable, always-on-top)
✅ Hotkey global (Ctrl+Space)
✅ Mock Whisper service (texte fixe)
✅ Clipboard monitoring
✅ MCP Client (HTTP REST)
✅ ChatPanel basique
✅ Quick-actions (3 actions)
✅ Mémoire locale (JSON)
✅ Python backend API
✅ WebSocket bridge vers MCP

---

## 🔮 Future Enhancements (Phase 2+)

- [ ] Whisper.cpp intégration (local transcription)
- [ ] Avatars 3D animés (ReadyPlayerMe)
- [ ] Multi-monitors support
- [ ] Gestures recognition (souris)
- [ ] Screen capture + Vision analysis
- [ ] TTS responses (voice output)
- [ ] Mobile companion app sync
- [ ] VR/AR HUD mode
- [ ] Custom agent creation UI
- [ ] Plugins system

---

## 📦 Dependencies

### C# / WinUI3
```xml
- Microsoft.WindowsAppSDK (1.5.x)
- Microsoft.Windows.SDK.BuildTools
- CommunityToolkit.Mvvm
- System.Net.Http.Json
- NAudio (pour audio recording)
```

### Python
```
- fastapi
- uvicorn[standard]
- websockets
- pydantic
- httpx
- python-multipart
```

---

## 🛠️ Build & Deployment

### Development
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn companion_api:app --reload --port 8765

# Frontend
cd src
dotnet restore
dotnet build
dotnet run --project SkynetCompanion
```

### Production
```bash
# Package WinUI3 as MSIX
dotnet publish -c Release -r win-x64 --self-contained

# Backend as Windows Service
python -m pip install pyinstaller
pyinstaller --onefile companion_api.py
```

---

## 📝 Configuration

**`backend/config.yaml`**
```yaml
mcp:
  server_url: "ws://localhost:8080/mcp"
  timeout: 30

agents:
  - name: "claude"
    endpoint: "/agents/claude"
  - name: "gpt"
    endpoint: "/agents/gpt"
  - name: "gemini"
    endpoint: "/agents/gemini"

overlay:
  default_opacity: 0.9
  default_position: "top-right"

features:
  voice_enabled: true
  clipboard_monitoring: true
  memory_enabled: true
```

---

## 🧪 Testing Strategy

1. **Unit Tests**
   - Services isolés (mock dependencies)
   - Models validation

2. **Integration Tests**
   - Overlay ↔ Backend API
   - Backend ↔ MCP Server

3. **E2E Tests**
   - Hotkey → Voice → Response
   - Clipboard → Analysis → Display

---

## 📚 Documentation Structure

```
/docs/
  ├── architecture.md          (ce fichier)
  ├── api_reference.md         (endpoints backend)
  ├── services_guide.md        (C# services usage)
  ├── prompts_guide.md         (IA prompts customization)
  └── deployment.md            (install & config)
```

---

**Version:** 1.0.0-MVP
**Last Updated:** 2025-11-19
**Author:** Skynet AI Systems
