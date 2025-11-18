#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skynet Prompt Syncer - VS Code Syncer Module
Handles synchronization of prompts to VS Code PromptArchitect
"""

import os
import shutil
import json
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


class VSCodeSyncer:
    """Synchronizes prompts to VS Code PromptArchitect."""

    def __init__(self, vscode_dir: str, backup_enabled: bool = True):
        """
        Initialize the VS Code syncer.

        Args:
            vscode_dir: Path to VS Code PromptArchitect templates directory
            backup_enabled: Whether to create backups before overwriting
        """
        self.vscode_dir = Path(vscode_dir)
        self.backup_enabled = backup_enabled
        self.sync_log = []

        logger.info(f"VSCodeSyncer initialized: {self.vscode_dir}")

    def sync_prompt_to_vscode(self, prompt_path: str) -> Dict:
        """
        Sync a single prompt to VS Code PromptArchitect.

        Args:
            prompt_path: Full path to the prompt file

        Returns:
            Dictionary with sync result
        """
        result = {
            'success': False,
            'target': 'VS Code PromptArchitect',
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

            # Create VS Code directory if it doesn't exist
            self.vscode_dir.mkdir(parents=True, exist_ok=True)

            # Handle different file types
            if source_path.suffix == '.jsonl':
                # JSONL files are imported as fragments
                result = self._sync_jsonl_file(source_path)
            else:
                # Regular text/markdown files
                result = self._sync_text_file(source_path)

            # Add to sync log
            self.sync_log.append(result)

        except Exception as e:
            result['message'] = f"Error syncing to VS Code: {e}"
            logger.error(result['message'])

        return result

    def _sync_text_file(self, source_path: Path) -> Dict:
        """
        Sync a text/markdown file to VS Code.

        Args:
            source_path: Path to source file

        Returns:
            Sync result dictionary
        """
        result = {
            'success': False,
            'target': 'VS Code PromptArchitect',
            'source': str(source_path),
            'destination': '',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'message': ''
        }

        try:
            # Destination file path
            dest_path = self.vscode_dir / source_path.name
            result['destination'] = str(dest_path)

            # Backup existing file if it exists
            if dest_path.exists() and self.backup_enabled:
                self._backup_file(dest_path)

            # Copy the file
            shutil.copy2(source_path, dest_path)

            result['success'] = True
            result['message'] = f"Synced {source_path.name} → VS Code PromptArchitect"
            logger.info(result['message'])

        except Exception as e:
            result['message'] = f"Error syncing text file: {e}"
            logger.error(result['message'])

        return result

    def _sync_jsonl_file(self, source_path: Path) -> Dict:
        """
        Sync a JSONL file to VS Code as prompt fragments.

        Args:
            source_path: Path to JSONL source file

        Returns:
            Sync result dictionary
        """
        result = {
            'success': False,
            'target': 'VS Code PromptArchitect',
            'source': str(source_path),
            'destination': '',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'message': ''
        }

        try:
            # Read JSONL file
            fragments = []
            with open(source_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            fragment = json.loads(line)
                            fragments.append(fragment)
                        except json.JSONDecodeError as e:
                            logger.warning(f"Skipping invalid JSON line: {e}")

            # Create a collection file for the fragments
            collection_name = source_path.stem + "_collection.json"
            dest_path = self.vscode_dir / collection_name
            result['destination'] = str(dest_path)

            # Create collection structure
            collection = {
                'name': source_path.stem,
                'source': str(source_path),
                'imported': datetime.now().isoformat(),
                'fragments': fragments
            }

            # Backup existing collection if it exists
            if dest_path.exists() and self.backup_enabled:
                self._backup_file(dest_path)

            # Write collection file
            with open(dest_path, 'w', encoding='utf-8') as f:
                json.dump(collection, f, indent=2, ensure_ascii=False)

            result['success'] = True
            result['message'] = f"Imported {len(fragments)} fragments from {source_path.name} → VS Code"
            logger.info(result['message'])

        except Exception as e:
            result['message'] = f"Error syncing JSONL file: {e}"
            logger.error(result['message'])

        return result

    def sync_multiple_prompts(self, prompt_paths: List[str]) -> List[Dict]:
        """
        Sync multiple prompts to VS Code.

        Args:
            prompt_paths: List of prompt file paths

        Returns:
            List of sync results
        """
        results = []

        logger.info(f"Syncing {len(prompt_paths)} prompts to VS Code...")

        for prompt_path in prompt_paths:
            result = self.sync_prompt_to_vscode(prompt_path)
            results.append(result)

        success_count = sum(1 for r in results if r['success'])
        logger.info(f"VS Code sync complete: {success_count}/{len(results)} successful")

        return results

    def _backup_file(self, file_path: Path) -> bool:
        """
        Create a backup of a file before overwriting.

        Args:
            file_path: Path to file to backup

        Returns:
            True if backup successful, False otherwise
        """
        try:
            backup_dir = self.vscode_dir / 'backups'
            backup_dir.mkdir(parents=True, exist_ok=True)

            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_name = f"{file_path.stem}_{timestamp}{file_path.suffix}"
            backup_path = backup_dir / backup_name

            shutil.copy2(file_path, backup_path)
            logger.info(f"Backed up {file_path.name} → {backup_path}")

            return True

        except Exception as e:
            logger.error(f"Error creating backup: {e}")
            return False

    def list_synced_prompts(self) -> List[Dict]:
        """
        List all prompts currently in VS Code directory.

        Returns:
            List of prompt file information
        """
        prompts = []

        try:
            if not self.vscode_dir.exists():
                logger.warning(f"VS Code directory does not exist: {self.vscode_dir}")
                return prompts

            for file_path in self.vscode_dir.iterdir():
                if file_path.is_file() and not file_path.name.startswith('.'):
                    stat = file_path.stat()
                    prompts.append({
                        'name': file_path.name,
                        'path': str(file_path),
                        'size': stat.st_size,
                        'modified': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                    })

            logger.info(f"Found {len(prompts)} prompts in VS Code directory")

        except Exception as e:
            logger.error(f"Error listing VS Code prompts: {e}")

        return prompts

    def remove_prompt(self, prompt_name: str) -> bool:
        """
        Remove a prompt from VS Code directory.

        Args:
            prompt_name: Name of the prompt file to remove

        Returns:
            True if successful, False otherwise
        """
        try:
            file_path = self.vscode_dir / prompt_name

            if not file_path.exists():
                logger.warning(f"Prompt not found: {prompt_name}")
                return False

            # Backup before removing
            if self.backup_enabled:
                self._backup_file(file_path)

            file_path.unlink()
            logger.info(f"Removed prompt: {prompt_name}")
            return True

        except Exception as e:
            logger.error(f"Error removing prompt: {e}")
            return False

    def get_sync_log(self) -> List[Dict]:
        """Get the sync log."""
        return self.sync_log

    def clear_sync_log(self):
        """Clear the sync log."""
        self.sync_log = []
        logger.info("VS Code sync log cleared")

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


if __name__ == "__main__":
    # Test the module
    print("Testing VSCodeSyncer...")
    print("-" * 50)

    vscode_dir = "./test_vscode_templates"
    syncer = VSCodeSyncer(vscode_dir, backup_enabled=True)

    print(f"\nVS Code directory: {syncer.vscode_dir}")
    print(f"Backup enabled: {syncer.backup_enabled}")

    # List any existing prompts
    prompts = syncer.list_synced_prompts()
    print(f"\nFound {len(prompts)} existing prompts in VS Code directory")
