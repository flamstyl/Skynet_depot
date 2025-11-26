#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skynet Prompt Syncer - Launcher Script
Entry point for running the Prompt Syncer application
"""

import sys
import os
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

def check_dependencies():
    """Check if required dependencies are installed."""
    missing = []

    try:
        import PySimpleGUI
    except ImportError:
        missing.append("PySimpleGUI")

    if missing:
        print("❌ Missing dependencies detected!")
        print("\nPlease install the following packages:")
        for package in missing:
            print(f"  - {package}")
        print("\nInstall with: pip install -r requirements.txt")
        print("Or manually: pip install " + " ".join(missing))
        sys.exit(1)

    print("✓ All dependencies satisfied")


def check_directories():
    """Ensure required directories exist."""
    required_dirs = [
        project_dir / "logs",
        project_dir / "data",
        project_dir / "core",
        project_dir / "ui"
    ]

    for dir_path in required_dirs:
        if not dir_path.exists():
            print(f"⚠️  Creating directory: {dir_path}")
            dir_path.mkdir(parents=True, exist_ok=True)


def check_config_files():
    """Check if configuration files exist."""
    config_files = [
        project_dir / "data" / "sync_config.json",
        project_dir / "data" / "agents.json"
    ]

    missing = []
    for config_file in config_files:
        if not config_file.exists():
            missing.append(str(config_file.name))

    if missing:
        print("⚠️  Warning: Missing configuration files:")
        for file in missing:
            print(f"  - {file}")
        print("\nThe application will use default configuration.")
        print("Please configure your paths in the application settings.")


def main():
    """Main entry point."""
    print("=" * 60)
    print("🤖 SKYNET PROMPT SYNCER - Universal Prompt Distributor")
    print("=" * 60)
    print()

    # Check dependencies
    print("Checking dependencies...")
    check_dependencies()

    # Check directories
    print("\nChecking directories...")
    check_directories()

    # Check config files
    print("\nChecking configuration...")
    check_config_files()

    print("\n" + "=" * 60)
    print("🚀 Starting application...")
    print("=" * 60)
    print()

    # Import and run the application
    try:
        from core.syncer_app import run
        run()

    except KeyboardInterrupt:
        print("\n\n⚠️  Application interrupted by user")
        sys.exit(0)

    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
