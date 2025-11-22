"""Logging configuration."""

import logging
import sys
from pathlib import Path
from typing import Optional


def setup_logger(name: str = "gdrive-analyzer", level: Optional[int] = None) -> logging.Logger:
    """
    Setup application logger.

    Args:
        name: Logger name
        level: Logging level (defaults to INFO, DEBUG if debug mode)

    Returns:
        Configured logger
    """
    logger = logging.getLogger(name)

    # Determine log level
    if level is None:
        import os
        debug = os.environ.get("GDRIVE_ANALYZER_DEBUG", "0") == "1"
        level = logging.DEBUG if debug else logging.INFO

    logger.setLevel(level)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)

    # Formatter
    formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)

    # Add handler if not already present
    if not logger.handlers:
        logger.addHandler(console_handler)

    # File handler (optional)
    try:
        from .config import Config
        log_dir = Config.get_cache_dir() / "logs"
        log_dir.mkdir(exist_ok=True)

        file_handler = logging.FileHandler(log_dir / "gdrive-analyzer.log")
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except Exception as e:
        logger.warning(f"Could not setup file logging: {e}")

    return logger


def get_logger(name: str = "gdrive-analyzer") -> logging.Logger:
    """Get logger instance."""
    return logging.getLogger(name)
