"""
WebSocket Bridge to MCP Server
Handles communication between Companion API and MCP Server
"""

import asyncio
import websockets
import json
import logging
from typing import Dict, Any, AsyncIterator, Optional

logger = logging.getLogger("websocket_bridge")


class MCPBridge:
    """
    WebSocket bridge to MCP Server
    """

    def __init__(self, mcp_url: str = "ws://localhost:8080/mcp"):
        self.mcp_url = mcp_url
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.connected = False
        self._heartbeat_task: Optional[asyncio.Task] = None

    async def connect(self):
        """
        Establish WebSocket connection to MCP Server
        """
        try:
            logger.info(f"Connecting to MCP Server at {self.mcp_url}...")

            self.websocket = await websockets.connect(
                self.mcp_url,
                ping_interval=30,
                ping_timeout=10
            )

            self.connected = True
            logger.info("✅ Connected to MCP Server")

            # Start heartbeat
            self._heartbeat_task = asyncio.create_task(self._heartbeat())

        except Exception as e:
            logger.error(f"❌ Failed to connect to MCP: {e}")
            self.connected = False
            raise

    async def disconnect(self):
        """
        Close WebSocket connection
        """
        if self._heartbeat_task:
            self._heartbeat_task.cancel()

        if self.websocket:
            await self.websocket.close()
            self.connected = False
            logger.info("Disconnected from MCP Server")

    async def is_connected(self) -> bool:
        """
        Check if connected to MCP
        """
        return self.connected and self.websocket is not None and self.websocket.open

    async def send_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send message to MCP and wait for response

        Args:
            message: Message dict with agent, content, context, type

        Returns:
            Response dict from MCP
        """
        if not await self.is_connected():
            # Attempt reconnection
            try:
                await self.connect()
            except:
                return {
                    "content": "Error: Not connected to MCP Server",
                    "success": False,
                    "error": "MCP connection failed"
                }

        try:
            # Send message
            await self.websocket.send(json.dumps(message))
            logger.info(f"Sent message to MCP: {message.get('agent')}")

            # Wait for response
            response_raw = await self.websocket.recv()
            response = json.loads(response_raw)

            logger.info(f"Received response from MCP: {len(response.get('content', ''))} chars")

            return response

        except Exception as e:
            logger.error(f"Error sending message: {e}")
            return {
                "content": f"Error: {str(e)}",
                "success": False,
                "error": str(e)
            }

    async def stream_message(self, message: Dict[str, Any]) -> AsyncIterator[str]:
        """
        Send message and stream response chunks

        Args:
            message: Message dict

        Yields:
            Response chunks as they arrive
        """
        if not await self.is_connected():
            try:
                await self.connect()
            except:
                yield "Error: Not connected to MCP Server"
                return

        try:
            # Send message with streaming flag
            message["stream"] = True
            await self.websocket.send(json.dumps(message))

            logger.info(f"Streaming message to MCP: {message.get('agent')}")

            # Receive and yield chunks
            while True:
                chunk_raw = await self.websocket.recv()
                chunk = json.loads(chunk_raw)

                # Check if complete
                if chunk.get("type") == "complete":
                    break

                # Yield content chunk
                if "content" in chunk:
                    yield chunk["content"]

        except Exception as e:
            logger.error(f"Error streaming message: {e}")
            yield f"Error: {str(e)}"

    async def _heartbeat(self):
        """
        Send periodic heartbeat to keep connection alive
        """
        while self.connected:
            try:
                await asyncio.sleep(30)

                if self.websocket and self.websocket.open:
                    await self.websocket.ping()
                    logger.debug("Heartbeat sent")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
                self.connected = False
                break


# Mock MCP Server for testing (if real MCP not available)
class MockMCPServer:
    """
    Mock MCP Server for testing without real backend
    """

    @staticmethod
    async def handle_message(message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle mock message
        """
        agent = message.get("agent", "unknown")
        content = message.get("content", "")
        msg_type = message.get("type", "query")

        # Simulate processing delay
        await asyncio.sleep(0.5)

        # Generate mock response
        mock_responses = {
            "claude": f"[Mock Claude] I received: '{content[:50]}...'",
            "gpt": f"[Mock GPT] Here's my response to: '{content[:50]}...'",
            "gemini": f"[Mock Gemini] Processing: '{content[:50]}...'",
            "comet": f"[Mock Comet] Research results for: '{content[:50]}...'"
        }

        return {
            "content": mock_responses.get(agent, f"[Mock {agent}] Response"),
            "agent": agent,
            "success": True,
            "timestamp": "2025-11-19T00:00:00Z"
        }


# For testing without real MCP Server
class MockMCPBridge(MCPBridge):
    """
    Mock bridge that doesn't require real MCP Server
    """

    async def connect(self):
        """Mock connection"""
        logger.info("Using MOCK MCP Bridge (no real connection)")
        self.connected = True

    async def disconnect(self):
        """Mock disconnect"""
        self.connected = False

    async def is_connected(self) -> bool:
        """Mock connection check"""
        return True

    async def send_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Mock message sending"""
        return await MockMCPServer.handle_message(message)

    async def stream_message(self, message: Dict[str, Any]) -> AsyncIterator[str]:
        """Mock streaming"""
        response = await MockMCPServer.handle_message(message)
        content = response.get("content", "")

        # Simulate streaming by yielding chunks
        words = content.split()
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i:i+3]) + " "
            await asyncio.sleep(0.1)
            yield chunk
