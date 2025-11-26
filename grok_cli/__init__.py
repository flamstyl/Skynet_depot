"""
🟣 Grok CLI - Advanced Local AI Copilot
Version: 2.0.0 PRO

Complete autonomous development assistant with:
- Deep project analysis
- Code generation & fixing
- Docker sandbox execution
- RAG-based memory system
- MCP integration for Skynet ecosystem
- Real-time monitoring dashboard
"""

__version__ = "2.0.0"
__author__ = "Skynet Coalition"

from .core.analyzer import ProjectAnalyzer
from .core.executor import CommandExecutor
from .core.generator import CodeGenerator
from .core.memory import MemorySystem
from .core.diagnostics import DiagnosticEngine

__all__ = [
    "ProjectAnalyzer",
    "CommandExecutor",
    "CodeGenerator",
    "MemorySystem",
    "DiagnosticEngine",
]
