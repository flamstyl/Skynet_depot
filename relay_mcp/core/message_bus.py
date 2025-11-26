"""
Message Bus - Central routing and queuing system for MCP messages
"""

import asyncio
from collections import deque, defaultdict
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Callable
import threading
from core.protocol_mcp import MCPProtocol, MessageStatus


class MessageBus:
    """
    Central message bus for routing MCP messages between AI connectors
    """

    def __init__(self, buffer_manager=None, persistence_layer=None):
        """
        Initialize message bus

        Args:
            buffer_manager: BufferManager instance for message history
            persistence_layer: PersistenceLayer instance for durability
        """
        self.buffer_manager = buffer_manager
        self.persistence_layer = persistence_layer

        # Message queues
        self._pending_queue: asyncio.Queue = asyncio.Queue()
        self._in_transit: Dict[str, Dict[str, Any]] = {}
        self._completed: deque = deque(maxlen=1000)

        # Connector registry
        self._connectors: Dict[str, Any] = {}

        # Statistics
        self._stats = {
            "total_processed": 0,
            "total_errors": 0,
            "total_timeouts": 0,
            "by_ai": defaultdict(int),
            "by_type": defaultdict(int),
            "avg_latency_ms": 0,
            "_latencies": deque(maxlen=1000)
        }

        self._lock = threading.RLock()
        self._running = False

    def register_connector(self, ai_key: str, connector: Any):
        """
        Register an AI connector

        Args:
            ai_key: AI identifier
            connector: Connector instance implementing send() method
        """
        with self._lock:
            self._connectors[ai_key] = connector
            print(f"Registered connector: {ai_key}")

    def unregister_connector(self, ai_key: str):
        """
        Unregister an AI connector

        Args:
            ai_key: AI identifier to unregister
        """
        with self._lock:
            if ai_key in self._connectors:
                del self._connectors[ai_key]
                print(f"Unregistered connector: {ai_key}")

    async def enqueue(self, message: Dict[str, Any]) -> bool:
        """
        Enqueue message for processing

        Args:
            message: MCP message to enqueue

        Returns:
            True if enqueued successfully

        Raises:
            ValueError: If message is invalid
        """
        # Validate message
        is_valid, error = MCPProtocol.validate_message(message)
        if not is_valid:
            raise ValueError(f"Invalid message: {error}")

        # Check if expired
        if MCPProtocol.is_expired(message):
            print(f"Message {message['key']} is expired, skipping")
            return False

        # Add to queue
        await self._pending_queue.put(message)

        # Update stats
        with self._lock:
            self._stats["by_type"][message.get("type", "unknown")] += 1

        print(f"Enqueued message {message['key']} from {message['from']} to {message['to']}")
        return True

    async def dequeue(self, timeout: Optional[float] = None) -> Optional[Dict[str, Any]]:
        """
        Dequeue next message for processing

        Args:
            timeout: Optional timeout in seconds

        Returns:
            Next message or None if timeout
        """
        try:
            if timeout:
                message = await asyncio.wait_for(
                    self._pending_queue.get(),
                    timeout=timeout
                )
            else:
                message = await self._pending_queue.get()

            # Move to in-transit
            with self._lock:
                self._in_transit[message["key"]] = {
                    "message": message,
                    "started_at": datetime.now(timezone.utc).isoformat()
                }

            return message

        except asyncio.TimeoutError:
            return None

    async def route_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Route message to appropriate connector and get response

        Args:
            message: Message to route

        Returns:
            Response dictionary

        Raises:
            ValueError: If target connector not found
        """
        target = message.get("to")
        if not target:
            raise ValueError("Message has no 'to' field")

        # Get connector
        connector = self._connectors.get(target)
        if not connector:
            raise ValueError(f"No connector registered for: {target}")

        # Send to connector
        start_time = datetime.now(timezone.utc)
        try:
            response_content = await connector.send(message["payload"])

            # Build response
            latency_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            response = MCPProtocol.build_response(
                request_key=message["key"],
                status=MessageStatus.OK,
                response_content=response_content.get("content", ""),
                tokens_used=response_content.get("tokens_used"),
                model=response_content.get("model"),
                latency_ms=latency_ms,
                connector=target
            )

            # Update stats
            self._update_stats(message, latency_ms, success=True)

            return response

        except asyncio.TimeoutError:
            # Timeout
            latency_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            response = MCPProtocol.build_response(
                request_key=message["key"],
                status=MessageStatus.TIMEOUT,
                error_message="Connector timeout",
                latency_ms=latency_ms,
                connector=target
            )

            self._update_stats(message, latency_ms, success=False, timeout=True)
            return response

        except Exception as e:
            # Error
            latency_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            response = MCPProtocol.build_response(
                request_key=message["key"],
                status=MessageStatus.ERROR,
                error_message=str(e),
                latency_ms=latency_ms,
                connector=target
            )

            self._update_stats(message, latency_ms, success=False)
            return response

    async def complete(self, message_key: str, response: Dict[str, Any]):
        """
        Mark message as completed

        Args:
            message_key: Message key to complete
            response: Response to associate with message
        """
        with self._lock:
            # Remove from in-transit
            if message_key in self._in_transit:
                transit_info = self._in_transit.pop(message_key)
                message = transit_info["message"]

                # Add to completed
                self._completed.append({
                    "message": message,
                    "response": response,
                    "completed_at": datetime.now(timezone.utc).isoformat()
                })

                # Add to buffer if available
                if self.buffer_manager:
                    self.buffer_manager.add(message)

                # Persist if available
                if self.persistence_layer:
                    self.persistence_layer.save_message(message, response)

    def _update_stats(
        self,
        message: Dict[str, Any],
        latency_ms: float,
        success: bool = True,
        timeout: bool = False
    ):
        """Update internal statistics"""
        with self._lock:
            self._stats["total_processed"] += 1

            if not success:
                if timeout:
                    self._stats["total_timeouts"] += 1
                else:
                    self._stats["total_errors"] += 1

            # Track by AI
            from_ai = message.get("from", "unknown")
            to_ai = message.get("to", "unknown")
            self._stats["by_ai"][from_ai] += 1
            self._stats["by_ai"][to_ai] += 1

            # Track latency
            self._stats["_latencies"].append(latency_ms)
            if self._stats["_latencies"]:
                self._stats["avg_latency_ms"] = sum(self._stats["_latencies"]) / len(self._stats["_latencies"])

    def get_stats(self) -> Dict[str, Any]:
        """
        Get bus statistics

        Returns:
            Statistics dictionary
        """
        with self._lock:
            return {
                "total_processed": self._stats["total_processed"],
                "total_errors": self._stats["total_errors"],
                "total_timeouts": self._stats["total_timeouts"],
                "error_rate": (
                    self._stats["total_errors"] / self._stats["total_processed"]
                    if self._stats["total_processed"] > 0 else 0
                ),
                "timeout_rate": (
                    self._stats["total_timeouts"] / self._stats["total_processed"]
                    if self._stats["total_processed"] > 0 else 0
                ),
                "avg_latency_ms": round(self._stats["avg_latency_ms"], 2),
                "by_ai": dict(self._stats["by_ai"]),
                "by_type": dict(self._stats["by_type"]),
                "pending_queue_size": self._pending_queue.qsize(),
                "in_transit_count": len(self._in_transit),
                "active_connectors": list(self._connectors.keys())
            }

    def get_active_connections(self) -> List[str]:
        """
        Get list of active AI connectors

        Returns:
            List of AI keys with registered connectors
        """
        with self._lock:
            return list(self._connectors.keys())

    def get_recent_completed(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get recently completed messages

        Args:
            limit: Maximum number to return

        Returns:
            List of completed message entries
        """
        with self._lock:
            completed = list(self._completed)
            completed.reverse()  # Newest first
            return completed[:limit]

    def clear_stats(self):
        """Reset statistics"""
        with self._lock:
            self._stats = {
                "total_processed": 0,
                "total_errors": 0,
                "total_timeouts": 0,
                "by_ai": defaultdict(int),
                "by_type": defaultdict(int),
                "avg_latency_ms": 0,
                "_latencies": deque(maxlen=1000)
            }


# Example usage
if __name__ == "__main__":
    from core.protocol_mcp import MCPProtocol, Priority

    # Mock connector
    class MockConnector:
        async def send(self, payload):
            await asyncio.sleep(0.1)  # Simulate processing
            return {
                "content": f"Response to: {payload['content']}",
                "tokens_used": 100,
                "model": "mock-model"
            }

    async def test_message_bus():
        bus = MessageBus()

        # Register mock connector
        bus.register_connector("claude", MockConnector())

        # Create and enqueue message
        msg = MCPProtocol.build_request(
            from_ai="gemini",
            to_ai="claude",
            content="Test message",
            priority=Priority.NORMAL
        )

        await bus.enqueue(msg)
        print("Message enqueued")

        # Dequeue and process
        message = await bus.dequeue()
        print(f"Dequeued: {message['key']}")

        # Route message
        response = await bus.route_message(message)
        print(f"Response: {response}")

        # Complete
        await bus.complete(message["key"], response)
        print("Completed")

        # Get stats
        stats = bus.get_stats()
        print(f"Stats: {stats}")

    # Run test
    asyncio.run(test_message_bus())
