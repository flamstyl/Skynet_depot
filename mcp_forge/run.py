#!/usr/bin/env python3
"""
MCP Forge - AI Agent Builder
Entry point for the application
"""
from app.server import app
from app.config import Config

if __name__ == '__main__':
    print("=" * 60)
    print("🛠️  MCP Forge - AI Agent Builder")
    print("=" * 60)
    print(f"Starting server on http://{Config.HOST}:{Config.PORT}")
    print(f"Environment: {Config.FLASK_ENV}")
    print(f"Debug mode: {Config.DEBUG}")
    print("=" * 60)

    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )
