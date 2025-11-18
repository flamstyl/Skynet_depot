"""
Skynet Agent CLI Launcher - Main Application
PyQt5 GUI for managing and monitoring CLI agents.
"""

import sys
import os
import subprocess
from pathlib import Path
from typing import Optional, Dict

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QMessageBox, QListWidgetItem
)
from PyQt5.QtCore import QTimer, Qt
from PyQt5.uic import loadUi

from .agent_scanner import AgentScanner
from .agent_process import AgentProcessManager
from .logger_manager import LoggerManager


class AgentLauncherApp(QMainWindow):
    """
    Main application window for the Skynet Agent Launcher.
    """

    def __init__(self):
        super().__init__()

        # Initialize core components
        self.scanner = AgentScanner()
        self.logger = LoggerManager()
        self.process_manager = AgentProcessManager(output_callback=self._on_agent_output)

        # Current selected agent
        self.current_agent: Optional[Dict[str, str]] = None

        # Load UI
        self._load_ui()
        self._load_stylesheet()
        self._connect_signals()

        # Scan for agents
        self._refresh_agents()

        # Start update timer (400ms refresh)
        self.update_timer = QTimer()
        self.update_timer.timeout.connect(self._update_ui)
        self.update_timer.start(400)

        # Status bar message
        self.statusbar.showMessage("Ready")

        print("✓ Skynet Agent Launcher initialized")

    def _load_ui(self):
        """Load the UI file."""
        ui_path = Path(__file__).parent.parent / "ui" / "main_window.ui"

        if not ui_path.exists():
            raise FileNotFoundError(f"UI file not found: {ui_path}")

        loadUi(str(ui_path), self)

    def _load_stylesheet(self):
        """Load the dark theme stylesheet."""
        qss_path = Path(__file__).parent.parent / "ui" / "style.qss"

        if qss_path.exists():
            with open(qss_path, 'r', encoding='utf-8') as f:
                self.setStyleSheet(f.read())
        else:
            print(f"⚠️  Stylesheet not found: {qss_path}")

    def _connect_signals(self):
        """Connect UI signals to slots."""
        # Buttons
        self.startButton.clicked.connect(self._on_start_clicked)
        self.stopButton.clicked.connect(self._on_stop_clicked)
        self.refreshButton.clicked.connect(self._refresh_agents)
        self.openLogsButton.clicked.connect(self._on_open_logs_clicked)
        self.clearOutputButton.clicked.connect(self._on_clear_output_clicked)

        # Agent list selection
        self.agentListWidget.currentItemChanged.connect(self._on_agent_selected)

        # Menu actions
        self.actionRefresh.triggered.connect(self._refresh_agents)
        self.actionExit.triggered.connect(self.close)
        self.actionAbout.triggered.connect(self._show_about)

    def _refresh_agents(self):
        """Scan for agents and update the list."""
        self.statusbar.showMessage("Scanning for agents...")

        # Scan for agents
        agents = self.scanner.scan()

        # Update list widget
        self.agentListWidget.clear()

        for agent in agents:
            item = QListWidgetItem(f"🤖 {agent['name']}")
            item.setData(Qt.UserRole, agent)
            self.agentListWidget.addItem(item)

        # Update status
        count = len(agents)
        self.statusbar.showMessage(f"Found {count} agent(s)")

        # Select first agent if available
        if count > 0:
            self.agentListWidget.setCurrentRow(0)

    def _on_agent_selected(self, current: QListWidgetItem, previous: QListWidgetItem):
        """Handle agent selection change."""
        if current is None:
            self.current_agent = None
            self._update_agent_info(None)
            return

        # Get agent data
        agent = current.data(Qt.UserRole)
        self.current_agent = agent

        # Update info panel
        self._update_agent_info(agent)

    def _update_agent_info(self, agent: Optional[Dict[str, str]]):
        """Update the agent information panel."""
        if agent is None:
            self.agentNameLabel.setText("Name: -")
            self.agentPathLabel.setText("Path: -")
            self.agentTypeLabel.setText("Type: -")
            self.agentStatusLabel.setText("Status: -")
            return

        # Update labels
        self.agentNameLabel.setText(f"Name: {agent['name']}")
        self.agentPathLabel.setText(f"Path: {agent['path']}")
        self.agentTypeLabel.setText(f"Type: {agent['type'].upper()}")

        # Update status
        status = self.process_manager.get_status(agent['name'])
        self._update_status_label(status)

    def _update_status_label(self, status: str):
        """Update the status label with appropriate color."""
        status_upper = status.upper()

        if status == "running":
            self.agentStatusLabel.setText(f"Status: 🟢 {status_upper}")
            self.agentStatusLabel.setStyleSheet("color: #00ff00; font-weight: bold;")
        elif status == "error":
            self.agentStatusLabel.setText(f"Status: 🔴 {status_upper}")
            self.agentStatusLabel.setStyleSheet("color: #ff0000; font-weight: bold;")
        else:
            self.agentStatusLabel.setText(f"Status: ⚪ {status_upper}")
            self.agentStatusLabel.setStyleSheet("color: #888888; font-weight: bold;")

    def _on_start_clicked(self):
        """Handle Start button click."""
        if self.current_agent is None:
            QMessageBox.warning(self, "No Agent Selected", "Please select an agent to start.")
            return

        agent_name = self.current_agent['name']

        # Check if already running
        if self.process_manager.is_running(agent_name):
            QMessageBox.information(self, "Already Running", f"Agent '{agent_name}' is already running.")
            return

        # Start logging session
        try:
            log_path = self.logger.start_session(agent_name)
            self._append_output(f"[SYSTEM] Starting agent '{agent_name}'...")
            self._append_output(f"[SYSTEM] Log file: {log_path}")
        except Exception as e:
            QMessageBox.critical(self, "Logging Error", f"Failed to start logging: {e}")
            return

        # Start agent process
        success = self.process_manager.start_agent(self.current_agent)

        if success:
            self._append_output(f"[SYSTEM] Agent '{agent_name}' started successfully ✓")
            self.statusbar.showMessage(f"Agent '{agent_name}' started")
            self.logger.write_system(agent_name, "Agent started")
        else:
            self._append_output(f"[SYSTEM] Failed to start agent '{agent_name}' ✗")
            self.statusbar.showMessage(f"Failed to start agent '{agent_name}'")
            self.logger.close_session(agent_name)

    def _on_stop_clicked(self):
        """Handle Stop button click."""
        if self.current_agent is None:
            QMessageBox.warning(self, "No Agent Selected", "Please select an agent to stop.")
            return

        agent_name = self.current_agent['name']

        # Check if running
        if not self.process_manager.is_running(agent_name):
            QMessageBox.information(self, "Not Running", f"Agent '{agent_name}' is not running.")
            return

        # Stop agent
        self._append_output(f"[SYSTEM] Stopping agent '{agent_name}'...")
        success = self.process_manager.stop_agent(agent_name)

        if success:
            self._append_output(f"[SYSTEM] Agent '{agent_name}' stopped ✓")
            self.statusbar.showMessage(f"Agent '{agent_name}' stopped")
            self.logger.write_system(agent_name, "Agent stopped")
            self.logger.close_session(agent_name)
        else:
            self._append_output(f"[SYSTEM] Failed to stop agent '{agent_name}' ✗")
            self.statusbar.showMessage(f"Failed to stop agent '{agent_name}'")

    def _on_open_logs_clicked(self):
        """Open the logs folder for the current agent."""
        if self.current_agent is None:
            QMessageBox.warning(self, "No Agent Selected", "Please select an agent first.")
            return

        agent_name = self.current_agent['name']
        log_dir = self.logger.get_agent_log_dir(agent_name)

        # Create directory if it doesn't exist
        log_dir.mkdir(parents=True, exist_ok=True)

        # Open in file explorer
        try:
            if sys.platform == 'win32':
                os.startfile(str(log_dir))
            elif sys.platform == 'darwin':
                subprocess.Popen(['open', str(log_dir)])
            else:
                subprocess.Popen(['xdg-open', str(log_dir)])

            self.statusbar.showMessage(f"Opened logs folder for '{agent_name}'")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to open logs folder: {e}")

    def _on_clear_output_clicked(self):
        """Clear the output terminal."""
        self.outputTextEdit.clear()
        self.statusbar.showMessage("Output cleared")

    def _append_output(self, line: str):
        """Append a line to the output terminal."""
        self.outputTextEdit.appendPlainText(line)

        # Auto-scroll to bottom
        scrollbar = self.outputTextEdit.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())

    def _on_agent_output(self, agent_name: str, line: str):
        """Callback for agent output."""
        # Only show output if this is the currently selected agent
        if self.current_agent and self.current_agent['name'] == agent_name:
            self._append_output(line)

        # Write to log
        self.logger.write(agent_name, line)

    def _update_ui(self):
        """Periodic UI update (called every 400ms)."""
        if self.current_agent:
            # Update status
            status = self.process_manager.get_status(self.current_agent['name'])
            self._update_status_label(status)

            # Get any new output lines
            if self.current_agent['name'] in self.process_manager.processes:
                agent_process = self.process_manager.processes[self.current_agent['name']]
                lines = agent_process.get_output_lines()

                for line in lines:
                    # Output callback already handles logging
                    pass

    def _show_about(self):
        """Show about dialog."""
        about_text = """
        <h2>Skynet Agent CLI Launcher v1.0</h2>
        <p>Intelligent agent management and monitoring system.</p>
        <p><b>Features:</b></p>
        <ul>
            <li>Automatic agent discovery</li>
            <li>Process management and monitoring</li>
            <li>Real-time output capture</li>
            <li>Session-based logging</li>
            <li>Dark theme interface</li>
        </ul>
        <p>Built with PyQt5 and Python</p>
        """
        QMessageBox.about(self, "About Skynet Agent Launcher", about_text)

    def closeEvent(self, event):
        """Handle application close."""
        # Check if any agents are running
        running_agents = [
            name for name, status in self.process_manager.get_all_statuses().items()
            if status == "running"
        ]

        if running_agents:
            reply = QMessageBox.question(
                self,
                "Agents Running",
                f"{len(running_agents)} agent(s) are still running. Stop them and exit?",
                QMessageBox.Yes | QMessageBox.No,
                QMessageBox.No
            )

            if reply == QMessageBox.No:
                event.ignore()
                return

            # Stop all agents
            self.process_manager.stop_all()

        # Close all logging sessions
        self.logger.close_all()

        event.accept()


def run():
    """
    Run the Skynet Agent Launcher application.
    """
    app = QApplication(sys.argv)
    app.setApplicationName("Skynet Agent Launcher")

    # Create and show main window
    window = AgentLauncherApp()
    window.show()

    # Run application
    sys.exit(app.exec_())


if __name__ == "__main__":
    run()
