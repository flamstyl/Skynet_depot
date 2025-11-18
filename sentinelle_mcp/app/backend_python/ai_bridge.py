"""
Sentinelle MCP - AI Bridge
Interfaces with AI models (Claude CLI, Gemini CLI, MCP) for event analysis.
"""

import os
import subprocess
import time
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
import requests


class AIBridge:
    """Bridge to AI models for intelligent event analysis"""

    def __init__(self, config_manager, log_manager):
        """
        Initialize AI bridge.

        Args:
            config_manager: ConfigManager instance
            log_manager: LogManager instance
        """
        self.config = config_manager
        self.logger = log_manager
        self.prompts_dir = Path(self.config.get_prompt_templates_dir())

    def analyze_event(self, event: Dict[str, Any],
                     model: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Analyze an event using AI.

        Args:
            event: Processed event dictionary
            model: AI model to use (defaults to config default)

        Returns:
            AI analysis results or None if failed
        """
        if not self.config.is_ai_enabled():
            self.logger.debug("ai_bridge", "AI analysis disabled")
            return None

        # Check safety - exclude sensitive files
        file_path = event.get('path', '')
        if self.config.should_exclude_file(file_path):
            self.logger.warning(
                "ai_bridge",
                f"File excluded from AI analysis for safety: {file_path}",
                event_id=event.get('event_id')
            )
            return None

        # Determine model to use
        if model is None:
            model = self.config.get_default_ai_model()

        # Route to appropriate AI backend
        start_time = time.time()

        try:
            if model == 'claude_cli':
                result = self._analyze_with_claude_cli(event)
            elif model == 'gemini_cli':
                result = self._analyze_with_gemini_cli(event)
            elif model == 'mcp':
                result = self._analyze_with_mcp(event)
            else:
                self.logger.error("ai_bridge", f"Unknown AI model: {model}")
                return None

            duration = time.time() - start_time

            if result:
                result['duration_seconds'] = round(duration, 2)
                result['model'] = model
                result['timestamp'] = datetime.now().isoformat()

                # Log successful analysis
                self.logger.log_ai_analysis(
                    event_id=event.get('event_id', 'unknown'),
                    model=model,
                    analysis=result.get('summary', ''),
                    duration_seconds=duration
                )

            return result

        except Exception as e:
            self.logger.log_error_with_exception(
                component="ai_bridge",
                message=f"Error analyzing event with {model}",
                exception=e,
                event_id=event.get('event_id')
            )
            return None

    def _analyze_with_claude_cli(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Analyze event using Claude CLI.

        Args:
            event: Event to analyze

        Returns:
            Analysis results
        """
        config = self.config.get_ai_model_config('claude_cli')

        if not config or not config.get('enabled', False):
            return None

        command = config.get('command', 'claude')
        timeout = config.get('timeout_seconds', 30)

        # Load and format prompt
        prompt = self._build_analysis_prompt(event, 'analyze_change.md')

        if not prompt:
            return None

        try:
            # Call Claude CLI
            result = subprocess.run(
                [command, '--no-interactive'],
                input=prompt,
                capture_output=True,
                text=True,
                timeout=timeout
            )

            if result.returncode != 0:
                self.logger.error(
                    "ai_bridge",
                    f"Claude CLI error: {result.stderr}",
                    event_id=event.get('event_id')
                )
                return None

            # Parse response
            response = result.stdout.strip()

            return self._parse_ai_response(response, 'claude_cli')

        except subprocess.TimeoutExpired:
            self.logger.error(
                "ai_bridge",
                f"Claude CLI timeout after {timeout}s",
                event_id=event.get('event_id')
            )
            return None

        except FileNotFoundError:
            self.logger.error(
                "ai_bridge",
                f"Claude CLI not found: {command}",
                event_id=event.get('event_id')
            )
            return None

    def _analyze_with_gemini_cli(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Analyze event using Gemini CLI.

        Args:
            event: Event to analyze

        Returns:
            Analysis results
        """
        config = self.config.get_ai_model_config('gemini_cli')

        if not config or not config.get('enabled', False):
            return None

        command = config.get('command', 'gemini')
        timeout = config.get('timeout_seconds', 30)

        # Load and format prompt
        prompt = self._build_analysis_prompt(event, 'analyze_change.md')

        if not prompt:
            return None

        try:
            # Call Gemini CLI
            result = subprocess.run(
                [command],
                input=prompt,
                capture_output=True,
                text=True,
                timeout=timeout
            )

            if result.returncode != 0:
                self.logger.error(
                    "ai_bridge",
                    f"Gemini CLI error: {result.stderr}",
                    event_id=event.get('event_id')
                )
                return None

            # Parse response
            response = result.stdout.strip()

            return self._parse_ai_response(response, 'gemini_cli')

        except subprocess.TimeoutExpired:
            self.logger.error(
                "ai_bridge",
                f"Gemini CLI timeout after {timeout}s",
                event_id=event.get('event_id')
            )
            return None

        except FileNotFoundError:
            self.logger.error(
                "ai_bridge",
                f"Gemini CLI not found: {command}",
                event_id=event.get('event_id')
            )
            return None

    def _analyze_with_mcp(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Analyze event using MCP server.

        Args:
            event: Event to analyze

        Returns:
            Analysis results
        """
        if not self.config.is_mcp_enabled():
            return None

        endpoint = self.config.get_mcp_endpoint()
        url = f"{endpoint}/ai/analyze"
        timeout = self.config.get('mcp.timeout_seconds', 10)

        # Build request payload
        payload = {
            'event': event,
            'prompt_type': 'analyze_change'
        }

        try:
            response = requests.post(
                url,
                json=payload,
                timeout=timeout
            )

            response.raise_for_status()

            data = response.json()

            return {
                'summary': data.get('analysis', ''),
                'recommendations': data.get('recommendations', []),
                'confidence': data.get('confidence', 'medium')
            }

        except requests.exceptions.RequestException as e:
            self.logger.error(
                "ai_bridge",
                f"MCP analysis error: {e}",
                event_id=event.get('event_id')
            )
            return None

    def _build_analysis_prompt(self, event: Dict[str, Any],
                               template_name: str) -> Optional[str]:
        """
        Build analysis prompt from template.

        Args:
            event: Event to analyze
            template_name: Name of prompt template file

        Returns:
            Formatted prompt string
        """
        template_path = self.prompts_dir / template_name

        if not template_path.exists():
            self.logger.error(
                "ai_bridge",
                f"Prompt template not found: {template_path}"
            )
            return None

        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template = f.read()

            # Format template with event data
            prompt = template.format(
                event_type=event.get('event_type', 'unknown'),
                file_path=event.get('path', 'unknown'),
                file_name=event.get('file_name', 'unknown'),
                file_extension=event.get('file_extension', ''),
                category=event.get('category', 'unknown'),
                priority=event.get('priority', 'low'),
                timestamp=event.get('timestamp', ''),
                metadata=self._format_metadata(event.get('metadata', {})),
                context=self._format_context(event.get('context', {}))
            )

            return prompt

        except Exception as e:
            self.logger.error(
                "ai_bridge",
                f"Error building prompt: {e}"
            )
            return None

    def _format_metadata(self, metadata: Dict[str, Any]) -> str:
        """Format metadata for prompt"""
        if not metadata:
            return "No metadata available"

        lines = []
        for key, value in metadata.items():
            lines.append(f"- {key}: {value}")

        return "\n".join(lines)

    def _format_context(self, context: Dict[str, Any]) -> str:
        """Format context for prompt"""
        if not context:
            return "No context available"

        lines = []
        for key, value in context.items():
            lines.append(f"- {key}: {value}")

        return "\n".join(lines)

    def _parse_ai_response(self, response: str, model: str) -> Dict[str, Any]:
        """
        Parse AI response into structured format.

        Args:
            response: Raw AI response
            model: Model that generated response

        Returns:
            Structured analysis
        """
        # TODO: Implement more sophisticated parsing
        # For now, simple extraction

        result = {
            'summary': response,
            'recommendations': [],
            'confidence': 'medium'
        }

        # Try to extract recommendations (look for numbered lists or bullet points)
        lines = response.split('\n')
        in_recommendations = False

        for line in lines:
            line = line.strip()

            if 'recommendation' in line.lower():
                in_recommendations = True
                continue

            if in_recommendations and line:
                # Check if line starts with number or bullet
                if line[0].isdigit() or line.startswith('-') or line.startswith('•'):
                    # Clean up the line
                    clean_line = line.lstrip('0123456789.-•• ')
                    if clean_line:
                        result['recommendations'].append(clean_line)

        # Determine confidence based on response length and keywords
        if len(response) > 200:
            if any(word in response.lower() for word in ['certain', 'definitely', 'clearly']):
                result['confidence'] = 'high'
            elif any(word in response.lower() for word in ['might', 'possibly', 'unclear']):
                result['confidence'] = 'low'

        return result

    def summarize_event(self, event: Dict[str, Any],
                       level: str = 'medium') -> Optional[str]:
        """
        Generate summary of event.

        Args:
            event: Event to summarize
            level: Summary level (short, medium, detailed)

        Returns:
            Summary string
        """
        prompt = self._build_summary_prompt(event, level)

        if not prompt:
            return None

        model = self.config.get_default_ai_model()

        # Use appropriate backend
        if model == 'claude_cli':
            return self._summarize_with_cli(prompt, 'claude')
        elif model == 'gemini_cli':
            return self._summarize_with_cli(prompt, 'gemini')

        return None

    def _build_summary_prompt(self, event: Dict[str, Any], level: str) -> Optional[str]:
        """Build summary prompt"""
        template_path = self.prompts_dir / 'summarize_event.md'

        if not template_path.exists():
            return None

        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template = f.read()

            return template.format(
                level=level,
                event_type=event.get('event_type'),
                file_name=event.get('file_name'),
                category=event.get('category'),
                priority=event.get('priority')
            )

        except Exception:
            return None

    def _summarize_with_cli(self, prompt: str, cli: str) -> Optional[str]:
        """Summarize using CLI"""
        try:
            result = subprocess.run(
                [cli, '--no-interactive'],
                input=prompt,
                capture_output=True,
                text=True,
                timeout=15
            )

            if result.returncode == 0:
                return result.stdout.strip()

        except Exception:
            pass

        return None

    def test_connection(self, model: Optional[str] = None) -> bool:
        """
        Test connection to AI model.

        Args:
            model: Model to test (defaults to config default)

        Returns:
            True if connection successful
        """
        if model is None:
            model = self.config.get_default_ai_model()

        try:
            if model in ['claude_cli', 'gemini_cli']:
                command = 'claude' if model == 'claude_cli' else 'gemini'

                result = subprocess.run(
                    [command, '--version'],
                    capture_output=True,
                    timeout=5
                )

                return result.returncode == 0

            elif model == 'mcp':
                endpoint = self.config.get_mcp_endpoint()
                response = requests.get(f"{endpoint}/health/sentinelle", timeout=5)
                return response.status_code == 200

        except Exception as e:
            self.logger.error("ai_bridge", f"Connection test failed: {e}")

        return False

    def __repr__(self) -> str:
        return f"AIBridge(model={self.config.get_default_ai_model()})"


if __name__ == "__main__":
    # Test AI bridge
    from config_manager import ConfigManager
    from log_manager import LogManager
    import tempfile
    import uuid

    # Create temporary log
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
        temp_log = f.name

    config = ConfigManager()
    logger = LogManager(temp_log, level="DEBUG")
    ai_bridge = AIBridge(config, logger)

    print(f"\n=== Testing Sentinelle MCP AI Bridge ===\n")
    print(f"Default model: {config.get_default_ai_model()}")

    # Test connection
    print(f"\nTesting connection to {config.get_default_ai_model()}...")
    connected = ai_bridge.test_connection()
    print(f"Connection: {'✓ Success' if connected else '✗ Failed'}")

    # Test event
    test_event = {
        'event_id': str(uuid.uuid4()),
        'timestamp': datetime.now().isoformat(),
        'event_type': 'created',
        'path': '/home/user/AI_Projects/test/main.py',
        'file_name': 'main.py',
        'file_extension': '.py',
        'category': 'code',
        'priority': 'high',
        'metadata': {
            'size_kb': 1.5,
            'hash': 'abc123'
        },
        'context': {
            'project_name': 'test',
            'in_src_dir': True
        }
    }

    print(f"\nTest event: {test_event['event_type']} - {test_event['file_name']}")
    print(f"Note: Actual AI analysis requires Claude CLI or Gemini CLI to be installed")

    # Cleanup
    import os
    os.unlink(temp_log)

    print(f"\n✓ Test completed")
