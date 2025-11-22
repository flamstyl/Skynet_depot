# 📦 Google Drive Space Analyzer

**Multi-account Google Drive storage analyzer for Linux**

A modern, native Linux application built with GTK4 and Libadwaita that helps you visualize, analyze, and optimize your Google Drive storage across multiple accounts.

![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![GTK](https://img.shields.io/badge/GTK-4.12+-blue.svg)
![Platform](https://img.shields.io/badge/platform-Linux-lightgrey.svg)

---

## ✨ Features

### 🎯 Core Features
- **Multi-Account Management**: Manage multiple Google Drive accounts from a single interface
- **Storage Visualization**: Beautiful pie charts, bar graphs, and tree maps showing space usage
- **Large File Detection**: Identify files consuming the most space
- **Duplicate Finder**: Detect duplicate files across your Drive using MD5 checksums
- **Category Analysis**: Automatic categorization by file type (Images, Videos, Documents, etc.)
- **Folder Size Breakdown**: See which folders are using the most space

### 🔒 Security & Privacy
- **OAuth 2.0 Authentication**: Secure Google authentication
- **Read-Only Access**: No modification or deletion of your Drive files
- **Encrypted Token Storage**: Tokens securely stored in Gnome Keyring
- **Local Processing**: All analysis happens locally on your machine

### ⚡ Performance
- **Smart Caching**: SQLite-based local cache to minimize API calls
- **Background Scanning**: Non-blocking UI with threaded operations
- **Configurable TTL**: Control cache freshness

### 🎨 Modern UI
- **Libadwaita Native**: Beautiful, modern Gnome interface
- **Adaptive Layout**: Responsive design
- **Dark Mode**: Automatic theme switching
- **Toast Notifications**: Unobtrusive progress updates

---

## 📸 Screenshots

*Coming soon - application screenshots will be added here*

---

## 🚀 Installation

### Prerequisites

**System Requirements:**
- Linux (Fedora, Ubuntu, Debian, or similar)
- Python 3.11 or higher
- GTK4 4.12+
- Libadwaita 1.4+
- Gnome Keyring (for secure token storage)

**Fedora:**
```bash
sudo dnf install python3.11 python3-pip python3-gobject gtk4 libadwaita gnome-keyring
```

**Ubuntu/Debian:**
```bash
sudo apt install python3.11 python3-pip python3-gi python3-gi-cairo gir1.2-gtk-4.0 gir1.2-adw-1 gnome-keyring
```

### Installation Methods

#### Method 1: From Source (Recommended for development)

```bash
# Clone repository
git clone https://github.com/flamstyl/gdrive-space-analyzer.git
cd gdrive-space-analyzer

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run application
python -m src.main
```

#### Method 2: Using Meson (Recommended for system installation)

```bash
# Clone repository
git clone https://github.com/flamstyl/gdrive-space-analyzer.git
cd gdrive-space-analyzer

# Build and install
meson setup builddir
meson compile -C builddir
meson install -C builddir

# Run application
gdrive-analyzer
```

#### Method 3: Flatpak (Coming Soon)

```bash
flatpak install flathub com.github.gdrive-analyzer
flatpak run com.github.gdrive-analyzer
```

---

## 🔧 Configuration

### Google OAuth Setup

To use this application, you need to create Google OAuth credentials:

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create a new project** (or select existing)

3. **Enable Google Drive API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

4. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Desktop app"
   - Download the JSON file

5. **Save credentials**:
   ```bash
   mkdir -p ~/.config/gdrive-analyzer
   cp ~/Downloads/client_secret_*.json ~/.config/gdrive-analyzer/client_secret.json
   ```

**Detailed guide**: See [docs/OAUTH_SETUP.md](docs/OAUTH_SETUP.md)

---

## 📖 Usage

### Adding Your First Account

1. Launch the application
2. Click **"Add Account"** button
3. Browser will open for Google authentication
4. Grant read-only access to Drive
5. Account will be added and scan will start automatically

### Scanning Accounts

- **Manual Scan**: Click the refresh icon next to any account
- **Auto-Refresh**: Enable in settings (optional)
- **Scan All**: Scan all accounts at once

### Analyzing Data

- **Dashboard**: Overview of all accounts
- **Account Detail**: Deep dive into single account
- **Large Files**: View files > 100MB (configurable)
- **Duplicates**: Find duplicate files by checksum
- **Categories**: See breakdown by file type

### Settings

Access via menu button (top-right) → **Preferences**

- Cache TTL (default: 24 hours)
- Auto-refresh interval
- Large file threshold
- Theme (auto/light/dark)
- Notifications

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         GTK4 + Libadwaita UI        │
├─────────────────────────────────────┤
│      Application Controller         │
├──────────┬──────────┬───────────────┤
│ Account  │ Scanner  │  Analytics    │
│ Manager  │          │  Engine       │
├──────────┼──────────┼───────────────┤
│ Security │ Database │  Google Drive │
│ Manager  │ (SQLite) │  Provider     │
└──────────┴──────────┴───────────────┘
```

**Key Components:**
- **AccountManager**: OAuth and account lifecycle
- **SecurityManager**: Gnome Keyring integration
- **GoogleDriveProvider**: Google Drive API client
- **ScanCoordinator**: Background scanning with threading
- **AnalyticsEngine**: Data analysis and insights
- **DatabaseManager**: SQLite cache management

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture.

---

## 🛠️ Development

### Setup Development Environment

```bash
# Clone and setup
git clone https://github.com/flamstyl/gdrive-space-analyzer.git
cd gdrive-space-analyzer
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt

# Run tests
pytest

# Code formatting
black src/
ruff check src/

# Type checking
mypy src/
```

### Project Structure

```
gdrive-space-analyzer/
├── src/
│   ├── core/              # Business logic
│   ├── providers/         # Cloud providers
│   ├── storage/           # Database & cache
│   ├── ui/                # GTK UI components
│   └── utils/             # Utilities
├── tests/                 # Unit tests
├── data/                  # UI files, icons
├── docs/                  # Documentation
└── build-aux/             # Build configs
```

### Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

**Development workflow:**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 🐛 Troubleshooting

### Keyring Issues

If you get keyring errors:

```bash
# Start gnome-keyring daemon
gnome-keyring-daemon --start --components=secrets

# Or for testing, disable keyring (NOT RECOMMENDED for production):
export GDRIVE_ANALYZER_NO_KEYRING=1
```

### GTK4 Not Found

```bash
# Fedora
sudo dnf install gtk4 libadwaita python3-gobject

# Ubuntu
sudo apt install gir1.2-gtk-4.0 gir1.2-adw-1 python3-gi
```

### OAuth Errors

Make sure:
1. Google Drive API is enabled
2. OAuth consent screen is configured
3. `client_secret.json` is in correct location
4. Correct redirect URI (http://localhost:8080)

---

## 📊 Statistics & Insights

The analyzer provides:

- **Storage Quota**: Total, used, available, percentage
- **File Count**: Total files, folders, large files
- **Type Breakdown**: Size by category (Images, Videos, etc.)
- **Duplicate Detection**: Wasted space by duplicates
- **Folder Analysis**: Largest folders
- **Age Distribution**: Files by age ranges
- **Growth Prediction**: Estimate when storage will be full
- **Scan History**: Track usage over time

---

## 🗺️ Roadmap

### Version 1.0 (Current)
- ✅ Multi-account management
- ✅ Storage visualization
- ✅ Large file detection
- ✅ Duplicate finder
- ✅ SQLite caching
- ✅ Gnome Keyring integration

### Version 2.0 (Planned)
- 🔄 Multi-cloud support (Dropbox, OneDrive, Box)
- 🔄 MCP Server for AI agents integration
- 🔄 Advanced filtering and search
- 🔄 Export reports (PDF, HTML)
- 🔄 Scheduled scans
- 🔄 Email notifications

### Version 3.0 (Future)
- 🔮 AI-powered categorization
- 🔮 Smart cleanup suggestions
- 🔮 File migration recommendations
- 🔮 Team/organization support
- 🔮 Usage analytics dashboard
- 🔮 Mobile companion app

---

## ❓ FAQ

**Q: Does this app modify or delete my files?**
A: No. The app uses read-only OAuth scopes. It can only read metadata, never modify or delete.

**Q: Is my data sent to external servers?**
A: No. All processing happens locally. Only Google Drive API calls are made to fetch metadata.

**Q: How are my tokens stored?**
A: Securely in Gnome Keyring (libsecret) with encryption.

**Q: Can I use this on Windows/macOS?**
A: Currently Linux-only. Future versions may support other platforms.

**Q: How often should I scan?**
A: Depends on usage. Weekly is fine for most users. Cache lasts 24 hours by default.

**Q: Does this work with Google Workspace accounts?**
A: Yes! Works with personal and Workspace accounts.

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0** - see [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

- **GTK Project** - UI framework
- **Libadwaita** - Modern Gnome widgets
- **Google Drive API** - Cloud storage access
- **Python Community** - Amazing ecosystem

---

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/flamstyl/gdrive-space-analyzer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/flamstyl/gdrive-space-analyzer/discussions)
- **Email**: contact@skynet.dev

---

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐

---

**Made with ❤️ by Skynet Team for the Linux community**
