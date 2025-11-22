"""
🟣 MCP_LM_Terminal - Local MCP Server for LM Studio + Terminal IA

Package Python pour serveur MCP local interfaçant ChatGPT/Claude avec LM Studio
et terminal interactif.

Modules :
- server : Serveur FastAPI principal
- terminal_handler : Gestionnaire terminal PTY/subprocess
- lmstudio_client : Client API LM Studio

Version : 1.0.0
"""

__version__ = "1.0.0"
__author__ = "Skynet_depot"
__description__ = "Local MCP Server for LM Studio + Terminal IA"

# Imports principaux
from .server import app
from .terminal_handler import TerminalHandler
from .lmstudio_client import LMStudioClient

__all__ = [
    "app",
    "TerminalHandler",
    "LMStudioClient",
]
