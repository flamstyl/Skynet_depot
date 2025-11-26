"""
Relay Server - Core runtime orchestrator for RelayMCP
"""

import asyncio
import yaml
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from logging.handlers import RotatingFileHandler

from core.protocol_mcp import MCPProtocol
from core.message_bus import MessageBus
from core.buffer_manager import BufferManager
from core.persistence import PersistenceLayer
from core.ia_connectors import (
    ClaudeConnector,
    GPTConnector,
    GeminiConnector,
    PerplexityConnector
)


class RelayServer:
    """
    Main relay server orchestrator
    Manages message bus, connectors, and message processing loop
    """

    def __init__(self, config_path: str = "core/config.yaml"):
        """
        Initialize relay server

        Args:
            config_path: Path to configuration file
        """
        self.config_path = config_path
        self.config = self._load_config()
        self.logger = self._setup_logging()

        # Initialize components
        self.buffer_manager = None
        self.persistence_layer = None
        self.message_bus = None
        self.running = False

        self.logger.info("RelayMCP Server initialized")

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        with open(self.config_path, 'r') as f:
            config = yaml.safe_load(f)

        # Expand environment variables in config
        # TODO: Add environment variable expansion for sensitive values
        return config

    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        log_config = self.config.get("logging", {})

        logger = logging.getLogger("RelayMCP")
        logger.setLevel(log_config.get("level", "INFO"))

        # Ensure log directory exists
        log_file = Path(log_config.get("file", "data/logs/relay.log"))
        log_file.parent.mkdir(parents=True, exist_ok=True)

        # Rotating file handler
        handler = RotatingFileHandler(
            log_file,
            maxBytes=log_config.get("max_bytes", 10485760),
            backupCount=log_config.get("backup_count", 5)
        )

        formatter = logging.Formatter(
            log_config.get("format", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

        # Console handler
        console = logging.StreamHandler()
        console.setFormatter(formatter)
        logger.addHandler(console)

        return logger

    async def initialize(self):
        """Initialize all components"""
        self.logger.info("Initializing RelayMCP components...")

        # Initialize persistence layer
        persistence_config = self.config.get("persistence", {})
        self.persistence_layer = PersistenceLayer(
            db_path=persistence_config.get("db_path", "data/buffer.db"),
            jsonl_path=persistence_config.get("jsonl_path", "data/logs/mcp_traffic.jsonl")
        )
        self.logger.info("Persistence layer initialized")

        # Initialize buffer manager
        buffer_config = self.config.get("buffer", {})
        self.buffer_manager = BufferManager(
            max_size=buffer_config.get("max_size", 10000),
            ttl_seconds=buffer_config.get("ttl_seconds", 86400),
            drop_policy=buffer_config.get("drop_policy", "oldest_first")
        )
        self.logger.info("Buffer manager initialized")

        # Initialize message bus
        self.message_bus = MessageBus(
            buffer_manager=self.buffer_manager,
            persistence_layer=self.persistence_layer
        )
        self.logger.info("Message bus initialized")

        # Register connectors
        await self._register_connectors()

        self.logger.info("RelayMCP initialization complete")

    async def _register_connectors(self):
        """Register all configured AI connectors"""
        connectors_config = self.config.get("connectors", {})

        # Claude
        if connectors_config.get("claude", {}).get("enabled", False):
            try:
                claude = ClaudeConnector(connectors_config["claude"])
                if await claude.health_check():
                    self.message_bus.register_connector("claude", claude)
                    self.logger.info("Claude connector registered and healthy")
                else:
                    self.logger.warning("Claude connector failed health check")
            except Exception as e:
                self.logger.error(f"Failed to register Claude connector: {e}")

        # GPT
        if connectors_config.get("gpt", {}).get("enabled", False):
            try:
                gpt = GPTConnector(connectors_config["gpt"])
                if await gpt.health_check():
                    self.message_bus.register_connector("gpt", gpt)
                    self.logger.info("GPT connector registered and healthy")
                else:
                    self.logger.warning("GPT connector failed health check")
            except Exception as e:
                self.logger.error(f"Failed to register GPT connector: {e}")

        # Gemini
        if connectors_config.get("gemini", {}).get("enabled", False):
            try:
                gemini = GeminiConnector(connectors_config["gemini"])
                # Register even if health check fails (might use stub)
                self.message_bus.register_connector("gemini", gemini)
                is_healthy = await gemini.health_check()
                self.logger.info(f"Gemini connector registered (healthy: {is_healthy})")
            except Exception as e:
                self.logger.error(f"Failed to register Gemini connector: {e}")

        # Perplexity
        if connectors_config.get("perplexity", {}).get("enabled", False):
            try:
                perplexity = PerplexityConnector(connectors_config["perplexity"])
                if await perplexity.health_check():
                    self.message_bus.register_connector("perplexity", perplexity)
                    self.logger.info("Perplexity connector registered and healthy")
                else:
                    self.logger.warning("Perplexity connector failed health check")
            except Exception as e:
                self.logger.error(f"Failed to register Perplexity connector: {e}")

    async def process_messages(self):
        """
        Main message processing loop
        Dequeues messages and routes them to appropriate connectors
        """
        self.logger.info("Message processing loop started")

        while self.running:
            try:
                # Dequeue next message (with timeout to allow checking running flag)
                message = await self.message_bus.dequeue(timeout=1.0)

                if message is None:
                    continue

                self.logger.info(
                    f"Processing message {message['key']}: {message['from']} -> {message['to']}"
                )

                # Route message to connector
                response = await self.message_bus.route_message(message)

                # Complete message
                await self.message_bus.complete(message["key"], response)

                self.logger.info(
                    f"Completed message {message['key']} with status {response['status']}"
                )

            except Exception as e:
                self.logger.error(f"Error processing message: {e}", exc_info=True)

        self.logger.info("Message processing loop stopped")

    async def cleanup_expired_task(self):
        """Periodic task to cleanup expired messages from buffer"""
        buffer_config = self.config.get("buffer", {})
        interval = buffer_config.get("persist_interval_seconds", 300)

        while self.running:
            await asyncio.sleep(interval)

            try:
                removed = self.buffer_manager.cleanup_expired()
                if removed > 0:
                    self.logger.info(f"Cleaned up {removed} expired messages from buffer")
            except Exception as e:
                self.logger.error(f"Error during cleanup: {e}")

    async def start(self):
        """Start the relay server"""
        self.logger.info("Starting RelayMCP server...")

        # Initialize components
        await self.initialize()

        # Start processing
        self.running = True

        # Create background tasks
        processing_task = asyncio.create_task(self.process_messages())
        cleanup_task = asyncio.create_task(self.cleanup_expired_task())

        self.logger.info("RelayMCP server running")

        try:
            # Keep running until stopped
            await asyncio.gather(processing_task, cleanup_task)
        except asyncio.CancelledError:
            self.logger.info("Server tasks cancelled")

    async def stop(self):
        """Stop the relay server"""
        self.logger.info("Stopping RelayMCP server...")
        self.running = False
        await asyncio.sleep(1)  # Give tasks time to finish
        self.logger.info("RelayMCP server stopped")

    def get_stats(self) -> Dict[str, Any]:
        """Get server statistics"""
        return {
            "server": {
                "running": self.running,
                "active_connectors": self.message_bus.get_active_connections()
            },
            "message_bus": self.message_bus.get_stats(),
            "buffer": self.buffer_manager.get_stats(),
            "persistence": self.persistence_layer.get_stats()
        }


# Standalone runner
async def main():
    """Main entry point for standalone execution"""
    import signal

    server = RelayServer()

    # Setup graceful shutdown
    def signal_handler(sig, frame):
        print("\nShutting down gracefully...")
        asyncio.create_task(server.stop())

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        await server.start()
    except KeyboardInterrupt:
        await server.stop()


if __name__ == "__main__":
    asyncio.run(main())
