"""
Persistence Layer - SQLite + JSONL storage for messages
"""

import sqlite3
import json
import os
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pathlib import Path
import threading


class PersistenceLayer:
    """
    Handles durable storage for messages using SQLite and JSONL
    """

    def __init__(
        self,
        db_path: str = "data/buffer.db",
        jsonl_path: str = "data/logs/mcp_traffic.jsonl"
    ):
        """
        Initialize persistence layer

        Args:
            db_path: Path to SQLite database
            jsonl_path: Path to JSONL log file
        """
        self.db_path = db_path
        self.jsonl_path = jsonl_path
        self._lock = threading.RLock()

        # Ensure directories exist
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        Path(jsonl_path).parent.mkdir(parents=True, exist_ok=True)

        # Initialize database
        self._init_database()

    def _init_database(self):
        """Create database schema if not exists"""
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Messages table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    key TEXT PRIMARY KEY,
                    from_ai TEXT NOT NULL,
                    to_ai TEXT NOT NULL,
                    type TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP NOT NULL,
                    completed_at TIMESTAMP,
                    metadata TEXT,
                    response TEXT
                )
            """)

            # Indices for fast queries
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_created_at
                ON messages(created_at)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_from_to
                ON messages(from_ai, to_ai)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_status
                ON messages(status)
            """)

            # Statistics table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS stats (
                    timestamp TIMESTAMP PRIMARY KEY,
                    total_messages INTEGER,
                    messages_per_minute REAL,
                    avg_latency_ms REAL,
                    error_rate REAL,
                    by_ai TEXT
                )
            """)

            conn.commit()
            conn.close()

    def save_message(
        self,
        message: Dict[str, Any],
        response: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Save message to both SQLite and JSONL

        Args:
            message: MCP message to save
            response: Optional response to associate with message

        Returns:
            True if saved successfully
        """
        with self._lock:
            try:
                # Save to SQLite
                self._save_to_db(message, response)

                # Save to JSONL
                self._save_to_jsonl(message, response)

                return True
            except Exception as e:
                print(f"Error saving message: {e}")
                return False

    def _save_to_db(self, message: Dict[str, Any], response: Optional[Dict[str, Any]]):
        """Save message to SQLite database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        created_at = message.get("metadata", {}).get("timestamp")
        if not created_at:
            created_at = datetime.now(timezone.utc).isoformat()

        status = "pending"
        completed_at = None
        response_json = None

        if response:
            status = response.get("status", "ok")
            completed_at = response.get("meta", {}).get("timestamp")
            response_json = json.dumps(response)

        cursor.execute("""
            INSERT OR REPLACE INTO messages
            (key, from_ai, to_ai, type, payload, status, created_at, completed_at, metadata, response)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            message["key"],
            message.get("from", ""),
            message.get("to", ""),
            message.get("type", "request"),
            json.dumps(message.get("payload", {})),
            status,
            created_at,
            completed_at,
            json.dumps(message.get("metadata", {})),
            response_json
        ))

        conn.commit()
        conn.close()

    def _save_to_jsonl(self, message: Dict[str, Any], response: Optional[Dict[str, Any]]):
        """Append message to JSONL log file"""
        log_entry = {
            "message": message,
            "response": response,
            "logged_at": datetime.now(timezone.utc).isoformat()
        }

        with open(self.jsonl_path, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')

    def load_message(self, message_key: str) -> Optional[Dict[str, Any]]:
        """
        Load message by key from database

        Args:
            message_key: Message key to load

        Returns:
            Message dictionary or None if not found
        """
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("""
                SELECT * FROM messages WHERE key = ?
            """, (message_key,))

            row = cursor.fetchone()
            conn.close()

            if not row:
                return None

            return self._row_to_dict(row)

    def load_recent(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Load recent messages from database

        Args:
            limit: Maximum number of messages to load

        Returns:
            List of message dictionaries
        """
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("""
                SELECT * FROM messages
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))

            rows = cursor.fetchall()
            conn.close()

            return [self._row_to_dict(row) for row in rows]

    def query_by_timerange(
        self,
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict[str, Any]]:
        """
        Query messages by time range

        Args:
            start_time: Start of range
            end_time: End of range

        Returns:
            List of messages in range
        """
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("""
                SELECT * FROM messages
                WHERE created_at BETWEEN ? AND ?
                ORDER BY created_at DESC
            """, (start_time.isoformat(), end_time.isoformat()))

            rows = cursor.fetchall()
            conn.close()

            return [self._row_to_dict(row) for row in rows]

    def query_by_ai(
        self,
        from_ai: Optional[str] = None,
        to_ai: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Query messages by AI participants

        Args:
            from_ai: Source AI filter
            to_ai: Target AI filter

        Returns:
            List of matching messages
        """
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            if from_ai and to_ai:
                cursor.execute("""
                    SELECT * FROM messages
                    WHERE from_ai = ? AND to_ai = ?
                    ORDER BY created_at DESC
                """, (from_ai, to_ai))
            elif from_ai:
                cursor.execute("""
                    SELECT * FROM messages
                    WHERE from_ai = ?
                    ORDER BY created_at DESC
                """, (from_ai,))
            elif to_ai:
                cursor.execute("""
                    SELECT * FROM messages
                    WHERE to_ai = ?
                    ORDER BY created_at DESC
                """, (to_ai,))
            else:
                cursor.execute("""
                    SELECT * FROM messages
                    ORDER BY created_at DESC
                """)

            rows = cursor.fetchall()
            conn.close()

            return [self._row_to_dict(row) for row in rows]

    def get_stats(self) -> Dict[str, Any]:
        """
        Get database statistics

        Returns:
            Statistics dictionary
        """
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Total messages
            cursor.execute("SELECT COUNT(*) FROM messages")
            total = cursor.fetchone()[0]

            # By status
            cursor.execute("""
                SELECT status, COUNT(*)
                FROM messages
                GROUP BY status
            """)
            by_status = dict(cursor.fetchall())

            # By AI
            cursor.execute("""
                SELECT from_ai, COUNT(*)
                FROM messages
                GROUP BY from_ai
            """)
            by_ai = dict(cursor.fetchall())

            # Average latency (if response exists)
            cursor.execute("""
                SELECT AVG(
                    CAST(
                        json_extract(response, '$.meta.latency_ms') AS REAL
                    )
                )
                FROM messages
                WHERE response IS NOT NULL
            """)
            avg_latency = cursor.fetchone()[0]

            conn.close()

            return {
                "total_messages": total,
                "by_status": by_status,
                "by_ai": by_ai,
                "avg_latency_ms": round(avg_latency, 2) if avg_latency else None
            }

    def snapshot_buffer(self, messages: List[Dict[str, Any]], snapshot_dir: str = "data/snapshots"):
        """
        Create timestamped snapshot of buffer

        Args:
            messages: List of messages to snapshot
            snapshot_dir: Directory to save snapshot
        """
        Path(snapshot_dir).mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        snapshot_path = os.path.join(snapshot_dir, f"buffer_snapshot_{timestamp}.json")

        with open(snapshot_path, 'w') as f:
            json.dump({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "count": len(messages),
                "messages": messages
            }, f, indent=2)

        print(f"Snapshot saved: {snapshot_path}")

    @staticmethod
    def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
        """Convert SQLite row to message dictionary"""
        message = {
            "key": row["key"],
            "from": row["from_ai"],
            "to": row["to_ai"],
            "type": row["type"],
            "payload": json.loads(row["payload"]),
            "metadata": json.loads(row["metadata"]),
            "status": row["status"]
        }

        if row["response"]:
            message["response"] = json.loads(row["response"])

        return message


# Example usage
if __name__ == "__main__":
    from core.protocol_mcp import MCPProtocol, Priority, MessageStatus

    persistence = PersistenceLayer(
        db_path="data/test_buffer.db",
        jsonl_path="data/logs/test_traffic.jsonl"
    )

    # Create and save a message
    msg = MCPProtocol.build_request(
        from_ai="gemini",
        to_ai="claude",
        content="Test message",
        priority=Priority.HIGH
    )

    persistence.save_message(msg)
    print("Message saved")

    # Add response
    resp = MCPProtocol.build_response(
        request_key=msg["key"],
        status=MessageStatus.OK,
        response_content="Test response",
        latency_ms=100
    )

    persistence.save_message(msg, resp)
    print("Response saved")

    # Load it back
    loaded = persistence.load_message(msg["key"])
    print("Loaded:", loaded)

    # Get stats
    stats = persistence.get_stats()
    print("Stats:", stats)
