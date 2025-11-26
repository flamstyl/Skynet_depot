"""
NoteVault MCP — Backend Server
FastAPI server for vault operations

Features:
- Vault lock/unlock (password-based)
- CRUD notes API
- Search and filtering
- Notion import
- RAG search
- AI integration endpoints

Port: 5050
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import NoteVault modules
from crypto_engine import CryptoEngine
from note_manager import NoteManager, Note
from notion_converter import NotionConverter
from rag_indexer import RAGIndexer


# Pydantic models

class UnlockRequest(BaseModel):
    password: str

class CreateNoteRequest(BaseModel):
    title: Optional[str] = ""
    content: str
    tags: Optional[List[str]] = []
    metadata: Optional[Dict[str, Any]] = {}

class UpdateNoteRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

class SearchRequest(BaseModel):
    query: Optional[str] = ""
    tags: Optional[List[str]] = []
    date_from: Optional[str] = None
    date_to: Optional[str] = None

class AISummarizeRequest(BaseModel):
    note_id: str
    format: str = "medium"  # short, medium, detailed

class AIClassifyRequest(BaseModel):
    note_id: str

class RAGSearchRequest(BaseModel):
    query: str
    top_k: int = 5


# Global state (TODO: Use proper session management for production)
class VaultState:
    def __init__(self):
        self.crypto = CryptoEngine()
        self.note_manager = NoteManager(vault_dir="./vault")
        self.notion_converter = NotionConverter()
        self.rag_indexer = RAGIndexer(index_dir="./data/rag_index")

        self.vault_path = Path("./vault/vault_local.nvault")
        self.is_unlocked = False
        self.master_key: Optional[bytes] = None

state = VaultState()


# Lifespan context
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    print("🚀 NoteVault Backend Server starting...")

    # Check if vault exists
    if state.vault_path.exists():
        print(f"📁 Vault found at {state.vault_path}")
    else:
        print("📁 No vault found - will create on first unlock")

    yield

    # Shutdown: lock vault
    if state.is_unlocked:
        print("🔒 Locking vault...")
        state.master_key = None
        state.is_unlocked = False

    print("👋 NoteVault Backend Server stopped")


# Create app
app = FastAPI(
    title="NoteVault MCP Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS (for Electron app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Vault endpoints

@app.post("/api/vault/unlock")
async def unlock_vault(request: UnlockRequest):
    """Unlock vault with password."""
    try:
        # Check if vault exists
        if not state.vault_path.exists():
            # Create new vault
            print("📝 Creating new vault...")
            vault_file = state.crypto.create_vault_file(
                password=request.password,
                notes=[],
                metadata={"created_at": None}
            )

            # Save vault
            state.vault_path.parent.mkdir(parents=True, exist_ok=True)
            with open(state.vault_path, 'w', encoding='utf-8') as f:
                json.dump(vault_file, f, indent=2)

            # Unlock
            state.master_key, _ = state.crypto.derive_key(request.password)
            state.is_unlocked = True
            state.note_manager.load_notes_from_vault([])

            return {
                "status": "created",
                "message": "New vault created and unlocked",
                "notes_count": 0
            }

        # Load and decrypt existing vault
        with open(state.vault_path, 'r', encoding='utf-8') as f:
            vault_file = json.load(f)

        # Decrypt notes
        notes = state.crypto.open_vault_file(request.password, vault_file)

        # Store master key
        salt = state.crypto.base64.b64decode(vault_file["salt"])
        state.master_key, _ = state.crypto.derive_key(request.password, salt)
        state.is_unlocked = True

        # Load notes into manager
        state.note_manager.load_notes_from_vault(notes)

        # Index notes
        for note in notes:
            state.rag_indexer.index_note(note)

        return {
            "status": "unlocked",
            "message": "Vault unlocked successfully",
            "notes_count": len(notes)
        }

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unlock vault: {str(e)}"
        )


@app.post("/api/vault/lock")
async def lock_vault():
    """Lock vault."""
    if not state.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vault is not unlocked"
        )

    # Clear master key
    state.master_key = None
    state.is_unlocked = False

    return {"status": "locked", "message": "Vault locked"}


@app.post("/api/vault/save")
async def save_vault():
    """Save vault to disk (encrypt all notes)."""
    if not state.is_unlocked or not state.master_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vault is locked"
        )

    try:
        # Export notes
        notes = state.note_manager.export_notes_to_vault()

        # Load existing vault file to preserve salt
        if state.vault_path.exists():
            with open(state.vault_path, 'r', encoding='utf-8') as f:
                vault_file = json.load(f)
            salt = state.crypto.base64.b64decode(vault_file["salt"])
        else:
            # Generate new salt (shouldn't happen)
            _, salt = state.crypto.derive_key("dummy")

        # Encrypt vault
        vault_blob = state.crypto.encrypt_vault(state.master_key, notes)
        encrypted = json.loads(vault_blob.decode('utf-8'))

        # Build vault file
        vault_file = {
            "version": "1.0",
            "salt": state.crypto.base64.b64encode(salt).decode('utf-8'),
            "nonce": encrypted["nonce"],
            "ciphertext": encrypted["ciphertext"],
            "tag": encrypted["tag"],
            "metadata": {
                "notes_count": len(notes),
                "last_saved": None  # TODO: timestamp
            }
        }

        # Save atomically
        temp_path = state.vault_path.with_suffix('.tmp')
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(vault_file, f, indent=2)

        temp_path.replace(state.vault_path)

        return {
            "status": "saved",
            "notes_count": len(notes)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save vault: {str(e)}"
        )


# Note endpoints

@app.get("/api/notes")
async def get_all_notes():
    """Get all notes."""
    if not state.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vault is locked"
        )

    notes = state.note_manager.get_all_notes()
    return {"notes": [note.to_dict() for note in notes]}


@app.post("/api/notes")
async def create_note(request: CreateNoteRequest):
    """Create a new note."""
    if not state.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vault is locked"
        )

    try:
        note = state.note_manager.create_note(
            title=request.title,
            content=request.content,
            tags=request.tags,
            metadata=request.metadata
        )

        # Index note
        state.rag_indexer.index_note(note.to_dict())

        # Auto-save vault
        await save_vault()

        return {"note": note.to_dict()}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}"
        )


@app.get("/api/notes/{note_id}")
async def get_note(note_id: str):
    """Get a specific note."""
    if not state.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vault is locked"
        )

    note = state.note_manager.get_note(note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    return {"note": note.to_dict()}


@app.put("/api/notes/{note_id}")
async def update_note(note_id: str, request: UpdateNoteRequest):
    """Update a note."""
    if not state.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vault is locked"
        )

    # Build updates
    updates = {}
    if request.title is not None:
        updates["title"] = request.title
    if request.content is not None:
        updates["content"] = request.content
    if request.tags is not None:
        updates["tags"] = request.tags
    if request.metadata is not None:
        updates["metadata"] = request.metadata

    note = state.note_manager.update_note(note_id, **updates)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    # Re-index
    state.rag_indexer.update_index(note_id, note.to_dict())

    # Auto-save
    await save_vault()

    return {"note": note.to_dict()}


@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: str):
    """Delete a note."""
    if not state.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vault is locked"
        )

    deleted = state.note_manager.delete_note(note_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    # Remove from index
    state.rag_indexer.remove_from_index(note_id)

    # Auto-save
    await save_vault()

    return {"status": "deleted", "note_id": note_id}


@app.post("/api/search")
async def search_notes(request: SearchRequest):
    """Search notes."""
    if not state.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vault is locked"
        )

    results = state.note_manager.search_notes(
        query=request.query,
        tags=request.tags,
        date_from=request.date_from,
        date_to=request.date_to
    )

    return {"results": [note.to_dict() for note in results]}


# Import endpoints

@app.post("/api/import/notion")
async def import_notion(file: UploadFile = File(...)):
    """Import Notion file (JSON or Markdown)."""
    if not state.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vault is locked"
        )

    try:
        # Save uploaded file temporarily
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Convert based on file type
        if file.filename.endswith('.json'):
            note_data = state.notion_converter.convert_notion_json(tmp_path)
        elif file.filename.endswith('.md'):
            note_data = state.notion_converter.convert_notion_markdown(tmp_path)
        else:
            raise ValueError("Unsupported file type (use .json or .md)")

        # Create note
        note = state.note_manager.create_note(
            title=note_data["title"],
            content=note_data["content"],
            tags=note_data["tags"],
            metadata=note_data["metadata"]
        )

        # Index
        state.rag_indexer.index_note(note.to_dict())

        # Cleanup
        Path(tmp_path).unlink()

        # Auto-save
        await save_vault()

        return {
            "status": "imported",
            "note": note.to_dict()
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import Notion file: {str(e)}"
        )


# RAG endpoints

@app.post("/api/rag/search")
async def rag_search(request: RAGSearchRequest):
    """Semantic search using RAG."""
    if not state.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vault is locked"
        )

    results = state.rag_indexer.search_similar(request.query, request.top_k)

    # Enrich with note data
    enriched_results = []
    for note_id, score in results:
        note = state.note_manager.get_note(note_id)
        if note:
            enriched_results.append({
                "note": note.to_dict(),
                "similarity_score": score
            })

    return {"results": enriched_results}


# AI endpoints (TODO: Integrate with MCP)

@app.post("/api/ai/summarize")
async def ai_summarize(request: AISummarizeRequest):
    """Generate AI summary for note."""
    if not state.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vault is locked"
        )

    note = state.note_manager.get_note(request.note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    # TODO: Call MCP AI tool
    # For now, mock response
    mock_summary = f"Summary of '{note.title}': {note.content[:100]}..."

    # Add to metadata
    state.note_manager.add_ai_summary(request.note_id, mock_summary)

    await save_vault()

    return {
        "summary": mock_summary,
        "format": request.format
    }


@app.post("/api/ai/classify")
async def ai_classify(request: AIClassifyRequest):
    """Classify note and suggest tags."""
    if not state.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vault is locked"
        )

    note = state.note_manager.get_note(request.note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    # TODO: Call MCP AI tool
    # Mock response
    mock_themes = ["ai", "technology", "notes"]
    mock_tags = ["skynet", "automation"]

    state.note_manager.add_ai_themes(request.note_id, mock_themes)

    await save_vault()

    return {
        "themes": mock_themes,
        "suggested_tags": mock_tags
    }


# Stats endpoints

@app.get("/api/stats")
async def get_stats():
    """Get vault and RAG statistics."""
    if not state.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vault is locked"
        )

    vault_stats = state.note_manager.get_stats()
    rag_stats = state.rag_indexer.get_index_stats()

    return {
        "vault": vault_stats,
        "rag": rag_stats
    }


# Health check

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "vault_unlocked": state.is_unlocked
    }


if __name__ == "__main__":
    import uvicorn

    print("🚀 Starting NoteVault Backend Server...")
    print("📍 URL: http://localhost:5050")
    print("📖 Docs: http://localhost:5050/docs")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5050,
        log_level="info"
    )
