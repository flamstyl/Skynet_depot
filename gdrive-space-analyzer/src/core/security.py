"""Security management for storing OAuth tokens."""

import json
from typing import Optional, Dict, List
import secretstorage
from ..utils.logger import get_logger

logger = get_logger(__name__)


class SecurityManager:
    """Manages secure storage of OAuth tokens using Gnome Keyring."""

    KEYRING_SCHEMA = "com.github.gdrive-analyzer.oauth"
    KEYRING_LABEL = "Google Drive Analyzer OAuth Token"

    def __init__(self):
        """Initialize security manager."""
        self.connection = None
        self.collection = None
        self._init_keyring()

    def _init_keyring(self) -> None:
        """Initialize connection to secret storage."""
        try:
            self.connection = secretstorage.dbus_init()
            self.collection = secretstorage.get_default_collection(self.connection)
            logger.info("Connected to secret storage (Gnome Keyring)")
        except Exception as e:
            logger.error(f"Failed to initialize keyring: {e}")
            logger.warning("Tokens will not be stored securely!")
            self.connection = None
            self.collection = None

    def store_token(self, account_id: str, token_data: Dict) -> bool:
        """
        Store OAuth token securely.

        Args:
            account_id: Account identifier
            token_data: Token data (dict with access_token, refresh_token, etc.)

        Returns:
            True if successful
        """
        if not self.collection:
            logger.error("Keyring not available, cannot store token")
            return False

        try:
            # Serialize token data
            token_json = json.dumps(token_data)

            # Create attributes for searching
            attributes = {
                "application": "gdrive-analyzer",
                "account_id": account_id,
                "type": "oauth_token",
            }

            # Delete existing token if any
            self.delete_token(account_id)

            # Store new token
            self.collection.create_item(
                label=f"{self.KEYRING_LABEL} ({account_id})",
                attributes=attributes,
                secret=token_json.encode("utf-8"),
                replace=True,
            )

            logger.info(f"Stored token for account {account_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to store token: {e}")
            return False

    def retrieve_token(self, account_id: str) -> Optional[Dict]:
        """
        Retrieve OAuth token.

        Args:
            account_id: Account identifier

        Returns:
            Token data dict or None
        """
        if not self.collection:
            logger.error("Keyring not available, cannot retrieve token")
            return None

        try:
            # Search for token
            attributes = {
                "application": "gdrive-analyzer",
                "account_id": account_id,
                "type": "oauth_token",
            }

            items = list(self.collection.search_items(attributes))

            if not items:
                logger.warning(f"No token found for account {account_id}")
                return None

            # Get the first match
            item = items[0]
            item.unlock()
            token_json = item.get_secret().decode("utf-8")
            token_data = json.loads(token_json)

            logger.info(f"Retrieved token for account {account_id}")
            return token_data

        except Exception as e:
            logger.error(f"Failed to retrieve token: {e}")
            return None

    def delete_token(self, account_id: str) -> bool:
        """
        Delete OAuth token.

        Args:
            account_id: Account identifier

        Returns:
            True if successful
        """
        if not self.collection:
            logger.error("Keyring not available, cannot delete token")
            return False

        try:
            # Search for token
            attributes = {
                "application": "gdrive-analyzer",
                "account_id": account_id,
                "type": "oauth_token",
            }

            items = list(self.collection.search_items(attributes))

            for item in items:
                item.delete()

            logger.info(f"Deleted token for account {account_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete token: {e}")
            return False

    def list_stored_accounts(self) -> List[str]:
        """
        List all accounts with stored tokens.

        Returns:
            List of account IDs
        """
        if not self.collection:
            return []

        try:
            attributes = {
                "application": "gdrive-analyzer",
                "type": "oauth_token",
            }

            items = self.collection.search_items(attributes)
            account_ids = []

            for item in items:
                item_attrs = item.get_attributes()
                if "account_id" in item_attrs:
                    account_ids.append(item_attrs["account_id"])

            return account_ids

        except Exception as e:
            logger.error(f"Failed to list stored accounts: {e}")
            return []

    def is_available(self) -> bool:
        """Check if keyring is available."""
        return self.connection is not None and self.collection is not None

    def __del__(self):
        """Cleanup connection."""
        if self.connection:
            try:
                self.connection.close()
            except Exception:
                pass
