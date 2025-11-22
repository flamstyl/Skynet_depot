# Changelog

All notable changes to Google Drive Space Analyzer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Multi-cloud support (Dropbox, OneDrive)
- MCP server for AI agents
- Export reports (PDF, HTML)
- Scheduled automatic scans
- Advanced search and filtering

---

## [1.0.0] - 2025-01-22

### 🎉 Initial Release

#### Added
- **Multi-account management**: Add, remove, manage multiple Google Drive accounts
- **OAuth 2.0 authentication**: Secure authentication with read-only access
- **Storage visualization**:
  - Dashboard with account overview
  - Storage quota display
  - Category breakdown (Images, Videos, Documents, etc.)
- **File analysis**:
  - Large file detection (configurable threshold)
  - Duplicate file finder using MD5 checksums
  - Folder size breakdown
  - File age distribution
- **Background scanning**: Non-blocking scans with progress tracking
- **Smart caching**:
  - SQLite-based local cache
  - Configurable TTL (default 24 hours)
  - Automatic cache invalidation
- **Security**:
  - Gnome Keyring integration for token storage
  - Encrypted credentials
  - Read-only API scopes
- **Modern UI**:
  - GTK4 with Libadwaita
  - Responsive design
  - Dark mode support
  - Toast notifications
- **Analytics**:
  - Storage usage over time
  - Growth prediction
  - Summary statistics
  - Scan history

#### Technical
- Python 3.11+ support
- GTK4 4.12+ with Libadwaita
- SQLite database for caching
- Threading for async operations
- Comprehensive logging
- Configuration management (XDG-compliant)

#### Documentation
- Complete README with features and usage
- Installation guide for Fedora, Ubuntu, Arch
- OAuth setup guide
- Architecture documentation
- Contributing guidelines

---

## [0.9.0] - 2025-01-15 (Beta)

### Added
- Beta release for testing
- Core functionality implementation
- Basic UI with account management
- Google Drive API integration

### Changed
- Migrated from Electron to GTK4
- Improved security with Keyring

### Fixed
- Memory leaks in file scanning
- OAuth token refresh issues

---

## [0.5.0] - 2025-01-08 (Alpha)

### Added
- Alpha release
- Proof of concept
- Basic file listing
- Simple UI mockup

---

## Version History Summary

- **1.0.0** (2025-01-22): First stable release
- **0.9.0** (2025-01-15): Beta testing
- **0.5.0** (2025-01-08): Alpha proof of concept

---

## Upgrade Notes

### Upgrading to 1.0.0

If you were using a pre-release version:

1. **Backup your data**:
   ```bash
   cp -r ~/.local/share/gdrive-analyzer ~/.local/share/gdrive-analyzer.backup
   ```

2. **Update application**:
   ```bash
   git pull
   pip install -r requirements.txt
   ```

3. **Database migrations**: Automatic (SQLite schema will update)

4. **Re-authentication**: May need to re-authenticate accounts if token format changed

---

## Deprecation Notices

None for version 1.0.0

---

## Security Advisories

None reported

---

## Breaking Changes

### From 0.9.0 to 1.0.0
- Configuration file format changed (automatic migration)
- Database schema updated (automatic migration)
- Some internal APIs renamed (affects custom extensions if any)

---

## Contributors

Thank you to all contributors who made this release possible!

- **Skynet Team** - Core development
- Community testers and feedback providers

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for full list.

---

## Links

- [GitHub Releases](https://github.com/flamstyl/gdrive-space-analyzer/releases)
- [Documentation](https://github.com/flamstyl/gdrive-space-analyzer/docs)
- [Issue Tracker](https://github.com/flamstyl/gdrive-space-analyzer/issues)

---

**Legend**:
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for bug fixes
- `Security` for security fixes
