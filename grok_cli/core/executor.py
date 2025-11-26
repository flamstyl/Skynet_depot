"""
Command Executor - Safe command execution with Docker sandbox support
"""

import asyncio
import subprocess
import shlex
from pathlib import Path
from typing import Optional, Dict, List
from dataclasses import dataclass
from datetime import datetime

from rich.console import Console
from rich.syntax import Syntax
from rich.panel import Panel


@dataclass
class ExecutionResult:
    """Result of command execution"""

    command: str
    stdout: str
    stderr: str
    returncode: int
    duration: float
    timestamp: datetime
    success: bool


class CommandExecutor:
    """Executes shell commands with safety checks and Docker sandbox"""

    # Dangerous commands that should never be executed
    BLACKLIST = [
        "rm -rf /",
        "rm -rf /*",
        "mkfs",
        "dd if=",
        "> /dev/sda",
        "fork bomb",
        ":(){ :|:& };:",
    ]

    # Commands that require confirmation
    REQUIRE_CONFIRMATION = [
        "rm -rf",
        "rm -r",
        "git push --force",
        "docker system prune",
        "npm uninstall",
        "pip uninstall",
    ]

    def __init__(self, config: dict):
        self.config = config
        self.console = Console()
        self.sandbox_enabled = config["execution"]["sandbox_mode"]
        self.docker_enabled = config["execution"]["docker_enabled"]
        self.timeout = config["execution"]["command_timeout"]
        self.max_concurrent = config["execution"]["max_concurrent_commands"]

        self.execution_history: List[ExecutionResult] = []

    async def execute_shell(
        self,
        command: str,
        cwd: Optional[Path] = None,
        env: Optional[Dict] = None,
        use_sandbox: Optional[bool] = None,
    ) -> ExecutionResult:
        """Execute a shell command"""

        # Safety checks
        if not self._is_safe_command(command):
            self.console.print(
                f"[red bold]⚠️  BLOCKED: Dangerous command detected![/red bold]"
            )
            self.console.print(f"[red]Command: {command}[/red]")
            return ExecutionResult(
                command=command,
                stdout="",
                stderr="Command blocked for safety",
                returncode=-1,
                duration=0.0,
                timestamp=datetime.now(),
                success=False,
            )

        # Check if confirmation needed
        if self._needs_confirmation(command):
            self.console.print(f"[yellow]⚠️  This command requires confirmation:[/yellow]")
            self.console.print(f"[yellow]  {command}[/yellow]")
            confirm = input("Execute? (yes/no): ")
            if confirm.lower() != "yes":
                self.console.print("[yellow]Command cancelled[/yellow]")
                return ExecutionResult(
                    command=command,
                    stdout="",
                    stderr="Command cancelled by user",
                    returncode=-1,
                    duration=0.0,
                    timestamp=datetime.now(),
                    success=False,
                )

        # Determine if we should use sandbox
        use_sandbox = (
            use_sandbox
            if use_sandbox is not None
            else (self.sandbox_enabled and self.docker_enabled)
        )

        # Execute
        self.console.print(f"\n[cyan]▶️  Executing:[/cyan] {command}")

        start_time = datetime.now()

        if use_sandbox:
            result = await self._execute_in_sandbox(command, cwd, env)
        else:
            result = await self._execute_direct(command, cwd, env)

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        # Create result
        exec_result = ExecutionResult(
            command=command,
            stdout=result["stdout"],
            stderr=result["stderr"],
            returncode=result["returncode"],
            duration=duration,
            timestamp=start_time,
            success=result["returncode"] == 0,
        )

        # Store in history
        self.execution_history.append(exec_result)

        # Display result
        self._display_result(exec_result)

        return exec_result

    async def _execute_direct(
        self, command: str, cwd: Optional[Path] = None, env: Optional[Dict] = None
    ) -> Dict:
        """Execute command directly on host system"""

        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(cwd) if cwd else None,
                env=env,
            )

            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(), timeout=self.timeout
                )
            except asyncio.TimeoutError:
                process.kill()
                await process.communicate()
                return {
                    "stdout": "",
                    "stderr": f"Command timed out after {self.timeout} seconds",
                    "returncode": -1,
                }

            return {
                "stdout": stdout.decode("utf-8", errors="ignore"),
                "stderr": stderr.decode("utf-8", errors="ignore"),
                "returncode": process.returncode or 0,
            }

        except Exception as e:
            return {
                "stdout": "",
                "stderr": f"Execution error: {str(e)}",
                "returncode": -1,
            }

    async def _execute_in_sandbox(
        self, command: str, cwd: Optional[Path] = None, env: Optional[Dict] = None
    ) -> Dict:
        """Execute command in Docker sandbox"""

        # Build Docker run command
        docker_cmd = [
            "docker",
            "run",
            "--rm",
            "-i",
            f"--memory={self.config['docker']['memory_limit']}",
            f"--cpus={self.config['docker']['cpu_limit']}",
        ]

        # Add security options
        for opt in self.config["docker"]["security"]["security_opt"]:
            docker_cmd.extend(["--security-opt", opt])

        # Add capabilities
        for cap in self.config["docker"]["security"]["cap_drop"]:
            docker_cmd.extend(["--cap-drop", cap])
        for cap in self.config["docker"]["security"]["cap_add"]:
            docker_cmd.extend(["--cap-add", cap])

        # Mount working directory
        if cwd:
            docker_cmd.extend(["-v", f"{cwd}:/workspace", "-w", "/workspace"])

        # Add environment variables
        if env:
            for key, value in env.items():
                docker_cmd.extend(["-e", f"{key}={value}"])

        # Add image and command
        docker_cmd.append(self.config["docker"]["image"])
        docker_cmd.extend(["sh", "-c", command])

        # Execute
        docker_command = " ".join(docker_cmd)
        return await self._execute_direct(docker_command)

    def _is_safe_command(self, command: str) -> bool:
        """Check if command is safe to execute"""
        command_lower = command.lower().strip()

        # Check blacklist
        for dangerous in self.BLACKLIST:
            if dangerous.lower() in command_lower:
                return False

        return True

    def _needs_confirmation(self, command: str) -> bool:
        """Check if command needs user confirmation"""
        command_lower = command.lower().strip()

        for pattern in self.REQUIRE_CONFIRMATION:
            if pattern.lower() in command_lower:
                return True

        return False

    def _display_result(self, result: ExecutionResult):
        """Display execution result"""

        if result.success:
            self.console.print(
                f"[green]✓ Completed in {result.duration:.2f}s[/green]\n"
            )
        else:
            self.console.print(
                f"[red]✗ Failed (exit code {result.returncode})[/red]\n"
            )

        # Display stdout
        if result.stdout.strip():
            self.console.print(Panel(
                result.stdout.strip(),
                title="[cyan]Output[/cyan]",
                border_style="cyan",
            ))

        # Display stderr
        if result.stderr.strip():
            self.console.print(Panel(
                result.stderr.strip(),
                title="[red]Errors[/red]",
                border_style="red",
            ))

    async def execute_multiple(
        self, commands: List[str], sequential: bool = False
    ) -> List[ExecutionResult]:
        """Execute multiple commands in parallel or sequentially"""

        if sequential:
            results = []
            for cmd in commands:
                result = await self.execute_shell(cmd)
                results.append(result)
                # Stop if command fails
                if not result.success:
                    self.console.print(
                        f"[red]Stopping execution due to failed command[/red]"
                    )
                    break
            return results
        else:
            # Execute in parallel with concurrency limit
            semaphore = asyncio.Semaphore(self.max_concurrent)

            async def execute_with_semaphore(cmd):
                async with semaphore:
                    return await self.execute_shell(cmd)

            tasks = [execute_with_semaphore(cmd) for cmd in commands]
            return await asyncio.gather(*tasks)

    def get_history(self, limit: int = 10) -> List[ExecutionResult]:
        """Get recent execution history"""
        return self.execution_history[-limit:]

    def clear_history(self):
        """Clear execution history"""
        self.execution_history.clear()
