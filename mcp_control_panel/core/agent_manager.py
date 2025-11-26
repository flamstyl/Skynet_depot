"""
MCP Control Panel - Agent Manager
Manages the lifecycle of CLI agents: launch, stop, monitor output
"""

import subprocess
import threading
import queue
import os
import signal
from typing import Dict, Optional, Generator
from datetime import datetime


class AgentProcess:
    """Represents a running agent process"""

    def __init__(self, agent_id: str, process: subprocess.Popen):
        self.agent_id = agent_id
        self.process = process
        self.output_queue = queue.Queue()
        self.error_queue = queue.Queue()
        self.start_time = datetime.now()
        self.is_running = True

        # Start output reading threads
        self._start_output_threads()

    def _start_output_threads(self):
        """Start threads to read stdout and stderr"""
        def read_stdout():
            try:
                for line in iter(self.process.stdout.readline, b''):
                    if line:
                        self.output_queue.put(line.decode('utf-8', errors='replace').rstrip())
            except Exception as e:
                self.output_queue.put(f"[ERROR] Reading stdout: {e}")

        def read_stderr():
            try:
                for line in iter(self.process.stderr.readline, b''):
                    if line:
                        self.error_queue.put(line.decode('utf-8', errors='replace').rstrip())
            except Exception as e:
                self.error_queue.put(f"[ERROR] Reading stderr: {e}")

        stdout_thread = threading.Thread(target=read_stdout, daemon=True)
        stderr_thread = threading.Thread(target=read_stderr, daemon=True)

        stdout_thread.start()
        stderr_thread.start()

    def get_output(self) -> Generator[str, None, None]:
        """Get output lines from the process"""
        while not self.output_queue.empty():
            yield self.output_queue.get()

    def get_errors(self) -> Generator[str, None, None]:
        """Get error lines from the process"""
        while not self.error_queue.empty():
            yield self.error_queue.get()

    def is_alive(self) -> bool:
        """Check if process is still running"""
        if self.process.poll() is None:
            return True
        else:
            self.is_running = False
            return False

    def get_uptime(self) -> str:
        """Get process uptime"""
        delta = datetime.now() - self.start_time
        hours, remainder = divmod(int(delta.total_seconds()), 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


class AgentManager:
    """Manages multiple CLI agent processes"""

    def __init__(self):
        self.agents: Dict[str, AgentProcess] = {}
        self.max_concurrent_agents = 5  # Safety limit

    def launch_agent(self, agent_id: str, command: str, working_dir: Optional[str] = None,
                     env: Optional[Dict[str, str]] = None) -> tuple[bool, str]:
        """
        Launch a CLI agent process

        Args:
            agent_id: Unique identifier for the agent
            command: Command to execute
            working_dir: Working directory for the process
            env: Environment variables

        Returns:
            (success: bool, message: str)
        """
        # Check if agent is already running
        if agent_id in self.agents and self.agents[agent_id].is_alive():
            return False, f"Agent '{agent_id}' is already running"

        # Check concurrent limit
        active_count = sum(1 for agent in self.agents.values() if agent.is_alive())
        if active_count >= self.max_concurrent_agents:
            return False, f"Maximum concurrent agents ({self.max_concurrent_agents}) reached"

        try:
            # Prepare environment
            process_env = os.environ.copy()
            if env:
                process_env.update(env)

            # Set working directory
            cwd = working_dir if working_dir and os.path.exists(working_dir) else None

            # Launch process
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.PIPE,
                cwd=cwd,
                env=process_env,
                bufsize=1
            )

            # Store agent process
            self.agents[agent_id] = AgentProcess(agent_id, process)

            return True, f"Agent '{agent_id}' launched successfully (PID: {process.pid})"

        except Exception as e:
            return False, f"Failed to launch agent '{agent_id}': {str(e)}"

    def stop_agent(self, agent_id: str, force: bool = False) -> tuple[bool, str]:
        """
        Stop a running agent

        Args:
            agent_id: Agent to stop
            force: Use SIGKILL instead of SIGTERM

        Returns:
            (success: bool, message: str)
        """
        if agent_id not in self.agents:
            return False, f"Agent '{agent_id}' not found"

        agent = self.agents[agent_id]

        if not agent.is_alive():
            return False, f"Agent '{agent_id}' is not running"

        try:
            if force:
                agent.process.kill()  # SIGKILL
                msg = f"Agent '{agent_id}' forcefully terminated"
            else:
                agent.process.terminate()  # SIGTERM
                msg = f"Agent '{agent_id}' stopped gracefully"

            # Wait for process to end
            agent.process.wait(timeout=5)
            agent.is_running = False

            return True, msg

        except subprocess.TimeoutExpired:
            # Force kill if graceful shutdown failed
            agent.process.kill()
            agent.is_running = False
            return True, f"Agent '{agent_id}' force-stopped after timeout"

        except Exception as e:
            return False, f"Failed to stop agent '{agent_id}': {str(e)}"

    def get_agent_output(self, agent_id: str) -> tuple[list, list]:
        """
        Get output and errors from an agent

        Returns:
            (output_lines: list, error_lines: list)
        """
        if agent_id not in self.agents:
            return [], []

        agent = self.agents[agent_id]
        output_lines = list(agent.get_output())
        error_lines = list(agent.get_errors())

        return output_lines, error_lines

    def get_agent_status(self, agent_id: str) -> Optional[Dict]:
        """Get status information for an agent"""
        if agent_id not in self.agents:
            return None

        agent = self.agents[agent_id]
        is_alive = agent.is_alive()

        return {
            'agent_id': agent_id,
            'is_running': is_alive,
            'pid': agent.process.pid if is_alive else None,
            'uptime': agent.get_uptime() if is_alive else None,
            'start_time': agent.start_time.strftime('%Y-%m-%d %H:%M:%S'),
            'exit_code': agent.process.returncode if not is_alive else None
        }

    def get_all_agents_status(self) -> Dict[str, Dict]:
        """Get status of all agents"""
        return {
            agent_id: self.get_agent_status(agent_id)
            for agent_id in self.agents.keys()
        }

    def cleanup_dead_agents(self):
        """Remove dead agent processes from tracking"""
        dead_agents = [
            agent_id for agent_id, agent in self.agents.items()
            if not agent.is_alive()
        ]

        for agent_id in dead_agents:
            del self.agents[agent_id]

    def stop_all_agents(self) -> Dict[str, str]:
        """Stop all running agents"""
        results = {}

        for agent_id in list(self.agents.keys()):
            if self.agents[agent_id].is_alive():
                success, msg = self.stop_agent(agent_id)
                results[agent_id] = msg

        return results

    def send_input(self, agent_id: str, text: str) -> tuple[bool, str]:
        """
        Send input to an agent's stdin

        Args:
            agent_id: Target agent
            text: Text to send

        Returns:
            (success: bool, message: str)
        """
        if agent_id not in self.agents:
            return False, f"Agent '{agent_id}' not found"

        agent = self.agents[agent_id]

        if not agent.is_alive():
            return False, f"Agent '{agent_id}' is not running"

        try:
            agent.process.stdin.write(f"{text}\n".encode())
            agent.process.stdin.flush()
            return True, "Input sent successfully"
        except Exception as e:
            return False, f"Failed to send input: {str(e)}"
