"""
Client pour LM Studio API
Implémentation basée sur la documentation officielle LM Studio
Endpoint: POST http://localhost:1234/api/v0/chat/completions
"""
import httpx
import logging
from typing import Optional, List, Dict, Any
from models.lm_models import (
    ChatMessage, LMQueryRequest, LMChatCompletionRequest,
    LMChatCompletionResponse, LMQueryResponse, LMStatusResponse,
    LMModelsListResponse
)

logger = logging.getLogger(__name__)


class LMStudioClient:
    """
    Client asynchrone pour communiquer avec LM Studio
    """

    def __init__(self, host: str = "http://localhost:1234", model: str = None):
        """
        Initialise le client LM Studio

        Args:
            host: URL du serveur LM Studio (par défaut: http://localhost:1234)
            model: Nom du modèle à utiliser (optionnel si un seul modèle chargé)
        """
        self.host = host.rstrip('/')
        self.model = model
        self.chat_endpoint = f"{self.host}/api/v0/chat/completions"
        self.models_endpoint = f"{self.host}/api/v0/models"

    async def check_status(self) -> LMStatusResponse:
        """
        Vérifie si le serveur LM Studio est accessible

        Returns:
            LMStatusResponse avec le statut du serveur
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(self.models_endpoint)

                if response.status_code == 200:
                    data = response.json()
                    models_count = len(data.get("data", []))

                    return LMStatusResponse(
                        available=True,
                        host=self.host,
                        message=f"LM Studio est accessible. {models_count} modèle(s) disponible(s).",
                        models_loaded=models_count
                    )
                else:
                    return LMStatusResponse(
                        available=False,
                        host=self.host,
                        message=f"LM Studio répond avec le code: {response.status_code}"
                    )

        except httpx.ConnectError:
            logger.error(f"Impossible de se connecter à LM Studio sur {self.host}")
            return LMStatusResponse(
                available=False,
                host=self.host,
                message="Impossible de se connecter à LM Studio. Assurez-vous que le serveur est démarré."
            )
        except Exception as e:
            logger.error(f"Erreur lors de la vérification du statut LM Studio: {e}")
            return LMStatusResponse(
                available=False,
                host=self.host,
                message=f"Erreur: {str(e)}"
            )

    async def list_models(self) -> LMModelsListResponse:
        """
        Liste tous les modèles disponibles dans LM Studio

        Returns:
            LMModelsListResponse avec la liste des modèles
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.models_endpoint)
                response.raise_for_status()

                data = response.json()
                models = data.get("data", [])

                return LMModelsListResponse(
                    models=models,
                    total=len(models)
                )

        except Exception as e:
            logger.error(f"Erreur lors de la récupération des modèles: {e}")
            return LMModelsListResponse(models=[], total=0)

    async def query(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = -1,
        system_prompt: Optional[str] = None,
        stream: bool = False
    ) -> LMQueryResponse:
        """
        Envoie une requête simple à LM Studio

        Args:
            prompt: Le prompt à envoyer
            temperature: Température de sampling (0.0 à 1.0)
            max_tokens: Nombre maximum de tokens (-1 pour illimité)
            system_prompt: Prompt système optionnel
            stream: Activer le streaming (non implémenté)

        Returns:
            LMQueryResponse avec la réponse du modèle
        """
        try:
            # Construire les messages
            messages = []
            if system_prompt:
                messages.append(ChatMessage(role="system", content=system_prompt))
            messages.append(ChatMessage(role="user", content=prompt))

            # Créer la requête
            request_data = LMChatCompletionRequest(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream
            )

            # Envoyer la requête
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.chat_endpoint,
                    json=request_data.model_dump(exclude_none=True),
                    headers={"Content-Type": "application/json"}
                )

                response.raise_for_status()
                data = response.json()

                # Parser la réponse selon le format LM Studio
                if "choices" in data and len(data["choices"]) > 0:
                    choice = data["choices"][0]
                    message_content = choice.get("message", {}).get("content", "")

                    tokens_used = None
                    if "usage" in data:
                        tokens_used = data["usage"].get("total_tokens")

                    model_used = data.get("model", self.model)

                    return LMQueryResponse(
                        response=message_content,
                        model=model_used,
                        tokens_used=tokens_used,
                        temperature=temperature,
                        success=True
                    )
                else:
                    logger.error(f"Format de réponse inattendu de LM Studio: {data}")
                    return LMQueryResponse(
                        response="Erreur: format de réponse inattendu",
                        model=self.model,
                        temperature=temperature,
                        success=False
                    )

        except httpx.ConnectError:
            logger.error(f"Impossible de se connecter à LM Studio sur {self.host}")
            return LMQueryResponse(
                response="Erreur: Impossible de se connecter à LM Studio. Vérifiez que le serveur est démarré.",
                model=self.model,
                temperature=temperature,
                success=False
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"Erreur HTTP de LM Studio: {e.response.status_code} - {e.response.text}")
            return LMQueryResponse(
                response=f"Erreur HTTP {e.response.status_code}: {e.response.text}",
                model=self.model,
                temperature=temperature,
                success=False
            )
        except Exception as e:
            logger.error(f"Erreur lors de la requête LM Studio: {e}")
            return LMQueryResponse(
                response=f"Erreur: {str(e)}",
                model=self.model,
                temperature=temperature,
                success=False
            )

    async def chat_completion(
        self,
        messages: List[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = -1,
        stream: bool = False
    ) -> LMChatCompletionResponse:
        """
        Envoie une requête de chat completion complète à LM Studio

        Args:
            messages: Liste des messages de chat
            temperature: Température de sampling
            max_tokens: Nombre maximum de tokens
            stream: Activer le streaming

        Returns:
            LMChatCompletionResponse avec la réponse complète
        """
        try:
            request_data = LMChatCompletionRequest(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream
            )

            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.chat_endpoint,
                    json=request_data.model_dump(exclude_none=True),
                    headers={"Content-Type": "application/json"}
                )

                response.raise_for_status()
                data = response.json()

                # Parser avec Pydantic
                return LMChatCompletionResponse(**data)

        except Exception as e:
            logger.error(f"Erreur lors de chat_completion: {e}")
            raise
