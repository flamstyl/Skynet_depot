# 🤝 Contributing to Google Drive Space Analyzer

Thank you for considering contributing! This document provides guidelines for contributing to the project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity, level of experience, nationality, personal appearance, race, religion, or sexual identity.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

---

## How Can I Contribute?

### Reporting Bugs

**Before submitting:**
1. Check [existing issues](https://github.com/flamstyl/gdrive-space-analyzer/issues)
2. Update to latest version
3. Test with debug mode: `GDRIVE_ANALYZER_DEBUG=1 python -m src.main`

**Bug report should include:**
- Clear, descriptive title
- Exact steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- System information (OS, Python version, GTK version)
- Relevant logs from `~/.cache/gdrive-analyzer/logs/`

### Suggesting Enhancements

**Enhancement suggestions should include:**
- Clear use case
- Why this would be useful to users
- Possible implementation approach
- Mockups/examples if applicable

### Contributing Code

**Areas where contributions are welcome:**
- Bug fixes
- New features (discuss first in an issue)
- UI improvements
- Performance optimizations
- Documentation
- Tests
- Translations (i18n)

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/gdrive-space-analyzer.git
cd gdrive-space-analyzer
git remote add upstream https://github.com/flamstyl/gdrive-space-analyzer.git
```

### 2. Setup Environment

```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 3. Install Pre-commit Hooks

```bash
# Install pre-commit
pip install pre-commit

# Setup hooks
pre-commit install

# Test
pre-commit run --all-files
```

### 4. Create Branch

```bash
git checkout -b feature/my-awesome-feature
```

---

## Coding Standards

### Python Style Guide

We follow **PEP 8** with these tools:

**Black** (formatter):
```bash
black src/ tests/
```

**Ruff** (linter):
```bash
ruff check src/ tests/
ruff check --fix src/ tests/  # Auto-fix
```

**Mypy** (type checker):
```bash
mypy src/
```

### Code Style Rules

1. **Line length**: 100 characters max
2. **Imports**: Organize with `isort`
   ```python
   # Standard library
   import os
   from pathlib import Path

   # Third-party
   from gi.repository import Gtk

   # Local
   from .core import AccountManager
   ```

3. **Type hints**: Use for all functions
   ```python
   def get_account(self, account_id: str) -> Optional[Account]:
       """Get account by ID."""
       ...
   ```

4. **Docstrings**: Google style
   ```python
   def scan_account(self, account_id: str, progress_callback: Optional[Callable]) -> bool:
       """
       Scan an account for files.

       Args:
           account_id: Account identifier
           progress_callback: Optional callback for progress updates

       Returns:
           True if scan started successfully

       Raises:
           ValueError: If account_id is invalid
       """
   ```

5. **Comments**: Explain "why", not "what"
   ```python
   # Good
   # Use batch requests to stay within API rate limits
   batch = service.new_batch_http_request()

   # Bad
   # Create a batch request
   batch = service.new_batch_http_request()
   ```

### GTK/UI Code

1. **Use Libadwaita widgets**: Prefer `Adw.*` over `Gtk.*`
2. **Separate UI from logic**: Business logic in `core/`, UI in `ui/`
3. **Threading**: Never block main thread
   ```python
   # Use GLib.idle_add for UI updates from threads
   GLib.idle_add(self.update_ui, data)
   ```

4. **Signal connections**: Use descriptive handler names
   ```python
   button.connect("clicked", self.on_scan_button_clicked)
   ```

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance (dependencies, build, etc.)

**Examples:**
```
feat(scanner): add progress tracking for large scans

- Add progress percentage calculation
- Emit progress signals during scan
- Update UI to show progress bar

Closes #42
```

```
fix(oauth): handle expired tokens gracefully

Previously, expired tokens caused crashes. Now we attempt
to refresh and only fail if refresh token is invalid.

Fixes #38
```

### Commit Best Practices

1. **Atomic commits**: One logical change per commit
2. **Present tense**: "Add feature" not "Added feature"
3. **Descriptive**: Explain what and why, not how
4. **Reference issues**: `Fixes #123`, `Closes #456`

---

## Pull Request Process

### Before Submitting

1. **Update from upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests**:
   ```bash
   pytest
   pytest --cov=src tests/  # With coverage
   ```

3. **Run linters**:
   ```bash
   black src/ tests/
   ruff check src/ tests/
   mypy src/
   ```

4. **Test manually**:
   - Run application
   - Test your changes
   - Check for regressions

### Creating Pull Request

1. **Push to your fork**:
   ```bash
   git push origin feature/my-awesome-feature
   ```

2. **Open PR on GitHub**

3. **Fill PR template**:
   - Clear description of changes
   - Link related issues
   - Screenshots if UI changes
   - Checklist completed

### PR Template

```markdown
## Description
Brief description of changes

## Motivation and Context
Why is this change needed? What problem does it solve?

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)

## How Has This Been Tested?
Describe tests you ran

## Screenshots (if applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
```

### Review Process

1. Maintainers will review within 3-5 days
2. Address feedback with new commits
3. Once approved, PR will be merged
4. Delete your branch after merge

---

## Testing

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_account_manager.py

# Run with coverage
pytest --cov=src tests/

# Generate HTML coverage report
pytest --cov=src --cov-report=html tests/
```

### Writing Tests

Place tests in `tests/` directory:

```python
# tests/test_account_manager.py
import pytest
from src.core import AccountManager

def test_add_account():
    """Test adding a new account."""
    manager = AccountManager(db_mock, security_mock)
    account = manager.add_account_with_oauth(client_config)

    assert account is not None
    assert account.email == "test@example.com"
```

### Test Requirements

- All new features must have tests
- Bug fixes should include regression tests
- Aim for >80% coverage
- Use mocks for external services (Google API)

---

## Documentation

### Code Documentation

1. **Docstrings**: All public functions/classes
2. **Type hints**: All function signatures
3. **Comments**: For complex logic only

### User Documentation

Located in `docs/`:
- `README.md`: Overview, features, quick start
- `INSTALL.md`: Installation instructions
- `OAUTH_SETUP.md`: OAuth configuration
- `ARCHITECTURE.md`: Technical architecture

### Updating Documentation

When adding features:
1. Update relevant `.md` files
2. Add screenshots if UI changes
3. Update `CHANGELOG.md`
4. Keep README feature list current

---

## Project Structure

```
gdrive-space-analyzer/
├── src/
│   ├── core/              # Business logic
│   │   ├── models.py      # Data models
│   │   ├── account_manager.py
│   │   ├── scanner.py
│   │   ├── analytics.py
│   │   └── security.py
│   ├── providers/         # Cloud providers
│   │   └── google_drive.py
│   ├── storage/           # Database
│   │   ├── database.py
│   │   └── schema.sql
│   ├── ui/                # GTK UI
│   │   ├── widgets/       # Custom widgets
│   │   └── dialogs/       # Dialogs
│   └── utils/             # Utilities
│       ├── config.py
│       ├── logger.py
│       └── formatters.py
├── tests/                 # Unit tests
├── docs/                  # Documentation
├── data/                  # UI files, icons
└── build-aux/             # Build configs
```

---

## Getting Help

- **Questions**: [GitHub Discussions](https://github.com/flamstyl/gdrive-space-analyzer/discussions)
- **Bugs**: [GitHub Issues](https://github.com/flamstyl/gdrive-space-analyzer/issues)
- **Chat**: (Coming soon)

---

## Recognition

Contributors will be:
- Listed in `CONTRIBUTORS.md`
- Mentioned in release notes
- Thanked in commits

---

## License

By contributing, you agree that your contributions will be licensed under the GPL-3.0 license.

---

**Thank you for contributing! 🎉**
