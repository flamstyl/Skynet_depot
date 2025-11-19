"""
Skynet Token Switcher — Database Manager
SQLite-based storage for API keys and usage logs
"""

import sqlite3
import os
from datetime import datetime
from pathlib import Path


class Database:
    def __init__(self, db_path="data/tokens.db"):
        self.db_path = os.path.join(
            Path(__file__).parent.parent, db_path
        )
        self.init_db()

    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """Initialize database with required tables"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Table: api_keys
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider TEXT NOT NULL UNIQUE,
                api_key TEXT NOT NULL,
                quota_total INTEGER NOT NULL,
                quota_used INTEGER DEFAULT 0,
                last_update TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Table: usage_log
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usage_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider TEXT NOT NULL,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                tokens_used INTEGER NOT NULL,
                success INTEGER DEFAULT 1,
                reason TEXT
            )
        """)

        conn.commit()
        conn.close()

    def add_key(self, provider, api_key, quota_total):
        """Add or update an API key"""
        conn = self.get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO api_keys (provider, api_key, quota_total, quota_used, last_update)
                VALUES (?, ?, ?, 0, ?)
                ON CONFLICT(provider) DO UPDATE SET
                    api_key = excluded.api_key,
                    quota_total = excluded.quota_total,
                    last_update = excluded.last_update
            """, (provider, api_key, quota_total, datetime.now().isoformat()))

            conn.commit()
            return True
        except Exception as e:
            print(f"Error adding key: {e}")
            return False
        finally:
            conn.close()

    def update_usage(self, provider, tokens_used):
        """Update quota usage for a provider"""
        conn = self.get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                UPDATE api_keys
                SET quota_used = quota_used + ?,
                    last_update = ?
                WHERE provider = ?
            """, (tokens_used, datetime.now().isoformat(), provider))

            conn.commit()
            return True
        except Exception as e:
            print(f"Error updating usage: {e}")
            return False
        finally:
            conn.close()

    def get_all_keys(self):
        """Get all API keys with their status"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                id,
                provider,
                api_key,
                quota_total,
                quota_used,
                last_update
            FROM api_keys
            ORDER BY provider
        """)

        keys = []
        for row in cursor.fetchall():
            keys.append({
                'id': row['id'],
                'provider': row['provider'],
                'api_key': row['api_key'],
                'quota_total': row['quota_total'],
                'quota_used': row['quota_used'],
                'last_update': row['last_update']
            })

        conn.close()
        return keys

    def get_key(self, provider):
        """Get a specific API key by provider"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                id,
                provider,
                api_key,
                quota_total,
                quota_used,
                last_update
            FROM api_keys
            WHERE provider = ?
        """, (provider,))

        row = cursor.fetchone()
        conn.close()

        if row:
            return {
                'id': row['id'],
                'provider': row['provider'],
                'api_key': row['api_key'],
                'quota_total': row['quota_total'],
                'quota_used': row['quota_used'],
                'last_update': row['last_update']
            }
        return None

    def log_event(self, provider, tokens_used, success=True, reason=None):
        """Log an API usage event"""
        conn = self.get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO usage_log (provider, timestamp, tokens_used, success, reason)
                VALUES (?, ?, ?, ?, ?)
            """, (provider, datetime.now().isoformat(), tokens_used, int(success), reason))

            conn.commit()
            return True
        except Exception as e:
            print(f"Error logging event: {e}")
            return False
        finally:
            conn.close()

    def get_recent_logs(self, limit=50):
        """Get recent usage logs"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                id,
                provider,
                timestamp,
                tokens_used,
                success,
                reason
            FROM usage_log
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))

        logs = []
        for row in cursor.fetchall():
            logs.append({
                'id': row['id'],
                'provider': row['provider'],
                'timestamp': row['timestamp'],
                'tokens_used': row['tokens_used'],
                'success': bool(row['success']),
                'reason': row['reason']
            })

        conn.close()
        return logs

    def reset_quota(self, provider):
        """Reset quota usage for a provider"""
        conn = self.get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                UPDATE api_keys
                SET quota_used = 0,
                    last_update = ?
                WHERE provider = ?
            """, (datetime.now().isoformat(), provider))

            conn.commit()
            return True
        except Exception as e:
            print(f"Error resetting quota: {e}")
            return False
        finally:
            conn.close()
