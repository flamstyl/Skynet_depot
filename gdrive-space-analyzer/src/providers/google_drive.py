"""Google Drive provider implementation."""

import time
from datetime import datetime
from typing import List, Dict, Optional, Any
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials

from .base import CloudProvider
from ..core.models import FileMetadata, StorageQuota, DuplicateGroup
from ..utils.logger import get_logger

logger = get_logger(__name__)


class GoogleDriveProvider(CloudProvider):
    """Google Drive API provider."""

    # API configuration
    API_VERSION = "v3"
    SCOPES = [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/drive.metadata.readonly",
    ]

    def __init__(self, credentials: Credentials):
        """
        Initialize Google Drive provider.

        Args:
            credentials: Google OAuth2 credentials
        """
        self.credentials = credentials
        self.service = None
        self._build_service()

    def _build_service(self) -> None:
        """Build Google Drive service."""
        try:
            self.service = build("drive", self.API_VERSION, credentials=self.credentials)
            logger.info("Google Drive service initialized")
        except Exception as e:
            logger.error(f"Failed to build Drive service: {e}")
            raise

    def authenticate(self, credentials: Dict) -> bool:
        """Authenticate with Google Drive."""
        try:
            self.credentials = Credentials.from_authorized_user_info(credentials)
            self._build_service()
            return True
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return False

    def get_storage_quota(self) -> StorageQuota:
        """Get storage quota information."""
        try:
            about = self.service.about().get(fields="storageQuota").execute()
            quota = about.get("storageQuota", {})

            return StorageQuota(
                limit=int(quota.get("limit", -1)),
                usage=int(quota.get("usage", 0)),
                usage_in_drive=int(quota.get("usageInDrive", 0)),
                usage_in_trash=int(quota.get("usageInDriveTrash", 0)),
            )
        except HttpError as e:
            logger.error(f"Failed to get storage quota: {e}")
            raise

    def get_about_info(self) -> Dict[str, Any]:
        """Get account information."""
        try:
            about = self.service.about().get(
                fields="user,storageQuota"
            ).execute()

            user = about.get("user", {})
            return {
                "email": user.get("emailAddress"),
                "display_name": user.get("displayName"),
                "photo_link": user.get("photoLink"),
                "storage_quota": self.get_storage_quota(),
            }
        except HttpError as e:
            logger.error(f"Failed to get about info: {e}")
            raise

    def list_files(
        self,
        page_token: Optional[str] = None,
        page_size: int = 1000,
        fields: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List files with pagination.

        Args:
            page_token: Token for next page
            page_size: Number of files per page
            fields: Fields to retrieve

        Returns:
            Dict with 'files' and 'nextPageToken'
        """
        if fields is None:
            fields = (
                "nextPageToken, files(id, name, size, mimeType, parents, "
                "createdTime, modifiedTime, md5Checksum)"
            )

        try:
            params = {
                "pageSize": page_size,
                "fields": fields,
                "q": "trashed = false",  # Exclude trashed files
            }

            if page_token:
                params["pageToken"] = page_token

            result = self.service.files().list(**params).execute()

            return {
                "files": result.get("files", []),
                "next_page_token": result.get("nextPageToken"),
            }
        except HttpError as e:
            logger.error(f"Failed to list files: {e}")
            raise

    def list_all_files(self) -> List[FileMetadata]:
        """
        List all files (handles pagination automatically).

        Returns:
            List of all file metadata
        """
        all_files = []
        page_token = None

        logger.info("Starting to fetch all files...")

        while True:
            try:
                result = self.list_files(page_token=page_token)
                files_data = result.get("files", [])

                for file_data in files_data:
                    file_meta = self._parse_file_metadata(file_data)
                    if file_meta:
                        all_files.append(file_meta)

                logger.info(f"Fetched {len(all_files)} files so far...")

                page_token = result.get("next_page_token")
                if not page_token:
                    break

                # Rate limiting - be nice to the API
                time.sleep(0.1)

            except HttpError as e:
                if e.resp.status == 403 or e.resp.status == 429:
                    # Rate limit exceeded, wait and retry
                    logger.warning("Rate limit hit, waiting 30 seconds...")
                    time.sleep(30)
                else:
                    raise

        logger.info(f"Finished fetching {len(all_files)} total files")
        return all_files

    def get_file_metadata(self, file_id: str) -> Optional[FileMetadata]:
        """Get metadata for a specific file."""
        try:
            file_data = self.service.files().get(
                fileId=file_id,
                fields="id, name, size, mimeType, parents, createdTime, modifiedTime, md5Checksum",
            ).execute()

            return self._parse_file_metadata(file_data)
        except HttpError as e:
            logger.error(f"Failed to get file metadata for {file_id}: {e}")
            return None

    def _parse_file_metadata(self, file_data: Dict) -> Optional[FileMetadata]:
        """Parse file data from API into FileMetadata."""
        try:
            # Size can be missing for some file types (Google Docs, etc.)
            size = int(file_data.get("size", 0))

            # Parse dates
            created_time = datetime.fromisoformat(
                file_data["createdTime"].replace("Z", "+00:00")
            )
            modified_time = datetime.fromisoformat(
                file_data["modifiedTime"].replace("Z", "+00:00")
            )

            # Get parent (first one if multiple)
            parents = file_data.get("parents", [])
            parent_id = parents[0] if parents else None

            # Check if folder
            mime_type = file_data.get("mimeType", "")
            is_folder = mime_type == "application/vnd.google-apps.folder"

            return FileMetadata(
                id=file_data["id"],
                name=file_data.get("name", "Unnamed"),
                size=size,
                mime_type=mime_type,
                created_time=created_time,
                modified_time=modified_time,
                parent_id=parent_id,
                md5_checksum=file_data.get("md5Checksum"),
                is_folder=is_folder,
            )
        except (KeyError, ValueError) as e:
            logger.error(f"Failed to parse file metadata: {e}")
            return None

    def compute_folder_sizes(self, files: List[FileMetadata]) -> Dict[str, int]:
        """
        Compute total size for each folder.

        Args:
            files: List of all file metadata

        Returns:
            Dict mapping folder_id -> total_size
        """
        folder_sizes = {}

        # First pass: sum direct children
        for file in files:
            if file.is_folder:
                folder_sizes[file.id] = 0
            elif file.parent_id:
                folder_sizes[file.parent_id] = folder_sizes.get(file.parent_id, 0) + file.size

        logger.info(f"Computed sizes for {len(folder_sizes)} folders")
        return folder_sizes

    def detect_duplicates(self, files: List[FileMetadata]) -> List[DuplicateGroup]:
        """
        Detect duplicate files by MD5 checksum.

        Args:
            files: List of all file metadata

        Returns:
            List of duplicate groups
        """
        # Group files by MD5
        by_md5 = {}
        for file in files:
            if file.md5_checksum and not file.is_folder:
                if file.md5_checksum not in by_md5:
                    by_md5[file.md5_checksum] = []
                by_md5[file.md5_checksum].append(file)

        # Find groups with duplicates
        duplicates = []
        for md5, file_list in by_md5.items():
            if len(file_list) > 1:
                total_size = sum(f.size for f in file_list)
                duplicates.append(
                    DuplicateGroup(
                        md5_checksum=md5,
                        files=file_list,
                        total_size=total_size,
                    )
                )

        # Sort by wasted space
        duplicates.sort(key=lambda g: g.wasted_space, reverse=True)

        logger.info(f"Found {len(duplicates)} duplicate groups")
        return duplicates

    def detect_large_files(
        self, files: List[FileMetadata], threshold_mb: int = 100
    ) -> List[FileMetadata]:
        """
        Find files larger than threshold.

        Args:
            files: List of all file metadata
            threshold_mb: Size threshold in MB

        Returns:
            List of large files, sorted by size
        """
        threshold_bytes = threshold_mb * 1024 * 1024
        large_files = [f for f in files if not f.is_folder and f.size > threshold_bytes]
        large_files.sort(key=lambda f: f.size, reverse=True)

        logger.info(f"Found {len(large_files)} files > {threshold_mb}MB")
        return large_files
