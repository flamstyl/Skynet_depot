"""
Unit tests for Message Bus
"""

import pytest
import asyncio
from core.message_bus import MessageBus
from core.protocol_mcp import MCPProtocol, Priority


class MockConnector:
    """Mock connector for testing"""

    def __init__(self, response_content="Mock response"):
        self.response_content = response_content
        self.call_count = 0

    async def send(self, payload):
        """Mock send method"""
        self.call_count += 1
        await asyncio.sleep(0.1)  # Simulate processing
        return {
            "content": self.response_content,
            "tokens_used": 50,
            "model": "mock-model"
        }

    async def health_check(self):
        """Mock health check"""
        return True


class TestMessageBus:
    """Test suite for Message Bus"""

    @pytest.mark.asyncio
    async def test_register_connector(self):
        """Test registering a connector"""
        bus = MessageBus()
        connector = MockConnector()

        bus.register_connector("test_ai", connector)

        assert "test_ai" in bus.get_active_connections()

    @pytest.mark.asyncio
    async def test_enqueue_message(self):
        """Test enqueuing a message"""
        bus = MessageBus()

        msg = MCPProtocol.build_request(
            from_ai="gpt",
            to_ai="claude",
            content="Test message",
            priority=Priority.NORMAL
        )

        success = await bus.enqueue(msg)
        assert success is True

        stats = bus.get_stats()
        assert stats["pending_queue_size"] == 1

    @pytest.mark.asyncio
    async def test_enqueue_invalid_message(self):
        """Test enqueuing an invalid message raises ValueError"""
        bus = MessageBus()

        invalid_msg = {"key": "test"}

        with pytest.raises(ValueError):
            await bus.enqueue(invalid_msg)

    @pytest.mark.asyncio
    async def test_dequeue_message(self):
        """Test dequeuing a message"""
        bus = MessageBus()

        msg = MCPProtocol.build_request(
            from_ai="gpt",
            to_ai="claude",
            content="Test"
        )

        await bus.enqueue(msg)
        dequeued = await bus.dequeue()

        assert dequeued is not None
        assert dequeued["key"] == msg["key"]

    @pytest.mark.asyncio
    async def test_route_message(self):
        """Test routing a message to connector"""
        bus = MessageBus()
        connector = MockConnector("Test response")
        bus.register_connector("claude", connector)

        msg = MCPProtocol.build_request(
            from_ai="gpt",
            to_ai="claude",
            content="Test message"
        )

        response = await bus.route_message(msg)

        assert response["status"] == "ok"
        assert response["response"]["content"] == "Test response"
        assert connector.call_count == 1

    @pytest.mark.asyncio
    async def test_route_message_no_connector(self):
        """Test routing to non-existent connector raises ValueError"""
        bus = MessageBus()

        msg = MCPProtocol.build_request(
            from_ai="gpt",
            to_ai="nonexistent",
            content="Test"
        )

        with pytest.raises(ValueError):
            await bus.route_message(msg)

    @pytest.mark.asyncio
    async def test_complete_message(self):
        """Test completing a message"""
        bus = MessageBus()
        connector = MockConnector()
        bus.register_connector("claude", connector)

        msg = MCPProtocol.build_request(
            from_ai="gpt",
            to_ai="claude",
            content="Test"
        )

        await bus.enqueue(msg)
        dequeued = await bus.dequeue()
        response = await bus.route_message(dequeued)
        await bus.complete(dequeued["key"], response)

        recent = bus.get_recent_completed(limit=10)
        assert len(recent) == 1
        assert recent[0]["message"]["key"] == msg["key"]

    @pytest.mark.asyncio
    async def test_get_stats(self):
        """Test getting bus statistics"""
        bus = MessageBus()
        connector = MockConnector()
        bus.register_connector("claude", connector)

        # Process a message
        msg = MCPProtocol.build_request(
            from_ai="gpt",
            to_ai="claude",
            content="Test"
        )

        await bus.enqueue(msg)
        dequeued = await bus.dequeue()
        response = await bus.route_message(dequeued)
        await bus.complete(dequeued["key"], response)

        stats = bus.get_stats()

        assert stats["total_processed"] == 1
        assert stats["total_errors"] == 0
        assert "claude" in stats["active_connectors"]
        assert stats["avg_latency_ms"] > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
