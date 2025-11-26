#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skynet Prompt Syncer - Configuration Loader Module
Handles loading and validating configuration files
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ConfigLoader:
    """Loads and manages configuration for the Prompt Syncer."""

    def __init__(self, config_dir: Optional[str] = None):
        """
        Initialize the configuration loader.

        Args:
            config_dir: Directory containing config files. If None, uses default.
        """
        if config_dir is None:
            # Get the directory where this script is located
            script_dir = Path(__file__).parent.parent
            config_dir = script_dir / "data"

        self.config_dir = Path(config_dir)
        self.sync_config_path = self.config_dir / "sync_config.json"
        self.agents_config_path = self.config_dir / "agents.json"

        self.sync_config = {}
        self.agents_config = {}

        logger.info(f"ConfigLoader initialized with config_dir: {self.config_dir}")

    def load_all(self) -> Dict:
        """
        Load all configuration files.

        Returns:
            Dictionary containing all configuration data
        """
        self.sync_config = self.load_sync_config()
        self.agents_config = self.load_agents_config()

        config = {
            'prompts_dir': self.sync_config.get('skynet_prompts_dir', ''),
            'agents_target_dir': self.sync_config.get('agents_target_dir', ''),
            'vscode_dir': self.sync_config.get('vscode_promptarchitect_dir', ''),
            'backup_enabled': self.sync_config.get('backup_enabled', True),
            'backup_dir': self.sync_config.get('backup_dir', ''),
            'agents': self.agents_config.get('agents', []),
            'sync_history_file': self.sync_config.get('sync_history_file', 'sync_history.json')
        }

        logger.info("All configuration loaded successfully")
        return config

    def load_sync_config(self) -> Dict:
        """
        Load sync_config.json.

        Returns:
            Dictionary containing sync configuration
        """
        try:
            if not self.sync_config_path.exists():
                logger.error(f"sync_config.json not found at: {self.sync_config_path}")
                return self._get_default_sync_config()

            with open(self.sync_config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)

            logger.info(f"Loaded sync_config.json from {self.sync_config_path}")
            return config

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in sync_config.json: {e}")
            return self._get_default_sync_config()

        except Exception as e:
            logger.error(f"Error loading sync_config.json: {e}")
            return self._get_default_sync_config()

    def load_agents_config(self) -> Dict:
        """
        Load agents.json.

        Returns:
            Dictionary containing agents configuration
        """
        try:
            if not self.agents_config_path.exists():
                logger.error(f"agents.json not found at: {self.agents_config_path}")
                return self._get_default_agents_config()

            with open(self.agents_config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)

            logger.info(f"Loaded agents.json from {self.agents_config_path}")
            logger.info(f"Found {len(config.get('agents', []))} agents in configuration")

            return config

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in agents.json: {e}")
            return self._get_default_agents_config()

        except Exception as e:
            logger.error(f"Error loading agents.json: {e}")
            return self._get_default_agents_config()

    def _get_default_sync_config(self) -> Dict:
        """Return default sync configuration."""
        return {
            'skynet_prompts_dir': 'C:/Users/rapha/Skynet_Drive_Core/prompts',
            'agents_target_dir': 'C:/Users/rapha/IA/agents_contexts',
            'vscode_promptarchitect_dir': 'C:/Users/rapha/AppData/Roaming/Code/User/promptarchitect_templates',
            'backup_enabled': True,
            'backup_dir': 'C:/Users/rapha/Skynet_Drive_Core/prompts_backup',
            'sync_history_file': 'sync_history.json'
        }

    def _get_default_agents_config(self) -> Dict:
        """Return default agents configuration."""
        return {
            'agents': [
                {
                    'name': 'Claude CLI',
                    'context_dir': 'C:/Users/rapha/IA/agents/claude/context',
                    'enabled': True
                }
            ]
        }

    def get_enabled_agents(self) -> List[Dict]:
        """
        Get list of enabled agents.

        Returns:
            List of enabled agent configurations
        """
        if not self.agents_config:
            self.load_agents_config()

        agents = self.agents_config.get('agents', [])
        enabled_agents = [agent for agent in agents if agent.get('enabled', True)]

        logger.info(f"Found {len(enabled_agents)} enabled agents")
        return enabled_agents

    def validate_paths(self) -> Dict[str, bool]:
        """
        Validate that all configured paths exist.

        Returns:
            Dictionary mapping path names to existence status
        """
        if not self.sync_config:
            self.load_sync_config()

        validation = {
            'prompts_dir': Path(self.sync_config.get('skynet_prompts_dir', '')).exists(),
            'agents_target_dir': Path(self.sync_config.get('agents_target_dir', '')).exists(),
            'vscode_dir': Path(self.sync_config.get('vscode_promptarchitect_dir', '')).exists(),
            'backup_dir': Path(self.sync_config.get('backup_dir', '')).exists()
        }

        for path_name, exists in validation.items():
            if exists:
                logger.info(f"✓ {path_name} exists")
            else:
                logger.warning(f"✗ {path_name} does not exist")

        return validation

    def update_sync_config(self, updates: Dict) -> bool:
        """
        Update sync_config.json with new values.

        Args:
            updates: Dictionary of values to update

        Returns:
            True if successful, False otherwise
        """
        try:
            # Load current config
            current_config = self.load_sync_config()

            # Update with new values
            current_config.update(updates)

            # Write back to file
            with open(self.sync_config_path, 'w', encoding='utf-8') as f:
                json.dump(current_config, f, indent=2)

            self.sync_config = current_config
            logger.info("sync_config.json updated successfully")
            return True

        except Exception as e:
            logger.error(f"Error updating sync_config.json: {e}")
            return False

    def add_agent(self, name: str, context_dir: str, enabled: bool = True) -> bool:
        """
        Add a new agent to agents.json.

        Args:
            name: Name of the agent
            context_dir: Path to agent's context directory
            enabled: Whether agent is enabled

        Returns:
            True if successful, False otherwise
        """
        try:
            # Load current config
            current_config = self.load_agents_config()

            # Check if agent already exists
            agents = current_config.get('agents', [])
            for agent in agents:
                if agent.get('name') == name:
                    logger.warning(f"Agent '{name}' already exists")
                    return False

            # Add new agent
            new_agent = {
                'name': name,
                'context_dir': context_dir,
                'enabled': enabled
            }
            agents.append(new_agent)
            current_config['agents'] = agents

            # Write back to file
            with open(self.agents_config_path, 'w', encoding='utf-8') as f:
                json.dump(current_config, f, indent=2)

            self.agents_config = current_config
            logger.info(f"Agent '{name}' added successfully")
            return True

        except Exception as e:
            logger.error(f"Error adding agent: {e}")
            return False


if __name__ == "__main__":
    # Test the module
    print("Testing ConfigLoader...")
    print("-" * 50)

    loader = ConfigLoader()
    config = loader.load_all()

    print("\nLoaded Configuration:")
    print(f"Prompts Directory: {config['prompts_dir']}")
    print(f"Agents Target Directory: {config['agents_target_dir']}")
    print(f"VS Code Directory: {config['vscode_dir']}")
    print(f"Backup Enabled: {config['backup_enabled']}")
    print(f"\nAgents ({len(config['agents'])}):")

    for agent in config['agents']:
        print(f"  - {agent['name']}: {agent['context_dir']} (enabled: {agent.get('enabled', True)})")

    print("\nPath Validation:")
    validation = loader.validate_paths()
    for path, exists in validation.items():
        print(f"  {path}: {'✓' if exists else '✗'}")
