#!/usr/bin/env python3
"""Main entry point for Google Drive Space Analyzer."""

import sys
import signal
import gi

gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')

from gi.repository import Gtk, Adw, Gio

from .application import GDriveAnalyzerApplication
from .utils.logger import setup_logger
from .utils.config import get_config

logger = setup_logger()


def main():
    """Main function."""
    logger.info("Starting Google Drive Space Analyzer")

    # Load configuration
    config = get_config()

    # Create application
    app = GDriveAnalyzerApplication()

    # Handle Ctrl+C gracefully
    signal.signal(signal.SIGINT, signal.SIG_DFL)

    # Run application
    exit_code = app.run(sys.argv)

    logger.info(f"Application exited with code {exit_code}")
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
