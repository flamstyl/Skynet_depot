"""
Key Manager - Cryptographic key management for MCP

Handles generation, storage, rotation of encryption keys.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import base64
from datetime import datetime

from nacl.secret import SecretBox
from nacl.public import PrivateKey, PublicKey
from nacl.encoding import Base64Encoder
from nacl.utils import random


logger = logging.getLogger(__name__)


class KeyManager:
    """
    Manages cryptographic keys for MCP server.

    Supports:
    - Symmetric keys (SecretBox) for message encryption
    - Asymmetric keypairs (Box) for agent-to-agent encryption
    - Key rotation and versioning
    - Secure key storage
    """

    def __init__(self, key_file: str = ".skynet_linker.keys"):
        """
        Initialize key manager.

        Args:
            key_file: Path to key storage file
        """
        self.key_file = Path(key_file)
        self.keys: Dict[str, Any] = {}

        # Load existing keys if available
        if self.key_file.exists():
            self.load_keys()
        else:
            logger.info("No existing keys found, will generate on demand")

    # ========== KEY GENERATION ==========

    def generate_secret_key(self, key_id: str = "default") -> bytes:
        """
        Generate a new symmetric secret key (32 bytes for NaCl SecretBox).

        Args:
            key_id: Identifier for this key

        Returns:
            32-byte secret key
        """
        secret_key = random(32)

        # Store in memory
        self.keys[key_id] = {
            "type": "symmetric",
            "key": base64.b64encode(secret_key).decode('utf-8'),
            "created_at": datetime.utcnow().isoformat(),
            "version": 1
        }

        logger.info(f"🔑 Secret key generated: {key_id}")

        # Auto-save
        self.save_keys()

        return secret_key

    def generate_keypair(self, key_id: str = "default") -> Tuple[bytes, bytes]:
        """
        Generate an asymmetric keypair (private + public).

        Args:
            key_id: Identifier for this keypair

        Returns:
            Tuple of (private_key, public_key)
        """
        private_key = PrivateKey.generate()
        public_key = private_key.public_key

        # Store in memory (only private key, public key derived)
        self.keys[key_id] = {
            "type": "asymmetric",
            "private_key": private_key.encode(encoder=Base64Encoder).decode('utf-8'),
            "public_key": public_key.encode(encoder=Base64Encoder).decode('utf-8'),
            "created_at": datetime.utcnow().isoformat(),
            "version": 1
        }

        logger.info(f"🔑 Keypair generated: {key_id}")

        # Auto-save
        self.save_keys()

        return (
            private_key.encode(),
            public_key.encode(encoder=Base64Encoder)
        )

    # ========== KEY RETRIEVAL ==========

    def get_secret_key(self, key_id: str = "default") -> Optional[bytes]:
        """
        Get symmetric secret key.

        Args:
            key_id: Key identifier

        Returns:
            Secret key bytes or None
        """
        if key_id not in self.keys:
            logger.warning(f"Secret key '{key_id}' not found, generating...")
            return self.generate_secret_key(key_id)

        key_data = self.keys[key_id]

        if key_data["type"] != "symmetric":
            logger.error(f"Key '{key_id}' is not a symmetric key")
            return None

        key_b64 = key_data["key"]
        return base64.b64decode(key_b64)

    def get_private_key(self, key_id: str = "default") -> Optional[PrivateKey]:
        """
        Get asymmetric private key.

        Args:
            key_id: Key identifier

        Returns:
            PrivateKey object or None
        """
        if key_id not in self.keys:
            logger.warning(f"Keypair '{key_id}' not found, generating...")
            self.generate_keypair(key_id)

        key_data = self.keys[key_id]

        if key_data["type"] != "asymmetric":
            logger.error(f"Key '{key_id}' is not an asymmetric key")
            return None

        private_key_b64 = key_data["private_key"]
        private_key_bytes = base64.b64decode(private_key_b64)

        return PrivateKey(private_key_bytes)

    def get_public_key(self, key_id: str = "default") -> Optional[PublicKey]:
        """
        Get asymmetric public key.

        Args:
            key_id: Key identifier

        Returns:
            PublicKey object or None
        """
        if key_id not in self.keys:
            logger.warning(f"Keypair '{key_id}' not found")
            return None

        key_data = self.keys[key_id]

        if key_data["type"] != "asymmetric":
            logger.error(f"Key '{key_id}' is not an asymmetric key")
            return None

        public_key_b64 = key_data["public_key"]
        public_key_bytes = base64.b64decode(public_key_b64)

        return PublicKey(public_key_bytes)

    def get_public_key_b64(self, key_id: str = "default") -> Optional[str]:
        """
        Get asymmetric public key as base64 string (for sharing).

        Args:
            key_id: Key identifier

        Returns:
            Base64-encoded public key or None
        """
        if key_id not in self.keys:
            return None

        key_data = self.keys[key_id]

        if key_data["type"] != "asymmetric":
            return None

        return key_data["public_key"]

    # ========== KEY STORAGE ==========

    def save_keys(self) -> bool:
        """
        Save keys to encrypted file.

        Returns:
            True if successful
        """
        try:
            # TODO: Encrypt key file with master password
            # For MVP, store as plaintext JSON (⚠️ not production-ready)

            with open(self.key_file, 'w') as f:
                json.dump(self.keys, f, indent=2)

            # Restrict file permissions (Unix only)
            self.key_file.chmod(0o600)

            logger.info(f"Keys saved to {self.key_file}")
            return True

        except Exception as e:
            logger.error(f"Failed to save keys: {e}")
            return False

    def load_keys(self) -> bool:
        """
        Load keys from file.

        Returns:
            True if successful
        """
        try:
            with open(self.key_file, 'r') as f:
                self.keys = json.load(f)

            logger.info(f"Keys loaded from {self.key_file} ({len(self.keys)} keys)")
            return True

        except Exception as e:
            logger.error(f"Failed to load keys: {e}")
            return False

    def delete_keys_file(self) -> bool:
        """
        Delete the keys file (⚠️ use with caution).

        Returns:
            True if deleted
        """
        try:
            if self.key_file.exists():
                self.key_file.unlink()
                logger.warning(f"⚠️ Keys file deleted: {self.key_file}")
                self.keys = {}
                return True
            return False

        except Exception as e:
            logger.error(f"Failed to delete keys file: {e}")
            return False

    # ========== KEY ROTATION ==========

    def rotate_key(self, key_id: str) -> bool:
        """
        Rotate a key (create new version, keep old for decryption).

        Args:
            key_id: Key identifier

        Returns:
            True if successful
        """
        if key_id not in self.keys:
            logger.error(f"Key '{key_id}' not found, cannot rotate")
            return False

        old_key = self.keys[key_id]
        key_type = old_key["type"]
        old_version = old_key.get("version", 1)

        # Archive old key
        archived_key_id = f"{key_id}_v{old_version}"
        self.keys[archived_key_id] = old_key.copy()
        self.keys[archived_key_id]["archived"] = True
        self.keys[archived_key_id]["archived_at"] = datetime.utcnow().isoformat()

        # Generate new key
        if key_type == "symmetric":
            self.generate_secret_key(key_id)
        elif key_type == "asymmetric":
            self.generate_keypair(key_id)

        # Increment version
        self.keys[key_id]["version"] = old_version + 1

        logger.info(f"🔄 Key rotated: {key_id} (v{old_version} → v{old_version + 1})")

        self.save_keys()
        return True

    def get_archived_key(self, key_id: str, version: int) -> Optional[Dict[str, Any]]:
        """
        Get an archived key version.

        Args:
            key_id: Key identifier
            version: Version number

        Returns:
            Archived key data or None
        """
        archived_key_id = f"{key_id}_v{version}"
        return self.keys.get(archived_key_id)

    # ========== KEY LISTING & INFO ==========

    def list_keys(self) -> list:
        """
        List all active keys.

        Returns:
            List of key metadata dictionaries
        """
        active_keys = []

        for key_id, key_data in self.keys.items():
            if key_data.get("archived"):
                continue

            active_keys.append({
                "key_id": key_id,
                "type": key_data["type"],
                "created_at": key_data["created_at"],
                "version": key_data.get("version", 1)
            })

        return active_keys

    def get_key_info(self, key_id: str) -> Optional[Dict[str, Any]]:
        """
        Get metadata for a key.

        Args:
            key_id: Key identifier

        Returns:
            Key metadata or None
        """
        if key_id not in self.keys:
            return None

        key_data = self.keys[key_id]

        return {
            "key_id": key_id,
            "type": key_data["type"],
            "created_at": key_data["created_at"],
            "version": key_data.get("version", 1),
            "archived": key_data.get("archived", False),
            "has_public_key": "public_key" in key_data
        }

    def key_exists(self, key_id: str) -> bool:
        """
        Check if a key exists.

        Args:
            key_id: Key identifier

        Returns:
            True if exists
        """
        return key_id in self.keys

    # ========== IMPORT & EXPORT ==========

    def export_public_keys(self) -> Dict[str, str]:
        """
        Export all public keys (for sharing with other agents).

        Returns:
            Dictionary mapping key_id -> public_key_b64
        """
        public_keys = {}

        for key_id, key_data in self.keys.items():
            if key_data["type"] == "asymmetric" and not key_data.get("archived"):
                public_keys[key_id] = key_data["public_key"]

        return public_keys

    def import_public_key(self, key_id: str, public_key_b64: str) -> bool:
        """
        Import a public key from another agent.

        Args:
            key_id: Key identifier (e.g., "agent_gemini_pub")
            public_key_b64: Base64-encoded public key

        Returns:
            True if imported successfully
        """
        try:
            # Validate it's a valid public key
            PublicKey(base64.b64decode(public_key_b64))

            # Store as imported public key
            self.keys[key_id] = {
                "type": "public_only",
                "public_key": public_key_b64,
                "imported_at": datetime.utcnow().isoformat(),
                "version": 1
            }

            logger.info(f"Public key imported: {key_id}")

            self.save_keys()
            return True

        except Exception as e:
            logger.error(f"Failed to import public key: {e}")
            return False

    # ========== UTILITY ==========

    def get_stats(self) -> Dict[str, Any]:
        """
        Get key manager statistics.

        Returns:
            Statistics dictionary
        """
        total_keys = len(self.keys)
        active_keys = len([k for k in self.keys.values() if not k.get("archived")])
        symmetric_keys = len([k for k in self.keys.values() if k["type"] == "symmetric"])
        asymmetric_keys = len([k for k in self.keys.values() if k["type"] == "asymmetric"])
        archived_keys = len([k for k in self.keys.values() if k.get("archived")])

        return {
            "total_keys": total_keys,
            "active_keys": active_keys,
            "symmetric_keys": symmetric_keys,
            "asymmetric_keys": asymmetric_keys,
            "archived_keys": archived_keys,
            "key_file": str(self.key_file),
            "key_file_exists": self.key_file.exists()
        }


# ========== CONVENIENCE FUNCTIONS ==========

def create_key_manager(key_file: str = ".skynet_linker.keys") -> KeyManager:
    """
    Create and initialize a key manager.

    Args:
        key_file: Path to key file

    Returns:
        KeyManager instance
    """
    return KeyManager(key_file)


def generate_default_keys(key_manager: KeyManager) -> bool:
    """
    Generate default keys for a new installation.

    Args:
        key_manager: KeyManager instance

    Returns:
        True if successful
    """
    try:
        # Generate default symmetric key
        key_manager.generate_secret_key("default")

        # Generate default asymmetric keypair
        key_manager.generate_keypair("server")

        logger.info("✅ Default keys generated")
        return True

    except Exception as e:
        logger.error(f"Failed to generate default keys: {e}")
        return False
