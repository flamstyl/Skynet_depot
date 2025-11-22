"""
🟣 MCP_LM_Terminal - Serveur FastAPI Principal
Serveur MCP local pour interfacer ChatGPT/Claude avec LM Studio + Terminal IA

Fonctionnalités :
- Routes MCP pour status, requêtes LM Studio, commandes terminal
- WebSocket optionnel pour terminal interactif
- Authentification via token API
- Interface avec LM Studio local
"""

import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Header, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from terminal_handler import TerminalHandler
from lmstudio_client import LMStudioClient

# ============= CONFIGURATION =============

# Chargement de la configuration
CONFIG_PATH = Path(__file__).parent / "config.json"

def load_config() -> Dict[str, Any]:
    """Charge la configuration depuis config.json"""
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"Fichier config.json introuvable : {CONFIG_PATH}")

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

config = load_config()

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= INITIALISATION =============

app = FastAPI(
    title="MCP LM Terminal Server",
    description="Serveur MCP local pour LM Studio + Terminal IA",
    version="1.0.0"
)

# Configuration CORS (pour accès depuis ChatGPT/Claude)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation des handlers
terminal_handler = TerminalHandler(timeout=config["terminal"]["timeout"])
lm_client = LMStudioClient(config["lmstudio"])

# ============= MODÈLES PYDANTIC =============

class LMQueryRequest(BaseModel):
    """Requête pour interroger LM Studio"""
    prompt: str = Field(..., description="Prompt à envoyer au modèle LM")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Température de génération")
    max_tokens: int = Field(512, ge=1, le=4096, description="Nombre maximum de tokens")
    model: Optional[str] = Field(None, description="Modèle spécifique (optionnel)")

class TerminalCommandRequest(BaseModel):
    """Requête pour exécuter une commande terminal"""
    cmd: str = Field(..., description="Commande shell à exécuter")
    timeout: Optional[int] = Field(None, description="Timeout personnalisé en secondes")

class StatusResponse(BaseModel):
    """Réponse de status du serveur"""
    status: str
    lm_studio: Dict[str, Any]
    terminal: Dict[str, str]
    version: str

# ============= MIDDLEWARES =============

def verify_token(authorization: Optional[str] = Header(None)) -> bool:
    """
    Vérifie le token d'authentification
    Format attendu : Bearer <token>
    """
    expected_token = config["api_token"]

    if not authorization:
        raise HTTPException(status_code=401, detail="Token d'authentification manquant")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Format de token invalide (attendu: Bearer <token>)")

    token = authorization.replace("Bearer ", "")

    if token != expected_token:
        raise HTTPException(status_code=403, detail="Token d'authentification invalide")

    return True

# ============= ROUTES API =============

@app.get("/")
async def root():
    """Route racine - Info serveur"""
    return {
        "name": "MCP LM Terminal Server",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "status": "/status",
            "lm_query": "/lm/query",
            "terminal": "/terminal/cmd",
            "websocket": "/terminal/stream"
        }
    }

@app.get("/status", response_model=StatusResponse)
async def get_status(authorized: bool = Header(None, alias="authorization", convert_underscores=True)):
    """
    🔹 GET /status
    Retourne l'état complet du serveur MCP

    Authentification requise via Header : Authorization: Bearer <token>
    """
    verify_token(authorized)

    # Vérification LM Studio
    lm_status = await lm_client.check_status()

    return StatusResponse(
        status="online",
        lm_studio={
            "connected": lm_status["connected"],
            "host": config["lmstudio"]["host"],
            "model": config["lmstudio"]["model"],
            "available": lm_status["available"]
        },
        terminal={
            "status": "online",
            "timeout": f"{config['terminal']['timeout']}s"
        },
        version="1.0.0"
    )

@app.post("/lm/query")
async def lm_query(
    request: LMQueryRequest,
    authorization: Optional[str] = Header(None)
):
    """
    🔹 POST /lm/query
    Transmet une requête à LM Studio et retourne la réponse

    Body JSON:
    {
        "prompt": "Votre question",
        "temperature": 0.7,
        "max_tokens": 512,
        "model": "default" (optionnel)
    }

    Authentification requise via Header : Authorization: Bearer <token>
    """
    verify_token(authorization)

    try:
        logger.info(f"Requête LM Studio : {request.prompt[:50]}...")

        # Transmission à LM Studio
        response = await lm_client.completion(
            prompt=request.prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            model=request.model
        )

        return {
            "success": True,
            "response": response,
            "model": request.model or config["lmstudio"]["model"],
            "tokens": request.max_tokens
        }

    except Exception as e:
        logger.error(f"Erreur LM Studio : {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur LM Studio : {str(e)}")

@app.post("/terminal/cmd")
async def terminal_command(
    request: TerminalCommandRequest,
    authorization: Optional[str] = Header(None)
):
    """
    🔹 POST /terminal/cmd
    Exécute une commande shell et retourne le résultat

    Body JSON:
    {
        "cmd": "ls -la",
        "timeout": 20 (optionnel)
    }

    Authentification requise via Header : Authorization: Bearer <token>
    """
    verify_token(authorization)

    try:
        logger.info(f"Exécution commande : {request.cmd}")

        # Exécution de la commande
        result = terminal_handler.execute_command(
            request.cmd,
            timeout=request.timeout
        )

        return {
            "success": True,
            "command": request.cmd,
            "stdout": result["stdout"],
            "stderr": result["stderr"],
            "exit_code": result["exit_code"],
            "execution_time": result.get("execution_time", 0)
        }

    except Exception as e:
        logger.error(f"Erreur terminal : {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur terminal : {str(e)}")

@app.websocket("/terminal/stream")
async def terminal_websocket(websocket: WebSocket):
    """
    🔹 WebSocket /terminal/stream
    Terminal interactif bi-directionnel (optionnel mais recommandé)

    Permet une interaction continue type SSH avec le terminal local
    """
    await websocket.accept()
    logger.info("WebSocket terminal connecté")

    try:
        # Création d'une session terminal PTY
        pty_session = terminal_handler.create_pty_session()

        # Envoi du message de bienvenue
        await websocket.send_json({
            "type": "connected",
            "message": "Terminal interactif MCP - Session active"
        })

        while True:
            # Réception des commandes du client
            data = await websocket.receive_text()

            if data.strip().lower() in ["exit", "quit", "bye"]:
                await websocket.send_json({
                    "type": "info",
                    "message": "Fermeture de la session terminal"
                })
                break

            # Exécution de la commande via PTY
            output = pty_session.execute(data)

            # Envoi du résultat
            await websocket.send_json({
                "type": "output",
                "command": data,
                "result": output
            })

    except WebSocketDisconnect:
        logger.info("WebSocket terminal déconnecté")

    except Exception as e:
        logger.error(f"Erreur WebSocket : {str(e)}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass

    finally:
        # Nettoyage de la session PTY
        if 'pty_session' in locals():
            pty_session.close()

# ============= ÉVÉNEMENTS LIFECYCLE =============

@app.on_event("startup")
async def startup_event():
    """Événement au démarrage du serveur"""
    logger.info("🟣 MCP LM Terminal Server - Démarrage...")
    logger.info(f"📡 LM Studio : {config['lmstudio']['host']}")
    logger.info(f"🖥️  Terminal : Timeout {config['terminal']['timeout']}s")
    logger.info(f"🔒 Auth : Token configuré")

    # Test de connexion LM Studio
    lm_status = await lm_client.check_status()
    if lm_status["connected"]:
        logger.info("✅ LM Studio : Connexion réussie")
    else:
        logger.warning("⚠️  LM Studio : Non disponible (vérifiez que LM Studio est lancé)")

@app.on_event("shutdown")
async def shutdown_event():
    """Événement à l'arrêt du serveur"""
    logger.info("🛑 MCP LM Terminal Server - Arrêt...")
    terminal_handler.cleanup()

# ============= POINT D'ENTRÉE =============

if __name__ == "__main__":
    # Lancement du serveur
    host = config["server"]["host"]
    port = config["server"]["port"]

    logger.info(f"🚀 Démarrage sur {host}:{port}")

    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )
