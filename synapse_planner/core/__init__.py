"""
Synapse Planner - Core Module
Version 1.0.0

Moteur de génération de planning quotidien pour Skynet.
"""

from .synapse_planner import SynapsePlanner
from .memory_fetcher import (
    fetch_recent_memory,
    fetch_agent_notes,
    fetch_alerts,
    fetch_recommendations,
    get_memory_summary
)

__version__ = "1.0.0"
__all__ = [
    "SynapsePlanner",
    "fetch_recent_memory",
    "fetch_agent_notes",
    "fetch_alerts",
    "fetch_recommendations",
    "get_memory_summary"
]
