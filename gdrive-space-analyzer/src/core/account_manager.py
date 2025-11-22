"""Account management module."""

from datetime import datetime
from typing import List, Optional, Dict
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

from .models import Account
from .security import SecurityManager
from ..storage.database import DatabaseManager
from ..providers.google_drive import GoogleDriveProvider
from ..utils.logger import get_logger

logger = get_logger(__name__)


class AccountManager:
    """Manages Google Drive accounts."""

    def __init__(self, db: DatabaseManager, security: SecurityManager):
        """
        Initialize account manager.

        Args:
            db: Database manager
            security: Security manager for tokens
        """
        self.db = db
        self.security = security

    def add_account_with_oauth(
        self, client_config: Dict, redirect_uri: str = "http://localhost:8080"
    ) -> Optional[Account]:
        """
        Add account using OAuth flow.

        Args:
            client_config: OAuth client configuration
            redirect_uri: Redirect URI for OAuth

        Returns:
            Account object if successful
        """
        try:
            # Start OAuth flow
            flow = InstalledAppFlow.from_client_config(
                client_config,
                scopes=GoogleDriveProvider.SCOPES,
                redirect_uri=redirect_uri,
            )

            # Run local server for OAuth
            credentials = flow.run_local_server(
                port=8080,
                authorization_prompt_message="Opening browser for Google Drive authorization...",
                success_message="Authorization successful! You can close this window.",
            )

            # Get account info
            provider = GoogleDriveProvider(credentials)
            about = provider.get_about_info()

            # Create account
            account = Account(
                id=about["email"],  # Use email as ID
                email=about["email"],
                display_name=about["display_name"],
                created_at=datetime.now(),
                is_active=True,
            )

            # Store token securely
            token_data = {
                "token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": credentials.scopes,
            }

            if not self.security.store_token(account.id, token_data):
                logger.error("Failed to store token securely")
                return None

            # Save to database
            self.db.add_account(account)

            logger.info(f"Successfully added account: {account.email}")
            return account

        except Exception as e:
            logger.error(f"Failed to add account: {e}")
            return None

    def remove_account(self, account_id: str) -> bool:
        """
        Remove account.

        Args:
            account_id: Account identifier

        Returns:
            True if successful
        """
        try:
            # Delete token
            self.security.delete_token(account_id)

            # Remove from database
            success = self.db.remove_account(account_id)

            if success:
                logger.info(f"Removed account: {account_id}")

            return success

        except Exception as e:
            logger.error(f"Failed to remove account: {e}")
            return False

    def get_account(self, account_id: str) -> Optional[Account]:
        """Get account by ID."""
        return self.db.get_account(account_id)

    def list_accounts(self, active_only: bool = True) -> List[Account]:
        """List all accounts."""
        return self.db.list_accounts(active_only=active_only)

    def get_credentials(self, account_id: str) -> Optional[Credentials]:
        """
        Get credentials for account.

        Args:
            account_id: Account identifier

        Returns:
            Credentials object or None
        """
        token_data = self.security.retrieve_token(account_id)
        if not token_data:
            logger.error(f"No token found for account {account_id}")
            return None

        try:
            credentials = Credentials(
                token=token_data.get("token"),
                refresh_token=token_data.get("refresh_token"),
                token_uri=token_data.get("token_uri"),
                client_id=token_data.get("client_id"),
                client_secret=token_data.get("client_secret"),
                scopes=token_data.get("scopes"),
            )

            # Refresh if expired
            if credentials.expired and credentials.refresh_token:
                logger.info(f"Refreshing expired token for {account_id}")
                credentials.refresh(Request())

                # Update stored token
                updated_token_data = {
                    "token": credentials.token,
                    "refresh_token": credentials.refresh_token,
                    "token_uri": credentials.token_uri,
                    "client_id": credentials.client_id,
                    "client_secret": credentials.client_secret,
                    "scopes": credentials.scopes,
                }
                self.security.store_token(account_id, updated_token_data)

            return credentials

        except Exception as e:
            logger.error(f"Failed to get credentials for {account_id}: {e}")
            return None

    def refresh_token(self, account_id: str) -> bool:
        """
        Manually refresh token for account.

        Args:
            account_id: Account identifier

        Returns:
            True if successful
        """
        credentials = self.get_credentials(account_id)
        if not credentials:
            return False

        try:
            credentials.refresh(Request())

            # Update stored token
            token_data = {
                "token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": credentials.scopes,
            }
            self.security.store_token(account_id, token_data)

            logger.info(f"Token refreshed for {account_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to refresh token: {e}")
            return False

    def validate_account(self, account_id: str) -> bool:
        """
        Validate account can access Google Drive.

        Args:
            account_id: Account identifier

        Returns:
            True if valid
        """
        try:
            credentials = self.get_credentials(account_id)
            if not credentials:
                return False

            provider = GoogleDriveProvider(credentials)
            provider.get_about_info()  # Test API access

            return True

        except Exception as e:
            logger.error(f"Account validation failed for {account_id}: {e}")
            return False
