"""
Skynet Command Center - Routes Module
======================================
All Flask routes for the application.
"""

from .dashboard_routes import dashboard_bp
from .agents_routes import agents_bp
from .memory_routes import memory_bp
from .logs_routes import logs_bp
from .terminal_routes import terminal_bp

__all__ = [
    'dashboard_bp',
    'agents_bp',
    'memory_bp',
    'logs_bp',
    'terminal_bp'
]
