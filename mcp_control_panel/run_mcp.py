#!/usr/bin/env python3
"""
MCP Control Panel - Launch Script
Skynet Multi-Agent Management System

Usage:
    python run_mcp.py
    or
    python3 run_mcp.py
"""

import sys
from pathlib import Path

# Add core directory to Python path
core_dir = Path(__file__).parent / 'core'
sys.path.insert(0, str(core_dir.parent))

try:
    from core.mcp_app import run

    if __name__ == '__main__':
        print("=" * 60)
        print("MCP CONTROL PANEL - SKYNET MULTI-AGENT MANAGER")
        print("=" * 60)
        print("Initializing...")
        print()

        # Run the application
        run()

except ImportError as e:
    print("ERROR: Failed to import required modules")
    print(f"Details: {e}")
    print()
    print("Please ensure PyQt5 is installed:")
    print("    pip install PyQt5")
    sys.exit(1)

except Exception as e:
    print(f"ERROR: Failed to start MCP Control Panel")
    print(f"Details: {e}")
    sys.exit(1)
