"""
Send Command - Send messages to agents or channels via REST API
"""

import json
import typer
import httpx
from typing import Optional
from pathlib import Path
from rich import print
from rich.console import Console


console = Console()


async def send_message_async(
    from_agent: str,
    to_agent: Optional[str],
    content: str,
    msg_type: str,
    channel: str,
    server_url: str,
    payload_file: Optional[str]
):
    """
    Send message to MCP server via REST API.

    Args:
        from_agent: Sender agent ID
        to_agent: Recipient agent ID (None for broadcast)
        content: Message content
        msg_type: Message type
        channel: Channel name
        server_url: REST API server URL
        payload_file: Path to JSON payload file (optional)
    """
    # Load payload from file if provided
    if payload_file:
        payload_path = Path(payload_file)

        if not payload_path.exists():
            console.print(f"[red]❌ Payload file not found: {payload_file}[/red]")
            raise typer.Exit(1)

        with open(payload_path) as f:
            try:
                payload_data = json.load(f)
                content = payload_data.get("content", content)
                msg_type = payload_data.get("type", msg_type)
                to_agent = payload_data.get("to_agent", to_agent)
                channel = payload_data.get("channel", channel)
            except json.JSONDecodeError as e:
                console.print(f"[red]❌ Invalid JSON in payload file: {e}[/red]")
                raise typer.Exit(1)

    # Build request
    endpoint = f"{server_url}/messages/send"

    request_body = {
        "from_agent": from_agent,
        "to_agent": to_agent,
        "type": msg_type,
        "channel": channel,
        "content": content,
        "context": {},
        "meta": {},
        "encrypt": False
    }

    console.print("\n[cyan]📤 Sending message...[/cyan]")
    console.print(f"[dim]From:[/dim] {from_agent}")
    console.print(f"[dim]To:[/dim] {to_agent or f'broadcast on {channel}'}")
    console.print(f"[dim]Type:[/dim] {msg_type}")
    console.print(f"[dim]Content:[/dim] {content[:100]}...\n" if len(content) > 100 else f"[dim]Content:[/dim] {content}\n")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=request_body, timeout=10.0)

            if response.status_code == 200:
                result = response.json()

                if result.get("success"):
                    console.print("[green]✅ Message sent successfully![/green]")
                    console.print(f"[dim]Message ID:[/dim] {result.get('message_id', 'N/A')[:16]}...")
                    console.print(f"[dim]Recipients:[/dim] {', '.join(result.get('recipients', []))}")
                else:
                    console.print(f"[red]❌ Failed to send: {result.get('error', 'Unknown error')}[/red]")

            else:
                console.print(f"[red]❌ HTTP {response.status_code}: {response.text}[/red]")

    except httpx.TimeoutException:
        console.print("[red]❌ Request timed out[/red]")
    except httpx.ConnectError:
        console.print(f"[red]❌ Could not connect to server: {server_url}[/red]")
    except Exception as e:
        console.print(f"[red]❌ Error sending message: {e}[/red]")


def send_command(
    from_agent: str = typer.Option(..., "--from", "-f", help="Sender agent ID"),
    to_agent: Optional[str] = typer.Option(None, "--to", "-t", help="Recipient agent ID (omit for broadcast)"),
    content: str = typer.Option("", "--content", "-c", help="Message content"),
    msg_type: str = typer.Option("task", "--type", help="Message type (task, reply, broadcast, etc.)"),
    channel: str = typer.Option("default", "--channel", help="Channel name (for broadcasts)"),
    server: str = typer.Option("http://localhost:8000", "--server", "-s", help="MCP REST API URL"),
    payload_file: Optional[str] = typer.Option(None, "--payload-file", "-p", help="Path to JSON payload file"),
):
    """
    Send a message to an agent or channel.

    Examples:
        # Direct message
        skynet-linker send --from claude_cli --to gemini --content "Research RAG papers"

        # Broadcast
        skynet-linker send --from claude_cli --type broadcast --channel skynet_core --content "Task complete"

        # From JSON file
        skynet-linker send --from claude_cli --payload-file task.json
    """
    import asyncio

    asyncio.run(send_message_async(
        from_agent=from_agent,
        to_agent=to_agent,
        content=content,
        msg_type=msg_type,
        channel=channel,
        server_url=server,
        payload_file=payload_file
    ))
