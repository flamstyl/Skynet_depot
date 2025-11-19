#!/usr/bin/env python3
"""
Skynet Token Switcher — Application Launcher
Run this file to start the Token Switcher server
"""

import sys
import os

# Add app directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.server import app


def main():
    """Launch the Skynet Token Switcher"""
    print("=" * 60)
    print("🟣 SKYNET TOKEN SWITCHER — Claude & Gemini API Manager")
    print("=" * 60)
    print()
    print("📊 Intelligent API token management and switching")
    print("🔄 Auto-switch based on quota availability")
    print("📈 Real-time usage tracking and monitoring")
    print()
    print("=" * 60)
    print()
    print("🌐 Starting server on http://127.0.0.1:5050")
    print("   Press Ctrl+C to stop")
    print()
    print("=" * 60)
    print()

    try:
        app.run(
            host='127.0.0.1',
            port=5050,
            debug=True,
            use_reloader=True
        )
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down Skynet Token Switcher...")
        print("   Goodbye! 👋")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
