"""
Sentinelle MCP - Log Manager
Centralized logging system with JSON structured logs and rotation.
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum
from logging.handlers import RotatingFileHandler


class LogLevel(Enum):
    """Log levels"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogManager:
    """Manages centralized logging for Sentinelle MCP"""

    def __init__(self, log_file_path: str, max_size_mb: int = 100,
                 backup_count: int = 5, level: str = "INFO",
                 console_output: bool = True):
        """
        Initialize log manager.

        Args:
            log_file_path: Path to log file
            max_size_mb: Maximum size of log file in MB before rotation
            backup_count: Number of backup files to keep
            level: Logging level
            console_output: Whether to also output to console
        """
        self.log_file_path = Path(log_file_path)
        self.max_size_mb = max_size_mb
        self.backup_count = backup_count
        self.level = level
        self.console_output = console_output

        # Create log directory if it doesn't exist
        self.log_file_path.parent.mkdir(parents=True, exist_ok=True)

        # Initialize logger
        self.logger = logging.getLogger("SentinelleMCP")
        self._setup_logger()

    def _setup_logger(self) -> None:
        """Setup logger with handlers"""
        self.logger.setLevel(getattr(logging, self.level))

        # Remove existing handlers
        self.logger.handlers.clear()

        # File handler with rotation
        max_bytes = self.max_size_mb * 1024 * 1024
        file_handler = RotatingFileHandler(
            self.log_file_path,
            maxBytes=max_bytes,
            backupCount=self.backup_count,
            encoding='utf-8'
        )
        file_handler.setFormatter(self._get_formatter())
        self.logger.addHandler(file_handler)

        # Console handler
        if self.console_output:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(self._get_console_formatter())
            self.logger.addHandler(console_handler)

    def _get_formatter(self) -> logging.Formatter:
        """Get log formatter for file output (JSON)"""
        return logging.Formatter('%(message)s')

    def _get_console_formatter(self) -> logging.Formatter:
        """Get log formatter for console output"""
        return logging.Formatter(
            '[%(asctime)s] [%(levelname)s] [%(component)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

    def _create_log_entry(self, level: str, component: str,
                         message: str, event_id: Optional[str] = None,
                         metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Create structured log entry.

        Args:
            level: Log level
            component: Component name
            message: Log message
            event_id: Optional event ID
            metadata: Optional additional metadata

        Returns:
            Log entry dictionary
        """
        entry = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "component": component,
            "message": message
        }

        if event_id:
            entry["event_id"] = event_id

        if metadata:
            entry["metadata"] = metadata

        return entry

    def log(self, level: str, component: str, message: str,
            event_id: Optional[str] = None,
            metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Log a message.

        Args:
            level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            component: Component name
            message: Log message
            event_id: Optional event ID
            metadata: Optional additional metadata
        """
        entry = self._create_log_entry(level, component, message, event_id, metadata)

        # Log to file as JSON
        log_method = getattr(self.logger, level.lower(), self.logger.info)

        # For file handler, log JSON
        json_entry = json.dumps(entry, ensure_ascii=False)
        log_method(json_entry, extra={'component': component})

    def debug(self, component: str, message: str, **kwargs) -> None:
        """Log DEBUG message"""
        self.log("DEBUG", component, message, **kwargs)

    def info(self, component: str, message: str, **kwargs) -> None:
        """Log INFO message"""
        self.log("INFO", component, message, **kwargs)

    def warning(self, component: str, message: str, **kwargs) -> None:
        """Log WARNING message"""
        self.log("WARNING", component, message, **kwargs)

    def error(self, component: str, message: str, **kwargs) -> None:
        """Log ERROR message"""
        self.log("ERROR", component, message, **kwargs)

    def critical(self, component: str, message: str, **kwargs) -> None:
        """Log CRITICAL message"""
        self.log("CRITICAL", component, message, **kwargs)

    def log_event(self, event: Dict[str, Any], component: str = "watcher",
                  level: str = "INFO") -> None:
        """
        Log a file system event.

        Args:
            event: Event dictionary
            component: Component logging the event
            level: Log level
        """
        message = f"Event: {event.get('event_type', 'unknown')} - {event.get('path', 'unknown')}"
        self.log(
            level=level,
            component=component,
            message=message,
            event_id=event.get('event_id'),
            metadata=event
        )

    def log_ai_analysis(self, event_id: str, model: str, analysis: str,
                       duration_seconds: float, component: str = "ai_bridge") -> None:
        """
        Log AI analysis result.

        Args:
            event_id: Event ID
            model: AI model used
            analysis: Analysis result
            duration_seconds: Time taken
            component: Component name
        """
        metadata = {
            "model": model,
            "duration_seconds": duration_seconds,
            "analysis_length": len(analysis)
        }

        self.log(
            level="INFO",
            component=component,
            message=f"AI analysis completed with {model}",
            event_id=event_id,
            metadata=metadata
        )

    def log_report_generated(self, event_id: str, report_path: str,
                            formats: List[str], component: str = "report_gen") -> None:
        """
        Log report generation.

        Args:
            event_id: Event ID
            report_path: Path to generated report
            formats: List of formats generated
            component: Component name
        """
        metadata = {
            "report_path": report_path,
            "formats": formats
        }

        self.log(
            level="INFO",
            component=component,
            message=f"Report generated: {report_path}",
            event_id=event_id,
            metadata=metadata
        )

    def log_error_with_exception(self, component: str, message: str,
                                 exception: Exception,
                                 event_id: Optional[str] = None) -> None:
        """
        Log error with exception details.

        Args:
            component: Component name
            message: Error message
            exception: Exception object
            event_id: Optional event ID
        """
        import traceback

        metadata = {
            "exception_type": type(exception).__name__,
            "exception_message": str(exception),
            "traceback": traceback.format_exc()
        }

        self.log(
            level="ERROR",
            component=component,
            message=message,
            event_id=event_id,
            metadata=metadata
        )

    def query_logs(self, level: Optional[str] = None,
                   component: Optional[str] = None,
                   start_time: Optional[datetime] = None,
                   end_time: Optional[datetime] = None,
                   limit: int = 100) -> List[Dict[str, Any]]:
        """
        Query logs with filters.

        Args:
            level: Filter by log level
            component: Filter by component
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of entries to return

        Returns:
            List of log entries
        """
        results = []

        try:
            if not self.log_file_path.exists():
                return results

            with open(self.log_file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())

                        # Apply filters
                        if level and entry.get('level') != level:
                            continue

                        if component and entry.get('component') != component:
                            continue

                        if start_time:
                            entry_time = datetime.fromisoformat(entry.get('timestamp', ''))
                            if entry_time < start_time:
                                continue

                        if end_time:
                            entry_time = datetime.fromisoformat(entry.get('timestamp', ''))
                            if entry_time > end_time:
                                continue

                        results.append(entry)

                        if len(results) >= limit:
                            break

                    except json.JSONDecodeError:
                        continue

        except Exception as e:
            self.error("log_manager", f"Error querying logs: {e}")

        return results

    def get_recent_logs(self, count: int = 50) -> List[Dict[str, Any]]:
        """
        Get most recent log entries.

        Args:
            count: Number of entries to return

        Returns:
            List of recent log entries
        """
        logs = []

        try:
            if not self.log_file_path.exists():
                return logs

            with open(self.log_file_path, 'r', encoding='utf-8') as f:
                all_lines = f.readlines()

                # Get last N lines
                recent_lines = all_lines[-count:] if len(all_lines) > count else all_lines

                for line in recent_lines:
                    try:
                        entry = json.loads(line.strip())
                        logs.append(entry)
                    except json.JSONDecodeError:
                        continue

        except Exception as e:
            self.error("log_manager", f"Error getting recent logs: {e}")

        return logs

    def get_stats(self) -> Dict[str, Any]:
        """
        Get logging statistics.

        Returns:
            Dictionary with stats
        """
        stats = {
            "total_entries": 0,
            "by_level": {},
            "by_component": {},
            "file_size_mb": 0,
            "oldest_entry": None,
            "newest_entry": None
        }

        try:
            if not self.log_file_path.exists():
                return stats

            stats["file_size_mb"] = self.log_file_path.stat().st_size / (1024 * 1024)

            with open(self.log_file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                        stats["total_entries"] += 1

                        # Count by level
                        level = entry.get('level', 'UNKNOWN')
                        stats["by_level"][level] = stats["by_level"].get(level, 0) + 1

                        # Count by component
                        component = entry.get('component', 'unknown')
                        stats["by_component"][component] = stats["by_component"].get(component, 0) + 1

                        # Track timestamps
                        timestamp = entry.get('timestamp')
                        if timestamp:
                            if not stats["oldest_entry"]:
                                stats["oldest_entry"] = timestamp
                            stats["newest_entry"] = timestamp

                    except json.JSONDecodeError:
                        continue

        except Exception as e:
            self.error("log_manager", f"Error getting stats: {e}")

        return stats

    def clear_logs(self, confirm: bool = False) -> bool:
        """
        Clear all logs (use with caution).

        Args:
            confirm: Must be True to actually clear

        Returns:
            True if logs were cleared
        """
        if not confirm:
            self.warning("log_manager", "Clear logs called without confirmation")
            return False

        try:
            if self.log_file_path.exists():
                self.log_file_path.unlink()
                self.info("log_manager", "Logs cleared")
                return True

        except Exception as e:
            self.error("log_manager", f"Error clearing logs: {e}")

        return False

    def rotate_now(self) -> None:
        """Force log rotation"""
        for handler in self.logger.handlers:
            if isinstance(handler, RotatingFileHandler):
                handler.doRollover()
                self.info("log_manager", "Log rotation performed")

    def __repr__(self) -> str:
        return f"LogManager(file={self.log_file_path}, level={self.level})"


# Singleton instance
_log_instance: Optional[LogManager] = None


def get_logger(log_file_path: str = "../../data/log_skynet.json",
               max_size_mb: int = 100, level: str = "INFO") -> LogManager:
    """
    Get singleton LogManager instance.

    Args:
        log_file_path: Path to log file
        max_size_mb: Maximum log file size in MB
        level: Log level

    Returns:
        LogManager instance
    """
    global _log_instance

    if _log_instance is None:
        _log_instance = LogManager(log_file_path, max_size_mb, level=level)

    return _log_instance


if __name__ == "__main__":
    # Test log manager
    import tempfile

    # Create temporary log file
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
        temp_log = f.name

    logger = LogManager(temp_log, max_size_mb=1, level="DEBUG")

    print(f"\n=== Testing Sentinelle MCP Log Manager ===\n")
    print(f"Log file: {temp_log}\n")

    # Test different log levels
    logger.debug("test", "This is a debug message")
    logger.info("test", "This is an info message")
    logger.warning("test", "This is a warning message")
    logger.error("test", "This is an error message")

    # Test event logging
    test_event = {
        "event_id": "test-123",
        "event_type": "created",
        "path": "/test/file.py",
        "timestamp": datetime.now().isoformat()
    }
    logger.log_event(test_event)

    # Test AI analysis logging
    logger.log_ai_analysis(
        event_id="test-123",
        model="claude_cli",
        analysis="This is a test file",
        duration_seconds=1.5
    )

    # Get statistics
    stats = logger.get_stats()
    print("\nLog Statistics:")
    print(f"  Total entries: {stats['total_entries']}")
    print(f"  File size: {stats['file_size_mb']:.4f} MB")
    print(f"  By level: {stats['by_level']}")
    print(f"  By component: {stats['by_component']}")

    # Get recent logs
    recent = logger.get_recent_logs(count=5)
    print(f"\nRecent logs ({len(recent)} entries):")
    for entry in recent:
        print(f"  [{entry['level']}] {entry['component']}: {entry['message']}")

    print(f"\n✓ Test completed")

    # Cleanup
    import os
    os.unlink(temp_log)
