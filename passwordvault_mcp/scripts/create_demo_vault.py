#!/usr/bin/env python3
"""
PasswordVault MCP — Demo Vault Creator
Skynet Secure Vault v1.0

Crée un vault de démonstration avec des entrées exemples
"""

import sys
import os

# Ajouter le backend_python au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'app', 'backend_python'))

from storage_manager import StorageManager
from models import VaultEntry


def create_demo_vault():
    """
    Crée un vault de démonstration avec des entrées exemples
    """
    print("🔐 PasswordVault Demo Vault Creator")
    print("=" * 50)

    # Chemin vers le vault de démonstration
    vault_path = os.path.join(
        os.path.dirname(__file__),
        '..',
        'data',
        'vault_demo.vault'
    )

    # Master password de démonstration
    master_password = "DemoPassword123!"
    print(f"\n📝 Master Password: {master_password}")
    print("⚠️  WARNING: This is a demo vault. Never use this password in production!")

    # Créer le storage manager
    storage = StorageManager(vault_path)

    # Créer le vault
    print(f"\n📦 Creating vault at: {vault_path}")
    storage.create_vault(master_password)

    # Entrées de démonstration
    demo_entries = [
        VaultEntry(
            website="github.com",
            username="developer@example.com",
            password="MySecureGithubPassword123!",
            notes="Personal GitHub account",
            category="dev",
            tags=["work", "code", "github"]
        ),
        VaultEntry(
            website="gmail.com",
            username="user@gmail.com",
            password="EmailPassword456!",
            notes="Primary email account",
            category="email",
            tags=["email", "personal"]
        ),
        VaultEntry(
            website="amazon.com",
            username="shopper@example.com",
            password="ShoppingPassword789!",
            notes="Amazon shopping account",
            category="shopping",
            tags=["shopping", "online"]
        ),
        VaultEntry(
            website="linkedin.com",
            username="professional@example.com",
            password="LinkedInSecure2023!",
            notes="Professional networking",
            category="social",
            tags=["work", "networking", "social"]
        ),
        VaultEntry(
            website="banking.example.com",
            username="account12345",
            password="BankSecure!987Strong",
            notes="Online banking account - HIGH SECURITY",
            category="finance",
            tags=["bank", "finance", "critical"]
        ),
    ]

    # Ajouter les entrées
    print("\n📝 Adding demo entries...")
    for entry in demo_entries:
        storage.add_entry(entry)
        print(f"  ✓ Added: {entry.website} ({entry.username})")

    print(f"\n✅ Demo vault created successfully!")
    print(f"   Path: {vault_path}")
    print(f"   Entries: {len(demo_entries)}")
    print(f"\n🔑 To unlock this vault, use:")
    print(f"   Master Password: {master_password}")
    print("\n⚠️  Remember: This is for DEMO purposes only!")


def show_vault_info():
    """
    Affiche les informations du vault de démonstration
    """
    vault_path = os.path.join(
        os.path.dirname(__file__),
        '..',
        'data',
        'vault_demo.vault'
    )

    if not os.path.exists(vault_path):
        print("❌ Demo vault not found. Run this script to create it first.")
        return

    print("\n📊 Demo Vault Information")
    print("=" * 50)

    storage = StorageManager(vault_path)

    # Déverrouiller
    master_password = "DemoPassword123!"
    success = storage.unlock_vault(master_password)

    if success:
        entries = storage.get_entries()

        print(f"\n✅ Vault unlocked successfully!")
        print(f"   Total entries: {len(entries)}")
        print("\n📋 Entries:")

        for i, entry in enumerate(entries, 1):
            print(f"\n{i}. {entry.website}")
            print(f"   Username: {entry.username}")
            print(f"   Category: {entry.category}")
            print(f"   Tags: {', '.join(entry.tags)}")
            print(f"   Created: {entry.created_at}")

        storage.lock_vault()
    else:
        print("❌ Failed to unlock vault")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Demo Vault Creator")
    parser.add_argument('--info', action='store_true', help='Show vault info')
    args = parser.parse_args()

    if args.info:
        show_vault_info()
    else:
        create_demo_vault()

    print("\n🔥 Done!\n")
