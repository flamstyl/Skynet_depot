# 📦 Installation Guide

Complete installation instructions for Google Drive Space Analyzer on various Linux distributions.

---

## Table of Contents

- [System Requirements](#system-requirements)
- [Fedora Installation](#fedora-installation)
- [Ubuntu/Debian Installation](#ubuntudebian-installation)
- [Arch Linux Installation](#arch-linux-installation)
- [Flatpak Installation](#flatpak-installation)
- [From Source](#from-source-installation)
- [Post-Installation](#post-installation-setup)
- [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **OS**: Linux (kernel 5.10+)
- **Python**: 3.11 or higher
- **GTK**: 4.12 or higher
- **Libadwaita**: 1.4 or higher
- **RAM**: 512 MB minimum, 1 GB recommended
- **Disk**: 50 MB for application + space for cache

### Required System Components
- **Gnome Keyring** (libsecret)
- **D-Bus** (for keyring communication)
- **Python GObject Introspection** (PyGObject)
- **Cairo** (for graphics)

---

## Fedora Installation

### Fedora 39/40/41

#### 1. Install System Dependencies

```bash
sudo dnf install python3.11 python3-pip python3-gobject gtk4 libadwaita \
    gnome-keyring python3-cairo python3-devel gobject-introspection-devel \
    cairo-devel pkg-config
```

#### 2. Install from Source

```bash
# Clone repository
git clone https://github.com/flamstyl/gdrive-space-analyzer.git
cd gdrive-space-analyzer

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run application
python -m src.main
```

#### 3. (Optional) System-Wide Installation with Meson

```bash
# Install build tools
sudo dnf install meson ninja-build

# Build and install
meson setup builddir --prefix=/usr/local
meson compile -C builddir
sudo meson install -C builddir

# Run from anywhere
gdrive-analyzer
```

---

## Ubuntu/Debian Installation

### Ubuntu 24.04+ / Debian 13+

#### 1. Install System Dependencies

```bash
sudo apt update
sudo apt install python3.11 python3-pip python3-venv python3-gi \
    python3-gi-cairo gir1.2-gtk-4.0 gir1.2-adw-1 gnome-keyring \
    libgirepository1.0-dev gcc libcairo2-dev pkg-config
```

#### 2. Install from Source

```bash
# Clone repository
git clone https://github.com/flamstyl/gdrive-space-analyzer.git
cd gdrive-space-analyzer

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run application
python -m src.main
```

#### 3. (Optional) Install .deb Package

```bash
# Coming soon
# sudo dpkg -i gdrive-space-analyzer_1.0.0_all.deb
```

---

## Arch Linux Installation

### Arch Linux / Manjaro

#### 1. Install System Dependencies

```bash
sudo pacman -S python python-pip python-gobject gtk4 libadwaita \
    gnome-keyring python-cairo gobject-introspection cairo pkgconf
```

#### 2. Install from AUR (Coming Soon)

```bash
# Using yay
yay -S gdrive-space-analyzer

# Or using paru
paru -S gdrive-space-analyzer
```

#### 3. From Source

```bash
git clone https://github.com/flamstyl/gdrive-space-analyzer.git
cd gdrive-space-analyzer
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m src.main
```

---

## Flatpak Installation

### Universal Installation (All Distributions)

**Coming Soon - Flathub Release**

```bash
# Install from Flathub
flatpak install flathub com.github.gdrive-analyzer

# Run
flatpak run com.github.gdrive-analyzer
```

### Build Flatpak Locally

```bash
# Install flatpak-builder
sudo dnf install flatpak-builder  # Fedora
sudo apt install flatpak-builder  # Ubuntu

# Build
flatpak-builder --user --install --force-clean build-dir \
    build-aux/flatpak/com.github.gdrive-analyzer.json

# Run
flatpak run com.github.gdrive-analyzer
```

---

## From Source Installation

### Detailed Source Build

#### 1. Prerequisites

Ensure you have:
- Git
- Python 3.11+
- pip
- GTK4 development files

#### 2. Clone Repository

```bash
git clone https://github.com/flamstyl/gdrive-space-analyzer.git
cd gdrive-space-analyzer
```

#### 3. Setup Python Environment

**Using venv (recommended):**

```bash
python3.11 -m venv venv
source venv/bin/activate  # Linux/macOS
```

#### 4. Install Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install production dependencies
pip install -r requirements.txt

# (Optional) Install development dependencies
pip install -r requirements-dev.txt
```

#### 5. Verify Installation

```bash
# Check imports
python -c "import gi; gi.require_version('Gtk', '4.0'); from gi.repository import Gtk"

# Should print no errors
```

#### 6. Run Application

```bash
# From source directory
python -m src.main

# Or
python src/main.py
```

---

## Post-Installation Setup

### 1. Configure Google OAuth

See [OAUTH_SETUP.md](OAUTH_SETUP.md) for detailed instructions.

**Quick setup:**

```bash
# Create config directory
mkdir -p ~/.config/gdrive-analyzer

# Place your client_secret.json
cp /path/to/client_secret.json ~/.config/gdrive-analyzer/
```

### 2. Verify Gnome Keyring

```bash
# Check if keyring is running
ps aux | grep gnome-keyring

# If not running, start it
gnome-keyring-daemon --start --components=secrets
```

### 3. Test Application

```bash
# Run in debug mode
GDRIVE_ANALYZER_DEBUG=1 python -m src.main

# Check logs
tail -f ~/.cache/gdrive-analyzer/logs/gdrive-analyzer.log
```

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'gi'"

**Solution:**

```bash
# Fedora
sudo dnf install python3-gobject

# Ubuntu
sudo apt install python3-gi

# Ensure you're using system Python or venv with --system-site-packages
python3.11 -m venv --system-site-packages venv
```

### Issue: "Gtk.Builder could not find child"

**Solution:**

```bash
# Verify GTK4 version
pkg-config --modversion gtk4

# Should be >= 4.12
```

### Issue: "Failed to initialize keyring"

**Solution:**

```bash
# Install gnome-keyring
sudo dnf install gnome-keyring  # Fedora
sudo apt install gnome-keyring  # Ubuntu

# Start keyring daemon
gnome-keyring-daemon --start --components=secrets

# Set environment variable
export $(gnome-keyring-daemon --start)
```

### Issue: "ImportError: cannot import name 'Adw'"

**Solution:**

```bash
# Fedora
sudo dnf install libadwaita

# Ubuntu
sudo apt install gir1.2-adw-1

# Verify
python -c "import gi; gi.require_version('Adw', '1'); from gi.repository import Adw"
```

### Issue: Google OAuth not working

**Solution:**

1. Verify `client_secret.json` is in correct location:
   ```bash
   ls ~/.config/gdrive-analyzer/client_secret.json
   ```

2. Check OAuth consent screen is configured in Google Cloud Console

3. Ensure redirect URI is `http://localhost:8080`

4. Try running on port 8080:
   ```bash
   # Check if port is free
   sudo lsof -i :8080
   ```

### Issue: Application crashes on startup

**Solution:**

```bash
# Run with debug output
GDRIVE_ANALYZER_DEBUG=1 python -m src.main

# Check logs
cat ~/.cache/gdrive-analyzer/logs/gdrive-analyzer.log

# Verify all dependencies
pip check
```

---

## Uninstallation

### Remove from Source Installation

```bash
# Remove application directory
rm -rf ~/path/to/gdrive-space-analyzer

# Remove config and data
rm -rf ~/.config/gdrive-analyzer
rm -rf ~/.local/share/gdrive-analyzer
rm -rf ~/.cache/gdrive-analyzer

# Remove tokens from keyring (they'll be auto-removed with config)
```

### Remove System Installation (Meson)

```bash
cd gdrive-space-analyzer
sudo meson uninstall -C builddir
```

### Remove Flatpak

```bash
flatpak uninstall com.github.gdrive-analyzer
flatpak remove --delete-data com.github.gdrive-analyzer
```

---

## Building Packages

### Build RPM (Fedora/RHEL)

```bash
# Coming soon
```

### Build DEB (Ubuntu/Debian)

```bash
# Coming soon
```

### Build Flatpak

```bash
flatpak-builder --repo=repo --force-clean build-dir \
    build-aux/flatpak/com.github.gdrive-analyzer.json

flatpak build-bundle repo gdrive-analyzer.flatpak \
    com.github.gdrive-analyzer
```

---

## Development Installation

For development setup, see [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Support

If you encounter issues not covered here:

1. Check [GitHub Issues](https://github.com/flamstyl/gdrive-space-analyzer/issues)
2. Search [GitHub Discussions](https://github.com/flamstyl/gdrive-space-analyzer/discussions)
3. Open a new issue with:
   - Your distribution and version
   - Python version (`python --version`)
   - Error messages
   - Output of debug mode

---

**Last Updated**: 2025-01-22
