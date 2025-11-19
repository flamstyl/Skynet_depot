"""
Unit tests for MCP Protocol
"""

import pytest
from datetime import datetime
from core.protocol_mcp import (
    MCPProtocol,
    MessageType,
    MessageStatus,
    Priority
)


class TestMCPProtocol:
    """Test suite for MCP Protocol"""

    def test_build_request(self):
        """Test building a request message"""
        msg = MCPProtocol.build_request(
            from_ai="gemini",
            to_ai="claude",
            content="Test message",
            priority=Priority.HIGH
        )

        assert msg["from"] == "gemini"
        assert msg["to"] == "claude"
        assert msg["type"] == MessageType.REQUEST.value
        assert msg["payload"]["content"] == "Test message"
        assert msg["metadata"]["priority"] == Priority.HIGH.value
        assert "key" in msg
        assert "timestamp" in msg["metadata"]

    def test_build_response(self):
        """Test building a response message"""
        request_key = "test-key-123"
        resp = MCPProtocol.build_response(
            request_key=request_key,
            status=MessageStatus.OK,
            response_content="Test response",
            tokens_used=100,
            latency_ms=250
        )

        assert resp["key"] == request_key
        assert resp["status"] == MessageStatus.OK.value
        assert resp["response"]["content"] == "Test response"
        assert resp["response"]["tokens_used"] == 100
        assert resp["meta"]["latency_ms"] == 250

    def test_validate_message_valid(self):
        """Test validating a valid message"""
        msg = MCPProtocol.build_request(
            from_ai="gpt",
            to_ai="claude",
            content="Valid message"
        )

        is_valid, error = MCPProtocol.validate_message(msg)
        assert is_valid is True
        assert error is None

    def test_validate_message_missing_field(self):
        """Test validating a message with missing required field"""
        msg = {
            "key": "test",
            "from": "gpt",
            # Missing "to" field
            "type": "request",
            "metadata": {"timestamp": datetime.now().isoformat()}
        }

        is_valid, error = MCPProtocol.validate_message(msg)
        assert is_valid is False
        assert "Missing required field" in error

    def test_validate_message_invalid_type(self):
        """Test validating a message with invalid type"""
        msg = MCPProtocol.build_request(
            from_ai="gpt",
            to_ai="claude",
            content="Test"
        )
        msg["type"] = "invalid_type"

        is_valid, error = MCPProtocol.validate_message(msg)
        assert is_valid is False
        assert "Invalid message type" in error

    def test_build_broadcast(self):
        """Test building a broadcast message"""
        msg = MCPProtocol.build_broadcast(
            from_ai="orchestrator",
            content="System announcement",
            targets=["claude", "gpt", "gemini"],
            priority=Priority.CRITICAL
        )

        assert msg["from"] == "orchestrator"
        assert msg["to"] == ["claude", "gpt", "gemini"]
        assert msg["type"] == MessageType.BROADCAST.value
        assert msg["metadata"]["priority"] == Priority.CRITICAL.value

    def test_get_priority_weight(self):
        """Test priority weight calculation"""
        assert MCPProtocol.get_priority_weight("low") == 1
        assert MCPProtocol.get_priority_weight("normal") == 5
        assert MCPProtocol.get_priority_weight("high") == 10
        assert MCPProtocol.get_priority_weight("critical") == 100

    def test_is_expired_not_expired(self):
        """Test checking if message is not expired"""
        msg = MCPProtocol.build_request(
            from_ai="gpt",
            to_ai="claude",
            content="Test",
            ttl=3600  # 1 hour
        )

        assert MCPProtocol.is_expired(msg) is False

    def test_parse_message(self):
        """Test parsing a message"""
        msg = MCPProtocol.build_request(
            from_ai="gpt",
            to_ai="claude",
            content="Test"
        )

        parsed = MCPProtocol.parse_message(msg)
        assert parsed["from"] == "gpt"
        assert parsed["to"] == "claude"

    def test_parse_message_invalid(self):
        """Test parsing an invalid message raises ValueError"""
        invalid_msg = {"key": "test"}

        with pytest.raises(ValueError):
            MCPProtocol.parse_message(invalid_msg)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
