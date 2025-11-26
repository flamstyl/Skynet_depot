"""
Gemini CLI Connector
Connects to Google Gemini via command-line interface
"""

import asyncio
import subprocess
from typing import Dict, Any
from . import IAConnector


class GeminiConnector(IAConnector):
    """
    Connector for Gemini CLI
    Uses subprocess to communicate with Gemini command-line tool
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Gemini connector

        Args:
            config: Configuration dict with:
                - command: CLI command (default: "gemini")
                - timeout_seconds: Command timeout
                - max_tokens: Maximum tokens per request
        """
        super().__init__(config)
        self.command = config.get("command", "gemini")
        self.max_tokens = config.get("max_tokens", 4096)

    async def send(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send message to Gemini CLI

        Args:
            payload: Message payload with 'content' and optional 'context'

        Returns:
            Response dict with content, tokens_used, model
        """
        content = payload.get("content", "")
        context = payload.get("context", {})

        # Build command
        # TODO: Customize command based on Gemini CLI options
        cmd = [self.command]

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
                raise Exception(f"Gemini CLI error: {stderr.decode('utf-8')}")

            response_text = stdout.decode('utf-8').strip()

            # TODO: Parse actual token usage from Gemini output if available
            estimated_tokens = len(response_text.split()) * 1.3

            return {
                "content": response_text,
                "tokens_used": int(estimated_tokens),
                "model": "gemini-pro"  # TODO: Detect actual model
            }

        except asyncio.TimeoutError:
            raise asyncio.TimeoutError(f"Gemini CLI timeout after {self.timeout}s")
        except FileNotFoundError:
            # Gemini CLI not installed - return stub response
            await asyncio.sleep(0.3)
            return {
                "content": f"[GEMINI STUB] Response to: {content[:100]}...",
                "tokens_used": 120,
                "model": "gemini-pro-stub"
            }
        except Exception as e:
            raise Exception(f"Gemini connector error: {str(e)}")

    async def health_check(self) -> bool:
        """
        Check if Gemini CLI is available

        Returns:
            True if Gemini CLI responds, False otherwise
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

        except FileNotFoundError:
            # CLI not installed
            return False
        except Exception:
            return False


# Example usage
if __name__ == "__main__":
    async def test_gemini():
        connector = GeminiConnector({
            "command": "gemini",
            "timeout_seconds": 30,
            "max_tokens": 2048
        })

        # Health check
        is_healthy = await connector.health_check()
        print(f"Gemini healthy: {is_healthy}")

        # Send test message (will use stub if CLI not available)
        response = await connector.send({
            "content": "What are the three laws of robotics?",
            "context": {}
        })
        print(f"Response: {response}")

    asyncio.run(test_gemini())
