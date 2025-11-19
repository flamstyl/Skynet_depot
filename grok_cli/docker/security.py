"""
Security Manager - Manages Docker sandbox security
"""

import asyncio
from pathlib import Path
from typing import Optional, Dict, List

from rich.console import Console

try:
    import docker
    from docker.errors import DockerException

    DOCKER_AVAILABLE = True
except ImportError:
    DOCKER_AVAILABLE = False


class SandboxManager:
    """Manages Docker sandbox for secure code execution"""

    def __init__(self, config: dict):
        self.config = config
        self.console = Console()
        self.docker_config = config["docker"]

        self.client = None
        self.sandbox_image = self.docker_config["image"]

        if DOCKER_AVAILABLE:
            self._init_docker()
        else:
            self.console.print(
                "[yellow]Warning: Docker not available. Sandbox disabled.[/yellow]"
            )

    def _init_docker(self):
        """Initialize Docker client"""
        try:
            self.client = docker.from_env()
            # Test connection
            self.client.ping()
            self.console.print("[green]✓ Docker connected[/green]")
        except DockerException as e:
            self.console.print(
                f"[red]Failed to connect to Docker: {e}[/red]"
            )
            self.client = None

    async def build_sandbox_image(self, force_rebuild: bool = False):
        """Build the sandbox Docker image"""
        if not self.client:
            return False

        try:
            # Check if image exists
            if not force_rebuild:
                try:
                    self.client.images.get(self.sandbox_image)
                    self.console.print(
                        f"[green]✓ Sandbox image already exists: {self.sandbox_image}[/green]"
                    )
                    return True
                except docker.errors.ImageNotFound:
                    pass

            # Build image
            self.console.print(
                f"[cyan]Building sandbox image: {self.sandbox_image}...[/cyan]"
            )

            dockerfile_path = Path(__file__).parent / "Dockerfile.sandbox"

            if not dockerfile_path.exists():
                self.console.print(
                    "[red]Dockerfile.sandbox not found[/red]"
                )
                return False

            # Build
            image, logs = self.client.images.build(
                path=str(dockerfile_path.parent),
                dockerfile="Dockerfile.sandbox",
                tag=self.sandbox_image,
                rm=True,
            )

            # Show build logs
            for log in logs:
                if "stream" in log:
                    self.console.print(
                        f"[dim]{log['stream'].strip()}[/dim]"
                    )

            self.console.print(
                f"[green]✓ Sandbox image built: {self.sandbox_image}[/green]"
            )
            return True

        except Exception as e:
            self.console.print(f"[red]Failed to build image: {e}[/red]")
            return False

    async def run_in_sandbox(
        self,
        command: str,
        working_dir: Optional[Path] = None,
        environment: Optional[Dict] = None,
        timeout: int = 300,
    ) -> Dict[str, str]:
        """Run command in sandbox container"""
        if not self.client:
            return {
                "stdout": "",
                "stderr": "Docker not available",
                "returncode": -1,
            }

        try:
            # Prepare volumes
            volumes = {}
            if working_dir and working_dir.exists():
                volumes[str(working_dir.absolute())] = {
                    "bind": "/workspace",
                    "mode": "rw",
                }

            # Security settings
            security_opt = self.docker_config["security"]["security_opt"]
            cap_drop = self.docker_config["security"]["cap_drop"]
            cap_add = self.docker_config["security"]["cap_add"]

            # Run container
            container = self.client.containers.run(
                self.sandbox_image,
                command=f'/bin/bash -c "{command}"',
                volumes=volumes,
                working_dir="/workspace",
                environment=environment or {},
                mem_limit=self.docker_config["memory_limit"],
                cpu_count=self.docker_config["cpu_limit"],
                network_mode=self.docker_config["network"],
                security_opt=security_opt,
                cap_drop=cap_drop,
                cap_add=cap_add,
                detach=True,
                remove=True,
            )

            # Wait for completion with timeout
            try:
                result = container.wait(timeout=timeout)
                stdout = container.logs(stdout=True, stderr=False).decode(
                    "utf-8", errors="ignore"
                )
                stderr = container.logs(stdout=False, stderr=True).decode(
                    "utf-8", errors="ignore"
                )

                return {
                    "stdout": stdout,
                    "stderr": stderr,
                    "returncode": result["StatusCode"],
                }

            except Exception as e:
                # Timeout or error - kill container
                try:
                    container.kill()
                except:
                    pass

                return {
                    "stdout": "",
                    "stderr": f"Container execution failed: {str(e)}",
                    "returncode": -1,
                }

        except Exception as e:
            self.console.print(f"[red]Sandbox execution error: {e}[/red]")
            return {
                "stdout": "",
                "stderr": f"Sandbox error: {str(e)}",
                "returncode": -1,
            }

    def list_containers(self) -> List[Dict]:
        """List all Grok CLI containers"""
        if not self.client:
            return []

        try:
            containers = self.client.containers.list(
                all=True, filters={"ancestor": self.sandbox_image}
            )

            return [
                {
                    "id": c.short_id,
                    "status": c.status,
                    "created": c.attrs["Created"],
                }
                for c in containers
            ]

        except Exception as e:
            self.console.print(f"[yellow]Error listing containers: {e}[/yellow]")
            return []

    def cleanup(self):
        """Clean up stopped containers"""
        if not self.client:
            return

        try:
            # Remove stopped containers
            containers = self.client.containers.list(
                all=True,
                filters={"ancestor": self.sandbox_image, "status": "exited"},
            )

            for container in containers:
                container.remove()
                self.console.print(
                    f"[green]✓ Removed container: {container.short_id}[/green]"
                )

        except Exception as e:
            self.console.print(f"[yellow]Cleanup error: {e}[/yellow]")

    def get_stats(self) -> Dict:
        """Get Docker sandbox statistics"""
        if not self.client:
            return {"available": False}

        try:
            # Check if image exists
            try:
                image = self.client.images.get(self.sandbox_image)
                image_size = image.attrs.get("Size", 0) / (1024 * 1024)  # MB
            except:
                image_size = 0

            # Count containers
            containers = self.list_containers()

            return {
                "available": True,
                "image": self.sandbox_image,
                "image_size_mb": round(image_size, 2),
                "container_count": len(containers),
            }

        except Exception as e:
            return {"available": False, "error": str(e)}
