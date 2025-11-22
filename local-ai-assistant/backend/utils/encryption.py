"""
Module de chiffrement pour sécuriser les données locales
Utilise Fernet (AES-256) pour chiffrer/déchiffrer les fichiers sensibles
"""

import os
import base64
from typing import Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.backends import default_backend
import json


class EncryptionService:
    """Service de chiffrement/déchiffrement des données locales"""

    def __init__(self, master_password: Optional[str] = None):
        """
        Initialise le service de chiffrement

        Args:
            master_password: Mot de passe maître pour dériver la clé de chiffrement
                           Si None, utilise une variable d'environnement ou génère une clé
        """
        self.master_password = master_password or os.getenv("MASTER_PASSWORD")
        self.salt = self._get_or_create_salt()
        self.cipher = self._initialize_cipher()

    def _get_or_create_salt(self) -> bytes:
        """Récupère ou crée le salt pour la dérivation de clé"""
        salt_file = "data/.salt"

        if os.path.exists(salt_file):
            with open(salt_file, "rb") as f:
                return f.read()
        else:
            # Créer un nouveau salt
            salt = os.urandom(16)
            os.makedirs("data", exist_ok=True)
            with open(salt_file, "wb") as f:
                f.write(salt)
            return salt

    def _initialize_cipher(self) -> Fernet:
        """Initialise le cipher Fernet avec la clé dérivée du mot de passe"""
        if self.master_password:
            # Dériver une clé à partir du mot de passe maître
            kdf = PBKDF2(
                algorithm=hashes.SHA256(),
                length=32,
                salt=self.salt,
                iterations=100000,
                backend=default_backend()
            )
            key = base64.urlsafe_b64encode(kdf.derive(self.master_password.encode()))
        else:
            # Générer une clé aléatoire (moins sécurisé mais fonctionnel)
            key_file = "data/.key"
            if os.path.exists(key_file):
                with open(key_file, "rb") as f:
                    key = f.read()
            else:
                key = Fernet.generate_key()
                os.makedirs("data", exist_ok=True)
                with open(key_file, "wb") as f:
                    f.write(key)

        return Fernet(key)

    def encrypt_string(self, plaintext: str) -> str:
        """
        Chiffre une chaîne de caractères

        Args:
            plaintext: Texte en clair

        Returns:
            Texte chiffré (base64)
        """
        encrypted = self.cipher.encrypt(plaintext.encode())
        return base64.urlsafe_b64encode(encrypted).decode()

    def decrypt_string(self, ciphertext: str) -> str:
        """
        Déchiffre une chaîne de caractères

        Args:
            ciphertext: Texte chiffré (base64)

        Returns:
            Texte en clair
        """
        encrypted = base64.urlsafe_b64decode(ciphertext.encode())
        decrypted = self.cipher.decrypt(encrypted)
        return decrypted.decode()

    def encrypt_dict(self, data: dict) -> str:
        """
        Chiffre un dictionnaire (converti en JSON)

        Args:
            data: Dictionnaire à chiffrer

        Returns:
            Données chiffrées (base64)
        """
        json_str = json.dumps(data, ensure_ascii=False)
        return self.encrypt_string(json_str)

    def decrypt_dict(self, ciphertext: str) -> dict:
        """
        Déchiffre un dictionnaire

        Args:
            ciphertext: Données chiffrées (base64)

        Returns:
            Dictionnaire déchiffré
        """
        json_str = self.decrypt_string(ciphertext)
        return json.loads(json_str)

    def encrypt_file(self, input_path: str, output_path: Optional[str] = None) -> str:
        """
        Chiffre un fichier

        Args:
            input_path: Chemin du fichier à chiffrer
            output_path: Chemin du fichier chiffré (par défaut: input_path + '.enc')

        Returns:
            Chemin du fichier chiffré
        """
        if output_path is None:
            output_path = input_path + ".enc"

        with open(input_path, "rb") as f:
            plaintext = f.read()

        encrypted = self.cipher.encrypt(plaintext)

        with open(output_path, "wb") as f:
            f.write(encrypted)

        return output_path

    def decrypt_file(self, input_path: str, output_path: Optional[str] = None) -> str:
        """
        Déchiffre un fichier

        Args:
            input_path: Chemin du fichier chiffré
            output_path: Chemin du fichier déchiffré

        Returns:
            Chemin du fichier déchiffré
        """
        if output_path is None:
            # Retirer l'extension .enc si présente
            if input_path.endswith(".enc"):
                output_path = input_path[:-4]
            else:
                output_path = input_path + ".dec"

        with open(input_path, "rb") as f:
            encrypted = f.read()

        decrypted = self.cipher.decrypt(encrypted)

        with open(output_path, "wb") as f:
            f.write(decrypted)

        return output_path


# Instance globale du service (sera initialisée au démarrage)
encryption_service: Optional[EncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """Récupère l'instance du service de chiffrement"""
    global encryption_service
    if encryption_service is None:
        encryption_service = EncryptionService()
    return encryption_service
