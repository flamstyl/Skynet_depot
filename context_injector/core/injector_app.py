"""
Skynet Context Injector — Main Application
PyQt5 GUI for injecting context files into AI agent CLIs
"""

import sys
import os
from PyQt5 import QtWidgets, uic
from PyQt5.QtCore import Qt, QTimer
from PyQt5.QtWidgets import QFileDialog, QMessageBox

from .agent_loader import load_agents, launch_agent_with_context, logger
from .file_reader import read_context_file, get_file_info, format_context_for_injection


class ContextInjectorApp(QtWidgets.QMainWindow):
    """Main application window for the Skynet Context Injector."""

    def __init__(self):
        super().__init__()

        # Load UI file
        ui_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ui', 'main_window.ui')
        uic.loadUi(ui_file, self)

        # Load and apply stylesheet
        style_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ui', 'style.qss')
        if os.path.exists(style_file):
            with open(style_file, 'r') as f:
                self.setStyleSheet(f.read())

        # State variables
        self.selected_file_path = None
        self.selected_agent = None
        self.running_process = None

        # Initialize UI
        self._init_ui()
        self._load_agents()
        self._connect_signals()

        self.log_message("✓ Skynet Context Injector initialized")
        self.log_message("Ready to inject context into AI agents...")

    def _init_ui(self):
        """Initialize UI components."""
        # Disable launch button initially
        self.launchButton.setEnabled(False)

        # Set window properties
        self.setWindowTitle("Skynet Context Injector — Memory Loader v1.0")
        self.resize(900, 700)

    def _load_agents(self):
        """Load available agents into the combo box."""
        agents = load_agents()

        if not agents:
            self.log_message("⚠ Warning: No agents found in configuration", level="warning")
            self.agentComboBox.addItem("No agents available")
            return

        for agent in agents:
            agent_name = agent.get('name', 'Unknown')
            agent_desc = agent.get('description', '')
            display_text = f"{agent_name}"
            if agent_desc:
                display_text += f" — {agent_desc}"

            self.agentComboBox.addItem(display_text, userData=agent)

        self.log_message(f"✓ Loaded {len(agents)} agents")

    def _connect_signals(self):
        """Connect UI signals to slots."""
        self.selectFileButton.clicked.connect(self._on_select_file)
        self.agentComboBox.currentIndexChanged.connect(self._on_agent_selected)
        self.launchButton.clicked.connect(self._on_launch)
        self.clearLogButton.clicked.connect(self._on_clear_log)
        self.viewHistoryButton.clicked.connect(self._on_view_history)

    def _on_select_file(self):
        """Handle file selection."""
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            "Select Context File",
            os.path.expanduser("~"),
            "Context Files (*.json *.md);;JSON Files (*.json);;Markdown Files (*.md);;All Files (*.*)"
        )

        if file_path:
            try:
                # Validate file
                content = read_context_file(file_path)
                file_info = get_file_info(file_path)

                self.selected_file_path = file_path
                self.contextFilePathEdit.setText(file_path)

                # Update file info
                info_text = f"File: {file_info['name']} | Type: {file_info['type']} | Size: {file_info['size_kb']} KB"
                self.fileInfoLabel.setText(info_text)

                self.log_message(f"✓ Context file loaded: {file_info['name']}")
                self._update_launch_button()

            except Exception as e:
                self.log_message(f"✗ Error loading file: {e}", level="error")
                QMessageBox.critical(self, "File Error", f"Failed to load context file:\n{e}")
                self.selected_file_path = None

    def _on_agent_selected(self, index):
        """Handle agent selection."""
        if index < 0:
            return

        agent_data = self.agentComboBox.itemData(index)
        if agent_data and isinstance(agent_data, dict):
            self.selected_agent = agent_data

            # Update agent info
            agent_name = agent_data.get('name', 'Unknown')
            agent_exec = agent_data.get('exec', 'N/A')
            info_text = f"Agent: {agent_name} | Command: {agent_exec}"
            self.agentInfoLabel.setText(info_text)

            self.log_message(f"✓ Agent selected: {agent_name}")
            self._update_launch_button()
        else:
            self.selected_agent = None

    def _update_launch_button(self):
        """Enable/disable launch button based on selections."""
        can_launch = self.selected_file_path is not None and self.selected_agent is not None
        self.launchButton.setEnabled(can_launch)

        if can_launch:
            self.statusLabel.setText("Status: Ready to launch")
        else:
            self.statusLabel.setText("Status: Select file and agent")

    def _on_launch(self):
        """Launch the agent with context injection."""
        if not self.selected_file_path or not self.selected_agent:
            QMessageBox.warning(self, "Invalid Selection", "Please select both a context file and an agent.")
            return

        try:
            # Read and format context
            self.log_message("=" * 60)
            self.log_message("🚀 Initiating context injection...")

            context_content = read_context_file(self.selected_file_path)
            file_info = get_file_info(self.selected_file_path)
            formatted_context = format_context_for_injection(context_content, file_info['type'])

            agent_name = self.selected_agent.get('name', 'Unknown')
            self.log_message(f"Target agent: {agent_name}")
            self.log_message(f"Context file: {file_info['name']}")
            self.log_message(f"Context size: {len(formatted_context)} characters")

            # Launch agent
            self.statusLabel.setText("Status: Launching agent...")
            QtWidgets.QApplication.processEvents()  # Update UI

            process = launch_agent_with_context(
                self.selected_agent,
                formatted_context,
                file_info['name']
            )

            self.running_process = process

            self.log_message(f"✓ Agent launched successfully!")
            self.log_message(f"✓ Context injected into {agent_name}")
            self.log_message(f"✓ Process PID: {process.pid}")
            self.log_message("=" * 60)

            self.statusLabel.setText(f"Status: Agent running (PID: {process.pid})")

            QMessageBox.information(
                self,
                "Launch Successful",
                f"Agent '{agent_name}' launched successfully!\n\n"
                f"Context from '{file_info['name']}' has been injected.\n"
                f"Process ID: {process.pid}\n\n"
                f"Check the agent's terminal window for interaction."
            )

        except Exception as e:
            self.log_message(f"✗ Launch failed: {e}", level="error")
            self.statusLabel.setText("Status: Launch failed")
            QMessageBox.critical(self, "Launch Error", f"Failed to launch agent:\n\n{e}")

    def _on_clear_log(self):
        """Clear the log text area."""
        self.logTextEdit.clear()
        self.log_message("Log cleared")

    def _on_view_history(self):
        """View injection history."""
        history_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'logs',
            'injection_history.log'
        )

        if not os.path.exists(history_file):
            QMessageBox.information(self, "No History", "No injection history found yet.")
            return

        try:
            with open(history_file, 'r', encoding='utf-8') as f:
                history = f.read()

            # Create a dialog to show history
            dialog = QtWidgets.QDialog(self)
            dialog.setWindowTitle("Injection History")
            dialog.resize(600, 400)

            layout = QtWidgets.QVBoxLayout()

            text_edit = QtWidgets.QPlainTextEdit()
            text_edit.setReadOnly(True)
            text_edit.setPlainText(history)
            text_edit.setStyleSheet(self.logTextEdit.styleSheet())

            close_button = QtWidgets.QPushButton("Close")
            close_button.clicked.connect(dialog.close)

            layout.addWidget(QtWidgets.QLabel("Injection History:"))
            layout.addWidget(text_edit)
            layout.addWidget(close_button)

            dialog.setLayout(layout)
            dialog.exec_()

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to read history:\n{e}")

    def log_message(self, message: str, level: str = "info"):
        """
        Log a message to the text area.

        Args:
            message: The message to log
            level: Log level (info, warning, error)
        """
        prefix = ""
        if level == "warning":
            prefix = "⚠ "
        elif level == "error":
            prefix = "✗ "

        formatted_message = f"{prefix}{message}"
        self.logTextEdit.appendPlainText(formatted_message)

        # Auto-scroll to bottom
        scrollbar = self.logTextEdit.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())


def run():
    """Run the Skynet Context Injector application."""
    app = QtWidgets.QApplication(sys.argv)
    app.setApplicationName("Skynet Context Injector")

    window = ContextInjectorApp()
    window.show()

    sys.exit(app.exec_())
