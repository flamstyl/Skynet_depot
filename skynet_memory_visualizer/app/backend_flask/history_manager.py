"""
History Manager - Manages document version history
"""

import json
import shutil
from pathlib import Path
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class HistoryManager:
    def __init__(self, config):
        self.config = config
        self.history_path = Path(config['paths']['history'])
        self.versions_path = self.history_path / 'versions'
        self.versions_path.mkdir(parents=True, exist_ok=True)

        self.history_index = {}
        self._load_history_index()

    def _load_history_index(self):
        """Load history index"""
        index_file = self.history_path / 'history_index.json'

        try:
            if index_file.exists():
                with open(index_file, 'r') as f:
                    self.history_index = json.load(f)
                logger.info(f"Loaded history for {len(self.history_index)} documents")
        except Exception as e:
            logger.error(f"Failed to load history index: {e}")
            self.history_index = {}

    def _save_history_index(self):
        """Save history index"""
        index_file = self.history_path / 'history_index.json'

        try:
            with open(index_file, 'w') as f:
                json.dump(self.history_index, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save history index: {e}")
            raise

    def create_version(self, doc_path, content, summary=None):
        """Create a new version of a document"""
        try:
            # Generate version ID
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            doc_id = self._path_to_id(doc_path)
            version_id = f"v_{timestamp}"

            # Save version file
            version_file = self.versions_path / f"{doc_id}_{version_id}.txt"
            with open(version_file, 'w', encoding='utf-8') as f:
                f.write(content)

            # Update history index
            if doc_id not in self.history_index:
                self.history_index[doc_id] = {
                    'path': doc_path,
                    'versions': []
                }

            version_entry = {
                'version_id': version_id,
                'timestamp': datetime.now().isoformat(),
                'summary': summary or 'Document modified',
                'file': str(version_file.name),
                'size': len(content)
            }

            self.history_index[doc_id]['versions'].append(version_entry)

            # Cleanup old versions if needed
            max_versions = self.config.get('versioning', {}).get('max_versions', 50)
            if len(self.history_index[doc_id]['versions']) > max_versions:
                self._cleanup_old_versions(doc_id, max_versions)

            self._save_history_index()

            logger.info(f"Created version {version_id} for {doc_path}")

            return {'success': True, 'version_id': version_id}

        except Exception as e:
            logger.error(f"Failed to create version: {e}")
            raise

    def get_versions(self, doc_path):
        """Get all versions for a document"""
        doc_id = self._path_to_id(doc_path)

        if doc_id not in self.history_index:
            return []

        versions = self.history_index[doc_id]['versions']

        # Add diff stats if available
        for i, version in enumerate(versions):
            if i > 0:
                # Calculate diff stats with previous version
                prev_version = versions[i - 1]
                version['diff_stats'] = self._calculate_diff_stats(
                    prev_version['file'],
                    version['file']
                )

        return versions

    def get_version(self, doc_path, version_id):
        """Get a specific version"""
        doc_id = self._path_to_id(doc_path)

        if doc_id not in self.history_index:
            raise FileNotFoundError(f"No history found for {doc_path}")

        # Find version
        version_entry = None
        for v in self.history_index[doc_id]['versions']:
            if v['version_id'] == version_id:
                version_entry = v
                break

        if not version_entry:
            raise FileNotFoundError(f"Version {version_id} not found")

        # Load version content
        version_file = self.versions_path / version_entry['file']

        with open(version_file, 'r', encoding='utf-8') as f:
            content = f.read()

        return {
            'version_id': version_id,
            'timestamp': version_entry['timestamp'],
            'summary': version_entry['summary'],
            'content': content,
            'size': version_entry['size']
        }

    def restore_version(self, doc_path, version_id):
        """Restore a previous version"""
        try:
            # Get the version content
            version = self.get_version(doc_path, version_id)

            # This will be handled by the file_manager
            # Just return the content
            return {
                'success': True,
                'content': version['content'],
                'version_id': version_id
            }

        except Exception as e:
            logger.error(f"Failed to restore version: {e}")
            raise

    def get_timeline(self, limit=20):
        """Get recent activity timeline"""
        events = []

        for doc_id, doc_history in self.history_index.items():
            for version in doc_history['versions']:
                events.append({
                    'type': 'modified',
                    'doc_path': doc_history['path'],
                    'timestamp': version['timestamp'],
                    'description': version['summary'],
                    'version_id': version['version_id']
                })

        # Sort by timestamp (newest first)
        events.sort(key=lambda x: x['timestamp'], reverse=True)

        return events[:limit]

    def count_recent_edits(self, hours=24):
        """Count edits in the last N hours"""
        cutoff = datetime.now() - timedelta(hours=hours)
        count = 0

        for doc_history in self.history_index.values():
            for version in doc_history['versions']:
                timestamp = datetime.fromisoformat(version['timestamp'])
                if timestamp > cutoff:
                    count += 1

        return count

    def _cleanup_old_versions(self, doc_id, max_versions):
        """Remove old versions beyond the limit"""
        versions = self.history_index[doc_id]['versions']

        while len(versions) > max_versions:
            # Remove oldest version
            old_version = versions.pop(0)
            version_file = self.versions_path / old_version['file']

            if version_file.exists():
                version_file.unlink()

            logger.info(f"Cleaned up old version: {old_version['version_id']}")

    def _calculate_diff_stats(self, file1, file2):
        """Calculate diff statistics between two versions"""
        try:
            path1 = self.versions_path / file1
            path2 = self.versions_path / file2

            with open(path1, 'r') as f:
                lines1 = f.readlines()

            with open(path2, 'r') as f:
                lines2 = f.readlines()

            # Simple line diff
            added = len(lines2) - len(lines1)
            removed = -added if added < 0 else 0
            added = added if added > 0 else 0

            return {
                'lines_added': added,
                'lines_removed': removed,
                'lines_changed': min(added, removed)
            }

        except Exception as e:
            logger.error(f"Failed to calculate diff stats: {e}")
            return {
                'lines_added': 0,
                'lines_removed': 0,
                'lines_changed': 0
            }

    def _path_to_id(self, path):
        """Convert file path to document ID"""
        return path.replace('/', '_').replace('\\', '_').replace('.', '_')
