"""
Context Command - Manage agent context (push/pull)
"""

import json
import typer
import httpx
from typing import Optional
from pathlib import Path
from rich import print
from rich.console import Console
from rich.json import JSON


console = Console()


async def push_context_async(
    agent_id: str,
    context_file: str,
    server_url: str
):
    """
    Push context to server.

    Args:
        agent_id: Agent identifier
        context_file: Path to context JSON file
        server_url: REST API URL
    """
    context_path = Path(context_file)

    if not context_path.exists():
        console.print(f"[red]❌ Context file not found: {context_file}[/red]")
        raise typer.Exit(1)

    with open(context_path) as f:
        try:
            context_data = json.load(f)
        except json.JSONDecodeError as e:
            console.print(f"[red]❌ Invalid JSON: {e}[/red]")
            raise typer.Exit(1)

    endpoint = f"{server_url}/context"

    console.print(f"\n[cyan]⬆️  Pushing context for {agent_id}...[/cyan]")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                endpoint,
                json={"agent_id": agent_id, "context": context_data},
                timeout=10.0
            )

            if response.status_code == 200:
                result = response.json()

                if result.get("success"):
                    console.print("[green]✅ Context pushed successfully![/green]")
                else:
                    console.print(f"[red]❌ Failed: {result.get('error', 'Unknown error')}[/red]")
            else:
                console.print(f"[red]❌ HTTP {response.status_code}: {response.text}[/red]")

    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")


async def pull_context_async(
    agent_id: str,
    output_file: Optional[str],
    server_url: str
):
    """
    Pull context from server.

    Args:
        agent_id: Agent identifier
        output_file: Output file path (optional)
        server_url: REST API URL
    """
    endpoint = f"{server_url}/context/{agent_id}"

    console.print(f"\n[cyan]⬇️  Pulling context for {agent_id}...[/cyan]")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(endpoint, timeout=10.0)

            if response.status_code == 200:
                result = response.json()

                if result.get("success"):
                    context = result.get("context", {})

                    console.print("[green]✅ Context retrieved![/green]\n")

                    # Display context
                    console.print(JSON(json.dumps(context, indent=2)))

                    # Save to file if requested
                    if output_file:
                        output_path = Path(output_file)
                        with open(output_path, 'w') as f:
                            json.dump(context, f, indent=2)

                        console.print(f"\n[green]💾 Saved to: {output_file}[/green]")

                else:
                    console.print(f"[yellow]⚠️  {result.get('error', 'Context not found')}[/yellow]")

            elif response.status_code == 404:
                console.print(f"[yellow]⚠️  No context found for {agent_id}[/yellow]")

            else:
                console.print(f"[red]❌ HTTP {response.status_code}: {response.text}[/red]")

    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")


def context_command(
    action: str = typer.Argument(..., help="Action: 'push' or 'pull'"),
    agent_id: str = typer.Option(..., "--agent-id", "-a", help="Agent identifier"),
    context_file: Optional[str] = typer.Option(None, "--file", "-f", help="Context JSON file (for push)"),
    output: Optional[str] = typer.Option(None, "--output", "-o", help="Output file (for pull)"),
    server: str = typer.Option("http://localhost:8000", "--server", "-s", help="MCP REST API URL"),
):
    """
    Manage agent context.

    Examples:
        # Push context to server
        skynet-linker context push --agent-id claude_cli --file context.json

        # Pull context from server
        skynet-linker context pull --agent-id claude_cli --output context_local.json
    """
    import asyncio

    if action == "push":
        if not context_file:
            console.print("[red]❌ --file required for push action[/red]")
            raise typer.Exit(1)

        asyncio.run(push_context_async(agent_id, context_file, server))

    elif action == "pull":
        asyncio.run(pull_context_async(agent_id, output, server))

    else:
        console.print(f"[red]❌ Unknown action: {action}. Use 'push' or 'pull'[/red]")
        raise typer.Exit(1)
