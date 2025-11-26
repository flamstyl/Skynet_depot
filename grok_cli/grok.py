#!/usr/bin/env python3
"""
🟣 Grok CLI - Entry Point
Wrapper script for agent_cli_launcher detection
"""

import sys
from pathlib import Path

# Add grok_cli to path
sys.path.insert(0, str(Path(__file__).parent))

from cli import app

if __name__ == "__main__":
    # Run the CLI app
    app()
