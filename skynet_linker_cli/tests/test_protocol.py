"""
Tests for MCP Protocol Layer
"""

import pytest
from protocol.mcp_message import (
    MCPMessage,
    MessageType,
    build_task_message,
    build_broadcast_message,
    build_context_update,
    parse_message
)
from protocol.validation import (
    validate_message,
    is_valid_message,
    get_validation_errors
)


def test_create_mcp_message():
    """Test creating an MCP message"""
    msg = MCPMessage(
        from_agent="claude_cli",
        message_type=MessageType.TASK,
        to_agent="gemini",
        channel="skynet_core",
        content="Research RAG papers"
    )

    assert msg.from_agent == "claude_cli"
    assert msg.to_agent == "gemini"
    assert msg.type == MessageType.TASK
    assert msg.channel == "skynet_core"
    assert msg.payload["content"] == "Research RAG papers"


def test_message_to_dict():
    """Test converting message to dictionary"""
    msg = MCPMessage(
        from_agent="claude_cli",
        message_type=MessageType.TASK,
        to_agent="gemini",
        content="Test content"
    )

    msg_dict = msg.to_dict()

    assert isinstance(msg_dict, dict)
    assert msg_dict["from_agent"] == "claude_cli"
    assert msg_dict["to_agent"] == "gemini"
    assert msg_dict["type"] == "task"
    assert msg_dict["payload"]["content"] == "Test content"


def test_message_from_dict():
    """Test creating message from dictionary"""
    msg_dict = {
        "id": "test-id-123",
        "from_agent": "claude_cli",
        "to_agent": "gemini",
        "type": "task",
        "channel": "default",
        "payload": {
            "content": "Test",
            "context": {},
            "meta": {}
        },
        "timestamp": "2025-11-19T12:00:00Z",
        "trace_id": "trace-123",
        "parent_id": None,
        "encrypted": False,
        "signature": None
    }

    msg = MCPMessage.from_dict(msg_dict)

    assert msg.id == "test-id-123"
    assert msg.from_agent == "claude_cli"
    assert msg.to_agent == "gemini"


def test_create_reply():
    """Test creating a reply message"""
    original = MCPMessage(
        from_agent="claude_cli",
        message_type=MessageType.TASK,
        to_agent="gemini",
        content="Original message"
    )

    reply = original.create_reply("Reply content")

    assert reply.from_agent == "gemini"  # Swapped
    assert reply.to_agent == "claude_cli"  # Swapped
    assert reply.type == MessageType.REPLY
    assert reply.trace_id == original.trace_id  # Same trace
    assert reply.parent_id == original.id  # Linked


def test_build_task_message():
    """Test task message builder"""
    msg = build_task_message(
        from_agent="claude_cli",
        to_agent="gemini",
        task_description="Research RAG papers",
        channel="skynet_core"
    )

    assert msg.type == MessageType.TASK
    assert msg.from_agent == "claude_cli"
    assert msg.to_agent == "gemini"
    assert msg.payload["content"] == "Research RAG papers"


def test_build_broadcast_message():
    """Test broadcast message builder"""
    msg = build_broadcast_message(
        from_agent="claude_cli",
        channel="skynet_core",
        content="Broadcast to all"
    )

    assert msg.type == MessageType.BROADCAST
    assert msg.to_agent is None  # No specific recipient
    assert msg.channel == "skynet_core"


def test_build_context_update():
    """Test context update message builder"""
    context_data = {
        "global_summary": "Test summary",
        "last_intent": "Test intent"
    }

    msg = build_context_update(
        from_agent="claude_cli",
        context_data=context_data
    )

    assert msg.type == MessageType.CONTEXT_UPDATE
    assert msg.payload["context"] == context_data


def test_message_validation():
    """Test message validation"""
    valid_msg = build_task_message(
        from_agent="claude_cli",
        to_agent="gemini",
        task_description="Test"
    ).to_dict()

    # Should be valid
    assert is_valid_message(valid_msg)

    # Should validate without errors
    errors = get_validation_errors(valid_msg)
    assert len(errors) == 0


def test_invalid_message_validation():
    """Test validation of invalid message"""
    invalid_msg = {
        "from_agent": "claude_cli",
        # Missing required fields
    }

    assert not is_valid_message(invalid_msg)

    errors = get_validation_errors(invalid_msg)
    assert len(errors) > 0


def test_parse_message():
    """Test message parsing"""
    msg_dict = build_task_message(
        from_agent="claude_cli",
        to_agent="gemini",
        task_description="Test"
    ).to_dict()

    parsed = parse_message(msg_dict)

    assert isinstance(parsed, MCPMessage)
    assert parsed.from_agent == "claude_cli"
    assert parsed.to_agent == "gemini"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
