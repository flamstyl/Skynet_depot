"""Base provider interface."""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from datetime import datetime

from ..core.models import FileMetadata, StorageQuota


class CloudProvider(ABC):
    """Abstract base class for cloud storage providers."""

    @abstractmethod
    def authenticate(self, credentials: Dict) -> bool:
        """Authenticate with the provider."""
        pass

    @abstractmethod
    def get_storage_quota(self) -> StorageQuota:
        """Get storage quota information."""
        pass

    @abstractmethod
    def list_files(self, page_token: Optional[str] = None) -> Dict:
        """List files with pagination."""
        pass

    @abstractmethod
    def get_file_metadata(self, file_id: str) -> Optional[FileMetadata]:
        """Get metadata for a specific file."""
        pass

    @abstractmethod
    def get_about_info(self) -> Dict:
        """Get account information."""
        pass
