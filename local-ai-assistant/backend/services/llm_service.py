"""
Service pour interagir avec les différents modèles LLM
Supporte OpenAI, Anthropic, et des modèles personnalisés
"""

import os
from typing import Optional, AsyncIterator, List, Dict, Any
from enum import Enum
import openai
from anthropic import Anthropic
import aiohttp


class LLMProvider(str, Enum):
    """Fournisseurs de LLM supportés"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    LOCAL = "local"
    CUSTOM = "custom"


class LLMService:
    """Service pour gérer les appels aux modèles LLM"""

    def __init__(
        self,
        provider: LLMProvider = LLMProvider.OPENAI,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        custom_url: Optional[str] = None
    ):
        """
        Initialise le service LLM

        Args:
            provider: Fournisseur à utiliser (openai, anthropic, local, custom)
            api_key: Clé API (si nécessaire)
            model: Nom du modèle à utiliser
            custom_url: URL personnalisée pour un modèle custom
        """
        self.provider = provider
        self.api_key = api_key or self._get_default_api_key(provider)
        self.model = model or self._get_default_model(provider)
        self.custom_url = custom_url

        # Initialiser les clients
        if self.provider == LLMProvider.OPENAI:
            openai.api_key = self.api_key
        elif self.provider == LLMProvider.ANTHROPIC:
            self.anthropic_client = Anthropic(api_key=self.api_key)

    def _get_default_api_key(self, provider: LLMProvider) -> Optional[str]:
        """Récupère la clé API par défaut depuis les variables d'environnement"""
        if provider == LLMProvider.OPENAI:
            return os.getenv("OPENAI_API_KEY")
        elif provider == LLMProvider.ANTHROPIC:
            return os.getenv("ANTHROPIC_API_KEY")
        return None

    def _get_default_model(self, provider: LLMProvider) -> str:
        """Récupère le modèle par défaut pour chaque fournisseur"""
        defaults = {
            LLMProvider.OPENAI: "gpt-4-turbo-preview",
            LLMProvider.ANTHROPIC: "claude-3-sonnet-20240229",
            LLMProvider.LOCAL: "llama-2-7b",
            LLMProvider.CUSTOM: "custom-model"
        }
        return defaults.get(provider, "gpt-3.5-turbo")

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False
    ) -> str:
        """
        Génère une réponse du LLM

        Args:
            messages: Liste des messages de conversation
            temperature: Température pour la génération (0-2)
            max_tokens: Nombre maximum de tokens
            stream: Si True, retourne un générateur pour le streaming

        Returns:
            Réponse générée (ou générateur si stream=True)
        """
        if self.provider == LLMProvider.OPENAI:
            return await self._generate_openai(messages, temperature, max_tokens, stream)
        elif self.provider == LLMProvider.ANTHROPIC:
            return await self._generate_anthropic(messages, temperature, max_tokens, stream)
        elif self.provider == LLMProvider.CUSTOM:
            return await self._generate_custom(messages, temperature, max_tokens, stream)
        else:
            raise ValueError(f"Provider {self.provider} not supported yet")

    async def _generate_openai(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        stream: bool
    ) -> str:
        """Génère une réponse via OpenAI API"""
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream
            )

            if stream:
                return response  # Retourne le générateur pour le streaming
            else:
                return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Erreur OpenAI API: {str(e)}")

    async def _generate_anthropic(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        stream: bool
    ) -> str:
        """Génère une réponse via Anthropic API"""
        try:
            # Convertir le format de messages pour Anthropic
            # Anthropic attend un format légèrement différent
            system_message = next((m["content"] for m in messages if m["role"] == "system"), None)
            conversation_messages = [m for m in messages if m["role"] != "system"]

            if stream:
                # Pour le streaming, on doit gérer différemment
                response = self.anthropic_client.messages.create(
                    model=self.model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_message,
                    messages=conversation_messages,
                    stream=True
                )
                return response
            else:
                response = self.anthropic_client.messages.create(
                    model=self.model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_message,
                    messages=conversation_messages
                )
                return response.content[0].text
        except Exception as e:
            raise Exception(f"Erreur Anthropic API: {str(e)}")

    async def _generate_custom(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        stream: bool
    ) -> str:
        """Génère une réponse via un endpoint custom"""
        if not self.custom_url:
            raise ValueError("Custom URL not configured")

        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": stream
                }

                async with session.post(
                    self.custom_url,
                    json=payload,
                    headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
                ) as response:
                    if stream:
                        # Retourner le générateur pour le streaming
                        return self._stream_custom_response(response)
                    else:
                        result = await response.json()
                        return result.get("content", result.get("message", str(result)))
        except Exception as e:
            raise Exception(f"Erreur Custom API: {str(e)}")

    async def _stream_custom_response(self, response) -> AsyncIterator[str]:
        """Stream la réponse d'un endpoint custom"""
        async for line in response.content:
            if line:
                yield line.decode('utf-8')

    async def generate_summary(
        self,
        text: str,
        max_length: int = 500,
        language: str = "fr"
    ) -> str:
        """
        Génère un résumé d'un texte

        Args:
            text: Texte à résumer
            max_length: Longueur maximale du résumé en mots
            language: Langue du résumé

        Returns:
            Résumé généré
        """
        prompt = f"""Résume le texte suivant en {language}, en maximum {max_length} mots.
Concentre-toi sur les points clés et les informations importantes.

Texte à résumer:
{text}

Résumé:"""

        messages = [
            {"role": "system", "content": "Tu es un assistant spécialisé dans la création de résumés concis et informatifs."},
            {"role": "user", "content": prompt}
        ]

        return await self.generate_response(messages, temperature=0.3)

    async def translate_text(
        self,
        text: str,
        target_language: str,
        source_language: Optional[str] = None
    ) -> str:
        """
        Traduit un texte dans une langue cible

        Args:
            text: Texte à traduire
            target_language: Langue cible
            source_language: Langue source (auto-détection si None)

        Returns:
            Texte traduit
        """
        source_info = f"depuis {source_language}" if source_language else "(détecte automatiquement la langue source)"

        prompt = f"""Traduis le texte suivant {source_info} vers {target_language}.
Garde le même ton et le même style que l'original.

Texte à traduire:
{text}

Traduction:"""

        messages = [
            {"role": "system", "content": "Tu es un traducteur professionnel expert en plusieurs langues."},
            {"role": "user", "content": prompt}
        ]

        return await self.generate_response(messages, temperature=0.3)

    async def generate_from_template(
        self,
        template_prompt: str,
        context: Dict[str, Any],
        temperature: float = 0.7
    ) -> str:
        """
        Génère du contenu à partir d'un template

        Args:
            template_prompt: Prompt du template
            context: Variables de contexte
            temperature: Température de génération

        Returns:
            Contenu généré
        """
        # Remplacer les variables dans le template
        filled_prompt = template_prompt
        for key, value in context.items():
            filled_prompt = filled_prompt.replace(f"{{{key}}}", str(value))

        messages = [
            {"role": "system", "content": "Tu es un assistant de rédaction créatif et professionnel."},
            {"role": "user", "content": filled_prompt}
        ]

        return await self.generate_response(messages, temperature=temperature)


# Instance globale du service
llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Récupère l'instance du service LLM"""
    global llm_service
    if llm_service is None:
        llm_service = LLMService()
    return llm_service


def update_llm_service(
    provider: Optional[LLMProvider] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    custom_url: Optional[str] = None
):
    """Met à jour la configuration du service LLM"""
    global llm_service
    current_provider = llm_service.provider if llm_service else LLMProvider.OPENAI
    current_api_key = llm_service.api_key if llm_service else None
    current_model = llm_service.model if llm_service else None
    current_url = llm_service.custom_url if llm_service else None

    llm_service = LLMService(
        provider=provider or current_provider,
        api_key=api_key or current_api_key,
        model=model or current_model,
        custom_url=custom_url or current_url
    )
