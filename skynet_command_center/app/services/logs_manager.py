"""
Skynet Command Center - Logs Manager
=====================================
Manages system logs:
- Read and parse log files
- Filter logs by agent, level, time
- Append new log entries
- Maintain log rotation

Author: Skynet Architect
Version: 1.0
"""

import os
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import json

from ..config import LATEST_LOG_FILE, LOGS_DIR, MAX_LOG_LINES


class LogsManager:
    """
    Manages Skynet system logs.
    """

    def __init__(self):
        """Initialize Logs Manager."""
        self._ensure_log_file()

    def _ensure_log_file(self):
        """Ensure log file exists."""
        LOGS_DIR.mkdir(parents=True, exist_ok=True)

        if not LATEST_LOG_FILE.exists():
            LATEST_LOG_FILE.touch()
            print(f"[LOGS_MANAGER] Created log file: {LATEST_LOG_FILE}")

    def _parse_log_line(self, line: str) -> Optional[Dict]:
        """
        Parse a log line into structured format.

        Expected format: [TIMESTAMP] [LEVEL] [SOURCE] Message

        Args:
            line: Raw log line

        Returns:
            Parsed log entry dictionary or None if invalid
        """
        try:
            line = line.strip()
            if not line:
                return None

            # Try to parse structured log (JSON format)
            if line.startswith('{'):
                try:
                    return json.loads(line)
                except:
                    pass

            # Parse traditional format: [TIMESTAMP] [LEVEL] [SOURCE] Message
            parts = line.split(']', 3)

            if len(parts) >= 4:
                timestamp = parts[0].replace('[', '').strip()
                level = parts[1].replace('[', '').strip()
                source = parts[2].replace('[', '').strip()
                message = parts[3].strip()

                return {
                    'timestamp': timestamp,
                    'level': level,
                    'source': source,
                    'message': message,
                    'raw': line
                }
            else:
                # Fallback: treat as plain message
                return {
                    'timestamp': datetime.now().isoformat(),
                    'level': 'INFO',
                    'source': 'unknown',
                    'message': line,
                    'raw': line
                }

        except Exception as e:
            print(f"[LOGS_MANAGER] Error parsing log line: {e}")
            return None

    def get_latest_logs(self, limit: int = MAX_LOG_LINES) -> List[Dict]:
        """
        Get latest log entries.

        Args:
            limit: Maximum number of log entries to return

        Returns:
            List of log entry dictionaries
        """
        try:
            if not LATEST_LOG_FILE.exists():
                return []

            with open(LATEST_LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()

            # Get last N lines
            recent_lines = lines[-limit:] if len(lines) > limit else lines

            # Parse lines
            logs = []
            for line in recent_lines:
                parsed = self._parse_log_line(line)
                if parsed:
                    logs.append(parsed)

            # Reverse to show newest first
            logs.reverse()

            return logs

        except Exception as e:
            print(f"[LOGS_MANAGER] Error reading logs: {e}")
            return []

    def get_logs_by_source(self, source: str, limit: int = MAX_LOG_LINES) -> List[Dict]:
        """
        Get logs filtered by source.

        Args:
            source: Source to filter by (e.g., agent name)
            limit: Maximum number of log entries to return

        Returns:
            List of log entry dictionaries
        """
        all_logs = self.get_latest_logs(limit * 2)  # Get more to ensure enough after filtering

        filtered = [
            log for log in all_logs
            if log.get('source', '').lower() == source.lower()
        ]

        return filtered[:limit]

    def get_logs_by_level(self, level: str, limit: int = MAX_LOG_LINES) -> List[Dict]:
        """
        Get logs filtered by level.

        Args:
            level: Log level to filter by (INFO, WARNING, ERROR, etc.)
            limit: Maximum number of log entries to return

        Returns:
            List of log entry dictionaries
        """
        all_logs = self.get_latest_logs(limit * 2)

        filtered = [
            log for log in all_logs
            if log.get('level', '').upper() == level.upper()
        ]

        return filtered[:limit]

    def append_log(
        self,
        message: str,
        level: str = 'INFO',
        source: str = 'COMMAND_CENTER'
    ):
        """
        Append a log entry to the log file.

        Args:
            message: Log message
            level: Log level (INFO, WARNING, ERROR, etc.)
            source: Log source (agent name, component, etc.)
        """
        try:
            timestamp = datetime.now().isoformat()

            # Format log line
            log_line = f"[{timestamp}] [{level.upper()}] [{source}] {message}\n"

            # Append to file
            with open(LATEST_LOG_FILE, 'a', encoding='utf-8') as f:
                f.write(log_line)

            print(f"[LOGS_MANAGER] Logged: {level} - {source} - {message}")

        except Exception as e:
            print(f"[LOGS_MANAGER] Error appending log: {e}")

    def clear_logs(self):
        """Clear all logs."""
        try:
            if LATEST_LOG_FILE.exists():
                LATEST_LOG_FILE.unlink()
                self._ensure_log_file()
                self.append_log("Logs cleared", level='INFO', source='LOGS_MANAGER')
                print("[LOGS_MANAGER] Logs cleared")
        except Exception as e:
            print(f"[LOGS_MANAGER] Error clearing logs: {e}")

    def get_log_stats(self) -> Dict:
        """
        Get log file statistics.

        Returns:
            Dictionary with log statistics
        """
        try:
            if not LATEST_LOG_FILE.exists():
                return {
                    'total_lines': 0,
                    'file_size': 0,
                    'last_modified': None
                }

            stats = LATEST_LOG_FILE.stat()

            # Count lines
            with open(LATEST_LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
                line_count = sum(1 for _ in f)

            # Get level counts
            logs = self.get_latest_logs(1000)
            level_counts = {}
            for log in logs:
                level = log.get('level', 'UNKNOWN')
                level_counts[level] = level_counts.get(level, 0) + 1

            return {
                'total_lines': line_count,
                'file_size': stats.st_size,
                'file_size_formatted': self._format_size(stats.st_size),
                'last_modified': datetime.fromtimestamp(stats.st_mtime).isoformat(),
                'level_counts': level_counts
            }

        except Exception as e:
            print(f"[LOGS_MANAGER] Error getting log stats: {e}")
            return {
                'total_lines': 0,
                'file_size': 0,
                'last_modified': None,
                'error': str(e)
            }

    def search_logs(self, query: str, limit: int = MAX_LOG_LINES) -> List[Dict]:
        """
        Search logs by keyword.

        Args:
            query: Search query
            limit: Maximum number of results

        Returns:
            List of matching log entries
        """
        all_logs = self.get_latest_logs(limit * 2)
        query_lower = query.lower()

        matches = [
            log for log in all_logs
            if query_lower in log.get('message', '').lower()
            or query_lower in log.get('source', '').lower()
        ]

        return matches[:limit]

    @staticmethod
    def _format_size(size_bytes: int) -> str:
        """
        Format size in bytes to human-readable format.

        Args:
            size_bytes: Size in bytes

        Returns:
            Formatted string (e.g., "1.5 KB")
        """
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} TB"


# Global logs manager instance
_logs_manager = None


def get_logs_manager() -> LogsManager:
    """
    Get global logs manager instance (singleton pattern).

    Returns:
        LogsManager instance
    """
    global _logs_manager
    if _logs_manager is None:
        _logs_manager = LogsManager()
    return _logs_manager


if __name__ == "__main__":
    # Test logs manager
    manager = LogsManager()
    print("Logs Manager initialized successfully!")

    # Test append
    manager.append_log("Test message", level='INFO', source='TEST')

    # Get stats
    stats = manager.get_log_stats()
    print(f"Log stats: {stats}")

    # Get latest
    logs = manager.get_latest_logs(5)
    print(f"Latest logs: {len(logs)} entries")
