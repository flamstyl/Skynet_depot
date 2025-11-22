"""
🐳 Endpoint Docker Sandbox — Exécution isolée dans conteneur
Permet d'exécuter du code dans un environnement Docker isolé
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import subprocess
import logging
from typing import Optional
from datetime import datetime
import os

logger = logging.getLogger(__name__)
router = APIRouter()

# Configuration
SANDBOX_IMAGE = os.getenv("SANDBOX_IMAGE", "mcp-sandbox:latest")
MAX_TIMEOUT = 60


# 📦 Modèles de données
class SandboxRunRequest(BaseModel):
    command: str = Field(..., description="Commande à exécuter dans le sandbox")
    auth: str = Field(..., description="Clé d'authentification")
    timeout: int = Field(default=30, description="Timeout en secondes")
    language: Optional[str] = Field(default="python", description="Langage: python, bash, node, etc.")
    code: Optional[str] = Field(default=None, description="Code source à exécuter")


# 🐳 Endpoint: Exécution dans sandbox Docker
@router.post("/run")
async def run_in_sandbox(request: SandboxRunRequest):
    """
    Exécute une commande dans un conteneur Docker isolé

    Exemple (commande directe):
    ```json
    {
        "command": "python -c 'print(2+2)'",
        "auth": "YOUR_API_KEY",
        "timeout": 10
    }
    ```

    Exemple (code Python):
    ```json
    {
        "language": "python",
        "code": "import sys\\nprint(sys.version)",
        "auth": "YOUR_API_KEY"
    }
    ```

    ⚠️ Nécessite Docker installé et l'image sandbox construite.
    """
    # Vérifier l'authentification
    from server import API_KEY
    if request.auth != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    # Vérifier le timeout
    if request.timeout > MAX_TIMEOUT:
        raise HTTPException(
            status_code=400,
            detail=f"Timeout too high. Max: {MAX_TIMEOUT}s"
        )

    # Vérifier que Docker est disponible
    try:
        subprocess.run(
            ["docker", "--version"],
            capture_output=True,
            check=True
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        raise HTTPException(
            status_code=503,
            detail="Docker not available. Install Docker to use sandbox."
        )

    # Vérifier que l'image existe
    check_image = subprocess.run(
        ["docker", "images", "-q", SANDBOX_IMAGE],
        capture_output=True,
        text=True
    )

    if not check_image.stdout.strip():
        raise HTTPException(
            status_code=503,
            detail=f"Sandbox image '{SANDBOX_IMAGE}' not found. Build it first: cd sandbox && docker build -t {SANDBOX_IMAGE} ."
        )

    try:
        # Construire la commande Docker
        if request.code:
            # Mode: exécuter du code source
            cmd_map = {
                "python": f"python3 -c {repr(request.code)}",
                "bash": f"bash -c {repr(request.code)}",
                "node": f"node -e {repr(request.code)}",
                "javascript": f"node -e {repr(request.code)}",
            }

            command = cmd_map.get(request.language, f"bash -c {repr(request.code)}")
        else:
            # Mode: commande directe
            command = request.command

        # Construire et exécuter la commande Docker
        docker_cmd = [
            "docker", "run",
            "--rm",  # Supprimer le conteneur après exécution
            "--network", "none",  # Pas d'accès réseau
            "--memory", "256m",  # Limite de mémoire
            "--cpus", "0.5",  # Limite CPU
            "--user", "sandbox",  # Utilisateur non-root
            SANDBOX_IMAGE,
            "bash", "-c", command
        ]

        logger.info(f"Running in sandbox: {command}")

        # Exécuter avec timeout
        result = subprocess.run(
            docker_cmd,
            capture_output=True,
            text=True,
            timeout=request.timeout
        )

        logger.info(
            f"Sandbox execution completed | "
            f"Exit code: {result.returncode} | "
            f"Stdout: {len(result.stdout)} chars"
        )

        return {
            "success": result.returncode == 0,
            "command": command,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exit_code": result.returncode,
            "sandbox_image": SANDBOX_IMAGE,
            "timestamp": datetime.now().isoformat()
        }

    except subprocess.TimeoutExpired:
        logger.warning(f"Sandbox timeout after {request.timeout}s")
        raise HTTPException(
            status_code=408,
            detail=f"Sandbox execution timed out after {request.timeout}s"
        )
    except Exception as e:
        logger.error(f"Sandbox execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 🏗️ Endpoint: Build sandbox image
@router.post("/build")
async def build_sandbox_image(auth: str):
    """
    Construit l'image Docker du sandbox

    Exemple:
    ```json
    {
        "auth": "YOUR_API_KEY"
    }
    ```
    """
    # Vérifier l'authentification
    from server import API_KEY
    if auth != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    try:
        # Vérifier que Docker est disponible
        subprocess.run(["docker", "--version"], capture_output=True, check=True)

        # Construire l'image
        logger.info("Building sandbox Docker image...")

        result = subprocess.run(
            ["docker", "build", "-t", SANDBOX_IMAGE, "sandbox/"],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes max pour le build
        )

        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Docker build failed: {result.stderr}"
            )

        logger.info("Sandbox image built successfully")

        return {
            "success": True,
            "image": SANDBOX_IMAGE,
            "message": "Sandbox image built successfully",
            "timestamp": datetime.now().isoformat()
        }

    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Docker not available")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Build timed out")
    except Exception as e:
        logger.error(f"Error building sandbox: {e}")
        raise HTTPException(status_code=500, detail=str(e))
