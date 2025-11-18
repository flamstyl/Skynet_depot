"""
MCP Control Panel - History Manager
Logs all actions and events in the MCP system
"""

import os
from datetime import datetime
from typing import Optional
from enum import Enum
from pathlib import Path


class LogLevel(Enum):
    """Log severity levels"""
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    SUCCESS = "SUCCESS"
    DEBUG = "DEBUG"


class HistoryManager:
    """Manages logging of all MCP actions and events"""

    def __init__(self, log_file: str, max_size_mb: int = 10):
        """
        Initialize history manager

        Args:
            log_file: Path to log file
            max_size_mb: Maximum log file size in MB before rotation
        """
        self.log_file = Path(log_file)
        self.max_size_bytes = max_size_mb * 1024 * 1024

        # Ensure log directory exists
        self.log_file.parent.mkdir(parents=True, exist_ok=True)

        # Create log file if it doesn't exist
        if not self.log_file.exists():
            self._initialize_log_file()

    def _initialize_log_file(self):
        """Initialize a new log file with header"""
        header = [
            "=" * 80,
            "MCP CONTROL PANEL - SYSTEM LOG",
            "Skynet Multi-Agent Management System",
            f"Log initialized: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "=" * 80,
            ""
        ]

        with open(self.log_file, 'w', encoding='utf-8') as f:
            f.write("\n".join(header))

    def _check_rotation(self):
        """Check if log file needs rotation"""
        if self.log_file.exists() and self.log_file.stat().st_size > self.max_size_bytes:
            self._rotate_log()

    def _rotate_log(self):
        """Rotate log file when it gets too large"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = self.log_file.with_name(f"{self.log_file.stem}_{timestamp}.log")

        # Rename current log to backup
        self.log_file.rename(backup_file)

        # Create new log file
        self._initialize_log_file()

        self.log(LogLevel.INFO, "SYSTEM", "Log file rotated", f"Backup: {backup_file.name}")

    def log(self, level: LogLevel, category: str, message: str, details: Optional[str] = None):
        """
        Write a log entry

        Args:
            level: Log level
            category: Category (e.g., "AGENT", "SYSTEM", "USER")
            message: Main log message
            details: Optional additional details
        """
        self._check_rotation()

        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Format log entry
        log_entry = f"[{timestamp}] [{level.value:7s}] [{category:10s}] {message}"

        if details:
            log_entry += f" | {details}"

        # Write to log file
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(log_entry + "\n")
        except Exception as e:
            # Fallback if log writing fails
            print(f"ERROR: Failed to write to log: {e}")

    def log_agent_launch(self, agent_id: str, command: str, success: bool, message: str):
        """Log agent launch attempt"""
        level = LogLevel.SUCCESS if success else LogLevel.ERROR
        action = "launched" if success else "failed to launch"
        self.log(level, "AGENT", f"Agent '{agent_id}' {action}", f"Command: {command} | {message}")

    def log_agent_stop(self, agent_id: str, success: bool, message: str):
        """Log agent stop attempt"""
        level = LogLevel.SUCCESS if success else LogLevel.ERROR
        action = "stopped" if success else "failed to stop"
        self.log(level, "AGENT", f"Agent '{agent_id}' {action}", message)

    def log_agent_error(self, agent_id: str, error: str):
        """Log agent error"""
        self.log(LogLevel.ERROR, "AGENT", f"Agent '{agent_id}' error", error)

    def log_system_event(self, event: str, details: Optional[str] = None):
        """Log system event"""
        self.log(LogLevel.INFO, "SYSTEM", event, details)

    def log_user_action(self, action: str, details: Optional[str] = None):
        """Log user action"""
        self.log(LogLevel.INFO, "USER", action, details)

    def log_warning(self, category: str, message: str, details: Optional[str] = None):
        """Log warning"""
        self.log(LogLevel.WARNING, category, message, details)

    def log_error(self, category: str, message: str, details: Optional[str] = None):
        """Log error"""
        self.log(LogLevel.ERROR, category, message, details)

    def log_debug(self, category: str, message: str, details: Optional[str] = None):
        """Log debug information"""
        self.log(LogLevel.DEBUG, category, message, details)

    def get_recent_logs(self, lines: int = 100) -> list[str]:
        """
        Get recent log entries

        Args:
            lines: Number of recent lines to retrieve

        Returns:
            List of log lines
        """
        if not self.log_file.exists():
            return []

        try:
            with open(self.log_file, 'r', encoding='utf-8') as f:
                all_lines = f.readlines()
                return [line.rstrip() for line in all_lines[-lines:]]
        except Exception as e:
            return [f"ERROR: Failed to read log file: {e}"]

    def get_logs_by_level(self, level: LogLevel, lines: int = 100) -> list[str]:
        """
        Get log entries filtered by level

        Args:
            level: Log level to filter
            lines: Maximum number of lines to retrieve

        Returns:
            List of matching log lines
        """
        recent_logs = self.get_recent_logs(lines * 2)  # Get more to ensure we have enough
        filtered = [log for log in recent_logs if f"[{level.value}]" in log]
        return filtered[-lines:]

    def get_logs_by_category(self, category: str, lines: int = 100) -> list[str]:
        """
        Get log entries filtered by category

        Args:
            category: Category to filter
            lines: Maximum number of lines to retrieve

        Returns:
            List of matching log lines
        """
        recent_logs = self.get_recent_logs(lines * 2)
        filtered = [log for log in recent_logs if f"[{category.upper():10s}]" in log]
        return filtered[-lines:]

    def get_agent_history(self, agent_id: str, lines: int = 50) -> list[str]:
        """
        Get history for a specific agent

        Args:
            agent_id: Agent ID to filter
            lines: Maximum number of lines to retrieve

        Returns:
            List of log lines for this agent
        """
        recent_logs = self.get_recent_logs(lines * 3)
        filtered = [log for log in recent_logs if f"'{agent_id}'" in log]
        return filtered[-lines:]

    def search_logs(self, query: str, lines: int = 100) -> list[str]:
        """
        Search logs for a query string

        Args:
            query: Search query
            lines: Maximum number of lines to retrieve

        Returns:
            List of matching log lines
        """
        recent_logs = self.get_recent_logs(lines * 3)
        query_lower = query.lower()
        filtered = [log for log in recent_logs if query_lower in log.lower()]
        return filtered[-lines:]

    def clear_logs(self) -> bool:
        """
        Clear all logs (creates backup first)

        Returns:
            Success status
        """
        try:
            if self.log_file.exists():
                # Create backup before clearing
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_file = self.log_file.with_name(f"{self.log_file.stem}_backup_{timestamp}.log")
                self.log_file.rename(backup_file)

            # Create fresh log file
            self._initialize_log_file()
            self.log(LogLevel.INFO, "SYSTEM", "Logs cleared", f"Backup created: {backup_file.name}")

            return True

        except Exception as e:
            print(f"ERROR: Failed to clear logs: {e}")
            return False

    def export_logs(self, export_path: str, start_date: Optional[datetime] = None,
                    end_date: Optional[datetime] = None) -> tuple[bool, Optional[str]]:
        """
        Export logs to a file with optional date filtering

        Args:
            export_path: Path to export file
            start_date: Optional start date filter
            end_date: Optional end date filter

        Returns:
            (success: bool, error_message: Optional[str])
        """
        try:
            all_logs = self.get_recent_logs(10000)  # Get many logs

            # Filter by date if specified
            if start_date or end_date:
                filtered_logs = []
                for log in all_logs:
                    # Extract timestamp from log line
                    if log.startswith('['):
                        try:
                            timestamp_str = log[1:20]  # [YYYY-MM-DD HH:MM:SS]
                            log_date = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')

                            if start_date and log_date < start_date:
                                continue
                            if end_date and log_date > end_date:
                                continue

                            filtered_logs.append(log)
                        except ValueError:
                            # Skip malformed log lines
                            continue
                all_logs = filtered_logs

            # Write to export file
            with open(export_path, 'w', encoding='utf-8') as f:
                f.write("\n".join(all_logs))

            return True, None

        except Exception as e:
            return False, f"Export failed: {str(e)}"

    def get_log_statistics(self) -> dict:
        """
        Get statistics about the logs

        Returns:
            Dictionary with statistics
        """
        recent_logs = self.get_recent_logs(1000)

        stats = {
            'total_entries': len(recent_logs),
            'by_level': {},
            'by_category': {},
            'file_size_kb': 0
        }

        # Count by level
        for level in LogLevel:
            count = sum(1 for log in recent_logs if f"[{level.value}]" in log)
            stats['by_level'][level.value] = count

        # Count by category
        categories = ['AGENT', 'SYSTEM', 'USER']
        for category in categories:
            count = sum(1 for log in recent_logs if f"[{category:10s}]" in log)
            stats['by_category'][category] = count

        # File size
        if self.log_file.exists():
            stats['file_size_kb'] = round(self.log_file.stat().st_size / 1024, 2)

        return stats
