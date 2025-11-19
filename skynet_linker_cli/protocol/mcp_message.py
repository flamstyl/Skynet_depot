"""
MCP (Multi-agent Communication Protocol) Message Builder

Defines the core message structure and utilities for creating,
parsing, and manipulating MCP messages.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from enum import Enum


class MessageType(str, Enum):
    """MCP Message types"""
    TASK = "task"
    REPLY = "reply"
    CONTEXT_UPDATE = "context_update"
    BROADCAST = "broadcast"
    HEARTBEAT = "heartbeat"
    ACK = "ack"
    ERROR = "error"


class MCPMessage:
    """
    MCP Message builder and parser.

    Standard message structure:
    {
        "id": "uuid-v4",
        "from_agent": "claude_cli",
        "to_agent": "gemini" | null,
        "type": "task | reply | context_update | broadcast | heartbeat",
        "channel": "skynet_core",
        "payload": {
            "content": "...",
            "context": {...},
            "meta": {...}
        },
        "timestamp": "ISO8601",
        "trace_id": "uuid-chain",
        "encrypted": false,
        "signature": null
    }
    """

    def __init__(
        self,
        from_agent: str,
        message_type: MessageType,
        to_agent: Optional[str] = None,
        channel: str = "default",
        content: Any = None,
        context: Optional[Dict[str, Any]] = None,
        meta: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None,
        parent_id: Optional[str] = None,
    ):
        self.id = str(uuid.uuid4())
        self.from_agent = from_agent
        self.to_agent = to_agent
        self.type = message_type
        self.channel = channel
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.trace_id = trace_id or str(uuid.uuid4())
        self.parent_id = parent_id
        self.encrypted = False
        self.signature = None

        # Payload construction
        self.payload = {
            "content": content,
            "context": context or {},
            "meta": meta or {}
        }

        # Add default meta fields
        if "timestamp" not in self.payload["meta"]:
            self.payload["meta"]["timestamp"] = self.timestamp
        if "ttl" not in self.payload["meta"]:
            self.payload["meta"]["ttl"] = 3600  # 1 hour default
        if "requires_ack" not in self.payload["meta"]:
            self.payload["meta"]["requires_ack"] = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary"""
        return {
            "id": self.id,
            "from_agent": self.from_agent,
            "to_agent": self.to_agent,
            "type": self.type.value if isinstance(self.type, MessageType) else self.type,
            "channel": self.channel,
            "payload": self.payload,
            "timestamp": self.timestamp,
            "trace_id": self.trace_id,
            "parent_id": self.parent_id,
            "encrypted": self.encrypted,
            "signature": self.signature,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MCPMessage":
        """Create MCPMessage from dictionary"""
        msg = cls(
            from_agent=data["from_agent"],
            message_type=MessageType(data["type"]),
            to_agent=data.get("to_agent"),
            channel=data.get("channel", "default"),
            content=data.get("payload", {}).get("content"),
            context=data.get("payload", {}).get("context"),
            meta=data.get("payload", {}).get("meta"),
            trace_id=data.get("trace_id"),
            parent_id=data.get("parent_id"),
        )

        # Override auto-generated fields with provided values
        msg.id = data["id"]
        msg.timestamp = data["timestamp"]
        msg.encrypted = data.get("encrypted", False)
        msg.signature = data.get("signature")

        return msg

    def create_reply(self, content: Any, **kwargs) -> "MCPMessage":
        """Create a reply message to this message"""
        return MCPMessage(
            from_agent=self.to_agent,  # Reply from the recipient
            to_agent=self.from_agent,  # Reply to the sender
            message_type=MessageType.REPLY,
            channel=self.channel,
            content=content,
            trace_id=self.trace_id,  # Keep same trace
            parent_id=self.id,  # Link to parent message
            **kwargs
        )

    def __repr__(self) -> str:
        return f"MCPMessage(id={self.id[:8]}, from={self.from_agent}, to={self.to_agent}, type={self.type})"


# Convenience functions

def build_task_message(
    from_agent: str,
    to_agent: str,
    task_description: str,
    channel: str = "default",
    **kwargs
) -> MCPMessage:
    """Build a task message"""
    return MCPMessage(
        from_agent=from_agent,
        to_agent=to_agent,
        message_type=MessageType.TASK,
        channel=channel,
        content=task_description,
        **kwargs
    )


def build_broadcast_message(
    from_agent: str,
    channel: str,
    content: Any,
    **kwargs
) -> MCPMessage:
    """Build a broadcast message"""
    return MCPMessage(
        from_agent=from_agent,
        to_agent=None,  # Broadcast has no specific recipient
        message_type=MessageType.BROADCAST,
        channel=channel,
        content=content,
        **kwargs
    )


def build_context_update(
    from_agent: str,
    context_data: Dict[str, Any],
    channel: str = "default",
    **kwargs
) -> MCPMessage:
    """Build a context update message"""
    return MCPMessage(
        from_agent=from_agent,
        message_type=MessageType.CONTEXT_UPDATE,
        channel=channel,
        content=None,
        context=context_data,
        **kwargs
    )


def build_heartbeat(
    from_agent: str,
    status: str = "alive",
    metadata: Optional[Dict[str, Any]] = None,
) -> MCPMessage:
    """Build a heartbeat message"""
    return MCPMessage(
        from_agent=from_agent,
        message_type=MessageType.HEARTBEAT,
        content=status,
        meta=metadata or {},
    )


def build_ack(
    from_agent: str,
    to_agent: str,
    original_message_id: str,
    trace_id: str,
) -> MCPMessage:
    """Build an acknowledgment message"""
    return MCPMessage(
        from_agent=from_agent,
        to_agent=to_agent,
        message_type=MessageType.ACK,
        content=f"Acknowledged message {original_message_id}",
        trace_id=trace_id,
        parent_id=original_message_id,
    )


def build_error_message(
    from_agent: str,
    to_agent: Optional[str],
    error_description: str,
    error_code: str = "UNKNOWN",
    trace_id: Optional[str] = None,
) -> MCPMessage:
    """Build an error message"""
    return MCPMessage(
        from_agent=from_agent,
        to_agent=to_agent,
        message_type=MessageType.ERROR,
        content=error_description,
        context={"error_code": error_code},
        trace_id=trace_id,
    )


def parse_message(raw_data: Dict[str, Any]) -> MCPMessage:
    """Parse raw dictionary into MCPMessage"""
    return MCPMessage.from_dict(raw_data)


# Message chain utilities

def get_message_chain(messages: List[MCPMessage], trace_id: str) -> List[MCPMessage]:
    """Extract all messages belonging to a trace_id chain"""
    return [msg for msg in messages if msg.trace_id == trace_id]


def build_message_tree(messages: List[MCPMessage]) -> Dict[str, List[MCPMessage]]:
    """Build parent-child tree from messages"""
    tree: Dict[str, List[MCPMessage]] = {}

    for msg in messages:
        if msg.parent_id:
            if msg.parent_id not in tree:
                tree[msg.parent_id] = []
            tree[msg.parent_id].append(msg)

    return tree
