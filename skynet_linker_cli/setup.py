"""
Setup script for Skynet Linker CLI
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README for long description
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding="utf-8") if readme_file.exists() else ""

setup(
    name="skynet-linker-cli",
    version="1.0.0",
    description="Multi-AI Communication & Coordination Bus - MCP Server + CLI",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Skynet Development Team",
    author_email="dev@skynet-linker.dev",
    url="https://github.com/yourusername/skynet_linker_cli",
    license="MIT",
    packages=find_packages(exclude=["tests", "tests.*", "docs", "examples"]),
    python_requires=">=3.10",
    install_requires=[
        "fastapi>=0.109.0",
        "uvicorn[standard]>=0.27.0",
        "websockets>=12.0",
        "redis>=5.0.1",
        "PyNaCl>=1.5.0",
        "typer[all]>=0.9.0",
        "rich>=13.7.0",
        "pydantic>=2.5.3",
        "jsonschema>=4.20.0",
        "httpx>=0.26.0",
        "PyYAML>=6.0.1",
        "aioredis>=2.0.1",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "pytest-asyncio>=0.21.1",
            "pytest-cov>=4.1.0",
            "black>=23.12.1",
            "flake8>=7.0.0",
            "mypy>=1.8.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "skynet-linker=cli.linker_cli:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Communications",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    keywords="ai agents coordination mcp multi-agent websocket redis cli",
    project_urls={
        "Documentation": "https://github.com/yourusername/skynet_linker_cli#readme",
        "Source": "https://github.com/yourusername/skynet_linker_cli",
        "Tracker": "https://github.com/yourusername/skynet_linker_cli/issues",
    },
)
