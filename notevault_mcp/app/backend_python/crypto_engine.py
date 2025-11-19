"""
NoteVault MCP — Crypto Engine
Zero-Knowledge Encryption: AES-256-GCM + PBKDF2

Features:
- Master key derivation (PBKDF2-SHA256, 100k iterations)
- AES-256-GCM encryption/decryption
- Secure vault format (.nvault)
- Zero-knowledge architecture
"""

import os
import json
import base64
from typing import Dict, List, Any, Tuple
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.backends import default_backend


class CryptoEngine:
    """
    Handles all encryption/decryption operations for NoteVault.
    Zero-knowledge: master key never stored, only derived from password.
    """

    ITERATIONS = 100_000  # PBKDF2 iterations
    KEY_LENGTH = 32       # AES-256 requires 32 bytes
    SALT_LENGTH = 32      # Salt length
    NONCE_LENGTH = 12     # GCM nonce length

    def __init__(self):
        self.backend = default_backend()

    def derive_key(self, password: str, salt: bytes = None) -> Tuple[bytes, bytes]:
        """
        Derive master key from password using PBKDF2-SHA256.

        Args:
            password: User password (UTF-8)
            salt: Salt (generates new if None)

        Returns:
            (master_key, salt)
        """
        if salt is None:
            salt = os.urandom(self.SALT_LENGTH)

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=self.KEY_LENGTH,
            salt=salt,
            iterations=self.ITERATIONS,
            backend=self.backend
        )

        master_key = kdf.derive(password.encode('utf-8'))
        return master_key, salt

    def encrypt_data(self, master_key: bytes, plaintext: bytes) -> Dict[str, str]:
        """
        Encrypt data using AES-256-GCM.

        Args:
            master_key: 32-byte master key
            plaintext: Data to encrypt

        Returns:
            {nonce, ciphertext, tag} (all base64-encoded)
        """
        # Generate random nonce
        nonce = os.urandom(self.NONCE_LENGTH)

        # Encrypt with AES-GCM
        aesgcm = AESGCM(master_key)
        ciphertext = aesgcm.encrypt(nonce, plaintext, None)

        # GCM returns ciphertext + tag concatenated
        # Last 16 bytes = authentication tag
        tag = ciphertext[-16:]
        ciphertext_only = ciphertext[:-16]

        return {
            "nonce": base64.b64encode(nonce).decode('utf-8'),
            "ciphertext": base64.b64encode(ciphertext_only).decode('utf-8'),
            "tag": base64.b64encode(tag).decode('utf-8')
        }

    def decrypt_data(self, master_key: bytes, encrypted: Dict[str, str]) -> bytes:
        """
        Decrypt data using AES-256-GCM.

        Args:
            master_key: 32-byte master key
            encrypted: {nonce, ciphertext, tag}

        Returns:
            Decrypted plaintext

        Raises:
            ValueError: If decryption fails (wrong key/tampered data)
        """
        nonce = base64.b64decode(encrypted["nonce"])
        ciphertext_only = base64.b64decode(encrypted["ciphertext"])
        tag = base64.b64decode(encrypted["tag"])

        # Reconstruct full ciphertext (data + tag)
        ciphertext = ciphertext_only + tag

        # Decrypt
        aesgcm = AESGCM(master_key)
        try:
            plaintext = aesgcm.decrypt(nonce, ciphertext, None)
            return plaintext
        except Exception as e:
            raise ValueError(f"Decryption failed: invalid key or tampered data - {e}")

    def encrypt_note(self, master_key: bytes, note: Dict[str, Any]) -> Dict[str, str]:
        """
        Encrypt a single note.

        Args:
            master_key: Master key
            note: Note dictionary

        Returns:
            Encrypted note structure
        """
        # Serialize note to JSON
        plaintext = json.dumps(note, ensure_ascii=False).encode('utf-8')

        # Encrypt
        encrypted = self.encrypt_data(master_key, plaintext)

        return {
            "id": note.get("id", "unknown"),
            "encrypted": True,
            **encrypted
        }

    def decrypt_note(self, master_key: bytes, encrypted_note: Dict[str, str]) -> Dict[str, Any]:
        """
        Decrypt a single note.

        Args:
            master_key: Master key
            encrypted_note: Encrypted note structure

        Returns:
            Decrypted note dictionary
        """
        # Extract encryption data
        encrypted = {
            "nonce": encrypted_note["nonce"],
            "ciphertext": encrypted_note["ciphertext"],
            "tag": encrypted_note["tag"]
        }

        # Decrypt
        plaintext = self.decrypt_data(master_key, encrypted)

        # Parse JSON
        note = json.loads(plaintext.decode('utf-8'))
        return note

    def encrypt_vault(self, master_key: bytes, notes: List[Dict[str, Any]]) -> bytes:
        """
        Encrypt entire vault (list of notes).

        Args:
            master_key: Master key
            notes: List of notes

        Returns:
            Encrypted vault blob (JSON bytes)
        """
        # Serialize vault
        vault_data = {
            "version": "1.0",
            "notes_count": len(notes),
            "notes": notes
        }
        plaintext = json.dumps(vault_data, ensure_ascii=False).encode('utf-8')

        # Encrypt
        encrypted = self.encrypt_data(master_key, plaintext)

        # Return as JSON blob
        return json.dumps(encrypted, ensure_ascii=False).encode('utf-8')

    def decrypt_vault(self, master_key: bytes, vault_blob: bytes) -> List[Dict[str, Any]]:
        """
        Decrypt entire vault.

        Args:
            master_key: Master key
            vault_blob: Encrypted vault blob

        Returns:
            List of notes
        """
        # Parse encrypted structure
        encrypted = json.loads(vault_blob.decode('utf-8'))

        # Decrypt
        plaintext = self.decrypt_data(master_key, encrypted)

        # Parse vault data
        vault_data = json.loads(plaintext.decode('utf-8'))
        return vault_data.get("notes", [])

    def create_vault_file(
        self,
        password: str,
        notes: List[Dict[str, Any]],
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Create complete .nvault file structure.

        Args:
            password: User password
            notes: List of notes
            metadata: Optional vault metadata

        Returns:
            Complete vault file structure (ready to save as JSON)
        """
        # Derive master key
        master_key, salt = self.derive_key(password)

        # Encrypt vault
        vault_blob = self.encrypt_vault(master_key, notes)
        encrypted = json.loads(vault_blob.decode('utf-8'))

        # Build vault file
        vault_file = {
            "version": "1.0",
            "salt": base64.b64encode(salt).decode('utf-8'),
            "nonce": encrypted["nonce"],
            "ciphertext": encrypted["ciphertext"],
            "tag": encrypted["tag"],
            "metadata": metadata or {
                "notes_count": len(notes),
                "created_at": None,  # TODO: Add timestamp
                "last_sync": None
            }
        }

        return vault_file

    def open_vault_file(self, password: str, vault_file: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Open and decrypt .nvault file.

        Args:
            password: User password
            vault_file: Vault file structure

        Returns:
            List of decrypted notes

        Raises:
            ValueError: If password is wrong
        """
        # Extract salt
        salt = base64.b64decode(vault_file["salt"])

        # Derive master key
        master_key, _ = self.derive_key(password, salt)

        # Prepare encrypted data
        encrypted = {
            "nonce": vault_file["nonce"],
            "ciphertext": vault_file["ciphertext"],
            "tag": vault_file["tag"]
        }

        # Decrypt vault
        vault_blob = json.dumps(encrypted).encode('utf-8')
        notes = self.decrypt_vault(master_key, vault_blob)

        return notes

    def verify_password(self, password: str, vault_file: Dict[str, Any]) -> bool:
        """
        Verify if password is correct (without fully decrypting).

        Args:
            password: User password
            vault_file: Vault file structure

        Returns:
            True if password correct, False otherwise
        """
        try:
            self.open_vault_file(password, vault_file)
            return True
        except (ValueError, Exception):
            return False


# Utility functions
def generate_secure_password(length: int = 32) -> str:
    """Generate secure random password."""
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def hash_password_for_storage(password: str) -> str:
    """
    Hash password for storage (NOT for encryption key derivation).
    Use this only for password verification, not encryption.
    """
    import hashlib
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


if __name__ == "__main__":
    # Demo usage
    print("🔐 NoteVault Crypto Engine — Demo")
    print("=" * 50)

    crypto = CryptoEngine()

    # Test data
    password = "MySuperSecretPassword123!"
    notes = [
        {
            "id": "note-1",
            "title": "Test Note 1",
            "content": "# Hello World\n\nThis is a test note.",
            "tags": ["test", "demo"]
        },
        {
            "id": "note-2",
            "title": "Encrypted Note",
            "content": "Top secret content 🔒",
            "tags": ["secret"]
        }
    ]

    print(f"\n📝 Original notes: {len(notes)}")

    # Create encrypted vault
    print("\n🔒 Encrypting vault...")
    vault_file = crypto.create_vault_file(password, notes)
    print(f"✅ Vault encrypted (salt: {vault_file['salt'][:16]}...)")

    # Try to decrypt
    print("\n🔓 Decrypting vault...")
    decrypted_notes = crypto.open_vault_file(password, vault_file)
    print(f"✅ Vault decrypted: {len(decrypted_notes)} notes recovered")

    # Verify content
    print("\n✅ Verification:")
    for note in decrypted_notes:
        print(f"  - {note['title']}: {note['content'][:30]}...")

    # Test wrong password
    print("\n❌ Testing wrong password...")
    try:
        crypto.open_vault_file("WrongPassword", vault_file)
        print("  ERROR: Should have failed!")
    except ValueError:
        print("  ✅ Correctly rejected wrong password")

    print("\n🎉 Crypto engine working perfectly!")
