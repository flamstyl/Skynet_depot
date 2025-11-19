"""
Tag Manager - Manages document tags
"""

import json
from pathlib import Path
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class TagManager:
    def __init__(self, config):
        self.config = config
        self.docs_path = Path(config['paths']['docs'])
        self.tags_file = self.docs_path.parent / 'data' / 'tags.json'

        self.tags = defaultdict(list)  # doc_path -> [tags]
        self.tag_index = defaultdict(set)  # tag -> {doc_paths}

        self._load_tags()

    def _load_tags(self):
        """Load tags from disk"""
        try:
            if self.tags_file.exists():
                with open(self.tags_file, 'r') as f:
                    data = json.load(f)
                    self.tags = defaultdict(list, data.get('tags', {}))

                    # Build reverse index
                    for doc_path, tags in self.tags.items():
                        for tag in tags:
                            self.tag_index[tag].add(doc_path)

                logger.info(f"Loaded tags for {len(self.tags)} documents")

        except Exception as e:
            logger.error(f"Failed to load tags: {e}")
            self.tags = defaultdict(list)
            self.tag_index = defaultdict(set)

    def _save_tags(self):
        """Save tags to disk"""
        try:
            self.tags_file.parent.mkdir(parents=True, exist_ok=True)

            data = {
                'tags': dict(self.tags),
                'last_updated': str(Path.ctime(self.tags_file) if self.tags_file.exists() else 'never')
            }

            with open(self.tags_file, 'w') as f:
                json.dump(data, f, indent=2)

            logger.info("Tags saved successfully")

        except Exception as e:
            logger.error(f"Failed to save tags: {e}")
            raise

    def get_tags(self, doc_path):
        """Get tags for a document"""
        return list(self.tags.get(doc_path, []))

    def add_tag(self, doc_path, tag):
        """Add a tag to a document"""
        tag = tag.strip().lower()

        if tag not in self.tags[doc_path]:
            self.tags[doc_path].append(tag)
            self.tag_index[tag].add(doc_path)
            self._save_tags()

            logger.info(f"Added tag '{tag}' to {doc_path}")

        return {'success': True, 'tag': tag, 'path': doc_path}

    def remove_tag(self, doc_path, tag):
        """Remove a tag from a document"""
        tag = tag.strip().lower()

        if tag in self.tags[doc_path]:
            self.tags[doc_path].remove(tag)
            self.tag_index[tag].discard(doc_path)

            # Clean up empty entries
            if not self.tags[doc_path]:
                del self.tags[doc_path]

            if not self.tag_index[tag]:
                del self.tag_index[tag]

            self._save_tags()

            logger.info(f"Removed tag '{tag}' from {doc_path}")

        return {'success': True, 'tag': tag, 'path': doc_path}

    def get_all_tags(self):
        """Get all tags with counts"""
        tag_counts = []

        for tag, doc_paths in self.tag_index.items():
            tag_counts.append({
                'tag': tag,
                'count': len(doc_paths)
            })

        tag_counts.sort(key=lambda x: x['count'], reverse=True)

        return tag_counts

    def filter_by_tag(self, tag):
        """Get all documents with a specific tag"""
        tag = tag.strip().lower()
        doc_paths = list(self.tag_index.get(tag, []))

        return [{'path': path, 'tags': self.get_tags(path)} for path in doc_paths]

    def count_tags(self):
        """Count total unique tags"""
        return len(self.tag_index)

    def suggest_tags_from_content(self, content):
        """
        Suggest tags based on content
        TODO: Use AI for better suggestions
        For now, simple keyword extraction
        """
        # Simple keyword extraction
        words = content.lower().split()
        word_freq = defaultdict(int)

        for word in words:
            # Filter out common words and short words
            if len(word) > 4 and word.isalpha():
                word_freq[word] += 1

        # Get top 5 most frequent words
        suggestions = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]

        return [word for word, count in suggestions]
