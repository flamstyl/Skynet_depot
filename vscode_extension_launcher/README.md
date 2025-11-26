# VS Code Extension Launcher - Skynet Edition v1.0

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey)

A powerful Electron-based launcher for managing and launching VS Code extensions with pre-configured AI contexts. Part of the Skynet tooling ecosystem.

## Features

- **One-Click Launch**: Launch VS Code extensions instantly with pre-configured contexts
- **AI Integration**: Associate each extension with specific AI agents (Claude, Gemini, Codex, etc.)
- **Context Management**: Load and manage workspace-specific configurations, files, and environment variables
- **Dark Theme UI**: Clean, modern interface with dark mode design
- **Real-time Logging**: Monitor all launcher activities with comprehensive logging
- **Extensible**: Easily add new extensions via simple JSON configuration

## Screenshots

### Main Interface
The launcher displays all available extensions in an elegant grid layout with quick access to launch and context details.

### Context Panel
View detailed context information including workspace paths, environment variables, and pre-configured files for each extension.

## Architecture

```
vscode_extension_launcher/
├── app/                           # Electron main process
│   ├── main.js                    # Application entry point
│   ├── preload.js                 # Secure IPC bridge
│   ├── extension_manager.js       # Extension management logic
│   └── context_loader.js          # Context loading & validation
│
├── renderer/                      # UI layer
│   ├── index.html                 # Main interface
│   ├── index.js                   # Renderer logic
│   └── styles.css                 # Dark theme styles
│
├── data/                          # Configuration data
│   ├── extensions.json            # Extension definitions
│   └── context/                   # Context configurations
│       ├── promptarchitect.json
│       ├── synapse.json
│       ├── scribe.json
│       └── sentinel.json
│
└── logs/                          # Application logs
    └── launcher.log
```

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **VS Code** (installed and accessible via `code` command)

## Installation

### Quick Start (Windows)

1. Clone or download this repository
2. Double-click `run_launcher.bat`
3. The launcher will automatically install dependencies and start

### Quick Start (Linux/macOS)

1. Clone or download this repository
2. Open terminal in the project directory
3. Run: `./run_launcher.sh`
4. The launcher will automatically install dependencies and start

### Manual Installation

```bash
# Install dependencies
npm install

# Start the application
npm start

# Start in development mode (with DevTools)
npm run dev
```

## Configuration

### Adding New Extensions

Edit `data/extensions.json`:

```json
{
  "extensions": [
    {
      "id": "myextension",
      "name": "My Extension",
      "description": "Description of my extension",
      "type": "vscode",
      "vscode_id": "publisher.extension-name",
      "context_file": "context/myextension.json",
      "agent": "Claude",
      "icon": "🔥",
      "enabled": true
    }
  ]
}
```

### Creating Context Files

Create a new JSON file in `data/context/`:

```json
{
  "profile": "Skynet - MyExtension",
  "memory_dir": "C:/path/to/memory",
  "workspace_path": "C:/path/to/workspace",
  "agent": "Claude",
  "instructions": [
    "Instruction 1",
    "Instruction 2"
  ],
  "env": {
    "API_KEY": "your_key_here",
    "MODEL": "claude-sonnet-4"
  },
  "files": [
    "C:/path/to/file1.txt",
    "C:/path/to/file2.txt"
  ],
  "settings": {
    "auto_save": true,
    "debug_mode": false
  }
}
```

### Context Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profile` | string | Yes | Profile name identifier |
| `memory_dir` | string | No | Directory for AI memory/context storage |
| `workspace_path` | string | No | Default workspace to open |
| `agent` | string | Yes | Associated AI agent name |
| `instructions` | array | No | List of operational instructions |
| `env` | object | No | Environment variables |
| `files` | array | No | Files to open on launch |
| `settings` | object | No | Custom settings |

## Usage

### Launching an Extension

1. Click the **Launch** button on any active extension card
2. The launcher will:
   - Load the associated context
   - Open VS Code with the configured workspace
   - Apply environment variables and settings
   - Log the operation

### Viewing Context

1. Click the **Context** button on any extension card
2. The context panel will open showing:
   - Profile information
   - Workspace and memory paths
   - Instructions
   - Environment variables
   - Associated files
   - Raw JSON configuration

### Viewing Logs

1. Click the **Logs** button in the header
2. View real-time application logs
3. Use **Clear Logs** to reset the log file

### Keyboard Shortcuts

- **ESC**: Close context panel or logs modal
- **Refresh**: Reload extensions list

## API Reference

### Extension Manager

```javascript
const manager = new ExtensionManager(basePath);

// Get all extensions
manager.getExtensions();

// Get extension by ID
manager.getExtensionById('extensionId');

// Launch extension
await manager.launchExtension('extensionId', context);

// Check VS Code installation
await manager.checkVSCodeInstalled();

// Logging
manager.log('message');
manager.getLogs(100);
manager.clearLogs();
```

### Context Loader

```javascript
const loader = new ContextLoader(basePath);

// Load context
loader.loadContext('context/file.json');

// Load context for extension
loader.loadContextForExtension(extension);

// Validate context
loader.validateContext(context);

// Get summary
loader.getContextSummary(context);
```

## IPC Communication

The application uses Electron's IPC for secure communication between main and renderer processes:

### Available Channels

- `get-extensions`: Retrieve all extensions
- `get-extension`: Get single extension by ID
- `get-context`: Load context for extension
- `launch-extension`: Launch extension with context
- `check-vscode`: Verify VS Code installation
- `get-logs`: Retrieve application logs
- `clear-logs`: Clear log file
- `validate-context`: Validate context structure

## Logging

All operations are logged to `logs/launcher.log`:

```
[2025-11-18T10:30:45.123Z] === VS Code Extension Launcher Started ===
[2025-11-18T10:30:47.456Z] Launching extension: PromptArchitect (raphael.promptarchitect)
[2025-11-18T10:30:47.457Z] Agent: Claude
[2025-11-18T10:30:47.458Z] Context loaded: { "profile": "Skynet - PromptArchitect", ... }
[2025-11-18T10:30:48.789Z] ✓ Extension launched successfully: PromptArchitect
```

## Development

### Project Structure

- **Main Process** (`app/main.js`): Handles window creation, IPC, and system operations
- **Preload Script** (`app/preload.js`): Secure bridge exposing APIs to renderer
- **Renderer Process** (`renderer/`): UI and user interactions
- **Managers** (`app/extension_manager.js`, `app/context_loader.js`): Business logic

### Building

The project uses Electron in development mode. For production builds:

```bash
# Install electron-builder
npm install --save-dev electron-builder

# Add to package.json
"build": {
  "appId": "com.skynet.vscode-launcher",
  "productName": "VS Code Extension Launcher",
  "directories": {
    "output": "dist"
  },
  "files": [
    "app/**/*",
    "renderer/**/*",
    "data/**/*",
    "package.json"
  ]
}

# Build
npm run build
```

### Security

- Context isolation enabled
- Node integration disabled in renderer
- Secure IPC through preload script
- No remote module access

## Troubleshooting

### VS Code Not Detected

Ensure VS Code is installed and the `code` command is available:

```bash
# Test VS Code CLI
code --version

# Windows: Add VS Code to PATH
# Linux/macOS: Run VS Code's "Install 'code' command in PATH"
```

### Extensions Not Loading

1. Check `data/extensions.json` syntax
2. Verify context files exist
3. Review logs in `logs/launcher.log`

### Launch Failures

1. Verify workspace paths exist
2. Check file permissions
3. Ensure VS Code extensions are installed
4. Review error logs

## Roadmap

### v1.1 (Planned)
- Extension marketplace integration
- Auto-update extensions
- Custom themes support
- Workspace templates

### v2.0 (Planned)
- Google Drive auto-sync
- Presence agent integration
- Multi-workspace support
- Cloud context storage
- Extension development tools

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Credits

**Project**: Skynet Forge
**Author**: Raphael
**Version**: 1.0.0
**Built with**: Electron, Node.js

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review logs for debugging

---

**Made with ⚡ by the Skynet Forge**
