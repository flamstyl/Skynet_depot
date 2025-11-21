#!/usr/bin/env python3
"""
MCP Obsidian Core - n8n Webhook Connector
Envoie des événements à n8n pour synchronisation et automatisation
"""

import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path
import requests

# Configuration
N8N_WEBHOOK_URL = "http://localhost:5678/webhook/mcp-webhook"
TIMEOUT = 10

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("N8NConnector")


class N8NConnector:
    """Connecteur pour envoyer des événements à n8n"""

    def __init__(self, webhook_url: Optional[str] = None):
        """
        Initialise le connecteur

        Args:
            webhook_url: URL du webhook n8n (optionnel)
        """
        self.webhook_url = webhook_url or N8N_WEBHOOK_URL
        logger.info(f"N8N Connector initialisé: {self.webhook_url}")

    def send_event(self, event: Dict[str, Any]) -> bool:
        """
        Envoie un événement au webhook n8n

        Args:
            event: Événement à envoyer

        Returns:
            True si succès, False sinon
        """
        try:
            logger.info(f"Envoi événement à n8n: {event.get('agent')}/{event.get('file')}")

            response = requests.post(
                self.webhook_url,
                json=event,
                timeout=TIMEOUT,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                logger.info(f"Événement envoyé avec succès: {response.json()}")
                return True
            else:
                logger.error(f"Erreur n8n: {response.status_code} - {response.text}")
                return False

        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur connexion n8n: {e}")
            return False
        except Exception as e:
            logger.error(f"Erreur inattendue: {e}")
            return False

    def test_connection(self) -> bool:
        """
        Teste la connexion au webhook n8n

        Returns:
            True si la connexion fonctionne
        """
        test_event = {
            "agent": "Test",
            "file": "test.md",
            "event": "test",
            "timestamp": "2025-11-21T00:00:00",
            "content": "Test connection"
        }

        logger.info("Test de connexion n8n...")
        return self.send_event(test_event)


def main():
    """Point d'entrée principal pour tests"""
    import sys

    connector = N8NConnector()

    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # Mode test
        success = connector.test_connection()
        if success:
            print("✅ Connexion n8n OK")
            sys.exit(0)
        else:
            print("❌ Connexion n8n échouée")
            sys.exit(1)

    elif len(sys.argv) > 1:
        # Envoyer un événement depuis un fichier JSON
        event_file = Path(sys.argv[1])

        if not event_file.exists():
            print(f"Fichier non trouvé: {event_file}")
            sys.exit(1)

        with open(event_file, 'r', encoding='utf-8') as f:
            event = json.load(f)

        success = connector.send_event(event)
        if success:
            print(f"✅ Événement envoyé: {event_file}")
        else:
            print(f"❌ Échec envoi: {event_file}")

    else:
        print("Usage:")
        print("  python webhook.py test              - Teste la connexion")
        print("  python webhook.py <event.json>      - Envoie un événement")


if __name__ == "__main__":
    main()
