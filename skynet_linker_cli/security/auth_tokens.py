"""
Authentication Tokens - Token management for client authentication

Supports:
- Static tokens (simple, for MVP)
- JWT tokens (for production)
- Token validation and revocation
"""

import logging
import secrets
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import json
from pathlib import Path


logger = logging.getLogger(__name__)


# ========== STATIC TOKEN MANAGER (MVP) ==========

class StaticTokenManager:
    """
    Simple token manager using static tokens.

    For MVP - tokens are pre-generated and stored in a file.
    Production should use JWT or similar.
    """

    def __init__(self, token_file: str = ".skynet_tokens.json"):
        """
        Initialize static token manager.

        Args:
            token_file: Path to token storage file
        """
        self.token_file = Path(token_file)
        self.tokens: Dict[str, Dict[str, Any]] = {}

        # Load existing tokens
        if self.token_file.exists():
            self.load_tokens()

    def generate_token(
        self,
        agent_id: str,
        permissions: Optional[List[str]] = None,
        expires_days: Optional[int] = None
    ) -> str:
        """
        Generate a new static token for an agent.

        Args:
            agent_id: Agent identifier
            permissions: List of permissions (optional)
            expires_days: Token expiry in days (None = never expires)

        Returns:
            Generated token string
        """
        # Generate cryptographically secure random token
        token = secrets.token_urlsafe(32)

        # Calculate expiry
        expires_at = None
        if expires_days:
            expires_at = (datetime.utcnow() + timedelta(days=expires_days)).isoformat()

        # Store token metadata
        self.tokens[token] = {
            "agent_id": agent_id,
            "permissions": permissions or ["read", "write"],
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": expires_at,
            "revoked": False,
            "last_used": None
        }

        logger.info(f"🔑 Token generated for {agent_id}")

        # Auto-save
        self.save_tokens()

        return token

    def validate_token(self, token: str) -> Optional[str]:
        """
        Validate a token and return agent_id if valid.

        Args:
            token: Token to validate

        Returns:
            Agent ID if valid, None otherwise
        """
        if token not in self.tokens:
            logger.warning("Invalid token: not found")
            return None

        token_data = self.tokens[token]

        # Check if revoked
        if token_data.get("revoked"):
            logger.warning("Invalid token: revoked")
            return None

        # Check expiry
        expires_at = token_data.get("expires_at")
        if expires_at:
            expiry_dt = datetime.fromisoformat(expires_at)
            if datetime.utcnow() > expiry_dt:
                logger.warning("Invalid token: expired")
                return None

        # Update last used
        token_data["last_used"] = datetime.utcnow().isoformat()

        return token_data["agent_id"]

    def revoke_token(self, token: str) -> bool:
        """
        Revoke a token.

        Args:
            token: Token to revoke

        Returns:
            True if revoked
        """
        if token not in self.tokens:
            return False

        self.tokens[token]["revoked"] = True
        self.tokens[token]["revoked_at"] = datetime.utcnow().isoformat()

        logger.info(f"Token revoked: {token[:10]}...")

        self.save_tokens()
        return True

    def get_token_info(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Get metadata for a token.

        Args:
            token: Token string

        Returns:
            Token metadata or None
        """
        return self.tokens.get(token)

    def list_tokens(self, agent_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List all tokens (optionally filtered by agent_id).

        Args:
            agent_id: Filter by agent ID (optional)

        Returns:
            List of token metadata
        """
        tokens = []

        for token, data in self.tokens.items():
            if agent_id and data["agent_id"] != agent_id:
                continue

            # Don't include the actual token in output (security)
            token_info = data.copy()
            token_info["token_prefix"] = token[:10] + "..."

            tokens.append(token_info)

        return tokens

    def delete_token(self, token: str) -> bool:
        """
        Permanently delete a token.

        Args:
            token: Token to delete

        Returns:
            True if deleted
        """
        if token in self.tokens:
            del self.tokens[token]
            self.save_tokens()
            logger.info(f"Token deleted: {token[:10]}...")
            return True

        return False

    def save_tokens(self) -> bool:
        """
        Save tokens to file.

        Returns:
            True if successful
        """
        try:
            with open(self.token_file, 'w') as f:
                json.dump(self.tokens, f, indent=2)

            # Restrict permissions
            self.token_file.chmod(0o600)

            logger.debug(f"Tokens saved to {self.token_file}")
            return True

        except Exception as e:
            logger.error(f"Failed to save tokens: {e}")
            return False

    def load_tokens(self) -> bool:
        """
        Load tokens from file.

        Returns:
            True if successful
        """
        try:
            with open(self.token_file, 'r') as f:
                self.tokens = json.load(f)

            logger.info(f"Tokens loaded from {self.token_file} ({len(self.tokens)} tokens)")
            return True

        except Exception as e:
            logger.error(f"Failed to load tokens: {e}")
            return False

    def cleanup_expired(self) -> int:
        """
        Remove expired tokens.

        Returns:
            Number of tokens removed
        """
        now = datetime.utcnow()
        expired = []

        for token, data in self.tokens.items():
            expires_at = data.get("expires_at")
            if expires_at:
                expiry_dt = datetime.fromisoformat(expires_at)
                if now > expiry_dt:
                    expired.append(token)

        for token in expired:
            del self.tokens[token]

        if expired:
            self.save_tokens()
            logger.info(f"Cleaned up {len(expired)} expired tokens")

        return len(expired)


# ========== JWT TOKEN MANAGER (Future/Production) ==========

class JWTTokenManager:
    """
    JWT-based token manager for production use.

    TODO: Implement using PyJWT library.
    """

    def __init__(self, secret_key: bytes):
        """
        Initialize JWT token manager.

        Args:
            secret_key: Secret key for signing JWTs
        """
        self.secret_key = secret_key
        logger.warning("JWTTokenManager not fully implemented - use StaticTokenManager for MVP")

    def generate_token(self, agent_id: str, permissions: Optional[List[str]] = None) -> str:
        """Generate JWT token (not implemented)"""
        raise NotImplementedError("JWT tokens not implemented yet")

    def validate_token(self, token: str) -> Optional[str]:
        """Validate JWT token (not implemented)"""
        raise NotImplementedError("JWT tokens not implemented yet")


# ========== API KEY MANAGER ==========

class APIKeyManager:
    """
    API key manager (hashed keys for external integrations).

    Similar to static tokens but with additional hashing for security.
    """

    def __init__(self, keyfile: str = ".skynet_apikeys.json"):
        """
        Initialize API key manager.

        Args:
            keyfile: Path to API key storage
        """
        self.keyfile = Path(keyfile)
        self.keys: Dict[str, Dict[str, Any]] = {}

        if self.keyfile.exists():
            self.load_keys()

    def generate_api_key(self, name: str, permissions: Optional[List[str]] = None) -> str:
        """
        Generate a new API key.

        Args:
            name: Key name/description
            permissions: Permissions list

        Returns:
            API key string (only shown once!)
        """
        # Generate key
        api_key = f"sk-{secrets.token_urlsafe(32)}"

        # Hash the key for storage
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()

        # Store hashed key
        self.keys[key_hash] = {
            "name": name,
            "permissions": permissions or ["read"],
            "created_at": datetime.utcnow().isoformat(),
            "last_used": None,
            "revoked": False
        }

        self.save_keys()

        logger.info(f"🔑 API key generated: {name}")

        # Return plaintext key (only time it's visible!)
        return api_key

    def validate_api_key(self, api_key: str) -> bool:
        """
        Validate an API key.

        Args:
            api_key: API key to validate

        Returns:
            True if valid
        """
        # Hash the provided key
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()

        if key_hash not in self.keys:
            return False

        key_data = self.keys[key_hash]

        if key_data.get("revoked"):
            return False

        # Update last used
        key_data["last_used"] = datetime.utcnow().isoformat()

        return True

    def revoke_api_key(self, key_hash: str) -> bool:
        """
        Revoke an API key by hash.

        Args:
            key_hash: SHA256 hash of the key

        Returns:
            True if revoked
        """
        if key_hash in self.keys:
            self.keys[key_hash]["revoked"] = True
            self.save_keys()
            return True

        return False

    def save_keys(self):
        """Save API keys to file"""
        with open(self.keyfile, 'w') as f:
            json.dump(self.keys, f, indent=2)

        self.keyfile.chmod(0o600)

    def load_keys(self):
        """Load API keys from file"""
        with open(self.keyfile, 'r') as f:
            self.keys = json.load(f)


# ========== CONVENIENCE FUNCTIONS ==========

def create_default_token_manager() -> StaticTokenManager:
    """Create default token manager"""
    return StaticTokenManager()


def generate_agent_token(agent_id: str, manager: StaticTokenManager = None) -> str:
    """
    Generate a token for an agent.

    Args:
        agent_id: Agent identifier
        manager: Token manager (creates default if None)

    Returns:
        Generated token
    """
    if manager is None:
        manager = create_default_token_manager()

    return manager.generate_token(agent_id)


# ========== TESTING ==========

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    logger.info("🧪 Testing token managers...")

    # Test static token manager
    manager = StaticTokenManager(".test_tokens.json")

    # Generate token
    token = manager.generate_token("test_agent", permissions=["read", "write"])
    logger.info(f"Generated token: {token[:20]}...")

    # Validate token
    agent_id = manager.validate_token(token)
    if agent_id == "test_agent":
        logger.info("✅ Token validation passed")
    else:
        logger.error("❌ Token validation failed")

    # Revoke token
    manager.revoke_token(token)

    # Validate revoked token (should fail)
    agent_id = manager.validate_token(token)
    if agent_id is None:
        logger.info("✅ Token revocation passed")
    else:
        logger.error("❌ Token revocation failed")

    # Cleanup test file
    Path(".test_tokens.json").unlink(missing_ok=True)

    logger.info("🎉 Token manager tests completed!")
