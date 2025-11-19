"""
Connect Command - Connect agent to MCP server via WebSocket
"""

import asyncio
import json
import logging
import typer
from typing import Optional
from rich import print
from rich.console import Console
import websockets
from websockets.exceptions import WebSocketException


console = Console()
logger = logging.getLogger(__name__)


async def websocket_connect(
    server_url: str,
    agent_id: str,
    agent_type: str,
    channels: str,
    priority: int
):
    """
    Establish WebSocket connection and handle messages.

    Args:
        server_url: WebSocket server URL
        agent_id: Agent identifier
        agent_type: Agent type
        channels: Comma-separated channels
        priority: Agent priority
    """
    # Build WebSocket URL with query parameters
    ws_url = f"{server_url}?agent_id={agent_id}&agent_type={agent_type}&channels={channels}&priority={priority}"

    console.print(f"\n[cyan]🔌 Connecting to MCP Server...[/cyan]")
    console.print(f"[dim]Server:[/dim] {server_url}")
    console.print(f"[dim]Agent ID:[/dim] {agent_id}")
    console.print(f"[dim]Type:[/dim] {agent_type}")
    console.print(f"[dim]Channels:[/dim] {channels}")
    console.print(f"[dim]Priority:[/dim] {priority}\n")

    try:
        async with websockets.connect(ws_url) as websocket:
            console.print("[green]✅ Connected successfully![/green]\n")

            # Listen for messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    msg_type = data.get("type")

                    if msg_type == "control":
                        handle_control_message(data.get("data", {}))

                    elif msg_type == "mcp_message":
                        handle_mcp_message(data.get("data", {}))

                    elif msg_type == "error":
                        handle_error_message(data.get("data", {}))

                    else:
                        console.print(f"[yellow]⚠️  Unknown message type: {msg_type}[/yellow]")

                except json.JSONDecodeError:
                    console.print("[red]❌ Invalid JSON received[/red]")
                except Exception as e:
                    console.print(f"[red]❌ Error handling message: {e}[/red]")

    except WebSocketException as e:
        console.print(f"[red]❌ WebSocket error: {e}[/red]")
    except KeyboardInterrupt:
        console.print("\n[yellow]🛑 Disconnecting...[/yellow]")
    except Exception as e:
        console.print(f"[red]❌ Connection error: {e}[/red]")


def handle_control_message(data: dict):
    """Handle control messages from server"""
    action = data.get("action")
    params = data.get("params", {})

    if action == "connected":
        console.print(f"[green]✅ {params.get('message', 'Connected')}[/green]")
        console.print(f"[dim]Server time: {params.get('server_time', 'N/A')}[/dim]\n")
        console.print("[cyan]Listening for messages...[/cyan]")
        console.print("[dim]Press Ctrl+C to disconnect[/dim]\n")

    elif action == "ping":
        console.print("[dim]💓 Heartbeat ping received[/dim]")

    elif action == "pong":
        console.print("[dim]💓 Heartbeat pong sent[/dim]")

    elif action == "subscribed":
        console.print(f"[green]✅ Subscribed to channel: {params.get('channel')}[/green]")

    elif action == "unsubscribed":
        console.print(f"[yellow]🔕 Unsubscribed from channel: {params.get('channel')}[/yellow]")

    else:
        console.print(f"[cyan]ℹ️  Control: {action} | {params}[/cyan]")


def handle_mcp_message(data: dict):
    """Handle MCP messages"""
    from_agent = data.get("from_agent", "unknown")
    to_agent = data.get("to_agent", "broadcast")
    msg_type = data.get("type", "unknown")
    content = data.get("payload", {}).get("content", "")
    message_id = data.get("id", "")[:8]

    console.print(f"\n[bold green]📨 Message Received[/bold green]")
    console.print(f"[cyan]From:[/cyan] {from_agent}")
    console.print(f"[cyan]To:[/cyan] {to_agent}")
    console.print(f"[cyan]Type:[/cyan] {msg_type}")
    console.print(f"[cyan]ID:[/cyan] {message_id}")
    console.print(f"[cyan]Content:[/cyan]\n{content}\n")


def handle_error_message(data: dict):
    """Handle error messages"""
    error = data.get("error", "Unknown error")
    error_code = data.get("error_code", "ERROR")

    console.print(f"\n[red]❌ Error from server:[/red]")
    console.print(f"[red]Code:[/red] {error_code}")
    console.print(f"[red]Message:[/red] {error}\n")


def connect_command(
    agent_id: str = typer.Option(..., "--agent-id", "-a", help="Agent identifier"),
    agent_type: str = typer.Option("generic", "--type", "-t", help="Agent type (planner, coder, researcher, etc.)"),
    server: str = typer.Option("ws://localhost:8000/ws", "--server", "-s", help="MCP server WebSocket URL"),
    channels: str = typer.Option("default", "--channels", "-c", help="Comma-separated channels to subscribe"),
    priority: int = typer.Option(5, "--priority", "-p", help="Agent priority (1-10)", min=1, max=10),
):
    """
    Connect this terminal/agent to the MCP server.

    Example:
        skynet-linker connect --agent-id claude_cli --type planner --channels skynet_core,default
    """
    # Run async connection
    asyncio.run(websocket_connect(
        server_url=server,
        agent_id=agent_id,
        agent_type=agent_type,
        channels=channels,
        priority=priority
    ))
