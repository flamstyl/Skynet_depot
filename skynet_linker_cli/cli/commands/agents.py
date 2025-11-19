"""
Agents Command - List and inspect connected agents
"""

import typer
import httpx
from rich import print
from rich.console import Console
from rich.table import Table


console = Console()


async def list_agents_async(server_url: str):
    """
    List all connected agents.

    Args:
        server_url: REST API URL
    """
    endpoint = f"{server_url}/agents"

    console.print("\n[cyan]👥 Fetching connected agents...[/cyan]\n")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(endpoint, timeout=10.0)

            if response.status_code == 200:
                result = response.json()

                agents = result.get("agents", [])
                total = result.get("total", 0)

                if total == 0:
                    console.print("[yellow]No agents currently connected[/yellow]")
                    return

                # Create table
                table = Table(title=f"Connected Agents ({total})")

                table.add_column("Agent ID", style="cyan", no_wrap=True)
                table.add_column("Type", style="green")
                table.add_column("Priority", justify="center")
                table.add_column("Channels", style="yellow")
                table.add_column("Messages", justify="right")
                table.add_column("Connected Since", style="dim")

                for agent in agents:
                    table.add_row(
                        agent.get("agent_id", "N/A"),
                        agent.get("agent_type", "N/A"),
                        str(agent.get("priority", "N/A")),
                        ", ".join(agent.get("channels", [])),
                        str(agent.get("message_count", 0)),
                        agent.get("connected_at", "N/A")[:19] if agent.get("connected_at") else "N/A"
                    )

                console.print(table)

            else:
                console.print(f"[red]❌ HTTP {response.status_code}: {response.text}[/red]")

    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")


def agents_command(
    server: str = typer.Option("http://localhost:8000", "--server", "-s", help="MCP REST API URL"),
):
    """
    List all connected agents.

    Example:
        skynet-linker agents
    """
    import asyncio

    asyncio.run(list_agents_async(server))
