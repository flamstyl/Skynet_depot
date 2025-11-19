"""
Base Connector - Abstract interface for AI agent connectors

All AI connectors must implement this interface.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging


logger = logging.getLogger(__name__)


class BaseConnector(ABC):
    """
    Abstract base class for AI agent connectors.

    Each AI platform (Claude, GPT, Gemini, etc.) implements this interface
    to standardize communication with the MCP server.
    """

    def __init__(self, agent_id: str, agent_type: str = "generic"):
        """
        Initialize connector.

        Args:
            agent_id: Unique agent identifier
            agent_type: Agent type/role
        """
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.connected = False

        logger.info(f"Connector initialized: {agent_id} ({agent_type})")

    @abstractmethod
    async def connect(self, server_url: str) -> bool:
        """
        Connect to MCP server.

        Args:
            server_url: MCP server URL

        Returns:
            True if connected successfully
        """
        pass

    @abstractmethod
    async def disconnect(self) -> bool:
        """
        Disconnect from MCP server.

        Returns:
            True if disconnected successfully
        """
        pass

    @abstractmethod
    async def send(self, message: Dict[str, Any]) -> bool:
        """
        Send MCP message to server.

        Args:
            message: MCP message dictionary

        Returns:
            True if sent successfully
        """
        pass

    @abstractmethod
    async def receive(self) -> Optional[Dict[str, Any]]:
        """
        Receive MCP message from server.

        Returns:
            MCP message dictionary or None
        """
        pass

    @abstractmethod
    async def process_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process incoming message and generate response.

        This is where AI-specific logic goes.

        Args:
            message: Incoming MCP message

        Returns:
            Response MCP message
        """
        pass

    def get_status(self) -> Dict[str, Any]:
        """
        Get connector status.

        Returns:
            Status dictionary
        """
        return {
            "agent_id": self.agent_id,
            "agent_type": self.agent_type,
            "connected": self.connected
        }
