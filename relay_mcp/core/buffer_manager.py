"""
Buffer Manager - Circular memory buffer for message history
"""

from collections import deque
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Deque
import threading
from core.protocol_mcp import MCPProtocol, Priority


class BufferManager:
    """
    Manages circular buffer for message history with TTL and drop policies
    """

    def __init__(
        self,
        max_size: int = 10000,
        ttl_seconds: int = 86400,
        drop_policy: str = "oldest_first"
    ):
        """
        Initialize buffer manager

        Args:
            max_size: Maximum buffer size
            ttl_seconds: Time-to-live for messages
            drop_policy: "oldest_first" or "lowest_priority"
        """
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.drop_policy = drop_policy

        self._buffer: Deque[Dict[str, Any]] = deque(maxlen=max_size)
        self._lock = threading.RLock()
        self._index: Dict[str, Dict[str, Any]] = {}  # key -> message for fast lookup

    def add(self, message: Dict[str, Any]) -> bool:
        """
        Add message to buffer

        Args:
            message: MCP message to add

        Returns:
            True if added successfully
        """
        with self._lock:
            # Check if buffer is full and apply drop policy
            if len(self._buffer) >= self.max_size:
                self._apply_drop_policy()

            # Add to buffer
            self._buffer.append(message)
            self._index[message["key"]] = message

            return True

    def get(self, message_key: str) -> Optional[Dict[str, Any]]:
        """
        Get message by key

        Args:
            message_key: Message key to lookup

        Returns:
            Message dict or None if not found
        """
        with self._lock:
            return self._index.get(message_key)

    def get_recent(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get most recent messages

        Args:
            limit: Maximum number of messages to return

        Returns:
            List of recent messages (newest first)
        """
        with self._lock:
            messages = list(self._buffer)
            messages.reverse()  # Newest first
            return messages[:limit]

    def get_by_timerange(
        self,
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict[str, Any]]:
        """
        Get messages within time range

        Args:
            start_time: Start of time range
            end_time: End of time range

        Returns:
            List of messages in range
        """
        with self._lock:
            results = []
            for msg in self._buffer:
                try:
                    msg_time = datetime.fromisoformat(
                        msg["metadata"]["timestamp"].replace('Z', '+00:00')
                    )
                    if start_time <= msg_time <= end_time:
                        results.append(msg)
                except (KeyError, ValueError):
                    continue
            return results

    def get_by_ai(self, ai_key: str) -> List[Dict[str, Any]]:
        """
        Get all messages involving a specific AI (from or to)

        Args:
            ai_key: AI identifier

        Returns:
            List of messages
        """
        with self._lock:
            return [
                msg for msg in self._buffer
                if msg.get("from") == ai_key or msg.get("to") == ai_key
            ]

    def get_conversation(self, ai1: str, ai2: str) -> List[Dict[str, Any]]:
        """
        Get conversation between two AIs

        Args:
            ai1: First AI identifier
            ai2: Second AI identifier

        Returns:
            List of messages between the two AIs
        """
        with self._lock:
            return [
                msg for msg in self._buffer
                if (msg.get("from") == ai1 and msg.get("to") == ai2) or
                   (msg.get("from") == ai2 and msg.get("to") == ai1)
            ]

    def cleanup_expired(self) -> int:
        """
        Remove expired messages based on TTL

        Returns:
            Number of messages removed
        """
        with self._lock:
            initial_count = len(self._buffer)

            # Filter out expired messages
            valid_messages = [
                msg for msg in self._buffer
                if not MCPProtocol.is_expired(msg)
            ]

            # Rebuild buffer and index
            self._buffer.clear()
            self._buffer.extend(valid_messages)

            self._index.clear()
            for msg in valid_messages:
                self._index[msg["key"]] = msg

            removed = initial_count - len(self._buffer)
            return removed

    def _apply_drop_policy(self):
        """Apply drop policy when buffer is full"""
        if not self._buffer:
            return

        if self.drop_policy == "oldest_first":
            # deque with maxlen automatically drops oldest
            dropped = self._buffer[0]
            if dropped["key"] in self._index:
                del self._index[dropped["key"]]

        elif self.drop_policy == "lowest_priority":
            # Find and remove lowest priority message
            min_priority = float('inf')
            min_idx = 0

            for idx, msg in enumerate(self._buffer):
                priority = msg.get("metadata", {}).get("priority", "normal")
                weight = MCPProtocol.get_priority_weight(priority)
                if weight < min_priority:
                    min_priority = weight
                    min_idx = idx

            # Remove the lowest priority message
            dropped = self._buffer[min_idx]
            del self._buffer[min_idx]
            if dropped["key"] in self._index:
                del self._index[dropped["key"]]

    def get_stats(self) -> Dict[str, Any]:
        """
        Get buffer statistics

        Returns:
            Statistics dictionary
        """
        with self._lock:
            total = len(self._buffer)

            # Count by AI
            ai_counts = {}
            for msg in self._buffer:
                from_ai = msg.get("from", "unknown")
                to_ai = msg.get("to", "unknown")
                ai_counts[from_ai] = ai_counts.get(from_ai, 0) + 1
                ai_counts[to_ai] = ai_counts.get(to_ai, 0) + 1

            # Count by type
            type_counts = {}
            for msg in self._buffer:
                msg_type = msg.get("type", "unknown")
                type_counts[msg_type] = type_counts.get(msg_type, 0) + 1

            # Calculate utilization
            utilization = (total / self.max_size * 100) if self.max_size > 0 else 0

            return {
                "total_messages": total,
                "max_size": self.max_size,
                "utilization_percent": round(utilization, 2),
                "by_ai": ai_counts,
                "by_type": type_counts,
                "ttl_seconds": self.ttl_seconds,
                "drop_policy": self.drop_policy
            }

    def clear(self):
        """Clear entire buffer"""
        with self._lock:
            self._buffer.clear()
            self._index.clear()

    def __len__(self):
        """Get current buffer size"""
        with self._lock:
            return len(self._buffer)

    def snapshot(self) -> List[Dict[str, Any]]:
        """
        Create point-in-time snapshot of buffer

        Returns:
            Copy of all messages in buffer
        """
        with self._lock:
            return list(self._buffer)


# Example usage
if __name__ == "__main__":
    from core.protocol_mcp import MCPProtocol, Priority

    buffer = BufferManager(max_size=5, ttl_seconds=3600)

    # Add some messages
    for i in range(7):
        msg = MCPProtocol.build_request(
            from_ai="gemini",
            to_ai="claude",
            content=f"Message {i}",
            priority=Priority.NORMAL if i % 2 == 0 else Priority.HIGH
        )
        buffer.add(msg)
        print(f"Added message {i}, buffer size: {len(buffer)}")

    # Get stats
    print("\nBuffer stats:")
    print(buffer.get_stats())

    # Get recent
    print("\nRecent messages:")
    for msg in buffer.get_recent(3):
        print(f"  {msg['key']}: {msg['payload']['content']}")
