"""
Models Pydantic pour LM Studio client
Basé sur la documentation officielle: https://lmstudio.ai/docs/developer/rest/endpoints
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatMessage(BaseModel):
    """Message de chat pour LM Studio"""
    role: str = Field(..., description="Role: system, user, ou assistant")
    content: str = Field(..., description="Contenu du message")


class LMQueryRequest(BaseModel):
    """Requête pour interroger LM Studio"""
    prompt: str = Field(..., description="Prompt à envoyer au modèle")
    temperature: Optional[float] = Field(0.7, description="Température de sampling (0.0 à 1.0)")
    max_tokens: Optional[int] = Field(-1, description="Nombre max de tokens (-1 pour illimité)")
    stream: Optional[bool] = Field(False, description="Activer le streaming")
    system_prompt: Optional[str] = Field(None, description="Prompt système optionnel")
    top_p: Optional[float] = Field(0.95, description="Top-p sampling")
    ttl: Optional[int] = Field(None, description="Time-to-live en secondes")


class LMChatCompletionRequest(BaseModel):
    """
    Requête complète pour l'endpoint /api/v0/chat/completions
    Conforme à la documentation LM Studio
    """
    model: Optional[str] = Field(None, description="Identifiant du modèle (optionnel si un seul modèle est chargé)")
    messages: List[ChatMessage] = Field(..., description="Liste des messages")
    temperature: Optional[float] = Field(0.7, description="Température de sampling")
    max_tokens: Optional[int] = Field(-1, description="Nombre max de tokens")
    stream: Optional[bool] = Field(False, description="Activer le streaming")
    top_p: Optional[float] = Field(0.95, description="Top-p sampling")
    ttl: Optional[int] = Field(None, description="Idle TTL en secondes")


class LMUsageStats(BaseModel):
    """Statistiques d'utilisation de tokens"""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class LMChoice(BaseModel):
    """Choix de réponse"""
    index: int
    message: ChatMessage
    finish_reason: str


class LMModelInfo(BaseModel):
    """Informations sur le modèle"""
    arch: Optional[str] = None
    quantization: Optional[str] = None
    context_length: Optional[int] = None


class LMChatCompletionResponse(BaseModel):
    """Réponse de l'endpoint /api/v0/chat/completions"""
    id: Optional[str] = None
    object: Optional[str] = None
    created: Optional[int] = None
    model: Optional[str] = None
    choices: List[LMChoice]
    usage: Optional[LMUsageStats] = None
    model_info: Optional[LMModelInfo] = None


class LMQueryResponse(BaseModel):
    """Réponse simplifiée pour l'API MCP"""
    response: str = Field(..., description="Réponse générée par le modèle")
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    temperature: float
    timestamp: datetime = Field(default_factory=datetime.now)
    success: bool


class LMModelsListResponse(BaseModel):
    """Liste des modèles disponibles"""
    models: List[Dict[str, Any]]
    total: int


class LMStatusResponse(BaseModel):
    """Statut du serveur LM Studio"""
    available: bool
    host: str
    message: str
    models_loaded: Optional[int] = None
