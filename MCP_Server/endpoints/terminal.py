"""
💻 Endpoint Terminal — Exécution sécurisée de commandes
Permet aux IA d'exécuter des commandes système avec timeout et isolation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import subprocess
import asyncio
import logging
import os
import platform
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

# Configuration
MAX_TIMEOUT = int(os.getenv("MAX_COMMAND_TIMEOUT", "30"))  # secondes
DEFAULT_TIMEOUT = int(os.getenv("DEFAULT_COMMAND_TIMEOUT", "10"))


# 📦 Modèles de données
class TerminalExecuteRequest(BaseModel):
    command: str = Field(..., description="Commande à exécuter")
    auth: str = Field(..., description="Clé d'authentification")
    timeout: int = Field(default=DEFAULT_TIMEOUT, description="Timeout en secondes")
    shell: bool = Field(default=True, description="Exécuter dans un shell")
    cwd: Optional[str] = Field(default=None, description="Répertoire de travail")
    env: Optional[dict] = Field(default=None, description="Variables d'environnement")


class TerminalResponse(BaseModel):
    success: bool
    command: str
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float
    timestamp: str


# 🔐 Liste noire de commandes dangereuses
DANGEROUS_COMMANDS = [
    "rm -rf /",
    "mkfs",
    "dd if=",
    ":(){:|:&};:",  # fork bomb
    "chmod -R 777 /",
    "curl | sh",
    "wget | sh",
    "> /dev/sda",
]


def is_dangerous_command(command: str) -> bool:
    """Détecte les commandes potentiellement dangereuses"""
    cmd_lower = command.lower().strip()

    for dangerous in DANGEROUS_COMMANDS:
        if dangerous.lower() in cmd_lower:
            logger.warning(f"Blocked dangerous command: {command}")
            return True

    return False


# 💻 Endpoint: Exécution de commande
@router.post("/execute", response_model=TerminalResponse)
async def execute_command(request: TerminalExecuteRequest):
    """
    Exécute une commande système et retourne le résultat

    Exemple:
    ```json
    {
        "command": "ls -la",
        "auth": "YOUR_API_KEY",
        "timeout": 10
    }
    ```

    Exemple Windows:
    ```json
    {
        "command": "dir",
        "auth": "YOUR_API_KEY"
    }
    ```
    """
    # Vérifier l'authentification
    from server import API_KEY
    if request.auth != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    # Vérifier le timeout
    if request.timeout > MAX_TIMEOUT:
        raise HTTPException(
            status_code=400,
            detail=f"Timeout too high. Max allowed: {MAX_TIMEOUT}s"
        )

    # Vérifier les commandes dangereuses
    if is_dangerous_command(request.command):
        raise HTTPException(status_code=403, detail="Dangerous command blocked")

    start_time = asyncio.get_event_loop().time()

    try:
        # Déterminer le shell selon la plateforme
        if platform.system() == "Windows":
            shell_executable = "cmd.exe" if request.shell else None
        else:
            shell_executable = "/bin/bash" if request.shell else None

        # Préparer l'environnement
        env = os.environ.copy()
        if request.env:
            env.update(request.env)

        # Exécuter la commande de manière asynchrone
        process = await asyncio.create_subprocess_shell(
            request.command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=request.cwd,
            env=env,
            shell=request.shell
        )

        # Attendre avec timeout
        try:
            stdout_data, stderr_data = await asyncio.wait_for(
                process.communicate(),
                timeout=request.timeout
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            raise HTTPException(
                status_code=408,
                detail=f"Command timed out after {request.timeout}s"
            )

        # Décoder les sorties
        stdout = stdout_data.decode('utf-8', errors='replace')
        stderr = stderr_data.decode('utf-8', errors='replace')
        exit_code = process.returncode

        execution_time = asyncio.get_event_loop().time() - start_time

        logger.info(
            f"Command executed: '{request.command}' | "
            f"Exit code: {exit_code} | "
            f"Time: {execution_time:.2f}s"
        )

        return TerminalResponse(
            success=exit_code == 0,
            command=request.command,
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            execution_time=round(execution_time, 3),
            timestamp=datetime.now().isoformat()
        )

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Command or working directory not found")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        logger.error(f"Error executing command '{request.command}': {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 🖥️ Endpoint: Informations système
@router.post("/info")
async def system_info(auth: str):
    """
    Retourne des informations sur le système

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
        return {
            "success": True,
            "system": platform.system(),
            "platform": platform.platform(),
            "processor": platform.processor(),
            "python_version": platform.python_version(),
            "cwd": os.getcwd(),
            "user": os.environ.get("USER") or os.environ.get("USERNAME"),
            "home": os.path.expanduser("~"),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        raise HTTPException(status_code=500, detail=str(e))
