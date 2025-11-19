"""
PasswordVault MCP — Crypto Engine
Skynet Secure Vault v1.0

Chiffrement AES-256-GCM avec dérivation PBKDF2-HMAC-SHA256
Zero-knowledge, local-first encryption
"""

import os
import base64
import json
from typing import Dict, Tuple
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.backends import default_backend


# Constants
PBKDF2_ITERATIONS = 600_000  # OWASP 2023 recommendation
SALT_SIZE = 32  # 256 bits
KEY_SIZE = 32  # 256 bits for AES-256
IV_SIZE = 12  # 96 bits (recommended for GCM)


class CryptoEngine:
    """
    Moteur cryptographique pour PasswordVault

    Fonctionnalités:
    - Dérivation de clé sécurisée (PBKDF2)
    - Chiffrement AES-256-GCM
    - Déchiffrement avec vérification d'intégrité
    """

    def __init__(self):
        self.backend = default_backend()

    def generate_salt(self) -> bytes:
        """
        Génère un salt aléatoire cryptographiquement sécurisé

        Returns:
            bytes: Salt de 32 bytes
        """
        return os.urandom(SALT_SIZE)

    def generate_iv(self) -> bytes:
        """
        Génère un IV aléatoire pour AES-GCM

        Returns:
            bytes: IV de 12 bytes
        """
        return os.urandom(IV_SIZE)

    def derive_key(self, master_password: str, salt: bytes) -> bytes:
        """
        Dérive une clé de chiffrement depuis le master password

        Utilise PBKDF2-HMAC-SHA256 avec 600k itérations

        Args:
            master_password: Le mot de passe maître
            salt: Salt unique pour ce vault

        Returns:
            bytes: Clé dérivée de 32 bytes
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=KEY_SIZE,
            salt=salt,
            iterations=PBKDF2_ITERATIONS,
            backend=self.backend
        )

        key = kdf.derive(master_password.encode('utf-8'))
        return key

    def encrypt_entry(self, key: bytes, data: Dict) -> Tuple[bytes, bytes]:
        """
        Chiffre une entrée du vault

        Args:
            key: Clé de chiffrement (32 bytes)
            data: Dictionnaire contenant les données à chiffrer

        Returns:
            Tuple[bytes, bytes]: (encrypted_data, iv)
        """
        # Sérialiser les données en JSON
        plaintext = json.dumps(data).encode('utf-8')

        # Générer IV unique
        iv = self.generate_iv()

        # Chiffrer avec AES-256-GCM
        aesgcm = AESGCM(key)
        ciphertext = aesgcm.encrypt(iv, plaintext, None)

        return ciphertext, iv

    def decrypt_entry(self, key: bytes, encrypted_data: bytes, iv: bytes) -> Dict:
        """
        Déchiffre une entrée du vault

        Args:
            key: Clé de chiffrement (32 bytes)
            encrypted_data: Données chiffrées
            iv: IV utilisé lors du chiffrement

        Returns:
            Dict: Données déchiffrées

        Raises:
            Exception: Si le déchiffrement échoue (mauvaise clé ou données corrompues)
        """
        try:
            aesgcm = AESGCM(key)
            plaintext = aesgcm.decrypt(iv, encrypted_data, None)

            # Désérialiser JSON
            data = json.loads(plaintext.decode('utf-8'))
            return data

        except Exception as e:
            raise Exception(f"Decryption failed: {str(e)}")

    def encrypt_vault(self, key: bytes, vault_data: Dict) -> Tuple[bytes, bytes]:
        """
        Chiffre l'intégralité du vault pour synchronisation

        Args:
            key: Clé de chiffrement
            vault_data: Dictionnaire complet du vault

        Returns:
            Tuple[bytes, bytes]: (encrypted_vault, iv)
        """
        return self.encrypt_entry(key, vault_data)

    def decrypt_vault(self, key: bytes, encrypted_vault: bytes, iv: bytes) -> Dict:
        """
        Déchiffre un vault complet

        Args:
            key: Clé de chiffrement
            encrypted_vault: Vault chiffré
            iv: IV utilisé

        Returns:
            Dict: Vault déchiffré
        """
        return self.decrypt_entry(key, encrypted_vault, iv)

    def verify_master_password(self, master_password: str, salt: bytes,
                               test_encrypted: bytes, test_iv: bytes) -> bool:
        """
        Vérifie si un master password est correct

        Args:
            master_password: Password à tester
            salt: Salt du vault
            test_encrypted: Données de test chiffrées
            test_iv: IV de test

        Returns:
            bool: True si le password est correct
        """
        try:
            key = self.derive_key(master_password, salt)
            self.decrypt_entry(key, test_encrypted, test_iv)
            return True
        except:
            return False


# Helpers pour encoding/decoding base64
def encode_base64(data: bytes) -> str:
    """Encode bytes en base64 string"""
    return base64.b64encode(data).decode('utf-8')


def decode_base64(data: str) -> bytes:
    """Decode base64 string en bytes"""
    return base64.b64decode(data.encode('utf-8'))


# Instance globale
crypto = CryptoEngine()


if __name__ == "__main__":
    # Test du moteur crypto
    print("🔐 PasswordVault Crypto Engine Test")
    print("=" * 50)

    # Générer salt
    salt = crypto.generate_salt()
    print(f"✓ Salt généré: {encode_base64(salt)[:32]}...")

    # Dériver clé
    master_pw = "SuperSecretMasterPassword123!"
    key = crypto.derive_key(master_pw, salt)
    print(f"✓ Clé dérivée: {encode_base64(key)[:32]}...")

    # Test chiffrement
    test_data = {
        "website": "github.com",
        "username": "skynet@example.com",
        "password": "MySecretPassword123!",
        "notes": "Dev account"
    }

    encrypted, iv = crypto.encrypt_entry(key, test_data)
    print(f"✓ Données chiffrées: {encode_base64(encrypted)[:32]}...")

    # Test déchiffrement
    decrypted = crypto.decrypt_entry(key, encrypted, iv)
    print(f"✓ Données déchiffrées: {decrypted['website']}")

    # Vérification intégrité
    assert decrypted == test_data, "Decryption mismatch!"
    print("✓ Vérification intégrité OK")

    # Test mauvais password
    wrong_key = crypto.derive_key("WrongPassword", salt)
    try:
        crypto.decrypt_entry(wrong_key, encrypted, iv)
        print("✗ ERREUR: Mauvais password accepté!")
    except:
        print("✓ Mauvais password rejeté")

    print("\n🔥 All tests passed! Crypto engine ready.")
