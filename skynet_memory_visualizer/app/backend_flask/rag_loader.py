"""
RAG Loader - Manages RAG index loading, searching, and metadata
"""

import json
import os
from pathlib import Path
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RAGLoader:
    def __init__(self, config):
        self.config = config
        self.index_path = Path(config['paths']['rag_index'])
        self.docs_path = Path(config['paths']['docs'])

        self.embeddings = {}
        self.metadata = {}

        self._load_index()

    def _load_index(self):
        """Load RAG index from disk"""
        try:
            embeddings_file = self.index_path / 'embeddings.json'
            metadata_file = self.index_path / 'metadata.json'

            if embeddings_file.exists():
                with open(embeddings_file, 'r') as f:
                    self.embeddings = json.load(f)
                logger.info(f"Loaded {len(self.embeddings)} embeddings")

            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    self.metadata = json.load(f)
                logger.info(f"Loaded metadata for {len(self.metadata)} documents")

        except Exception as e:
            logger.error(f"Failed to load RAG index: {e}")
            self.embeddings = {}
            self.metadata = {}

    def _save_index(self):
        """Save RAG index to disk"""
        try:
            self.index_path.mkdir(parents=True, exist_ok=True)

            with open(self.index_path / 'embeddings.json', 'w') as f:
                json.dump(self.embeddings, f, indent=2)

            with open(self.index_path / 'metadata.json', 'w') as f:
                json.dump(self.metadata, f, indent=2)

            logger.info("RAG index saved successfully")

        except Exception as e:
            logger.error(f"Failed to save RAG index: {e}")
            raise

    def search(self, query, top_k=10):
        """
        Search documents using RAG
        TODO: Implement actual semantic search with embeddings
        For now, simple keyword search
        """
        results = []

        for doc_id, meta in self.metadata.items():
            score = 0

            # Simple keyword matching
            query_lower = query.lower()
            if query_lower in meta.get('title', '').lower():
                score += 10
            if query_lower in meta.get('summary', '').lower():
                score += 5
            if any(query_lower in tag.lower() for tag in meta.get('tags', [])):
                score += 3

            if score > 0:
                results.append({
                    'doc_id': doc_id,
                    'title': meta.get('title', doc_id),
                    'snippet': meta.get('summary', '')[:200],
                    'path': meta.get('path', ''),
                    'score': score,
                    'tags': meta.get('tags', [])
                })

        # Sort by score
        results.sort(key=lambda x: x['score'], reverse=True)

        return results[:top_k]

    def get_metadata(self, doc_path):
        """Get metadata for a document"""
        doc_id = self._path_to_id(doc_path)
        return self.metadata.get(doc_id, {})

    def save_metadata(self, doc_path, metadata):
        """Save metadata for a document"""
        doc_id = self._path_to_id(doc_path)

        # Merge with existing metadata
        existing = self.metadata.get(doc_id, {})
        existing.update(metadata)
        existing['modified'] = datetime.now().isoformat()
        existing['path'] = doc_path

        self.metadata[doc_id] = existing
        self._save_index()

        return {'success': True, 'doc_id': doc_id}

    def update_document(self, doc_path, content):
        """
        Update document in RAG index
        TODO: Generate embeddings for the document
        """
        doc_id = self._path_to_id(doc_path)

        # Update metadata
        if doc_id not in self.metadata:
            self.metadata[doc_id] = {}

        self.metadata[doc_id].update({
            'path': doc_path,
            'modified': datetime.now().isoformat(),
            'size': len(content)
        })

        # TODO: Generate and store embeddings
        # For now, just update metadata
        self._save_index()

        logger.info(f"Updated document in RAG index: {doc_path}")
        return {'success': True}

    def remove_document(self, doc_path):
        """Remove document from RAG index"""
        doc_id = self._path_to_id(doc_path)

        if doc_id in self.metadata:
            del self.metadata[doc_id]

        if doc_id in self.embeddings:
            del self.embeddings[doc_id]

        self._save_index()

        logger.info(f"Removed document from RAG index: {doc_path}")
        return {'success': True}

    def rename_document(self, old_path, new_path):
        """Rename document in RAG index"""
        old_id = self._path_to_id(old_path)
        new_id = self._path_to_id(new_path)

        if old_id in self.metadata:
            self.metadata[new_id] = self.metadata.pop(old_id)
            self.metadata[new_id]['path'] = new_path

        if old_id in self.embeddings:
            self.embeddings[new_id] = self.embeddings.pop(old_id)

        self._save_index()

        return {'success': True}

    def get_index_size(self):
        """Get RAG index size in bytes"""
        size = 0
        try:
            for file in self.index_path.glob('*.json'):
                size += file.stat().st_size
        except Exception as e:
            logger.error(f"Failed to get index size: {e}")
        return size

    def refresh_index(self):
        """
        Refresh entire RAG index
        TODO: Re-generate embeddings for all documents
        """
        logger.info("Refreshing RAG index...")

        # Scan all documents
        doc_count = 0
        for doc_file in self.docs_path.rglob('*'):
            if doc_file.is_file() and doc_file.suffix in ['.md', '.txt', '.json']:
                doc_path = str(doc_file.relative_to(self.docs_path.parent))
                doc_id = self._path_to_id(doc_path)

                if doc_id not in self.metadata:
                    self.metadata[doc_id] = {
                        'path': doc_path,
                        'created': datetime.fromtimestamp(doc_file.stat().st_ctime).isoformat(),
                        'modified': datetime.fromtimestamp(doc_file.stat().st_mtime).isoformat(),
                        'size': doc_file.stat().st_size
                    }
                    doc_count += 1

        self._save_index()

        logger.info(f"RAG index refreshed. Added {doc_count} new documents.")
        return {'success': True, 'added': doc_count}

    def get_status(self):
        """Get RAG index status"""
        return {
            'total_documents': len(self.metadata),
            'total_embeddings': len(self.embeddings),
            'index_size': self.get_index_size(),
            'last_updated': datetime.now().isoformat()
        }

    def _path_to_id(self, path):
        """Convert file path to document ID"""
        return path.replace('/', '_').replace('\\', '_').replace('.', '_')
