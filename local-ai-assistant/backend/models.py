"""
Modèles Pydantic pour l'API
Définit les schémas de données pour les requêtes et réponses
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class ModelProvider(str, Enum):
    """Fournisseurs de modèles IA supportés"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    LOCAL = "local"
    CUSTOM = "custom"


class MessageRole(str, Enum):
    """Rôles possibles pour les messages"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(BaseModel):
    """Modèle pour un message de conversation"""
    role: MessageRole
    content: str
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)
    metadata: Optional[Dict[str, Any]] = None


class ChatRequest(BaseModel):
    """Requête pour envoyer un message au chat"""
    message: str = Field(..., min_length=1, description="Message de l'utilisateur")
    session_id: str = Field(..., description="ID de la session de conversation")
    context: Optional[List[Message]] = Field(default=None, description="Contexte additionnel")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=2000, gt=0)
    stream: Optional[bool] = Field(default=False, description="Activer le streaming")


class ChatResponse(BaseModel):
    """Réponse du chat"""
    message: str
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.now)
    tokens_used: Optional[int] = None
    model_used: Optional[str] = None


class SummaryRequest(BaseModel):
    """Requête pour résumer un contenu"""
    text: Optional[str] = Field(None, description="Texte à résumer")
    url: Optional[str] = Field(None, description="URL de la page à résumer")
    session_id: str = Field(..., description="ID de la session")
    max_length: Optional[int] = Field(default=500, description="Longueur max du résumé en mots")
    language: Optional[str] = Field(default="fr", description="Langue du résumé")


class SummaryResponse(BaseModel):
    """Réponse contenant le résumé"""
    summary: str
    session_id: str
    original_length: int
    summary_length: int
    timestamp: datetime = Field(default_factory=datetime.now)


class TranslateRequest(BaseModel):
    """Requête pour traduire un texte"""
    text: str = Field(..., min_length=1, description="Texte à traduire")
    target_language: str = Field(..., description="Langue cible (code ISO)")
    source_language: Optional[str] = Field(None, description="Langue source (auto-détection si None)")
    session_id: str


class TranslateResponse(BaseModel):
    """Réponse contenant la traduction"""
    translated_text: str
    source_language: str
    target_language: str
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.now)


class GenerateRequest(BaseModel):
    """Requête pour générer du contenu selon un template"""
    template_id: Optional[str] = Field(None, description="ID du template à utiliser")
    custom_prompt: Optional[str] = Field(None, description="Prompt personnalisé")
    context: Dict[str, Any] = Field(default_factory=dict, description="Variables de contexte")
    session_id: str
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)


class GenerateResponse(BaseModel):
    """Réponse contenant le contenu généré"""
    generated_content: str
    template_used: Optional[str] = None
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.now)


class ConfigRequest(BaseModel):
    """Requête pour mettre à jour la configuration"""
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    default_model: Optional[str] = None
    default_provider: Optional[ModelProvider] = None
    enable_web_search: Optional[bool] = None
    enable_history_logging: Optional[bool] = None
    encryption_enabled: Optional[bool] = None
    custom_model_url: Optional[str] = None


class ConfigResponse(BaseModel):
    """Réponse contenant la configuration (sans les clés API sensibles)"""
    default_model: str
    default_provider: ModelProvider
    enable_web_search: bool
    enable_history_logging: bool
    encryption_enabled: bool
    has_openai_key: bool
    has_anthropic_key: bool
    custom_model_url: Optional[str] = None


class SessionInfo(BaseModel):
    """Informations sur une session de conversation"""
    session_id: str
    created_at: datetime
    last_activity: datetime
    message_count: int
    title: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class HistoryResponse(BaseModel):
    """Réponse contenant l'historique"""
    sessions: List[SessionInfo]
    total_count: int


class SessionDetailResponse(BaseModel):
    """Détails complets d'une session"""
    session_id: str
    created_at: datetime
    last_activity: datetime
    messages: List[Message]
    metadata: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Réponse d'erreur standardisée"""
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class HealthResponse(BaseModel):
    """Réponse du healthcheck"""
    status: str
    version: str
    timestamp: datetime = Field(default_factory=datetime.now)
    backend_active: bool
    models_available: List[str]
