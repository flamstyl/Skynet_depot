"""
PasswordVault MCP — Storage Manager
Skynet Secure Vault v1.0

Gestion du fichier vault chiffré local
"""

import json
import os
from typing import List, Optional, Dict
from datetime import datetime
from pathlib import Path

from crypto_engine import crypto, encode_base64, decode_base64
from models import VaultEntry, VaultMetadata, EncryptedEntry


class StorageManager:
    """
    Gestionnaire de stockage pour le vault

    Responsabilités:
    - Chargement/sauvegarde du fichier .vault
    - Chiffrement/déchiffrement des entrées
    - Gestion CRUD des entrées
    """

    def __init__(self, vault_path: str = None):
        """
        Initialise le gestionnaire de stockage

        Args:
            vault_path: Chemin vers le fichier vault
        """
        if vault_path is None:
            # Chemin par défaut
            base_dir = Path(__file__).parent.parent.parent
            vault_path = base_dir / "data" / "vault_local.vault"

        self.vault_path = Path(vault_path)
        self.vault_path.parent.mkdir(parents=True, exist_ok=True)

        self.metadata: Optional[VaultMetadata] = None
        self.entries: List[VaultEntry] = []
        self.is_unlocked = False
        self.master_key: Optional[bytes] = None

    def vault_exists(self) -> bool:
        """Vérifie si le fichier vault existe"""
        return self.vault_path.exists()

    def create_vault(self, master_password: str) -> None:
        """
        Crée un nouveau vault

        Args:
            master_password: Mot de passe maître
        """
        # Générer salt unique
        salt = crypto.generate_salt()
        salt_b64 = encode_base64(salt)

        # Créer métadonnées
        self.metadata = VaultMetadata(salt=salt_b64)

        # Dériver clé
        self.master_key = crypto.derive_key(master_password, salt)

        # Initialiser entries vides
        self.entries = []

        # Sauvegarder
        self._save_vault()
        self.is_unlocked = True

        print(f"✓ Vault créé: {self.vault_path}")

    def unlock_vault(self, master_password: str) -> bool:
        """
        Déverrouille le vault avec le master password

        Args:
            master_password: Mot de passe maître

        Returns:
            bool: True si déverrouillage réussi
        """
        if not self.vault_exists():
            raise FileNotFoundError("Vault file not found")

        try:
            # Charger le fichier
            with open(self.vault_path, 'r', encoding='utf-8') as f:
                vault_data = json.load(f)

            # Charger métadonnées
            self.metadata = VaultMetadata.from_dict(vault_data['metadata'])

            # Dériver clé
            salt = decode_base64(self.metadata.salt)
            self.master_key = crypto.derive_key(master_password, salt)

            # Déchiffrer toutes les entrées
            self.entries = []
            for enc_entry_data in vault_data.get('entries', []):
                enc_entry = EncryptedEntry.from_dict(enc_entry_data)

                # Déchiffrer
                encrypted_data = decode_base64(enc_entry.encrypted_data)
                iv = decode_base64(enc_entry.iv)

                decrypted_data = crypto.decrypt_entry(
                    self.master_key,
                    encrypted_data,
                    iv
                )

                # Créer VaultEntry
                entry = VaultEntry.from_dict(decrypted_data)
                self.entries.append(entry)

            self.is_unlocked = True
            print(f"✓ Vault déverrouillé: {len(self.entries)} entrées")
            return True

        except Exception as e:
            print(f"✗ Échec déverrouillage: {str(e)}")
            self.is_unlocked = False
            return False

    def lock_vault(self) -> None:
        """Verrouille le vault (efface les données en mémoire)"""
        self.entries = []
        self.master_key = None
        self.is_unlocked = False
        print("✓ Vault verrouillé")

    def _save_vault(self) -> None:
        """Sauvegarde le vault sur disque (format chiffré)"""
        if not self.is_unlocked:
            raise Exception("Vault must be unlocked to save")

        # Chiffrer toutes les entrées
        encrypted_entries = []
        for entry in self.entries:
            encrypted_data, iv = crypto.encrypt_entry(
                self.master_key,
                entry.to_dict()
            )

            enc_entry = EncryptedEntry(
                id=entry.id,
                encrypted_data=encode_base64(encrypted_data),
                iv=encode_base64(iv),
                created_at=entry.created_at,
                updated_at=entry.updated_at
            )
            encrypted_entries.append(enc_entry.to_dict())

        # Mettre à jour métadonnées
        self.metadata.update(len(self.entries))

        # Créer structure vault
        vault_data = {
            'metadata': self.metadata.to_dict(),
            'entries': encrypted_entries
        }

        # Sauvegarder
        with open(self.vault_path, 'w', encoding='utf-8') as f:
            json.dump(vault_data, f, indent=2)

        print(f"✓ Vault sauvegardé: {len(self.entries)} entrées")

    def get_entries(self) -> List[VaultEntry]:
        """
        Retourne toutes les entrées

        Returns:
            List[VaultEntry]: Liste des entrées
        """
        if not self.is_unlocked:
            raise Exception("Vault is locked")

        return self.entries

    def get_entry(self, entry_id: str) -> Optional[VaultEntry]:
        """
        Récupère une entrée par ID

        Args:
            entry_id: UUID de l'entrée

        Returns:
            VaultEntry ou None
        """
        if not self.is_unlocked:
            raise Exception("Vault is locked")

        for entry in self.entries:
            if entry.id == entry_id:
                return entry
        return None

    def add_entry(self, entry: VaultEntry) -> str:
        """
        Ajoute une nouvelle entrée

        Args:
            entry: Entrée à ajouter

        Returns:
            str: ID de l'entrée créée
        """
        if not self.is_unlocked:
            raise Exception("Vault is locked")

        self.entries.append(entry)
        self._save_vault()

        print(f"✓ Entrée ajoutée: {entry.website}")
        return entry.id

    def update_entry(self, entry_id: str, updated_entry: VaultEntry) -> bool:
        """
        Met à jour une entrée existante

        Args:
            entry_id: ID de l'entrée à modifier
            updated_entry: Nouvelles données

        Returns:
            bool: True si mise à jour réussie
        """
        if not self.is_unlocked:
            raise Exception("Vault is locked")

        for i, entry in enumerate(self.entries):
            if entry.id == entry_id:
                # Conserver l'ID et created_at
                updated_entry.id = entry.id
                updated_entry.created_at = entry.created_at
                updated_entry.update_timestamp()

                self.entries[i] = updated_entry
                self._save_vault()

                print(f"✓ Entrée mise à jour: {updated_entry.website}")
                return True

        return False

    def delete_entry(self, entry_id: str) -> bool:
        """
        Supprime une entrée

        Args:
            entry_id: ID de l'entrée à supprimer

        Returns:
            bool: True si suppression réussie
        """
        if not self.is_unlocked:
            raise Exception("Vault is locked")

        for i, entry in enumerate(self.entries):
            if entry.id == entry_id:
                deleted = self.entries.pop(i)
                self._save_vault()

                print(f"✓ Entrée supprimée: {deleted.website}")
                return True

        return False

    def search_entries(self, query: str) -> List[VaultEntry]:
        """
        Recherche des entrées

        Args:
            query: Terme de recherche

        Returns:
            List[VaultEntry]: Entrées correspondantes
        """
        if not self.is_unlocked:
            raise Exception("Vault is locked")

        query_lower = query.lower()
        results = []

        for entry in self.entries:
            if (query_lower in entry.website.lower() or
                query_lower in entry.username.lower() or
                query_lower in entry.notes.lower() or
                any(query_lower in tag.lower() for tag in entry.tags)):
                results.append(entry)

        return results

    def get_vault_for_sync(self) -> Dict:
        """
        Retourne le vault complet chiffré pour synchronisation

        Returns:
            Dict: Vault complet chiffré
        """
        if not self.is_unlocked:
            raise Exception("Vault is locked")

        # Lire le fichier vault tel quel (déjà chiffré)
        with open(self.vault_path, 'r', encoding='utf-8') as f:
            vault_data = json.load(f)

        return vault_data


# Instance globale
storage = StorageManager()


if __name__ == "__main__":
    # Test du storage manager
    print("📦 PasswordVault Storage Manager Test")
    print("=" * 50)

    import tempfile
    import shutil

    # Créer répertoire temporaire
    test_dir = tempfile.mkdtemp()
    test_vault = os.path.join(test_dir, "test.vault")

    try:
        # Créer storage manager
        sm = StorageManager(test_vault)

        # Créer vault
        master_pw = "TestMasterPassword123!"
        sm.create_vault(master_pw)

        # Ajouter des entrées
        entry1 = VaultEntry(
            website="github.com",
            username="skynet@example.com",
            password="MySecretPassword123!",
            notes="Dev account",
            category="dev",
            tags=["work", "code"]
        )
        sm.add_entry(entry1)

        entry2 = VaultEntry(
            website="gmail.com",
            username="user@gmail.com",
            password="AnotherPassword456!",
            category="email"
        )
        sm.add_entry(entry2)

        # Verrouiller
        sm.lock_vault()
        print("\n✓ Vault verrouillé")

        # Déverrouiller
        success = sm.unlock_vault(master_pw)
        assert success, "Failed to unlock"
        print("✓ Vault déverrouillé")

        # Lister entrées
        entries = sm.get_entries()
        print(f"✓ {len(entries)} entrées trouvées")

        # Rechercher
        results = sm.search_entries("github")
        print(f"✓ Recherche 'github': {len(results)} résultat(s)")

        # Supprimer
        sm.delete_entry(entry2.id)
        print("✓ Entrée supprimée")

        # Vérifier
        entries = sm.get_entries()
        assert len(entries) == 1, "Should have 1 entry left"

        print("\n🔥 All tests passed! Storage manager ready.")

    finally:
        # Nettoyer
        shutil.rmtree(test_dir)
        print(f"\n✓ Test directory cleaned: {test_dir}")
