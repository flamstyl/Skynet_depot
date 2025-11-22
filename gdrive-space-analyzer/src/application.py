"""Main GTK application."""

import gi

gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')

from gi.repository import Gtk, Adw, Gio

from .window import GDriveAnalyzerWindow
from .core import AccountManager, SecurityManager, ScanCoordinator, AnalyticsEngine
from .storage import DatabaseManager
from .utils.logger import get_logger
from .utils.config import get_config

logger = get_logger(__name__)


class GDriveAnalyzerApplication(Adw.Application):
    """Main application class."""

    def __init__(self):
        """Initialize application."""
        super().__init__(
            application_id="com.github.gdrive-analyzer",
            flags=Gio.ApplicationFlags.FLAGS_NONE,
        )

        self.window = None
        self.config = get_config()

        # Initialize core components
        self.db = DatabaseManager()
        self.security = SecurityManager()
        self.account_manager = AccountManager(self.db, self.security)
        self.scanner = ScanCoordinator(self.account_manager, self.db)
        self.analytics = AnalyticsEngine(self.db)

        # Setup actions
        self.create_actions()

    def do_activate(self):
        """Activate the application."""
        if not self.window:
            self.window = GDriveAnalyzerWindow(
                application=self,
                account_manager=self.account_manager,
                scanner=self.scanner,
                analytics=self.analytics,
                db=self.db,
            )

        self.window.present()

    def create_actions(self):
        """Create application actions."""
        # Add account action
        add_account_action = Gio.SimpleAction.new("add-account", None)
        add_account_action.connect("activate", self.on_add_account)
        self.add_action(add_account_action)

        # Preferences action
        preferences_action = Gio.SimpleAction.new("preferences", None)
        preferences_action.connect("activate", self.on_preferences)
        self.add_action(preferences_action)

        # About action
        about_action = Gio.SimpleAction.new("about", None)
        about_action.connect("activate", self.on_about)
        self.add_action(about_action)

        # Quit action
        quit_action = Gio.SimpleAction.new("quit", None)
        quit_action.connect("activate", self.on_quit)
        self.add_action(quit_action)
        self.set_accels_for_action("app.quit", ["<Ctrl>Q"])

    def on_add_account(self, action, param):
        """Handle add account action."""
        if self.window:
            self.window.show_add_account_dialog()

    def on_preferences(self, action, param):
        """Handle preferences action."""
        if self.window:
            self.window.show_preferences()

    def on_about(self, action, param):
        """Show about dialog."""
        about = Adw.AboutWindow(
            transient_for=self.window,
            application_name="Google Drive Space Analyzer",
            application_icon="com.github.gdrive-analyzer",
            developer_name="Skynet Team",
            version="1.0.0",
            developers=["Skynet Team"],
            copyright="© 2025 Skynet Team",
            license_type=Gtk.License.GPL_3_0,
            website="https://github.com/flamstyl/gdrive-space-analyzer",
            issue_url="https://github.com/flamstyl/gdrive-space-analyzer/issues",
        )
        about.present()

    def on_quit(self, action, param):
        """Quit the application."""
        self.quit()
