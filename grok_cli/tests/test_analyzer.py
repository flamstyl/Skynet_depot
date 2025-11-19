"""
Tests for ProjectAnalyzer
"""

import pytest
import asyncio
from pathlib import Path
from core.analyzer import ProjectAnalyzer


@pytest.fixture
def config():
    """Test configuration"""
    return {
        "general": {
            "project_scan_depth": 3,
            "max_file_size_mb": 10,
            "excluded_dirs": ["node_modules", ".git", "__pycache__"],
            "excluded_extensions": [".pyc", ".log"],
        }
    }


@pytest.fixture
def analyzer(config, tmp_path):
    """Create analyzer instance"""
    return ProjectAnalyzer(tmp_path, config)


def test_analyzer_initialization(analyzer):
    """Test analyzer initialization"""
    assert analyzer is not None
    assert analyzer.project_path.exists()


@pytest.mark.asyncio
async def test_analyze_empty_project(analyzer):
    """Test analyzing empty project"""
    analysis = await analyzer.analyze_full_project()

    assert analysis["name"] == analyzer.project_path.name
    assert analysis["file_count"] == 0
    assert isinstance(analysis["languages"], dict)
    assert isinstance(analysis["types"], list)


@pytest.mark.asyncio
async def test_detect_python_project(analyzer, tmp_path):
    """Test detecting Python project"""
    # Create requirements.txt
    (tmp_path / "requirements.txt").write_text("pytest>=7.0.0\n")

    analysis = await analyzer.analyze_full_project()

    assert "python" in analysis["types"]
    assert "requirements.txt" in analysis["config_files"]


@pytest.mark.asyncio
async def test_detect_node_project(analyzer, tmp_path):
    """Test detecting Node.js project"""
    import json

    # Create package.json
    pkg = {"name": "test", "dependencies": {"react": "^18.0.0"}}
    (tmp_path / "package.json").write_text(json.dumps(pkg))

    analysis = await analyzer.analyze_full_project()

    assert "node" in analysis["types"]
    assert "react" in analysis["types"]


def test_get_file_icon(analyzer):
    """Test file icon mapping"""
    assert analyzer._get_file_icon(".py") == "🐍"
    assert analyzer._get_file_icon(".js") == "📜"
    assert analyzer._get_file_icon(".unknown") == "📄"
