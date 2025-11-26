# 📚 Skynet Memory Visualizer — Architecture Documentation

## 🎯 Vision

**Skynet Memory Visualizer** is the cognitive control center for Skynet's RAG (Retrieval-Augmented Generation) memory system. It provides complete visibility and control over what the AI knows, learns, and remembers.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TAURI DESKTOP APPLICATION                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Tree View   │  │    Editor    │  │   Compare    │          │
│  │   Browser    │  │  Markdown/   │  │  Version     │          │
│  │              │  │  JSON/TXT    │  │   Diff       │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                    │
│         └─────────────────┼─────────────────┘                    │
│                           │                                      │
│                  ┌────────▼────────┐                             │
│                  │  API Bridge JS  │                             │
│                  └────────┬────────┘                             │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTP/WebSocket
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                      FLASK BACKEND API                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ RAG Loader  │ │File Manager │ │Tag Manager  │               │
│  │             │ │             │ │             │               │
│  │ - Load idx  │ │ - CRUD ops  │ │ - Add tags  │               │
│  │ - Search    │ │ - Versioning│ │ - AI tags   │               │
│  │ - Metadata  │ │ - History   │ │ - Filters   │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │History Mgr  │ │Compare Eng  │ │ AI Bridge   │               │
│  │             │ │             │ │             │               │
│  │ - Versions  │ │ - Diff gen  │ │ - Claude    │               │
│  │ - Timeline  │ │ - Highlight │ │ - Gemini    │               │
│  │ - Rollback  │ │ - Stats     │ │ - Prompts   │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                       MCP SERVER (Node.js)                       │
│                                                                   │
│  Tools:                          Endpoints:                      │
│  ┌─────────────────┐            /sync/rag                        │
│  │  sync_rag.js    │            /ai/regenerate                   │
│  │  ai_export.js   │            /ai/summarize                    │
│  │  index_refresh  │            /index/refresh                   │
│  └─────────────────┘            /health/visualizer               │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                      DATA LAYER                                  │
│                                                                   │
│  rag_index/          docs/              history/                 │
│  ├── embeddings.json ├── *.md           └── versions/            │
│  └── metadata.json   ├── *.txt              ├── doc_v1.md        │
│                      └── *.json             ├── doc_v2.md        │
│                                              └── ...              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. **Document Loading Flow**
```
User opens app
    ↓
Tauri UI requests file tree
    ↓
Flask file_manager.py scans /data/docs/
    ↓
Returns JSON tree structure
    ↓
tree_view.js renders interactive tree
    ↓
User clicks on document
    ↓
editor.js requests document content
    ↓
Flask file_manager.py loads file
    ↓
Editor displays with:
  - Content
  - Tags (from tag_manager)
  - Metadata (from rag_loader)
  - History (from history_manager)
```

### 2. **Document Edit Flow**
```
User edits document in editor
    ↓
User clicks "Save"
    ↓
editor.js sends content to Flask
    ↓
file_manager.py:
  - Creates versioned copy in /history/versions/
  - Updates original file
  - Logs change with timestamp
    ↓
tag_manager.py extracts/updates tags
    ↓
rag_loader.py updates index metadata
    ↓
Success response to UI
    ↓
Editor shows "Saved" confirmation
```

### 3. **AI Regeneration Flow**
```
User clicks "Regenerate with AI"
    ↓
editor.js confirms action
    ↓
Sends doc + prompt type to Flask ai_bridge.py
    ↓
ai_bridge.py:
  - Loads appropriate prompt template
  - Calls Claude/Gemini API
  - Receives regenerated content
    ↓
Returns to editor as "preview"
    ↓
User can:
  - Accept (saves as new version)
  - Reject (discards)
  - Compare (opens compare view)
```

### 4. **Version Compare Flow**
```
User selects "Compare Versions"
    ↓
history_manager.py lists all versions
    ↓
User selects version A and version B
    ↓
compare_engine.py generates diff
    ↓
compare.js renders side-by-side:
  - Red: deletions
  - Green: additions
  - White: unchanged
    ↓
Stats shown:
  - Lines added/removed
  - Characters changed
  - Timestamp diff
```

### 5. **MCP Sync Flow**
```
User clicks "Sync to Skynet Core"
    ↓
MCP server /sync/rag endpoint called
    ↓
sync_rag.js:
  - Reads local RAG index
  - Compares with remote
  - Identifies changes
  - Pushes/pulls as needed
    ↓
Conflict resolution if needed
    ↓
Updates local index
    ↓
Refreshes UI
```

---

## 🧩 Component Details

### Frontend (Tauri + HTML/CSS/JS)

#### **index.html** — Dashboard
- **Purpose**: Entry point, system overview
- **Features**:
  - Total documents count
  - RAG index size
  - Recent changes timeline
  - Quick search
  - Navigation to tree/editor

#### **tree_view.html** — Document Browser
- **Purpose**: Navigate document hierarchy
- **Features**:
  - Collapsible folder tree
  - File type icons
  - Search/filter
  - Right-click context menu (open, delete, rename)
  - Drag-and-drop organization

#### **editor.html** — Document Editor
- **Purpose**: View and edit documents
- **Features**:
  - Markdown preview (split view)
  - Syntax highlighting (JSON)
  - Sidebar panels:
    - Tags (add/remove)
    - Metadata (auto-extracted)
    - AI Actions (regenerate, summarize, improve)
    - Version history
  - Auto-save
  - Keyboard shortcuts

#### **compare.html** — Version Diff Viewer
- **Purpose**: Compare document versions
- **Features**:
  - Side-by-side diff
  - Unified diff option
  - Line-by-line highlighting
  - Navigation between changes
  - Statistics panel
  - Restore version button

### Backend (Flask)

#### **rag_loader.py**
```python
class RAGLoader:
    def load_index()          # Load embeddings + metadata
    def search(query)         # Semantic search
    def get_metadata(doc_id)  # Get doc metadata
    def update_metadata()     # Update after edit
    def reindex_document()    # Regenerate embeddings
```

#### **file_manager.py**
```python
class FileManager:
    def list_files(path)      # Return tree structure
    def read_file(path)       # Load file content
    def write_file(path, content, create_version=True)
    def delete_file(path)     # Move to trash
    def rename_file(old, new) # Rename with history
    def create_version(path)  # Manual version snapshot
```

#### **tag_manager.py**
```python
class TagManager:
    def get_tags(doc_id)      # Get doc tags
    def add_tag(doc_id, tag)  # Add tag
    def remove_tag(doc_id, tag)
    def suggest_tags_ai(doc_content)  # AI suggestions
    def get_all_tags()        # Tag cloud
    def filter_by_tag(tag)    # Find docs by tag
```

#### **history_manager.py**
```python
class HistoryManager:
    def get_versions(doc_id)  # List all versions
    def get_version(doc_id, version_id)  # Load specific
    def create_version(doc_id, content)  # Save version
    def get_timeline()        # Recent changes
    def rollback(doc_id, version_id)  # Restore old version
```

#### **compare_engine.py**
```python
class CompareEngine:
    def diff(text_a, text_b)  # Generate diff
    def highlight_changes()   # Format for UI
    def get_stats(diff)       # Lines/chars changed
    def unified_diff()        # Git-style diff
```

#### **ai_bridge.py**
```python
class AIBridge:
    def regenerate(doc, prompt_type="regenerate_doc")
    def summarize(doc, level="medium")
    def extract_metadata(doc)
    def improve_tags(doc)

    # Support for multiple AI providers
    def _call_claude(prompt, content)
    def _call_gemini(prompt, content)
```

### MCP Server (Node.js)

#### **server.js**
- Express-based API server
- Endpoints for Skynet ecosystem integration
- WebSocket support for real-time updates

#### **Tools**

**sync_rag.js**
```javascript
- Syncs with Skynet Drive
- Pushes local changes
- Pulls remote changes
- Conflict resolution
- Bidirectional sync
```

**ai_export.js**
```javascript
- Exports docs for AI consumption
- Formats as context
- Generates summaries
- Prepares embeddings
```

**index_refresh.js**
```javascript
- Recalculates RAG index
- Updates embeddings
- Refreshes metadata
- Cleanup orphaned entries
```

---

## 🔐 Security & Privacy

1. **No auto-upload to AI**: Every AI call requires explicit user confirmation
2. **Local-first**: All data stored locally by default
3. **Version control**: Never lose data, everything versioned
4. **Audit log**: All changes tracked with timestamps
5. **API keys**: Stored in secure config, never committed

---

## 🎨 UI/UX Principles

1. **Dark mode first**: Easier on eyes for long sessions
2. **Keyboard-friendly**: Shortcuts for all major actions
3. **Real-time updates**: Changes reflect immediately
4. **Clear visual hierarchy**: Important info stands out
5. **Non-destructive**: Easy undo/rollback
6. **Performance**: Lazy loading for large document sets

---

## 📊 Data Models

### Document Metadata
```json
{
  "id": "doc_123",
  "path": "/data/docs/agents/memory_core.md",
  "title": "Memory Core Architecture",
  "created": "2025-11-15T10:30:00Z",
  "modified": "2025-11-19T14:22:00Z",
  "size": 15420,
  "type": "markdown",
  "tags": ["architecture", "rag", "memory"],
  "summary": "Core memory system for Skynet agents...",
  "embedding_id": "emb_456",
  "version_count": 7,
  "last_version": "v7_20251119_142200"
}
```

### Version Entry
```json
{
  "version_id": "v7_20251119_142200",
  "doc_id": "doc_123",
  "timestamp": "2025-11-19T14:22:00Z",
  "author": "user",
  "change_type": "edit",
  "summary": "Updated RAG indexing strategy",
  "path": "/data/history/versions/doc_123_v7.md",
  "diff_stats": {
    "lines_added": 12,
    "lines_removed": 5,
    "chars_changed": 347
  }
}
```

### RAG Index Entry
```json
{
  "embedding_id": "emb_456",
  "doc_id": "doc_123",
  "chunk_index": 0,
  "text": "The memory core uses a hierarchical RAG approach...",
  "embedding": [0.123, -0.456, 0.789, ...],
  "metadata": {
    "section": "Overview",
    "keywords": ["rag", "hierarchy", "memory"]
  }
}
```

---

## 🚀 Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Desktop UI** | Tauri | Lightweight, secure, Rust-based |
| **Frontend** | HTML/CSS/JS | Simple, fast, no framework bloat |
| **Markdown** | Marked.js | Reliable parser |
| **Editor** | CodeMirror | Syntax highlighting, extensions |
| **Backend** | Flask (Python) | Easy RAG integration, ML libraries |
| **MCP** | Node.js + Express | Skynet ecosystem standard |
| **Diff** | diff-match-patch | Fast, accurate diffing |
| **AI** | Claude/Gemini API | Best-in-class LLMs |

---

## 🔧 Configuration

### config.yaml (Flask)
```yaml
app:
  port: 5432
  debug: false

paths:
  docs: ./data/docs
  rag_index: ./data/rag_index
  history: ./data/history
  logs: ./data/logs

ai:
  provider: "claude"  # or "gemini"
  model: "claude-sonnet-4-5"
  api_key_env: "ANTHROPIC_API_KEY"

rag:
  chunk_size: 512
  overlap: 50
  embedding_model: "text-embedding-3-small"

versioning:
  auto_save: true
  max_versions: 50
  compress_old: true
```

### config.mcp.json (MCP)
```json
{
  "name": "skynet-memory-visualizer",
  "version": "1.0.0",
  "port": 3456,
  "endpoints": {
    "sync": "/sync/rag",
    "ai": "/ai/regenerate",
    "index": "/index/refresh"
  },
  "skynet_core": {
    "url": "http://localhost:8000",
    "api_key_env": "SKYNET_API_KEY"
  }
}
```

---

## 📈 Roadmap

### Phase 1: Core (Current)
- ✅ File browser
- ✅ Editor with preview
- ✅ Version control
- ✅ Basic diff viewer

### Phase 2: AI Integration
- ✅ AI regeneration
- ✅ Tag suggestions
- ✅ Metadata extraction
- ✅ Summarization

### Phase 3: Advanced
- 🔲 Graph visualization (doc relationships)
- 🔲 Semantic search UI
- 🔲 Batch operations
- 🔲 Export/import formats

### Phase 4: Collaborative
- 🔲 Multi-user support
- 🔲 Real-time collaboration
- 🔲 Comment threads
- 🔲 Review workflows

---

## 🧪 Example Use Cases

### 1. **Audit AI Knowledge**
User wants to know what the AI "remembers" about project X:
1. Open Memory Visualizer
2. Search "project X"
3. See all related docs
4. Review embeddings metadata
5. Edit/remove outdated info

### 2. **Improve Documentation**
User has messy notes:
1. Open document in editor
2. Click "Regenerate with AI"
3. AI rewrites with better structure
4. Compare old vs new
5. Accept or manually refine
6. New version saved automatically

### 3. **Tag Organization**
User has 1000 untagged docs:
1. Select batch of docs
2. Click "AI Tag Suggestions"
3. Review proposed tags
4. Accept/modify/reject
5. Apply tags
6. Filter by new tags

### 4. **Version Recovery**
User accidentally deleted important section:
1. Open document
2. View version history
3. Select version before deletion
4. Compare with current
5. Restore entire version OR cherry-pick sections

---

## 🎯 Success Metrics

- **Fast**: Load 10,000 docs tree in < 1s
- **Reliable**: Zero data loss through versioning
- **Intuitive**: New user productive in < 5 min
- **Powerful**: Support docs up to 10MB
- **Extensible**: Plugin system for custom tools

---

**End of Architecture Document**

*Version: 1.0*
*Date: 2025-11-19*
*Author: Claude Code 4.5*
