"""
Skynet Command Center - Database Module
========================================
SQLite database for persistent storage of:
- Agent status history
- Terminal command history
- Memory synchronization logs

Author: Skynet Architect
Version: 1.0
"""

import sqlite3
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import json

from .config import DATABASE_FILE, ensure_directories


class SkynetDatabase:
    """
    Main database interface for Skynet Command Center.
    """

    def __init__(self, db_path: Optional[Path] = None):
        """
        Initialize database connection.

        Args:
            db_path: Path to database file (defaults to config.DATABASE_FILE)
        """
        ensure_directories()
        self.db_path = db_path or DATABASE_FILE
        self.connection = None
        self._init_database()

    def _get_connection(self):
        """Get or create database connection."""
        if self.connection is None:
            self.connection = sqlite3.connect(
                self.db_path,
                check_same_thread=False
            )
            self.connection.row_factory = sqlite3.Row
        return self.connection

    def _init_database(self):
        """Create all necessary tables if they don't exist."""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Table: agents_status
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agents_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                status TEXT NOT NULL,
                pid INTEGER,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
        """)

        # Table: terminal_history
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS terminal_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                command TEXT NOT NULL,
                output TEXT,
                success INTEGER DEFAULT 1
            )
        """)

        # Table: sync_history
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sync_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sync_type TEXT NOT NULL,
                status TEXT NOT NULL,
                files_synced INTEGER DEFAULT 0,
                details TEXT
            )
        """)

        # Indexes for performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_agents_name
            ON agents_status(name)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_terminal_timestamp
            ON terminal_history(timestamp DESC)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_sync_timestamp
            ON sync_history(timestamp DESC)
        """)

        conn.commit()
        print("[DATABASE] Initialized successfully")

    # ========================================================================
    # AGENTS STATUS
    # ========================================================================

    def record_agent_status(
        self,
        name: str,
        status: str,
        pid: Optional[int] = None,
        metadata: Optional[Dict] = None
    ):
        """
        Record agent status to database.

        Args:
            name: Agent name
            status: Agent status (online, offline, error, etc.)
            pid: Process ID (if applicable)
            metadata: Additional metadata as dict
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        metadata_json = json.dumps(metadata) if metadata else None

        cursor.execute("""
            INSERT INTO agents_status (name, status, pid, metadata)
            VALUES (?, ?, ?, ?)
        """, (name, status, pid, metadata_json))

        conn.commit()

    def get_agent_history(self, name: str, limit: int = 50) -> List[Dict]:
        """
        Get status history for a specific agent.

        Args:
            name: Agent name
            limit: Max number of records to return

        Returns:
            List of status records
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM agents_status
            WHERE name = ?
            ORDER BY last_seen DESC
            LIMIT ?
        """, (name, limit))

        rows = cursor.fetchall()
        return [dict(row) for row in rows]

    def get_all_agents_latest(self) -> List[Dict]:
        """
        Get latest status for all agents.

        Returns:
            List of latest agent statuses
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT a1.*
            FROM agents_status a1
            INNER JOIN (
                SELECT name, MAX(last_seen) as max_seen
                FROM agents_status
                GROUP BY name
            ) a2 ON a1.name = a2.name AND a1.last_seen = a2.max_seen
            ORDER BY a1.last_seen DESC
        """)

        rows = cursor.fetchall()
        return [dict(row) for row in rows]

    # ========================================================================
    # TERMINAL HISTORY
    # ========================================================================

    def record_terminal_command(
        self,
        command: str,
        output: str,
        success: bool = True
    ):
        """
        Record terminal command execution.

        Args:
            command: Command executed
            output: Command output
            success: Whether command succeeded
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO terminal_history (command, output, success)
            VALUES (?, ?, ?)
        """, (command, output, 1 if success else 0))

        conn.commit()

    def get_terminal_history(self, limit: int = 100) -> List[Dict]:
        """
        Get terminal command history.

        Args:
            limit: Max number of records to return

        Returns:
            List of command records
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM terminal_history
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()
        return [dict(row) for row in rows]

    def clear_terminal_history(self):
        """Clear all terminal history."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM terminal_history")
        conn.commit()

    # ========================================================================
    # SYNC HISTORY
    # ========================================================================

    def record_sync(
        self,
        sync_type: str,
        status: str,
        files_synced: int = 0,
        details: Optional[Dict] = None
    ):
        """
        Record memory synchronization.

        Args:
            sync_type: Type of sync (memory, agents, etc.)
            status: Sync status (success, failed, partial)
            files_synced: Number of files synced
            details: Additional details as dict
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        details_json = json.dumps(details) if details else None

        cursor.execute("""
            INSERT INTO sync_history (sync_type, status, files_synced, details)
            VALUES (?, ?, ?, ?)
        """, (sync_type, status, files_synced, details_json))

        conn.commit()

    def get_sync_history(self, limit: int = 50) -> List[Dict]:
        """
        Get synchronization history.

        Args:
            limit: Max number of records to return

        Returns:
            List of sync records
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM sync_history
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()
        return [dict(row) for row in rows]

    # ========================================================================
    # UTILITIES
    # ========================================================================

    def get_stats(self) -> Dict:
        """
        Get database statistics.

        Returns:
            Dictionary with table counts
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        stats = {}

        # Count agents
        cursor.execute("SELECT COUNT(DISTINCT name) FROM agents_status")
        stats['total_agents'] = cursor.fetchone()[0]

        # Count terminal commands
        cursor.execute("SELECT COUNT(*) FROM terminal_history")
        stats['total_commands'] = cursor.fetchone()[0]

        # Count syncs
        cursor.execute("SELECT COUNT(*) FROM sync_history")
        stats['total_syncs'] = cursor.fetchone()[0]

        return stats

    def close(self):
        """Close database connection."""
        if self.connection:
            self.connection.close()
            self.connection = None
            print("[DATABASE] Connection closed")


# Global database instance
_db_instance = None


def get_database() -> SkynetDatabase:
    """
    Get global database instance (singleton pattern).

    Returns:
        SkynetDatabase instance
    """
    global _db_instance
    if _db_instance is None:
        _db_instance = SkynetDatabase()
    return _db_instance


if __name__ == "__main__":
    # Test database
    db = SkynetDatabase()
    print("Database initialized successfully!")
    print("Stats:", db.get_stats())
