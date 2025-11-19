"""
Encryption Module - NaCl-based encryption for MCP messages

Provides symmetric and asymmetric encryption for message payloads.
"""

import json
import logging
from typing import Dict, Any, Optional
import base64
from nacl.secret import SecretBox
from nacl.public import PrivateKey, PublicKey, Box
from nacl.encoding import Base64Encoder
from nacl.utils import random


logger = logging.getLogger(__name__)


class EncryptionError(Exception):
    """Custom encryption error"""
    pass


class MessageEncryption:
    """
    Handles encryption/decryption of MCP message payloads.

    Supports:
    - Symmetric encryption (SecretBox) for known agents
    - Asymmetric encryption (Box) for unknown agents
    """

    def __init__(self, secret_key: Optional[bytes] = None):
        """
        Initialize encryption.

        Args:
            secret_key: 32-byte secret key for symmetric encryption
                       If None, will be generated
        """
        if secret_key:
            if len(secret_key) != 32:
                raise ValueError("Secret key must be 32 bytes")
            self.secret_key = secret_key
        else:
            self.secret_key = random(32)

        self.secret_box = SecretBox(self.secret_key)

        # For asymmetric encryption (optional)
        self.private_key: Optional[PrivateKey] = None
        self.public_key: Optional[PublicKey] = None

    # ========== SYMMETRIC ENCRYPTION (SecretBox) ==========

    def encrypt_payload_symmetric(self, payload: Dict[str, Any]) -> str:
        """
        Encrypt payload using symmetric key (SecretBox).

        Args:
            payload: Payload dictionary

        Returns:
            Base64-encoded encrypted payload

        Raises:
            EncryptionError: If encryption fails
        """
        try:
            # Serialize payload to JSON
            payload_json = json.dumps(payload)
            payload_bytes = payload_json.encode('utf-8')

            # Encrypt with SecretBox
            encrypted = self.secret_box.encrypt(payload_bytes)

            # Encode to base64 for transport
            encrypted_b64 = base64.b64encode(encrypted).decode('utf-8')

            logger.debug(f"Payload encrypted (symmetric): {len(payload_bytes)} bytes → {len(encrypted)} bytes")
            return encrypted_b64

        except Exception as e:
            logger.error(f"Symmetric encryption failed: {e}")
            raise EncryptionError(f"Encryption failed: {e}")

    def decrypt_payload_symmetric(self, encrypted_payload: str) -> Dict[str, Any]:
        """
        Decrypt payload using symmetric key.

        Args:
            encrypted_payload: Base64-encoded encrypted payload

        Returns:
            Decrypted payload dictionary

        Raises:
            EncryptionError: If decryption fails
        """
        try:
            # Decode from base64
            encrypted_bytes = base64.b64decode(encrypted_payload.encode('utf-8'))

            # Decrypt with SecretBox
            decrypted_bytes = self.secret_box.decrypt(encrypted_bytes)

            # Deserialize from JSON
            payload_json = decrypted_bytes.decode('utf-8')
            payload = json.loads(payload_json)

            logger.debug(f"Payload decrypted (symmetric): {len(encrypted_bytes)} bytes → {len(decrypted_bytes)} bytes")
            return payload

        except Exception as e:
            logger.error(f"Symmetric decryption failed: {e}")
            raise EncryptionError(f"Decryption failed: {e}")

    # ========== ASYMMETRIC ENCRYPTION (Box) ==========

    def generate_keypair(self):
        """Generate asymmetric keypair"""
        self.private_key = PrivateKey.generate()
        self.public_key = self.private_key.public_key
        logger.info("Asymmetric keypair generated")

    def get_public_key(self) -> Optional[str]:
        """Get public key as base64 string"""
        if not self.public_key:
            return None
        return self.public_key.encode(encoder=Base64Encoder).decode('utf-8')

    def set_keypair(self, private_key_b64: str):
        """
        Set keypair from base64-encoded private key.

        Args:
            private_key_b64: Base64-encoded private key
        """
        private_key_bytes = base64.b64decode(private_key_b64)
        self.private_key = PrivateKey(private_key_bytes)
        self.public_key = self.private_key.public_key
        logger.info("Keypair loaded from base64")

    def encrypt_payload_asymmetric(
        self,
        payload: Dict[str, Any],
        recipient_public_key_b64: str
    ) -> str:
        """
        Encrypt payload using asymmetric encryption (Box).

        Args:
            payload: Payload dictionary
            recipient_public_key_b64: Recipient's public key (base64)

        Returns:
            Base64-encoded encrypted payload

        Raises:
            EncryptionError: If encryption fails
        """
        if not self.private_key:
            raise EncryptionError("No private key available, generate keypair first")

        try:
            # Decode recipient public key
            recipient_public_key = PublicKey(
                base64.b64decode(recipient_public_key_b64),
                encoder=Base64Encoder
            )

            # Create Box for encryption
            box = Box(self.private_key, recipient_public_key)

            # Serialize payload
            payload_json = json.dumps(payload)
            payload_bytes = payload_json.encode('utf-8')

            # Encrypt
            encrypted = box.encrypt(payload_bytes)

            # Encode to base64
            encrypted_b64 = base64.b64encode(encrypted).decode('utf-8')

            logger.debug(f"Payload encrypted (asymmetric): {len(payload_bytes)} bytes → {len(encrypted)} bytes")
            return encrypted_b64

        except Exception as e:
            logger.error(f"Asymmetric encryption failed: {e}")
            raise EncryptionError(f"Encryption failed: {e}")

    def decrypt_payload_asymmetric(
        self,
        encrypted_payload: str,
        sender_public_key_b64: str
    ) -> Dict[str, Any]:
        """
        Decrypt payload using asymmetric encryption.

        Args:
            encrypted_payload: Base64-encoded encrypted payload
            sender_public_key_b64: Sender's public key (base64)

        Returns:
            Decrypted payload dictionary

        Raises:
            EncryptionError: If decryption fails
        """
        if not self.private_key:
            raise EncryptionError("No private key available")

        try:
            # Decode sender public key
            sender_public_key = PublicKey(
                base64.b64decode(sender_public_key_b64),
                encoder=Base64Encoder
            )

            # Create Box for decryption
            box = Box(self.private_key, sender_public_key)

            # Decode from base64
            encrypted_bytes = base64.b64decode(encrypted_payload.encode('utf-8'))

            # Decrypt
            decrypted_bytes = box.decrypt(encrypted_bytes)

            # Deserialize
            payload_json = decrypted_bytes.decode('utf-8')
            payload = json.loads(payload_json)

            logger.debug(f"Payload decrypted (asymmetric): {len(encrypted_bytes)} bytes → {len(decrypted_bytes)} bytes")
            return payload

        except Exception as e:
            logger.error(f"Asymmetric decryption failed: {e}")
            raise EncryptionError(f"Decryption failed: {e}")

    # ========== MESSAGE-LEVEL ENCRYPTION ==========

    def encrypt_message(
        self,
        message: Dict[str, Any],
        mode: str = "symmetric",
        recipient_public_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Encrypt message payload (modifies message in-place).

        Args:
            message: MCP message dictionary
            mode: "symmetric" or "asymmetric"
            recipient_public_key: Required for asymmetric mode

        Returns:
            Modified message with encrypted payload
        """
        if message.get("encrypted"):
            logger.warning("Message already encrypted, skipping")
            return message

        payload = message.get("payload")
        if not payload:
            logger.warning("No payload to encrypt")
            return message

        try:
            if mode == "symmetric":
                encrypted_payload = self.encrypt_payload_symmetric(payload)
            elif mode == "asymmetric":
                if not recipient_public_key:
                    raise EncryptionError("Recipient public key required for asymmetric encryption")
                encrypted_payload = self.encrypt_payload_asymmetric(payload, recipient_public_key)
            else:
                raise EncryptionError(f"Unknown encryption mode: {mode}")

            # Replace payload with encrypted version
            message["payload"] = {"encrypted_data": encrypted_payload}
            message["encrypted"] = True
            message["encryption_mode"] = mode

            logger.debug(f"Message {message.get('id', 'unknown')} encrypted ({mode})")
            return message

        except Exception as e:
            logger.error(f"Failed to encrypt message: {e}")
            raise

    def decrypt_message(
        self,
        message: Dict[str, Any],
        sender_public_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Decrypt message payload (modifies message in-place).

        Args:
            message: MCP message dictionary with encrypted payload
            sender_public_key: Required for asymmetric mode

        Returns:
            Modified message with decrypted payload
        """
        if not message.get("encrypted"):
            logger.debug("Message not encrypted, skipping")
            return message

        payload = message.get("payload", {})
        encrypted_data = payload.get("encrypted_data")

        if not encrypted_data:
            raise EncryptionError("No encrypted data found in payload")

        try:
            mode = message.get("encryption_mode", "symmetric")

            if mode == "symmetric":
                decrypted_payload = self.decrypt_payload_symmetric(encrypted_data)
            elif mode == "asymmetric":
                if not sender_public_key:
                    raise EncryptionError("Sender public key required for asymmetric decryption")
                decrypted_payload = self.decrypt_payload_asymmetric(encrypted_data, sender_public_key)
            else:
                raise EncryptionError(f"Unknown encryption mode: {mode}")

            # Restore original payload
            message["payload"] = decrypted_payload
            message["encrypted"] = False

            logger.debug(f"Message {message.get('id', 'unknown')} decrypted ({mode})")
            return message

        except Exception as e:
            logger.error(f"Failed to decrypt message: {e}")
            raise


# ========== CONVENIENCE FUNCTIONS ==========

def generate_secret_key() -> bytes:
    """Generate random 32-byte secret key"""
    return random(32)


def secret_key_to_base64(key: bytes) -> str:
    """Convert secret key to base64 string"""
    return base64.b64encode(key).decode('utf-8')


def secret_key_from_base64(key_b64: str) -> bytes:
    """Convert base64 string to secret key"""
    return base64.b64decode(key_b64)


# ========== TESTING HELPERS ==========

if __name__ == "__main__":
    # Quick test
    logging.basicConfig(level=logging.DEBUG)

    enc = MessageEncryption()

    # Test symmetric
    test_payload = {
        "content": "Hello, encrypted world!",
        "context": {"session_id": "test123"},
        "meta": {"timestamp": "2025-11-19T12:00:00Z"}
    }

    encrypted = enc.encrypt_payload_symmetric(test_payload)
    print(f"Encrypted: {encrypted[:50]}...")

    decrypted = enc.decrypt_payload_symmetric(encrypted)
    print(f"Decrypted: {decrypted}")

    assert decrypted == test_payload
    print("✅ Symmetric encryption test passed!")

    # Test asymmetric
    enc.generate_keypair()
    enc2 = MessageEncryption()
    enc2.generate_keypair()

    encrypted_asym = enc.encrypt_payload_asymmetric(test_payload, enc2.get_public_key())
    print(f"Encrypted (asymmetric): {encrypted_asym[:50]}...")

    decrypted_asym = enc2.decrypt_payload_asymmetric(encrypted_asym, enc.get_public_key())
    print(f"Decrypted (asymmetric): {decrypted_asym}")

    assert decrypted_asym == test_payload
    print("✅ Asymmetric encryption test passed!")
