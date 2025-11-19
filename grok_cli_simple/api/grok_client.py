"""
Grok API Client - Interface pour l'API xAI
"""

import os
import json
import httpx
from typing import List, Dict, Optional, AsyncIterator


class GrokClient:
    """Client pour l'API Grok de xAI"""

    def __init__(self, api_key: Optional[str] = None, model: str = "grok-2-1212"):
        self.api_key = api_key or os.getenv("XAI_API_KEY")
        if not self.api_key:
            raise ValueError("XAI_API_KEY non trouvée. Définissez-la dans l'environnement ou passez-la au constructeur.")

        self.model = model
        self.base_url = "https://api.x.ai/v1"
        self.client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=60.0
        )

    async def chat(
        self,
        messages: List[Dict[str, str]],
        stream: bool = True,
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> AsyncIterator[str]:
        """
        Envoie des messages à Grok et stream la réponse

        Args:
            messages: Liste de messages [{role: "user/assistant/system", content: "..."}]
            stream: Si True, stream la réponse token par token
            temperature: Température de génération (0-2)
            max_tokens: Nombre maximum de tokens
        """

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": stream,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        if stream:
            async with self.client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                json=payload
            ) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]  # Remove "data: " prefix

                        if data == "[DONE]":
                            break

                        try:
                            chunk = json.loads(data)
                            if chunk.get("choices") and len(chunk["choices"]) > 0:
                                delta = chunk["choices"][0].get("delta", {})
                                if "content" in delta:
                                    yield delta["content"]
                        except json.JSONDecodeError:
                            continue
        else:
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            if data.get("choices") and len(data["choices"]) > 0:
                yield data["choices"][0]["message"]["content"]

    async def list_models(self) -> List[Dict]:
        """Liste les modèles disponibles"""
        response = await self.client.get(f"{self.base_url}/models")
        response.raise_for_status()
        return response.json().get("data", [])

    def set_model(self, model: str):
        """Change le modèle utilisé"""
        self.model = model

    async def close(self):
        """Ferme le client"""
        await self.client.aclose()


# Modèles Grok disponibles
GROK_MODELS = {
    "grok-2-1212": "Grok 2 (Latest) - Le plus puissant",
    "grok-2-vision-1212": "Grok 2 Vision - Avec support d'images",
    "grok-beta": "Grok Beta - Version bêta avec nouvelles features",
}
