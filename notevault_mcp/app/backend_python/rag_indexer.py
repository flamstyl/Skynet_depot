"""
NoteVault MCP — RAG Indexer
Semantic search + embeddings + indexing

Features:
- Local embeddings (mock for MVP, extensible to real models)
- Semantic search by similarity
- Index persistence
- Backup/restore
"""

import json
import math
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime


class RAGIndexer:
    """
    Manages semantic indexing for notes.
    Uses embeddings for similarity search.

    MVP: Simple TF-IDF / keyword-based search
    Production: Integrate sentence-transformers or OpenAI embeddings
    """

    def __init__(self, index_dir: str = "./data/rag_index"):
        self.index_dir = Path(index_dir)
        self.index_dir.mkdir(parents=True, exist_ok=True)

        self.index_path = self.index_dir / "rag_index.json"
        self.index: Dict[str, Dict[str, Any]] = {}

        # Load existing index
        self.load_index()

    def index_note(self, note: Dict[str, Any]) -> bool:
        """
        Index a note for semantic search.

        Args:
            note: Note dictionary with id, title, content, tags

        Returns:
            True if indexed successfully
        """
        note_id = note.get("id")
        if not note_id:
            return False

        # Generate embedding (mock for now)
        embedding = self._generate_embedding(note)

        # Extract summary
        summary = note.get("metadata", {}).get("ai_summary") or self._extract_summary(note["content"])

        # Store in index
        self.index[note_id] = {
            "embedding": embedding,
            "title": note.get("title", ""),
            "summary": summary,
            "tags": note.get("tags", []),
            "indexed_at": datetime.utcnow().isoformat() + "Z"
        }

        self.save_index()
        return True

    def search_similar(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """
        Search for notes similar to query.

        Args:
            query: Search query
            top_k: Number of results to return

        Returns:
            List of (note_id, similarity_score) tuples, sorted by score
        """
        # Generate query embedding
        query_embedding = self._generate_embedding({"content": query})

        # Compute similarities
        similarities = []
        for note_id, note_data in self.index.items():
            note_embedding = note_data["embedding"]
            similarity = self._cosine_similarity(query_embedding, note_embedding)
            similarities.append((note_id, similarity))

        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)

        return similarities[:top_k]

    def update_index(self, note_id: str, note: Dict[str, Any]) -> bool:
        """
        Update index for existing note.

        Args:
            note_id: Note ID
            note: Updated note data

        Returns:
            True if updated
        """
        return self.index_note(note)

    def remove_from_index(self, note_id: str) -> bool:
        """Remove note from index."""
        if note_id in self.index:
            del self.index[note_id]
            self.save_index()
            return True
        return False

    def get_index_stats(self) -> Dict[str, Any]:
        """Get RAG index statistics."""
        return {
            "total_indexed": len(self.index),
            "index_size_kb": self.index_path.stat().st_size // 1024 if self.index_path.exists() else 0,
            "last_updated": max(
                (data["indexed_at"] for data in self.index.values()),
                default=None
            )
        }

    def save_index(self):
        """Save index to disk."""
        index_data = {
            "version": "1.0",
            "notes": self.index
        }

        with open(self.index_path, 'w', encoding='utf-8') as f:
            json.dump(index_data, f, indent=2, ensure_ascii=False)

    def load_index(self):
        """Load index from disk."""
        if not self.index_path.exists():
            return

        try:
            with open(self.index_path, 'r', encoding='utf-8') as f:
                index_data = json.load(f)

            self.index = index_data.get("notes", {})
            print(f"🔍 RAG Index loaded: {len(self.index)} notes indexed")

        except Exception as e:
            print(f"⚠️ Error loading RAG index: {e}")
            self.index = {}

    def backup_index(self) -> bytes:
        """
        Create backup of RAG index.

        Returns:
            Index data as JSON bytes
        """
        index_data = {
            "version": "1.0",
            "backup_date": datetime.utcnow().isoformat() + "Z",
            "notes": self.index
        }

        return json.dumps(index_data, ensure_ascii=False).encode('utf-8')

    def restore_index(self, backup: bytes) -> bool:
        """
        Restore index from backup.

        Args:
            backup: Backup data (JSON bytes)

        Returns:
            True if restored successfully
        """
        try:
            index_data = json.loads(backup.decode('utf-8'))
            self.index = index_data.get("notes", {})
            self.save_index()
            print(f"✅ RAG Index restored: {len(self.index)} notes")
            return True

        except Exception as e:
            print(f"❌ Failed to restore index: {e}")
            return False

    # Private helper methods

    def _generate_embedding(self, note: Dict[str, Any]) -> List[float]:
        """
        Generate embedding for note.

        MVP: Simple keyword-based vector (TF-IDF-like)
        Production: Use sentence-transformers or OpenAI embeddings

        TODO: Replace with real embeddings
        """
        # Extract text
        text = f"{note.get('title', '')} {note.get('content', '')} {' '.join(note.get('tags', []))}"
        text = text.lower()

        # Simple keyword extraction (mock embedding)
        keywords = self._extract_keywords(text)

        # Create simple vector (100 dimensions)
        # Each dimension represents presence of common words
        vector = [0.0] * 100

        # Hash keywords to dimensions
        for keyword in keywords:
            idx = hash(keyword) % 100
            vector[idx] += 1.0

        # Normalize
        magnitude = math.sqrt(sum(x * x for x in vector))
        if magnitude > 0:
            vector = [x / magnitude for x in vector]

        return vector

    def _extract_keywords(self, text: str, max_keywords: int = 20) -> List[str]:
        """
        Extract keywords from text.

        Simple version: split on whitespace, remove stopwords.
        Production: Use NLTK, spaCy, or similar.
        """
        # Basic stopwords
        stopwords = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
            "been", "being", "have", "has", "had", "do", "does", "did", "will",
            "would", "should", "could", "may", "might", "can", "this", "that",
            "these", "those", "i", "you", "he", "she", "it", "we", "they"
        }

        # Extract words
        words = text.split()

        # Filter
        keywords = [
            word.strip('.,!?;:()[]{}')
            for word in words
            if len(word) > 2 and word not in stopwords
        ]

        # Count frequency
        keyword_freq = {}
        for keyword in keywords:
            keyword_freq[keyword] = keyword_freq.get(keyword, 0) + 1

        # Sort by frequency
        sorted_keywords = sorted(keyword_freq.items(), key=lambda x: x[1], reverse=True)

        return [kw for kw, _ in sorted_keywords[:max_keywords]]

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.

        Returns:
            Similarity score (0 to 1)
        """
        if len(vec1) != len(vec2):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = math.sqrt(sum(a * a for a in vec1))
        magnitude2 = math.sqrt(sum(b * b for b in vec2))

        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0

        return dot_product / (magnitude1 * magnitude2)

    def _extract_summary(self, content: str, max_length: int = 200) -> str:
        """Extract summary from content (first N chars)."""
        # Remove markdown headings
        lines = [line.lstrip('#').strip() for line in content.split('\n') if line.strip()]

        # Join and truncate
        summary = ' '.join(lines)[:max_length]

        if len(' '.join(lines)) > max_length:
            summary += "..."

        return summary


# Advanced RAG functions (for future integration)

def integrate_sentence_transformers():
    """
    TODO: Integrate sentence-transformers for real embeddings.

    Example:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('all-MiniLM-L6-v2')
        embedding = model.encode(text)
    """
    pass


def integrate_openai_embeddings():
    """
    TODO: Integrate OpenAI embeddings API.

    Example:
        import openai
        response = openai.Embedding.create(
            model="text-embedding-ada-002",
            input=text
        )
        embedding = response['data'][0]['embedding']
    """
    pass


if __name__ == "__main__":
    # Demo usage
    print("🔍 NoteVault RAG Indexer — Demo")
    print("=" * 50)

    indexer = RAGIndexer(index_dir="./data/rag_index")

    # Mock notes
    notes = [
        {
            "id": "note-1",
            "title": "Skynet Architecture",
            "content": "# Skynet\n\nSkynet is an AI system with multiple modules for automation.",
            "tags": ["skynet", "ai", "architecture"]
        },
        {
            "id": "note-2",
            "title": "Encryption Notes",
            "content": "# Encryption\n\nUse AES-256-GCM for secure encryption.",
            "tags": ["security", "crypto"]
        },
        {
            "id": "note-3",
            "title": "RAG Systems",
            "content": "# RAG\n\nRetrieval Augmented Generation uses embeddings for semantic search.",
            "tags": ["ai", "rag", "search"]
        }
    ]

    # Index notes
    print("\n📇 Indexing notes...")
    for note in notes:
        indexer.index_note(note)
        print(f"  ✅ Indexed: {note['title']}")

    # Search
    print("\n🔍 Searching for 'AI systems'...")
    results = indexer.search_similar("AI systems", top_k=3)

    print(f"\n📊 Results:")
    for note_id, score in results:
        note_data = indexer.index[note_id]
        print(f"  {score:.3f} - {note_data['title']}")
        print(f"         Tags: {note_data['tags']}")

    # Stats
    print("\n📈 Index stats:")
    stats = indexer.get_index_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")

    # Backup
    print("\n💾 Creating backup...")
    backup = indexer.backup_index()
    print(f"  ✅ Backup created: {len(backup)} bytes")

    print("\n🎉 RAG Indexer working perfectly!")
