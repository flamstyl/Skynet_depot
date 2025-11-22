"""
🟣 MCP_LM_Terminal - Client LM Studio
Client pour communiquer avec l'API locale de LM Studio

Fonctionnalités :
- Support API native v0 + OpenAI-compatible v1
- Statistiques complètes (tokens/sec, TTFT, model_info, runtime)
- Gestion des erreurs de connexion
- Support multi-modèles
- Configuration flexible via config.json
"""

import logging
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)


class LMStudioClient:
    """
    Client pour l'API LM Studio locale

    LM Studio expose deux API :
    - API native v0 : /api/v0/* (avec stats avancées)
    - API OpenAI-compatible : /v1/* (compatible ChatGPT)

    Ce client supporte les deux et retourne les statistiques complètes
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialise le client LM Studio

        Args:
            config: Configuration LM Studio (host, model, api_version)
        """
        self.host = config.get("host", "http://localhost:1234")
        self.default_model = config.get("model", "default")
        self.api_version = config.get("api_version", "v0")  # v0 (natif) ou v1 (OpenAI)

        # Nettoyage de l'URL (suppression du trailing slash)
        self.host = self.host.rstrip('/')

        # Endpoints selon la version de l'API
        if self.api_version == "v0":
            # API native LM Studio avec stats avancées
            self.completions_url = f"{self.host}/api/v0/chat/completions"
            self.text_completions_url = f"{self.host}/api/v0/completions"
            self.embeddings_url = f"{self.host}/api/v0/embeddings"
            self.models_url = f"{self.host}/api/v0/models"
        else:
            # API compatible OpenAI
            self.completions_url = f"{self.host}/v1/chat/completions"
            self.text_completions_url = f"{self.host}/v1/completions"
            self.embeddings_url = f"{self.host}/v1/embeddings"
            self.models_url = f"{self.host}/v1/models"

        # Configuration du client HTTP
        self.client = httpx.AsyncClient(
            timeout=60.0,  # Timeout de 60s pour les requêtes LM
            follow_redirects=True
        )

        logger.info(f"LMStudioClient initialisé : {self.host} (API {self.api_version})")

    async def check_status(self) -> Dict[str, Any]:
        """
        Vérifie si LM Studio est accessible et retourne son statut

        Returns:
            Dict avec 'connected' (bool) et 'available' (bool)
        """
        try:
            # Tentative de récupération de la liste des modèles
            response = await self.client.get(self.models_url)

            if response.status_code == 200:
                data = response.json()
                models = data.get("data", [])

                return {
                    "connected": True,
                    "available": len(models) > 0,
                    "models": [m.get("id") for m in models]
                }
            else:
                logger.warning(f"LM Studio répond avec code {response.status_code}")
                return {
                    "connected": True,
                    "available": False,
                    "models": []
                }

        except httpx.ConnectError:
            logger.warning("LM Studio non accessible (connexion refusée)")
            return {
                "connected": False,
                "available": False,
                "models": []
            }

        except Exception as e:
            logger.error(f"Erreur vérification LM Studio : {str(e)}")
            return {
                "connected": False,
                "available": False,
                "error": str(e)
            }

    async def completion(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 512,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        stop: Optional[str] = None,
        ttl: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Envoie une requête de completion à LM Studio

        Args:
            prompt: Le prompt utilisateur
            temperature: Température de génération (0.0-2.0)
            max_tokens: Nombre maximum de tokens (-1 pour unlimited)
            model: Modèle spécifique (optionnel, utilise default sinon)
            system_prompt: Prompt système optionnel
            top_p: Nucleus sampling parameter (optionnel)
            top_k: Top-K sampling parameter (optionnel)
            stop: Stop sequence(s) (optionnel)
            ttl: Time-to-live en secondes pour le modèle (optionnel)

        Returns:
            Dict avec:
            - content: Le texte généré
            - usage: Statistiques d'utilisation (prompt_tokens, completion_tokens, total_tokens)
            - stats: Statistiques de performance (tokens_per_second, time_to_first_token, generation_time)
            - model_info: Informations sur le modèle (arch, quant, format, context_length)
            - runtime: Informations sur le runtime (name, version, supported_formats)
            - finish_reason: Raison d'arrêt (stop, length, tool_calls)

        Raises:
            ConnectionError: Si LM Studio n'est pas accessible
            ValueError: Si la réponse est invalide
        """
        model = model or self.default_model

        # Construction des messages au format OpenAI Chat
        messages = []

        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })

        messages.append({
            "role": "user",
            "content": prompt
        })

        # Payload de la requête
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }

        # Paramètres optionnels
        if top_p is not None:
            payload["top_p"] = top_p
        if top_k is not None:
            payload["top_k"] = top_k
        if stop is not None:
            payload["stop"] = stop
        if ttl is not None:
            payload["ttl"] = ttl

        logger.debug(f"Requête LM Studio : model={model}, tokens={max_tokens}")

        try:
            # Envoi de la requête POST
            response = await self.client.post(
                self.completions_url,
                json=payload
            )

            # Vérification du code de réponse
            if response.status_code != 200:
                error_msg = f"LM Studio erreur {response.status_code}: {response.text}"
                logger.error(error_msg)
                raise ValueError(error_msg)

            # Parsing de la réponse
            data = response.json()

            # Extraction du texte généré et des métadonnées
            if "choices" in data and len(data["choices"]) > 0:
                choice = data["choices"][0]
                message = choice.get("message", {})
                content = message.get("content", "")

                # Construction de la réponse complète avec toutes les stats
                result = {
                    "content": content.strip(),
                    "usage": data.get("usage", {}),
                    "stats": data.get("stats", {}),
                    "model_info": data.get("model_info", {}),
                    "runtime": data.get("runtime", {}),
                    "finish_reason": choice.get("finish_reason", "unknown"),
                    "model": data.get("model", model)
                }

                logger.debug(f"Réponse LM Studio reçue : {len(content)} caractères")

                # Log des stats si disponibles
                if "stats" in data:
                    stats = data["stats"]
                    logger.info(
                        f"Stats LM Studio - "
                        f"Tokens/sec: {stats.get('tokens_per_second', 'N/A')}, "
                        f"TTFT: {stats.get('time_to_first_token', 'N/A')}s, "
                        f"Gen time: {stats.get('generation_time', 'N/A')}s"
                    )

                return result

            else:
                logger.error(f"Format de réponse invalide : {data}")
                raise ValueError("Format de réponse LM Studio invalide")

        except httpx.ConnectError as e:
            error_msg = (
                "Impossible de se connecter à LM Studio. "
                "Vérifiez que LM Studio est lancé et qu'un modèle est chargé."
            )
            logger.error(error_msg)
            raise ConnectionError(error_msg) from e

        except httpx.TimeoutException as e:
            error_msg = f"Timeout lors de la requête LM Studio (>60s)"
            logger.error(error_msg)
            raise TimeoutError(error_msg) from e

        except Exception as e:
            logger.error(f"Erreur completion LM Studio : {str(e)}")
            raise

    async def stream_completion(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 512,
        model: Optional[str] = None
    ):
        """
        Envoie une requête de completion en mode streaming

        Args:
            prompt: Le prompt utilisateur
            temperature: Température de génération
            max_tokens: Nombre maximum de tokens
            model: Modèle spécifique

        Yields:
            Chunks de texte au fur et à mesure de la génération
        """
        model = model or self.default_model

        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }

        logger.debug(f"Streaming LM Studio : model={model}")

        try:
            async with self.client.stream(
                "POST",
                self.completions_url,
                json=payload
            ) as response:

                if response.status_code != 200:
                    error_msg = f"LM Studio streaming erreur {response.status_code}"
                    logger.error(error_msg)
                    raise ValueError(error_msg)

                async for chunk in response.aiter_lines():
                    if chunk.startswith("data: "):
                        chunk_data = chunk[6:]  # Suppression du préfixe "data: "

                        if chunk_data == "[DONE]":
                            break

                        try:
                            import json
                            data = json.loads(chunk_data)

                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                content = delta.get("content", "")

                                if content:
                                    yield content

                        except json.JSONDecodeError:
                            continue

        except Exception as e:
            logger.error(f"Erreur streaming LM Studio : {str(e)}")
            raise

    async def get_models(self) -> list:
        """
        Récupère la liste des modèles disponibles

        Returns:
            Liste des IDs de modèles
        """
        try:
            response = await self.client.get(self.models_url)

            if response.status_code == 200:
                data = response.json()
                models = data.get("data", [])
                return [m.get("id") for m in models]
            else:
                logger.warning(f"Impossible de récupérer les modèles : {response.status_code}")
                return []

        except Exception as e:
            logger.error(f"Erreur récupération modèles : {str(e)}")
            return []

    async def close(self):
        """Ferme le client HTTP"""
        await self.client.aclose()
        logger.info("LMStudioClient fermé")

    async def __aenter__(self):
        """Support du context manager async"""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Fermeture automatique avec context manager"""
        await self.close()


# ============= FONCTIONS UTILITAIRES =============

async def test_lm_studio():
    """Fonction de test du client LM Studio"""
    import asyncio

    # Configuration de test
    test_config = {
        "host": "http://localhost:1234",
        "model": "default"
    }

    async with LMStudioClient(test_config) as client:
        print("\n🧪 Test LM Studio Client")
        print("=" * 50)

        # Test 1: Vérification du statut
        print("\n1️⃣ Vérification du statut...")
        status = await client.check_status()
        print(f"Connecté : {status['connected']}")
        print(f"Disponible : {status['available']}")
        if status.get('models'):
            print(f"Modèles : {', '.join(status['models'])}")

        if not status['connected']:
            print("\n⚠️  LM Studio n'est pas accessible.")
            print("Assurez-vous que LM Studio est lancé sur http://localhost:1234")
            return

        # Test 2: Liste des modèles
        print("\n2️⃣ Récupération des modèles...")
        models = await client.get_models()
        print(f"Modèles trouvés : {models}")

        # Test 3: Completion simple
        if status['available']:
            print("\n3️⃣ Test de completion...")
            try:
                result = await client.completion(
                    prompt="Bonjour ! Dis-moi juste 'Hello' en réponse.",
                    temperature=0.7,
                    max_tokens=50
                )
                print(f"Réponse : {result['content']}")
                print(f"\nStatistiques :")
                if result.get('stats'):
                    print(f"  - Tokens/sec : {result['stats'].get('tokens_per_second', 'N/A')}")
                    print(f"  - TTFT : {result['stats'].get('time_to_first_token', 'N/A')}s")
                    print(f"  - Temps génération : {result['stats'].get('generation_time', 'N/A')}s")
                if result.get('usage'):
                    print(f"  - Tokens utilisés : {result['usage'].get('total_tokens', 'N/A')}")
                if result.get('model_info'):
                    print(f"  - Architecture : {result['model_info'].get('arch', 'N/A')}")
                    print(f"  - Quantization : {result['model_info'].get('quant', 'N/A')}")
            except Exception as e:
                print(f"Erreur : {str(e)}")
        else:
            print("\n⚠️  Aucun modèle chargé dans LM Studio")

        print("\n✅ Tests terminés")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_lm_studio())
