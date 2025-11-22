"""Analytics engine for Google Drive data analysis."""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from .models import (
    FileMetadata,
    SizeByType,
    FolderInfo,
    DuplicateGroup,
    TimeSeriesData,
    TimeSeriesPoint,
)
from ..storage.database import DatabaseManager
from ..utils.formatters import categorize_mime_type
from ..utils.logger import get_logger

logger = get_logger(__name__)


class AnalyticsEngine:
    """Provides analytics and insights on Google Drive data."""

    def __init__(self, db: DatabaseManager):
        """
        Initialize analytics engine.

        Args:
            db: Database manager
        """
        self.db = db

    def get_size_by_category(self, account_id: str) -> List[SizeByType]:
        """
        Get storage breakdown by category.

        Args:
            account_id: Account identifier

        Returns:
            List of SizeByType objects grouped by category
        """
        # Get size by MIME type from database
        mime_sizes = self.db.get_size_by_mime_type(account_id)

        # Group by category
        category_data = defaultdict(lambda: {"size": 0, "count": 0})

        files = self.db.get_cached_files(account_id)
        for file in files:
            if not file.is_folder:
                category = categorize_mime_type(file.mime_type)
                category_data[category]["size"] += file.size
                category_data[category]["count"] += 1

        # Create SizeByType objects
        result = []
        for category, data in category_data.items():
            result.append(
                SizeByType(
                    mime_type="",  # Not specific to one type
                    size=data["size"],
                    file_count=data["count"],
                    category=category,
                )
            )

        # Sort by size
        result.sort(key=lambda x: x.size, reverse=True)

        logger.info(f"Computed {len(result)} categories for account {account_id}")
        return result

    def get_top_large_files(
        self, account_id: str, threshold_mb: int = 100, limit: int = 50
    ) -> List[FileMetadata]:
        """
        Get largest files.

        Args:
            account_id: Account identifier
            threshold_mb: Minimum size in MB
            limit: Maximum number of files

        Returns:
            List of large files
        """
        files = self.db.get_large_files(account_id, threshold_mb, limit)
        logger.info(f"Found {len(files)} large files for account {account_id}")
        return files

    def get_folder_size_breakdown(self, account_id: str) -> List[FolderInfo]:
        """
        Get folder size breakdown.

        Args:
            account_id: Account identifier

        Returns:
            List of folder info objects
        """
        files = self.db.get_cached_files(account_id)

        # Build folder hierarchy
        folders = {}
        folder_sizes = defaultdict(int)
        folder_counts = defaultdict(int)

        # First pass: identify folders and calculate direct children sizes
        for file in files:
            if file.is_folder:
                folders[file.id] = file
            elif file.parent_id:
                folder_sizes[file.parent_id] += file.size
                folder_counts[file.parent_id] += 1

        # Create FolderInfo objects for top-level folders (most common case)
        folder_infos = []
        for folder_id, size in sorted(
            folder_sizes.items(), key=lambda x: x[1], reverse=True
        ):
            if folder_id in folders:
                folder = folders[folder_id]
                folder_infos.append(
                    FolderInfo(
                        id=folder_id,
                        name=folder.name,
                        total_size=size,
                        file_count=folder_counts[folder_id],
                    )
                )

        logger.info(f"Computed {len(folder_infos)} folder sizes for account {account_id}")
        return folder_infos[:50]  # Top 50 folders

    def get_duplicate_groups(self, account_id: str) -> List[DuplicateGroup]:
        """
        Find duplicate files.

        Args:
            account_id: Account identifier

        Returns:
            List of duplicate groups
        """
        duplicate_data = self.db.get_duplicate_files(account_id)
        groups = []

        for dup in duplicate_data:
            # Get actual file objects
            files = [
                f
                for f in self.db.get_cached_files(account_id)
                if f.md5_checksum == dup["md5"]
            ]

            if len(files) > 1:
                groups.append(
                    DuplicateGroup(
                        md5_checksum=dup["md5"],
                        files=files,
                        total_size=dup["total_size"],
                    )
                )

        logger.info(f"Found {len(groups)} duplicate groups for account {account_id}")
        return groups

    def get_storage_over_time(self, account_id: str) -> TimeSeriesData:
        """
        Get storage usage over time.

        Args:
            account_id: Account identifier

        Returns:
            Time series data
        """
        scan_history = self.db.get_scan_history(account_id, limit=90)

        points = [
            TimeSeriesPoint(
                timestamp=scan.scan_date,
                value=float(scan.total_size),
                label=f"{scan.total_size} bytes",
            )
            for scan in reversed(scan_history)  # Chronological order
        ]

        return TimeSeriesData(
            points=points,
            title=f"Storage Usage Over Time",
            unit="bytes",
        )

    def get_file_age_distribution(self, account_id: str) -> Dict[str, int]:
        """
        Get distribution of files by age.

        Args:
            account_id: Account identifier

        Returns:
            Dict mapping age range -> file count
        """
        files = self.db.get_cached_files(account_id)
        now = datetime.now()

        age_buckets = {
            "< 1 month": 0,
            "1-3 months": 0,
            "3-6 months": 0,
            "6-12 months": 0,
            "1-2 years": 0,
            "> 2 years": 0,
        }

        for file in files:
            if file.is_folder:
                continue

            age = now - file.modified_time

            if age < timedelta(days=30):
                age_buckets["< 1 month"] += 1
            elif age < timedelta(days=90):
                age_buckets["1-3 months"] += 1
            elif age < timedelta(days=180):
                age_buckets["3-6 months"] += 1
            elif age < timedelta(days=365):
                age_buckets["6-12 months"] += 1
            elif age < timedelta(days=730):
                age_buckets["1-2 years"] += 1
            else:
                age_buckets["> 2 years"] += 1

        return age_buckets

    def predict_storage_full(self, account_id: str) -> Optional[datetime]:
        """
        Predict when storage will be full based on historical growth.

        Args:
            account_id: Account identifier

        Returns:
            Predicted date when storage will be full, or None
        """
        scan_history = self.db.get_scan_history(account_id, limit=30)

        if len(scan_history) < 2:
            return None  # Not enough data

        # Calculate growth rate
        oldest = scan_history[-1]
        newest = scan_history[0]

        time_diff = (newest.scan_date - oldest.scan_date).total_seconds()
        if time_diff <= 0:
            return None

        size_diff = newest.total_size - oldest.total_size
        if size_diff <= 0:
            return None  # Not growing

        # Bytes per second growth rate
        growth_rate = size_diff / time_diff

        # Calculate space available
        available = newest.quota.available
        if available <= 0:
            return None  # Unlimited or already full

        # Calculate days until full
        seconds_until_full = available / growth_rate
        days_until_full = seconds_until_full / 86400

        predicted_date = newest.scan_date + timedelta(days=days_until_full)

        logger.info(
            f"Predicted storage full for {account_id} on {predicted_date.strftime('%Y-%m-%d')}"
        )
        return predicted_date

    def get_summary_stats(self, account_id: str) -> Dict:
        """
        Get summary statistics for account.

        Args:
            account_id: Account identifier

        Returns:
            Dict with various stats
        """
        stats = self.db.get_total_stats(account_id)
        files = self.db.get_cached_files(account_id)

        # Count by type
        folders = sum(1 for f in files if f.is_folder)
        large_files = sum(1 for f in files if not f.is_folder and f.size > 100 * 1024 * 1024)

        # Get duplicates info
        duplicates = self.get_duplicate_groups(account_id)
        duplicate_count = len(duplicates)
        wasted_space = sum(g.wasted_space for g in duplicates)

        return {
            "total_files": stats["file_count"],
            "total_size": stats["total_size"],
            "folder_count": folders,
            "large_files_count": large_files,
            "duplicate_groups": duplicate_count,
            "wasted_space": wasted_space,
            "last_cache": stats["last_cache"],
        }
