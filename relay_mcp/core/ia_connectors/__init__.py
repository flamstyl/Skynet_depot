"""
IA Connectors Package
Connectors for various AI agents (Claude, GPT, Gemini, Perplexity, etc.)
"""

from abc import ABC, abstractmethod
from typing import Dict, Any


class IAConnector(ABC):
    """
    Base interface for AI connectors
    All connectors must implement this interface
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize connector with configuration

        Args:
            config: Connector-specific configuration
        """
        self.config = config
        self.enabled = config.get("enabled", True)
        self.timeout = config.get("timeout_seconds", 60)

    @abstractmethod
    async def send(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send message to AI and return response

        Args:
            payload: Message payload containing content and context

        Returns:
            Response dictionary with:
            - content: AI response content
            - tokens_used: Optional token count
            - model: Optional model identifier
        """
        raise NotImplementedError

    @abstractmethod
    async def health_check(self) -> bool:
        """
        Check if connector is healthy and ready

        Returns:
            True if healthy, False otherwise
        """
        raise NotImplementedError

    def is_enabled(self) -> bool:
        """Check if connector is enabled"""
        return self.enabled


# Import all connectors for convenience
from .claude_cli import ClaudeConnector
from .gpt_local import GPTConnector
from .gemini_cli import GeminiConnector
from .perplexity_bridge import PerplexityConnector

__all__ = [
    'IAConnector',
    'ClaudeConnector',
    'GPTConnector',
    'GeminiConnector',
    'PerplexityConnector'
]
