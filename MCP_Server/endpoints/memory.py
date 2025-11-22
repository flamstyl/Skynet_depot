"""
🧠 Endpoint Memory — Mémoire longue de l'IA (RAG interne)
Stockage et récupération de contexte, historique des actions
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
import logging
from pathlib import Path
import aiofiles

logger = logging.getLogger(__name__)
router = APIRouter()

# Chemins de stockage
MEMORY_DIR = Path("memory")
MEMORY_INDEX_FILE = MEMORY_DIR / "index_memory.json"
MEMORY_HISTORY_DIR = MEMORY_DIR / "history"
MEMORY_MD_FILE = MEMORY_DIR / "memory_index.md"

# Créer les dossiers si nécessaire
MEMORY_DIR.mkdir(exist_ok=True)
MEMORY_HISTORY_DIR.mkdir(exist_ok=True)


# 📦 Modèles de données
class MemoryEntry(BaseModel):
    id: str
    content: str
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
    timestamp: str
    source: str = "ai"  # ai, user, system


class MemoryAddRequest(BaseModel):
    content: str = Field(..., description="Contenu à mémoriser")
    tags: List[str] = Field(default=[], description="Tags pour catégoriser")
    metadata: Dict[str, Any] = Field(default={}, description="Métadonnées additionnelles")
    auth: str = Field(..., description="Clé d'authentification")
    source: str = Field(default="ai", description="Source de la mémoire")


class MemoryQueryRequest(BaseModel):
    query: str = Field(..., description="Requête de recherche")
    auth: str = Field(..., description="Clé d'authentification")
    tags: Optional[List[str]] = Field(default=None, description="Filtrer par tags")
    limit: int = Field(default=10, description="Nombre max de résultats")


class MemoryHistoryRequest(BaseModel):
    auth: str = Field(..., description="Clé d'authentification")
    date: Optional[str] = Field(default=None, description="Date au format YYYY-MM-DD")


# 🗄️ Gestion du stockage JSON
async def load_memory_index() -> List[MemoryEntry]:
    """Charge l'index mémoire depuis le fichier JSON"""
    if not MEMORY_INDEX_FILE.exists():
        return []

    try:
        async with aiofiles.open(MEMORY_INDEX_FILE, 'r', encoding='utf-8') as f:
            content = await f.read()
            data = json.loads(content)
            return [MemoryEntry(**entry) for entry in data]
    except Exception as e:
        logger.error(f"Error loading memory index: {e}")
        return []


async def save_memory_index(entries: List[MemoryEntry]):
    """Sauvegarde l'index mémoire dans le fichier JSON"""
    try:
        data = [entry.dict() for entry in entries]
        async with aiofiles.open(MEMORY_INDEX_FILE, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(data, indent=2, ensure_ascii=False))

        # Aussi générer un fichier Markdown pour consultation humaine
        await generate_memory_markdown(entries)

        logger.info(f"Memory index saved: {len(entries)} entries")
    except Exception as e:
        logger.error(f"Error saving memory index: {e}")
        raise


async def generate_memory_markdown(entries: List[MemoryEntry]):
    """Génère un fichier Markdown lisible de la mémoire"""
    try:
        md_content = "# 🧠 Mémoire IA — Index\n\n"
        md_content += f"**Dernière mise à jour:** {datetime.now().isoformat()}\n\n"
        md_content += f"**Total d'entrées:** {len(entries)}\n\n"
        md_content += "---\n\n"

        for entry in sorted(entries, key=lambda x: x.timestamp, reverse=True):
            md_content += f"## {entry.id}\n\n"
            md_content += f"**Date:** {entry.timestamp}\n\n"
            md_content += f"**Source:** {entry.source}\n\n"

            if entry.tags:
                md_content += f"**Tags:** {', '.join(entry.tags)}\n\n"

            md_content += f"{entry.content}\n\n"

            if entry.metadata:
                md_content += f"**Métadonnées:** `{json.dumps(entry.metadata)}`\n\n"

            md_content += "---\n\n"

        async with aiofiles.open(MEMORY_MD_FILE, 'w', encoding='utf-8') as f:
            await f.write(md_content)

    except Exception as e:
        logger.error(f"Error generating markdown: {e}")


async def log_to_history(action: str, details: dict):
    """Enregistre une action dans l'historique du jour"""
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = MEMORY_HISTORY_DIR / f"{today}.log"

    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "action": action,
        "details": details
    }

    try:
        async with aiofiles.open(log_file, 'a', encoding='utf-8') as f:
            await f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
    except Exception as e:
        logger.error(f"Error writing to history: {e}")


# 📝 Endpoint: Ajouter à la mémoire
@router.post("/add")
async def add_memory(request: MemoryAddRequest):
    """
    Ajoute une nouvelle entrée à la mémoire de l'IA

    Exemple:
    ```json
    {
        "content": "L'utilisateur préfère Python pour le backend",
        "tags": ["preferences", "python"],
        "metadata": {"confidence": "high"},
        "auth": "YOUR_API_KEY"
    }
    ```
    """
    # Vérifier l'authentification
    from server import API_KEY
    if request.auth != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    try:
        # Charger l'index existant
        entries = await load_memory_index()

        # Créer une nouvelle entrée
        entry_id = f"mem_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(entries)}"
        new_entry = MemoryEntry(
            id=entry_id,
            content=request.content,
            tags=request.tags,
            metadata=request.metadata,
            timestamp=datetime.now().isoformat(),
            source=request.source
        )

        # Ajouter et sauvegarder
        entries.append(new_entry)
        await save_memory_index(entries)

        # Logger dans l'historique
        await log_to_history("memory_add", {
            "id": entry_id,
            "content": request.content[:100],
            "tags": request.tags
        })

        logger.info(f"Memory added: {entry_id}")

        return {
            "success": True,
            "id": entry_id,
            "message": "Memory entry added successfully",
            "timestamp": new_entry.timestamp
        }

    except Exception as e:
        logger.error(f"Error adding memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 🔍 Endpoint: Rechercher dans la mémoire
@router.post("/query")
async def query_memory(request: MemoryQueryRequest):
    """
    Recherche dans la mémoire de l'IA

    Exemple:
    ```json
    {
        "query": "python",
        "tags": ["preferences"],
        "limit": 5,
        "auth": "YOUR_API_KEY"
    }
    ```
    """
    # Vérifier l'authentification
    from server import API_KEY
    if request.auth != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    try:
        # Charger l'index
        entries = await load_memory_index()

        # Filtrer par tags si spécifié
        if request.tags:
            entries = [
                e for e in entries
                if any(tag in e.tags for tag in request.tags)
            ]

        # Recherche simple par mot-clé dans le contenu
        query_lower = request.query.lower()
        results = [
            e for e in entries
            if query_lower in e.content.lower() or
               query_lower in ' '.join(e.tags).lower()
        ]

        # Trier par date (plus récent d'abord) et limiter
        results = sorted(results, key=lambda x: x.timestamp, reverse=True)[:request.limit]

        # Logger dans l'historique
        await log_to_history("memory_query", {
            "query": request.query,
            "tags": request.tags,
            "results_count": len(results)
        })

        logger.info(f"Memory query: '{request.query}' | Found: {len(results)} results")

        return {
            "success": True,
            "query": request.query,
            "count": len(results),
            "results": [entry.dict() for entry in results],
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error querying memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 📜 Endpoint: Récupérer l'historique
@router.post("/history")
async def get_history(request: MemoryHistoryRequest):
    """
    Récupère l'historique des actions d'une date spécifique

    Exemple:
    ```json
    {
        "date": "2025-11-22",
        "auth": "YOUR_API_KEY"
    }
    ```
    """
    # Vérifier l'authentification
    from server import API_KEY
    if request.auth != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    # Utiliser la date du jour si non spécifiée
    target_date = request.date or datetime.now().strftime("%Y-%m-%d")
    log_file = MEMORY_HISTORY_DIR / f"{target_date}.log"

    if not log_file.exists():
        return {
            "success": True,
            "date": target_date,
            "entries": [],
            "message": "No history for this date"
        }

    try:
        entries = []
        async with aiofiles.open(log_file, 'r', encoding='utf-8') as f:
            content = await f.read()
            for line in content.strip().split('\n'):
                if line:
                    entries.append(json.loads(line))

        logger.info(f"History retrieved: {target_date} | {len(entries)} entries")

        return {
            "success": True,
            "date": target_date,
            "count": len(entries),
            "entries": entries,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error reading history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 🗑️ Endpoint: Effacer toute la mémoire (DANGER!)
@router.post("/clear")
async def clear_memory(auth: str, confirm: bool = False):
    """
    Efface toute la mémoire (requiert confirmation)

    Exemple:
    ```json
    {
        "auth": "YOUR_API_KEY",
        "confirm": true
    }
    ```
    """
    # Vérifier l'authentification
    from server import API_KEY
    if auth != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Confirmation required. Set 'confirm': true"
        )

    try:
        # Vider l'index
        await save_memory_index([])

        # Logger
        await log_to_history("memory_cleared", {"timestamp": datetime.now().isoformat()})

        logger.warning("Memory cleared!")

        return {
            "success": True,
            "message": "All memory cleared",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error clearing memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))
