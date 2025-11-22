"""Utility functions for formatting data."""

from datetime import datetime, timedelta
from typing import Optional


def format_size(bytes_value: int) -> str:
    """
    Format bytes as human-readable size.

    Args:
        bytes_value: Size in bytes

    Returns:
        Formatted string (e.g., "1.5 GB")
    """
    if bytes_value < 0:
        return "Unknown"

    units = ["B", "KB", "MB", "GB", "TB", "PB"]
    size = float(bytes_value)
    unit_index = 0

    while size >= 1024.0 and unit_index < len(units) - 1:
        size /= 1024.0
        unit_index += 1

    if unit_index == 0:
        return f"{int(size)} {units[unit_index]}"
    return f"{size:.2f} {units[unit_index]}"


def format_date(dt: Optional[datetime], format_str: str = "%Y-%m-%d %H:%M") -> str:
    """
    Format datetime object.

    Args:
        dt: Datetime object
        format_str: Format string

    Returns:
        Formatted date string
    """
    if dt is None:
        return "Never"

    now = datetime.now()
    diff = now - dt

    # Relative formatting for recent dates
    if diff < timedelta(minutes=1):
        return "Just now"
    elif diff < timedelta(hours=1):
        minutes = int(diff.total_seconds() / 60)
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    elif diff < timedelta(days=1):
        hours = int(diff.total_seconds() / 3600)
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff < timedelta(days=7):
        days = diff.days
        return f"{days} day{'s' if days > 1 else ''} ago"

    return dt.strftime(format_str)


def format_duration(seconds: float) -> str:
    """
    Format duration in seconds.

    Args:
        seconds: Duration in seconds

    Returns:
        Formatted duration string
    """
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        secs = int(seconds % 60)
        return f"{minutes}m {secs}s"
    else:
        hours = int(seconds / 3600)
        minutes = int((seconds % 3600) / 60)
        return f"{hours}h {minutes}m"


def format_file_count(count: int) -> str:
    """
    Format file count.

    Args:
        count: Number of files

    Returns:
        Formatted string
    """
    if count < 1000:
        return str(count)
    elif count < 1_000_000:
        return f"{count / 1000:.1f}K"
    else:
        return f"{count / 1_000_000:.1f}M"


def categorize_mime_type(mime_type: str) -> str:
    """
    Categorize MIME type into friendly category.

    Args:
        mime_type: MIME type string

    Returns:
        Category name
    """
    mime_lower = mime_type.lower()

    if "folder" in mime_lower or "directory" in mime_lower:
        return "Folders"
    elif any(t in mime_lower for t in ["image", "jpeg", "png", "gif", "bmp"]):
        return "Images"
    elif any(t in mime_lower for t in ["video", "mp4", "avi", "mkv"]):
        return "Videos"
    elif any(t in mime_lower for t in ["audio", "mp3", "wav", "flac"]):
        return "Audio"
    elif any(t in mime_lower for t in ["pdf", "document", "word", "text"]):
        return "Documents"
    elif any(t in mime_lower for t in ["sheet", "excel", "csv"]):
        return "Spreadsheets"
    elif any(t in mime_lower for t in ["presentation", "powerpoint"]):
        return "Presentations"
    elif any(t in mime_lower for t in ["zip", "rar", "tar", "gz", "7z", "archive"]):
        return "Archives"
    elif any(t in mime_lower for t in ["code", "python", "javascript", "html", "css"]):
        return "Code"
    else:
        return "Other"
