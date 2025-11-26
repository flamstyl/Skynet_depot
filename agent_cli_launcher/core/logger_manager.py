"""
Logger Manager
Creates session-based log files for each agent.
Organizes logs in /logs/{agent_name}/{timestamp}.log
"""

import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional, TextIO


class LoggerManager:
    """
    Manages session-based logging for agent processes.
    Each agent session gets its own timestamped log file.
    """

    def __init__(self, logs_base_dir: str = None):
        """
        Initialize the logger manager.

        Args:
            logs_base_dir: Base directory for logs. Defaults to ./logs
        """
        if logs_base_dir is None:
            # Use logs directory relative to project root
            project_root = Path(__file__).parent.parent
            logs_base_dir = project_root / "logs"

        self.logs_base_dir = Path(logs_base_dir)
        self.logs_base_dir.mkdir(parents=True, exist_ok=True)

        # Active log files: agent_name -> file handle
        self._log_files: Dict[str, TextIO] = {}

        # Log file paths: agent_name -> path
        self._log_paths: Dict[str, Path] = {}

        print(f"✓ Logger Manager initialized (logs: {self.logs_base_dir})")

    def start_session(self, agent_name: str) -> Path:
        """
        Start a new logging session for an agent.
        Creates a new timestamped log file.

        Args:
            agent_name: Name of the agent

        Returns:
            Path to the created log file
        """
        # Close existing session if any
        self.close_session(agent_name)

        # Create agent-specific log directory
        agent_log_dir = self.logs_base_dir / agent_name
        agent_log_dir.mkdir(parents=True, exist_ok=True)

        # Generate timestamped log filename
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        log_filename = f"{timestamp}.log"
        log_path = agent_log_dir / log_filename

        try:
            # Open log file for writing
            log_file = open(log_path, 'w', encoding='utf-8', buffering=1)

            # Write header
            log_file.write("=" * 80 + "\n")
            log_file.write(f"Agent: {agent_name}\n")
            log_file.write(f"Session started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            log_file.write("=" * 80 + "\n\n")
            log_file.flush()

            # Store file handle and path
            self._log_files[agent_name] = log_file
            self._log_paths[agent_name] = log_path

            print(f"✓ Started log session for '{agent_name}': {log_path}")
            return log_path

        except Exception as e:
            print(f"❌ Failed to start log session for '{agent_name}': {e}")
            raise

    def write(self, agent_name: str, line: str):
        """
        Write a line to the agent's log file.

        Args:
            agent_name: Name of the agent
            line: Line to write (without newline)
        """
        if agent_name not in self._log_files:
            # Auto-start session if not exists
            self.start_session(agent_name)

        log_file = self._log_files.get(agent_name)
        if log_file and not log_file.closed:
            try:
                timestamp = datetime.now().strftime("%H:%M:%S")
                log_file.write(f"[{timestamp}] {line}\n")
                log_file.flush()
            except Exception as e:
                print(f"⚠️  Failed to write to log for '{agent_name}': {e}")

    def write_system(self, agent_name: str, message: str):
        """
        Write a system message to the agent's log file.

        Args:
            agent_name: Name of the agent
            message: System message to write
        """
        if agent_name not in self._log_files:
            return

        log_file = self._log_files.get(agent_name)
        if log_file and not log_file.closed:
            try:
                timestamp = datetime.now().strftime("%H:%M:%S")
                log_file.write(f"\n{'=' * 80}\n")
                log_file.write(f"[{timestamp}] SYSTEM: {message}\n")
                log_file.write(f"{'=' * 80}\n\n")
                log_file.flush()
            except Exception as e:
                print(f"⚠️  Failed to write system message for '{agent_name}': {e}")

    def close_session(self, agent_name: str):
        """
        Close the logging session for an agent.

        Args:
            agent_name: Name of the agent
        """
        if agent_name in self._log_files:
            log_file = self._log_files[agent_name]

            if not log_file.closed:
                try:
                    # Write footer
                    log_file.write("\n" + "=" * 80 + "\n")
                    log_file.write(f"Session ended: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                    log_file.write("=" * 80 + "\n")
                    log_file.flush()
                    log_file.close()

                    print(f"✓ Closed log session for '{agent_name}'")
                except Exception as e:
                    print(f"⚠️  Error closing log for '{agent_name}': {e}")

            del self._log_files[agent_name]

        if agent_name in self._log_paths:
            del self._log_paths[agent_name]

    def get_log_path(self, agent_name: str) -> Optional[Path]:
        """
        Get the current log file path for an agent.

        Args:
            agent_name: Name of the agent

        Returns:
            Path to the log file or None
        """
        return self._log_paths.get(agent_name)

    def get_agent_log_dir(self, agent_name: str) -> Path:
        """
        Get the log directory for an agent.

        Args:
            agent_name: Name of the agent

        Returns:
            Path to the agent's log directory
        """
        return self.logs_base_dir / agent_name

    def get_recent_logs(self, agent_name: str, limit: int = 10) -> list:
        """
        Get the most recent log files for an agent.

        Args:
            agent_name: Name of the agent
            limit: Maximum number of log files to return

        Returns:
            List of log file paths, sorted by modification time (newest first)
        """
        agent_log_dir = self.get_agent_log_dir(agent_name)

        if not agent_log_dir.exists():
            return []

        # Get all log files
        log_files = list(agent_log_dir.glob("*.log"))

        # Sort by modification time (newest first)
        log_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)

        return log_files[:limit]

    def close_all(self):
        """
        Close all active logging sessions.
        """
        for agent_name in list(self._log_files.keys()):
            self.close_session(agent_name)

        print("✓ All logging sessions closed")

    def __del__(self):
        """
        Cleanup: close all log files when the manager is destroyed.
        """
        try:
            self.close_all()
        except:
            pass


if __name__ == "__main__":
    # Test the logger manager
    logger = LoggerManager()

    # Start a test session
    log_path = logger.start_session("test_agent")
    print(f"Log file created: {log_path}")

    # Write some test lines
    logger.write("test_agent", "This is a test line")
    logger.write("test_agent", "Another test line")
    logger.write_system("test_agent", "Agent process started")

    # Close the session
    logger.close_session("test_agent")

    # Check recent logs
    recent = logger.get_recent_logs("test_agent")
    print(f"Recent log files: {recent}")
