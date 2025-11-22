# 🤝 Contributing to Fedora Server MCP

Thank you for considering contributing to the Fedora Server MCP project! This document provides guidelines and instructions for contributing.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Assume good intentions
- Respect differing viewpoints

---

## 🎯 How Can I Contribute?

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Use the bug report template**
3. **Include**:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Docker version)
   - Relevant logs

### Suggesting Features

1. **Check the TODO.md** to see if it's already planned
2. **Open an issue** with tag `enhancement`
3. **Describe**:
   - Use case and motivation
   - Proposed solution
   - Alternatives considered
   - Impact on existing functionality

### Improving Documentation

- Fix typos, grammar, or unclear sections
- Add examples and use cases
- Translate documentation
- Create tutorials or guides

### Writing Code

See [Development Setup](#development-setup) below.

---

## 🛠️ Development Setup

### Prerequisites

```bash
# Required
docker --version          # Docker 20.10+
docker-compose --version  # Docker Compose 1.29+
git --version            # Git 2.30+

# Optional but recommended
make --version           # GNU Make
shellcheck --version     # Shell script linter
hadolint --version       # Dockerfile linter
```

### Getting Started

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/fedora_server_mcp.git
cd fedora_server_mcp

# Add upstream remote
git remote add upstream https://github.com/original/fedora_server_mcp.git

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes
# ...

# Test your changes
docker-compose build
docker-compose up -d
docker exec -it fedora_server_mcp_ai bash

# Commit your changes
git commit -m "feat: add amazing feature"

# Push to your fork
git push origin feature/amazing-feature

# Open a Pull Request on GitHub
```

---

## 📝 Coding Standards

### Shell Scripts (Bash)

```bash
#!/bin/bash
# Use bash explicitly, not sh

# Enable strict mode
set -e          # Exit on error
set -u          # Exit on undefined variable
set -o pipefail # Exit on pipe failure

# Use descriptive variable names
CONTAINER_NAME="fedora_server_mcp"
USER_NAME="ia"

# Quote variables
echo "${CONTAINER_NAME}"

# Use functions for reusability
function log_info() {
    echo "[INFO] $@"
}

# Add comments for complex logic
# This checks if the container is running
if docker ps | grep -q "${CONTAINER_NAME}"; then
    log_info "Container is running"
fi
```

### Python (if adding Python scripts)

```python
# Follow PEP 8
# Use type hints
# Add docstrings

def process_task(task: str) -> bool:
    """
    Process a task from the MCP task list.

    Args:
        task: The task description string

    Returns:
        True if task completed successfully, False otherwise
    """
    pass
```

### Dockerfile

```dockerfile
# Use specific version tags, not 'latest' in production
FROM fedora:40

# Group related RUN commands
RUN dnf update -y && \
    dnf install -y \
        package1 \
        package2 && \
    dnf clean all

# Use COPY instead of ADD when possible
COPY script.sh /usr/local/bin/

# Make scripts executable
RUN chmod +x /usr/local/bin/script.sh
```

### Docker Compose

```yaml
# Use version 3.8 or higher
version: '3.8'

# Use descriptive service names
services:
  fedora-mcp:
    # Explicit image names
    image: fedora_server_mcp:1.0.0

    # Organized sections
    # 1. Build
    # 2. Container config
    # 3. Networking
    # 4. Volumes
    # 5. Environment
```

---

## 📊 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(mcp): add task prioritization system"

# Bug fix
git commit -m "fix(watcher): resolve inotify memory leak"

# Documentation
git commit -m "docs(readme): add installation troubleshooting section"

# Multiple lines
git commit -m "feat(api): add REST API for task management

- Add Flask-based REST API
- Implement /api/tasks endpoint
- Add authentication with JWT
- Update documentation

Closes #42"
```

---

## 🔄 Pull Request Process

### Before Submitting

1. **Update documentation** if adding features
2. **Add tests** if applicable
3. **Test thoroughly**:
   ```bash
   docker-compose build
   docker-compose up -d
   docker exec -it fedora_server_mcp_ai bash
   # Run your tests
   ```
4. **Run linters**:
   ```bash
   shellcheck mcp/*.sh
   hadolint Dockerfile
   ```
5. **Update CHANGELOG.md** if significant change

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Built and tested locally
- [ ] All tests pass
- [ ] Documentation updated

## Checklist
- [ ] Code follows project style
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests (if applicable)

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** must pass
2. **At least one maintainer** must approve
3. **Address feedback** promptly
4. **Keep PR focused** - one feature/fix per PR
5. **Rebase if needed** to resolve conflicts

---

## 🧪 Testing

### Manual Testing

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Test basic functionality
docker exec -it fedora_server_mcp_ai bash -c "
    # Test internet
    ping -c 3 google.com

    # Test DNF
    sudo dnf check-update

    # Test MCP
    cat /mcp/directives.md
    cat /mcp/tasks.md
    cat /mcp/memory/context.md

    # Test watcher
    ps aux | grep watcher

    # Test sudo
    sudo whoami
"

# Check logs
docker-compose logs
```

### Test Checklist

- [ ] Container builds without errors
- [ ] Container starts successfully
- [ ] Internet connectivity works
- [ ] DNF package manager works
- [ ] Sudo access works
- [ ] MCP scripts execute
- [ ] Watcher detects file changes
- [ ] Logs are generated correctly
- [ ] Volumes persist data
- [ ] Container can be stopped/restarted

---

## 📚 Documentation

### Documentation Standards

- **Use Markdown** for all documentation
- **Include examples** for code and commands
- **Add diagrams** for complex concepts
- **Keep README.md** up to date
- **Document breaking changes** prominently

### What to Document

- **New features**: Usage, examples, configuration
- **Bug fixes**: What was broken, how it was fixed
- **API changes**: Migration guide for breaking changes
- **Configuration**: New environment variables, settings
- **Dependencies**: New packages, tools required

### Documentation Structure

```
fedora_server_mcp/
├── README.md              # Main documentation
├── QUICKSTART.md          # Quick start guide
├── CONTRIBUTING.md        # This file
├── TODO.md               # Future improvements
├── CHANGELOG.md          # Version history
└── mcp/
    └── README_MCP.md     # MCP system docs
```

---

## 🎨 Style Guide

### Markdown

- Use **ATX-style headers** (`#` not `---`)
- Add **blank lines** around headers, lists, code blocks
- Use **fenced code blocks** with language specification
- Add **emojis sparingly** for visual hierarchy
- Use **relative links** for internal docs

### Code Comments

```bash
# Good: Explains why, not what
# Retry 3 times because network may be unstable
for i in {1..3}; do

# Bad: Explains what (obvious from code)
# Loop 3 times
for i in {1..3}; do
```

---

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

---

## 🆘 Getting Help

- **Questions**: Open a GitHub Discussion
- **Issues**: Use GitHub Issues
- **Chat**: Join our Discord/Slack (if available)
- **Email**: project-maintainer@example.com

---

## 📋 Project Structure Guide

```
fedora_server_mcp/
├── Dockerfile           # Container definition
├── docker-compose.yml   # Orchestration
├── mcp_start.sh        # Entry point
├── mcp/                # MCP system
│   ├── start.sh       # MCP init
│   ├── watcher.sh     # File watcher
│   ├── install.sh     # Tool installer
│   ├── directives.md  # AI guidelines
│   ├── tasks.md       # Task queue
│   └── memory/        # AI memory
├── data/              # Persistent data
├── logs/              # Log files
└── docs/              # Additional docs
```

---

## ✅ Acceptance Criteria

Pull requests should:

1. **Solve a specific problem** or add a specific feature
2. **Include tests** (or explain why not needed)
3. **Update documentation** as necessary
4. **Follow coding standards** outlined above
5. **Not break existing functionality**
6. **Have clear commit messages**
7. **Be reviewed** by at least one maintainer

---

## 🚀 Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Checklist

- [ ] Update version in all files
- [ ] Update CHANGELOG.md
- [ ] Create git tag: `git tag -a v1.2.3 -m "Release v1.2.3"`
- [ ] Push tag: `git push origin v1.2.3`
- [ ] Create GitHub release
- [ ] Build and push Docker image (if applicable)

---

Thank you for contributing to Fedora Server MCP! 🎉

**Questions?** Feel free to ask in issues or discussions.

---

**Last Updated**: 2025-11-22
**Version**: 1.0.0
