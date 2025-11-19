"""
Terminal Tool - Exécution de commandes shell
"""

import asyncio
import subprocess
from typing import Dict, Optional
from pathlib import Path


class TerminalTool:
    """Outil pour exécuter des commandes shell"""

    # Commandes dangereuses bloquées
    BLOCKED_COMMANDS = [
        "rm -rf /",
        "mkfs",
        "dd if=",
        ":(){ :|:& };:",  # fork bomb
    ]

    def __init__(self, working_dir: Optional[Path] = None):
        self.working_dir = working_dir or Path.cwd()

    def is_safe(self, command: str) -> bool:
        """Vérifie si la commande est safe"""
        cmd_lower = command.lower().strip()

        for blocked in self.BLOCKED_COMMANDS:
            if blocked.lower() in cmd_lower:
                return False

        return True

    async def execute(self, command: str, timeout: int = 30) -> Dict[str, str]:
        """
        Execute une commande shell

        Returns:
            {
                "stdout": str,
                "stderr": str,
                "returncode": int,
                "success": bool
            }
        """

        if not self.is_safe(command):
            return {
                "stdout": "",
                "stderr": "❌ Commande bloquée pour raisons de sécurité",
                "returncode": -1,
                "success": False
            }

        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.working_dir)
            )

            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout
                )

                return {
                    "stdout": stdout.decode("utf-8", errors="ignore"),
                    "stderr": stderr.decode("utf-8", errors="ignore"),
                    "returncode": process.returncode or 0,
                    "success": process.returncode == 0
                }

            except asyncio.TimeoutError:
                process.kill()
                await process.communicate()

                return {
                    "stdout": "",
                    "stderr": f"⏱️ Timeout après {timeout}s",
                    "returncode": -1,
                    "success": False
                }

        except Exception as e:
            return {
                "stdout": "",
                "stderr": f"❌ Erreur: {str(e)}",
                "returncode": -1,
                "success": False
            }
