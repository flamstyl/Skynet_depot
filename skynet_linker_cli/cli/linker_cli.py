#!/usr/bin/env python3
"""
Skynet Linker CLI - Command-line interface for MCP agent coordination

Main CLI entry point using Typer.
"""

import typer
from typing import Optional
from rich import print
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

# Import commands
from cli.commands import connect, send, context, agents, monitor


# Create main Typer app
app = typer.Typer(
    name="skynet-linker",
    help="🤖 Skynet Linker CLI - Multi-AI Communication & Coordination",
    add_completion=False,
    rich_markup_mode="rich"
)

console = Console()


# ========== MAIN COMMANDS ==========

# Register command modules
app.command(name="connect", help="🔌 Connect this terminal/agent to MCP server")(connect.connect_command)
app.command(name="send", help="📤 Send a message to an agent or channel")(send.send_command)
app.command(name="context", help="🧠 Manage agent context (push/pull)")(context.context_command)
app.command(name="agents", help="👥 List connected agents")(agents.agents_command)
app.command(name="monitor", help="📊 Monitor messages in real-time")(monitor.monitor_command)


# ========== INFO COMMANDS ==========

@app.command(name="version")
def version():
    """Show Skynet Linker version"""
    print(Panel(
        "[bold cyan]Skynet Linker CLI[/bold cyan]\n"
        "[yellow]Version:[/yellow] 1.0.0\n"
        "[yellow]Protocol:[/yellow] MCP/1.0\n"
        "[yellow]Author:[/yellow] Skynet Development Team",
        title="🤖 Version Info",
        border_style="cyan"
    ))


@app.command(name="config")
def show_config(
    config_file: str = typer.Option("cli/config.yaml", "--file", "-f", help="Config file path")
):
    """Show current configuration"""
    import yaml
    from pathlib import Path

    config_path = Path(config_file)

    if not config_path.exists():
        print(f"[red]❌ Config file not found: {config_file}[/red]")
        raise typer.Exit(1)

    with open(config_path) as f:
        config = yaml.safe_load(f)

    print(Panel(
        f"[bold]Configuration from:[/bold] {config_file}\n\n"
        f"[cyan]Server:[/cyan] {config.get('server', {}).get('url', 'N/A')}\n"
        f"[cyan]Default Channel:[/cyan] {config.get('default_channel', 'default')}\n"
        f"[cyan]Encryption:[/cyan] {config.get('encryption', {}).get('enabled', False)}",
        title="⚙️  Configuration",
        border_style="green"
    ))


# ========== MAIN ENTRY POINT ==========

def main():
    """Main CLI entry point"""
    app()


if __name__ == "__main__":
    main()
