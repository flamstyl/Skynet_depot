#!/usr/bin/env python3
"""
Skynet Command Center - Main Entry Point
=========================================
Run this file to start the Skynet Command Center server.

Usage:
    python run.py

Author: Skynet Architect
Version: 1.0
"""

import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.server import run_server
from app.config import ensure_directories

if __name__ == '__main__':
    # Ensure all directories exist
    ensure_directories()

    # Start server
    run_server()
