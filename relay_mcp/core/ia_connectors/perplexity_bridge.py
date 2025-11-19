"""
Perplexity Bridge Connector
Connects to Perplexity via file watcher (drop-in/outbox pattern)
"""

import asyncio
import json
import os
from pathlib import Path
from typing import Dict, Any
from datetime import datetime, timezone
from . import IAConnector


class PerplexityConnector(IAConnector):
    """
    Connector for Perplexity using file-based communication

    Pattern:
    1. Write request to inbox/{message_id}.json
    2. Poll for response in outbox/{message_id}.json
    3. Clean up after reading response
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Perplexity connector

        Args:
            config: Configuration dict with:
                - inbox_path: Path to inbox directory
                - outbox_path: Path to outbox directory
                - poll_interval_seconds: How often to check for responses
                - timeout_seconds: Overall timeout for response
        """
        super().__init__(config)
        self.inbox_path = Path(config.get("inbox_path", "data/perplexity/inbox"))
        self.outbox_path = Path(config.get("outbox_path", "data/perplexity/outbox"))
        self.poll_interval = config.get("poll_interval_seconds", 5)

        # Create directories if they don't exist
        self.inbox_path.mkdir(parents=True, exist_ok=True)
        self.outbox_path.mkdir(parents=True, exist_ok=True)

    async def send(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send message to Perplexity via file drop

        Args:
            payload: Message payload with 'content' and optional 'context'

        Returns:
            Response dict with content, tokens_used, model
        """
        content = payload.get("content", "")
        context = payload.get("context", {})

        # Generate unique message ID
        message_id = f"msg_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S_%f')}"

        # Write request to inbox
        request_file = self.inbox_path / f"{message_id}.json"
        request_data = {
            "message_id": message_id,
            "content": content,
            "context": context,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        with open(request_file, 'w') as f:
            json.dump(request_data, f, indent=2)

        print(f"Wrote request to {request_file}")

        # Poll for response
        response_file = self.outbox_path / f"{message_id}.json"
        start_time = asyncio.get_event_loop().time()

        while True:
            # Check timeout
            if asyncio.get_event_loop().time() - start_time > self.timeout:
                # Clean up request
                request_file.unlink(missing_ok=True)
                raise asyncio.TimeoutError(
                    f"Perplexity response timeout after {self.timeout}s"
                )

            # Check for response file
            if response_file.exists():
                try:
                    with open(response_file, 'r') as f:
                        response_data = json.load(f)

                    # Clean up files
                    request_file.unlink(missing_ok=True)
                    response_file.unlink(missing_ok=True)

                    return {
                        "content": response_data.get("content", ""),
                        "tokens_used": response_data.get("tokens_used", 0),
                        "model": response_data.get("model", "perplexity")
                    }

                except Exception as e:
                    print(f"Error reading response: {e}")

            # Wait before next poll
            await asyncio.sleep(self.poll_interval)

    async def health_check(self) -> bool:
        """
        Check if Perplexity bridge directories are accessible

        Returns:
            True if directories exist and are writable
        """
        try:
            # Check if directories exist
            if not self.inbox_path.exists() or not self.outbox_path.exists():
                return False

            # Try writing test file
            test_file = self.inbox_path / ".health_check"
            test_file.write_text("ok")
            test_file.unlink()

            return True

        except Exception:
            return False


# Example usage and mock responder
async def mock_perplexity_responder(connector: PerplexityConnector, duration_seconds: int = 60):
    """
    Mock responder that watches inbox and generates responses

    This simulates what an actual Perplexity agent would do:
    1. Watch inbox for new requests
    2. Generate response
    3. Write to outbox
    """
    print(f"Mock Perplexity responder started (watching {connector.inbox_path})")

    start_time = asyncio.get_event_loop().time()

    while asyncio.get_event_loop().time() - start_time < duration_seconds:
        # Check inbox for new requests
        for request_file in connector.inbox_path.glob("*.json"):
            if request_file.name.startswith("."):
                continue

            try:
                # Read request
                with open(request_file, 'r') as f:
                    request_data = json.load(f)

                message_id = request_data.get("message_id")
                content = request_data.get("content", "")

                print(f"Mock responder processing: {message_id}")

                # Simulate processing delay
                await asyncio.sleep(2)

                # Generate mock response
                response_data = {
                    "message_id": message_id,
                    "content": f"[PERPLEXITY MOCK] Answer to '{content[:50]}...': This is a simulated response.",
                    "tokens_used": 75,
                    "model": "perplexity-mock",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

                # Write response to outbox
                response_file = connector.outbox_path / f"{message_id}.json"
                with open(response_file, 'w') as f:
                    json.dump(response_data, f, indent=2)

                print(f"Mock responder wrote response to {response_file}")

            except Exception as e:
                print(f"Mock responder error: {e}")

        await asyncio.sleep(connector.poll_interval)

    print("Mock Perplexity responder stopped")


if __name__ == "__main__":
    async def test_perplexity():
        connector = PerplexityConnector({
            "inbox_path": "data/perplexity_test/inbox",
            "outbox_path": "data/perplexity_test/outbox",
            "poll_interval_seconds": 2,
            "timeout_seconds": 30
        })

        # Health check
        is_healthy = await connector.health_check()
        print(f"Perplexity healthy: {is_healthy}")

        # Start mock responder in background
        responder_task = asyncio.create_task(
            mock_perplexity_responder(connector, duration_seconds=30)
        )

        # Send test message
        await asyncio.sleep(1)  # Let responder start
        response = await connector.send({
            "content": "What is the capital of France?",
            "context": {}
        })
        print(f"Response: {response}")

        # Wait for responder to finish
        await responder_task

    asyncio.run(test_perplexity())
