"""
Project Analyzer - Deep project structure and code analysis
"""

import os
import json
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Set
from collections import defaultdict

from rich.console import Console
from rich.tree import Tree


class ProjectAnalyzer:
    """Analyzes project structure, dependencies, and code patterns"""

    def __init__(self, project_path: Path, config: dict):
        self.project_path = project_path
        self.config = config
        self.console = Console()

        self.excluded_dirs = set(config["general"]["excluded_dirs"])
        self.excluded_exts = set(config["general"]["excluded_extensions"])
        self.max_depth = config["general"]["project_scan_depth"]
        self.max_file_size = config["general"]["max_file_size_mb"] * 1024 * 1024

    async def analyze_full_project(self) -> Dict:
        """Perform complete project analysis"""
        analysis = {
            "name": self.project_path.name,
            "path": str(self.project_path.absolute()),
            "structure": {},
            "file_count": 0,
            "dir_count": 0,
            "total_size": 0,
            "languages": {},
            "types": [],
            "dependencies": {},
            "entry_points": [],
            "config_files": [],
            "critical_files": [],
        }

        # Scan directory structure
        structure = await self._scan_directory(self.project_path)
        analysis["structure"] = structure

        # Detect project type
        analysis["types"] = self._detect_project_types()

        # Find entry points
        analysis["entry_points"] = self._find_entry_points()

        # Find config files
        analysis["config_files"] = self._find_config_files()

        # Detect dependencies
        analysis["dependencies"] = await self._detect_dependencies()

        # Analyze languages
        analysis["languages"] = self._analyze_languages()

        # Find critical files
        analysis["critical_files"] = self._find_critical_files()

        return analysis

    async def _scan_directory(
        self, path: Path, depth: int = 0
    ) -> Dict:
        """Recursively scan directory structure"""
        if depth > self.max_depth:
            return {}

        structure = {
            "name": path.name,
            "type": "directory",
            "children": [],
            "files": 0,
            "size": 0,
        }

        try:
            for item in sorted(path.iterdir()):
                # Skip excluded directories
                if item.is_dir() and item.name in self.excluded_dirs:
                    continue

                if item.is_file():
                    # Skip excluded extensions
                    if item.suffix in self.excluded_exts:
                        continue

                    # Skip large files
                    try:
                        file_size = item.stat().st_size
                        if file_size > self.max_file_size:
                            continue

                        structure["children"].append({
                            "name": item.name,
                            "type": "file",
                            "extension": item.suffix,
                            "size": file_size,
                            "path": str(item.relative_to(self.project_path)),
                        })
                        structure["files"] += 1
                        structure["size"] += file_size
                    except (OSError, PermissionError):
                        continue

                elif item.is_dir():
                    subdir = await self._scan_directory(item, depth + 1)
                    if subdir:
                        structure["children"].append(subdir)
                        structure["files"] += subdir.get("files", 0)
                        structure["size"] += subdir.get("size", 0)

        except PermissionError:
            pass

        return structure

    def _detect_project_types(self) -> List[str]:
        """Detect project type based on files and structure"""
        types = []

        # Check for common project indicators
        indicators = {
            "package.json": ["node", "javascript", "frontend"],
            "requirements.txt": ["python"],
            "setup.py": ["python"],
            "Cargo.toml": ["rust"],
            "go.mod": ["go"],
            "pom.xml": ["java", "maven"],
            "build.gradle": ["java", "gradle"],
            "Gemfile": ["ruby"],
            "composer.json": ["php"],
            "docker-compose.yml": ["docker"],
            "Dockerfile": ["docker"],
            ".git": ["git"],
        }

        for file, tags in indicators.items():
            if (self.project_path / file).exists():
                types.extend(tags)

        # Detect frameworks
        if (self.project_path / "package.json").exists():
            try:
                with open(self.project_path / "package.json") as f:
                    pkg = json.load(f)
                    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}

                    if "react" in deps:
                        types.append("react")
                    if "vue" in deps:
                        types.append("vue")
                    if "next" in deps:
                        types.append("nextjs")
                    if "express" in deps:
                        types.append("express")
            except:
                pass

        return list(set(types))

    def _find_entry_points(self) -> List[str]:
        """Find potential entry points for the project"""
        entry_points = []

        common_entries = [
            "main.py",
            "app.py",
            "index.js",
            "index.ts",
            "server.js",
            "server.ts",
            "main.go",
            "main.rs",
            "Main.java",
        ]

        for entry in common_entries:
            if (self.project_path / entry).exists():
                entry_points.append(entry)

        # Check package.json scripts
        if (self.project_path / "package.json").exists():
            try:
                with open(self.project_path / "package.json") as f:
                    pkg = json.load(f)
                    scripts = pkg.get("scripts", {})
                    if "start" in scripts:
                        entry_points.append(f"npm start -> {scripts['start']}")
                    if "dev" in scripts:
                        entry_points.append(f"npm run dev -> {scripts['dev']}")
            except:
                pass

        return entry_points

    def _find_config_files(self) -> List[str]:
        """Find configuration files"""
        config_files = []

        config_patterns = [
            ".env",
            ".env.example",
            "config.json",
            "config.yaml",
            "config.yml",
            "settings.py",
            "tsconfig.json",
            ".eslintrc",
            ".prettierrc",
            "docker-compose.yml",
            "Dockerfile",
        ]

        for pattern in config_patterns:
            if (self.project_path / pattern).exists():
                config_files.append(pattern)

        return config_files

    async def _detect_dependencies(self) -> Dict:
        """Detect project dependencies"""
        deps = {}

        # Python
        if (self.project_path / "requirements.txt").exists():
            try:
                with open(self.project_path / "requirements.txt") as f:
                    deps["python"] = [
                        line.strip()
                        for line in f
                        if line.strip() and not line.startswith("#")
                    ]
            except:
                pass

        # Node.js
        if (self.project_path / "package.json").exists():
            try:
                with open(self.project_path / "package.json") as f:
                    pkg = json.load(f)
                    deps["node"] = {
                        "dependencies": list(pkg.get("dependencies", {}).keys()),
                        "devDependencies": list(pkg.get("devDependencies", {}).keys()),
                    }
            except:
                pass

        return deps

    def _analyze_languages(self) -> Dict[str, int]:
        """Analyze languages used in the project"""
        lang_extensions = {
            ".py": "Python",
            ".js": "JavaScript",
            ".ts": "TypeScript",
            ".jsx": "JavaScript (React)",
            ".tsx": "TypeScript (React)",
            ".go": "Go",
            ".rs": "Rust",
            ".java": "Java",
            ".rb": "Ruby",
            ".php": "PHP",
            ".c": "C",
            ".cpp": "C++",
            ".cs": "C#",
            ".swift": "Swift",
            ".kt": "Kotlin",
        }

        language_counts = defaultdict(int)

        for root, _, files in os.walk(self.project_path):
            # Skip excluded dirs
            if any(excluded in root for excluded in self.excluded_dirs):
                continue

            for file in files:
                ext = Path(file).suffix
                if ext in lang_extensions:
                    language_counts[lang_extensions[ext]] += 1

        return dict(language_counts)

    def _find_critical_files(self) -> List[str]:
        """Find critical files that should be examined"""
        critical = []

        critical_patterns = [
            "README.md",
            "package.json",
            "requirements.txt",
            "Dockerfile",
            "docker-compose.yml",
            ".gitignore",
            "Makefile",
        ]

        for pattern in critical_patterns:
            if (self.project_path / pattern).exists():
                critical.append(pattern)

        return critical

    def display_tree(self, structure: Dict, tree: Optional[Tree] = None) -> Tree:
        """Display project structure as a tree"""
        if tree is None:
            tree = Tree(f"📁 {structure['name']}")

        for child in structure.get("children", []):
            if child["type"] == "directory":
                branch = tree.add(f"📁 {child['name']}")
                self.display_tree(child, branch)
            else:
                icon = self._get_file_icon(child.get("extension", ""))
                tree.add(f"{icon} {child['name']}")

        return tree

    def _get_file_icon(self, extension: str) -> str:
        """Get emoji icon for file type"""
        icons = {
            ".py": "🐍",
            ".js": "📜",
            ".ts": "📘",
            ".json": "📋",
            ".md": "📝",
            ".yml": "⚙️",
            ".yaml": "⚙️",
            ".docker": "🐳",
            ".sh": "🔧",
        }
        return icons.get(extension, "📄")
