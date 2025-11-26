"""
Memory System - Short-term and long-term memory management
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime
from collections import deque
from dataclasses import dataclass, asdict

from rich.console import Console
from rich.table import Table
from rich.panel import Panel


@dataclass
class MemoryEntry:
    """Single memory entry"""

    key: str
    value: Any
    timestamp: datetime
    category: str = "general"
    metadata: Dict = None

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        data = asdict(self)
        data["timestamp"] = self.timestamp.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: Dict) -> "MemoryEntry":
        """Create from dictionary"""
        data["timestamp"] = datetime.fromisoformat(data["timestamp"])
        return cls(**data)


class MemorySystem:
    """Manages short-term and long-term memory for Grok CLI"""

    def __init__(self, config: dict):
        self.config = config
        self.console = Console()

        # Short-term memory (recent operations)
        self.short_term_size = config["memory"]["short_term_size"]
        self.short_term: deque = deque(maxlen=self.short_term_size)

        # Long-term memory (persistent storage)
        self.long_term_enabled = config["memory"]["long_term_enabled"]
        self.long_term: Dict[str, MemoryEntry] = {}
        self.memory_file = Path("./data/memory.json")

        # Load long-term memory
        if self.long_term_enabled:
            self._load_long_term()

    def store_short_term(self, key: str, value: Any, category: str = "general"):
        """Store in short-term memory"""
        entry = MemoryEntry(
            key=key,
            value=value,
            timestamp=datetime.now(),
            category=category,
        )
        self.short_term.append(entry)

    def store_long_term(
        self,
        key: str,
        value: Any,
        category: str = "general",
        metadata: Optional[Dict] = None,
    ):
        """Store in long-term memory"""
        entry = MemoryEntry(
            key=key,
            value=value,
            timestamp=datetime.now(),
            category=category,
            metadata=metadata or {},
        )
        self.long_term[key] = entry

        # Persist to disk
        if self.long_term_enabled:
            self._save_long_term()

    def get_short_term(self, key: str) -> Optional[Any]:
        """Retrieve from short-term memory"""
        for entry in reversed(self.short_term):
            if entry.key == key:
                return entry.value
        return None

    def get_long_term(self, key: str) -> Optional[Any]:
        """Retrieve from long-term memory"""
        entry = self.long_term.get(key)
        return entry.value if entry else None

    def get_recent(self, limit: int = 10) -> List[MemoryEntry]:
        """Get recent short-term memories"""
        return list(self.short_term)[-limit:]

    def search_memory(
        self, query: str, category: Optional[str] = None
    ) -> List[MemoryEntry]:
        """Search across all memory"""
        results = []

        # Search short-term
        for entry in self.short_term:
            if self._matches_query(entry, query, category):
                results.append(entry)

        # Search long-term
        for entry in self.long_term.values():
            if self._matches_query(entry, query, category):
                results.append(entry)

        # Sort by relevance (most recent first)
        results.sort(key=lambda x: x.timestamp, reverse=True)

        return results

    def _matches_query(
        self, entry: MemoryEntry, query: str, category: Optional[str] = None
    ) -> bool:
        """Check if entry matches search query"""
        if category and entry.category != category:
            return False

        query_lower = query.lower()

        # Check key
        if query_lower in entry.key.lower():
            return True

        # Check value (if string)
        if isinstance(entry.value, str) and query_lower in entry.value.lower():
            return True

        return False

    def clear_short_term(self):
        """Clear short-term memory"""
        self.short_term.clear()

    def clear_long_term(self):
        """Clear long-term memory"""
        self.long_term.clear()
        if self.long_term_enabled:
            self._save_long_term()

    def _load_long_term(self):
        """Load long-term memory from disk"""
        if not self.memory_file.exists():
            return

        try:
            with open(self.memory_file, "r") as f:
                data = json.load(f)

            self.long_term = {
                key: MemoryEntry.from_dict(entry_data)
                for key, entry_data in data.items()
            }

        except Exception as e:
            self.console.print(
                f"[yellow]Warning: Could not load memory: {e}[/yellow]"
            )

    def _save_long_term(self):
        """Save long-term memory to disk"""
        # Create directory if needed
        self.memory_file.parent.mkdir(parents=True, exist_ok=True)

        try:
            data = {
                key: entry.to_dict() for key, entry in self.long_term.items()
            }

            with open(self.memory_file, "w") as f:
                json.dump(data, f, indent=2, default=str)

        except Exception as e:
            self.console.print(
                f"[yellow]Warning: Could not save memory: {e}[/yellow]"
            )

    def get_statistics(self) -> Dict:
        """Get memory statistics"""
        categories = {}

        # Count by category
        for entry in list(self.short_term) + list(self.long_term.values()):
            category = entry.category
            categories[category] = categories.get(category, 0) + 1

        return {
            "short_term_count": len(self.short_term),
            "long_term_count": len(self.long_term),
            "categories": categories,
        }

    def display_summary(self):
        """Display memory summary"""
        stats = self.get_statistics()

        # Create table
        table = Table(title="🧠 Memory Summary", show_header=True)
        table.add_column("Type", style="cyan")
        table.add_column("Count", style="yellow", justify="right")

        table.add_row("Short-term", str(stats["short_term_count"]))
        table.add_row("Long-term", str(stats["long_term_count"]))

        self.console.print(table)

        # Show categories
        if stats["categories"]:
            cat_table = Table(title="Categories", show_header=True)
            cat_table.add_column("Category", style="cyan")
            cat_table.add_column("Count", style="yellow", justify="right")

            for category, count in stats["categories"].items():
                cat_table.add_row(category, str(count))

            self.console.print("\n")
            self.console.print(cat_table)

        # Show recent entries
        recent = self.get_recent(5)
        if recent:
            self.console.print("\n[bold]Recent Memories:[/bold]")
            for entry in recent:
                timestamp = entry.timestamp.strftime("%H:%M:%S")
                value_preview = str(entry.value)[:50]
                self.console.print(
                    f"  [dim]{timestamp}[/dim] [{entry.category}] {entry.key}: {value_preview}"
                )

    def get_context_for_llm(self, max_entries: int = 10) -> str:
        """Get formatted context for LLM"""
        recent = self.get_recent(max_entries)

        if not recent:
            return "No recent context available."

        context_parts = ["Recent Context:"]

        for entry in recent:
            timestamp = entry.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            context_parts.append(
                f"[{timestamp}] {entry.key}: {str(entry.value)[:200]}"
            )

        return "\n".join(context_parts)
