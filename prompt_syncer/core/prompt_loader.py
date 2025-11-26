#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skynet Prompt Syncer - Prompt Loader Module
Handles loading and listing prompt files from the central repository
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Supported prompt file extensions
SUPPORTED_EXTENSIONS = ['.txt', '.md', '.json', '.jsonl', '.prompt']


def list_prompts(directory: str) -> List[Dict[str, str]]:
    """
    List all valid prompt files in the specified directory.

    Args:
        directory: Path to the prompts directory

    Returns:
        List of dictionaries containing prompt metadata:
        [
            {
                'name': 'prompt_name.txt',
                'path': '/full/path/to/prompt_name.txt',
                'size': 1234,
                'extension': '.txt',
                'modified': '2024-11-18 12:34:56'
            },
            ...
        ]
    """
    prompts = []

    try:
        directory_path = Path(directory)

        if not directory_path.exists():
            logger.warning(f"Directory does not exist: {directory}")
            return prompts

        if not directory_path.is_dir():
            logger.error(f"Path is not a directory: {directory}")
            return prompts

        # Walk through directory and subdirectories
        for file_path in directory_path.rglob('*'):
            if file_path.is_file() and file_path.suffix in SUPPORTED_EXTENSIONS:
                try:
                    stat = file_path.stat()

                    prompt_info = {
                        'name': file_path.name,
                        'path': str(file_path.absolute()),
                        'relative_path': str(file_path.relative_to(directory_path)),
                        'size': stat.st_size,
                        'extension': file_path.suffix,
                        'modified': stat.st_mtime,
                        'directory': str(file_path.parent)
                    }

                    prompts.append(prompt_info)
                    logger.debug(f"Found prompt: {prompt_info['name']}")

                except Exception as e:
                    logger.error(f"Error processing file {file_path}: {e}")
                    continue

        # Sort by name
        prompts.sort(key=lambda x: x['name'].lower())
        logger.info(f"Found {len(prompts)} prompt files in {directory}")

    except Exception as e:
        logger.error(f"Error listing prompts from {directory}: {e}")

    return prompts


def load_prompt(path: str) -> Optional[str]:
    """
    Load the content of a prompt file.

    Args:
        path: Full path to the prompt file

    Returns:
        Content of the prompt file as string, or None if error
    """
    try:
        file_path = Path(path)

        if not file_path.exists():
            logger.error(f"Prompt file does not exist: {path}")
            return None

        if not file_path.is_file():
            logger.error(f"Path is not a file: {path}")
            return None

        # Read file content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        logger.info(f"Loaded prompt: {file_path.name} ({len(content)} characters)")
        return content

    except UnicodeDecodeError:
        logger.warning(f"Unicode decode error, trying with latin-1 encoding: {path}")
        try:
            with open(path, 'r', encoding='latin-1') as f:
                content = f.read()
            return content
        except Exception as e:
            logger.error(f"Error loading prompt with latin-1 encoding {path}: {e}")
            return None

    except Exception as e:
        logger.error(f"Error loading prompt {path}: {e}")
        return None


def get_prompt_metadata(path: str) -> Optional[Dict]:
    """
    Get detailed metadata about a prompt file.

    Args:
        path: Full path to the prompt file

    Returns:
        Dictionary with detailed metadata or None if error
    """
    try:
        file_path = Path(path)

        if not file_path.exists():
            return None

        stat = file_path.stat()
        content = load_prompt(path)

        metadata = {
            'name': file_path.name,
            'path': str(file_path.absolute()),
            'size': stat.st_size,
            'extension': file_path.suffix,
            'modified': stat.st_mtime,
            'line_count': len(content.split('\n')) if content else 0,
            'char_count': len(content) if content else 0,
            'word_count': len(content.split()) if content else 0
        }

        return metadata

    except Exception as e:
        logger.error(f"Error getting metadata for {path}: {e}")
        return None


def validate_prompt_file(path: str) -> bool:
    """
    Validate that a file is a valid prompt file.

    Args:
        path: Full path to the prompt file

    Returns:
        True if valid, False otherwise
    """
    try:
        file_path = Path(path)

        # Check if file exists
        if not file_path.exists() or not file_path.is_file():
            return False

        # Check extension
        if file_path.suffix not in SUPPORTED_EXTENSIONS:
            return False

        # Check if readable
        content = load_prompt(path)
        if content is None:
            return False

        # Check if not empty
        if len(content.strip()) == 0:
            logger.warning(f"Prompt file is empty: {path}")
            return False

        return True

    except Exception as e:
        logger.error(f"Error validating prompt file {path}: {e}")
        return False


if __name__ == "__main__":
    # Test the module
    test_dir = "C:/Users/rapha/Skynet_Drive_Core/prompts"

    print(f"Testing prompt_loader with directory: {test_dir}")
    print("-" * 50)

    prompts = list_prompts(test_dir)
    print(f"\nFound {len(prompts)} prompts:")

    for prompt in prompts[:5]:  # Show first 5
        print(f"\n  Name: {prompt['name']}")
        print(f"  Path: {prompt['path']}")
        print(f"  Size: {prompt['size']} bytes")
        print(f"  Extension: {prompt['extension']}")
