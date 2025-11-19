#!/usr/bin/env python3
"""
🟣 Grok CLI - Main Entry Point
Advanced Local AI Development Copilot
"""

import asyncio
import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt

from core.analyzer import ProjectAnalyzer
from core.executor import CommandExecutor
from core.generator import CodeGenerator
from core.memory import MemorySystem
from core.diagnostics import DiagnosticEngine
from rag.vectorstore import VectorStore
from config import load_config

app = typer.Typer(
    name="grok",
    help="🟣 Grok CLI - Advanced Local AI Development Copilot",
    add_completion=False,
)
console = Console()


class GrokCLI:
    """Main Grok CLI orchestrator"""

    def __init__(self, project_path: Path, config: dict):
        self.project_path = project_path
        self.config = config
        self.console = console

        # Initialize components
        self.analyzer = ProjectAnalyzer(project_path, config)
        self.executor = CommandExecutor(config)
        self.generator = CodeGenerator(config)
        self.memory = MemorySystem(config)
        self.diagnostics = DiagnosticEngine(config)
        self.vectorstore = VectorStore(config) if config["rag"]["enabled"] else None

        self.running = False

    async def initialize(self):
        """Initialize Grok CLI and analyze project"""
        self.console.print(
            Panel.fit(
                "[bold cyan]🟣 Grok CLI v2.0.0 PRO[/bold cyan]\n"
                "[dim]Initializing autonomous development copilot...[/dim]",
                border_style="cyan",
            )
        )

        # Analyze project structure
        self.console.print("\n[yellow]📂 Analyzing project structure...[/yellow]")
        analysis = await self.analyzer.analyze_full_project()

        # Display summary
        self.console.print(f"\n[green]✓[/green] Project: {analysis['name']}")
        self.console.print(f"[green]✓[/green] Type: {', '.join(analysis['types'])}")
        self.console.print(f"[green]✓[/green] Files: {analysis['file_count']}")
        self.console.print(f"[green]✓[/green] Languages: {', '.join(analysis['languages'])}")

        # Index for RAG if enabled
        if self.vectorstore:
            self.console.print("\n[yellow]🧠 Indexing project for RAG...[/yellow]")
            await self.vectorstore.index_project(analysis)
            self.console.print("[green]✓[/green] RAG index ready")

        # Store in memory
        self.memory.store_long_term("project_analysis", analysis)

        self.console.print(
            f"\n[bold green]✓ Initialization complete[/bold green]\n"
        )
        self.console.print(
            Panel.fit(
                "[bold cyan]🔧 Grok CLI prêt à prendre le contrôle[/bold cyan]",
                border_style="green",
            )
        )

    async def run_interactive(self):
        """Run interactive REPL mode"""
        self.running = True
        self.console.print(
            "[dim]Type your commands or questions. 'exit' to quit.[/dim]\n"
        )

        while self.running:
            try:
                # Get user input
                user_input = Prompt.ask("\n[bold cyan]grok>[/bold cyan]")

                if not user_input.strip():
                    continue

                if user_input.lower() in ["exit", "quit", "q"]:
                    self.console.print("[yellow]👋 Exiting Grok CLI...[/yellow]")
                    break

                # Process command
                await self.process_input(user_input)

            except KeyboardInterrupt:
                self.console.print("\n[yellow]Use 'exit' to quit[/yellow]")
            except Exception as e:
                self.console.print(f"[red]Error: {e}[/red]")

    async def process_input(self, user_input: str):
        """Process user input and execute appropriate action"""
        # Store in short-term memory
        self.memory.store_short_term("user_input", user_input)

        # Detect intent
        if user_input.startswith("!"):
            # Direct shell command
            command = user_input[1:].strip()
            await self.executor.execute_shell(command)

        elif user_input.startswith("/"):
            # Special commands
            await self.handle_special_command(user_input)

        else:
            # Natural language query - use AI
            await self.handle_natural_language(user_input)

    async def handle_special_command(self, command: str):
        """Handle special slash commands"""
        parts = command.split()
        cmd = parts[0].lower()

        if cmd == "/analyze":
            analysis = await self.analyzer.analyze_full_project()
            self.console.print_json(data=analysis)

        elif cmd == "/test":
            results = await self.diagnostics.run_all_tests()
            self.diagnostics.display_results(results)

        elif cmd == "/fix":
            await self.diagnostics.auto_fix_errors()

        elif cmd == "/memory":
            self.memory.display_summary()

        elif cmd == "/help":
            self.display_help()

        else:
            self.console.print(f"[red]Unknown command: {cmd}[/red]")

    async def handle_natural_language(self, query: str):
        """Handle natural language queries using AI"""
        self.console.print("[dim]Processing...[/dim]")

        # Get relevant context from RAG if enabled
        context = None
        if self.vectorstore:
            context = await self.vectorstore.search(query, top_k=5)

        # Generate response
        response = await self.generator.generate_response(
            query=query,
            context=context,
            memory=self.memory.get_recent(),
        )

        self.console.print(f"\n{response}\n")

    def display_help(self):
        """Display help information"""
        help_text = """
[bold cyan]Grok CLI Commands:[/bold cyan]

[yellow]Direct Commands:[/yellow]
  !<command>        Execute shell command directly

[yellow]Special Commands:[/yellow]
  /analyze          Analyze full project structure
  /test             Run all tests and diagnostics
  /fix              Auto-fix detected errors
  /memory           Show memory summary
  /help             Show this help

[yellow]Natural Language:[/yellow]
  Just type your question or request naturally
  Examples:
    - "What does this project do?"
    - "Fix the authentication bug"
    - "Generate a new API endpoint for users"
    - "Run tests and fix any failures"
"""
        self.console.print(Panel(help_text, border_style="cyan"))


@app.command()
def start(
    project: Optional[str] = typer.Argument(
        None, help="Project directory (default: current directory)"
    ),
    config_file: Optional[str] = typer.Option(
        None, "--config", "-c", help="Custom config file"
    ),
):
    """Start Grok CLI in interactive mode"""
    project_path = Path(project) if project else Path.cwd()

    if not project_path.exists():
        console.print(f"[red]Error: Project path does not exist: {project_path}[/red]")
        raise typer.Exit(1)

    # Load configuration
    config = load_config(config_file)

    # Create and run Grok CLI
    grok = GrokCLI(project_path, config)

    async def run():
        await grok.initialize()
        await grok.run_interactive()

    asyncio.run(run())


@app.command()
def serve(
    port: int = typer.Option(8100, "--port", "-p", help="API server port"),
    mcp: bool = typer.Option(True, "--mcp/--no-mcp", help="Enable MCP server"),
    dashboard: bool = typer.Option(True, "--dashboard/--no-dashboard", help="Enable dashboard"),
):
    """Start Grok CLI as a service (API + MCP + Dashboard)"""
    console.print(
        Panel.fit(
            "[bold cyan]🟣 Starting Grok CLI Services[/bold cyan]",
            border_style="cyan",
        )
    )

    # TODO: Implement service mode
    console.print("[yellow]Service mode coming soon...[/yellow]")


@app.command()
def version():
    """Show Grok CLI version"""
    from . import __version__

    console.print(f"[cyan]Grok CLI version {__version__}[/cyan]")


if __name__ == "__main__":
    app()
