"""
Skynet Command Center - Memory Manager
=======================================
Manages Skynet's central memory:
- Load and index memory files from Skynet Drive
- Generate memory tree structure
- Track memory usage and statistics
- Synchronize memory index

Author: Skynet Architect
Version: 1.0
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

from ..config import MEMORY_DIR, MEMORY_INDEX_FILE, SKYNET_ROOT
from ..database import get_database


class MemoryManager:
    """
    Manages Skynet's central memory system.
    """

    def __init__(self):
        """Initialize Memory Manager."""
        self.memory_index = self._load_memory_index()
        self.db = get_database()

    def _load_memory_index(self) -> Dict:
        """
        Load memory index from memory_index.json.

        Returns:
            Memory index dictionary
        """
        if not MEMORY_INDEX_FILE.exists():
            print(f"[MEMORY_MANAGER] No memory_index.json found, creating empty index")
            return {
                'files': [],
                'last_updated': datetime.now().isoformat(),
                'total_size': 0
            }

        try:
            with open(MEMORY_INDEX_FILE, 'r', encoding='utf-8') as f:
                index = json.load(f)
                print(f"[MEMORY_MANAGER] Loaded memory index with {len(index.get('files', []))} files")
                return index
        except Exception as e:
            print(f"[MEMORY_MANAGER] Error loading memory_index.json: {e}")
            return {
                'files': [],
                'last_updated': datetime.now().isoformat(),
                'total_size': 0
            }

    def _save_memory_index(self):
        """Save memory index to memory_index.json."""
        try:
            MEMORY_INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
            self.memory_index['last_updated'] = datetime.now().isoformat()

            with open(MEMORY_INDEX_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.memory_index, f, indent=2)

            print(f"[MEMORY_MANAGER] Saved memory index with {len(self.memory_index.get('files', []))} files")
        except Exception as e:
            print(f"[MEMORY_MANAGER] Error saving memory_index.json: {e}")

    def _scan_directory(self, directory: Path, base_path: Path = None) -> List[Dict]:
        """
        Recursively scan a directory and build file list.

        Args:
            directory: Directory to scan
            base_path: Base path for relative paths

        Returns:
            List of file information dictionaries
        """
        if base_path is None:
            base_path = directory

        files = []

        try:
            if not directory.exists():
                print(f"[MEMORY_MANAGER] Directory does not exist: {directory}")
                return files

            for item in directory.iterdir():
                try:
                    # Skip hidden files and directories
                    if item.name.startswith('.'):
                        continue

                    relative_path = item.relative_to(base_path)

                    if item.is_file():
                        # Get file stats
                        stats = item.stat()

                        files.append({
                            'name': item.name,
                            'path': str(relative_path),
                            'full_path': str(item),
                            'size': stats.st_size,
                            'modified': datetime.fromtimestamp(stats.st_mtime).isoformat(),
                            'type': 'file',
                            'extension': item.suffix
                        })

                    elif item.is_dir():
                        # Recursively scan subdirectory
                        subfiles = self._scan_directory(item, base_path)
                        files.extend(subfiles)

                except Exception as e:
                    print(f"[MEMORY_MANAGER] Error processing {item}: {e}")
                    continue

        except Exception as e:
            print(f"[MEMORY_MANAGER] Error scanning directory {directory}: {e}")

        return files

    def _build_tree_structure(self, files: List[Dict]) -> Dict:
        """
        Build hierarchical tree structure from flat file list.

        Args:
            files: List of file dictionaries

        Returns:
            Tree structure dictionary
        """
        tree = {
            'name': 'root',
            'type': 'directory',
            'children': [],
            'size': 0
        }

        def add_to_tree(node: Dict, path_parts: List[str], file_info: Dict):
            """Recursively add file to tree."""
            if len(path_parts) == 0:
                return

            current_part = path_parts[0]
            remaining_parts = path_parts[1:]

            # Find or create child node
            child = next(
                (c for c in node['children'] if c['name'] == current_part),
                None
            )

            if child is None:
                child = {
                    'name': current_part,
                    'type': 'directory' if len(remaining_parts) > 0 else 'file',
                    'children': [] if len(remaining_parts) > 0 else None,
                    'size': 0
                }
                node['children'].append(child)

            # If this is a file (no remaining parts)
            if len(remaining_parts) == 0:
                child.update({
                    'size': file_info['size'],
                    'modified': file_info['modified'],
                    'full_path': file_info['full_path'],
                    'extension': file_info.get('extension', '')
                })
                node['size'] += file_info['size']
            else:
                # Continue recursively
                add_to_tree(child, remaining_parts, file_info)
                node['size'] += file_info['size']

        # Build tree from files
        for file_info in files:
            path_parts = Path(file_info['path']).parts
            add_to_tree(tree, path_parts, file_info)

        return tree

    def sync_memory(self) -> Dict:
        """
        Synchronize memory index by scanning the memory directory.

        Returns:
            Synchronization result dictionary
        """
        print(f"[MEMORY_MANAGER] Starting memory sync...")

        try:
            # Scan memory directory
            memory_path = Path(MEMORY_DIR)
            files = self._scan_directory(memory_path, memory_path)

            # Calculate total size
            total_size = sum(f['size'] for f in files)

            # Update memory index
            self.memory_index = {
                'files': files,
                'last_updated': datetime.now().isoformat(),
                'total_size': total_size,
                'file_count': len(files)
            }

            # Save to disk
            self._save_memory_index()

            # Record sync to database
            self.db.record_sync(
                sync_type='memory',
                status='success',
                files_synced=len(files),
                details={'total_size': total_size}
            )

            result = {
                'success': True,
                'message': f'Memory synced successfully: {len(files)} files, {self._format_size(total_size)}',
                'files_synced': len(files),
                'total_size': total_size
            }

            print(f"[MEMORY_MANAGER] {result['message']}")
            return result

        except Exception as e:
            error_msg = f'Memory sync failed: {str(e)}'
            print(f"[MEMORY_MANAGER] {error_msg}")

            # Record error to database
            self.db.record_sync(
                sync_type='memory',
                status='failed',
                files_synced=0,
                details={'error': str(e)}
            )

            return {
                'success': False,
                'message': error_msg
            }

    def get_memory_tree(self) -> Dict:
        """
        Get memory tree structure.

        Returns:
            Tree structure dictionary
        """
        files = self.memory_index.get('files', [])
        tree = self._build_tree_structure(files)

        return {
            'tree': tree,
            'stats': {
                'total_files': len(files),
                'total_size': self.memory_index.get('total_size', 0),
                'last_updated': self.memory_index.get('last_updated', 'Never')
            }
        }

    def get_memory_stats(self) -> Dict:
        """
        Get memory statistics.

        Returns:
            Statistics dictionary
        """
        files = self.memory_index.get('files', [])
        total_size = self.memory_index.get('total_size', 0)

        # Group by extension
        extensions = {}
        for file in files:
            ext = file.get('extension', 'none')
            if ext not in extensions:
                extensions[ext] = {'count': 0, 'size': 0}
            extensions[ext]['count'] += 1
            extensions[ext]['size'] += file.get('size', 0)

        return {
            'total_files': len(files),
            'total_size': total_size,
            'total_size_formatted': self._format_size(total_size),
            'last_updated': self.memory_index.get('last_updated', 'Never'),
            'extensions': extensions,
            'memory_path': str(MEMORY_DIR)
        }

    def search_memory(self, query: str) -> List[Dict]:
        """
        Search memory files by name or path.

        Args:
            query: Search query

        Returns:
            List of matching files
        """
        files = self.memory_index.get('files', [])
        query_lower = query.lower()

        matches = [
            f for f in files
            if query_lower in f['name'].lower() or query_lower in f['path'].lower()
        ]

        return matches

    @staticmethod
    def _format_size(size_bytes: int) -> str:
        """
        Format size in bytes to human-readable format.

        Args:
            size_bytes: Size in bytes

        Returns:
            Formatted string (e.g., "1.5 MB")
        """
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} PB"


# Global memory manager instance
_memory_manager = None


def get_memory_manager() -> MemoryManager:
    """
    Get global memory manager instance (singleton pattern).

    Returns:
        MemoryManager instance
    """
    global _memory_manager
    if _memory_manager is None:
        _memory_manager = MemoryManager()
    return _memory_manager


if __name__ == "__main__":
    # Test memory manager
    manager = MemoryManager()
    print("Memory Manager initialized successfully!")
    stats = manager.get_memory_stats()
    print(f"Memory stats: {stats}")
