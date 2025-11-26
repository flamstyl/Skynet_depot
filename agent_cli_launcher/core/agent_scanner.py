"""
Agent Scanner Module
Automatically detects all executable agents in the specified directory.
Supports: .py, .bat, .exe files
"""

import os
from pathlib import Path
from typing import List, Dict, Optional


class AgentScanner:
    """
    Scans a directory for executable agent files and returns their metadata.
    """

    SUPPORTED_EXTENSIONS = {'.py', '.bat', '.exe'}

    def __init__(self, scan_directory: str = r"C:/Users/rapha/IA/agents/"):
        """
        Initialize the agent scanner.

        Args:
            scan_directory: The directory to scan for agents
        """
        self.scan_directory = Path(scan_directory)
        self._agents: List[Dict[str, str]] = []

    def scan(self) -> List[Dict[str, str]]:
        """
        Scan the directory for agent files.

        Returns:
            List of agent metadata dictionaries containing:
            - name: Agent name (without extension)
            - path: Full path to the agent file
            - type: Agent type (python, batch, executable)
        """
        self._agents = []

        if not self.scan_directory.exists():
            print(f"⚠️  Scan directory does not exist: {self.scan_directory}")
            return self._agents

        # Scan for executable files
        for file_path in self.scan_directory.rglob("*"):
            if file_path.is_file() and file_path.suffix.lower() in self.SUPPORTED_EXTENSIONS:
                agent_info = self._create_agent_info(file_path)
                if agent_info:
                    self._agents.append(agent_info)

        # Sort by name
        self._agents.sort(key=lambda x: x['name'].lower())

        print(f"✓ Found {len(self._agents)} agent(s) in {self.scan_directory}")
        return self._agents

    def _create_agent_info(self, file_path: Path) -> Optional[Dict[str, str]]:
        """
        Create agent metadata from a file path.

        Args:
            file_path: Path to the agent file

        Returns:
            Dictionary with agent metadata or None if invalid
        """
        extension = file_path.suffix.lower()

        # Determine agent type
        agent_type_map = {
            '.py': 'python',
            '.bat': 'batch',
            '.exe': 'executable'
        }

        agent_type = agent_type_map.get(extension)
        if not agent_type:
            return None

        return {
            'name': file_path.stem,
            'path': str(file_path.resolve()),
            'type': agent_type,
            'extension': extension
        }

    def get_agents(self) -> List[Dict[str, str]]:
        """
        Get the list of detected agents.

        Returns:
            List of agent metadata dictionaries
        """
        return self._agents

    def find_agent_by_name(self, name: str) -> Optional[Dict[str, str]]:
        """
        Find an agent by its name.

        Args:
            name: The agent name to search for

        Returns:
            Agent metadata dictionary or None if not found
        """
        for agent in self._agents:
            if agent['name'] == name:
                return agent
        return None

    def refresh(self) -> List[Dict[str, str]]:
        """
        Refresh the agent list by re-scanning the directory.

        Returns:
            Updated list of agents
        """
        return self.scan()


if __name__ == "__main__":
    # Test the scanner
    scanner = AgentScanner()
    agents = scanner.scan()

    print("\n🔍 Agent Scanner Test Results:")
    print("=" * 60)
    for agent in agents:
        print(f"  Name: {agent['name']}")
        print(f"  Type: {agent['type']}")
        print(f"  Path: {agent['path']}")
        print("-" * 60)
