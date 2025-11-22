"""
Point d'entrée principal de l'API FastAPI
Assemble tous les routers et configure l'application
"""

import os
import secrets
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

from routers import chat, utils, config
from services.llm_service import get_llm_service, update_llm_service
from services.memory_service import get_memory_service
from utils.encryption import get_encryption_service
from models import ModelProvider

# Token d'authentification pour sécuriser l'API
# En production, ce token devrait être fourni par l'utilisateur lors de l'installation
AUTH_TOKEN = os.getenv("API_AUTH_TOKEN") or secrets.token_urlsafe(32)

# Fichier pour sauvegarder le token
TOKEN_FILE = "data/.api_token"


def get_or_create_token() -> str:
    """Récupère ou crée le token d'authentification"""
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "r") as f:
            return f.read().strip()
    else:
        token = AUTH_TOKEN
        os.makedirs(os.path.dirname(TOKEN_FILE), exist_ok=True)
        with open(TOKEN_FILE, "w") as f:
            f.write(token)
        print(f"\n{'='*60}")
        print(f"🔑 Token d'authentification API généré:")
        print(f"   {token}")
        print(f"\nSauvegardez ce token pour l'extension Chrome et le frontend!")
        print(f"{'='*60}\n")
        return token


# Dépendance pour vérifier le token d'authentification
async def verify_auth_token(authorization: str = Header(None)):
    """Vérifie que le token d'authentification est valide"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token d'authentification manquant")

    # Format attendu: "Bearer <token>"
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Format du token invalide")

    token = authorization.replace("Bearer ", "")
    expected_token = get_or_create_token()

    if token != expected_token:
        raise HTTPException(status_code=401, detail="Token d'authentification invalide")

    return True


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestion du cycle de vie de l'application
    Initialise les services au démarrage
    """
    print("🚀 Démarrage de l'assistant IA local...")

    # Initialiser le token d'authentification
    get_or_create_token()

    # Initialiser les services
    encryption_service = get_encryption_service()
    memory_service = get_memory_service()

    # Charger la configuration et initialiser le LLM
    try:
        config_data = config.load_config()
        provider = ModelProvider(config_data.get("default_provider", "openai"))
        api_key = None

        if provider == ModelProvider.OPENAI:
            api_key = config_data.get("openai_api_key")
        elif provider == ModelProvider.ANTHROPIC:
            api_key = config_data.get("anthropic_api_key")

        update_llm_service(
            provider=provider,
            api_key=api_key,
            model=config_data.get("default_model"),
            custom_url=config_data.get("custom_model_url")
        )

        print("✅ Configuration chargée")
    except Exception as e:
        print(f"⚠️  Impossible de charger la config: {e}")
        print("   Veuillez configurer vos clés API via /api/config")

    print("✅ Services initialisés")
    print("📡 API prête sur http://127.0.0.1:3333")

    yield

    # Nettoyage au shutdown (si nécessaire)
    print("🛑 Arrêt de l'assistant IA local...")


# Créer l'application FastAPI
app = FastAPI(
    title="Assistant IA Personnel Local",
    description="API pour un assistant IA local inspiré de Monica",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS pour permettre l'accès depuis l'extension et le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend React en dev
        "http://localhost:5173",  # Frontend Vite en dev
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "chrome-extension://*",   # Extension Chrome
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routers (avec authentification requise)
app.include_router(
    chat.router,
    dependencies=[Depends(verify_auth_token)]
)
app.include_router(
    utils.router,
    dependencies=[Depends(verify_auth_token)]
)
app.include_router(
    config.router,
    dependencies=[Depends(verify_auth_token)]
)

# Endpoint public pour récupérer le token (seulement en localhost)
@app.get("/api/auth/token")
async def get_token():
    """
    Endpoint pour récupérer le token d'authentification
    Accessible uniquement en localhost pour la première configuration
    """
    return {
        "token": get_or_create_token(),
        "info": "Sauvegardez ce token pour l'extension et le frontend"
    }


# Endpoint de test (sans authentification)
@app.get("/")
async def root():
    """Endpoint racine pour vérifier que l'API fonctionne"""
    return {
        "message": "Assistant IA Personnel Local - API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }


# Servir le frontend statique si disponible
if os.path.exists("../frontend/dist"):
    app.mount("/app", StaticFiles(directory="../frontend/dist"), name="frontend")

    @app.get("/app/{path:path}")
    async def serve_frontend(path: str):
        file_path = f"../frontend/dist/{path}"
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse("../frontend/dist/index.html")


if __name__ == "__main__":
    # Lancer le serveur
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=3333,
        reload=True,  # Hot reload en développement
        log_level="info"
    )
