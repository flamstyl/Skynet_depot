"""
Code Generator - AI-powered code generation and fixing
"""

import asyncio
from pathlib import Path
from typing import Optional, Dict, List, Any
from dataclasses import dataclass

from rich.console import Console
from rich.syntax import Syntax
from rich.panel import Panel
from rich.markdown import Markdown


@dataclass
class GeneratedCode:
    """Result of code generation"""

    language: str
    code: str
    explanation: str
    file_path: Optional[str] = None
    success: bool = True


class CodeGenerator:
    """Generates and fixes code using AI"""

    def __init__(self, config: dict):
        self.config = config
        self.console = Console()
        self.llm_config = config["llm"]

        # Initialize LLM client
        self._init_llm_client()

    def _init_llm_client(self):
        """Initialize LLM client based on config"""
        provider = self.llm_config["provider"]

        if provider == "openai":
            try:
                from openai import AsyncOpenAI
                import os

                api_key = os.getenv(self.llm_config["api_key_env"])
                self.client = AsyncOpenAI(api_key=api_key)
                self.provider = "openai"
            except ImportError:
                self.console.print(
                    "[yellow]Warning: OpenAI not installed. Install with: pip install openai[/yellow]"
                )
                self.client = None

        elif provider == "anthropic":
            try:
                from anthropic import AsyncAnthropic
                import os

                api_key = os.getenv("ANTHROPIC_API_KEY")
                self.client = AsyncAnthropic(api_key=api_key)
                self.provider = "anthropic"
            except ImportError:
                self.console.print(
                    "[yellow]Warning: Anthropic not installed. Install with: pip install anthropic[/yellow]"
                )
                self.client = None

        else:
            self.console.print(f"[red]Unknown LLM provider: {provider}[/red]")
            self.client = None

    async def generate_response(
        self,
        query: str,
        context: Optional[Any] = None,
        memory: Optional[List] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        """Generate AI response to a query"""

        if not self.client:
            return "❌ LLM client not initialized. Check your configuration."

        # Load system prompt
        if not system_prompt:
            system_prompt = self._load_system_prompt()

        # Build context
        full_context = self._build_context(query, context, memory)

        # Generate response
        try:
            if self.provider == "openai":
                response = await self._generate_openai(
                    system_prompt, full_context
                )
            elif self.provider == "anthropic":
                response = await self._generate_anthropic(
                    system_prompt, full_context
                )
            else:
                response = "❌ No LLM provider configured"

            return response

        except Exception as e:
            self.console.print(f"[red]Error generating response: {e}[/red]")
            return f"❌ Error: {str(e)}"

    async def _generate_openai(
        self, system_prompt: str, user_message: str
    ) -> str:
        """Generate response using OpenAI"""

        response = await self.client.chat.completions.create(
            model=self.llm_config["model"],
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=self.llm_config["temperature"],
            max_tokens=self.llm_config["max_tokens"],
        )

        return response.choices[0].message.content

    async def _generate_anthropic(
        self, system_prompt: str, user_message: str
    ) -> str:
        """Generate response using Anthropic"""

        response = await self.client.messages.create(
            model=self.llm_config["model"],
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
            temperature=self.llm_config["temperature"],
            max_tokens=self.llm_config["max_tokens"],
        )

        return response.content[0].text

    def _load_system_prompt(self) -> str:
        """Load system prompt from file"""
        prompt_file = Path(__file__).parent.parent / "prompts" / "system_prompt.md"

        if prompt_file.exists():
            with open(prompt_file, "r") as f:
                return f.read()
        else:
            return "You are Grok CLI, an advanced AI development assistant."

    def _build_context(
        self, query: str, context: Any = None, memory: Optional[List] = None
    ) -> str:
        """Build full context for LLM"""

        parts = [f"User Query: {query}"]

        # Add RAG context if available
        if context:
            parts.append("\n--- Relevant Context ---")
            if isinstance(context, list):
                for i, ctx in enumerate(context, 1):
                    if isinstance(ctx, dict):
                        parts.append(f"\n[{i}] {ctx.get('content', ctx)}")
                    else:
                        parts.append(f"\n[{i}] {ctx}")
            else:
                parts.append(str(context))

        # Add memory if available
        if memory:
            parts.append("\n--- Recent Context ---")
            for mem in memory[-5:]:  # Last 5 items
                parts.append(f"- {mem}")

        return "\n".join(parts)

    async def generate_code(
        self,
        description: str,
        language: str = "python",
        context: Optional[str] = None,
    ) -> GeneratedCode:
        """Generate code based on description"""

        prompt = f"""Generate {language} code for the following:

{description}

{f'Context: {context}' if context else ''}

Provide:
1. Clean, well-commented code
2. Brief explanation of what the code does
3. Any dependencies or setup needed

Format your response as:
```{language}
[code here]
```

Explanation:
[explanation here]
"""

        response = await self.generate_response(prompt)

        # Parse response
        code, explanation = self._parse_code_response(response, language)

        return GeneratedCode(
            language=language,
            code=code,
            explanation=explanation,
            success=bool(code),
        )

    async def fix_code(
        self, code: str, error: str, language: str = "python"
    ) -> GeneratedCode:
        """Fix code based on error message"""

        prompt = f"""Fix the following {language} code that produces this error:

Error:
```
{error}
```

Code:
```{language}
{code}
```

Provide:
1. Fixed code
2. Explanation of what was wrong and how you fixed it

Format your response as:
```{language}
[fixed code here]
```

Explanation:
[explanation here]
"""

        response = await self.generate_response(prompt)

        # Parse response
        fixed_code, explanation = self._parse_code_response(response, language)

        return GeneratedCode(
            language=language,
            code=fixed_code,
            explanation=explanation,
            success=bool(fixed_code),
        )

    async def refactor_code(
        self, code: str, language: str = "python", goal: str = "improve readability"
    ) -> GeneratedCode:
        """Refactor code to improve it"""

        prompt = f"""Refactor the following {language} code to {goal}:

```{language}
{code}
```

Provide:
1. Refactored code
2. Explanation of improvements made

Format your response as:
```{language}
[refactored code here]
```

Improvements:
[explanation here]
"""

        response = await self.generate_response(prompt)

        # Parse response
        refactored, explanation = self._parse_code_response(response, language)

        return GeneratedCode(
            language=language,
            code=refactored,
            explanation=explanation,
            success=bool(refactored),
        )

    def _parse_code_response(
        self, response: str, language: str
    ) -> tuple[str, str]:
        """Parse code and explanation from AI response"""

        code = ""
        explanation = ""

        # Extract code block
        if f"```{language}" in response:
            parts = response.split(f"```{language}")
            if len(parts) > 1:
                code_part = parts[1].split("```")[0]
                code = code_part.strip()

        elif "```" in response:
            parts = response.split("```")
            if len(parts) > 1:
                code = parts[1].strip()

        # Extract explanation
        if "Explanation:" in response:
            explanation = response.split("Explanation:")[-1].strip()
        elif "Improvements:" in response:
            explanation = response.split("Improvements:")[-1].strip()
        else:
            # Take everything after code block
            if "```" in response:
                explanation = response.split("```")[-1].strip()

        return code, explanation

    def display_generated_code(self, result: GeneratedCode):
        """Display generated code with syntax highlighting"""

        if not result.success:
            self.console.print("[red]❌ Code generation failed[/red]")
            return

        # Display code with syntax highlighting
        syntax = Syntax(
            result.code,
            result.language,
            theme="monokai",
            line_numbers=True,
        )

        self.console.print(
            Panel(
                syntax,
                title=f"[cyan]Generated {result.language.title()} Code[/cyan]",
                border_style="cyan",
            )
        )

        # Display explanation
        if result.explanation:
            self.console.print("\n")
            self.console.print(
                Panel(
                    Markdown(result.explanation),
                    title="[green]Explanation[/green]",
                    border_style="green",
                )
            )
