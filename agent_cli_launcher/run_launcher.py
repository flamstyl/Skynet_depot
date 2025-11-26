#!/usr/bin/env python3
"""
Skynet Agent CLI Launcher - Entry Point
Run this script to launch the agent management GUI.

Usage:
    python run_launcher.py
"""

import sys
from pathlib import Path

# Add parent directory to path to allow imports
sys.path.insert(0, str(Path(__file__).parent))

from core.launcher_app import run

if __name__ == "__main__":
    print("=" * 60)
    print("  🚀 SKYNET AGENT CLI LAUNCHER v1.0")
    print("=" * 60)
    print("  Initializing agent management system...")
    print("=" * 60)
    print()

    try:
        run()
    except KeyboardInterrupt:
        print("\n\n⚠️  Application interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
