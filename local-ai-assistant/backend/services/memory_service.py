"""
Service de gestion de la mémoire et de l'historique des conversations
Stocke et récupère les sessions de chat avec chiffrement optionnel
"""

import os
import json
import sqlite3
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path
import aiosqlite

from models import Message, SessionInfo, MessageRole
from utils.encryption import get_encryption_service


class MemoryService:
    """Service pour gérer la mémoire et l'historique des conversations"""

    def __init__(self, db_path: str = "data/assistant.db", encryption_enabled: bool = True):
        """
        Initialise le service de mémoire

        Args:
            db_path: Chemin vers la base de données SQLite
            encryption_enabled: Active le chiffrement des données sensibles
        """
        self.db_path = db_path
        self.encryption_enabled = encryption_enabled
        self.encryption_service = get_encryption_service() if encryption_enabled else None

        # Créer le dossier data s'il n'existe pas
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)

        # Initialiser la base de données
        self._init_database()

    def _init_database(self):
        """Initialise les tables de la base de données"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Table des sessions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                created_at TIMESTAMP,
                last_activity TIMESTAMP,
                title TEXT,
                tags TEXT,
                metadata TEXT
            )
        """)

        # Table des messages
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                role TEXT,
                content TEXT,
                timestamp TIMESTAMP,
                metadata TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        """)

        # Table des résumés de pages
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS page_summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT,
                summary TEXT,
                created_at TIMESTAMP,
                session_id TEXT
            )
        """)

        # Index pour améliorer les performances
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_session_id ON messages(session_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_url ON page_summaries(url)")

        conn.commit()
        conn.close()

    async def create_session(
        self,
        session_id: str,
        title: Optional[str] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> SessionInfo:
        """
        Crée une nouvelle session de conversation

        Args:
            session_id: Identifiant unique de la session
            title: Titre optionnel de la session
            tags: Tags optionnels
            metadata: Métadonnées optionnelles

        Returns:
            Informations sur la session créée
        """
        now = datetime.now()
        tags_json = json.dumps(tags or [])
        metadata_json = json.dumps(metadata or {})

        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT OR REPLACE INTO sessions
                (session_id, created_at, last_activity, title, tags, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (session_id, now, now, title, tags_json, metadata_json)
            )
            await db.commit()

        return SessionInfo(
            session_id=session_id,
            created_at=now,
            last_activity=now,
            message_count=0,
            title=title,
            tags=tags or []
        )

    async def add_message(
        self,
        session_id: str,
        role: MessageRole,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Message:
        """
        Ajoute un message à une session

        Args:
            session_id: ID de la session
            role: Rôle du message (user, assistant, system)
            content: Contenu du message
            metadata: Métadonnées optionnelles

        Returns:
            Message créé
        """
        now = datetime.now()

        # Chiffrer le contenu si le chiffrement est activé
        stored_content = content
        if self.encryption_enabled and self.encryption_service:
            stored_content = self.encryption_service.encrypt_string(content)

        metadata_json = json.dumps(metadata or {})

        async with aiosqlite.connect(self.db_path) as db:
            # Insérer le message
            await db.execute(
                """
                INSERT INTO messages (session_id, role, content, timestamp, metadata)
                VALUES (?, ?, ?, ?, ?)
                """,
                (session_id, role.value, stored_content, now, metadata_json)
            )

            # Mettre à jour last_activity de la session
            await db.execute(
                """
                UPDATE sessions SET last_activity = ? WHERE session_id = ?
                """,
                (now, session_id)
            )

            await db.commit()

        return Message(
            role=role,
            content=content,
            timestamp=now,
            metadata=metadata
        )

    async def get_session_messages(
        self,
        session_id: str,
        limit: Optional[int] = None
    ) -> List[Message]:
        """
        Récupère tous les messages d'une session

        Args:
            session_id: ID de la session
            limit: Nombre maximum de messages à récupérer (les plus récents)

        Returns:
            Liste des messages
        """
        query = """
            SELECT role, content, timestamp, metadata
            FROM messages
            WHERE session_id = ?
            ORDER BY timestamp ASC
        """

        if limit:
            query += f" LIMIT {limit}"

        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(query, (session_id,)) as cursor:
                rows = await cursor.fetchall()

        messages = []
        for row in rows:
            role, content, timestamp, metadata_json = row

            # Déchiffrer le contenu si nécessaire
            if self.encryption_enabled and self.encryption_service:
                try:
                    content = self.encryption_service.decrypt_string(content)
                except:
                    # Si le déchiffrement échoue, c'est que le contenu n'était pas chiffré
                    pass

            messages.append(Message(
                role=MessageRole(role),
                content=content,
                timestamp=datetime.fromisoformat(timestamp) if isinstance(timestamp, str) else timestamp,
                metadata=json.loads(metadata_json) if metadata_json else None
            ))

        return messages

    async def get_recent_context(
        self,
        session_id: str,
        max_messages: int = 10
    ) -> List[Dict[str, str]]:
        """
        Récupère le contexte récent pour envoyer à l'IA

        Args:
            session_id: ID de la session
            max_messages: Nombre maximum de messages à inclure

        Returns:
            Liste de messages formatés pour l'IA
        """
        messages = await self.get_session_messages(session_id, limit=max_messages)

        # Convertir en format attendu par les APIs (OpenAI, Anthropic, etc.)
        return [
            {"role": msg.role.value, "content": msg.content}
            for msg in messages
        ]

    async def list_sessions(
        self,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[SessionInfo]:
        """
        Liste toutes les sessions

        Args:
            limit: Nombre maximum de sessions à retourner
            offset: Décalage pour la pagination

        Returns:
            Liste des sessions
        """
        query = """
            SELECT s.session_id, s.created_at, s.last_activity, s.title, s.tags,
                   COUNT(m.id) as message_count
            FROM sessions s
            LEFT JOIN messages m ON s.session_id = m.session_id
            GROUP BY s.session_id
            ORDER BY s.last_activity DESC
        """

        if limit:
            query += f" LIMIT {limit} OFFSET {offset}"

        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(query) as cursor:
                rows = await cursor.fetchall()

        sessions = []
        for row in rows:
            session_id, created_at, last_activity, title, tags_json, message_count = row

            sessions.append(SessionInfo(
                session_id=session_id,
                created_at=datetime.fromisoformat(created_at) if isinstance(created_at, str) else created_at,
                last_activity=datetime.fromisoformat(last_activity) if isinstance(last_activity, str) else last_activity,
                message_count=message_count,
                title=title,
                tags=json.loads(tags_json) if tags_json else []
            ))

        return sessions

    async def get_session_info(self, session_id: str) -> Optional[SessionInfo]:
        """
        Récupère les informations d'une session

        Args:
            session_id: ID de la session

        Returns:
            Informations de la session ou None si non trouvée
        """
        query = """
            SELECT s.session_id, s.created_at, s.last_activity, s.title, s.tags,
                   COUNT(m.id) as message_count
            FROM sessions s
            LEFT JOIN messages m ON s.session_id = m.session_id
            WHERE s.session_id = ?
            GROUP BY s.session_id
        """

        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(query, (session_id,)) as cursor:
                row = await cursor.fetchone()

        if not row:
            return None

        session_id, created_at, last_activity, title, tags_json, message_count = row

        return SessionInfo(
            session_id=session_id,
            created_at=datetime.fromisoformat(created_at) if isinstance(created_at, str) else created_at,
            last_activity=datetime.fromisoformat(last_activity) if isinstance(last_activity, str) else last_activity,
            message_count=message_count,
            title=title,
            tags=json.loads(tags_json) if tags_json else []
        )

    async def save_page_summary(
        self,
        url: str,
        summary: str,
        session_id: str
    ):
        """
        Sauvegarde un résumé de page

        Args:
            url: URL de la page
            summary: Résumé généré
            session_id: ID de la session
        """
        now = datetime.now()

        # Chiffrer le résumé si nécessaire
        stored_summary = summary
        if self.encryption_enabled and self.encryption_service:
            stored_summary = self.encryption_service.encrypt_string(summary)

        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO page_summaries (url, summary, created_at, session_id)
                VALUES (?, ?, ?, ?)
                """,
                (url, stored_summary, now, session_id)
            )
            await db.commit()

    async def get_page_summary(self, url: str) -> Optional[str]:
        """
        Récupère un résumé de page déjà créé

        Args:
            url: URL de la page

        Returns:
            Résumé ou None si non trouvé
        """
        query = """
            SELECT summary FROM page_summaries
            WHERE url = ?
            ORDER BY created_at DESC
            LIMIT 1
        """

        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(query, (url,)) as cursor:
                row = await cursor.fetchone()

        if not row:
            return None

        summary = row[0]

        # Déchiffrer si nécessaire
        if self.encryption_enabled and self.encryption_service:
            try:
                summary = self.encryption_service.decrypt_string(summary)
            except:
                pass

        return summary

    async def delete_session(self, session_id: str):
        """
        Supprime une session et tous ses messages

        Args:
            session_id: ID de la session à supprimer
        """
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
            await db.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
            await db.commit()


# Instance globale du service
memory_service: Optional[MemoryService] = None


def get_memory_service() -> MemoryService:
    """Récupère l'instance du service de mémoire"""
    global memory_service
    if memory_service is None:
        memory_service = MemoryService()
    return memory_service
