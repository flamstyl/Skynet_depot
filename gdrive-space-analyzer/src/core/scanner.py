"""Scan coordinator for Google Drive analysis."""

import time
from datetime import datetime
from typing import Optional, Callable, Any
from threading import Thread
from gi.repository import GLib

from .models import ScanResult, ScanStatus, Account
from .account_manager import AccountManager
from ..storage.database import DatabaseManager
from ..providers.google_drive import GoogleDriveProvider
from ..utils.logger import get_logger

logger = get_logger(__name__)


class ScanCoordinator:
    """Coordinates scanning operations for accounts."""

    def __init__(self, account_manager: AccountManager, db: DatabaseManager):
        """
        Initialize scan coordinator.

        Args:
            account_manager: Account manager instance
            db: Database manager instance
        """
        self.account_manager = account_manager
        self.db = db
        self._active_scans = {}  # account_id -> Thread

    def scan_account(
        self,
        account_id: str,
        progress_callback: Optional[Callable[[str, float], None]] = None,
        completion_callback: Optional[Callable[[ScanResult], None]] = None,
    ) -> bool:
        """
        Start scanning an account.

        Args:
            account_id: Account to scan
            progress_callback: Called with (message, progress 0-100)
            completion_callback: Called when scan completes

        Returns:
            True if scan started successfully
        """
        # Check if already scanning
        if account_id in self._active_scans:
            logger.warning(f"Scan already in progress for {account_id}")
            return False

        # Verify account exists
        account = self.account_manager.get_account(account_id)
        if not account:
            logger.error(f"Account {account_id} not found")
            return False

        # Start scan in background thread
        thread = Thread(
            target=self._scan_worker,
            args=(account, progress_callback, completion_callback),
            daemon=True,
        )
        self._active_scans[account_id] = thread
        thread.start()

        logger.info(f"Started scan for account {account_id}")
        return True

    def _scan_worker(
        self,
        account: Account,
        progress_callback: Optional[Callable],
        completion_callback: Optional[Callable],
    ) -> None:
        """
        Worker thread for scanning.

        Args:
            account: Account to scan
            progress_callback: Progress callback
            completion_callback: Completion callback
        """
        start_time = time.time()
        result = None

        try:
            # Update progress: Starting
            self._call_progress(progress_callback, "Initializing scan...", 0)

            # Get credentials
            credentials = self.account_manager.get_credentials(account.id)
            if not credentials:
                raise Exception("Failed to get credentials")

            # Create provider
            provider = GoogleDriveProvider(credentials)

            # Get storage quota
            self._call_progress(progress_callback, "Fetching storage quota...", 5)
            quota = provider.get_storage_quota()

            # Fetch all files
            self._call_progress(progress_callback, "Fetching files...", 10)
            files = provider.list_all_files()

            # Cache files in database
            self._call_progress(progress_callback, "Caching files...", 80)
            self.db.cache_files(account.id, files)

            # Calculate statistics
            total_size = sum(f.size for f in files if not f.is_folder)
            total_files = len([f for f in files if not f.is_folder])

            # Update last scan time
            scan_time = datetime.now()
            self.db.update_last_scan(account.id, scan_time)

            # Calculate duration
            duration = time.time() - start_time

            # Create result
            result = ScanResult(
                account_id=account.id,
                scan_date=scan_time,
                total_files=total_files,
                total_size=total_size,
                quota=quota,
                duration_seconds=duration,
                status=ScanStatus.COMPLETED,
            )

            # Save scan result
            self.db.add_scan_result(result)

            # Update progress: Complete
            self._call_progress(progress_callback, "Scan complete!", 100)

            logger.info(
                f"Scan completed for {account.id}: {total_files} files, "
                f"{total_size} bytes in {duration:.1f}s"
            )

        except Exception as e:
            logger.error(f"Scan failed for {account.id}: {e}", exc_info=True)

            duration = time.time() - start_time
            result = ScanResult(
                account_id=account.id,
                scan_date=datetime.now(),
                total_files=0,
                total_size=0,
                quota=quota if 'quota' in locals() else None,
                duration_seconds=duration,
                status=ScanStatus.FAILED,
                error_message=str(e),
            )

            # Save failed result
            if result.quota:  # Only save if we got at least quota info
                self.db.add_scan_result(result)

            self._call_progress(progress_callback, f"Scan failed: {e}", 100)

        finally:
            # Remove from active scans
            if account.id in self._active_scans:
                del self._active_scans[account.id]

            # Call completion callback
            if completion_callback and result:
                self._call_completion(completion_callback, result)

    def _call_progress(
        self, callback: Optional[Callable], message: str, progress: float
    ) -> None:
        """Call progress callback safely on main thread."""
        if callback:
            try:
                # Use GLib.idle_add to call on main GTK thread
                GLib.idle_add(callback, message, progress)
            except Exception as e:
                logger.error(f"Error in progress callback: {e}")

    def _call_completion(self, callback: Callable, result: ScanResult) -> None:
        """Call completion callback safely on main thread."""
        try:
            # Use GLib.idle_add to call on main GTK thread
            GLib.idle_add(callback, result)
        except Exception as e:
            logger.error(f"Error in completion callback: {e}")

    def is_scanning(self, account_id: str) -> bool:
        """Check if account is currently being scanned."""
        return account_id in self._active_scans

    def get_active_scans(self) -> list:
        """Get list of accounts currently being scanned."""
        return list(self._active_scans.keys())

    def scan_all_accounts(
        self,
        progress_callback: Optional[Callable] = None,
        completion_callback: Optional[Callable] = None,
    ) -> int:
        """
        Scan all active accounts.

        Args:
            progress_callback: Progress callback
            completion_callback: Completion callback (called for each account)

        Returns:
            Number of scans started
        """
        accounts = self.account_manager.list_accounts(active_only=True)
        started = 0

        for account in accounts:
            if self.scan_account(account.id, progress_callback, completion_callback):
                started += 1
                # Small delay between scans
                time.sleep(0.5)

        logger.info(f"Started {started} account scans")
        return started
