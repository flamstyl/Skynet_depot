"""
NaCl Utilities - High-level encryption/signing utilities using PyNaCl

Provides easy-to-use wrappers around PyNaCl primitives.
"""

import logging
import base64
from typing import Dict, Any, Optional
import json

from nacl.secret import SecretBox
from nacl.public import PrivateKey, PublicKey, Box
from nacl.signing import SigningKey, VerifyKey
from nacl.encoding import Base64Encoder, RawEncoder
from nacl.exceptions import CryptoError


logger = logging.getLogger(__name__)


# ========== SYMMETRIC ENCRYPTION (SecretBox) ==========

def encrypt_symmetric(data: bytes, secret_key: bytes) -> bytes:
    """
    Encrypt data using symmetric encryption (NaCl SecretBox).

    Args:
        data: Plaintext bytes
        secret_key: 32-byte secret key

    Returns:
        Encrypted data (includes nonce)
    """
    box = SecretBox(secret_key)
    encrypted = box.encrypt(data)
    return encrypted


def decrypt_symmetric(encrypted_data: bytes, secret_key: bytes) -> Optional[bytes]:
    """
    Decrypt data using symmetric encryption.

    Args:
        encrypted_data: Encrypted data (includes nonce)
        secret_key: 32-byte secret key

    Returns:
        Plaintext bytes or None if decryption fails
    """
    try:
        box = SecretBox(secret_key)
        decrypted = box.decrypt(encrypted_data)
        return decrypted
    except CryptoError as e:
        logger.error(f"Symmetric decryption failed: {e}")
        return None


def encrypt_json_symmetric(data: Dict[str, Any], secret_key: bytes) -> str:
    """
    Encrypt JSON data using symmetric encryption.

    Args:
        data: Dictionary to encrypt
        secret_key: 32-byte secret key

    Returns:
        Base64-encoded encrypted data
    """
    data_json = json.dumps(data)
    data_bytes = data_json.encode('utf-8')

    encrypted = encrypt_symmetric(data_bytes, secret_key)

    return base64.b64encode(encrypted).decode('utf-8')


def decrypt_json_symmetric(encrypted_b64: str, secret_key: bytes) -> Optional[Dict[str, Any]]:
    """
    Decrypt JSON data using symmetric encryption.

    Args:
        encrypted_b64: Base64-encoded encrypted data
        secret_key: 32-byte secret key

    Returns:
        Decrypted dictionary or None
    """
    try:
        encrypted_bytes = base64.b64decode(encrypted_b64)
        decrypted_bytes = decrypt_symmetric(encrypted_bytes, secret_key)

        if not decrypted_bytes:
            return None

        data_json = decrypted_bytes.decode('utf-8')
        return json.loads(data_json)

    except Exception as e:
        logger.error(f"JSON decryption failed: {e}")
        return None


# ========== ASYMMETRIC ENCRYPTION (Box) ==========

def encrypt_asymmetric(
    data: bytes,
    sender_private_key: bytes,
    recipient_public_key: bytes
) -> bytes:
    """
    Encrypt data using asymmetric encryption (authenticated).

    Args:
        data: Plaintext bytes
        sender_private_key: Sender's private key (32 bytes)
        recipient_public_key: Recipient's public key (32 bytes)

    Returns:
        Encrypted data (includes nonce)
    """
    private_key = PrivateKey(sender_private_key)
    public_key = PublicKey(recipient_public_key)

    box = Box(private_key, public_key)
    encrypted = box.encrypt(data)

    return encrypted


def decrypt_asymmetric(
    encrypted_data: bytes,
    recipient_private_key: bytes,
    sender_public_key: bytes
) -> Optional[bytes]:
    """
    Decrypt data using asymmetric encryption.

    Args:
        encrypted_data: Encrypted data (includes nonce)
        recipient_private_key: Recipient's private key
        sender_public_key: Sender's public key

    Returns:
        Plaintext bytes or None
    """
    try:
        private_key = PrivateKey(recipient_private_key)
        public_key = PublicKey(sender_public_key)

        box = Box(private_key, public_key)
        decrypted = box.decrypt(encrypted_data)

        return decrypted

    except CryptoError as e:
        logger.error(f"Asymmetric decryption failed: {e}")
        return None


def encrypt_json_asymmetric(
    data: Dict[str, Any],
    sender_private_key: bytes,
    recipient_public_key: bytes
) -> str:
    """
    Encrypt JSON data using asymmetric encryption.

    Args:
        data: Dictionary to encrypt
        sender_private_key: Sender's private key
        recipient_public_key: Recipient's public key

    Returns:
        Base64-encoded encrypted data
    """
    data_json = json.dumps(data)
    data_bytes = data_json.encode('utf-8')

    encrypted = encrypt_asymmetric(data_bytes, sender_private_key, recipient_public_key)

    return base64.b64encode(encrypted).decode('utf-8')


def decrypt_json_asymmetric(
    encrypted_b64: str,
    recipient_private_key: bytes,
    sender_public_key: bytes
) -> Optional[Dict[str, Any]]:
    """
    Decrypt JSON data using asymmetric encryption.

    Args:
        encrypted_b64: Base64-encoded encrypted data
        recipient_private_key: Recipient's private key
        sender_public_key: Sender's public key

    Returns:
        Decrypted dictionary or None
    """
    try:
        encrypted_bytes = base64.b64decode(encrypted_b64)
        decrypted_bytes = decrypt_asymmetric(
            encrypted_bytes,
            recipient_private_key,
            sender_public_key
        )

        if not decrypted_bytes:
            return None

        data_json = decrypted_bytes.decode('utf-8')
        return json.loads(data_json)

    except Exception as e:
        logger.error(f"JSON asymmetric decryption failed: {e}")
        return None


# ========== DIGITAL SIGNATURES ==========

def sign_message(message: bytes, signing_key: bytes) -> str:
    """
    Create a digital signature for a message.

    Args:
        message: Message bytes to sign
        signing_key: 32-byte signing key (Ed25519)

    Returns:
        Base64-encoded signature
    """
    signer = SigningKey(signing_key)
    signed = signer.sign(message)

    # Return just the signature (not the message)
    return base64.b64encode(signed.signature).decode('utf-8')


def verify_signature(message: bytes, signature_b64: str, verify_key: bytes) -> bool:
    """
    Verify a digital signature.

    Args:
        message: Original message bytes
        signature_b64: Base64-encoded signature
        verify_key: 32-byte verify key (Ed25519 public key)

    Returns:
        True if signature is valid
    """
    try:
        verifier = VerifyKey(verify_key)
        signature = base64.b64decode(signature_b64)

        # Verify will raise exception if invalid
        verifier.verify(message, signature)

        return True

    except Exception as e:
        logger.error(f"Signature verification failed: {e}")
        return False


def sign_json(data: Dict[str, Any], signing_key: bytes) -> str:
    """
    Sign JSON data.

    Args:
        data: Dictionary to sign
        signing_key: Signing key

    Returns:
        Base64-encoded signature
    """
    data_json = json.dumps(data, sort_keys=True)  # Sort for consistency
    data_bytes = data_json.encode('utf-8')

    return sign_message(data_bytes, signing_key)


def verify_json_signature(
    data: Dict[str, Any],
    signature_b64: str,
    verify_key: bytes
) -> bool:
    """
    Verify signature of JSON data.

    Args:
        data: Dictionary that was signed
        signature_b64: Base64-encoded signature
        verify_key: Verify key

    Returns:
        True if signature is valid
    """
    data_json = json.dumps(data, sort_keys=True)
    data_bytes = data_json.encode('utf-8')

    return verify_signature(data_bytes, signature_b64, verify_key)


# ========== KEY CONVERSION UTILITIES ==========

def bytes_to_base64(data: bytes) -> str:
    """Convert bytes to base64 string"""
    return base64.b64encode(data).decode('utf-8')


def base64_to_bytes(data_b64: str) -> bytes:
    """Convert base64 string to bytes"""
    return base64.b64decode(data_b64)


def private_key_to_base64(private_key: PrivateKey) -> str:
    """Convert PrivateKey to base64 string"""
    return private_key.encode(encoder=Base64Encoder).decode('utf-8')


def public_key_to_base64(public_key: PublicKey) -> str:
    """Convert PublicKey to base64 string"""
    return public_key.encode(encoder=Base64Encoder).decode('utf-8')


def base64_to_private_key(key_b64: str) -> PrivateKey:
    """Convert base64 string to PrivateKey"""
    key_bytes = base64.b64decode(key_b64)
    return PrivateKey(key_bytes)


def base64_to_public_key(key_b64: str) -> PublicKey:
    """Convert base64 string to PublicKey"""
    key_bytes = base64.b64decode(key_b64)
    return PublicKey(key_bytes)


# ========== TESTING & VALIDATION ==========

def test_symmetric_encryption(secret_key: bytes) -> bool:
    """
    Test symmetric encryption/decryption.

    Args:
        secret_key: Secret key to test

    Returns:
        True if test passes
    """
    try:
        test_data = b"Hello, NaCl!"

        encrypted = encrypt_symmetric(test_data, secret_key)
        decrypted = decrypt_symmetric(encrypted, secret_key)

        return decrypted == test_data

    except Exception as e:
        logger.error(f"Symmetric encryption test failed: {e}")
        return False


def test_asymmetric_encryption(
    sender_private_key: bytes,
    sender_public_key: bytes,
    recipient_private_key: bytes,
    recipient_public_key: bytes
) -> bool:
    """
    Test asymmetric encryption/decryption.

    Args:
        sender_private_key: Sender's private key
        sender_public_key: Sender's public key
        recipient_private_key: Recipient's private key
        recipient_public_key: Recipient's public key

    Returns:
        True if test passes
    """
    try:
        test_data = b"Hello, NaCl Box!"

        # Sender encrypts for recipient
        encrypted = encrypt_asymmetric(
            test_data,
            sender_private_key,
            recipient_public_key
        )

        # Recipient decrypts from sender
        decrypted = decrypt_asymmetric(
            encrypted,
            recipient_private_key,
            sender_public_key
        )

        return decrypted == test_data

    except Exception as e:
        logger.error(f"Asymmetric encryption test failed: {e}")
        return False


def test_signatures(signing_key: bytes, verify_key: bytes) -> bool:
    """
    Test signature creation and verification.

    Args:
        signing_key: Signing key
        verify_key: Verification key

    Returns:
        True if test passes
    """
    try:
        test_message = b"Sign this message!"

        signature = sign_message(test_message, signing_key)
        valid = verify_signature(test_message, signature, verify_key)

        return valid

    except Exception as e:
        logger.error(f"Signature test failed: {e}")
        return False


# ========== MAIN TEST ==========

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    logger.info("🧪 Testing NaCl utilities...")

    # Test symmetric encryption
    from nacl.utils import random
    secret_key = random(32)

    if test_symmetric_encryption(secret_key):
        logger.info("✅ Symmetric encryption test passed")
    else:
        logger.error("❌ Symmetric encryption test failed")

    # Test asymmetric encryption
    sender_private = PrivateKey.generate()
    sender_public = sender_private.public_key

    recipient_private = PrivateKey.generate()
    recipient_public = recipient_private.public_key

    if test_asymmetric_encryption(
        sender_private.encode(),
        sender_public.encode(encoder=Base64Encoder),
        recipient_private.encode(),
        recipient_public.encode(encoder=Base64Encoder)
    ):
        logger.info("✅ Asymmetric encryption test passed")
    else:
        logger.error("❌ Asymmetric encryption test failed")

    # Test signatures
    signing_key = SigningKey.generate()
    verify_key = signing_key.verify_key

    if test_signatures(signing_key.encode(), verify_key.encode()):
        logger.info("✅ Signature test passed")
    else:
        logger.error("❌ Signature test failed")

    logger.info("🎉 All tests completed!")
