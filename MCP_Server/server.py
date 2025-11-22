"""
🟣 MCP_Server — Skynet Local Bridge
Serveur FastAPI qui connecte les IA (ChatGPT, Claude, Gemini) à votre système local
Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
from pathlib import Path

# Charger les variables d'environnement
load_dotenv()

# Configuration
API_KEY = os.getenv("MCP_API_KEY", "CHANGE_ME_SECRET_KEY_2025")
PORT = int(os.getenv("MCP_PORT", "7860"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Configuration du logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Créer l'application FastAPI
app = FastAPI(
    title="MCP Server — Skynet Local Bridge",
    description="Pont entre IA et système local (filesystem, terminal, mémoire)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS pour permettre l'accès depuis ChatGPT/Claude
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production: restreindre aux domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 🔐 Middleware d'authentification
async def verify_api_key(authorization: str = Header(None)):
    """Vérifie la clé API pour chaque requête"""
    if authorization is None:
        raise HTTPException(status_code=401, detail="Missing API key")

    # Supporter plusieurs formats: Bearer, ou directement la clé
    token = authorization.replace("Bearer ", "").strip()

    if token != API_KEY:
        logger.warning(f"Invalid API key attempt: {token[:10]}...")
        raise HTTPException(status_code=403, detail="Invalid API key")

    return True


# Alternative: vérification via body JSON (comme dans les specs)
def verify_auth_in_body(auth: str):
    """Vérifie la clé d'authentification dans le body"""
    if auth != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid auth key")
    return True


# 🌐 Routes principales
@app.get("/")
async def root():
    """Endpoint racine — vérification de santé"""
    return {
        "status": "🟢 MCP Server Online",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "endpoints": [
            "/terminal/execute",
            "/filesystem/read",
            "/filesystem/write",
            "/filesystem/list",
            "/memory/query",
            "/memory/add",
            "/internet/fetch",
            "/sandbox/run"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check pour monitoring"""
    return {
        "status": "healthy",
        "uptime": "running",
        "timestamp": datetime.now().isoformat()
    }


# 📦 Importer les endpoints
from endpoints import filesystem, terminal, memory, internet, docker_sandbox

# Enregistrer les routers
app.include_router(filesystem.router, prefix="/filesystem", tags=["Filesystem"])
app.include_router(terminal.router, prefix="/terminal", tags=["Terminal"])
app.include_router(memory.router, prefix="/memory", tags=["Memory"])
app.include_router(internet.router, prefix="/internet", tags=["Internet"])
app.include_router(docker_sandbox.router, prefix="/sandbox", tags=["Docker Sandbox"])


# 🚨 Gestionnaire d'erreurs global
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Capture toutes les exceptions non gérées"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )


if __name__ == "__main__":
    import uvicorn
    logger.info(f"🚀 Starting MCP Server on port {PORT}")
    logger.info(f"📖 Documentation available at http://localhost:{PORT}/docs")

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=PORT,
        reload=True,  # Auto-reload en développement
        log_level=LOG_LEVEL.lower()
    )
