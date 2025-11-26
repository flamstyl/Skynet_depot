"""
PasswordVault MCP — Data Models
Skynet Secure Vault v1.0

Modèles de données pour les entrées du vault
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional, List
import uuid


@dataclass
class VaultEntry:
    """
    Représente une entrée dans le vault

    Attributes:
        id: UUID unique de l'entrée
        website: URL ou nom du service
        username: Nom d'utilisateur / email
        password: Mot de passe (stocké chiffré)
        notes: Notes additionnelles
        category: Catégorie (web, app, finance, etc.)
        tags: Tags pour organisation
        created_at: Date de création
        updated_at: Date de dernière modification
        last_used: Date de dernière utilisation
    """
    website: str
    username: str
    password: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    notes: str = ""
    category: str = "web"
    tags: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    last_used: Optional[str] = None

    def to_dict(self) -> dict:
        """Convertit en dictionnaire"""
        return asdict(self)

    @staticmethod
    def from_dict(data: dict) -> 'VaultEntry':
        """Crée une instance depuis un dictionnaire"""
        return VaultEntry(**data)

    def update_timestamp(self):
        """Met à jour le timestamp de modification"""
        self.updated_at = datetime.utcnow().isoformat()

    def mark_used(self):
        """Marque l'entrée comme utilisée"""
        self.last_used = datetime.utcnow().isoformat()


@dataclass
class VaultMetadata:
    """
    Métadonnées du vault

    Attributes:
        version: Version du format vault
        created_at: Date de création du vault
        last_modified: Date de dernière modification
        entry_count: Nombre d'entrées
        salt: Salt pour dérivation clé (base64)
    """
    version: str = "1.0"
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    last_modified: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    entry_count: int = 0
    salt: str = ""

    def to_dict(self) -> dict:
        """Convertit en dictionnaire"""
        return asdict(self)

    @staticmethod
    def from_dict(data: dict) -> 'VaultMetadata':
        """Crée une instance depuis un dictionnaire"""
        return VaultMetadata(**data)

    def update(self, entry_count: int):
        """Met à jour les métadonnées"""
        self.last_modified = datetime.utcnow().isoformat()
        self.entry_count = entry_count


@dataclass
class EncryptedEntry:
    """
    Représente une entrée chiffrée dans le fichier vault

    Attributes:
        id: UUID de l'entrée
        encrypted_data: Données chiffrées (base64)
        iv: IV utilisé pour le chiffrement (base64)
        created_at: Date de création
        updated_at: Date de modification
    """
    id: str
    encrypted_data: str
    iv: str
    created_at: str
    updated_at: str

    def to_dict(self) -> dict:
        """Convertit en dictionnaire"""
        return asdict(self)

    @staticmethod
    def from_dict(data: dict) -> 'EncryptedEntry':
        """Crée une instance depuis un dictionnaire"""
        return EncryptedEntry(**data)


@dataclass
class HIBPResult:
    """
    Résultat d'une vérification HaveIBeenPwned

    Attributes:
        breached: Si le mot de passe a fuité
        count: Nombre de fois trouvé dans les fuites
        checked_at: Date de vérification
    """
    breached: bool
    count: int = 0
    checked_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class SecurityAuditResult:
    """
    Résultat d'un audit de sécurité

    Attributes:
        entry_id: ID de l'entrée auditée
        score: Score de sécurité (0-100)
        weaknesses: Liste des faiblesses détectées
        recommendations: Recommandations d'amélioration
        hibp_result: Résultat HIBP
        audited_at: Date de l'audit
    """
    entry_id: str
    score: int
    weaknesses: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    hibp_result: Optional[HIBPResult] = None
    audited_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> dict:
        result = asdict(self)
        if self.hibp_result:
            result['hibp_result'] = self.hibp_result.to_dict()
        return result
