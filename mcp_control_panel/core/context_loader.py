"""
MCP Control Panel - Context Loader
Loads and manages agent configuration contexts from JSON files
"""

import json
import os
from typing import Dict, List, Optional
from pathlib import Path


class AgentContext:
    """Represents an agent's configuration context"""

    def __init__(self, data: Dict):
        self.id = data.get('id', '')
        self.name = data.get('name', 'Unknown Agent')
        self.description = data.get('description', '')
        self.exec_command = data.get('exec', '')
        self.working_dir = data.get('working_dir', '')
        self.env = data.get('env', {})
        self.context = data.get('context', {})
        self.color = data.get('color', '#808080')
        self.icon = data.get('icon', 'default_icon.png')

        # Context specific fields
        self.memory_dir = self.context.get('memory_dir', '')
        self.task_file = self.context.get('task_file', '')
        self.profile = self.context.get('profile', 'Agent')
        self.capabilities = self.context.get('capabilities', [])

    def to_dict(self) -> Dict:
        """Convert context to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'exec': self.exec_command,
            'working_dir': self.working_dir,
            'env': self.env,
            'context': {
                'memory_dir': self.memory_dir,
                'task_file': self.task_file,
                'profile': self.profile,
                'capabilities': self.capabilities
            },
            'color': self.color,
            'icon': self.icon
        }

    def get_formatted_info(self) -> str:
        """Get formatted information string for display"""
        info = []
        info.append(f"Agent: {self.name}")
        info.append(f"ID: {self.id}")
        info.append(f"Description: {self.description}")
        info.append(f"\nProfile: {self.profile}")
        info.append(f"\nCommand: {self.exec_command}")

        if self.working_dir:
            info.append(f"Working Directory: {self.working_dir}")

        if self.memory_dir:
            info.append(f"Memory Directory: {self.memory_dir}")

        if self.task_file:
            info.append(f"Task File: {self.task_file}")

        if self.capabilities:
            info.append(f"\nCapabilities:")
            for cap in self.capabilities:
                info.append(f"  - {cap}")

        if self.env:
            info.append(f"\nEnvironment Variables:")
            for key, value in self.env.items():
                info.append(f"  {key}: {value}")

        return "\n".join(info)

    def validate(self) -> tuple[bool, List[str]]:
        """
        Validate agent configuration

        Returns:
            (is_valid: bool, errors: List[str])
        """
        errors = []

        if not self.id:
            errors.append("Agent ID is required")

        if not self.name:
            errors.append("Agent name is required")

        if not self.exec_command:
            errors.append("Execution command is required")

        if self.working_dir and not os.path.exists(self.working_dir):
            errors.append(f"Working directory does not exist: {self.working_dir}")

        if self.memory_dir and not os.path.exists(self.memory_dir):
            errors.append(f"Memory directory does not exist: {self.memory_dir}")

        return len(errors) == 0, errors


class ContextLoader:
    """Loads and manages agent contexts from JSON files"""

    def __init__(self, agents_dir: str):
        """
        Initialize context loader

        Args:
            agents_dir: Directory containing agent JSON configuration files
        """
        self.agents_dir = Path(agents_dir)
        self.contexts: Dict[str, AgentContext] = {}

        if not self.agents_dir.exists():
            raise ValueError(f"Agents directory not found: {agents_dir}")

    def load_all_contexts(self) -> tuple[int, List[str]]:
        """
        Load all agent contexts from JSON files

        Returns:
            (loaded_count: int, errors: List[str])
        """
        errors = []
        loaded_count = 0

        # Find all JSON files in agents directory
        json_files = list(self.agents_dir.glob('*.json'))

        if not json_files:
            errors.append(f"No JSON configuration files found in {self.agents_dir}")
            return 0, errors

        for json_file in json_files:
            try:
                success, error = self.load_context(str(json_file))
                if success:
                    loaded_count += 1
                else:
                    errors.append(f"{json_file.name}: {error}")
            except Exception as e:
                errors.append(f"{json_file.name}: {str(e)}")

        return loaded_count, errors

    def load_context(self, json_path: str) -> tuple[bool, Optional[str]]:
        """
        Load a single agent context from JSON file

        Args:
            json_path: Path to JSON configuration file

        Returns:
            (success: bool, error_message: Optional[str])
        """
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            context = AgentContext(data)

            # Validate context
            is_valid, validation_errors = context.validate()
            if not is_valid:
                return False, "; ".join(validation_errors)

            # Store context
            self.contexts[context.id] = context

            return True, None

        except json.JSONDecodeError as e:
            return False, f"Invalid JSON: {str(e)}"
        except Exception as e:
            return False, f"Error loading context: {str(e)}"

    def get_context(self, agent_id: str) -> Optional[AgentContext]:
        """Get context for a specific agent"""
        return self.contexts.get(agent_id)

    def get_all_contexts(self) -> Dict[str, AgentContext]:
        """Get all loaded contexts"""
        return self.contexts.copy()

    def get_agent_ids(self) -> List[str]:
        """Get list of all agent IDs"""
        return list(self.contexts.keys())

    def get_agent_names(self) -> Dict[str, str]:
        """Get mapping of agent IDs to names"""
        return {agent_id: context.name for agent_id, context in self.contexts.items()}

    def reload_context(self, agent_id: str) -> tuple[bool, Optional[str]]:
        """
        Reload a specific agent's context from disk

        Returns:
            (success: bool, error_message: Optional[str])
        """
        # Find the JSON file for this agent
        json_file = self.agents_dir / f"{agent_id}.json"

        if not json_file.exists():
            return False, f"Configuration file not found: {json_file}"

        return self.load_context(str(json_file))

    def save_context(self, agent_id: str, context: AgentContext) -> tuple[bool, Optional[str]]:
        """
        Save agent context to JSON file

        Args:
            agent_id: Agent ID
            context: Agent context to save

        Returns:
            (success: bool, error_message: Optional[str])
        """
        try:
            json_file = self.agents_dir / f"{agent_id}.json"

            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(context.to_dict(), f, indent=2, ensure_ascii=False)

            # Update in-memory context
            self.contexts[agent_id] = context

            return True, None

        except Exception as e:
            return False, f"Error saving context: {str(e)}"

    def add_new_agent(self, agent_data: Dict) -> tuple[bool, Optional[str]]:
        """
        Add a new agent configuration

        Args:
            agent_data: Dictionary containing agent configuration

        Returns:
            (success: bool, error_message: Optional[str])
        """
        try:
            context = AgentContext(agent_data)

            # Validate
            is_valid, errors = context.validate()
            if not is_valid:
                return False, "; ".join(errors)

            # Check if agent already exists
            if context.id in self.contexts:
                return False, f"Agent '{context.id}' already exists"

            # Save to file
            return self.save_context(context.id, context)

        except Exception as e:
            return False, f"Error adding new agent: {str(e)}"

    def remove_agent(self, agent_id: str) -> tuple[bool, Optional[str]]:
        """
        Remove an agent configuration

        Args:
            agent_id: Agent ID to remove

        Returns:
            (success: bool, error_message: Optional[str])
        """
        if agent_id not in self.contexts:
            return False, f"Agent '{agent_id}' not found"

        try:
            # Remove JSON file
            json_file = self.agents_dir / f"{agent_id}.json"
            if json_file.exists():
                json_file.unlink()

            # Remove from memory
            del self.contexts[agent_id]

            return True, None

        except Exception as e:
            return False, f"Error removing agent: {str(e)}"

    def search_agents(self, query: str) -> List[AgentContext]:
        """
        Search agents by name, description, or capabilities

        Args:
            query: Search query

        Returns:
            List of matching agent contexts
        """
        query_lower = query.lower()
        results = []

        for context in self.contexts.values():
            # Search in name, description, profile, capabilities
            if (query_lower in context.name.lower() or
                query_lower in context.description.lower() or
                query_lower in context.profile.lower() or
                any(query_lower in cap.lower() for cap in context.capabilities)):
                results.append(context)

        return results
