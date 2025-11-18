"""
MCP Control Panel - Main Application
PyQt5 GUI application for managing multiple AI CLI agents
"""

import sys
import os
from pathlib import Path
from datetime import datetime

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QListWidgetItem, QMessageBox,
    QFileDialog
)
from PyQt5.QtCore import QTimer, Qt
from PyQt5.QtGui import QColor, QFont
from PyQt5 import uic

# Import core modules
from .agent_manager import AgentManager
from .context_loader import ContextLoader, AgentContext
from .history_manager import HistoryManager, LogLevel


class MCPControlPanel(QMainWindow):
    """Main MCP Control Panel Application"""

    def __init__(self):
        super().__init__()

        # Determine paths
        self.base_dir = Path(__file__).parent.parent
        self.ui_file = self.base_dir / 'ui' / 'main_window.ui'
        self.style_file = self.base_dir / 'ui' / 'style.qss'
        self.agents_dir = self.base_dir / 'agents'
        self.logs_dir = self.base_dir / 'logs'
        self.log_file = self.logs_dir / 'mcp_history.log'

        # Initialize managers
        self.agent_manager = AgentManager()
        self.context_loader = ContextLoader(str(self.agents_dir))
        self.history_manager = HistoryManager(str(self.log_file))

        # Current state
        self.current_agent_id = None
        self.selected_agent_context = None

        # Load UI
        self.init_ui()

        # Load agents
        self.load_agents()

        # Setup timer for live updates
        self.update_timer = QTimer()
        self.update_timer.timeout.connect(self.update_live_output)
        self.update_timer.start(500)  # Update every 500ms

        # Log startup
        self.history_manager.log_system_event("MCP Control Panel started")

    def init_ui(self):
        """Initialize the user interface"""
        # Load UI from .ui file
        if self.ui_file.exists():
            uic.loadUi(str(self.ui_file), self)
        else:
            # Fallback: create basic UI programmatically
            self.setWindowTitle("MCP Control Panel - Skynet Multi-Agent Manager")
            self.resize(1200, 800)
            print(f"Warning: UI file not found at {self.ui_file}")

        # Load stylesheet
        if self.style_file.exists():
            with open(self.style_file, 'r', encoding='utf-8') as f:
                self.setStyleSheet(f.read())

        # Connect signals
        self.connect_signals()

        # Set initial status
        self.update_status("Ready", success=True)

    def connect_signals(self):
        """Connect UI signals to handlers"""
        try:
            # Agent list selection
            self.agentListWidget.currentItemChanged.connect(self.on_agent_selected)

            # Control buttons
            self.btnLaunch.clicked.connect(self.on_launch_clicked)
            self.btnStop.clicked.connect(self.on_stop_clicked)
            self.btnRefresh.clicked.connect(self.on_refresh_clicked)

            # Log controls
            self.btnClearLogs.clicked.connect(self.on_clear_logs)
            self.btnExportLogs.clicked.connect(self.on_export_logs)

            # History controls
            self.btnRefreshHistory.clicked.connect(self.on_refresh_history)
            self.comboHistoryFilter.currentTextChanged.connect(self.on_history_filter_changed)

            # Quick commands
            self.btnOpenVSCode.clicked.connect(lambda: self.run_quick_command("code ."))
            self.btnOpenClaudeCode.clicked.connect(lambda: self.run_quick_command("claude"))
            self.btnCleanLogs.clicked.connect(self.on_clean_logs)
            self.btnReloadConfigs.clicked.connect(self.on_reload_configs)
            self.btnStopAll.clicked.connect(self.on_stop_all_agents)

        except AttributeError as e:
            print(f"Warning: UI element not found: {e}")

    def load_agents(self):
        """Load all agent configurations"""
        count, errors = self.context_loader.load_all_contexts()

        if errors:
            error_msg = "\n".join(errors)
            self.history_manager.log_error("CONFIG", "Error loading agent configurations", error_msg)
            QMessageBox.warning(self, "Configuration Errors", f"Some agents failed to load:\n\n{error_msg}")

        # Populate agent list
        self.populate_agent_list()

        self.history_manager.log_system_event(f"Loaded {count} agent configurations")
        self.update_status(f"Loaded {count} agents", success=True)

    def populate_agent_list(self):
        """Populate the agent list widget"""
        self.agentListWidget.clear()

        contexts = self.context_loader.get_all_contexts()

        for agent_id, context in contexts.items():
            item = QListWidgetItem(context.name)
            item.setData(Qt.UserRole, agent_id)  # Store agent ID

            # Set color based on agent configuration
            try:
                color = QColor(context.color)
                font = QFont()
                font.setBold(True)
                item.setForeground(color)
            except:
                pass

            self.agentListWidget.addItem(item)

    def on_agent_selected(self, current, previous):
        """Handle agent selection"""
        if not current:
            return

        agent_id = current.data(Qt.UserRole)
        self.current_agent_id = agent_id
        self.selected_agent_context = self.context_loader.get_context(agent_id)

        # Update context display
        if self.selected_agent_context:
            self.contextTextEdit.setPlainText(self.selected_agent_context.get_formatted_info())

        # Update status
        status = self.agent_manager.get_agent_status(agent_id)
        if status and status['is_running']:
            self.update_status(f"{self.selected_agent_context.name} - RUNNING", success=True)
        else:
            self.update_status(f"{self.selected_agent_context.name} - STOPPED", success=False)

        self.history_manager.log_user_action(f"Selected agent '{agent_id}'")

    def on_launch_clicked(self):
        """Handle launch button click"""
        if not self.current_agent_id or not self.selected_agent_context:
            QMessageBox.warning(self, "No Agent Selected", "Please select an agent to launch.")
            return

        agent_id = self.current_agent_id
        context = self.selected_agent_context

        # Launch agent
        success, message = self.agent_manager.launch_agent(
            agent_id=agent_id,
            command=context.exec_command,
            working_dir=context.working_dir if context.working_dir else None,
            env=context.env
        )

        # Log result
        self.history_manager.log_agent_launch(agent_id, context.exec_command, success, message)

        # Show result
        if success:
            self.update_status(f"{context.name} launched successfully", success=True)
            self.logsTextEdit.appendPlainText(f"\n{'='*60}\n")
            self.logsTextEdit.appendPlainText(f"[{datetime.now().strftime('%H:%M:%S')}] {context.name} LAUNCHED")
            self.logsTextEdit.appendPlainText(f"{'='*60}\n")
        else:
            self.update_status(f"Failed to launch {context.name}", success=False)
            QMessageBox.critical(self, "Launch Failed", message)

    def on_stop_clicked(self):
        """Handle stop button click"""
        if not self.current_agent_id:
            QMessageBox.warning(self, "No Agent Selected", "Please select an agent to stop.")
            return

        agent_id = self.current_agent_id
        context = self.selected_agent_context

        # Stop agent
        success, message = self.agent_manager.stop_agent(agent_id)

        # Log result
        self.history_manager.log_agent_stop(agent_id, success, message)

        # Show result
        if success:
            self.update_status(f"{context.name if context else agent_id} stopped", success=True)
            self.logsTextEdit.appendPlainText(f"\n[{datetime.now().strftime('%H:%M:%S')}] {context.name if context else agent_id} STOPPED\n")
        else:
            self.update_status(f"Failed to stop agent", success=False)
            QMessageBox.warning(self, "Stop Failed", message)

    def on_refresh_clicked(self):
        """Handle refresh button click"""
        if self.current_agent_id:
            status = self.agent_manager.get_agent_status(self.current_agent_id)
            if status:
                running = "RUNNING" if status['is_running'] else "STOPPED"
                self.update_status(f"{self.selected_agent_context.name} - {running}",
                                 success=status['is_running'])

        self.history_manager.log_user_action("Refreshed agent status")

    def update_live_output(self):
        """Update live output from running agents (called by timer)"""
        if not self.current_agent_id:
            return

        # Get output from current agent
        output_lines, error_lines = self.agent_manager.get_agent_output(self.current_agent_id)

        # Append new output
        for line in output_lines:
            self.logsTextEdit.appendPlainText(line)

        # Append errors in red (using HTML)
        for line in error_lines:
            self.logsTextEdit.appendPlainText(f"[ERROR] {line}")

        # Auto-scroll to bottom
        scrollbar = self.logsTextEdit.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())

    def on_clear_logs(self):
        """Clear the output display"""
        self.logsTextEdit.clear()
        self.history_manager.log_user_action("Cleared output display")

    def on_export_logs(self):
        """Export logs to file"""
        filename, _ = QFileDialog.getSaveFileName(
            self,
            "Export Logs",
            f"mcp_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log",
            "Log Files (*.log);;Text Files (*.txt)"
        )

        if filename:
            success, error = self.history_manager.export_logs(filename)
            if success:
                QMessageBox.information(self, "Export Successful", f"Logs exported to:\n{filename}")
            else:
                QMessageBox.critical(self, "Export Failed", error)

    def on_refresh_history(self):
        """Refresh system history display"""
        filter_text = self.comboHistoryFilter.currentText()

        if filter_text == "All Events":
            logs = self.history_manager.get_recent_logs(200)
        elif filter_text == "Agent Events":
            logs = self.history_manager.get_logs_by_category("AGENT", 200)
        elif filter_text == "System Events":
            logs = self.history_manager.get_logs_by_category("SYSTEM", 200)
        elif filter_text == "Errors Only":
            logs = self.history_manager.get_logs_by_level(LogLevel.ERROR, 200)
        else:
            logs = self.history_manager.get_recent_logs(200)

        self.historyTextEdit.setPlainText("\n".join(logs))

        # Auto-scroll to bottom
        scrollbar = self.historyTextEdit.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())

    def on_history_filter_changed(self):
        """Handle history filter change"""
        self.on_refresh_history()

    def run_quick_command(self, command: str):
        """Run a quick command"""
        import subprocess

        try:
            subprocess.Popen(command, shell=True)
            self.history_manager.log_user_action(f"Executed quick command: {command}")
            self.update_status(f"Executed: {command}", success=True)
        except Exception as e:
            self.history_manager.log_error("COMMAND", f"Failed to execute: {command}", str(e))
            QMessageBox.critical(self, "Command Failed", f"Failed to execute:\n{command}\n\nError: {e}")

    def on_clean_logs(self):
        """Clean log directory"""
        reply = QMessageBox.question(
            self,
            "Clean Logs",
            "This will clear all system logs. Continue?",
            QMessageBox.Yes | QMessageBox.No
        )

        if reply == QMessageBox.Yes:
            success = self.history_manager.clear_logs()
            if success:
                self.update_status("Logs cleaned", success=True)
                self.on_refresh_history()
            else:
                QMessageBox.critical(self, "Error", "Failed to clean logs")

    def on_reload_configs(self):
        """Reload agent configurations"""
        self.load_agents()
        self.update_status("Configurations reloaded", success=True)

    def on_stop_all_agents(self):
        """Stop all running agents"""
        reply = QMessageBox.question(
            self,
            "Stop All Agents",
            "This will stop ALL running agents. Continue?",
            QMessageBox.Yes | QMessageBox.No
        )

        if reply == QMessageBox.Yes:
            results = self.agent_manager.stop_all_agents()

            message = "\n".join([f"{agent_id}: {msg}" for agent_id, msg in results.items()])
            self.history_manager.log_system_event("Stopped all agents", message)

            QMessageBox.information(self, "Stop All Agents", f"Results:\n\n{message}")
            self.update_status("All agents stopped", success=True)

    def update_status(self, message: str, success: bool = True):
        """Update status label"""
        try:
            if success:
                self.lblStatus.setText(f"STATUS: {message.upper()}")
                self.lblStatus.setStyleSheet("color: #28a745; font-weight: bold;")
            else:
                self.lblStatus.setText(f"STATUS: {message.upper()}")
                self.lblStatus.setStyleSheet("color: #dc3545; font-weight: bold;")

            # Also update status bar
            self.statusBar().showMessage(message)
        except AttributeError:
            pass

    def closeEvent(self, event):
        """Handle window close event"""
        # Stop all running agents before closing
        running_agents = [
            agent_id for agent_id, status in self.agent_manager.get_all_agents_status().items()
            if status and status['is_running']
        ]

        if running_agents:
            reply = QMessageBox.question(
                self,
                "Agents Running",
                f"{len(running_agents)} agent(s) are still running.\n\nStop all agents and exit?",
                QMessageBox.Yes | QMessageBox.No | QMessageBox.Cancel
            )

            if reply == QMessageBox.Yes:
                self.agent_manager.stop_all_agents()
                self.history_manager.log_system_event("MCP Control Panel closed - all agents stopped")
                event.accept()
            elif reply == QMessageBox.No:
                self.history_manager.log_system_event("MCP Control Panel closed - agents left running")
                event.accept()
            else:
                event.ignore()
                return
        else:
            self.history_manager.log_system_event("MCP Control Panel closed")
            event.accept()


def run():
    """Main entry point for the application"""
    app = QApplication(sys.argv)

    # Set application metadata
    app.setApplicationName("MCP Control Panel")
    app.setOrganizationName("Skynet")
    app.setApplicationVersion("1.0.0")

    # Create and show main window
    window = MCPControlPanel()
    window.show()

    # Start event loop
    sys.exit(app.exec_())


if __name__ == '__main__':
    run()
