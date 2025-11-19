"""
Claude CLI Connector
Connects to Claude via command-line interface
"""

import asyncio
import subprocess
from typing import Dict, Any
from . import IAConnector


class ClaudeConnector(IAConnector):
    """
    Connector for Claude CLI
    Uses subprocess to communicate with Claude command-line tool
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Claude connector

        Args:
            config: Configuration dict with:
                - command: CLI command (default: "claude")
                - timeout_seconds: Command timeout
                - max_tokens: Maximum tokens per request
        """
        super().__init__(config)
        self.command = config.get("command", "claude")
        self.max_tokens = config.get("max_tokens", 4096)

    async def send(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send message to Claude CLI

        Args:
            payload: Message payload with 'content' and optional 'context'

        Returns:
            Response dict with content, tokens_used, model
        """
        content = payload.get("content", "")
        context = payload.get("context", {})

        # Build command
        # TODO: Customize command based on context (e.g., add --context-file)
        cmd = [self.command]

        # Add content as stdin
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            # Send content and wait for response
            stdout, stderr = await asyncio.wait_for(
                process.communicate(input=content.encode('utf-8')),
                timeout=self.timeout
            )

            if process.returncode != 0:
                raise Exception(f"Claude CLI error: {stderr.decode('utf-8')}")

            response_text = stdout.decode('utf-8').strip()

            # TODO: Parse actual token usage from Claude CLI output if available
            # For now, estimate based on content length
            estimated_tokens = len(response_text.split()) * 1.3

            return {
                "content": response_text,
                "tokens_used": int(estimated_tokens),
                "model": "claude-sonnet-4.5"  # TODO: Detect actual model
            }

        except asyncio.TimeoutError:
            raise asyncio.TimeoutError(f"Claude CLI timeout after {self.timeout}s")
        except Exception as e:
            raise Exception(f"Claude connector error: {str(e)}")

    async def health_check(self) -> bool:
        """
        Check if Claude CLI is available

        Returns:
            True if Claude CLI responds, False otherwise
        """
        try:
            process = await asyncio.create_subprocess_exec(
                self.command,
                "--version",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            await asyncio.wait_for(process.communicate(), timeout=5)
            return process.returncode == 0

        except Exception:
            return False


# Example usage
if __name__ == "__main__":
    async def test_claude():
        connector = ClaudeConnector({
            "command": "claude",
            "timeout_seconds": 30,
            "max_tokens": 2048
        })

        # Health check
        is_healthy = await connector.health_check()
        print(f"Claude healthy: {is_healthy}")

        if is_healthy:
            # Send test message
            response = await connector.send({
                "content": "What is 2+2?",
                "context": {}
            })
            print(f"Response: {response}")

    asyncio.run(test_claude())
