"""
MCP_Browser_LMStudio - Serveur FastAPI
Serveur MCP local intégrant LM Studio et un navigateur contrôlable par IA

Routes disponibles:
- GET  /status                  - Statut global du serveur
- POST /browser/open            - Ouvrir une URL
- GET  /browser/get_html        - Récupérer le HTML de la page
- POST /browser/click           - Cliquer sur un élément
- POST /browser/screenshot      - Prendre une capture d'écran
- GET  /browser/status          - Statut du navigateur
- POST /lm/query                - Interroger LM Studio
- GET  /lm/status               - Statut de LM Studio
- GET  /lm/models               - Liste des modèles disponibles
- GET  /memory/history          - Historique des interactions
"""
import json
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from browser_controller import BrowserController
from lmstudio_client import LMStudioClient
from models.browser_models import (
    OpenURLRequest, OpenURLResponse, GetHTMLResponse,
    ClickRequest, ClickResponse, ScreenshotRequest, ScreenshotResponse,
    BrowserStatusResponse, MemoryHistoryResponse
)
from models.lm_models import (
    LMQueryRequest, LMQueryResponse, LMStatusResponse, LMModelsListResponse
)

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/server.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Variables globales
browser_controller: Optional[BrowserController] = None
lm_client: Optional[LMStudioClient] = None
config: dict = {}


def load_config():
    """Charge la configuration depuis config.json"""
    global config
    config_path = Path("config.json")

    if not config_path.exists():
        logger.error("config.json introuvable. Création d'une configuration par défaut.")
        config = {
            "auth_token": "CHANGE_ME_PLEASE",
            "browser_engine": "playwright",
            "lmstudio": {
                "host": "http://localhost:1234",
                "model": None
            },
            "server": {
                "host": "0.0.0.0",
                "port": 8000
            }
        }
        # Sauvegarder la config par défaut
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
    else:
        with open(config_path, 'r') as f:
            config = json.load(f)

    logger.info(f"Configuration chargée: Engine={config.get('browser_engine')}, LM Studio={config.get('lmstudio', {}).get('host')}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application"""
    global browser_controller, lm_client

    # Startup
    logger.info("🚀 Démarrage de MCP_Browser_LMStudio")

    # Charger la configuration
    load_config()

    # Initialiser le client LM Studio
    lm_config = config.get("lmstudio", {})
    lm_client = LMStudioClient(
        host=lm_config.get("host", "http://localhost:1234"),
        model=lm_config.get("model")
    )

    # Initialiser le contrôleur de navigateur
    browser_engine = config.get("browser_engine", "playwright")
    browser_controller = BrowserController(engine=browser_engine)

    # Vérifier LM Studio
    lm_status = await lm_client.check_status()
    if lm_status.available:
        logger.info(f"✅ LM Studio est accessible: {lm_status.message}")
    else:
        logger.warning(f"⚠️  LM Studio n'est pas accessible: {lm_status.message}")

    logger.info("✅ Serveur prêt")

    yield

    # Shutdown
    logger.info("🛑 Arrêt de MCP_Browser_LMStudio")
    if browser_controller:
        await browser_controller.stop()
    logger.info("✅ Arrêt terminé")


app = FastAPI(
    title="MCP_Browser_LMStudio",
    description="Serveur MCP local intégrant LM Studio et un navigateur contrôlable par IA",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Middleware d'authentification
async def verify_token(authorization: Optional[str] = Header(None)):
    """Vérifie le token d'authentification"""
    expected_token = config.get("auth_token", "CHANGE_ME_PLEASE")

    # Si le token est "CHANGE_ME_PLEASE", avertir mais autoriser
    if expected_token == "CHANGE_ME_PLEASE":
        logger.warning("⚠️  AUTH_TOKEN par défaut détecté. Changez-le dans config.json !")
        return True

    if not authorization:
        raise HTTPException(status_code=401, detail="Token d'authentification manquant")

    # Format: "Bearer <token>"
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Format de token invalide. Utilisez: Bearer <token>")

    token = authorization.replace("Bearer ", "")

    if token != expected_token:
        raise HTTPException(status_code=401, detail="Token invalide")

    return True


# ============================================================================
# ROUTES - STATUS
# ============================================================================

@app.get("/status")
async def get_status(authorized: bool = Depends(verify_token)):
    """
    Retourne le statut global du serveur
    """
    try:
        # Statut du navigateur
        browser_status = await browser_controller.get_status()

        # Statut de LM Studio
        lm_status = await lm_client.check_status()

        return {
            "server": "MCP_Browser_LMStudio",
            "version": "1.0.0",
            "status": "running",
            "browser": {
                "running": browser_status.running,
                "engine": browser_status.engine,
                "current_url": browser_status.current_url,
                "title": browser_status.title
            },
            "lmstudio": {
                "available": lm_status.available,
                "host": lm_status.host,
                "message": lm_status.message,
                "models_loaded": lm_status.models_loaded
            }
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du statut: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ROUTES - BROWSER
# ============================================================================

@app.post("/browser/open", response_model=OpenURLResponse)
async def browser_open(request: OpenURLRequest, authorized: bool = Depends(verify_token)):
    """
    Ouvre une URL dans le navigateur

    Args:
        request: OpenURLRequest avec l'URL et le temps d'attente

    Returns:
        OpenURLResponse avec les détails de la page
    """
    try:
        logger.info(f"📖 Ouverture de l'URL: {request.url}")
        response = await browser_controller.open_url(request.url, request.wait_time)
        return response
    except Exception as e:
        logger.error(f"Erreur lors de l'ouverture de l'URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/browser/get_html", response_model=GetHTMLResponse)
async def browser_get_html(authorized: bool = Depends(verify_token)):
    """
    Récupère le HTML complet de la page actuelle

    Returns:
        GetHTMLResponse avec le HTML complet
    """
    try:
        logger.info("📄 Récupération du HTML de la page")
        response = await browser_controller.get_html()
        return response
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du HTML: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/browser/click", response_model=ClickResponse)
async def browser_click(request: ClickRequest, authorized: bool = Depends(verify_token)):
    """
    Clique sur un élément de la page

    Args:
        request: ClickRequest avec le sélecteur CSS

    Returns:
        ClickResponse avec le résultat du clic
    """
    try:
        logger.info(f"🖱️  Clic sur l'élément: {request.selector}")
        response = await browser_controller.click(request.selector, request.wait_after)
        return response
    except Exception as e:
        logger.error(f"Erreur lors du clic: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/browser/screenshot", response_model=ScreenshotResponse)
async def browser_screenshot(request: ScreenshotRequest, authorized: bool = Depends(verify_token)):
    """
    Prend une capture d'écran de la page

    Args:
        request: ScreenshotRequest avec les options

    Returns:
        ScreenshotResponse avec le chemin et l'image en base64
    """
    try:
        logger.info(f"📸 Capture d'écran: {request.filename or 'auto'}")
        response = await browser_controller.screenshot(request.filename, request.full_page)
        return response
    except Exception as e:
        logger.error(f"Erreur lors de la capture d'écran: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/browser/status", response_model=BrowserStatusResponse)
async def browser_status(authorized: bool = Depends(verify_token)):
    """
    Retourne le statut du navigateur

    Returns:
        BrowserStatusResponse avec le statut
    """
    try:
        response = await browser_controller.get_status()
        return response
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du statut du navigateur: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ROUTES - LM STUDIO
# ============================================================================

@app.post("/lm/query", response_model=LMQueryResponse)
async def lm_query(request: LMQueryRequest, authorized: bool = Depends(verify_token)):
    """
    Envoie une requête à LM Studio

    Args:
        request: LMQueryRequest avec le prompt et les options

    Returns:
        LMQueryResponse avec la réponse du modèle
    """
    try:
        logger.info(f"🤖 Requête LM Studio: {request.prompt[:50]}...")
        response = await lm_client.query(
            prompt=request.prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            system_prompt=request.system_prompt,
            stream=request.stream
        )
        return response
    except Exception as e:
        logger.error(f"Erreur lors de la requête LM Studio: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/lm/status", response_model=LMStatusResponse)
async def lm_status(authorized: bool = Depends(verify_token)):
    """
    Vérifie le statut de LM Studio

    Returns:
        LMStatusResponse avec le statut de LM Studio
    """
    try:
        response = await lm_client.check_status()
        return response
    except Exception as e:
        logger.error(f"Erreur lors de la vérification du statut LM Studio: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/lm/models", response_model=LMModelsListResponse)
async def lm_models(authorized: bool = Depends(verify_token)):
    """
    Liste les modèles disponibles dans LM Studio

    Returns:
        LMModelsListResponse avec la liste des modèles
    """
    try:
        response = await lm_client.list_models()
        return response
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des modèles: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ROUTES - MEMORY
# ============================================================================

@app.get("/memory/history", response_model=MemoryHistoryResponse)
async def memory_history(authorized: bool = Depends(verify_token)):
    """
    Retourne l'historique des interactions avec le navigateur

    Returns:
        MemoryHistoryResponse avec l'historique complet
    """
    try:
        history = browser_controller.get_history()
        return MemoryHistoryResponse(
            total_interactions=len(history),
            interactions=history
        )
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'historique: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Gestionnaire global d'exceptions"""
    logger.error(f"Exception non gérée: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Erreur interne: {str(exc)}"}
    )


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    # Créer le dossier logs s'il n'existe pas
    Path("logs").mkdir(exist_ok=True)

    # Charger la config pour obtenir les paramètres du serveur
    load_config()
    server_config = config.get("server", {})

    host = server_config.get("host", "0.0.0.0")
    port = server_config.get("port", 8000)

    logger.info(f"🚀 Démarrage du serveur sur {host}:{port}")

    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )
