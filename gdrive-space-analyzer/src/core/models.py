"""Data models for the application."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict
from enum import Enum


class ScanStatus(Enum):
    """Status of a scan operation."""
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Account:
    """Represents a Google Drive account."""
    id: str
    email: str
    display_name: str
    created_at: datetime
    last_scan_at: Optional[datetime] = None
    is_active: bool = True

    def __str__(self) -> str:
        return f"{self.display_name} ({self.email})"


@dataclass
class StorageQuota:
    """Storage quota information for an account."""
    limit: int  # bytes, -1 if unlimited
    usage: int  # total bytes used
    usage_in_drive: int  # bytes in Drive
    usage_in_trash: int  # bytes in Trash

    @property
    def usage_percentage(self) -> float:
        """Calculate usage percentage."""
        if self.limit <= 0:
            return 0.0
        return (self.usage / self.limit) * 100

    @property
    def available(self) -> int:
        """Available space in bytes."""
        if self.limit <= 0:
            return -1  # Unlimited
        return max(0, self.limit - self.usage)

    def __str__(self) -> str:
        from ..utils.formatters import format_size
        if self.limit <= 0:
            return f"{format_size(self.usage)} used (unlimited)"
        return f"{format_size(self.usage)} / {format_size(self.limit)} ({self.usage_percentage:.1f}%)"


@dataclass
class FileMetadata:
    """Metadata for a Google Drive file."""
    id: str
    name: str
    size: int
    mime_type: str
    created_time: datetime
    modified_time: datetime
    parent_id: Optional[str] = None
    md5_checksum: Optional[str] = None
    is_folder: bool = False

    @property
    def is_large(self) -> bool:
        """Check if file is large (> 100MB)."""
        return self.size > 100 * 1024 * 1024

    @property
    def file_extension(self) -> str:
        """Extract file extension."""
        if '.' in self.name:
            return self.name.rsplit('.', 1)[-1].lower()
        return ''


@dataclass
class FolderInfo:
    """Information about a folder and its contents."""
    id: str
    name: str
    total_size: int
    file_count: int
    subfolders: List['FolderInfo'] = field(default_factory=list)

    @property
    def total_files_recursive(self) -> int:
        """Total files including subfolders."""
        total = self.file_count
        for subfolder in self.subfolders:
            total += subfolder.total_files_recursive
        return total


@dataclass
class DuplicateGroup:
    """Group of duplicate files."""
    md5_checksum: str
    files: List[FileMetadata]
    total_size: int

    @property
    def wasted_space(self) -> int:
        """Space wasted by duplicates (all except one)."""
        if len(self.files) <= 1:
            return 0
        return self.total_size * (len(self.files) - 1)


@dataclass
class ScanResult:
    """Result of a scan operation."""
    account_id: str
    scan_date: datetime
    total_files: int
    total_size: int
    quota: StorageQuota
    duration_seconds: float
    status: ScanStatus
    error_message: Optional[str] = None

    def __str__(self) -> str:
        return f"Scan of {self.account_id}: {self.total_files} files, {self.total_size} bytes"


@dataclass
class SizeByType:
    """Storage breakdown by file type."""
    mime_type: str
    size: int
    file_count: int
    category: str = "Other"

    @property
    def average_file_size(self) -> int:
        """Average file size in bytes."""
        if self.file_count == 0:
            return 0
        return self.size // self.file_count


@dataclass
class TimeSeriesPoint:
    """Single point in time series data."""
    timestamp: datetime
    value: float
    label: Optional[str] = None


@dataclass
class TimeSeriesData:
    """Time series data for charts."""
    points: List[TimeSeriesPoint]
    title: str
    unit: str = "bytes"

    def get_values(self) -> List[float]:
        """Extract values as list."""
        return [p.value for p in self.points]

    def get_timestamps(self) -> List[datetime]:
        """Extract timestamps as list."""
        return [p.timestamp for p in self.points]
