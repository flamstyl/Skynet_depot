#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skynet Prompt Syncer - Agent Syncer Module
Handles synchronization of prompts to CLI agents
"""

import os
import shutil
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AgentSyncer:
    """Synchronizes prompts to CLI agent context directories."""

    def __init__(self, backup_enabled: bool = True, backup_dir: Optional[str] = None):
        """
        Initialize the agent syncer.

        Args:
            backup_enabled: Whether to create backups before overwriting
            backup_dir: Directory for backups
        """
        self.backup_enabled = backup_enabled
        self.backup_dir = Path(backup_dir) if backup_dir else None
        self.sync_log = []

        logger.info(f"AgentSyncer initialized (backup: {backup_enabled})")

    def sync_to_agent(self, prompt_path: str, agent: Dict) -> Dict:
        """
        Sync a single prompt to a single agent.

        Args:
            prompt_path: Full path to the prompt file
            agent: Agent configuration dictionary with 'name' and 'context_dir'

        Returns:
            Dictionary with sync result:
            {
                'success': True/False,
                'agent': 'Agent Name',
                'source': '/path/to/prompt',
                'destination': '/path/to/agent/context',
                'timestamp': '2024-11-18 12:34:56',
                'message': 'Success message or error'
            }
        """
        result = {
            'success': False,
            'agent': agent.get('name', 'Unknown'),
            'source': prompt_path,
            'destination': '',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'message': ''
        }

        try:
            source_path = Path(prompt_path)
            if not source_path.exists():
                result['message'] = f"Source file does not exist: {prompt_path}"
                logger.error(result['message'])
                return result

            # Get agent context directory
            agent_context_dir = Path(agent.get('context_dir', ''))
            if not agent_context_dir:
                result['message'] = f"Agent {agent['name']} has no context_dir configured"
                logger.error(result['message'])
                return result

            # Create agent context directory if it doesn't exist
            agent_context_dir.mkdir(parents=True, exist_ok=True)

            # Destination file path
            dest_path = agent_context_dir / source_path.name
            result['destination'] = str(dest_path)

            # Backup existing file if it exists
            if dest_path.exists() and self.backup_enabled:
                self._backup_file(dest_path, agent['name'])

            # Copy the file
            shutil.copy2(source_path, dest_path)

            result['success'] = True
            result['message'] = f"Synced {source_path.name} → {agent['name']}"
            logger.info(result['message'])

            # Add to sync log
            self.sync_log.append(result)

        except PermissionError as e:
            result['message'] = f"Permission denied: {e}"
            logger.error(result['message'])

        except Exception as e:
            result['message'] = f"Error syncing to {agent['name']}: {e}"
            logger.error(result['message'])

        return result

    def sync_to_all_agents(self, prompt_path: str, agents: List[Dict]) -> List[Dict]:
        """
        Sync a single prompt to multiple agents.

        Args:
            prompt_path: Full path to the prompt file
            agents: List of agent configuration dictionaries

        Returns:
            List of sync results for each agent
        """
        results = []

        logger.info(f"Syncing {Path(prompt_path).name} to {len(agents)} agents...")

        for agent in agents:
            # Skip disabled agents
            if not agent.get('enabled', True):
                logger.info(f"Skipping disabled agent: {agent.get('name')}")
                continue

            result = self.sync_to_agent(prompt_path, agent)
            results.append(result)

        success_count = sum(1 for r in results if r['success'])
        logger.info(f"Sync complete: {success_count}/{len(results)} successful")

        return results

    def sync_multiple_prompts_to_agents(
        self,
        prompt_paths: List[str],
        agents: List[Dict]
    ) -> List[Dict]:
        """
        Sync multiple prompts to multiple agents.

        Args:
            prompt_paths: List of prompt file paths
            agents: List of agent configuration dictionaries

        Returns:
            List of all sync results
        """
        all_results = []

        logger.info(f"Starting bulk sync: {len(prompt_paths)} prompts → {len(agents)} agents")

        for prompt_path in prompt_paths:
            results = self.sync_to_all_agents(prompt_path, agents)
            all_results.extend(results)

        success_count = sum(1 for r in all_results if r['success'])
        total_count = len(all_results)

        logger.info(f"Bulk sync complete: {success_count}/{total_count} operations successful")

        return all_results

    def _backup_file(self, file_path: Path, agent_name: str) -> bool:
        """
        Create a backup of a file before overwriting.

        Args:
            file_path: Path to file to backup
            agent_name: Name of the agent (for backup organization)

        Returns:
            True if backup successful, False otherwise
        """
        try:
            if not self.backup_dir:
                logger.warning("Backup enabled but no backup directory configured")
                return False

            # Create backup directory structure
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            agent_backup_dir = self.backup_dir / agent_name
            agent_backup_dir.mkdir(parents=True, exist_ok=True)

            # Backup file with timestamp
            backup_name = f"{file_path.stem}_{timestamp}{file_path.suffix}"
            backup_path = agent_backup_dir / backup_name

            shutil.copy2(file_path, backup_path)
            logger.info(f"Backed up {file_path.name} → {backup_path}")

            return True

        except Exception as e:
            logger.error(f"Error creating backup: {e}")
            return False

    def get_sync_log(self) -> List[Dict]:
        """
        Get the sync log.

        Returns:
            List of sync operations performed
        """
        return self.sync_log

    def clear_sync_log(self):
        """Clear the sync log."""
        self.sync_log = []
        logger.info("Sync log cleared")

    def get_sync_summary(self) -> Dict:
        """
        Get a summary of sync operations.

        Returns:
            Dictionary with sync statistics
        """
        total = len(self.sync_log)
        successful = sum(1 for log in self.sync_log if log['success'])
        failed = total - successful

        summary = {
            'total_operations': total,
            'successful': successful,
            'failed': failed,
            'success_rate': (successful / total * 100) if total > 0 else 0
        }

        return summary


def verify_agent_sync(agent: Dict, expected_files: List[str]) -> Dict:
    """
    Verify that expected files exist in an agent's context directory.

    Args:
        agent: Agent configuration dictionary
        expected_files: List of expected file names

    Returns:
        Dictionary with verification results
    """
    result = {
        'agent': agent.get('name', 'Unknown'),
        'context_dir': agent.get('context_dir', ''),
        'expected_files': len(expected_files),
        'found_files': 0,
        'missing_files': [],
        'verified': False
    }

    try:
        context_dir = Path(agent.get('context_dir', ''))

        if not context_dir.exists():
            result['missing_files'] = expected_files
            logger.warning(f"Agent context directory does not exist: {context_dir}")
            return result

        # Check each expected file
        for file_name in expected_files:
            file_path = context_dir / file_name
            if file_path.exists():
                result['found_files'] += 1
            else:
                result['missing_files'].append(file_name)

        result['verified'] = result['found_files'] == result['expected_files']

        if result['verified']:
            logger.info(f"✓ Agent '{agent['name']}' verification passed")
        else:
            logger.warning(f"✗ Agent '{agent['name']}' verification failed: "
                         f"{result['found_files']}/{result['expected_files']} files found")

    except Exception as e:
        logger.error(f"Error verifying agent sync: {e}")

    return result


if __name__ == "__main__":
    # Test the module
    print("Testing AgentSyncer...")
    print("-" * 50)

    # Test agent config
    test_agent = {
        'name': 'Test Agent',
        'context_dir': './test_agent_context',
        'enabled': True
    }

    syncer = AgentSyncer(backup_enabled=True, backup_dir='./test_backups')

    print("\nAgentSyncer initialized")
    print(f"Backup enabled: {syncer.backup_enabled}")
    print(f"Backup directory: {syncer.backup_dir}")
