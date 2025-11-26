"""
Diagnostic Engine - Automated testing, error detection, and fixing
"""

import asyncio
import re
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress


class Severity(Enum):
    """Error severity levels"""

    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


@dataclass
class DiagnosticIssue:
    """Represents a diagnostic issue"""

    file_path: str
    line: int
    column: int
    severity: Severity
    message: str
    code: str
    suggestion: Optional[str] = None


@dataclass
class TestResult:
    """Result of running tests"""

    test_suite: str
    total: int
    passed: int
    failed: int
    skipped: int
    duration: float
    failures: List[Dict] = None


class DiagnosticEngine:
    """Runs tests, detects errors, and suggests fixes"""

    def __init__(self, config: dict):
        self.config = config
        self.console = Console()
        self.issues: List[DiagnosticIssue] = []

    async def run_all_tests(self, project_path: Optional[Path] = None) -> List[TestResult]:
        """Run all available tests for the project"""
        results = []

        project_path = project_path or Path.cwd()

        # Detect and run Python tests
        if (project_path / "pytest.ini").exists() or self._has_python_tests(
            project_path
        ):
            pytest_result = await self._run_pytest(project_path)
            if pytest_result:
                results.append(pytest_result)

        # Detect and run Node.js tests
        if (project_path / "package.json").exists():
            npm_result = await self._run_npm_tests(project_path)
            if npm_result:
                results.append(npm_result)

        # Detect and run Go tests
        if (project_path / "go.mod").exists():
            go_result = await self._run_go_tests(project_path)
            if go_result:
                results.append(go_result)

        return results

    def _has_python_tests(self, project_path: Path) -> bool:
        """Check if project has Python tests"""
        test_dirs = ["tests", "test"]

        for test_dir in test_dirs:
            test_path = project_path / test_dir
            if test_path.exists() and any(test_path.glob("test_*.py")):
                return True

        return False

    async def _run_pytest(self, project_path: Path) -> Optional[TestResult]:
        """Run pytest tests"""
        try:
            process = await asyncio.create_subprocess_shell(
                "pytest -v --tb=short",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(project_path),
            )

            stdout, stderr = await process.communicate()
            output = stdout.decode("utf-8", errors="ignore")

            # Parse pytest output
            return self._parse_pytest_output(output)

        except Exception as e:
            self.console.print(f"[yellow]Could not run pytest: {e}[/yellow]")
            return None

    def _parse_pytest_output(self, output: str) -> TestResult:
        """Parse pytest output"""
        # Extract test counts
        # Format: "5 passed, 2 failed, 1 skipped in 1.23s"
        pattern = r"(\d+) passed|(\d+) failed|(\d+) skipped|in ([\d.]+)s"
        matches = re.findall(pattern, output)

        passed = failed = skipped = 0
        duration = 0.0

        for match in matches:
            if match[0]:
                passed = int(match[0])
            if match[1]:
                failed = int(match[1])
            if match[2]:
                skipped = int(match[2])
            if match[3]:
                duration = float(match[3])

        total = passed + failed + skipped

        # Extract failures
        failures = self._extract_pytest_failures(output)

        return TestResult(
            test_suite="pytest",
            total=total,
            passed=passed,
            failed=failed,
            skipped=skipped,
            duration=duration,
            failures=failures,
        )

    def _extract_pytest_failures(self, output: str) -> List[Dict]:
        """Extract failure details from pytest output"""
        failures = []

        # Simple pattern matching for FAILED lines
        failed_pattern = r"FAILED (.+?) - (.+)"
        matches = re.findall(failed_pattern, output)

        for test_name, error_msg in matches:
            failures.append({"test": test_name, "error": error_msg})

        return failures

    async def _run_npm_tests(self, project_path: Path) -> Optional[TestResult]:
        """Run npm/yarn tests"""
        try:
            # Check if test script exists
            import json

            with open(project_path / "package.json") as f:
                pkg = json.load(f)
                if "test" not in pkg.get("scripts", {}):
                    return None

            process = await asyncio.create_subprocess_shell(
                "npm test",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(project_path),
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=120
            )
            output = stdout.decode("utf-8", errors="ignore")

            return self._parse_jest_output(output)

        except asyncio.TimeoutError:
            self.console.print("[yellow]npm test timed out[/yellow]")
            return None
        except Exception as e:
            self.console.print(f"[yellow]Could not run npm tests: {e}[/yellow]")
            return None

    def _parse_jest_output(self, output: str) -> TestResult:
        """Parse Jest/npm test output"""
        # Jest output format: "Tests: 5 passed, 2 failed, 7 total"
        pattern = r"Tests:\s+(?:(\d+) failed,?\s*)?(?:(\d+) passed,?\s*)?(\d+) total"
        match = re.search(pattern, output)

        if match:
            failed = int(match.group(1)) if match.group(1) else 0
            passed = int(match.group(2)) if match.group(2) else 0
            total = int(match.group(3))
        else:
            return TestResult(
                test_suite="npm/jest",
                total=0,
                passed=0,
                failed=0,
                skipped=0,
                duration=0.0,
            )

        # Extract duration
        time_pattern = r"Time:\s+([\d.]+)\s*s"
        time_match = re.search(time_pattern, output)
        duration = float(time_match.group(1)) if time_match else 0.0

        return TestResult(
            test_suite="npm/jest",
            total=total,
            passed=passed,
            failed=failed,
            skipped=total - passed - failed,
            duration=duration,
        )

    async def _run_go_tests(self, project_path: Path) -> Optional[TestResult]:
        """Run Go tests"""
        try:
            process = await asyncio.create_subprocess_shell(
                "go test -v ./...",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(project_path),
            )

            stdout, stderr = await process.communicate()
            output = stdout.decode("utf-8", errors="ignore")

            return self._parse_go_test_output(output)

        except Exception as e:
            self.console.print(f"[yellow]Could not run go tests: {e}[/yellow]")
            return None

    def _parse_go_test_output(self, output: str) -> TestResult:
        """Parse Go test output"""
        # Count PASS and FAIL
        passed = len(re.findall(r"^--- PASS:", output, re.MULTILINE))
        failed = len(re.findall(r"^--- FAIL:", output, re.MULTILINE))

        # Extract duration
        time_pattern = r"ok\s+.+?\s+([\d.]+)s"
        time_matches = re.findall(time_pattern, output)
        duration = sum(float(t) for t in time_matches)

        return TestResult(
            test_suite="go test",
            total=passed + failed,
            passed=passed,
            failed=failed,
            skipped=0,
            duration=duration,
        )

    def display_results(self, results: List[TestResult]):
        """Display test results in a formatted table"""
        if not results:
            self.console.print("[yellow]No test results to display[/yellow]")
            return

        # Create summary table
        table = Table(title="🧪 Test Results", show_header=True)
        table.add_column("Test Suite", style="cyan")
        table.add_column("Total", justify="right")
        table.add_column("Passed", style="green", justify="right")
        table.add_column("Failed", style="red", justify="right")
        table.add_column("Skipped", style="yellow", justify="right")
        table.add_column("Duration", justify="right")

        total_passed = total_failed = total_skipped = 0

        for result in results:
            # Determine row color based on success
            status_icon = "✓" if result.failed == 0 else "✗"

            table.add_row(
                f"{status_icon} {result.test_suite}",
                str(result.total),
                str(result.passed),
                str(result.failed),
                str(result.skipped),
                f"{result.duration:.2f}s",
            )

            total_passed += result.passed
            total_failed += result.failed
            total_skipped += result.skipped

        self.console.print(table)

        # Display summary
        summary = f"\n[bold]Summary:[/bold]\n"
        summary += f"  [green]✓ {total_passed} passed[/green]\n"
        if total_failed > 0:
            summary += f"  [red]✗ {total_failed} failed[/red]\n"
        if total_skipped > 0:
            summary += f"  [yellow]○ {total_skipped} skipped[/yellow]\n"

        self.console.print(summary)

        # Display failures if any
        self._display_failures(results)

    def _display_failures(self, results: List[TestResult]):
        """Display detailed failure information"""
        failures = []

        for result in results:
            if result.failures:
                failures.extend(
                    [(result.test_suite, f) for f in result.failures]
                )

        if not failures:
            return

        self.console.print("\n[red bold]Failed Tests:[/red bold]")

        for suite, failure in failures:
            self.console.print(
                Panel(
                    f"[red]{failure.get('test', 'Unknown')}[/red]\n"
                    f"[dim]{failure.get('error', 'No details')}[/dim]",
                    title=f"[red]{suite}[/red]",
                    border_style="red",
                )
            )

    async def auto_fix_errors(self):
        """Attempt to automatically fix detected errors"""
        self.console.print(
            "[yellow]🔧 Auto-fix coming soon...[/yellow]\n"
            "[dim]This will analyze errors and apply automatic fixes[/dim]"
        )

    async def lint_project(self, project_path: Path) -> List[DiagnosticIssue]:
        """Run linters on the project"""
        issues = []

        # Python: flake8, pylint
        if self._has_python_files(project_path):
            issues.extend(await self._lint_python(project_path))

        # JavaScript/TypeScript: eslint
        if (project_path / "package.json").exists():
            issues.extend(await self._lint_javascript(project_path))

        self.issues = issues
        return issues

    def _has_python_files(self, project_path: Path) -> bool:
        """Check if project has Python files"""
        return any(project_path.rglob("*.py"))

    async def _lint_python(self, project_path: Path) -> List[DiagnosticIssue]:
        """Run Python linters"""
        # TODO: Implement Python linting
        return []

    async def _lint_javascript(self, project_path: Path) -> List[DiagnosticIssue]:
        """Run JavaScript/TypeScript linters"""
        # TODO: Implement JS linting
        return []
