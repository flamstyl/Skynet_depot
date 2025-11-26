"""
Skynet Command Center - Agent Manager
======================================
Manages all Skynet agents:
- Detection of agent status (online/offline/error)
- Start/Stop agents
- Monitor agent health
- Load agent configurations

Author: Skynet Architect
Version: 1.0
"""

import json
import subprocess
import psutil
import os
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

from ..config import AGENTS_DIR, AGENTS_STATUS_FILE, AGENT_STATUS, AGENT_PING_TIMEOUT
from ..database import get_database


class AgentManager:
    """
    Manages all Skynet agents.
    """

    def __init__(self):
        """Initialize Agent Manager."""
        self.agents_config = self._load_agents_config()
        self.db = get_database()

    def _load_agents_config(self) -> List[Dict]:
        """
        Load agents configuration from agents.json.

        Returns:
            List of agent configurations
        """
        if not AGENTS_STATUS_FILE.exists():
            print(f"[AGENT_MANAGER] No agents.json found at {AGENTS_STATUS_FILE}")
            return []

        try:
            with open(AGENTS_STATUS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                agents = data.get('agents', []) if isinstance(data, dict) else data
                print(f"[AGENT_MANAGER] Loaded {len(agents)} agents from config")
                return agents
        except Exception as e:
            print(f"[AGENT_MANAGER] Error loading agents.json: {e}")
            return []

    def _save_agents_config(self):
        """Save agents configuration to agents.json."""
        try:
            AGENTS_STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(AGENTS_STATUS_FILE, 'w', encoding='utf-8') as f:
                json.dump({'agents': self.agents_config}, f, indent=2)
            print(f"[AGENT_MANAGER] Saved {len(self.agents_config)} agents to config")
        except Exception as e:
            print(f"[AGENT_MANAGER] Error saving agents.json: {e}")

    def _check_process_running(self, pid: Optional[int]) -> bool:
        """
        Check if a process is running by PID.

        Args:
            pid: Process ID

        Returns:
            True if process is running
        """
        if pid is None:
            return False

        try:
            process = psutil.Process(pid)
            return process.is_running()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return False

    def _find_agent_process(self, agent_name: str) -> Optional[int]:
        """
        Find agent process by name.

        Args:
            agent_name: Name of the agent

        Returns:
            PID if found, None otherwise
        """
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    cmdline = proc.info.get('cmdline', [])
                    if cmdline and any(agent_name.lower() in str(cmd).lower() for cmd in cmdline):
                        return proc.info['pid']
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
        except Exception as e:
            print(f"[AGENT_MANAGER] Error finding process for {agent_name}: {e}")

        return None

    def get_agent_status(self, agent_name: str) -> Dict:
        """
        Get current status of an agent.

        Args:
            agent_name: Name of the agent

        Returns:
            Dictionary with agent status information
        """
        agent_config = next(
            (a for a in self.agents_config if a.get('name') == agent_name),
            None
        )

        if not agent_config:
            return {
                'name': agent_name,
                'status': AGENT_STATUS['ERROR'],
                'pid': None,
                'last_update': datetime.now().isoformat(),
                'error': 'Agent not found in configuration'
            }

        # Check if PID is stored and still running
        pid = agent_config.get('pid')
        is_running = self._check_process_running(pid)

        # If stored PID not running, try to find by name
        if not is_running:
            pid = self._find_agent_process(agent_name)
            is_running = pid is not None

        status = AGENT_STATUS['ONLINE'] if is_running else AGENT_STATUS['OFFLINE']

        # Update agent config
        agent_config['pid'] = pid
        agent_config['status'] = status
        agent_config['last_update'] = datetime.now().isoformat()

        # Record to database
        self.db.record_agent_status(
            name=agent_name,
            status=status,
            pid=pid,
            metadata={'config': agent_config}
        )

        return {
            'name': agent_name,
            'status': status,
            'pid': pid,
            'last_update': agent_config['last_update'],
            'script': agent_config.get('script', 'unknown'),
            'description': agent_config.get('description', '')
        }

    def get_all_agents_status(self) -> List[Dict]:
        """
        Get status of all agents.

        Returns:
            List of agent statuses
        """
        statuses = []

        for agent in self.agents_config:
            agent_name = agent.get('name', 'unknown')
            status = self.get_agent_status(agent_name)
            statuses.append(status)

        return statuses

    def start_agent(self, agent_name: str) -> Dict:
        """
        Start an agent.

        Args:
            agent_name: Name of the agent to start

        Returns:
            Result dictionary with success status and message
        """
        agent_config = next(
            (a for a in self.agents_config if a.get('name') == agent_name),
            None
        )

        if not agent_config:
            return {
                'success': False,
                'message': f'Agent {agent_name} not found in configuration'
            }

        # Check if already running
        current_status = self.get_agent_status(agent_name)
        if current_status['status'] == AGENT_STATUS['ONLINE']:
            return {
                'success': False,
                'message': f'Agent {agent_name} is already running (PID: {current_status["pid"]})'
            }

        # Get script path
        script = agent_config.get('script')
        if not script:
            return {
                'success': False,
                'message': f'No script defined for agent {agent_name}'
            }

        script_path = Path(AGENTS_DIR) / script

        if not script_path.exists():
            return {
                'success': False,
                'message': f'Script not found: {script_path}'
            }

        # Start the agent
        try:
            # Determine how to run the script
            if script_path.suffix == '.py':
                cmd = ['python', str(script_path)]
            elif script_path.suffix in ['.sh', '.bash']:
                cmd = ['bash', str(script_path)]
            elif script_path.suffix in ['.bat', '.cmd']:
                cmd = ['cmd', '/c', str(script_path)]
            else:
                cmd = [str(script_path)]

            # Start process in background
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=AGENTS_DIR
            )

            pid = process.pid

            # Update agent config
            agent_config['pid'] = pid
            agent_config['status'] = AGENT_STATUS['ONLINE']
            agent_config['last_update'] = datetime.now().isoformat()
            self._save_agents_config()

            # Record to database
            self.db.record_agent_status(
                name=agent_name,
                status=AGENT_STATUS['ONLINE'],
                pid=pid,
                metadata={'action': 'start'}
            )

            return {
                'success': True,
                'message': f'Agent {agent_name} started successfully (PID: {pid})',
                'pid': pid
            }

        except Exception as e:
            error_msg = f'Failed to start agent {agent_name}: {str(e)}'

            # Record error to database
            self.db.record_agent_status(
                name=agent_name,
                status=AGENT_STATUS['ERROR'],
                pid=None,
                metadata={'error': str(e), 'action': 'start_failed'}
            )

            return {
                'success': False,
                'message': error_msg
            }

    def stop_agent(self, agent_name: str) -> Dict:
        """
        Stop an agent.

        Args:
            agent_name: Name of the agent to stop

        Returns:
            Result dictionary with success status and message
        """
        current_status = self.get_agent_status(agent_name)

        if current_status['status'] != AGENT_STATUS['ONLINE']:
            return {
                'success': False,
                'message': f'Agent {agent_name} is not running'
            }

        pid = current_status.get('pid')
        if not pid:
            return {
                'success': False,
                'message': f'No PID found for agent {agent_name}'
            }

        try:
            # Terminate process
            process = psutil.Process(pid)
            process.terminate()

            # Wait for process to terminate (max 5 seconds)
            try:
                process.wait(timeout=5)
            except psutil.TimeoutExpired:
                # Force kill if not terminated
                process.kill()

            # Update agent config
            agent_config = next(
                (a for a in self.agents_config if a.get('name') == agent_name),
                None
            )
            if agent_config:
                agent_config['pid'] = None
                agent_config['status'] = AGENT_STATUS['OFFLINE']
                agent_config['last_update'] = datetime.now().isoformat()
                self._save_agents_config()

            # Record to database
            self.db.record_agent_status(
                name=agent_name,
                status=AGENT_STATUS['OFFLINE'],
                pid=None,
                metadata={'action': 'stop'}
            )

            return {
                'success': True,
                'message': f'Agent {agent_name} stopped successfully'
            }

        except psutil.NoSuchProcess:
            return {
                'success': False,
                'message': f'Process {pid} not found'
            }
        except Exception as e:
            error_msg = f'Failed to stop agent {agent_name}: {str(e)}'

            # Record error to database
            self.db.record_agent_status(
                name=agent_name,
                status=AGENT_STATUS['ERROR'],
                pid=pid,
                metadata={'error': str(e), 'action': 'stop_failed'}
            )

            return {
                'success': False,
                'message': error_msg
            }

    def restart_agent(self, agent_name: str) -> Dict:
        """
        Restart an agent.

        Args:
            agent_name: Name of the agent to restart

        Returns:
            Result dictionary with success status and message
        """
        # Stop if running
        stop_result = self.stop_agent(agent_name)

        # Start
        start_result = self.start_agent(agent_name)

        return start_result


# Global agent manager instance
_agent_manager = None


def get_agent_manager() -> AgentManager:
    """
    Get global agent manager instance (singleton pattern).

    Returns:
        AgentManager instance
    """
    global _agent_manager
    if _agent_manager is None:
        _agent_manager = AgentManager()
    return _agent_manager


if __name__ == "__main__":
    # Test agent manager
    manager = AgentManager()
    print("Agent Manager initialized successfully!")
    print("Agents:", manager.get_all_agents_status())
