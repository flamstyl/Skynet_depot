"""
PasswordVault MCP — HaveIBeenPwned Checker
Skynet Secure Vault v1.0

Vérification des mots de passe compromis via HIBP API
Utilise k-anonymity pour ne jamais envoyer le password complet
"""

import hashlib
import requests
from typing import Dict
from models import HIBPResult


class HIBPChecker:
    """
    Vérificateur de fuites de mots de passe

    Utilise l'API HaveIBeenPwned avec k-anonymity:
    - Hash SHA-1 du password localement
    - Envoie seulement les 5 premiers caractères du hash
    - Compare le reste localement
    """

    HIBP_API_URL = "https://api.pwnedpasswords.com/range/"
    PREFIX_LENGTH = 5  # Nombre de caractères du hash à envoyer

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'PasswordVault-MCP-Skynet/1.0',
            'Add-Padding': 'true'  # Protection contre timing attacks
        })

    def _hash_password(self, password: str) -> str:
        """
        Hash un mot de passe en SHA-1

        Args:
            password: Mot de passe à hasher

        Returns:
            str: Hash SHA-1 en hexadécimal (uppercase)
        """
        sha1 = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
        return sha1

    def check_password(self, password: str) -> HIBPResult:
        """
        Vérifie si un mot de passe a été compromis

        Args:
            password: Mot de passe à vérifier

        Returns:
            HIBPResult: Résultat de la vérification
        """
        try:
            # Hasher le password
            pwd_hash = self._hash_password(password)
            hash_prefix = pwd_hash[:self.PREFIX_LENGTH]
            hash_suffix = pwd_hash[self.PREFIX_LENGTH:]

            # Appeler l'API HIBP
            response = self.session.get(
                f"{self.HIBP_API_URL}{hash_prefix}",
                timeout=10
            )

            if response.status_code != 200:
                print(f"⚠️ HIBP API error: {response.status_code}")
                return HIBPResult(breached=False, count=0)

            # Parser la réponse
            # Format: SUFFIX:COUNT\r\n
            hashes = response.text.split('\r\n')

            for hash_line in hashes:
                if not hash_line:
                    continue

                parts = hash_line.split(':')
                if len(parts) != 2:
                    continue

                suffix, count_str = parts
                if suffix == hash_suffix:
                    # Trouvé dans les fuites !
                    count = int(count_str)
                    print(f"⚠️ Password found in {count} breaches!")
                    return HIBPResult(breached=True, count=count)

            # Pas trouvé dans les fuites
            print("✓ Password not found in breaches")
            return HIBPResult(breached=False, count=0)

        except requests.RequestException as e:
            print(f"✗ HIBP request failed: {str(e)}")
            return HIBPResult(breached=False, count=0)
        except Exception as e:
            print(f"✗ HIBP check failed: {str(e)}")
            return HIBPResult(breached=False, count=0)

    def check_password_hash(self, sha1_hash: str) -> HIBPResult:
        """
        Vérifie un hash SHA-1 directement (si déjà calculé côté client)

        Args:
            sha1_hash: Hash SHA-1 en hexadécimal

        Returns:
            HIBPResult: Résultat de la vérification
        """
        try:
            sha1_hash = sha1_hash.upper()
            hash_prefix = sha1_hash[:self.PREFIX_LENGTH]
            hash_suffix = sha1_hash[self.PREFIX_LENGTH:]

            response = self.session.get(
                f"{self.HIBP_API_URL}{hash_prefix}",
                timeout=10
            )

            if response.status_code != 200:
                return HIBPResult(breached=False, count=0)

            hashes = response.text.split('\r\n')

            for hash_line in hashes:
                if not hash_line:
                    continue

                parts = hash_line.split(':')
                if len(parts) != 2:
                    continue

                suffix, count_str = parts
                if suffix == hash_suffix:
                    count = int(count_str)
                    return HIBPResult(breached=True, count=count)

            return HIBPResult(breached=False, count=0)

        except Exception as e:
            print(f"✗ HIBP hash check failed: {str(e)}")
            return HIBPResult(breached=False, count=0)

    def batch_check_passwords(self, passwords: list) -> Dict[int, HIBPResult]:
        """
        Vérifie plusieurs mots de passe en batch

        Args:
            passwords: Liste de mots de passe

        Returns:
            Dict[int, HIBPResult]: Index -> Résultat
        """
        results = {}

        for i, password in enumerate(passwords):
            print(f"Checking password {i+1}/{len(passwords)}...")
            results[i] = self.check_password(password)

        return results


# Instance globale
hibp = HIBPChecker()


if __name__ == "__main__":
    # Test du HIBP checker
    print("🔍 HaveIBeenPwned Checker Test")
    print("=" * 50)

    checker = HIBPChecker()

    # Test avec un mot de passe connu compromis
    print("\n1. Test avec 'password123' (devrait être compromis):")
    result1 = checker.check_password("password123")
    print(f"   Breached: {result1.breached}")
    print(f"   Count: {result1.count}")

    # Test avec un mot de passe fort (probablement non compromis)
    print("\n2. Test avec mot de passe fort:")
    strong_pw = "Xk9$mQ2#vL8@wP5!nR7^jT4&hF3*"
    result2 = checker.check_password(strong_pw)
    print(f"   Breached: {result2.breached}")
    print(f"   Count: {result2.count}")

    # Test avec hash direct
    print("\n3. Test avec hash SHA-1 direct:")
    # Hash de "password" (connu compromis)
    pwd_hash = "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8"
    result3 = checker.check_password_hash(pwd_hash)
    print(f"   Breached: {result3.breached}")
    print(f"   Count: {result3.count}")

    print("\n🔥 HIBP checker ready!")
