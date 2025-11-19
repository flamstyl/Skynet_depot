"""
MCP Tool - Support des serveurs MCP externes
"""

import json
import asyncio
from typing import Dict, List, Optional, Any


class MCPTool:
    """
    Gestionnaire de serveurs MCP
    Permet de se connecter à des serveurs MCP externes
    """

    def __init__(self):
        self.servers: Dict[str, Dict] = {}
        self.processes: Dict[str, asyncio.subprocess.Process] = {}

    async def connect_server(self, name: str, command: str, args: List[str]) -> bool:
        """
        Connecte à un serveur MCP

        Args:
            name: Nom du serveur
            command: Commande (ex: "node")
            args: Arguments (ex: ["path/to/server.js"])

        Returns:
            True si succès
        """
        try:
            # Lancer le processus
            process = await asyncio.create_subprocess_exec(
                command,
                *args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            self.processes[name] = process

            # Envoyer la requête d'initialisation
            init_request = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {
                        "name": "grok-cli",
                        "version": "1.0.0"
                    }
                }
            }

            await self._send_request(name, init_request)

            # Attendre la réponse
            response = await self._read_response(name)

            if response and "result" in response:
                self.servers[name] = {
                    "capabilities": response["result"].get("capabilities", {}),
                    "serverInfo": response["result"].get("serverInfo", {})
                }
                return True

            return False

        except Exception as e:
            print(f"❌ Erreur connexion MCP '{name}': {e}")
            return False

    async def call_tool(self, server: str, tool: str, arguments: Dict[str, Any]) -> Optional[Dict]:
        """
        Appelle un outil MCP

        Args:
            server: Nom du serveur
            tool: Nom de l'outil
            arguments: Arguments de l'outil

        Returns:
            Résultat de l'outil
        """
        if server not in self.servers:
            return {"error": f"Serveur '{server}' non connecté"}

        request = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": tool,
                "arguments": arguments
            }
        }

        try:
            await self._send_request(server, request)
            response = await self._read_response(server)

            if response and "result" in response:
                return response["result"]

            return {"error": "Pas de réponse"}

        except Exception as e:
            return {"error": str(e)}

    async def list_tools(self, server: str) -> List[Dict]:
        """Liste les outils disponibles d'un serveur"""
        if server not in self.servers:
            return []

        request = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/list",
            "params": {}
        }

        try:
            await self._send_request(server, request)
            response = await self._read_response(server)

            if response and "result" in response:
                return response["result"].get("tools", [])

            return []

        except Exception as e:
            print(f"❌ Erreur list tools: {e}")
            return []

    async def _send_request(self, server: str, request: Dict):
        """Envoie une requête JSON-RPC"""
        if server not in self.processes:
            raise ValueError(f"Serveur {server} non trouvé")

        process = self.processes[server]
        message = json.dumps(request) + "\n"
        process.stdin.write(message.encode())
        await process.stdin.drain()

    async def _read_response(self, server: str, timeout: float = 5.0) -> Optional[Dict]:
        """Lit une réponse JSON-RPC"""
        if server not in self.processes:
            return None

        process = self.processes[server]

        try:
            line = await asyncio.wait_for(
                process.stdout.readline(),
                timeout=timeout
            )

            if line:
                return json.loads(line.decode())

            return None

        except asyncio.TimeoutError:
            return None
        except json.JSONDecodeError:
            return None

    async def disconnect_server(self, name: str):
        """Déconnecte un serveur MCP"""
        if name in self.processes:
            process = self.processes[name]
            process.terminate()
            await process.wait()

            del self.processes[name]
            if name in self.servers:
                del self.servers[name]

    async def disconnect_all(self):
        """Déconnecte tous les serveurs"""
        for name in list(self.servers.keys()):
            await self.disconnect_server(name)
