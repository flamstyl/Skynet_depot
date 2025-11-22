"""
🌐 Endpoint Internet — Proxy IA → Internet
Permet aux IA d'accéder à Internet via le serveur MCP local
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import httpx
import logging
from typing import Optional, Dict
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

# Configuration
TIMEOUT = 30
MAX_RESPONSE_SIZE = 10_000_000  # 10 MB


# 📦 Modèles de données
class InternetFetchRequest(BaseModel):
    url: str = Field(..., description="URL à récupérer")
    auth: str = Field(..., description="Clé d'authentification")
    method: str = Field(default="GET", description="Méthode HTTP (GET, POST, etc.)")
    headers: Optional[Dict[str, str]] = Field(default=None, description="Headers HTTP personnalisés")
    body: Optional[str] = Field(default=None, description="Corps de la requête (pour POST, PUT)")
    timeout: int = Field(default=TIMEOUT, description="Timeout en secondes")


# 🌐 Endpoint: Fetch URL
@router.post("/fetch")
async def fetch_url(request: InternetFetchRequest):
    """
    Récupère le contenu d'une URL via le serveur MCP

    Exemple:
    ```json
    {
        "url": "https://api.github.com/users/octocat",
        "method": "GET",
        "auth": "YOUR_API_KEY"
    }
    ```

    ⚠️ Attention: Peut exposer votre IP. Utilisez avec prudence.
    """
    # Vérifier l'authentification
    from server import API_KEY
    if request.auth != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    # Valider la méthode HTTP
    if request.method.upper() not in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
        raise HTTPException(status_code=400, detail="Invalid HTTP method")

    try:
        # Préparer les headers
        headers = request.headers or {}
        if "User-Agent" not in headers:
            headers["User-Agent"] = "MCP-Server/1.0 (AI-Proxy)"

        # Effectuer la requête HTTP
        async with httpx.AsyncClient(timeout=request.timeout) as client:
            if request.method.upper() == "GET":
                response = await client.get(request.url, headers=headers)
            elif request.method.upper() == "POST":
                response = await client.post(
                    request.url,
                    headers=headers,
                    content=request.body
                )
            elif request.method.upper() == "PUT":
                response = await client.put(
                    request.url,
                    headers=headers,
                    content=request.body
                )
            elif request.method.upper() == "DELETE":
                response = await client.delete(request.url, headers=headers)
            elif request.method.upper() == "PATCH":
                response = await client.patch(
                    request.url,
                    headers=headers,
                    content=request.body
                )

            # Vérifier la taille de la réponse
            content = response.text
            if len(content) > MAX_RESPONSE_SIZE:
                content = content[:MAX_RESPONSE_SIZE] + "\n\n[... truncated]"

            logger.info(
                f"Internet fetch: {request.method} {request.url} | "
                f"Status: {response.status_code} | "
                f"Size: {len(content)} bytes"
            )

            return {
                "success": True,
                "url": request.url,
                "method": request.method,
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "content": content,
                "content_type": response.headers.get("content-type"),
                "size": len(content),
                "timestamp": datetime.now().isoformat()
            }

    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Request timed out")
    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching {request.url}: {e}")
        raise HTTPException(status_code=502, detail=f"HTTP error: {str(e)}")
    except Exception as e:
        logger.error(f"Error fetching {request.url}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 🔍 Endpoint: Web Search (TODO - intégration API de recherche)
@router.post("/search")
async def web_search(query: str, auth: str, max_results: int = 10):
    """
    Recherche sur le web (TODO - nécessite une API de recherche)

    Exemple:
    ```json
    {
        "query": "FastAPI tutorial",
        "auth": "YOUR_API_KEY",
        "max_results": 5
    }
    ```

    TODO: Intégrer une API de recherche (Google Custom Search, Bing, DuckDuckGo, etc.)
    """
    # Vérifier l'authentification
    from server import API_KEY
    if auth != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    # TODO: Implémenter l'intégration avec une API de recherche
    raise HTTPException(
        status_code=501,
        detail="Web search not yet implemented. Add your preferred search API."
    )
