"""Database management for caching and persistence."""

import sqlite3
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Any
from contextlib import contextmanager

from ..core.models import Account, FileMetadata, StorageQuota, ScanResult, ScanStatus
from ..utils.config import Config
from ..utils.logger import get_logger

logger = get_logger(__name__)


class DatabaseManager:
    """Manages SQLite database for caching."""

    def __init__(self, db_path: Optional[Path] = None):
        """
        Initialize database manager.

        Args:
            db_path: Path to database file (default: XDG_DATA_HOME)
        """
        if db_path is None:
            db_path = Config.get_data_dir() / "gdrive-analyzer.db"

        self.db_path = db_path
        self._init_database()

    def _init_database(self) -> None:
        """Initialize database schema."""
        schema_path = Path(__file__).parent / "schema.sql"

        with open(schema_path, "r") as f:
            schema = f.read()

        with self._get_connection() as conn:
            conn.executescript(schema)
            conn.commit()

        logger.info(f"Database initialized at {self.db_path}")

    @contextmanager
    def _get_connection(self):
        """Get database connection context manager."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    # Account operations
    def add_account(self, account: Account) -> None:
        """Add new account to database."""
        with self._get_connection() as conn:
            conn.execute(
                """INSERT OR REPLACE INTO accounts
                   (id, email, display_name, created_at, last_scan_at, is_active)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    account.id,
                    account.email,
                    account.display_name,
                    int(account.created_at.timestamp()),
                    int(account.last_scan_at.timestamp()) if account.last_scan_at else None,
                    1 if account.is_active else 0,
                ),
            )
            conn.commit()

        logger.info(f"Added account: {account.email}")

    def remove_account(self, account_id: str) -> bool:
        """Remove account from database."""
        with self._get_connection() as conn:
            cursor = conn.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
            conn.commit()
            deleted = cursor.rowcount > 0

        if deleted:
            logger.info(f"Removed account: {account_id}")
        return deleted

    def get_account(self, account_id: str) -> Optional[Account]:
        """Get account by ID."""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM accounts WHERE id = ?", (account_id,)
            ).fetchone()

            if row is None:
                return None

            return Account(
                id=row["id"],
                email=row["email"],
                display_name=row["display_name"],
                created_at=datetime.fromtimestamp(row["created_at"]),
                last_scan_at=datetime.fromtimestamp(row["last_scan_at"])
                if row["last_scan_at"]
                else None,
                is_active=bool(row["is_active"]),
            )

    def list_accounts(self, active_only: bool = True) -> List[Account]:
        """List all accounts."""
        query = "SELECT * FROM accounts"
        if active_only:
            query += " WHERE is_active = 1"
        query += " ORDER BY email"

        with self._get_connection() as conn:
            rows = conn.execute(query).fetchall()

            return [
                Account(
                    id=row["id"],
                    email=row["email"],
                    display_name=row["display_name"],
                    created_at=datetime.fromtimestamp(row["created_at"]),
                    last_scan_at=datetime.fromtimestamp(row["last_scan_at"])
                    if row["last_scan_at"]
                    else None,
                    is_active=bool(row["is_active"]),
                )
                for row in rows
            ]

    def update_last_scan(self, account_id: str, scan_time: datetime) -> None:
        """Update last scan timestamp."""
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE accounts SET last_scan_at = ? WHERE id = ?",
                (int(scan_time.timestamp()), account_id),
            )
            conn.commit()

    # File cache operations
    def cache_files(self, account_id: str, files: List[FileMetadata]) -> None:
        """Cache file metadata."""
        now = int(datetime.now().timestamp())

        with self._get_connection() as conn:
            # Clear old cache for this account
            conn.execute("DELETE FROM files WHERE account_id = ?", (account_id,))

            # Insert new cache
            conn.executemany(
                """INSERT INTO files
                   (id, account_id, name, size, mime_type, parent_id,
                    created_time, modified_time, md5_checksum, is_folder, cached_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                [
                    (
                        f.id,
                        account_id,
                        f.name,
                        f.size,
                        f.mime_type,
                        f.parent_id,
                        int(f.created_time.timestamp()),
                        int(f.modified_time.timestamp()),
                        f.md5_checksum,
                        1 if f.is_folder else 0,
                        now,
                    )
                    for f in files
                ],
            )
            conn.commit()

        logger.info(f"Cached {len(files)} files for account {account_id}")

    def get_cached_files(self, account_id: str) -> List[FileMetadata]:
        """Get cached files for account."""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM files WHERE account_id = ? ORDER BY size DESC",
                (account_id,),
            ).fetchall()

            return [
                FileMetadata(
                    id=row["id"],
                    name=row["name"],
                    size=row["size"],
                    mime_type=row["mime_type"],
                    created_time=datetime.fromtimestamp(row["created_time"]),
                    modified_time=datetime.fromtimestamp(row["modified_time"]),
                    parent_id=row["parent_id"],
                    md5_checksum=row["md5_checksum"],
                    is_folder=bool(row["is_folder"]),
                )
                for row in rows
            ]

    def get_large_files(
        self, account_id: str, threshold_mb: int = 100, limit: int = 50
    ) -> List[FileMetadata]:
        """Get large files from cache."""
        threshold_bytes = threshold_mb * 1024 * 1024

        with self._get_connection() as conn:
            rows = conn.execute(
                """SELECT * FROM files
                   WHERE account_id = ? AND size > ? AND is_folder = 0
                   ORDER BY size DESC
                   LIMIT ?""",
                (account_id, threshold_bytes, limit),
            ).fetchall()

            return [
                FileMetadata(
                    id=row["id"],
                    name=row["name"],
                    size=row["size"],
                    mime_type=row["mime_type"],
                    created_time=datetime.fromtimestamp(row["created_time"]),
                    modified_time=datetime.fromtimestamp(row["modified_time"]),
                    parent_id=row["parent_id"],
                    md5_checksum=row["md5_checksum"],
                    is_folder=bool(row["is_folder"]),
                )
                for row in rows
            ]

    # Scan history operations
    def add_scan_result(self, result: ScanResult) -> None:
        """Add scan result to history."""
        with self._get_connection() as conn:
            conn.execute(
                """INSERT INTO scan_history
                   (account_id, scan_date, total_files, total_size,
                    quota_used, quota_limit, quota_drive, quota_trash,
                    duration_seconds, status, error_message)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    result.account_id,
                    int(result.scan_date.timestamp()),
                    result.total_files,
                    result.total_size,
                    result.quota.usage,
                    result.quota.limit,
                    result.quota.usage_in_drive,
                    result.quota.usage_in_trash,
                    result.duration_seconds,
                    result.status.value,
                    result.error_message,
                ),
            )
            conn.commit()

        logger.info(f"Saved scan result for account {result.account_id}")

    def get_scan_history(
        self, account_id: str, limit: int = 30
    ) -> List[ScanResult]:
        """Get scan history for account."""
        with self._get_connection() as conn:
            rows = conn.execute(
                """SELECT * FROM scan_history
                   WHERE account_id = ?
                   ORDER BY scan_date DESC
                   LIMIT ?""",
                (account_id, limit),
            ).fetchall()

            return [
                ScanResult(
                    account_id=row["account_id"],
                    scan_date=datetime.fromtimestamp(row["scan_date"]),
                    total_files=row["total_files"],
                    total_size=row["total_size"],
                    quota=StorageQuota(
                        limit=row["quota_limit"],
                        usage=row["quota_used"],
                        usage_in_drive=row["quota_drive"],
                        usage_in_trash=row["quota_trash"],
                    ),
                    duration_seconds=row["duration_seconds"],
                    status=ScanStatus(row["status"]),
                    error_message=row["error_message"],
                )
                for row in rows
            ]

    # Analytics queries
    def get_size_by_mime_type(self, account_id: str) -> Dict[str, int]:
        """Get storage breakdown by MIME type."""
        with self._get_connection() as conn:
            rows = conn.execute(
                """SELECT mime_type, SUM(size) as total_size
                   FROM files
                   WHERE account_id = ? AND is_folder = 0
                   GROUP BY mime_type
                   ORDER BY total_size DESC""",
                (account_id,),
            ).fetchall()

            return {row["mime_type"]: row["total_size"] for row in rows}

    def get_duplicate_files(self, account_id: str) -> List[Dict[str, Any]]:
        """Find duplicate files by MD5 checksum."""
        with self._get_connection() as conn:
            rows = conn.execute(
                """SELECT md5_checksum, COUNT(*) as count, SUM(size) as total_size
                   FROM files
                   WHERE account_id = ? AND md5_checksum IS NOT NULL
                   GROUP BY md5_checksum
                   HAVING COUNT(*) > 1
                   ORDER BY total_size DESC""",
                (account_id,),
            ).fetchall()

            return [
                {
                    "md5": row["md5_checksum"],
                    "count": row["count"],
                    "total_size": row["total_size"],
                }
                for row in rows
            ]

    def get_total_stats(self, account_id: str) -> Dict[str, Any]:
        """Get total statistics for account."""
        with self._get_connection() as conn:
            row = conn.execute(
                """SELECT
                       COUNT(*) as file_count,
                       SUM(size) as total_size,
                       MAX(cached_at) as last_cache
                   FROM files
                   WHERE account_id = ? AND is_folder = 0""",
                (account_id,),
            ).fetchone()

            if row is None or row["file_count"] == 0:
                return {"file_count": 0, "total_size": 0, "last_cache": None}

            return {
                "file_count": row["file_count"],
                "total_size": row["total_size"],
                "last_cache": datetime.fromtimestamp(row["last_cache"])
                if row["last_cache"]
                else None,
            }
