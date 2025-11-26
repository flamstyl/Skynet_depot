"""
NoteVault MCP — Note Manager
CRUD operations + metadata + search + indexing

Features:
- Create, Read, Update, Delete notes
- Auto-generated titles, timestamps, IDs
- Tag management
- Search and filtering
- Index management (vault_index.json)
"""

import uuid
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path


class Note:
    """Represents a single note in the vault."""

    def __init__(
        self,
        title: str = "",
        content: str = "",
        tags: List[str] = None,
        note_id: str = None,
        metadata: Dict[str, Any] = None
    ):
        self.id = note_id or str(uuid.uuid4())
        self.title = title or self._generate_title(content)
        self.content = content
        self.tags = tags or []
        self.created_at = datetime.utcnow().isoformat() + "Z"
        self.updated_at = self.created_at
        self.metadata = metadata or {}

    def _generate_title(self, content: str) -> str:
        """Generate title from content (first line or timestamp)."""
        if not content:
            return f"Untitled Note ({datetime.utcnow().strftime('%Y-%m-%d %H:%M')})"

        # Extract first line
        first_line = content.strip().split('\n')[0]

        # Remove markdown heading
        if first_line.startswith('#'):
            first_line = first_line.lstrip('#').strip()

        # Limit length
        title = first_line[:100]
        if len(first_line) > 100:
            title += "..."

        return title or f"Untitled Note ({datetime.utcnow().strftime('%Y-%m-%d %H:%M')})"

    def to_dict(self) -> Dict[str, Any]:
        """Convert note to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "tags": self.tags,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Note':
        """Create note from dictionary."""
        note = cls(
            title=data.get("title", ""),
            content=data.get("content", ""),
            tags=data.get("tags", []),
            note_id=data.get("id"),
            metadata=data.get("metadata", {})
        )
        note.created_at = data.get("created_at", note.created_at)
        note.updated_at = data.get("updated_at", note.updated_at)
        return note

    def update(self, **kwargs):
        """Update note fields."""
        if "title" in kwargs:
            self.title = kwargs["title"]
        if "content" in kwargs:
            self.content = kwargs["content"]
            # Regenerate title if empty
            if not self.title:
                self.title = self._generate_title(self.content)
        if "tags" in kwargs:
            self.tags = kwargs["tags"]
        if "metadata" in kwargs:
            self.metadata.update(kwargs["metadata"])

        self.updated_at = datetime.utcnow().isoformat() + "Z"


class NoteManager:
    """
    Manages notes in memory and on disk.
    Handles CRUD operations, search, indexing.
    """

    def __init__(self, vault_dir: str = "./vault"):
        self.vault_dir = Path(vault_dir)
        self.vault_dir.mkdir(parents=True, exist_ok=True)

        self.index_path = self.vault_dir / "vault_index.json"
        self.notes: Dict[str, Note] = {}

        # Load existing index
        self.load_index()

    def create_note(
        self,
        title: str = "",
        content: str = "",
        tags: List[str] = None,
        metadata: Dict[str, Any] = None
    ) -> Note:
        """
        Create a new note.

        Args:
            title: Note title (auto-generated if empty)
            content: Note content (Markdown)
            tags: List of tags
            metadata: Additional metadata

        Returns:
            Created note
        """
        note = Note(
            title=title,
            content=content,
            tags=tags or [],
            metadata=metadata or {}
        )

        self.notes[note.id] = note
        self.save_index()

        return note

    def get_note(self, note_id: str) -> Optional[Note]:
        """Get note by ID."""
        return self.notes.get(note_id)

    def update_note(self, note_id: str, **kwargs) -> Optional[Note]:
        """
        Update note.

        Args:
            note_id: Note ID
            **kwargs: Fields to update (title, content, tags, metadata)

        Returns:
            Updated note or None if not found
        """
        note = self.notes.get(note_id)
        if not note:
            return None

        note.update(**kwargs)
        self.save_index()

        return note

    def delete_note(self, note_id: str) -> bool:
        """
        Delete note.

        Args:
            note_id: Note ID

        Returns:
            True if deleted, False if not found
        """
        if note_id in self.notes:
            del self.notes[note_id]
            self.save_index()
            return True
        return False

    def get_all_notes(self) -> List[Note]:
        """Get all notes."""
        return list(self.notes.values())

    def search_notes(
        self,
        query: str = "",
        tags: List[str] = None,
        date_from: str = None,
        date_to: str = None
    ) -> List[Note]:
        """
        Search notes by query, tags, date range.

        Args:
            query: Search query (title/content)
            tags: Filter by tags
            date_from: Start date (ISO format)
            date_to: End date (ISO format)

        Returns:
            List of matching notes
        """
        results = []

        for note in self.notes.values():
            # Query match (case-insensitive)
            if query:
                query_lower = query.lower()
                if query_lower not in note.title.lower() and \
                   query_lower not in note.content.lower():
                    continue

            # Tag filter
            if tags:
                if not any(tag in note.tags for tag in tags):
                    continue

            # Date range
            if date_from and note.created_at < date_from:
                continue
            if date_to and note.created_at > date_to:
                continue

            results.append(note)

        # Sort by updated_at (most recent first)
        results.sort(key=lambda n: n.updated_at, reverse=True)

        return results

    def get_all_tags(self) -> Dict[str, int]:
        """
        Get all tags with counts.

        Returns:
            {tag: count}
        """
        tag_counts = {}
        for note in self.notes.values():
            for tag in note.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

        return dict(sorted(tag_counts.items(), key=lambda x: x[1], reverse=True))

    def save_index(self):
        """Save vault index to disk."""
        index_data = {
            "version": "1.0",
            "notes": [
                {
                    "id": note.id,
                    "title": note.title,
                    "tags": note.tags,
                    "created_at": note.created_at,
                    "updated_at": note.updated_at,
                    "summary": note.metadata.get("ai_summary", "")[:200]
                }
                for note in self.notes.values()
            ],
            "tags": self.get_all_tags(),
            "total_notes": len(self.notes)
        }

        with open(self.index_path, 'w', encoding='utf-8') as f:
            json.dump(index_data, f, indent=2, ensure_ascii=False)

    def load_index(self):
        """Load vault index from disk (metadata only, not full notes)."""
        if not self.index_path.exists():
            return

        try:
            with open(self.index_path, 'r', encoding='utf-8') as f:
                index_data = json.load(f)

            # Note: This only loads metadata from index
            # Full notes are loaded from encrypted vault
            # For now, we just track that index exists
            print(f"📇 Index loaded: {index_data.get('total_notes', 0)} notes")

        except Exception as e:
            print(f"⚠️ Error loading index: {e}")

    def load_notes_from_vault(self, notes_data: List[Dict[str, Any]]):
        """
        Load notes from decrypted vault data.

        Args:
            notes_data: List of note dictionaries
        """
        self.notes.clear()

        for note_dict in notes_data:
            note = Note.from_dict(note_dict)
            self.notes[note.id] = note

        self.save_index()
        print(f"📚 Loaded {len(self.notes)} notes from vault")

    def export_notes_to_vault(self) -> List[Dict[str, Any]]:
        """
        Export all notes for vault encryption.

        Returns:
            List of note dictionaries
        """
        return [note.to_dict() for note in self.notes.values()]

    def add_ai_summary(self, note_id: str, summary: str):
        """Add AI-generated summary to note metadata."""
        note = self.get_note(note_id)
        if note:
            note.metadata["ai_summary"] = summary
            note.updated_at = datetime.utcnow().isoformat() + "Z"
            self.save_index()

    def add_ai_themes(self, note_id: str, themes: List[str]):
        """Add AI-detected themes to note metadata."""
        note = self.get_note(note_id)
        if note:
            note.metadata["themes"] = themes
            note.updated_at = datetime.utcnow().isoformat() + "Z"
            self.save_index()

    def add_note_links(self, note_id: str, linked_note_ids: List[str]):
        """Add links to related notes."""
        note = self.get_note(note_id)
        if note:
            note.metadata["links"] = linked_note_ids
            note.updated_at = datetime.utcnow().isoformat() + "Z"
            self.save_index()

    def get_stats(self) -> Dict[str, Any]:
        """Get vault statistics."""
        if not self.notes:
            return {
                "total_notes": 0,
                "total_tags": 0,
                "avg_note_length": 0,
                "most_used_tags": []
            }

        total_chars = sum(len(note.content) for note in self.notes.values())
        avg_length = total_chars / len(self.notes)

        tags = self.get_all_tags()
        most_used = sorted(tags.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "total_notes": len(self.notes),
            "total_tags": len(tags),
            "avg_note_length": int(avg_length),
            "most_used_tags": [{"tag": tag, "count": count} for tag, count in most_used]
        }


if __name__ == "__main__":
    # Demo usage
    print("📝 NoteVault Note Manager — Demo")
    print("=" * 50)

    manager = NoteManager(vault_dir="./vault")

    # Create notes
    print("\n✍️ Creating notes...")
    note1 = manager.create_note(
        content="# My First Note\n\nThis is a test note about **Skynet**.",
        tags=["skynet", "test"]
    )
    print(f"  ✅ Created: {note1.title}")

    note2 = manager.create_note(
        title="Encrypted Notes",
        content="Notes should be encrypted with AES-256-GCM.",
        tags=["security", "crypto"]
    )
    print(f"  ✅ Created: {note2.title}")

    note3 = manager.create_note(
        content="# AI Integration\n\nUse Claude for summarization.",
        tags=["ai", "skynet"]
    )
    print(f"  ✅ Created: {note3.title}")

    # Search
    print("\n🔍 Searching for 'skynet'...")
    results = manager.search_notes(query="skynet")
    print(f"  Found {len(results)} notes:")
    for note in results:
        print(f"    - {note.title}")

    # Filter by tag
    print("\n🏷️ Filtering by tag 'ai'...")
    results = manager.search_notes(tags=["ai"])
    print(f"  Found {len(results)} notes")

    # Get all tags
    print("\n📊 All tags:")
    tags = manager.get_all_tags()
    for tag, count in tags.items():
        print(f"  - {tag}: {count}")

    # Update note
    print(f"\n✏️ Updating note {note1.id}...")
    manager.update_note(note1.id, content=note1.content + "\n\nUpdated content!")
    print("  ✅ Updated")

    # Stats
    print("\n📈 Vault stats:")
    stats = manager.get_stats()
    print(f"  Total notes: {stats['total_notes']}")
    print(f"  Total tags: {stats['total_tags']}")
    print(f"  Avg note length: {stats['avg_note_length']} chars")

    # Export for vault
    print("\n💾 Exporting notes for encryption...")
    notes_data = manager.export_notes_to_vault()
    print(f"  ✅ Exported {len(notes_data)} notes")

    print("\n🎉 Note Manager working perfectly!")
