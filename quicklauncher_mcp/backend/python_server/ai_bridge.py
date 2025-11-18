"""
AI Bridge - Connects to AI services (Claude CLI, Gemini CLI, APIs)
"""
import os
import subprocess
import json
import httpx
from typing import Dict, List, Optional


class AIBridge:
    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.default_backend = self.config.get('ai_backend', 'claude_cli')
        self.mcp_url = self.config.get('mcp_url', 'http://localhost:3000')

    async def process_prompt(self, prompt: str, mode: str = 'contextual') -> Dict:
        """Process AI prompt and return response"""

        # Choose appropriate prompt template based on mode
        if mode == 'quick':
            system_prompt = self._get_quick_actions_prompt()
        elif mode == 'contextual':
            system_prompt = self._get_contextual_command_prompt()
        else:
            system_prompt = "You are a helpful AI assistant integrated into QuickLauncher."

        # Try to route through MCP first
        try:
            response = await self._route_via_mcp(prompt, system_prompt)
            if response:
                return response
        except Exception as e:
            print(f"MCP routing failed: {e}")

        # Fallback to direct CLI or API
        try:
            response = await self._call_ai_backend(prompt, system_prompt)
            return response
        except Exception as e:
            print(f"AI backend failed: {e}")
            return {
                'response': f"AI service unavailable: {str(e)}",
                'actions': [],
                'mode': mode
            }

    async def _route_via_mcp(self, prompt: str, system_prompt: str) -> Optional[Dict]:
        """Route AI request through MCP server"""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f'{self.mcp_url}/ai/prompt',
                    json={
                        'prompt': prompt,
                        'system': system_prompt
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()
                    return self._parse_ai_response(data.get('response', ''))
                else:
                    return None

        except Exception as e:
            print(f"MCP request error: {e}")
            return None

    async def _call_ai_backend(self, prompt: str, system_prompt: str) -> Dict:
        """Call AI backend directly (CLI or API)"""

        if self.default_backend == 'claude_cli':
            return await self._call_claude_cli(prompt, system_prompt)
        elif self.default_backend == 'gemini_cli':
            return await self._call_gemini_cli(prompt, system_prompt)
        elif self.default_backend == 'api':
            return await self._call_api(prompt, system_prompt)
        else:
            raise Exception(f"Unknown AI backend: {self.default_backend}")

    async def _call_claude_cli(self, prompt: str, system_prompt: str) -> Dict:
        """Call Claude CLI"""

        # TODO: Implement actual Claude CLI integration
        # For now, return mock response

        try:
            # Example: subprocess call to claude CLI
            # result = subprocess.run(
            #     ['claude', '--prompt', prompt],
            #     capture_output=True,
            #     text=True,
            #     timeout=30
            # )

            # Mock response
            return {
                'response': f"[Claude CLI Response to: {prompt}]\n\nThis is a mock response. Integrate actual Claude CLI here.",
                'actions': self._extract_actions_from_prompt(prompt),
                'mode': 'contextual'
            }

        except Exception as e:
            raise Exception(f"Claude CLI error: {str(e)}")

    async def _call_gemini_cli(self, prompt: str, system_prompt: str) -> Dict:
        """Call Gemini CLI"""

        # TODO: Implement Gemini CLI integration
        return {
            'response': f"[Gemini CLI Response to: {prompt}]\n\nThis is a mock response. Integrate actual Gemini CLI here.",
            'actions': [],
            'mode': 'contextual'
        }

    async def _call_api(self, prompt: str, system_prompt: str) -> Dict:
        """Call AI API (Claude API, OpenAI API, etc.)"""

        # TODO: Implement API integration
        # Example using Anthropic API:

        # api_key = os.environ.get('ANTHROPIC_API_KEY')
        # if not api_key:
        #     raise Exception("ANTHROPIC_API_KEY not set")

        # async with httpx.AsyncClient() as client:
        #     response = await client.post(
        #         'https://api.anthropic.com/v1/messages',
        #         headers={
        #             'x-api-key': api_key,
        #             'anthropic-version': '2023-06-01',
        #             'content-type': 'application/json'
        #         },
        #         json={
        #             'model': 'claude-3-sonnet-20240229',
        #             'max_tokens': 1024,
        #             'system': system_prompt,
        #             'messages': [
        #                 {'role': 'user', 'content': prompt}
        #             ]
        #         }
        #     )

        #     if response.status_code == 200:
        #         data = response.json()
        #         return self._parse_ai_response(data['content'][0]['text'])

        return {
            'response': f"[API Response to: {prompt}]\n\nThis is a mock response. Integrate actual API here.",
            'actions': [],
            'mode': 'contextual'
        }

    def _parse_ai_response(self, response_text: str) -> Dict:
        """Parse AI response and extract actions"""

        # Extract suggested actions from response
        actions = self._extract_actions_from_response(response_text)

        return {
            'response': response_text,
            'actions': actions,
            'mode': 'contextual'
        }

    def _extract_actions_from_response(self, text: str) -> List[Dict]:
        """Extract actionable items from AI response"""

        # TODO: Implement intelligent action extraction
        # For now, return empty list

        actions = []

        # Example: Look for common patterns
        if 'open' in text.lower():
            # Extract open commands
            pass

        if 'search' in text.lower():
            # Extract search queries
            pass

        return actions

    def _extract_actions_from_prompt(self, prompt: str) -> List[Dict]:
        """Extract potential actions from user prompt"""

        actions = []
        prompt_lower = prompt.lower()

        # Open actions
        if 'open' in prompt_lower:
            if 'notepad' in prompt_lower:
                actions.append({
                    'title': 'Open Notepad',
                    'description': 'Launch Notepad application',
                    'type': 'open',
                    'target': 'notepad.exe'
                })
            elif 'calculator' in prompt_lower:
                actions.append({
                    'title': 'Open Calculator',
                    'description': 'Launch Calculator application',
                    'type': 'open',
                    'target': 'calc.exe'
                })

        # Search actions
        if 'search' in prompt_lower or 'google' in prompt_lower:
            search_query = prompt.replace('search', '').replace('google', '').strip()
            if search_query:
                actions.append({
                    'title': f'Google Search: {search_query}',
                    'description': 'Search on Google',
                    'type': 'open',
                    'target': f'https://www.google.com/search?q={search_query}'
                })

        # System actions
        if 'shutdown' in prompt_lower:
            actions.append({
                'title': 'Shutdown Computer',
                'description': 'Shutdown the system',
                'type': 'system',
                'target': 'shutdown'
            })

        if 'restart' in prompt_lower:
            actions.append({
                'title': 'Restart Computer',
                'description': 'Restart the system',
                'type': 'system',
                'target': 'restart'
            })

        return actions

    def _get_quick_actions_prompt(self) -> str:
        """Get prompt template for quick actions mode"""
        return """You are an AI assistant integrated into QuickLauncher.
Analyze the user's query and suggest quick actions they might want to perform.
Be concise and actionable. Focus on what the user wants to do, not explanations."""

    def _get_contextual_command_prompt(self) -> str:
        """Get prompt template for contextual command mode"""
        return """You are an AI assistant integrated into QuickLauncher, a universal launcher for Windows.
Understand the user's intent and provide:
1. A clear response to their query
2. Actionable suggestions (open apps, run commands, search, etc.)

Be helpful, concise, and action-oriented."""

    def _get_search_intent_prompt(self) -> str:
        """Get prompt template for search intent detection"""
        return """Analyze the user's query and determine their intent:
- Search (looking for information)
- Launch (opening an app)
- Navigate (opening a folder or file)
- Action (system command)
- Question (asking for help)

Respond with the intent type and relevant parameters."""


# Example usage
if __name__ == '__main__':
    import asyncio

    async def test():
        bridge = AIBridge()
        result = await bridge.process_prompt("open notepad")
        print(json.dumps(result, indent=2))

    asyncio.run(test())
