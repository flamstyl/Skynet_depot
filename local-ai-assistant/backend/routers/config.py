"""
Router pour la configuration de l'assistant
Gère les clés API, préférences et paramètres
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
import json
import os
from pathlib import Path

from models import ConfigRequest, ConfigResponse, HistoryResponse, ModelProvider
from services.llm_service import get_llm_service, update_llm_service
from services.memory_service import get_memory_service
from utils.encryption import get_encryption_service

router = APIRouter(prefix="/api", tags=["config"])

CONFIG_FILE = "data/config.json"


def load_config() -> dict:
    """Charge la configuration depuis le fichier"""
    if os.path.exists(CONFIG_FILE):
        encryption_service = get_encryption_service()
        try:
            with open(CONFIG_FILE, "r") as f:
                encrypted_data = f.read()
            decrypted_data = encryption_service.decrypt_string(encrypted_data)
            return json.loads(decrypted_data)
        except:
            # Si le déchiffrement échoue, le fichier n'est peut-être pas chiffré
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
    return {}


def save_config(config: dict):
    """Sauvegarde la configuration dans le fichier (chiffrée)"""
    Path(CONFIG_FILE).parent.mkdir(parents=True, exist_ok=True)

    encryption_service = get_encryption_service()
    json_data = json.dumps(config, indent=2)
    encrypted_data = encryption_service.encrypt_string(json_data)

    with open(CONFIG_FILE, "w") as f:
        f.write(encrypted_data)


@router.get("/config", response_model=ConfigResponse)
async def get_config():
    """
    Récupère la configuration actuelle (sans exposer les clés API complètes)
    """
    try:
        config = load_config()

        return ConfigResponse(
            default_model=config.get("default_model", "gpt-4-turbo-preview"),
            default_provider=ModelProvider(config.get("default_provider", "openai")),
            enable_web_search=config.get("enable_web_search", False),
            enable_history_logging=config.get("enable_history_logging", True),
            encryption_enabled=config.get("encryption_enabled", True),
            has_openai_key=bool(config.get("openai_api_key")),
            has_anthropic_key=bool(config.get("anthropic_api_key")),
            custom_model_url=config.get("custom_model_url")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de la config: {str(e)}")


@router.post("/config", response_model=ConfigResponse)
async def update_config(request: ConfigRequest):
    """
    Met à jour la configuration
    """
    try:
        # Charger la config actuelle
        config = load_config()

        # Mettre à jour les champs fournis
        if request.openai_api_key is not None:
            config["openai_api_key"] = request.openai_api_key

        if request.anthropic_api_key is not None:
            config["anthropic_api_key"] = request.anthropic_api_key

        if request.default_model is not None:
            config["default_model"] = request.default_model

        if request.default_provider is not None:
            config["default_provider"] = request.default_provider.value

        if request.enable_web_search is not None:
            config["enable_web_search"] = request.enable_web_search

        if request.enable_history_logging is not None:
            config["enable_history_logging"] = request.enable_history_logging

        if request.encryption_enabled is not None:
            config["encryption_enabled"] = request.encryption_enabled

        if request.custom_model_url is not None:
            config["custom_model_url"] = request.custom_model_url

        # Sauvegarder la config
        save_config(config)

        # Mettre à jour le service LLM si nécessaire
        if any([
            request.default_provider,
            request.openai_api_key,
            request.anthropic_api_key,
            request.default_model,
            request.custom_model_url
        ]):
            update_llm_service(
                provider=ModelProvider(config["default_provider"]) if "default_provider" in config else None,
                api_key=config.get("openai_api_key") if config.get("default_provider") == "openai" else config.get("anthropic_api_key"),
                model=config.get("default_model"),
                custom_url=config.get("custom_model_url")
            )

        # Retourner la nouvelle config
        return ConfigResponse(
            default_model=config.get("default_model", "gpt-4-turbo-preview"),
            default_provider=ModelProvider(config.get("default_provider", "openai")),
            enable_web_search=config.get("enable_web_search", False),
            enable_history_logging=config.get("enable_history_logging", True),
            encryption_enabled=config.get("encryption_enabled", True),
            has_openai_key=bool(config.get("openai_api_key")),
            has_anthropic_key=bool(config.get("anthropic_api_key")),
            custom_model_url=config.get("custom_model_url")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour de la config: {str(e)}")


@router.get("/history", response_model=HistoryResponse)
async def get_history(limit: Optional[int] = 50, offset: int = 0):
    """
    Récupère l'historique des sessions
    """
    try:
        memory_service = get_memory_service()

        sessions = await memory_service.list_sessions(limit=limit, offset=offset)

        return HistoryResponse(
            sessions=sessions,
            total_count=len(sessions)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de l'historique: {str(e)}")


@router.get("/health")
async def health_check():
    """
    Vérifie l'état de santé du backend
    """
    try:
        llm_service = get_llm_service()
        config = load_config()

        models_available = []
        if config.get("openai_api_key"):
            models_available.append("OpenAI (GPT)")
        if config.get("anthropic_api_key"):
            models_available.append("Anthropic (Claude)")
        if config.get("custom_model_url"):
            models_available.append("Custom Model")

        return {
            "status": "healthy",
            "version": "1.0.0",
            "backend_active": True,
            "models_available": models_available,
            "current_provider": llm_service.provider.value,
            "current_model": llm_service.model
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "backend_active": False
        }
