#!/usr/bin/env python3
"""
MCP Obsidian Core - Dispatcher
Traite les événements du watcher et orchestre les actions des agents
"""

import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable
import re

# Configuration
MCP_ROOT = Path(__file__).parent.parent.parent
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    handlers=[
        logging.FileHandler(MCP_ROOT / "core" / "watcher" / "dispatcher.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("MCPDispatcher")


class AgentContext:
    """Contexte d'un agent chargé depuis ses fichiers Markdown"""

    def __init__(self, agent_name: str):
        """
        Initialise le contexte de l'agent

        Args:
            agent_name: Nom de l'agent
        """
        self.agent_name = agent_name
        self.agent_path = MCP_ROOT / agent_name

        self.directives = ""
        self.context = ""
        self.tasks = []

        self._load()

    def _load(self):
        """Charge les fichiers de configuration de l'agent"""
        logger.info(f"Chargement du contexte pour {self.agent_name}")

        # Charger directives.md
        directives_file = self.agent_path / "directives.md"
        if directives_file.exists():
            with open(directives_file, 'r', encoding='utf-8') as f:
                self.directives = f.read()
            logger.debug(f"Directives chargées: {len(self.directives)} chars")

        # Charger context.md
        context_file = self.agent_path / "context.md"
        if context_file.exists():
            with open(context_file, 'r', encoding='utf-8') as f:
                self.context = f.read()
            logger.debug(f"Contexte chargé: {len(self.context)} chars")

        # Charger tasks.md
        tasks_file = self.agent_path / "tasks.md"
        if tasks_file.exists():
            with open(tasks_file, 'r', encoding='utf-8') as f:
                tasks_content = f.read()
                self.tasks = self._parse_tasks(tasks_content)
            logger.debug(f"Tâches chargées: {len(self.tasks)} tâches")

    def _parse_tasks(self, content: str) -> List[Dict[str, Any]]:
        """
        Parse le fichier tasks.md et extrait les tâches

        Args:
            content: Contenu du fichier tasks.md

        Returns:
            Liste de tâches
        """
        tasks = []
        # Pattern: - [ ] ou - [x] suivi du texte de la tâche
        pattern = r'^- \[([ x])\] (.+)$'

        for line in content.split('\n'):
            match = re.match(pattern, line)
            if match:
                completed = match.group(1) == 'x'
                task_text = match.group(2)

                # Extraire le timestamp si présent
                timestamp_match = re.search(r'— Fait le (.+)$', task_text)
                timestamp = timestamp_match.group(1) if timestamp_match else None
                if timestamp:
                    task_text = task_text[:timestamp_match.start()].strip()

                tasks.append({
                    "text": task_text,
                    "completed": completed,
                    "timestamp": timestamp,
                    "raw": line
                })

        return tasks

    def get_pending_tasks(self) -> List[Dict[str, Any]]:
        """
        Retourne les tâches en attente

        Returns:
            Liste des tâches non complétées
        """
        return [task for task in self.tasks if not task['completed']]

    def reload(self):
        """Recharge le contexte de l'agent"""
        self._load()


class ActionHandler:
    """Gère l'exécution des actions en réponse aux événements"""

    def __init__(self, agent_name: str):
        """
        Initialise le handler d'actions

        Args:
            agent_name: Nom de l'agent
        """
        self.agent_name = agent_name
        self.agent_path = MCP_ROOT / agent_name
        self.context = AgentContext(agent_name)

    def handle_directives_modified(self, event: Dict[str, Any]):
        """
        Gère la modification de directives.md

        Args:
            event: Événement de modification
        """
        logger.info(f"[{self.agent_name}] Directives modifiées - Rechargement du contexte")

        # Recharger le contexte
        self.context.reload()

        # Logger l'action
        self._log_action(
            "directives_reload",
            f"Directives rechargées suite à modification de {event['file']}"
        )

        # TODO: Notifier l'agent du changement
        # TODO: Déclencher webhook n8n si configuré

    def handle_context_modified(self, event: Dict[str, Any]):
        """
        Gère la modification de context.md

        Args:
            event: Événement de modification
        """
        logger.info(f"[{self.agent_name}] Contexte modifié - Mise à jour")

        # Recharger le contexte
        self.context.reload()

        # Logger l'action
        self._log_action(
            "context_update",
            f"Contexte mis à jour suite à modification de {event['file']}"
        )

        # TODO: Mettre à jour le RAG avec le nouveau contexte
        # TODO: Notifier l'agent

    def handle_tasks_modified(self, event: Dict[str, Any]):
        """
        Gère la modification de tasks.md

        Args:
            event: Événement de modification
        """
        logger.info(f"[{self.agent_name}] Tasks modifiées - Analyse")

        # Recharger les tâches
        self.context.reload()

        # Obtenir les tâches en attente
        pending_tasks = self.context.get_pending_tasks()

        logger.info(f"[{self.agent_name}] {len(pending_tasks)} tâche(s) en attente")

        # Logger l'action
        self._log_action(
            "tasks_check",
            f"{len(pending_tasks)} tâche(s) en attente détectée(s)"
        )

        # TODO: Pour chaque tâche, créer un prompt pour l'agent
        for task in pending_tasks:
            logger.info(f"[{self.agent_name}] Tâche en attente: {task['text']}")
            # TODO: Envoyer au système d'exécution de l'agent

    def handle_memory_created(self, event: Dict[str, Any]):
        """
        Gère la création d'un fichier de mémoire

        Args:
            event: Événement de création
        """
        logger.info(f"[{self.agent_name}] Nouveau fichier mémoire: {event['file']}")

        # Logger l'action
        self._log_action(
            "memory_created",
            f"Nouveau fichier mémoire créé: {event['file']}"
        )

        # TODO: Indexer dans le RAG

    def handle_output_created(self, event: Dict[str, Any]):
        """
        Gère la création d'un fichier de sortie

        Args:
            event: Événement de création
        """
        logger.info(f"[{self.agent_name}] Nouvelle sortie: {event['file']}")

        # Logger l'action
        self._log_action(
            "output_created",
            f"Nouvelle sortie générée: {event['file']}"
        )

        # TODO: Déclencher synchronisation n8n

    def _log_action(self, action_type: str, message: str):
        """
        Enregistre une action dans le journal de l'agent

        Args:
            action_type: Type d'action
            message: Message à logger
        """
        # Créer le dossier memory si nécessaire
        memory_dir = self.agent_path / "memory"
        memory_dir.mkdir(parents=True, exist_ok=True)

        # Nom du fichier journal du jour
        today = datetime.now().strftime("%Y-%m-%d")
        journal_file = memory_dir / f"journal_{today}.md"

        # Créer ou ajouter au journal
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"\n## {timestamp} — {action_type}\n\n{message}\n"

        with open(journal_file, 'a', encoding='utf-8') as f:
            f.write(log_entry)

        logger.debug(f"Action loggée dans {journal_file}")


class Dispatcher:
    """Dispatcher principal qui route les événements vers les handlers appropriés"""

    def __init__(self):
        """Initialise le dispatcher"""
        self.handlers: Dict[str, ActionHandler] = {}
        self.rules = self._load_rules()

        logger.info("Dispatcher initialisé")

    def _load_rules(self) -> Dict[str, Any]:
        """
        Charge les règles de routing depuis rules.json

        Returns:
            Dictionnaire de règles
        """
        rules_file = MCP_ROOT / "core" / "watcher" / "rules.json"

        if not rules_file.exists():
            logger.warning("rules.json not found, using default rules")
            return {
                "auto_actions": {
                    "tasks_modified": "dispatch_task_check",
                    "directives_modified": "reload_agent_config",
                    "context_modified": "update_agent_context"
                }
            }

        try:
            with open(rules_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading rules: {e}")
            return {}

    def get_handler(self, agent_name: str) -> ActionHandler:
        """
        Obtient ou crée le handler pour un agent

        Args:
            agent_name: Nom de l'agent

        Returns:
            Handler de l'agent
        """
        if agent_name not in self.handlers:
            self.handlers[agent_name] = ActionHandler(agent_name)

        return self.handlers[agent_name]

    def dispatch(self, event: Dict[str, Any]):
        """
        Dispatche un événement vers le handler approprié

        Args:
            event: Événement à traiter
        """
        agent_name = event.get('agent')
        file_name = event.get('file')
        event_type = event.get('event')

        logger.info(f"Dispatch: {agent_name}/{file_name} - {event_type}")

        # Obtenir le handler de l'agent
        handler = self.get_handler(agent_name)

        # Router selon le fichier modifié
        if file_name == 'directives.md':
            handler.handle_directives_modified(event)
        elif file_name == 'context.md':
            handler.handle_context_modified(event)
        elif file_name == 'tasks.md':
            handler.handle_tasks_modified(event)
        elif file_name.startswith('journal_'):
            if event_type == 'created':
                handler.handle_memory_created(event)
        elif 'output' in event.get('path', ''):
            if event_type == 'created':
                handler.handle_output_created(event)
        else:
            logger.debug(f"No specific handler for {file_name}")

    def process_events_queue(self, events_dir: Path):
        """
        Traite les événements stockés dans les fichiers JSON

        Args:
            events_dir: Répertoire contenant les événements
        """
        # Trouver tous les fichiers d'événements
        event_files = sorted(events_dir.glob("event_*.json"))

        logger.info(f"Traitement de {len(event_files)} événement(s)")

        for event_file in event_files:
            try:
                # Charger l'événement
                with open(event_file, 'r', encoding='utf-8') as f:
                    event = json.load(f)

                # Dispatcher l'événement
                self.dispatch(event)

                # Supprimer ou archiver l'événement traité
                # TODO: Archiver au lieu de supprimer
                event_file.unlink()

            except Exception as e:
                logger.error(f"Error processing event {event_file}: {e}")


def main():
    """Point d'entrée principal"""
    logger.info("=" * 60)
    logger.info("MCP Obsidian Core - Dispatcher v1.0.0")
    logger.info("=" * 60)

    # Créer le dispatcher
    dispatcher = Dispatcher()

    # Mode de fonctionnement
    if len(sys.argv) > 1 and sys.argv[1] == "--watch":
        # Mode surveillance continue
        logger.info("Mode: Surveillance continue")

        try:
            import time
            while True:
                # Vérifier les événements pour chaque agent
                for agent in ["Claude", "Gemini", "GPT"]:
                    events_dir = MCP_ROOT / agent / "memory" / "events"
                    if events_dir.exists():
                        dispatcher.process_events_queue(events_dir)

                time.sleep(2)  # Vérifier toutes les 2 secondes

        except KeyboardInterrupt:
            logger.info("Arrêt demandé par l'utilisateur")

    else:
        # Mode traitement unique
        logger.info("Mode: Traitement unique des événements en queue")

        for agent in ["Claude", "Gemini", "GPT"]:
            events_dir = MCP_ROOT / agent / "memory" / "events"
            if events_dir.exists():
                dispatcher.process_events_queue(events_dir)

        logger.info("Traitement terminé")


if __name__ == "__main__":
    main()
