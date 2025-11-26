"""
Monitor Command - Monitor messages in real-time
"""

import asyncio
import json
import typer
from rich import print
from rich.console import Console
from rich.live import Live
from rich.table import Table
from datetime import datetime
import websockets


console = Console()


async def monitor_messages(
    server_url: str,
    channel: str,
    agent_id: str,
    max_messages: int
):
    """
    Monitor messages in real-time via WebSocket.

    Args:
        server_url: WebSocket server URL
        channel: Channel to monitor
        agent_id: Monitor agent ID
        max_messages: Maximum messages to display
    """
    # Use a monitor agent ID
    monitor_agent_id = f"{agent_id}_monitor"

    ws_url = f"{server_url}?agent_id={monitor_agent_id}&agent_type=monitor&channels={channel}&priority=1"

    console.print(f"\n[cyan]📊 Starting message monitor...[/cyan]")
    console.print(f"[dim]Channel:[/dim] {channel}")
    console.print(f"[dim]Server:[/dim] {server_url}\n")
    console.print("[cyan]Listening for messages...[/cyan]")
    console.print("[dim]Press Ctrl+C to stop[/dim]\n")

    messages = []

    try:
        async with websockets.connect(ws_url) as websocket:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    msg_type = data.get("type")

                    if msg_type == "mcp_message":
                        mcp_msg = data.get("data", {})

                        # Format message for display
                        timestamp = datetime.now().strftime("%H:%M:%S")
                        from_agent = mcp_msg.get("from_agent", "unknown")
                        to_agent = mcp_msg.get("to_agent", "broadcast")
                        message_type = mcp_msg.get("type", "unknown")
                        content = str(mcp_msg.get("payload", {}).get("content", ""))[:50]

                        message_entry = {
                            "timestamp": timestamp,
                            "from": from_agent,
                            "to": to_agent,
                            "type": message_type,
                            "content": content
                        }

                        messages.append(message_entry)

                        # Keep only last N messages
                        if len(messages) > max_messages:
                            messages.pop(0)

                        # Display message
                        console.print(
                            f"[cyan][{timestamp}][/cyan] "
                            f"[green]{from_agent}[/green] → [yellow]{to_agent}[/yellow]: "
                            f"[dim]{message_type}[/dim] | {content}..."
                        )

                    elif msg_type == "control":
                        # Ignore control messages in monitor mode
                        pass

                except json.JSONDecodeError:
                    pass
                except Exception as e:
                    console.print(f"[red]Error: {e}[/red]")

    except KeyboardInterrupt:
        console.print("\n[yellow]🛑 Monitoring stopped[/yellow]")
    except Exception as e:
        console.print(f"\n[red]❌ Error: {e}[/red]")


def monitor_command(
    channel: str = typer.Option("default", "--channel", "-c", help="Channel to monitor"),
    server: str = typer.Option("ws://localhost:8000/ws", "--server", "-s", help="MCP WebSocket URL"),
    agent_id: str = typer.Option("cli", "--agent-id", "-a", help="Monitor agent base ID"),
    max_messages: int = typer.Option(100, "--max", "-m", help="Max messages to keep in view"),
):
    """
    Monitor messages in real-time.

    Example:
        skynet-linker monitor --channel skynet_core
    """
    asyncio.run(monitor_messages(server, channel, agent_id, max_messages))
