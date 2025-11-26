"""
Agent Process Manager
Handles launching, stopping, and monitoring agent processes.
Captures stdout/stderr in real-time using threads.
"""

import subprocess
import threading
import queue
import sys
from typing import Dict, Optional, Callable
from pathlib import Path


class AgentProcess:
    """
    Manages a single agent process with real-time output capturing.
    """

    def __init__(self, agent_info: Dict[str, str], output_callback: Optional[Callable] = None):
        """
        Initialize the agent process manager.

        Args:
            agent_info: Dictionary containing agent metadata (name, path, type)
            output_callback: Optional callback function for output lines
        """
        self.agent_info = agent_info
        self.name = agent_info['name']
        self.path = agent_info['path']
        self.agent_type = agent_info['type']
        self.output_callback = output_callback

        self.process: Optional[subprocess.Popen] = None
        self.output_queue = queue.Queue()
        self.reader_thread: Optional[threading.Thread] = None
        self.status = "stopped"  # stopped, running, error
        self.exit_code: Optional[int] = None

    def start(self) -> bool:
        """
        Start the agent process.

        Returns:
            True if started successfully, False otherwise
        """
        if self.is_running():
            print(f"⚠️  Agent '{self.name}' is already running")
            return False

        try:
            # Build command based on agent type
            if self.agent_type == 'python':
                cmd = [sys.executable, self.path]
            elif self.agent_type == 'batch':
                cmd = [self.path]
            elif self.agent_type == 'executable':
                cmd = [self.path]
            else:
                print(f"❌ Unsupported agent type: {self.agent_type}")
                self.status = "error"
                return False

            # Start the process
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True,
                creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
            )

            self.status = "running"
            self.exit_code = None

            # Start output reader thread
            self.reader_thread = threading.Thread(
                target=self._read_output,
                daemon=True
            )
            self.reader_thread.start()

            print(f"✓ Agent '{self.name}' started (PID: {self.process.pid})")
            return True

        except Exception as e:
            print(f"❌ Failed to start agent '{self.name}': {e}")
            self.status = "error"
            return False

    def stop(self) -> bool:
        """
        Stop the agent process gracefully.

        Returns:
            True if stopped successfully, False otherwise
        """
        if not self.is_running():
            print(f"⚠️  Agent '{self.name}' is not running")
            return False

        try:
            # Try graceful termination first
            self.process.terminate()

            # Wait up to 5 seconds for termination
            try:
                self.exit_code = self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                # Force kill if graceful termination fails
                print(f"⚠️  Force killing agent '{self.name}'")
                self.process.kill()
                self.exit_code = self.process.wait()

            self.status = "stopped"
            print(f"✓ Agent '{self.name}' stopped (exit code: {self.exit_code})")
            return True

        except Exception as e:
            print(f"❌ Failed to stop agent '{self.name}': {e}")
            self.status = "error"
            return False

    def is_running(self) -> bool:
        """
        Check if the agent process is currently running.

        Returns:
            True if running, False otherwise
        """
        if self.process is None:
            return False

        poll_result = self.process.poll()
        if poll_result is not None:
            # Process has terminated
            self.exit_code = poll_result
            if self.status == "running":
                # Unexpected termination
                self.status = "error" if poll_result != 0 else "stopped"
                print(f"⚠️  Agent '{self.name}' terminated (exit code: {poll_result})")
            return False

        return True

    def get_status(self) -> str:
        """
        Get the current status of the agent.

        Returns:
            Status string: "running", "stopped", or "error"
        """
        self.is_running()  # Update status
        return self.status

    def get_output_lines(self) -> list:
        """
        Get all available output lines from the queue.

        Returns:
            List of output lines
        """
        lines = []
        while not self.output_queue.empty():
            try:
                lines.append(self.output_queue.get_nowait())
            except queue.Empty:
                break
        return lines

    def _read_output(self):
        """
        Background thread that reads process output line by line.
        """
        if self.process is None or self.process.stdout is None:
            return

        try:
            for line in iter(self.process.stdout.readline, ''):
                if line:
                    line = line.rstrip('\n\r')
                    self.output_queue.put(line)

                    # Call callback if provided
                    if self.output_callback:
                        try:
                            self.output_callback(self.name, line)
                        except Exception as e:
                            print(f"⚠️  Output callback error: {e}")

                # Check if process has terminated
                if self.process.poll() is not None:
                    break

        except Exception as e:
            print(f"⚠️  Error reading output for '{self.name}': {e}")
        finally:
            if self.process and self.process.stdout:
                self.process.stdout.close()


class AgentProcessManager:
    """
    Manages multiple agent processes.
    """

    def __init__(self, output_callback: Optional[Callable] = None):
        """
        Initialize the process manager.

        Args:
            output_callback: Optional callback for agent output
        """
        self.processes: Dict[str, AgentProcess] = {}
        self.output_callback = output_callback

    def start_agent(self, agent_info: Dict[str, str]) -> bool:
        """
        Start an agent.

        Args:
            agent_info: Agent metadata dictionary

        Returns:
            True if started successfully
        """
        agent_name = agent_info['name']

        # Stop existing process if running
        if agent_name in self.processes:
            self.stop_agent(agent_name)

        # Create and start new process
        agent_process = AgentProcess(agent_info, self.output_callback)
        success = agent_process.start()

        if success:
            self.processes[agent_name] = agent_process

        return success

    def stop_agent(self, agent_name: str) -> bool:
        """
        Stop an agent.

        Args:
            agent_name: Name of the agent to stop

        Returns:
            True if stopped successfully
        """
        if agent_name not in self.processes:
            return False

        agent_process = self.processes[agent_name]
        success = agent_process.stop()

        if success:
            del self.processes[agent_name]

        return success

    def is_running(self, agent_name: str) -> bool:
        """
        Check if an agent is running.

        Args:
            agent_name: Name of the agent

        Returns:
            True if running
        """
        if agent_name not in self.processes:
            return False

        return self.processes[agent_name].is_running()

    def get_status(self, agent_name: str) -> str:
        """
        Get agent status.

        Args:
            agent_name: Name of the agent

        Returns:
            Status string
        """
        if agent_name not in self.processes:
            return "stopped"

        return self.processes[agent_name].get_status()

    def get_all_statuses(self) -> Dict[str, str]:
        """
        Get statuses for all managed agents.

        Returns:
            Dictionary mapping agent names to statuses
        """
        return {name: proc.get_status() for name, proc in self.processes.items()}

    def stop_all(self):
        """
        Stop all running agents.
        """
        for agent_name in list(self.processes.keys()):
            self.stop_agent(agent_name)


if __name__ == "__main__":
    # Test the process manager
    def output_callback(agent_name, line):
        print(f"[{agent_name}] {line}")

    manager = AgentProcessManager(output_callback=output_callback)
    print("✓ Agent Process Manager initialized")
