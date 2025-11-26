"""
GPT Connector
Connects to GPT via OpenAI API or local API endpoint
"""

import asyncio
import os
from typing import Dict, Any
from . import IAConnector


class GPTConnector(IAConnector):
    """
    Connector for GPT via OpenAI API
    Supports both OpenAI cloud API and local API endpoints
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize GPT connector

        Args:
            config: Configuration dict with:
                - api_key: OpenAI API key (or env var OPENAI_API_KEY)
                - model: Model name (default: "gpt-4")
                - api_base: Optional custom API base URL
                - timeout_seconds: Request timeout
                - max_tokens: Maximum tokens per request
        """
        super().__init__(config)
        self.api_key = config.get("api_key") or os.getenv("OPENAI_API_KEY")
        self.model = config.get("model", "gpt-4")
        self.api_base = config.get("api_base", "https://api.openai.com/v1")
        self.max_tokens = config.get("max_tokens", 4096)

        if not self.api_key:
            print("Warning: No OpenAI API key configured")

    async def send(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send message to GPT

        Args:
            payload: Message payload with 'content' and optional 'context'

        Returns:
            Response dict with content, tokens_used, model
        """
        content = payload.get("content", "")
        context = payload.get("context", {})

        # TODO: Implement actual OpenAI API call
        # For now, this is a stub that would need the openai package
        #
        # Example implementation:
        # import openai
        # openai.api_key = self.api_key
        # openai.api_base = self.api_base
        #
        # response = await openai.ChatCompletion.acreate(
        #     model=self.model,
        #     messages=[
        #         {"role": "system", "content": context.get("system_prompt", "")},
        #         {"role": "user", "content": content}
        #     ],
        #     max_tokens=self.max_tokens,
        #     timeout=self.timeout
        # )
        #
        # return {
        #     "content": response.choices[0].message.content,
        #     "tokens_used": response.usage.total_tokens,
        #     "model": response.model
        # }

        # STUB: Return mock response
        await asyncio.sleep(0.5)  # Simulate API delay

        return {
            "content": f"[GPT STUB] Response to: {content[:100]}...",
            "tokens_used": 150,
            "model": self.model
        }

    async def health_check(self) -> bool:
        """
        Check if GPT API is accessible

        Returns:
            True if API responds, False otherwise
        """
        # TODO: Implement actual health check (e.g., list models endpoint)
        # For now, just check if API key is configured
        return bool(self.api_key)


# Example usage
if __name__ == "__main__":
    async def test_gpt():
        connector = GPTConnector({
            "api_key": "sk-test-key",
            "model": "gpt-4",
            "timeout_seconds": 30
        })

        # Health check
        is_healthy = await connector.health_check()
        print(f"GPT healthy: {is_healthy}")

        if is_healthy:
            # Send test message
            response = await connector.send({
                "content": "Explain quantum computing in one sentence.",
                "context": {}
            })
            print(f"Response: {response}")

    asyncio.run(test_gpt())
