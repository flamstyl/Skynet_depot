"""
Skynet Context Injector — File Reader Module
Handles reading of context files (.json, .md)
"""

import os
import json
from typing import Optional


def read_context_file(path: str) -> Optional[str]:
    """
    Read a context file (.json or .md) and return its content as a string.

    Args:
        path: Absolute path to the context file

    Returns:
        File content as string, or None if error occurs
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Context file not found: {path}")

    file_ext = os.path.splitext(path)[1].lower()

    if file_ext not in ['.json', '.md']:
        raise ValueError(f"Unsupported file type: {file_ext}. Only .json and .md are supported.")

    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        # If JSON, validate it
        if file_ext == '.json':
            try:
                json.loads(content)  # Validate JSON structure
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON file: {e}")

        return content

    except Exception as e:
        raise Exception(f"Error reading context file: {e}")


def get_file_info(path: str) -> dict:
    """
    Get information about a context file.

    Args:
        path: Path to the file

    Returns:
        Dictionary with file info (size, type, name)
    """
    if not os.path.exists(path):
        return {}

    file_stats = os.stat(path)
    file_name = os.path.basename(path)
    file_ext = os.path.splitext(path)[1].lower()

    return {
        'name': file_name,
        'type': file_ext,
        'size': file_stats.st_size,
        'size_kb': round(file_stats.st_size / 1024, 2),
        'path': path
    }


def format_context_for_injection(content: str, file_type: str) -> str:
    """
    Format the context content for injection into an agent.
    Adds appropriate headers and formatting.

    Args:
        content: Raw file content
        file_type: File extension (.json or .md)

    Returns:
        Formatted context string ready for injection
    """
    header = "=== INJECTED CONTEXT START ===\n\n"
    footer = "\n\n=== INJECTED CONTEXT END ===\n"

    if file_type == '.json':
        # For JSON, add a prefix explaining it's structured data
        formatted = f"{header}[JSON CONTEXT]\n{content}{footer}"
    else:
        # For markdown, inject as-is
        formatted = f"{header}{content}{footer}"

    return formatted
