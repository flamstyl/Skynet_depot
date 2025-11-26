"""
RelayMCP Protocol - Message Communication Protocol
Defines standardized message formats for inter-AI communication
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from enum import Enum


class MessageType(Enum):
    """MCP message types"""
    REQUEST = "request"
    RESPONSE = "response"
    BROADCAST = "broadcast"
    NOTIFICATION = "notification"


class MessageStatus(Enum):
    """Message processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    OK = "ok"
    ERROR = "error"
    TIMEOUT = "timeout"


class Priority(Enum):
    """Message priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class MCPProtocol:
    """MCP Protocol handler"""

    @staticmethod
    def build_request(
        from_ai: str,
        to_ai: str,
        content: str,
        context: Optional[Dict[str, Any]] = None,
        priority: Priority = Priority.NORMAL,
        ttl: int = 3600,
        message_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Build a standardized MCP request message

        Args:
            from_ai: Source AI identifier
            to_ai: Target AI identifier
            content: Message content/question
            context: Optional context dictionary
            priority: Message priority
            ttl: Time-to-live in seconds
            message_key: Optional custom message key (auto-generated if not provided)

        Returns:
            Standardized MCP request dictionary
        """
        if not message_key:
            message_key = str(uuid.uuid4())

        return {
            "key": message_key,
            "from": from_ai,
            "to": to_ai,
            "type": MessageType.REQUEST.value,
            "payload": {
                "content": content,
                "context": context or {}
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "priority": priority.value if isinstance(priority, Priority) else priority,
                "ttl": ttl
            }
        }

    @staticmethod
    def build_response(
        request_key: str,
        status: MessageStatus,
        response_content: Optional[str] = None,
        tokens_used: Optional[int] = None,
        model: Optional[str] = None,
        latency_ms: Optional[float] = None,
        connector: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Build a standardized MCP response message

        Args:
            request_key: Original request message key
            status: Response status
            response_content: AI response content
            tokens_used: Number of tokens consumed
            model: Model identifier
            latency_ms: Processing latency in milliseconds
            connector: Connector that handled the request
            error_message: Error message if status is ERROR

        Returns:
            Standardized MCP response dictionary
        """
        response = {
            "key": request_key,
            "status": status.value if isinstance(status, MessageStatus) else status,
            "meta": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        }

        if status == MessageStatus.OK or status == MessageStatus.ERROR:
            response["response"] = {
                "content": response_content or "",
                "tokens_used": tokens_used,
                "model": model
            }

            if error_message:
                response["response"]["error"] = error_message

        if latency_ms is not None:
            response["meta"]["latency_ms"] = latency_ms

        if connector:
            response["meta"]["connector"] = connector

        return response

    @staticmethod
    def build_broadcast(
        from_ai: str,
        content: str,
        targets: Optional[List[str]] = None,
        priority: Priority = Priority.NORMAL
    ) -> Dict[str, Any]:
        """
        Build a broadcast message (one-to-many)

        Args:
            from_ai: Source AI identifier
            content: Broadcast content
            targets: List of target AIs (None = all)
            priority: Message priority

        Returns:
            Standardized MCP broadcast dictionary
        """
        return {
            "key": str(uuid.uuid4()),
            "from": from_ai,
            "to": targets or ["*"],
            "type": MessageType.BROADCAST.value,
            "payload": {
                "content": content
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "priority": priority.value if isinstance(priority, Priority) else priority
            }
        }

    @staticmethod
    def validate_message(message: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Validate MCP message structure

        Args:
            message: Message dictionary to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check required top-level fields
        required_fields = ["key", "from", "to", "type", "metadata"]
        for field in required_fields:
            if field not in message:
                return False, f"Missing required field: {field}"

        # Validate message type
        if message["type"] not in [t.value for t in MessageType]:
            return False, f"Invalid message type: {message['type']}"

        # Validate metadata
        if "timestamp" not in message["metadata"]:
            return False, "Missing timestamp in metadata"

        # For requests, validate payload
        if message["type"] == MessageType.REQUEST.value:
            if "payload" not in message:
                return False, "Missing payload for request message"
            if "content" not in message["payload"]:
                return False, "Missing content in request payload"

        return True, None

    @staticmethod
    def parse_message(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse and normalize incoming message

        Args:
            raw_data: Raw message data

        Returns:
            Normalized message dictionary

        Raises:
            ValueError: If message is invalid
        """
        is_valid, error = MCPProtocol.validate_message(raw_data)
        if not is_valid:
            raise ValueError(f"Invalid MCP message: {error}")

        # Normalize timestamps
        if "timestamp" in raw_data.get("metadata", {}):
            timestamp = raw_data["metadata"]["timestamp"]
            if isinstance(timestamp, str):
                # Ensure ISO format
                try:
                    datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                except ValueError:
                    raw_data["metadata"]["timestamp"] = datetime.now(timezone.utc).isoformat()

        return raw_data

    @staticmethod
    def get_priority_weight(priority: str) -> int:
        """
        Get numeric weight for priority (higher = more important)

        Args:
            priority: Priority string

        Returns:
            Numeric weight
        """
        weights = {
            Priority.LOW.value: 1,
            Priority.NORMAL.value: 5,
            Priority.HIGH.value: 10,
            Priority.CRITICAL.value: 100
        }
        return weights.get(priority, 5)

    @staticmethod
    def is_expired(message: Dict[str, Any]) -> bool:
        """
        Check if message has expired based on TTL

        Args:
            message: Message dictionary

        Returns:
            True if expired, False otherwise
        """
        if "metadata" not in message:
            return False

        metadata = message["metadata"]
        if "timestamp" not in metadata or "ttl" not in metadata:
            return False

        try:
            created_at = datetime.fromisoformat(metadata["timestamp"].replace('Z', '+00:00'))
            ttl = metadata["ttl"]
            now = datetime.now(timezone.utc)
            age = (now - created_at).total_seconds()
            return age > ttl
        except (ValueError, TypeError):
            return False


# Convenience functions for quick message creation

def request(from_ai: str, to_ai: str, content: str, **kwargs) -> Dict[str, Any]:
    """Quick request builder"""
    return MCPProtocol.build_request(from_ai, to_ai, content, **kwargs)


def response(request_key: str, status: str, content: str, **kwargs) -> Dict[str, Any]:
    """Quick response builder"""
    status_enum = MessageStatus(status) if isinstance(status, str) else status
    return MCPProtocol.build_response(request_key, status_enum, content, **kwargs)


def broadcast(from_ai: str, content: str, **kwargs) -> Dict[str, Any]:
    """Quick broadcast builder"""
    return MCPProtocol.build_broadcast(from_ai, content, **kwargs)


# Example usage
if __name__ == "__main__":
    # Example request
    req = MCPProtocol.build_request(
        from_ai="gemini",
        to_ai="claude",
        content="Analyze this error: NullPointerException in main.java:42",
        context={"file": "main.java", "line": 42},
        priority=Priority.HIGH
    )
    print("Request:", req)

    # Validate
    is_valid, error = MCPProtocol.validate_message(req)
    print(f"Valid: {is_valid}, Error: {error}")

    # Example response
    resp = MCPProtocol.build_response(
        request_key=req["key"],
        status=MessageStatus.OK,
        response_content="This is a null pointer error caused by accessing an uninitialized object...",
        tokens_used=450,
        model="claude-sonnet-4.5",
        latency_ms=1200,
        connector="claude_cli"
    )
    print("Response:", resp)
