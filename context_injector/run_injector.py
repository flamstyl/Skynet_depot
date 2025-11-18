#!/usr/bin/env python3
"""
Skynet Context Injector — Entry Point
Launch the Context Injector GUI application

Usage:
    python run_injector.py
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.injector_app import run


if __name__ == "__main__":
    print("=" * 60)
    print("🔹 SKYNET CONTEXT INJECTOR — MEMORY LOADER v1.0 🔹")
    print("=" * 60)
    print("Initializing GUI...")
    print()

    try:
        run()
    except Exception as e:
        print(f"✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
