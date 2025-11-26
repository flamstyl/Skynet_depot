"""
NoteVault MCP — Notion Converter
Convert Notion exports (JSON/Markdown) to NoteVault format

Features:
- Parse Notion JSON exports
- Convert Notion blocks to Markdown
- Extract properties (tags, dates, types)
- Batch import from folder
- Preserve metadata
"""

import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime


class NotionConverter:
    """
    Converts Notion exports to NoteVault notes.
    Supports JSON and Markdown formats.
    """

    def __init__(self):
        self.property_mappings = {
            "Tags": "tags",
            "Category": "category",
            "Type": "type",
            "Status": "status",
            "Created": "created_at",
            "Updated": "updated_at"
        }

    def convert_notion_json(self, json_path: str) -> Dict[str, Any]:
        """
        Convert Notion JSON export to NoteVault note.

        Notion JSON structure (simplified):
        {
          "object": "page",
          "properties": {
            "title": {...},
            "Tags": {...},
            ...
          },
          "content": [blocks...]
        }

        Args:
            json_path: Path to Notion JSON file

        Returns:
            NoteVault note dict
        """
        with open(json_path, 'r', encoding='utf-8') as f:
            notion_data = json.load(f)

        # Extract title
        title = self._extract_title(notion_data)

        # Extract properties
        properties = self._extract_properties(notion_data)

        # Convert blocks to Markdown
        content = self._blocks_to_markdown(notion_data.get("content", []))

        # Build NoteVault note
        note = {
            "title": title,
            "content": content,
            "tags": properties.get("tags", []),
            "metadata": {
                "source": "notion",
                "notion_id": notion_data.get("id"),
                **properties
            }
        }

        return note

    def convert_notion_markdown(self, md_path: str) -> Dict[str, Any]:
        """
        Convert Notion Markdown export to NoteVault note.

        Notion exports include frontmatter with properties.

        Args:
            md_path: Path to Notion .md file

        Returns:
            NoteVault note dict
        """
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract frontmatter
        frontmatter, markdown = self._split_frontmatter(content)

        # Parse frontmatter
        properties = self._parse_frontmatter(frontmatter)

        # Extract title (from frontmatter or first heading)
        title = properties.get("title") or self._extract_title_from_markdown(markdown)

        # Build note
        note = {
            "title": title,
            "content": markdown.strip(),
            "tags": properties.get("tags", []),
            "metadata": {
                "source": "notion",
                **properties
            }
        }

        return note

    def batch_import(self, folder_path: str, file_type: str = "auto") -> List[Dict[str, Any]]:
        """
        Batch import Notion files from folder.

        Args:
            folder_path: Path to folder with Notion exports
            file_type: "json", "md", or "auto"

        Returns:
            List of NoteVault notes
        """
        folder = Path(folder_path)
        notes = []

        if not folder.exists():
            raise FileNotFoundError(f"Folder not found: {folder_path}")

        # Determine file pattern
        if file_type == "json":
            pattern = "*.json"
        elif file_type == "md":
            pattern = "*.md"
        else:
            # Auto: try both
            pattern = "*.*"

        for file_path in folder.rglob(pattern):
            try:
                if file_path.suffix == ".json":
                    note = self.convert_notion_json(str(file_path))
                elif file_path.suffix == ".md":
                    note = self.convert_notion_markdown(str(file_path))
                else:
                    continue

                notes.append(note)
                print(f"  ✅ Imported: {note['title']}")

            except Exception as e:
                print(f"  ⚠️ Failed to import {file_path.name}: {e}")

        return notes

    # Helper methods

    def _extract_title(self, notion_data: Dict[str, Any]) -> str:
        """Extract title from Notion JSON."""
        properties = notion_data.get("properties", {})

        # Try "title" or "Name" property
        for key in ["title", "Title", "Name", "name"]:
            if key in properties:
                prop = properties[key]
                if prop.get("type") == "title" and prop.get("title"):
                    # Extract plain text from rich text
                    return self._extract_text_from_rich_text(prop["title"])

        # Fallback: use ID or timestamp
        return f"Imported from Notion ({datetime.utcnow().strftime('%Y-%m-%d')})"

    def _extract_properties(self, notion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract properties from Notion JSON."""
        properties_raw = notion_data.get("properties", {})
        properties = {}

        for key, value in properties_raw.items():
            prop_type = value.get("type")

            # Map to NoteVault property
            mapped_key = self.property_mappings.get(key, key.lower())

            if prop_type == "multi_select":
                # Tags
                tags = [item["name"] for item in value.get("multi_select", [])]
                properties["tags"] = tags

            elif prop_type == "select":
                # Category/Type/Status
                select_value = value.get("select", {})
                if select_value:
                    properties[mapped_key] = select_value.get("name")

            elif prop_type == "date":
                # Dates
                date_value = value.get("date", {})
                if date_value:
                    properties[mapped_key] = date_value.get("start")

            elif prop_type == "rich_text":
                # Text properties
                text = self._extract_text_from_rich_text(value.get("rich_text", []))
                if text:
                    properties[mapped_key] = text

        return properties

    def _extract_text_from_rich_text(self, rich_text: List[Dict[str, Any]]) -> str:
        """Extract plain text from Notion rich text."""
        return "".join(item.get("plain_text", "") for item in rich_text)

    def _blocks_to_markdown(self, blocks: List[Dict[str, Any]]) -> str:
        """
        Convert Notion blocks to Markdown.

        Simplified conversion (TODO: handle all block types).
        """
        markdown_lines = []

        for block in blocks:
            block_type = block.get("type")

            if block_type == "paragraph":
                text = self._extract_text_from_rich_text(block.get("paragraph", {}).get("rich_text", []))
                markdown_lines.append(text)
                markdown_lines.append("")  # Blank line

            elif block_type == "heading_1":
                text = self._extract_text_from_rich_text(block.get("heading_1", {}).get("rich_text", []))
                markdown_lines.append(f"# {text}")
                markdown_lines.append("")

            elif block_type == "heading_2":
                text = self._extract_text_from_rich_text(block.get("heading_2", {}).get("rich_text", []))
                markdown_lines.append(f"## {text}")
                markdown_lines.append("")

            elif block_type == "heading_3":
                text = self._extract_text_from_rich_text(block.get("heading_3", {}).get("rich_text", []))
                markdown_lines.append(f"### {text}")
                markdown_lines.append("")

            elif block_type == "bulleted_list_item":
                text = self._extract_text_from_rich_text(block.get("bulleted_list_item", {}).get("rich_text", []))
                markdown_lines.append(f"- {text}")

            elif block_type == "numbered_list_item":
                text = self._extract_text_from_rich_text(block.get("numbered_list_item", {}).get("rich_text", []))
                markdown_lines.append(f"1. {text}")

            elif block_type == "code":
                code_block = block.get("code", {})
                text = self._extract_text_from_rich_text(code_block.get("rich_text", []))
                language = code_block.get("language", "")
                markdown_lines.append(f"```{language}")
                markdown_lines.append(text)
                markdown_lines.append("```")
                markdown_lines.append("")

            elif block_type == "quote":
                text = self._extract_text_from_rich_text(block.get("quote", {}).get("rich_text", []))
                markdown_lines.append(f"> {text}")
                markdown_lines.append("")

            # TODO: Add more block types (images, tables, etc.)

        return "\n".join(markdown_lines).strip()

    def _split_frontmatter(self, content: str) -> tuple[str, str]:
        """Split frontmatter from Markdown content."""
        # Frontmatter pattern: ---\n...\n---
        pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
        match = re.match(pattern, content, re.DOTALL)

        if match:
            return match.group(1), match.group(2)
        else:
            return "", content

    def _parse_frontmatter(self, frontmatter: str) -> Dict[str, Any]:
        """Parse YAML-like frontmatter."""
        properties = {}

        for line in frontmatter.split('\n'):
            line = line.strip()
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()

                # Parse lists (tags)
                if value.startswith('[') and value.endswith(']'):
                    # Simple list parsing
                    value = [item.strip().strip('"\'') for item in value[1:-1].split(',')]

                properties[key.lower()] = value

        return properties

    def _extract_title_from_markdown(self, markdown: str) -> str:
        """Extract title from first heading in Markdown."""
        for line in markdown.split('\n'):
            line = line.strip()
            if line.startswith('#'):
                return line.lstrip('#').strip()

        # Fallback
        return f"Imported Note ({datetime.utcnow().strftime('%Y-%m-%d')})"


if __name__ == "__main__":
    # Demo usage
    print("📥 NoteVault Notion Converter — Demo")
    print("=" * 50)

    converter = NotionConverter()

    # Mock Notion JSON
    mock_notion_json = {
        "id": "notion-page-123",
        "object": "page",
        "properties": {
            "title": {
                "type": "title",
                "title": [{"plain_text": "My Notion Page"}]
            },
            "Tags": {
                "type": "multi_select",
                "multi_select": [
                    {"name": "skynet"},
                    {"name": "ai"}
                ]
            },
            "Status": {
                "type": "select",
                "select": {"name": "In Progress"}
            }
        },
        "content": [
            {
                "type": "heading_1",
                "heading_1": {
                    "rich_text": [{"plain_text": "Introduction"}]
                }
            },
            {
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"plain_text": "This is a test paragraph from Notion."}]
                }
            },
            {
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [{"plain_text": "Item 1"}]
                }
            },
            {
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [{"plain_text": "Item 2"}]
                }
            }
        ]
    }

    # Save mock JSON
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as f:
        json.dump(mock_notion_json, f)
        mock_json_path = f.name

    # Convert
    print("\n🔄 Converting Notion JSON...")
    note = converter.convert_notion_json(mock_json_path)

    print(f"\n✅ Converted note:")
    print(f"  Title: {note['title']}")
    print(f"  Tags: {note['tags']}")
    print(f"  Metadata: {note['metadata']}")
    print(f"\n  Content:\n{note['content'][:200]}...")

    # Cleanup
    Path(mock_json_path).unlink()

    print("\n🎉 Notion Converter working perfectly!")
