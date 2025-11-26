"""
Skynet Command Center - Terminal Engine
========================================
Internal terminal for safe command execution:
- Whitelisted commands only
- No dangerous system operations
- Command history tracking
- Agent control commands
- Memory management commands

Author: Skynet Architect
Version: 1.0
"""

from typing import Dict, List
from datetime import datetime

from ..config import (
    ALLOWED_TERMINAL_COMMANDS,
    BLACKLISTED_COMMANDS,
    TERMINAL_HISTORY_FILE
)
from ..database import get_database
from .agent_manager import get_agent_manager
from .memory_manager import get_memory_manager
from .logs_manager import get_logs_manager


class TerminalEngine:
    """
    Safe internal terminal for Skynet Command Center.
    """

    def __init__(self):
        """Initialize Terminal Engine."""
        self.db = get_database()
        self.agent_manager = get_agent_manager()
        self.memory_manager = get_memory_manager()
        self.logs_manager = get_logs_manager()

        # Ensure history file exists
        TERMINAL_HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
        if not TERMINAL_HISTORY_FILE.exists():
            TERMINAL_HISTORY_FILE.touch()

    def execute(self, command: str) -> Dict:
        """
        Execute a terminal command.

        Args:
            command: Command string to execute

        Returns:
            Dictionary with output and success status
        """
        command = command.strip()

        # Log command to history
        self._save_to_history(command)

        # Check for empty command
        if not command:
            return {
                'output': '',
                'success': True
            }

        # Security check: blacklisted commands
        if self._is_blacklisted(command):
            output = f"ERROR: Command '{command}' is blacklisted for security reasons"
            self.db.record_terminal_command(command, output, success=False)
            return {
                'output': output,
                'success': False
            }

        # Parse command
        parts = command.split()
        base_command = parts[0].lower()
        args = parts[1:] if len(parts) > 1 else []

        # Execute based on command
        try:
            if base_command == 'help':
                result = self._cmd_help(args)
            elif base_command == 'clear':
                result = self._cmd_clear(args)
            elif base_command == 'agent':
                result = self._cmd_agent(args)
            elif base_command == 'memory':
                result = self._cmd_memory(args)
            elif base_command == 'logs':
                result = self._cmd_logs(args)
            elif base_command == 'status':
                result = self._cmd_status(args)
            elif base_command == 'sync':
                result = self._cmd_sync(args)
            elif base_command == 'history':
                result = self._cmd_history(args)
            else:
                result = {
                    'output': f"Unknown command: '{base_command}'\nType 'help' for available commands",
                    'success': False
                }

            # Record to database
            self.db.record_terminal_command(
                command,
                result['output'],
                success=result['success']
            )

            return result

        except Exception as e:
            error_output = f"Error executing command: {str(e)}"
            self.db.record_terminal_command(command, error_output, success=False)
            return {
                'output': error_output,
                'success': False
            }

    def _is_blacklisted(self, command: str) -> bool:
        """Check if command contains blacklisted keywords."""
        command_lower = command.lower()
        return any(
            blacklisted in command_lower
            for blacklisted in BLACKLISTED_COMMANDS
        )

    def _save_to_history(self, command: str):
        """Save command to history file."""
        try:
            with open(TERMINAL_HISTORY_FILE, 'a', encoding='utf-8') as f:
                timestamp = datetime.now().isoformat()
                f.write(f"[{timestamp}] {command}\n")
        except Exception as e:
            print(f"[TERMINAL] Error saving to history: {e}")

    # ========================================================================
    # COMMAND IMPLEMENTATIONS
    # ========================================================================

    def _cmd_help(self, args: List[str]) -> Dict:
        """Show help message."""
        help_text = """
Skynet Command Center - Available Commands
==========================================

AGENT COMMANDS:
  agent list                  - List all agents and their status
  agent start <name>          - Start an agent
  agent stop <name>           - Stop an agent
  agent restart <name>        - Restart an agent

MEMORY COMMANDS:
  memory sync                 - Synchronize memory index
  memory list                 - List memory files
  memory stats                - Show memory statistics
  memory search <query>       - Search memory files

LOGS COMMANDS:
  logs tail [N]               - Show last N log entries (default 20)
  logs source <name>          - Show logs from specific source
  logs level <level>          - Show logs by level (INFO, ERROR, etc.)
  logs search <query>         - Search logs
  logs clear                  - Clear all logs
  logs stats                  - Show log statistics

SYSTEM COMMANDS:
  status                      - Show overall system status
  sync                        - Synchronize all (agents + memory)
  history [N]                 - Show command history (last N commands)
  clear                       - Clear terminal screen
  help                        - Show this help message
"""
        return {
            'output': help_text.strip(),
            'success': True
        }

    def _cmd_clear(self, args: List[str]) -> Dict:
        """Clear terminal (returns special clear flag)."""
        return {
            'output': '__CLEAR__',
            'success': True
        }

    def _cmd_agent(self, args: List[str]) -> Dict:
        """Handle agent commands."""
        if len(args) == 0:
            return {
                'output': "Usage: agent <list|start|stop|restart> [name]",
                'success': False
            }

        subcommand = args[0].lower()

        if subcommand == 'list':
            agents = self.agent_manager.get_all_agents_status()
            if not agents:
                return {
                    'output': "No agents configured",
                    'success': True
                }

            output = "Agents Status:\n" + "-" * 60 + "\n"
            for agent in agents:
                status_symbol = {
                    'online': '🟢',
                    'offline': '🔴',
                    'error': '⚠️'
                }.get(agent['status'], '❓')

                output += f"{status_symbol} {agent['name']:<20} {agent['status']:<10}"
                if agent.get('pid'):
                    output += f" (PID: {agent['pid']})"
                output += "\n"

            return {
                'output': output.strip(),
                'success': True
            }

        elif subcommand in ['start', 'stop', 'restart']:
            if len(args) < 2:
                return {
                    'output': f"Usage: agent {subcommand} <agent_name>",
                    'success': False
                }

            agent_name = args[1]

            if subcommand == 'start':
                result = self.agent_manager.start_agent(agent_name)
            elif subcommand == 'stop':
                result = self.agent_manager.stop_agent(agent_name)
            else:  # restart
                result = self.agent_manager.restart_agent(agent_name)

            return {
                'output': result['message'],
                'success': result['success']
            }

        else:
            return {
                'output': f"Unknown agent subcommand: {subcommand}",
                'success': False
            }

    def _cmd_memory(self, args: List[str]) -> Dict:
        """Handle memory commands."""
        if len(args) == 0:
            return {
                'output': "Usage: memory <sync|list|stats|search>",
                'success': False
            }

        subcommand = args[0].lower()

        if subcommand == 'sync':
            result = self.memory_manager.sync_memory()
            return {
                'output': result['message'],
                'success': result['success']
            }

        elif subcommand == 'list':
            tree_data = self.memory_manager.get_memory_tree()
            stats = tree_data['stats']

            output = f"Memory Files ({stats['total_files']} files)\n"
            output += "-" * 60 + "\n"
            output += self._format_tree(tree_data['tree'])

            return {
                'output': output.strip(),
                'success': True
            }

        elif subcommand == 'stats':
            stats = self.memory_manager.get_memory_stats()

            output = "Memory Statistics:\n" + "-" * 60 + "\n"
            output += f"Total Files: {stats['total_files']}\n"
            output += f"Total Size: {stats['total_size_formatted']}\n"
            output += f"Last Updated: {stats['last_updated']}\n"
            output += f"Memory Path: {stats['memory_path']}\n"

            if stats.get('extensions'):
                output += "\nBy Extension:\n"
                for ext, data in sorted(stats['extensions'].items()):
                    output += f"  {ext or 'none':<10} {data['count']:>5} files\n"

            return {
                'output': output.strip(),
                'success': True
            }

        elif subcommand == 'search':
            if len(args) < 2:
                return {
                    'output': "Usage: memory search <query>",
                    'success': False
                }

            query = ' '.join(args[1:])
            results = self.memory_manager.search_memory(query)

            if not results:
                return {
                    'output': f"No results found for: {query}",
                    'success': True
                }

            output = f"Search results for '{query}' ({len(results)} found):\n"
            output += "-" * 60 + "\n"

            for result in results[:20]:  # Limit to 20
                size = self.memory_manager._format_size(result['size'])
                output += f"{result['name']} ({size}) - {result['path']}\n"

            if len(results) > 20:
                output += f"\n... and {len(results) - 20} more"

            return {
                'output': output.strip(),
                'success': True
            }

        else:
            return {
                'output': f"Unknown memory subcommand: {subcommand}",
                'success': False
            }

    def _cmd_logs(self, args: List[str]) -> Dict:
        """Handle logs commands."""
        if len(args) == 0:
            return {
                'output': "Usage: logs <tail|source|level|search|clear|stats>",
                'success': False
            }

        subcommand = args[0].lower()

        if subcommand == 'tail':
            limit = 20
            if len(args) > 1:
                try:
                    limit = int(args[1])
                except ValueError:
                    return {
                        'output': "Invalid number for tail limit",
                        'success': False
                    }

            logs = self.logs_manager.get_latest_logs(limit)

            if not logs:
                return {
                    'output': "No logs found",
                    'success': True
                }

            output = f"Latest {len(logs)} log entries:\n" + "-" * 60 + "\n"

            for log in logs:
                output += f"[{log['timestamp']}] [{log['level']}] [{log['source']}]\n"
                output += f"  {log['message']}\n"

            return {
                'output': output.strip(),
                'success': True
            }

        elif subcommand == 'source':
            if len(args) < 2:
                return {
                    'output': "Usage: logs source <source_name>",
                    'success': False
                }

            source = args[1]
            logs = self.logs_manager.get_logs_by_source(source)

            if not logs:
                return {
                    'output': f"No logs found for source: {source}",
                    'success': True
                }

            output = f"Logs from {source} ({len(logs)} entries):\n" + "-" * 60 + "\n"

            for log in logs:
                output += f"[{log['timestamp']}] [{log['level']}] {log['message']}\n"

            return {
                'output': output.strip(),
                'success': True
            }

        elif subcommand == 'level':
            if len(args) < 2:
                return {
                    'output': "Usage: logs level <level>",
                    'success': False
                }

            level = args[1]
            logs = self.logs_manager.get_logs_by_level(level)

            if not logs:
                return {
                    'output': f"No logs found for level: {level}",
                    'success': True
                }

            output = f"Logs at level {level} ({len(logs)} entries):\n" + "-" * 60 + "\n"

            for log in logs:
                output += f"[{log['timestamp']}] [{log['source']}] {log['message']}\n"

            return {
                'output': output.strip(),
                'success': True
            }

        elif subcommand == 'search':
            if len(args) < 2:
                return {
                    'output': "Usage: logs search <query>",
                    'success': False
                }

            query = ' '.join(args[1:])
            logs = self.logs_manager.search_logs(query)

            if not logs:
                return {
                    'output': f"No logs found matching: {query}",
                    'success': True
                }

            output = f"Logs matching '{query}' ({len(logs)} entries):\n" + "-" * 60 + "\n"

            for log in logs:
                output += f"[{log['timestamp']}] [{log['level']}] [{log['source']}]\n"
                output += f"  {log['message']}\n"

            return {
                'output': output.strip(),
                'success': True
            }

        elif subcommand == 'clear':
            self.logs_manager.clear_logs()
            return {
                'output': "Logs cleared successfully",
                'success': True
            }

        elif subcommand == 'stats':
            stats = self.logs_manager.get_log_stats()

            output = "Log Statistics:\n" + "-" * 60 + "\n"
            output += f"Total Lines: {stats['total_lines']}\n"
            output += f"File Size: {stats.get('file_size_formatted', 'N/A')}\n"
            output += f"Last Modified: {stats.get('last_modified', 'Never')}\n"

            if stats.get('level_counts'):
                output += "\nBy Level:\n"
                for level, count in sorted(stats['level_counts'].items()):
                    output += f"  {level:<10} {count:>5}\n"

            return {
                'output': output.strip(),
                'success': True
            }

        else:
            return {
                'output': f"Unknown logs subcommand: {subcommand}",
                'success': False
            }

    def _cmd_status(self, args: List[str]) -> Dict:
        """Show overall system status."""
        # Get agents status
        agents = self.agent_manager.get_all_agents_status()
        online_count = sum(1 for a in agents if a['status'] == 'online')
        offline_count = sum(1 for a in agents if a['status'] == 'offline')
        error_count = sum(1 for a in agents if a['status'] == 'error')

        # Get memory stats
        memory_stats = self.memory_manager.get_memory_stats()

        # Get log stats
        log_stats = self.logs_manager.get_log_stats()

        # Get database stats
        db_stats = self.db.get_stats()

        output = "Skynet Command Center Status\n"
        output += "=" * 60 + "\n\n"

        output += "AGENTS:\n"
        output += f"  Online:  {online_count}\n"
        output += f"  Offline: {offline_count}\n"
        output += f"  Error:   {error_count}\n\n"

        output += "MEMORY:\n"
        output += f"  Files: {memory_stats['total_files']}\n"
        output += f"  Size:  {memory_stats['total_size_formatted']}\n"
        output += f"  Last Updated: {memory_stats['last_updated']}\n\n"

        output += "LOGS:\n"
        output += f"  Total Lines: {log_stats['total_lines']}\n"
        output += f"  File Size:   {log_stats.get('file_size_formatted', 'N/A')}\n\n"

        output += "DATABASE:\n"
        output += f"  Total Agents Tracked: {db_stats['total_agents']}\n"
        output += f"  Commands Executed:    {db_stats['total_commands']}\n"
        output += f"  Syncs Performed:      {db_stats['total_syncs']}\n"

        return {
            'output': output.strip(),
            'success': True
        }

    def _cmd_sync(self, args: List[str]) -> Dict:
        """Synchronize all systems."""
        output = "Synchronizing Skynet systems...\n" + "-" * 60 + "\n\n"

        # Sync memory
        memory_result = self.memory_manager.sync_memory()
        output += f"Memory: {memory_result['message']}\n"

        # Refresh agents
        agents = self.agent_manager.get_all_agents_status()
        output += f"Agents: Refreshed status for {len(agents)} agents\n"

        output += "\nSynchronization complete!"

        return {
            'output': output.strip(),
            'success': True
        }

    def _cmd_history(self, args: List[str]) -> Dict:
        """Show command history."""
        limit = 20
        if len(args) > 0:
            try:
                limit = int(args[0])
            except ValueError:
                return {
                    'output': "Invalid number for history limit",
                    'success': False
                }

        history = self.db.get_terminal_history(limit)

        if not history:
            return {
                'output': "No command history found",
                'success': True
            }

        output = f"Command History (last {len(history)}):\n" + "-" * 60 + "\n"

        for entry in reversed(history):  # Show oldest first
            timestamp = entry['timestamp']
            command = entry['command']
            success = "✓" if entry['success'] else "✗"
            output += f"[{timestamp}] {success} {command}\n"

        return {
            'output': output.strip(),
            'success': True
        }

    def _format_tree(self, node: Dict, indent: int = 0, max_depth: int = 3) -> str:
        """Format tree structure for display."""
        if indent > max_depth:
            return ""

        output = ""
        prefix = "  " * indent

        if node['type'] == 'directory':
            output += f"{prefix}📁 {node['name']}/\n"
            for child in node.get('children', [])[:10]:  # Limit children
                output += self._format_tree(child, indent + 1, max_depth)
            if len(node.get('children', [])) > 10:
                output += f"{prefix}  ... and {len(node['children']) - 10} more\n"
        else:
            size = self.memory_manager._format_size(node.get('size', 0))
            output += f"{prefix}📄 {node['name']} ({size})\n"

        return output


# Global terminal engine instance
_terminal_engine = None


def get_terminal_engine() -> TerminalEngine:
    """
    Get global terminal engine instance (singleton pattern).

    Returns:
        TerminalEngine instance
    """
    global _terminal_engine
    if _terminal_engine is None:
        _terminal_engine = TerminalEngine()
    return _terminal_engine


if __name__ == "__main__":
    # Test terminal engine
    terminal = TerminalEngine()
    print("Terminal Engine initialized successfully!")

    # Test commands
    result = terminal.execute("help")
    print(result['output'])
