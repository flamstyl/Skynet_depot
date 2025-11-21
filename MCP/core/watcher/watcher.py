#!/usr/bin/env python3
"""
MCP Obsidian Core - Watcher
Surveille les modifications de fichiers Markdown et génère des événements
"""

import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import logging
import sys

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler, FileSystemEvent
except ImportError:
    print("ERROR: watchdog not installed. Run: pip install watchdog")
    sys.exit(1)


# Configuration
MCP_ROOT = Path(__file__).parent.parent.parent
AGENTS = ["Claude", "Gemini", "GPT"]
WATCHED_EXTENSIONS = [".md"]
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    handlers=[
        logging.FileHandler(MCP_ROOT / "core" / "watcher" / "watcher.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("MCPWatcher")


class MCPEventHandler(FileSystemEventHandler):
    """Handler pour les événements de modification de fichiers"""

    def __init__(self, agent_name: str, dispatcher_queue: Optional[list] = None):
        """
        Initialise le handler

        Args:
            agent_name: Nom de l'agent (Claude, Gemini, GPT)
            dispatcher_queue: Queue pour envoyer les événements au dispatcher
        """
        super().__init__()
        self.agent_name = agent_name
        self.dispatcher_queue = dispatcher_queue if dispatcher_queue is not None else []
        logger.info(f"Handler initialisé pour agent: {agent_name}")

    def _should_process(self, path: str) -> bool:
        """
        Détermine si un fichier doit être traité

        Args:
            path: Chemin du fichier

        Returns:
            True si le fichier doit être traité
        """
        path_obj = Path(path)

        # Vérifier l'extension
        if path_obj.suffix not in WATCHED_EXTENSIONS:
            return False

        # Ignorer les fichiers temporaires
        if path_obj.name.startswith('.') or path_obj.name.endswith('~'):
            return False

        # Ignorer log_raw (trop de modifications)
        if 'log_raw' in path_obj.parts:
            return False

        return True

    def _create_event(self, event: FileSystemEvent, event_type: str) -> Dict[str, Any]:
        """
        Crée un événement uniforme pour le dispatcher

        Args:
            event: Événement watchdog
            event_type: Type d'événement (created, modified, deleted)

        Returns:
            Dictionnaire d'événement standardisé
        """
        path = Path(event.src_path)

        # Lire le contenu si le fichier existe
        content = ""
        if event_type != "deleted" and path.exists() and path.is_file():
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception as e:
                logger.error(f"Erreur lecture fichier {path}: {e}")

        # Créer l'événement
        mcp_event = {
            "agent": self.agent_name,
            "file": path.name,
            "path": str(path),
            "event": event_type,
            "timestamp": datetime.now().isoformat(),
            "content": content,
            "metadata": {
                "is_directory": event.is_directory,
                "file_size": path.stat().st_size if path.exists() else 0
            }
        }

        return mcp_event

    def _process_event(self, event: FileSystemEvent, event_type: str):
        """
        Traite un événement et l'envoie au dispatcher

        Args:
            event: Événement watchdog
            event_type: Type d'événement
        """
        if not self._should_process(event.src_path):
            return

        # Créer l'événement MCP
        mcp_event = self._create_event(event, event_type)

        # Logger
        logger.info(f"Événement détecté: {self.agent_name}/{mcp_event['file']} - {event_type}")

        # Envoyer au dispatcher
        self.dispatcher_queue.append(mcp_event)

        # Sauvegarder l'événement dans un fichier JSON
        self._save_event(mcp_event)

    def _save_event(self, event: Dict[str, Any]):
        """
        Sauvegarde un événement dans un fichier JSON

        Args:
            event: Événement à sauvegarder
        """
        # Créer le dossier d'événements si nécessaire
        events_dir = MCP_ROOT / self.agent_name / "memory" / "events"
        events_dir.mkdir(parents=True, exist_ok=True)

        # Nom du fichier basé sur le timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        event_file = events_dir / f"event_{timestamp}.json"

        # Sauvegarder
        try:
            with open(event_file, 'w', encoding='utf-8') as f:
                json.dump(event, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Erreur sauvegarde événement: {e}")

    def on_created(self, event: FileSystemEvent):
        """Fichier créé"""
        if not event.is_directory:
            self._process_event(event, "created")

    def on_modified(self, event: FileSystemEvent):
        """Fichier modifié"""
        if not event.is_directory:
            self._process_event(event, "modified")

    def on_deleted(self, event: FileSystemEvent):
        """Fichier supprimé"""
        if not event.is_directory:
            self._process_event(event, "deleted")


class MCPWatcher:
    """Watcher principal pour surveiller tous les agents"""

    def __init__(self):
        """Initialise le watcher"""
        self.observer = Observer()
        self.dispatcher_queue = []
        self.handlers = {}

        logger.info("MCPWatcher initialisé")

    def start(self):
        """Démarre la surveillance de tous les agents"""
        logger.info("Démarrage du watcher...")

        for agent in AGENTS:
            agent_path = MCP_ROOT / agent

            if not agent_path.exists():
                logger.warning(f"Agent path not found: {agent_path}")
                continue

            # Créer le handler pour cet agent
            handler = MCPEventHandler(agent, self.dispatcher_queue)
            self.handlers[agent] = handler

            # Surveiller le dossier de l'agent
            self.observer.schedule(handler, str(agent_path), recursive=True)
            logger.info(f"Surveillance activée pour: {agent} ({agent_path})")

        # Démarrer l'observer
        self.observer.start()
        logger.info("Watcher démarré avec succès")

        try:
            while True:
                time.sleep(1)

                # Traiter la queue du dispatcher (TODO: implémenter dispatcher)
                if self.dispatcher_queue:
                    events_count = len(self.dispatcher_queue)
                    logger.debug(f"{events_count} événement(s) en queue")

                    # Pour le moment, juste vider la queue
                    # TODO: Envoyer au dispatcher
                    self.dispatcher_queue.clear()

        except KeyboardInterrupt:
            logger.info("Arrêt demandé par l'utilisateur")
            self.stop()

    def stop(self):
        """Arrête la surveillance"""
        logger.info("Arrêt du watcher...")
        self.observer.stop()
        self.observer.join()
        logger.info("Watcher arrêté")


def load_rules() -> Dict[str, Any]:
    """
    Charge les règles de configuration depuis rules.json

    Returns:
        Dictionnaire de configuration
    """
    rules_file = MCP_ROOT / "core" / "watcher" / "rules.json"

    if not rules_file.exists():
        logger.warning(f"rules.json not found at {rules_file}, using defaults")
        return {
            "agents": AGENTS,
            "watch_extensions": WATCHED_EXTENSIONS,
            "auto_actions": {}
        }

    try:
        with open(rules_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading rules.json: {e}")
        return {}


def main():
    """Point d'entrée principal"""
    logger.info("=" * 60)
    logger.info("MCP Obsidian Core - Watcher v1.0.0")
    logger.info("=" * 60)
    logger.info(f"MCP Root: {MCP_ROOT}")
    logger.info(f"Agents: {', '.join(AGENTS)}")
    logger.info(f"Extensions surveillées: {', '.join(WATCHED_EXTENSIONS)}")
    logger.info("=" * 60)

    # Charger les règles
    rules = load_rules()
    logger.info(f"Règles chargées: {len(rules)} paramètres")

    # Créer et démarrer le watcher
    watcher = MCPWatcher()

    try:
        watcher.start()
    except Exception as e:
        logger.error(f"Erreur fatale: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
