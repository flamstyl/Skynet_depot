"""
File Manager - Handles file operations (CRUD)
"""

import os
import shutil
from pathlib import Path
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class FileManager:
    def __init__(self, config):
        self.config = config
        self.docs_path = Path(config['paths']['docs'])
        self.docs_path.mkdir(parents=True, exist_ok=True)

    def get_tree(self, root_path='/'):
        """Get file tree structure"""
        try:
            if root_path == '/':
                base_path = self.docs_path
            else:
                base_path = self.docs_path / root_path.lstrip('/')

            if not base_path.exists():
                return []

            return self._build_tree_node(base_path)

        except Exception as e:
            logger.error(f"Failed to get file tree: {e}")
            raise

    def _build_tree_node(self, path):
        """Recursively build tree structure"""
        result = []

        try:
            for item in sorted(path.iterdir()):
                relative_path = str(item.relative_to(self.docs_path.parent))

                node = {
                    'name': item.name,
                    'path': relative_path,
                    'type': 'directory' if item.is_dir() else 'file'
                }

                if item.is_file():
                    stats = item.stat()
                    node.update({
                        'size': stats.st_size,
                        'modified': datetime.fromtimestamp(stats.st_mtime).isoformat(),
                        'created': datetime.fromtimestamp(stats.st_ctime).isoformat()
                    })
                elif item.is_dir():
                    node['children'] = self._build_tree_node(item)

                result.append(node)

        except Exception as e:
            logger.error(f"Error building tree node: {e}")

        return result

    def load_document(self, doc_path):
        """Load a document"""
        try:
            full_path = self.docs_path.parent / doc_path.lstrip('/')

            if not full_path.exists():
                raise FileNotFoundError(f"Document not found: {doc_path}")

            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()

            stats = full_path.stat()

            return {
                'path': doc_path,
                'content': content,
                'size': stats.st_size,
                'modified': datetime.fromtimestamp(stats.st_mtime).isoformat(),
                'created': datetime.fromtimestamp(stats.st_ctime).isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to load document: {e}")
            raise

    def save_document(self, doc_path, content):
        """Save a document"""
        try:
            full_path = self.docs_path.parent / doc_path.lstrip('/')
            full_path.parent.mkdir(parents=True, exist_ok=True)

            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)

            logger.info(f"Saved document: {doc_path}")

            return {
                'success': True,
                'path': doc_path,
                'size': len(content),
                'modified': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to save document: {e}")
            raise

    def delete_document(self, doc_path):
        """Delete a document"""
        try:
            full_path = self.docs_path.parent / doc_path.lstrip('/')

            if not full_path.exists():
                raise FileNotFoundError(f"Document not found: {doc_path}")

            # Move to trash instead of permanent delete
            trash_path = Path(self.config['paths'].get('trash', './trash'))
            trash_path.mkdir(parents=True, exist_ok=True)

            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            trash_file = trash_path / f"{full_path.stem}_{timestamp}{full_path.suffix}"

            shutil.move(str(full_path), str(trash_file))

            logger.info(f"Moved to trash: {doc_path}")

            return {
                'success': True,
                'trash_path': str(trash_file)
            }

        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
            raise

    def rename_document(self, old_path, new_path):
        """Rename a document"""
        try:
            old_full = self.docs_path.parent / old_path.lstrip('/')
            new_full = self.docs_path.parent / new_path.lstrip('/')

            if not old_full.exists():
                raise FileNotFoundError(f"Document not found: {old_path}")

            if new_full.exists():
                raise FileExistsError(f"Document already exists: {new_path}")

            new_full.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(old_full), str(new_full))

            logger.info(f"Renamed: {old_path} → {new_path}")

            return {
                'success': True,
                'old_path': old_path,
                'new_path': new_path
            }

        except Exception as e:
            logger.error(f"Failed to rename document: {e}")
            raise

    def get_preview(self, doc_path, lines=5):
        """Get preview of a document (first N lines)"""
        try:
            full_path = self.docs_path.parent / doc_path.lstrip('/')

            if not full_path.exists():
                raise FileNotFoundError(f"Document not found: {doc_path}")

            with open(full_path, 'r', encoding='utf-8') as f:
                preview_lines = []
                for i, line in enumerate(f):
                    if i >= lines:
                        break
                    preview_lines.append(line.rstrip('\n'))

            return '\n'.join(preview_lines)

        except Exception as e:
            logger.error(f"Failed to get preview: {e}")
            raise

    def count_documents(self):
        """Count total documents"""
        count = 0
        try:
            for _ in self.docs_path.rglob('*'):
                if _.is_file():
                    count += 1
        except Exception as e:
            logger.error(f"Failed to count documents: {e}")
        return count
