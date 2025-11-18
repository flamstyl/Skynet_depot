#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skynet Prompt Syncer - Main Application
Orchestrates the prompt synchronization application
"""

import sys
import os
from pathlib import Path
from typing import List, Dict, Optional
import logging
from datetime import datetime

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import PySimpleGUI as sg
except ImportError:
    print("Error: PySimpleGUI not installed. Install with: pip install PySimpleGUI")
    sys.exit(1)

from core.config_loader import ConfigLoader
from core.prompt_loader import list_prompts, load_prompt
from core.agent_syncer import AgentSyncer
from core.vscode_syncer import VSCodeSyncer
from ui.layout import (
    create_main_layout, update_log, update_status,
    show_error, show_success, ask_confirmation,
    create_config_window, create_progress_window,
    STYLE
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/sync.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class PromptSyncerApp:
    """Main application class for Skynet Prompt Syncer."""

    def __init__(self):
        """Initialize the application."""
        self.config_loader = None
        self.config = {}
        self.prompts = []
        self.agents = []
        self.window = None
        self.selected_prompt_indices = []

        logger.info("Initializing Skynet Prompt Syncer...")

        # Ensure logs directory exists
        Path('logs').mkdir(exist_ok=True)

    def load_configuration(self) -> bool:
        """
        Load configuration files.

        Returns:
            True if successful, False otherwise
        """
        try:
            self.config_loader = ConfigLoader()
            self.config = self.config_loader.load_all()

            logger.info("Configuration loaded successfully")
            logger.info(f"Prompts directory: {self.config['prompts_dir']}")
            logger.info(f"Found {len(self.config['agents'])} agents")

            return True

        except Exception as e:
            logger.error(f"Error loading configuration: {e}")
            show_error("Configuration Error",
                      f"Failed to load configuration:\n{e}\n\n"
                      "Please check your config files.")
            return False

    def load_prompts(self) -> bool:
        """
        Load available prompts.

        Returns:
            True if successful, False otherwise
        """
        try:
            prompts_dir = self.config.get('prompts_dir', '')

            if not prompts_dir:
                logger.error("Prompts directory not configured")
                return False

            self.prompts = list_prompts(prompts_dir)
            logger.info(f"Loaded {len(self.prompts)} prompts")

            return True

        except Exception as e:
            logger.error(f"Error loading prompts: {e}")
            show_error("Error", f"Failed to load prompts:\n{e}")
            return False

    def create_window(self) -> sg.Window:
        """
        Create the main application window.

        Returns:
            PySimpleGUI window
        """
        self.agents = self.config.get('agents', [])
        layout = create_main_layout(self.prompts, self.agents)

        window = sg.Window(
            'Skynet Prompt Syncer - Universal Distributor',
            layout,
            size=(STYLE['sizes']['window_width'], STYLE['sizes']['window_height']),
            finalize=True,
            resizable=True,
            icon=None
        )

        # Initial log message
        update_log(window, "Skynet Prompt Syncer initialized", "SUCCESS")
        update_log(window, f"Loaded {len(self.prompts)} prompts from {self.config['prompts_dir']}", "INFO")
        update_log(window, f"Configured {len(self.agents)} agents", "INFO")

        return window

    def handle_sync(self, values: Dict):
        """
        Handle the sync operation.

        Args:
            values: Window values dictionary
        """
        try:
            # Get selected prompts
            selected_indices = values['-PROMPT_TABLE-']

            if not selected_indices:
                show_error("No Selection", "Please select at least one prompt to sync.")
                return

            selected_prompts = [self.prompts[i] for i in selected_indices]

            # Get selected agents
            selected_agents = []
            for i, agent in enumerate(self.agents):
                if values.get(f'-AGENT_{i}-', False):
                    selected_agents.append(agent)

            # Get VS Code sync option
            vscode_sync = values.get('-VSCODE_SYNC-', False)

            # Validate selections
            if not selected_agents and not vscode_sync:
                show_error("No Target", "Please select at least one sync target (agents or VS Code).")
                return

            # Confirm operation
            summary = f"Sync {len(selected_prompts)} prompt(s) to:\n"
            if selected_agents:
                summary += f"  • {len(selected_agents)} agent(s)\n"
            if vscode_sync:
                summary += f"  • VS Code PromptArchitect\n"
            summary += "\nProceed?"

            if not ask_confirmation("Confirm Sync", summary):
                update_log(self.window, "Sync cancelled by user", "WARNING")
                return

            # Perform sync
            update_status(self.window, "Syncing...", "#ebcb8b")
            update_log(self.window, "=" * 50, "INFO")
            update_log(self.window, f"Starting sync operation: {len(selected_prompts)} prompts", "INFO")

            backup_enabled = values.get('-BACKUP-', True)
            total_operations = 0
            successful_operations = 0

            # Sync to agents
            if selected_agents:
                update_log(self.window, f"Syncing to {len(selected_agents)} agents...", "INFO")

                agent_syncer = AgentSyncer(
                    backup_enabled=backup_enabled,
                    backup_dir=self.config.get('backup_dir')
                )

                for prompt in selected_prompts:
                    results = agent_syncer.sync_to_all_agents(prompt['path'], selected_agents)

                    for result in results:
                        total_operations += 1
                        if result['success']:
                            successful_operations += 1
                            update_log(self.window, result['message'], "SUCCESS")
                        else:
                            update_log(self.window, result['message'], "ERROR")

            # Sync to VS Code
            if vscode_sync:
                update_log(self.window, "Syncing to VS Code PromptArchitect...", "INFO")

                vscode_syncer = VSCodeSyncer(
                    vscode_dir=self.config.get('vscode_dir', ''),
                    backup_enabled=backup_enabled
                )

                prompt_paths = [p['path'] for p in selected_prompts]
                results = vscode_syncer.sync_multiple_prompts(prompt_paths)

                for result in results:
                    total_operations += 1
                    if result['success']:
                        successful_operations += 1
                        update_log(self.window, result['message'], "SUCCESS")
                    else:
                        update_log(self.window, result['message'], "ERROR")

            # Summary
            update_log(self.window, "=" * 50, "INFO")
            update_log(self.window,
                      f"Sync complete: {successful_operations}/{total_operations} successful",
                      "SUCCESS" if successful_operations == total_operations else "WARNING")

            if successful_operations == total_operations:
                update_status(self.window, "Sync completed successfully", "#a3be8c")
                show_success("Success", f"All {total_operations} operations completed successfully!")
            else:
                update_status(self.window, "Sync completed with errors", "#ebcb8b")
                show_error("Partial Success",
                          f"{successful_operations}/{total_operations} operations successful.\n"
                          "Check the log for details.")

        except Exception as e:
            logger.error(f"Error during sync: {e}", exc_info=True)
            update_log(self.window, f"SYNC FAILED: {e}", "ERROR")
            update_status(self.window, "Sync failed", "#bf616a")
            show_error("Sync Error", f"An error occurred during sync:\n{e}")

    def handle_refresh(self):
        """Refresh the prompts list."""
        try:
            update_log(self.window, "Refreshing prompts list...", "INFO")
            update_status(self.window, "Refreshing...", "#ebcb8b")

            if self.load_prompts():
                # Recreate window with updated prompts
                self.window.close()
                self.window = self.create_window()
                update_log(self.window, f"Refreshed: {len(self.prompts)} prompts found", "SUCCESS")
                update_status(self.window, "Ready", "#a3be8c")
            else:
                update_log(self.window, "Failed to refresh prompts", "ERROR")
                update_status(self.window, "Refresh failed", "#bf616a")

        except Exception as e:
            logger.error(f"Error refreshing prompts: {e}")
            update_log(self.window, f"Refresh error: {e}", "ERROR")

    def handle_table_selection(self, values: Dict):
        """
        Handle prompt table selection changes.

        Args:
            values: Window values dictionary
        """
        selected_indices = values['-PROMPT_TABLE-']
        count = len(selected_indices)
        self.window['-SELECTED_COUNT-'].update(f'Selected: {count}')

    def handle_select_all(self):
        """Select all prompts."""
        all_indices = list(range(len(self.prompts)))
        self.window['-PROMPT_TABLE-'].update(select_rows=all_indices)
        self.window['-SELECTED_COUNT-'].update(f'Selected: {len(all_indices)}')
        update_log(self.window, f"Selected all {len(all_indices)} prompts", "INFO")

    def handle_clear_selection(self):
        """Clear prompt selection."""
        self.window['-PROMPT_TABLE-'].update(select_rows=[])
        self.window['-SELECTED_COUNT-'].update('Selected: 0')
        update_log(self.window, "Selection cleared", "INFO")

    def handle_config(self):
        """Open configuration editor."""
        config_window = create_config_window(self.config)

        while True:
            event, values = config_window.read()

            if event in (sg.WIN_CLOSED, '-CANCEL-'):
                break

            if event == '-SAVE-':
                # Update configuration
                updates = {
                    'skynet_prompts_dir': values['-PROMPTS_DIR-'],
                    'agents_target_dir': values['-AGENTS_DIR-'],
                    'vscode_promptarchitect_dir': values['-VSCODE_DIR-'],
                    'backup_dir': values['-BACKUP_DIR-']
                }

                if self.config_loader.update_sync_config(updates):
                    show_success("Success", "Configuration saved successfully!")
                    update_log(self.window, "Configuration updated", "SUCCESS")
                    config_window.close()
                    # Reload configuration
                    self.load_configuration()
                else:
                    show_error("Error", "Failed to save configuration.")

        config_window.close()

    def handle_clear_log(self):
        """Clear the log display."""
        self.window['-LOG-'].update('')
        update_log(self.window, "Log cleared", "INFO")

    def handle_export_log(self):
        """Export log to file."""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            log_file = f"logs/sync_export_{timestamp}.txt"

            log_content = self.window['-LOG-'].get()

            with open(log_file, 'w', encoding='utf-8') as f:
                f.write(log_content)

            update_log(self.window, f"Log exported to {log_file}", "SUCCESS")
            show_success("Success", f"Log exported to:\n{log_file}")

        except Exception as e:
            logger.error(f"Error exporting log: {e}")
            show_error("Error", f"Failed to export log:\n{e}")

    def run(self):
        """Run the main application loop."""
        # Load configuration
        if not self.load_configuration():
            return

        # Load prompts
        if not self.load_prompts():
            logger.warning("No prompts loaded, but continuing...")

        # Create window
        self.window = self.create_window()

        logger.info("Application started successfully")

        # Main event loop
        while True:
            event, values = self.window.read()

            if event in (sg.WIN_CLOSED, '-EXIT-'):
                logger.info("Application closing...")
                break

            # Handle events
            if event == '-SYNC-':
                self.handle_sync(values)

            elif event == '-REFRESH-':
                self.handle_refresh()

            elif event == '-PROMPT_TABLE-':
                self.handle_table_selection(values)

            elif event == '-SELECT_ALL-':
                self.handle_select_all()

            elif event == '-CLEAR_SELECTION-':
                self.handle_clear_selection()

            elif event == '-CONFIG-':
                self.handle_config()

            elif event == '-CLEAR_LOG-':
                self.handle_clear_log()

            elif event == '-EXPORT_LOG-':
                self.handle_export_log()

        self.window.close()
        logger.info("Application closed")


def run():
    """Entry point for the application."""
    try:
        app = PromptSyncerApp()
        app.run()

    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sg.popup_error(f"Fatal Error:\n{e}", title="Error", keep_on_top=True)
        sys.exit(1)


if __name__ == "__main__":
    run()
