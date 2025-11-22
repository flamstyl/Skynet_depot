"""
🟣 MCP_Server — Point d'entrée principal
Lance le serveur FastAPI avec uvicorn
"""

import uvicorn
import os
from dotenv import load_dotenv

# Charger la configuration
load_dotenv()

PORT = int(os.getenv("MCP_PORT", "7860"))
HOST = os.getenv("MCP_HOST", "0.0.0.0")
LOG_LEVEL = os.getenv("LOG_LEVEL", "info").lower()
RELOAD = os.getenv("MCP_RELOAD", "true").lower() == "true"


def main():
    """Lance le serveur MCP"""
    print("=" * 60)
    print("🟣 MCP_Server — Skynet Local Bridge")
    print("=" * 60)
    print(f"🌐 Server: http://{HOST}:{PORT}")
    print(f"📖 Documentation: http://localhost:{PORT}/docs")
    print(f"🔑 API Key: Configured from .env")
    print(f"🔄 Auto-reload: {RELOAD}")
    print("=" * 60)

    uvicorn.run(
        "server:app",
        host=HOST,
        port=PORT,
        reload=RELOAD,
        log_level=LOG_LEVEL,
        access_log=True
    )


if __name__ == "__main__":
    main()
