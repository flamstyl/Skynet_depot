"""
🗂️ Endpoint Filesystem — Gestion des fichiers locaux
Lecture, écriture, listage de fichiers/dossiers avec sécurité anti-évasion
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import os
from pathlib import Path
import aiofiles
import logging
from typing import List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()


# 🔐 Sécurité: Bloquer les tentatives d'évasion de répertoire
BLOCKED_PATTERNS = ["..", "~", "/etc", "/root", "/sys", "/proc"]


def is_safe_path(path: str) -> bool:
    """Vérifie qu'un chemin est sûr (pas d'évasion de répertoire)"""
    path_lower = path.lower()

    # Bloquer les patterns dangereux
    for pattern in BLOCKED_PATTERNS:
        if pattern in path_lower:
            logger.warning(f"Blocked unsafe path pattern: {path}")
            return False

    # Vérifier que le chemin est absolu (pour éviter les relatifs malicieux)
    try:
        resolved = Path(path).resolve()
        return True
    except Exception as e:
        logger.error(f"Path resolution error: {e}")
        return False


# 📦 Modèles de données
class FileReadRequest(BaseModel):
    path: str = Field(..., description="Chemin absolu du fichier à lire")
    auth: str = Field(..., description="Clé d'authentification")
    encoding: str = Field(default="utf-8", description="Encodage du fichier")


class FileWriteRequest(BaseModel):
    path: str = Field(..., description="Chemin absolu du fichier à écrire")
    content: str = Field(..., description="Contenu à écrire dans le fichier")
    auth: str = Field(..., description="Clé d'authentification")
    encoding: str = Field(default="utf-8", description="Encodage du fichier")
    mode: str = Field(default="w", description="Mode d'écriture: 'w' (overwrite) ou 'a' (append)")


class DirectoryListRequest(BaseModel):
    path: str = Field(..., description="Chemin du répertoire à lister")
    auth: str = Field(..., description="Clé d'authentification")
    recursive: bool = Field(default=False, description="Lister récursivement")


class FileInfo(BaseModel):
    name: str
    path: str
    type: str  # "file" ou "directory"
    size: Optional[int] = None
    modified: Optional[str] = None


# 📖 Endpoint: Lecture de fichier
@router.post("/read")
async def read_file(request: FileReadRequest):
    """
    Lit le contenu d'un fichier local

    Exemple:
    ```json
    {
        "path": "C:/Users/rapha/Documents/test.txt",
        "auth": "YOUR_API_KEY"
    }
    ```
    """
    # Vérifier l'authentification
    from server import API_KEY
    if request.auth != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    # Vérifier la sécurité du chemin
    if not is_safe_path(request.path):
        raise HTTPException(status_code=403, detail="Unsafe file path")

    # Vérifier que le fichier existe
    if not os.path.exists(request.path):
        raise HTTPException(status_code=404, detail="File not found")

    if not os.path.isfile(request.path):
        raise HTTPException(status_code=400, detail="Path is not a file")

    try:
        # Lecture asynchrone du fichier
        async with aiofiles.open(request.path, mode='r', encoding=request.encoding) as f:
            content = await f.read()

        logger.info(f"File read: {request.path} ({len(content)} chars)")

        return {
            "success": True,
            "path": request.path,
            "content": content,
            "size": len(content),
            "encoding": request.encoding,
            "timestamp": datetime.now().isoformat()
        }

    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail=f"Cannot decode file with {request.encoding} encoding")
    except Exception as e:
        logger.error(f"Error reading file {request.path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ✍️ Endpoint: Écriture de fichier
@router.post("/write")
async def write_file(request: FileWriteRequest):
    """
    Écrit du contenu dans un fichier local

    Exemple:
    ```json
    {
        "path": "C:/Users/rapha/Documents/test.txt",
        "content": "Hello from AI!",
        "auth": "YOUR_API_KEY",
        "mode": "w"
    }
    ```
    """
    # Vérifier l'authentification
    from server import API_KEY
    if request.auth != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    # Vérifier la sécurité du chemin
    if not is_safe_path(request.path):
        raise HTTPException(status_code=403, detail="Unsafe file path")

    # Valider le mode d'écriture
    if request.mode not in ["w", "a"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'w' or 'a'")

    try:
        # Créer les répertoires parents si nécessaire
        os.makedirs(os.path.dirname(request.path), exist_ok=True)

        # Écriture asynchrone
        async with aiofiles.open(request.path, mode=request.mode, encoding=request.encoding) as f:
            await f.write(request.content)

        logger.info(f"File written: {request.path} ({len(request.content)} chars, mode={request.mode})")

        return {
            "success": True,
            "path": request.path,
            "bytes_written": len(request.content),
            "mode": request.mode,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error writing file {request.path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 📂 Endpoint: Listage de répertoire
@router.post("/list")
async def list_directory(request: DirectoryListRequest):
    """
    Liste le contenu d'un répertoire

    Exemple:
    ```json
    {
        "path": "C:/Users/rapha/Documents",
        "auth": "YOUR_API_KEY",
        "recursive": false
    }
    ```
    """
    # Vérifier l'authentification
    from server import API_KEY
    if request.auth != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    # Vérifier la sécurité du chemin
    if not is_safe_path(request.path):
        raise HTTPException(status_code=403, detail="Unsafe directory path")

    # Vérifier que le répertoire existe
    if not os.path.exists(request.path):
        raise HTTPException(status_code=404, detail="Directory not found")

    if not os.path.isdir(request.path):
        raise HTTPException(status_code=400, detail="Path is not a directory")

    try:
        files: List[FileInfo] = []

        if request.recursive:
            # Parcours récursif
            for root, dirs, filenames in os.walk(request.path):
                for name in filenames:
                    full_path = os.path.join(root, name)
                    stat = os.stat(full_path)
                    files.append(FileInfo(
                        name=name,
                        path=full_path,
                        type="file",
                        size=stat.st_size,
                        modified=datetime.fromtimestamp(stat.st_mtime).isoformat()
                    ))
                for name in dirs:
                    full_path = os.path.join(root, name)
                    files.append(FileInfo(
                        name=name,
                        path=full_path,
                        type="directory"
                    ))
        else:
            # Listage simple
            for entry in os.listdir(request.path):
                full_path = os.path.join(request.path, entry)
                is_file = os.path.isfile(full_path)

                if is_file:
                    stat = os.stat(full_path)
                    files.append(FileInfo(
                        name=entry,
                        path=full_path,
                        type="file",
                        size=stat.st_size,
                        modified=datetime.fromtimestamp(stat.st_mtime).isoformat()
                    ))
                else:
                    files.append(FileInfo(
                        name=entry,
                        path=full_path,
                        type="directory"
                    ))

        logger.info(f"Directory listed: {request.path} ({len(files)} items)")

        return {
            "success": True,
            "path": request.path,
            "count": len(files),
            "items": [f.dict() for f in files],
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error listing directory {request.path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
