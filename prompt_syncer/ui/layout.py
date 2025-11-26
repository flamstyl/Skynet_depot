#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skynet Prompt Syncer - UI Layout Module
Defines the PySimpleGUI interface layout
"""

import PySimpleGUI as sg
import json
from pathlib import Path
from typing import List, Dict

# Load style configuration
def load_style():
    """Load style configuration from JSON file."""
    try:
        style_path = Path(__file__).parent / "style.json"
        with open(style_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading style: {e}")
        return get_default_style()

def get_default_style():
    """Return default style configuration."""
    return {
        "theme": "DarkGrey13",
        "sizes": {
            "window_width": 1000,
            "window_height": 700,
            "button_width": 15,
            "log_height": 15,
            "prompt_list_height": 20
        }
    }

# Load style
STYLE = load_style()

# Set theme
sg.theme(STYLE.get('theme', 'DarkGrey13'))


def create_main_layout(prompts: List[Dict], agents: List[Dict]) -> List:
    """
    Create the main application layout.

    Args:
        prompts: List of available prompts
        agents: List of configured agents

    Returns:
        PySimpleGUI layout
    """

    # Header section
    header = [
        [sg.Text('🤖 SKYNET PROMPT SYNCER', font='Helvetica 18 bold',
                 text_color='#88c0d0', justification='center', expand_x=True)],
        [sg.Text('Universal Prompt Distributor v1.0', font='Helvetica 10',
                 text_color='#6c77bb', justification='center', expand_x=True)],
        [sg.HorizontalSeparator()]
    ]

    # Prompt selection section (left column)
    prompt_list_data = [
        [p['name'], p['size'], p['extension'], p['relative_path']]
        for p in prompts
    ]

    prompt_section = [
        [sg.Text('📁 Available Prompts', font='Helvetica 12 bold')],
        [sg.Text(f'{len(prompts)} prompts found', font='Helvetica 9', text_color='#6c77bb')],
        [sg.Table(
            values=prompt_list_data,
            headings=['Name', 'Size', 'Type', 'Path'],
            auto_size_columns=False,
            col_widths=[25, 8, 6, 30],
            num_rows=STYLE['sizes']['prompt_list_height'],
            key='-PROMPT_TABLE-',
            selected_row_colors='white on blue',
            enable_events=True,
            select_mode=sg.TABLE_SELECT_MODE_EXTENDED,
            expand_x=True,
            expand_y=True,
            font='Courier 9'
        )],
        [
            sg.Button('Select All', key='-SELECT_ALL-', size=(12, 1)),
            sg.Button('Clear Selection', key='-CLEAR_SELECTION-', size=(12, 1)),
            sg.Text('', expand_x=True),
            sg.Text('Selected: 0', key='-SELECTED_COUNT-', font='Helvetica 9 bold',
                   text_color='#88c0d0')
        ]
    ]

    # Agent selection section
    agent_list = [
        [sg.Checkbox(agent['name'], key=f"-AGENT_{i}-", default=agent.get('enabled', True),
                    font='Helvetica 10')]
        for i, agent in enumerate(agents)
    ]

    # Sync options section (right column)
    sync_section = [
        [sg.Text('🎯 Sync Targets', font='Helvetica 12 bold')],
        [sg.Frame('CLI Agents', agent_list, font='Helvetica 10 bold',
                 expand_x=True, relief=sg.RELIEF_SUNKEN)],
        [sg.Checkbox('Sync to VS Code PromptArchitect', key='-VSCODE_SYNC-',
                    default=True, font='Helvetica 10')],
        [sg.HorizontalSeparator()],
        [sg.Text('⚙️ Options', font='Helvetica 12 bold')],
        [sg.Checkbox('Create backups', key='-BACKUP-', default=True,
                    font='Helvetica 10')],
        [sg.Checkbox('Verify after sync', key='-VERIFY-', default=True,
                    font='Helvetica 10')],
        [sg.HorizontalSeparator()],
        [sg.Text('', expand_y=True)],  # Spacer
        [sg.Button('🚀 SYNC NOW', key='-SYNC-', size=(20, 2),
                  font='Helvetica 14 bold', button_color=('#ffffff', '#6c77bb'))],
        [sg.Button('Refresh Prompts', key='-REFRESH-', size=(20, 1))],
        [sg.Button('Open Config', key='-CONFIG-', size=(20, 1))],
    ]

    # Main content layout (two columns)
    main_content = [
        [
            sg.Column(prompt_section, vertical_alignment='top', expand_x=True, expand_y=True),
            sg.VerticalSeparator(),
            sg.Column(sync_section, vertical_alignment='top', expand_y=True)
        ]
    ]

    # Log section (bottom)
    log_section = [
        [sg.HorizontalSeparator()],
        [sg.Text('📋 Sync Log', font='Helvetica 12 bold')],
        [sg.Multiline(
            '',
            size=(None, STYLE['sizes']['log_height']),
            key='-LOG-',
            font='Courier 9',
            autoscroll=True,
            expand_x=True,
            disabled=True,
            text_color='#e3e6ee',
            background_color='#1c1e26'
        )],
        [
            sg.Button('Clear Log', key='-CLEAR_LOG-', size=(12, 1)),
            sg.Button('Export Log', key='-EXPORT_LOG-', size=(12, 1)),
            sg.Text('', expand_x=True),
            sg.Text('Status: Ready', key='-STATUS-', font='Helvetica 9',
                   text_color='#88c0d0')
        ]
    ]

    # Combine all sections
    layout = [
        *header,
        *main_content,
        *log_section,
        [sg.HorizontalSeparator()],
        [
            sg.Text('Skynet OS © 2024', font='Helvetica 8', text_color='#6c77bb'),
            sg.Text('', expand_x=True),
            sg.Button('Exit', key='-EXIT-', size=(10, 1))
        ]
    ]

    return layout


def create_config_window(config: Dict) -> sg.Window:
    """
    Create configuration editor window.

    Args:
        config: Current configuration

    Returns:
        PySimpleGUI window
    """
    layout = [
        [sg.Text('⚙️ Configuration Editor', font='Helvetica 14 bold')],
        [sg.HorizontalSeparator()],
        [sg.Text('Prompts Directory:', size=(20, 1)),
         sg.Input(config.get('prompts_dir', ''), key='-PROMPTS_DIR-', size=(50, 1)),
         sg.FolderBrowse()],
        [sg.Text('Agents Target Dir:', size=(20, 1)),
         sg.Input(config.get('agents_target_dir', ''), key='-AGENTS_DIR-', size=(50, 1)),
         sg.FolderBrowse()],
        [sg.Text('VS Code Dir:', size=(20, 1)),
         sg.Input(config.get('vscode_dir', ''), key='-VSCODE_DIR-', size=(50, 1)),
         sg.FolderBrowse()],
        [sg.Text('Backup Dir:', size=(20, 1)),
         sg.Input(config.get('backup_dir', ''), key='-BACKUP_DIR-', size=(50, 1)),
         sg.FolderBrowse()],
        [sg.HorizontalSeparator()],
        [sg.Button('Save', key='-SAVE-', size=(10, 1)),
         sg.Button('Cancel', key='-CANCEL-', size=(10, 1))]
    ]

    return sg.Window('Configuration', layout, modal=True, finalize=True)


def create_progress_window() -> sg.Window:
    """
    Create progress window for sync operations.

    Returns:
        PySimpleGUI window
    """
    layout = [
        [sg.Text('Synchronizing prompts...', font='Helvetica 12 bold')],
        [sg.ProgressBar(100, orientation='h', size=(40, 20), key='-PROGRESS-',
                       bar_color=('#6c77bb', '#2e3440'))],
        [sg.Text('Initializing...', key='-PROGRESS_TEXT-', size=(50, 1))],
        [sg.Button('Cancel', key='-CANCEL_SYNC-', size=(10, 1))]
    ]

    return sg.Window('Syncing...', layout, modal=True, finalize=True,
                    disable_close=True, keep_on_top=True)


def create_about_window() -> sg.Window:
    """
    Create about window.

    Returns:
        PySimpleGUI window
    """
    layout = [
        [sg.Text('🤖 Skynet Prompt Syncer', font='Helvetica 16 bold',
                text_color='#88c0d0')],
        [sg.Text('Universal Prompt Distributor', font='Helvetica 10')],
        [sg.HorizontalSeparator()],
        [sg.Text('Version: 1.0.0')],
        [sg.Text('Author: Raphaël (Skynet OS)')],
        [sg.Text('Built with: Python + PySimpleGUI')],
        [sg.HorizontalSeparator()],
        [sg.Multiline(
            'Skynet Prompt Syncer synchronizes your prompts from a central '
            'repository to all your AI agents and development tools.\n\n'
            'Features:\n'
            '  • Sync to multiple CLI agents\n'
            '  • VS Code PromptArchitect integration\n'
            '  • Automatic backups\n'
            '  • Verification after sync\n'
            '  • Detailed logging\n\n'
            'Part of the Skynet OS ecosystem.',
            size=(50, 10),
            disabled=True,
            no_scrollbar=True
        )],
        [sg.Button('Close', key='-CLOSE-', size=(10, 1))]
    ]

    return sg.Window('About', layout, modal=True, finalize=True)


def update_log(window: sg.Window, message: str, level: str = 'INFO'):
    """
    Update the log display.

    Args:
        window: PySimpleGUI window
        message: Log message
        level: Log level (INFO, SUCCESS, WARNING, ERROR)
    """
    from datetime import datetime

    timestamp = datetime.now().strftime('%H:%M:%S')

    # Color coding based on level
    icons = {
        'INFO': 'ℹ️',
        'SUCCESS': '✓',
        'WARNING': '⚠️',
        'ERROR': '✗'
    }

    icon = icons.get(level, 'ℹ️')
    log_line = f"[{timestamp}] {icon} {message}\n"

    window['-LOG-'].print(log_line, end='')


def update_status(window: sg.Window, status: str, color: str = '#88c0d0'):
    """
    Update the status bar.

    Args:
        window: PySimpleGUI window
        status: Status message
        color: Text color
    """
    window['-STATUS-'].update(f'Status: {status}', text_color=color)


def show_error(title: str, message: str):
    """
    Show error popup.

    Args:
        title: Error title
        message: Error message
    """
    sg.popup_error(message, title=title, keep_on_top=True)


def show_success(title: str, message: str):
    """
    Show success popup.

    Args:
        title: Success title
        message: Success message
    """
    sg.popup(message, title=title, keep_on_top=True)


def ask_confirmation(title: str, message: str) -> bool:
    """
    Ask for user confirmation.

    Args:
        title: Confirmation title
        message: Confirmation message

    Returns:
        True if confirmed, False otherwise
    """
    response = sg.popup_yes_no(message, title=title, keep_on_top=True)
    return response == 'Yes'


if __name__ == "__main__":
    # Test the layout
    print("Testing UI Layout...")

    # Sample data
    sample_prompts = [
        {'name': 'test1.txt', 'size': 1234, 'extension': '.txt', 'relative_path': 'test1.txt'},
        {'name': 'test2.md', 'size': 5678, 'extension': '.md', 'relative_path': 'test2.md'}
    ]

    sample_agents = [
        {'name': 'Claude CLI', 'enabled': True},
        {'name': 'Gemini CLI', 'enabled': True}
    ]

    layout = create_main_layout(sample_prompts, sample_agents)
    window = sg.Window('Skynet Prompt Syncer', layout,
                      size=(STYLE['sizes']['window_width'], STYLE['sizes']['window_height']),
                      finalize=True, resizable=True)

    print("Window created successfully!")
    print("Close the window to continue...")

    while True:
        event, values = window.read()
        if event in (sg.WIN_CLOSED, '-EXIT-'):
            break

    window.close()
