"""
AI Validator - Validate and improve agent configurations using AI
"""
import json
from typing import Dict, Any, List, Tuple
from ..models.agent import AgentConfig, ValidationResult
from ..config import Config
from datetime import datetime

class AIValidator:
    """Validate agent configurations using AI models"""

    def __init__(self):
        self.anthropic_key = Config.ANTHROPIC_API_KEY
        self.openai_key = Config.OPENAI_API_KEY

    def validate_with_claude(self, agent_config: AgentConfig) -> ValidationResult:
        """
        Validate agent configuration using Claude

        Returns validation result with score, feedback, and suggestions
        """
        try:
            import anthropic
        except ImportError:
            return self._create_error_result("Anthropic library not available")

        if not self.anthropic_key:
            return self._create_error_result("Anthropic API key not configured")

        try:
            client = anthropic.Anthropic(api_key=self.anthropic_key)

            # Create validation prompt
            prompt = self._create_validation_prompt(agent_config)

            # Call Claude
            message = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            # Parse response
            response_text = message.content[0].text
            return self._parse_validation_response(response_text, "claude")

        except Exception as e:
            return self._create_error_result(f"Claude validation error: {str(e)}")

    def validate_with_gpt(self, agent_config: AgentConfig) -> ValidationResult:
        """
        Validate agent configuration using GPT-4

        Returns validation result with score, feedback, and suggestions
        """
        try:
            from openai import OpenAI
        except ImportError:
            return self._create_error_result("OpenAI library not available")

        if not self.openai_key:
            return self._create_error_result("OpenAI API key not configured")

        try:
            client = OpenAI(api_key=self.openai_key)

            # Create validation prompt
            prompt = self._create_validation_prompt(agent_config)

            # Call GPT-4
            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert AI agent validator. Analyze agent configurations for quality, completeness, and best practices."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=2048
            )

            # Parse response
            response_text = response.choices[0].message.content
            return self._parse_validation_response(response_text, "gpt-4")

        except Exception as e:
            return self._create_error_result(f"GPT validation error: {str(e)}")

    def validate(self, agent_config: AgentConfig, validator: str = "claude") -> ValidationResult:
        """
        Validate agent configuration

        Args:
            agent_config: Agent configuration to validate
            validator: Validator to use ('claude' or 'gpt')

        Returns:
            ValidationResult with score, feedback, and suggestions
        """
        if validator == "claude":
            return self.validate_with_claude(agent_config)
        elif validator == "gpt":
            return self.validate_with_gpt(agent_config)
        else:
            return self._create_error_result(f"Unknown validator: {validator}")

    def _create_validation_prompt(self, agent_config: AgentConfig) -> str:
        """Create validation prompt for AI"""
        config_json = json.dumps(agent_config.to_dict(), indent=2)

        prompt = f"""# AI Agent Configuration Validation

Please analyze the following AI agent configuration and provide:

1. **Quality Score** (0-100): Overall quality rating
2. **Feedback**: Detailed analysis of strengths and weaknesses
3. **Suggestions**: Specific improvements and best practices

Focus on:
- Clarity and completeness of instructions
- Appropriate model selection
- Trigger configuration validity
- Action logic and error handling
- Security considerations
- Performance optimization
- Edge cases and error scenarios

## Agent Configuration

```json
{config_json}
```

## Required Response Format

Please respond in the following JSON format:

```json
{{
  "score": <number 0-100>,
  "feedback": "<detailed feedback>",
  "suggestions": [
    "<suggestion 1>",
    "<suggestion 2>",
    ...
  ]
}}
```
"""
        return prompt

    def _parse_validation_response(self, response_text: str, validator: str) -> ValidationResult:
        """Parse AI validation response"""
        try:
            # Try to extract JSON from response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1

            if start_idx >= 0 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                result = json.loads(json_str)

                return ValidationResult(
                    agent_id=0,  # Will be set by caller
                    validator=validator,
                    score=float(result.get('score', 0)),
                    feedback=result.get('feedback', ''),
                    suggestions=result.get('suggestions', []),
                    validated_at=datetime.utcnow().isoformat()
                )
            else:
                # Fallback: use entire response as feedback
                return ValidationResult(
                    agent_id=0,
                    validator=validator,
                    score=75.0,  # Default score
                    feedback=response_text,
                    suggestions=[],
                    validated_at=datetime.utcnow().isoformat()
                )

        except json.JSONDecodeError:
            return ValidationResult(
                agent_id=0,
                validator=validator,
                score=70.0,
                feedback=response_text,
                suggestions=[],
                validated_at=datetime.utcnow().isoformat()
            )

    def _create_error_result(self, error_message: str) -> ValidationResult:
        """Create error validation result"""
        return ValidationResult(
            agent_id=0,
            validator="error",
            score=0.0,
            feedback=f"Validation error: {error_message}",
            suggestions=["Fix validation setup before retrying"],
            validated_at=datetime.utcnow().isoformat()
        )

    def analyze_instructions(self, instructions: List[str]) -> Dict[str, Any]:
        """
        Analyze agent instructions for quality

        Returns:
            Dictionary with clarity_score, specificity_score, and recommendations
        """
        analysis = {
            'clarity_score': 0.0,
            'specificity_score': 0.0,
            'completeness_score': 0.0,
            'recommendations': []
        }

        if not instructions:
            analysis['recommendations'].append("Add instructions to guide agent behavior")
            return analysis

        # Analyze clarity
        total_length = sum(len(inst) for inst in instructions)
        avg_length = total_length / len(instructions)

        if avg_length > 50:
            analysis['clarity_score'] = 80.0
        elif avg_length > 20:
            analysis['clarity_score'] = 60.0
        else:
            analysis['clarity_score'] = 40.0
            analysis['recommendations'].append("Instructions are too brief - add more detail")

        # Analyze specificity
        specific_keywords = ['must', 'should', 'always', 'never', 'if', 'when', 'then']
        specificity_count = sum(
            1 for inst in instructions
            for keyword in specific_keywords
            if keyword in inst.lower()
        )

        analysis['specificity_score'] = min(100.0, specificity_count * 20)

        if analysis['specificity_score'] < 40:
            analysis['recommendations'].append("Add more specific directives (e.g., 'must', 'should', 'when')")

        # Analyze completeness
        has_role = any('you are' in inst.lower() or 'your role' in inst.lower() for inst in instructions)
        has_goals = any('goal' in inst.lower() or 'objective' in inst.lower() for inst in instructions)
        has_constraints = any('do not' in inst.lower() or 'never' in inst.lower() for inst in instructions)

        completeness_factors = [has_role, has_goals, has_constraints]
        analysis['completeness_score'] = (sum(completeness_factors) / 3) * 100

        if not has_role:
            analysis['recommendations'].append("Define the agent's role clearly")
        if not has_goals:
            analysis['recommendations'].append("Specify clear goals or objectives")
        if not has_constraints:
            analysis['recommendations'].append("Add constraints or boundaries for agent behavior")

        return analysis
