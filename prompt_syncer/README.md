# 🤖 Skynet Prompt Syncer - Universal Prompt Distributor v1.0

## Overview

**Skynet Prompt Syncer** is a powerful GUI application that synchronizes prompts from a central repository to multiple AI agents and development tools. It ensures consistency across your entire AI ecosystem by maintaining unified prompts across all platforms.

Part of the **Skynet OS** ecosystem.

## Features

- **Multi-Target Synchronization**: Sync prompts to multiple CLI agents simultaneously
- **VS Code Integration**: Direct integration with VS Code PromptArchitect
- **Intelligent Backup System**: Automatic backups before overwriting files
- **Visual Interface**: Clean, dark-themed PySimpleGUI interface
- **Detailed Logging**: Complete audit trail of all sync operations
- **Flexible Configuration**: Easy JSON-based configuration
- **Batch Operations**: Select and sync multiple prompts at once
- **Real-time Status**: Live sync status and operation feedback

## Architecture

```
/prompt_syncer/
  ├── core/                      # Core application logic
  │     ├── syncer_app.py       # Main application orchestrator
  │     ├── prompt_loader.py    # Prompt file discovery and loading
  │     ├── agent_syncer.py     # Agent synchronization engine
  │     ├── vscode_syncer.py    # VS Code integration
  │     └── config_loader.py    # Configuration management
  │
  ├── ui/                        # User interface
  │     ├── layout.py           # PySimpleGUI layouts
  │     └── style.json          # UI styling configuration
  │
  ├── data/                      # Configuration files
  │     ├── sync_config.json    # Main configuration
  │     └── agents.json         # Agent definitions
  │
  ├── logs/                      # Application logs
  │     └── sync.log            # Synchronization log
  │
  ├── requirements.txt          # Python dependencies
  ├── run_syncer.py            # Application launcher
  └── README.md                # This file
```

## Installation

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

### Quick Install

1. **Clone or navigate to the repository**:
   ```bash
   cd prompt_syncer
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure paths** (see Configuration section below)

4. **Run the application**:
   ```bash
   python run_syncer.py
   ```

## Configuration

### 1. Main Configuration (`data/sync_config.json`)

Configure your directory paths:

```json
{
  "skynet_prompts_dir": "C:/Users/rapha/Skynet_Drive_Core/prompts",
  "agents_target_dir": "C:/Users/rapha/IA/agents_contexts",
  "vscode_promptarchitect_dir": "C:/Users/rapha/AppData/Roaming/Code/User/promptarchitect_templates",
  "backup_enabled": true,
  "backup_dir": "C:/Users/rapha/Skynet_Drive_Core/prompts_backup",
  "sync_history_file": "sync_history.json"
}
```

**Key Settings**:
- `skynet_prompts_dir`: Central prompts repository (source)
- `agents_target_dir`: Base directory for agent contexts
- `vscode_promptarchitect_dir`: VS Code PromptArchitect templates folder
- `backup_enabled`: Enable/disable automatic backups
- `backup_dir`: Location for backup files

### 2. Agent Configuration (`data/agents.json`)

Define your AI agents:

```json
{
  "agents": [
    {
      "name": "Claude CLI",
      "context_dir": "C:/Users/rapha/IA/agents/claude/context",
      "enabled": true
    },
    {
      "name": "Gemini CLI",
      "context_dir": "C:/Users/rapha/IA/agents/gemini/context",
      "enabled": true
    }
  ]
}
```

**Adding New Agents**:
Simply add a new entry to the `agents` array with:
- `name`: Display name of the agent
- `context_dir`: Path to agent's context directory
- `enabled`: Whether agent is active (true/false)

## Usage

### Starting the Application

```bash
python run_syncer.py
```

### Basic Workflow

1. **Launch Application**: Run `run_syncer.py`
2. **View Prompts**: All prompts from your central repository are listed
3. **Select Prompts**: Click to select one or multiple prompts
4. **Choose Targets**: Check boxes for agents and/or VS Code
5. **Sync**: Click "SYNC NOW" button
6. **Monitor**: Watch the log for real-time sync status

### Interface Guide

#### Main Sections

- **Available Prompts** (Left Panel):
  - Browse all available prompts
  - Sort and filter capabilities
  - Multi-selection support
  - Shows file name, size, type, and path

- **Sync Targets** (Right Panel):
  - Agent checkboxes
  - VS Code toggle
  - Backup options
  - Verification settings

- **Sync Log** (Bottom Panel):
  - Real-time operation logs
  - Color-coded status messages
  - Export and clear options

#### Buttons

- **Select All**: Select all available prompts
- **Clear Selection**: Deselect all prompts
- **SYNC NOW**: Execute synchronization
- **Refresh Prompts**: Reload prompt list
- **Open Config**: Edit configuration
- **Clear Log**: Clear the log display
- **Export Log**: Save log to file

## Features in Detail

### Automatic Backups

When enabled, the syncer creates timestamped backups before overwriting any files:

```
backup_dir/
  ├── Claude CLI/
  │   ├── prompt1_20241118_143022.txt
  │   └── prompt2_20241118_143025.md
  └── Gemini CLI/
      └── prompt1_20241118_143023.txt
```

### Supported File Types

- `.txt` - Plain text prompts
- `.md` - Markdown formatted prompts
- `.json` - JSON structured prompts
- `.jsonl` - JSON Lines (multi-fragment prompts)
- `.prompt` - Custom prompt files

### JSONL Special Handling

JSONL files are treated as prompt fragment collections and imported as structured data:

```json
{
  "name": "prompt_collection",
  "imported": "2024-11-18T14:30:00",
  "fragments": [...]
}
```

### Logging

All operations are logged to:
- **UI Log Panel**: Real-time visual feedback
- **File Log**: `logs/sync.log` for audit trail

Log levels:
- 🟢 **SUCCESS**: Operation completed successfully
- 🔵 **INFO**: General information
- 🟡 **WARNING**: Non-critical issues
- 🔴 **ERROR**: Operation failures

## Advanced Usage

### Programmatic Access

You can import and use the modules programmatically:

```python
from core.config_loader import ConfigLoader
from core.prompt_loader import list_prompts
from core.agent_syncer import AgentSyncer

# Load configuration
config_loader = ConfigLoader()
config = config_loader.load_all()

# List prompts
prompts = list_prompts(config['prompts_dir'])

# Sync to agents
syncer = AgentSyncer(backup_enabled=True)
result = syncer.sync_to_agent(prompts[0]['path'], config['agents'][0])
```

### Custom Workflows

Create custom sync workflows by combining modules:

```python
# Example: Sync only markdown prompts to Claude
from pathlib import Path
from core.prompt_loader import list_prompts
from core.agent_syncer import AgentSyncer

prompts = list_prompts("./prompts")
md_prompts = [p for p in prompts if p['extension'] == '.md']

claude_agent = {
    'name': 'Claude',
    'context_dir': './claude/context'
}

syncer = AgentSyncer()
for prompt in md_prompts:
    syncer.sync_to_agent(prompt['path'], claude_agent)
```

## Troubleshooting

### Common Issues

**1. "Prompts directory not found"**
- Check `sync_config.json` paths
- Ensure directories exist
- Use absolute paths

**2. "Permission denied" errors**
- Run with appropriate permissions
- Check folder write access
- Verify antivirus isn't blocking

**3. "PySimpleGUI not installed"**
- Install dependencies: `pip install -r requirements.txt`

**4. Empty prompts list**
- Verify `skynet_prompts_dir` path
- Check file extensions
- Click "Refresh Prompts"

### Debug Mode

Enable detailed logging by editing `core/syncer_app.py`:

```python
logging.basicConfig(level=logging.DEBUG)
```

## Best Practices

1. **Regular Backups**: Keep backup_enabled=true
2. **Test First**: Test with a single agent before syncing to all
3. **Verify Sync**: Enable verification to ensure file integrity
4. **Organize Prompts**: Use subdirectories in your prompts folder
5. **Version Control**: Keep your prompts repository under git
6. **Log Review**: Periodically review logs for issues

## Roadmap

Future enhancements planned:

- [ ] Automatic sync scheduling
- [ ] Cloud storage integration (Drive, Dropbox)
- [ ] Prompt versioning and history
- [ ] Conflict resolution UI
- [ ] Multi-user support
- [ ] API endpoints for external tools
- [ ] Plugin system for custom syncers
- [ ] Prompt templates and variables
- [ ] Differential sync (only changed files)
- [ ] Web-based interface option

## Contributing

Part of the Skynet OS ecosystem. Contributions welcome!

1. Test thoroughly
2. Follow existing code style
3. Update documentation
4. Add logging for new features

## Technical Details

### Dependencies

- **PySimpleGUI**: GUI framework (v4.60+)
- **Standard Library**: pathlib, json, shutil, logging, datetime

### Performance

- Handles 1000+ prompts efficiently
- Async operations for large syncs (planned)
- Minimal memory footprint
- Fast file operations with shutil.copy2

### Security

- No network operations (local only)
- No external API calls
- File permission respect
- Backup before overwrite

## License

Part of Skynet OS - See main repository for license

## Support

For issues, questions, or suggestions:
- Check logs in `logs/sync.log`
- Review configuration files
- Consult this README

## Credits

**Author**: Raphaël (Skynet OS)
**Version**: 1.0.0
**Built with**: Python + PySimpleGUI
**Part of**: Skynet OS Ecosystem

---

**Skynet Prompt Syncer** - Keeping your AI prompts in perfect harmony 🎯
