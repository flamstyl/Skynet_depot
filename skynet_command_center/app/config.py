"""
Skynet Command Center - Configuration Module
============================================
Centralizes all paths, constants, and configuration settings.

Author: Skynet Architect
Version: 1.0
"""

import os
from pathlib import Path

# ============================================================================
# ROOT PATHS
# ============================================================================

# Skynet Drive Core (where all memory and data is stored)
SKYNET_ROOT = os.getenv("SKYNET_ROOT", "C:/Users/rapha/Skynet_Drive_Core")

# Agents directory (where all agent scripts are located)
AGENTS_DIR = os.getenv("AGENTS_DIR", "C:/Users/rapha/IA/agents")

# Command Center base directory
COMMAND_CENTER_ROOT = Path(__file__).parent.parent.absolute()

# ============================================================================
# DATA DIRECTORIES
# ============================================================================

# Data directory for command center
DATA_DIR = COMMAND_CENTER_ROOT / "data"

# Logs directory
LOGS_DIR = DATA_DIR / "logs"

# Memory directory (in Skynet Drive)
MEMORY_DIR = Path(SKYNET_ROOT) / "memory"

# Database file
DATABASE_FILE = DATA_DIR / "skynet_command.db"

# Agents status file
AGENTS_STATUS_FILE = DATA_DIR / "agents.json"

# Memory index file
MEMORY_INDEX_FILE = DATA_DIR / "memory_index.json"

# Terminal history file
TERMINAL_HISTORY_FILE = DATA_DIR / "terminal_history.txt"

# Latest log file
LATEST_LOG_FILE = LOGS_DIR / "latest.log"

# ============================================================================
# SERVER CONFIGURATION
# ============================================================================

# Flask server settings
HOST = "0.0.0.0"
PORT = 6060
DEBUG = True

# Auto-refresh interval (seconds)
REFRESH_INTERVAL = 2

# Max log lines to return
MAX_LOG_LINES = 100

# Max terminal history entries
MAX_TERMINAL_HISTORY = 1000

# ============================================================================
# AGENT CONFIGURATION
# ============================================================================

# Agent ping timeout (seconds)
AGENT_PING_TIMEOUT = 5

# Agent startup timeout (seconds)
AGENT_STARTUP_TIMEOUT = 10

# Supported agent statuses
AGENT_STATUS = {
    "ONLINE": "online",
    "OFFLINE": "offline",
    "ERROR": "error",
    "STARTING": "starting",
    "STOPPING": "stopping"
}

# ============================================================================
# UI THEME
# ============================================================================

# Color scheme (dark mode)
COLORS = {
    "background": "#0C0C0C",
    "card": "#181818",
    "text": "#E0E0E0",
    "accent": "#00AEEF",
    "error": "#FF3B3B",
    "success": "#00E676",
    "warning": "#FFC107"
}

# ============================================================================
# SECURITY
# ============================================================================

# Allowed terminal commands (whitelist)
ALLOWED_TERMINAL_COMMANDS = [
    "agent",
    "memory",
    "logs",
    "clear",
    "help",
    "status",
    "sync"
]

# Dangerous commands (blacklist - never allow)
BLACKLISTED_COMMANDS = [
    "rm",
    "del",
    "format",
    "shutdown",
    "reboot",
    "kill",
    "taskkill"
]

# ============================================================================
# UTILITIES
# ============================================================================

def ensure_directories():
    """Create all necessary directories if they don't exist."""
    directories = [
        DATA_DIR,
        LOGS_DIR,
        MEMORY_DIR,
    ]

    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)

    print(f"[CONFIG] All directories ensured: {len(directories)} directories")


def get_config_summary():
    """Return a summary of the current configuration."""
    return {
        "skynet_root": str(SKYNET_ROOT),
        "agents_dir": str(AGENTS_DIR),
        "data_dir": str(DATA_DIR),
        "logs_dir": str(LOGS_DIR),
        "memory_dir": str(MEMORY_DIR),
        "database": str(DATABASE_FILE),
        "server": {
            "host": HOST,
            "port": PORT,
            "debug": DEBUG
        }
    }


if __name__ == "__main__":
    ensure_directories()
    print("Configuration loaded successfully!")
    import json
    print(json.dumps(get_config_summary(), indent=2))
