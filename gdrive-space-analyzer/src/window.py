"""Main application window."""

import gi

gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')

from gi.repository import Gtk, Adw, GLib

from .core import AccountManager, ScanCoordinator, AnalyticsEngine
from .storage import DatabaseManager
from .utils.logger import get_logger
from .utils.formatters import format_size, format_date

logger = get_logger(__name__)


class GDriveAnalyzerWindow(Adw.ApplicationWindow):
    """Main application window."""

    def __init__(
        self,
        application,
        account_manager: AccountManager,
        scanner: ScanCoordinator,
        analytics: AnalyticsEngine,
        db: DatabaseManager,
    ):
        """
        Initialize window.

        Args:
            application: GTK application
            account_manager: Account manager
            scanner: Scan coordinator
            analytics: Analytics engine
            db: Database manager
        """
        super().__init__(application=application)

        self.account_manager = account_manager
        self.scanner = scanner
        self.analytics = analytics
        self.db = db

        self.set_title("Google Drive Space Analyzer")
        self.set_default_size(1000, 700)

        # Build UI
        self.build_ui()

        # Load accounts
        self.load_accounts()

    def build_ui(self):
        """Build the user interface."""
        # Main container
        main_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)

        # Header bar
        header = Adw.HeaderBar()

        # Add account button
        add_button = Gtk.Button(label="Add Account")
        add_button.connect("clicked", self.on_add_account_clicked)
        add_button.add_css_class("suggested-action")
        header.pack_start(add_button)

        # Menu button
        menu_button = Gtk.MenuButton()
        menu_button.set_icon_name("open-menu-symbolic")

        menu = Gio.Menu()
        menu.append("Preferences", "app.preferences")
        menu.append("About", "app.about")
        menu.append("Quit", "app.quit")
        menu_button.set_menu_model(menu)

        header.pack_end(menu_button)

        main_box.append(header)

        # Content area with stack
        self.stack = Gtk.Stack()
        self.stack.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT_RIGHT)
        self.stack.set_vexpand(True)

        # Empty state page
        empty_page = self.create_empty_page()
        self.stack.add_named(empty_page, "empty")

        # Accounts list page
        accounts_page = self.create_accounts_page()
        self.stack.add_named(accounts_page, "accounts")

        main_box.append(self.stack)

        # Toast overlay for notifications
        self.toast_overlay = Adw.ToastOverlay()
        self.toast_overlay.set_child(main_box)

        self.set_content(self.toast_overlay)

    def create_empty_page(self) -> Gtk.Widget:
        """Create empty state page."""
        status_page = Adw.StatusPage()
        status_page.set_title("No Accounts")
        status_page.set_description("Add a Google Drive account to start analyzing your storage")
        status_page.set_icon_name("drive-harddisk-symbolic")

        add_button = Gtk.Button(label="Add Account")
        add_button.add_css_class("suggested-action")
        add_button.add_css_class("pill")
        add_button.connect("clicked", self.on_add_account_clicked)
        status_page.set_child(add_button)

        return status_page

    def create_accounts_page(self) -> Gtk.Widget:
        """Create accounts list page."""
        scrolled = Gtk.ScrolledWindow()
        scrolled.set_vexpand(True)

        # List box for accounts
        self.accounts_listbox = Gtk.ListBox()
        self.accounts_listbox.set_selection_mode(Gtk.SelectionMode.NONE)
        self.accounts_listbox.add_css_class("boxed-list")
        self.accounts_listbox.set_margin_top(20)
        self.accounts_listbox.set_margin_bottom(20)
        self.accounts_listbox.set_margin_start(20)
        self.accounts_listbox.set_margin_end(20)

        scrolled.set_child(self.accounts_listbox)

        return scrolled

    def load_accounts(self):
        """Load and display accounts."""
        accounts = self.account_manager.list_accounts()

        if not accounts:
            self.stack.set_visible_child_name("empty")
            return

        # Clear existing rows
        while True:
            row = self.accounts_listbox.get_row_at_index(0)
            if row is None:
                break
            self.accounts_listbox.remove(row)

        # Add account rows
        for account in accounts:
            row = self.create_account_row(account)
            self.accounts_listbox.append(row)

        self.stack.set_visible_child_name("accounts")

    def create_account_row(self, account) -> Adw.ActionRow:
        """Create a row for an account."""
        row = Adw.ActionRow()
        row.set_title(account.display_name)
        row.set_subtitle(account.email)

        # Get stats
        stats = self.db.get_total_stats(account.id)

        if stats["file_count"] > 0:
            suffix_label = Gtk.Label()
            suffix_label.set_markup(
                f"<b>{format_size(stats['total_size'])}</b> • "
                f"{stats['file_count']} files"
            )
            row.add_suffix(suffix_label)

        # Scan button
        scan_button = Gtk.Button()
        scan_button.set_icon_name("view-refresh-symbolic")
        scan_button.set_valign(Gtk.Align.CENTER)
        scan_button.set_tooltip_text("Refresh")
        scan_button.connect("clicked", self.on_scan_clicked, account.id)
        row.add_suffix(scan_button)

        # Delete button
        delete_button = Gtk.Button()
        delete_button.set_icon_name("user-trash-symbolic")
        delete_button.set_valign(Gtk.Align.CENTER)
        delete_button.set_tooltip_text("Remove account")
        delete_button.connect("clicked", self.on_delete_clicked, account.id)
        row.add_suffix(delete_button)

        # Last scan info
        if account.last_scan_at:
            last_scan_label = Gtk.Label(label=f"Last scan: {format_date(account.last_scan_at)}")
            last_scan_label.add_css_class("dim-label")
            last_scan_label.add_css_class("caption")
            last_scan_label.set_halign(Gtk.Align.START)
            row.add_row(last_scan_label)

        return row

    def on_add_account_clicked(self, button):
        """Handle add account button click."""
        self.show_add_account_dialog()

    def show_add_account_dialog(self):
        """Show dialog to add account."""
        # For now, show a simple message
        toast = Adw.Toast.new("OAuth flow would start here. Need client_secret.json")
        toast.set_timeout(3)
        self.toast_overlay.add_toast(toast)

        logger.info("Add account dialog would open here")
        # TODO: Implement full OAuth dialog

    def on_scan_clicked(self, button, account_id):
        """Handle scan button click."""
        logger.info(f"Starting scan for {account_id}")

        # Show progress toast
        toast = Adw.Toast.new(f"Scanning {account_id}...")
        self.toast_overlay.add_toast(toast)

        def progress_callback(message, progress):
            logger.info(f"Scan progress: {message} ({progress}%)")

        def completion_callback(result):
            if result.status.value == "completed":
                toast = Adw.Toast.new(f"Scan completed: {result.total_files} files")
            else:
                toast = Adw.Toast.new(f"Scan failed: {result.error_message}")

            self.toast_overlay.add_toast(toast)
            self.load_accounts()  # Refresh display

        self.scanner.scan_account(
            account_id,
            progress_callback=progress_callback,
            completion_callback=completion_callback,
        )

    def on_delete_clicked(self, button, account_id):
        """Handle delete button click."""
        # Confirmation dialog
        dialog = Adw.MessageDialog.new(self)
        dialog.set_heading("Remove Account?")
        dialog.set_body(f"This will remove the account {account_id} and all cached data.")
        dialog.add_response("cancel", "Cancel")
        dialog.add_response("delete", "Remove")
        dialog.set_response_appearance("delete", Adw.ResponseAppearance.DESTRUCTIVE)
        dialog.connect("response", self.on_delete_response, account_id)
        dialog.present()

    def on_delete_response(self, dialog, response, account_id):
        """Handle delete confirmation response."""
        if response == "delete":
            success = self.account_manager.remove_account(account_id)

            if success:
                toast = Adw.Toast.new(f"Account {account_id} removed")
                self.toast_overlay.add_toast(toast)
                self.load_accounts()
            else:
                toast = Adw.Toast.new("Failed to remove account")
                self.toast_overlay.add_toast(toast)

    def show_preferences(self):
        """Show preferences dialog."""
        toast = Adw.Toast.new("Preferences dialog would open here")
        self.toast_overlay.add_toast(toast)
        # TODO: Implement preferences dialog
