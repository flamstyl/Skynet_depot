"""
Tests for Encryption Layer
"""

import pytest
from nacl.utils import random
from nacl.public import PrivateKey
from server.encryption import MessageEncryption, EncryptionError, generate_secret_key
from security.nacl_utils import (
    encrypt_symmetric,
    decrypt_symmetric,
    encrypt_json_symmetric,
    decrypt_json_symmetric
)


def test_generate_secret_key():
    """Test secret key generation"""
    key = generate_secret_key()

    assert len(key) == 32  # NaCl requires 32 bytes
    assert isinstance(key, bytes)


def test_symmetric_encryption_basic():
    """Test basic symmetric encryption/decryption"""
    secret_key = random(32)
    plaintext = b"Hello, Skynet!"

    encrypted = encrypt_symmetric(plaintext, secret_key)
    decrypted = decrypt_symmetric(encrypted, secret_key)

    assert decrypted == plaintext
    assert encrypted != plaintext  # Should be different


def test_symmetric_encryption_json():
    """Test JSON encryption/decryption"""
    secret_key = random(32)
    data = {
        "agent_id": "claude_cli",
        "content": "Test message",
        "metadata": {"priority": 8}
    }

    encrypted_b64 = encrypt_json_symmetric(data, secret_key)
    decrypted = decrypt_json_symmetric(encrypted_b64, secret_key)

    assert decrypted == data


def test_message_encryption_class():
    """Test MessageEncryption class"""
    enc = MessageEncryption()

    test_payload = {
        "content": "Sensitive data",
        "context": {"session_id": "test123"},
        "meta": {}
    }

    # Encrypt
    encrypted = enc.encrypt_payload_symmetric(test_payload)

    assert isinstance(encrypted, str)  # Base64 string

    # Decrypt
    decrypted = enc.decrypt_payload_symmetric(encrypted)

    assert decrypted == test_payload


def test_message_encryption_with_custom_key():
    """Test encryption with custom secret key"""
    secret_key = random(32)
    enc = MessageEncryption(secret_key=secret_key)

    payload = {"content": "Test"}

    encrypted = enc.encrypt_payload_symmetric(payload)
    decrypted = enc.decrypt_payload_symmetric(encrypted)

    assert decrypted == payload


def test_encrypt_decrypt_message():
    """Test full message encryption/decryption"""
    enc = MessageEncryption()

    message = {
        "id": "msg-123",
        "from_agent": "claude_cli",
        "to_agent": "gemini",
        "type": "task",
        "payload": {
            "content": "Secret message",
            "context": {},
            "meta": {}
        },
        "encrypted": False
    }

    # Encrypt message
    encrypted_msg = enc.encrypt_message(message.copy(), mode="symmetric")

    assert encrypted_msg["encrypted"] is True
    assert "encrypted_data" in encrypted_msg["payload"]

    # Decrypt message
    decrypted_msg = enc.decrypt_message(encrypted_msg)

    assert decrypted_msg["encrypted"] is False
    assert decrypted_msg["payload"]["content"] == "Secret message"


def test_asymmetric_encryption():
    """Test asymmetric encryption"""
    enc1 = MessageEncryption()
    enc1.generate_keypair()

    enc2 = MessageEncryption()
    enc2.generate_keypair()

    payload = {"content": "Asymmetric test"}

    # enc1 encrypts for enc2
    encrypted = enc1.encrypt_payload_asymmetric(payload, enc2.get_public_key())

    # enc2 decrypts from enc1
    decrypted = enc2.decrypt_payload_asymmetric(encrypted, enc1.get_public_key())

    assert decrypted == payload


def test_decryption_failure_wrong_key():
    """Test that decryption fails with wrong key"""
    key1 = random(32)
    key2 = random(32)

    plaintext = b"Test data"

    encrypted = encrypt_symmetric(plaintext, key1)

    # Try to decrypt with wrong key
    decrypted = decrypt_symmetric(encrypted, key2)

    assert decrypted is None  # Should fail


def test_encryption_error_handling():
    """Test error handling in encryption"""
    enc = MessageEncryption()

    # Try to use asymmetric without keypair
    with pytest.raises(EncryptionError):
        enc.encrypt_payload_asymmetric({}, "invalid_key")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
