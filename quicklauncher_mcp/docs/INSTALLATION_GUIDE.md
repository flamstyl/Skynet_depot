# 📦 QuickLauncher MCP - Installation Guide

Complete step-by-step installation guide for **QuickLauncher MCP**.

---

## ✅ Prerequisites

Before installing, ensure you have:

### Required Software

1. **Windows 10 or 11**
   - 64-bit recommended

2. **Node.js 18+**
   - Download: https://nodejs.org/
   - Verify installation: `node --version`

3. **Python 3.10+**
   - Download: https://www.python.org/downloads/
   - ⚠️ **Important**: Check "Add Python to PATH" during installation
   - Verify installation: `python --version`

4. **Git**
   - Download: https://git-scm.com/
   - Verify installation: `git --version`

### Optional (for AI features)

- **Claude CLI** - For AI integration
- **Anthropic API Key** - For API-based AI

---

## 📥 Installation Steps

### Step 1: Clone Repository

Open Command Prompt or PowerShell:

```bash
# Navigate to where you want to install
cd C:\Projects

# Clone the repository
git clone https://github.com/flamstyl/Skynet_depot.git

# Navigate to QuickLauncher
cd Skynet_depot\quicklauncher_mcp
```

---

### Step 2: Install Dependencies

#### A. Electron Frontend

```bash
cd launcher\electron_app
npm install
cd ..\..
```

#### B. Python Backend

```bash
cd backend\python_server
pip install -r requirements.txt
cd ..\..
```

If you get errors, try:
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

#### C. MCP Server

```bash
cd backend\mcp
npm install
cd ..\..
```

---

### Step 3: Configuration

#### Create Environment File

```bash
copy .env.example .env
```

Edit `.env` in a text editor:

```env
# Basic configuration
BACKEND_PORT=8765
MCP_PORT=3000
AI_BACKEND=claude_cli

# Leave these blank for now
ANTHROPIC_API_KEY=
DEVICE_ID=
```

#### (Optional) Customize Settings

Edit `launcher\config\settings.json` to change:
- Hotkey (default: `Alt+Space`)
- UI theme
- Search behavior
- Index directories

---

### Step 4: Initial Index Build

The first time you run QuickLauncher, it will build an index of your apps and files. This can take 1-5 minutes depending on your system.

---

### Step 5: First Run

#### Option A: Manual Start (Recommended for first time)

Open **3 separate command prompts**:

**Terminal 1 - Python Backend:**
```bash
cd C:\Projects\Skynet_depot\quicklauncher_mcp\backend\python_server
python server.py
```

Wait for: `QuickLauncher Backend ready!`

**Terminal 2 - MCP Server (Optional):**
```bash
cd C:\Projects\Skynet_depot\quicklauncher_mcp\backend\mcp
npm start
```

Wait for: `QuickLauncher MCP Server running`

**Terminal 3 - Electron App:**
```bash
cd C:\Projects\Skynet_depot\quicklauncher_mcp\launcher\electron_app
npm start
```

The launcher window should appear!

#### Option B: Automated Start

Simply double-click:
```
start.bat
```

This will launch all three components automatically.

---

### Step 6: Test the Launcher

1. **Press `Alt+Space`** - The launcher should appear
2. **Type `notepad`** - Notepad should appear in results
3. **Press Enter** - Notepad should open
4. **Press `Esc`** - Launcher should close

🎉 **Success!** QuickLauncher is now running.

---

## 🔧 Post-Installation Setup

### Auto-Start on Windows Boot

Create a shortcut to `start.bat` and place it in:
```
C:\Users\YourUsername\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
```

### Change Global Hotkey

Edit `launcher\config\settings.json`:
```json
{
  "hotkeys": {
    "main": "Alt+Space"  // Change to your preference
  }
}
```

Restart the Electron app for changes to take effect.

### Configure Indexing

Edit `backend\python_server\config.yaml`:

```yaml
scan_directories:
  - "C:\\Users\\%USERNAME%\\Desktop"
  - "C:\\Users\\%USERNAME%\\Documents"
  - "C:\\Projects"  # Add your custom directories

file_extensions:
  - .exe
  - .lnk
  - .pdf
  - .py
  # Add more as needed
```

Rebuild index: Press `Ctrl+R` in the launcher.

---

## 🤖 AI Setup (Optional)

### Option 1: Claude CLI

1. Install Claude CLI (if available)
2. Verify: `claude --version`
3. Set in `.env`:
   ```env
   AI_BACKEND=claude_cli
   ```

### Option 2: Anthropic API

1. Get API key from: https://console.anthropic.com/
2. Add to `.env`:
   ```env
   AI_BACKEND=api
   ANTHROPIC_API_KEY=your_key_here
   ```

Test AI mode:
1. Press `Alt+Space`
2. Type `>hello`
3. You should get an AI response

---

## 🔄 Multi-Device Sync Setup (Optional)

### On Primary Device (Server):

1. Ensure MCP server is running
2. Note your local IP: `ipconfig` (look for IPv4)
3. Configure firewall to allow port 3000

### On Other Devices (Clients):

1. Edit `.env`:
   ```env
   MCP_URL=http://192.168.1.100:3000
   ```
   (Replace with server IP)

2. Enable sync in `launcher\config\settings.json`:
   ```json
   {
     "mcp": {
       "enabled": true,
       "syncEnabled": true
     }
   }
   ```

Your search index will now sync across devices!

---

## 🐛 Troubleshooting

### Backend won't start

**Error: `python: command not found`**
- Python not installed or not in PATH
- Reinstall Python and check "Add to PATH"

**Error: `ModuleNotFoundError`**
- Dependencies not installed
- Run: `pip install -r requirements.txt`

**Port already in use:**
- Change port in `.env`: `BACKEND_PORT=8766`

---

### Electron won't start

**Error: `npm: command not found`**
- Node.js not installed
- Download from https://nodejs.org/

**Error: `Cannot find module`**
- Dependencies not installed
- Run: `npm install` in `launcher/electron_app/`

---

### Hotkey not working

- Another app is using the same hotkey
- Change in `launcher/config/settings.json`
- Try: `Ctrl+Space`, `Win+Space`, `Alt+Q`

---

### Search returns no results

- Index not built yet
- Press `Ctrl+R` to rebuild index
- Check backend logs for errors
- Verify `data/index.db` exists

---

### AI mode not responding

- AI backend not configured
- Check `.env` settings
- Verify API key (if using API)
- Check MCP server logs

---

## 🔄 Updating

To update QuickLauncher:

```bash
cd C:\Projects\Skynet_depot
git pull origin main

# Re-install dependencies if needed
cd quicklauncher_mcp\launcher\electron_app
npm install

cd ..\..\backend\python_server
pip install -r requirements.txt

cd ..\mcp
npm install
```

---

## 🗑️ Uninstallation

1. Stop all QuickLauncher processes:
   ```
   stop.bat
   ```

2. Remove from startup (if configured)

3. Delete folder:
   ```bash
   rmdir /s C:\Projects\Skynet_depot\quicklauncher_mcp
   ```

4. (Optional) Remove Python packages:
   ```bash
   pip uninstall -r requirements.txt
   ```

---

## 📞 Support

If you encounter issues:

1. Check this guide thoroughly
2. Check `README.md` for additional info
3. Review backend/MCP logs for errors
4. Open an issue: https://github.com/flamstyl/Skynet_depot/issues

---

## ✅ Verification Checklist

After installation, verify:

- [ ] Python backend starts without errors
- [ ] MCP server starts (if using sync)
- [ ] Electron app opens
- [ ] `Alt+Space` opens launcher
- [ ] Search returns results
- [ ] Selecting a result executes action
- [ ] AI mode works (if configured)
- [ ] Hotkey works globally

---

**Installation complete! Enjoy QuickLauncher MCP! 🚀**
