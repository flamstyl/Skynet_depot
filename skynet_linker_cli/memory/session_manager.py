"""
Session Manager - Multi-agent collaboration session management

Manages sessions where multiple agents collaborate on tasks.
"""

import logging
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta


logger = logging.getLogger(__name__)


class SessionManager:
    """
    Manages collaboration sessions between AI agents.

    A session represents a coordinated multi-agent workflow with:
    - Participants (agent IDs)
    - Shared goal/task
    - Message history
    - Session state
    """

    def __init__(self, redis_store):
        """
        Initialize session manager.

        Args:
            redis_store: RedisStore instance
        """
        self.redis = redis_store

    # ========== SESSION LIFECYCLE ==========

    async def create_session(
        self,
        participants: List[str],
        goal: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None
    ) -> str:
        """
        Create a new collaboration session.

        Args:
            participants: List of agent IDs participating
            goal: Session goal/objective
            metadata: Additional metadata
            session_id: Optional custom session ID (auto-generated if None)

        Returns:
            Session ID
        """
        if not participants:
            raise ValueError("Session must have at least one participant")

        session_id = session_id or str(uuid.uuid4())

        session_metadata = metadata or {}
        session_metadata.update({
            "participants": participants,
            "goal": goal,
            "created_at": datetime.utcnow().isoformat()
        })

        success = await self.redis.create_session(session_id, session_metadata)

        if success:
            logger.info(f"✅ Session created: {session_id} (participants: {participants})")
        else:
            logger.error(f"Failed to create session {session_id}")
            raise RuntimeError("Failed to create session")

        return session_id

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session information.

        Args:
            session_id: Session identifier

        Returns:
            Session dictionary or None
        """
        session = await self.redis.get_session(session_id)

        if not session:
            logger.warning(f"Session {session_id} not found")

        return session

    async def update_session(
        self,
        session_id: str,
        updates: Dict[str, Any]
    ) -> bool:
        """
        Update session metadata.

        Args:
            session_id: Session identifier
            updates: Fields to update

        Returns:
            True if successful
        """
        success = await self.redis.update_session(session_id, updates)

        if success:
            logger.debug(f"Session {session_id} updated")
        else:
            logger.error(f"Failed to update session {session_id}")

        return success

    async def close_session(self, session_id: str, summary: Optional[str] = None) -> bool:
        """
        Mark session as completed/closed.

        Args:
            session_id: Session identifier
            summary: Optional summary of session outcome

        Returns:
            True if successful
        """
        updates = {
            "status": "completed",
            "closed_at": datetime.utcnow().isoformat()
        }

        if summary:
            updates["summary"] = summary

        success = await self.redis.update_session(session_id, updates)

        if success:
            logger.info(f"✅ Session closed: {session_id}")

        return success

    async def pause_session(self, session_id: str) -> bool:
        """
        Pause an active session.

        Args:
            session_id: Session identifier

        Returns:
            True if successful
        """
        return await self.update_session(session_id, {
            "status": "paused",
            "paused_at": datetime.utcnow().isoformat()
        })

    async def resume_session(self, session_id: str) -> bool:
        """
        Resume a paused session.

        Args:
            session_id: Session identifier

        Returns:
            True if successful
        """
        return await self.update_session(session_id, {
            "status": "active",
            "resumed_at": datetime.utcnow().isoformat()
        })

    # ========== PARTICIPANT MANAGEMENT ==========

    async def add_participant(self, session_id: str, agent_id: str) -> bool:
        """
        Add a participant to an existing session.

        Args:
            session_id: Session identifier
            agent_id: Agent to add

        Returns:
            True if successful
        """
        session = await self.get_session(session_id)

        if not session:
            return False

        participants = session.get("participants", [])

        if agent_id in participants:
            logger.warning(f"Agent {agent_id} already in session {session_id}")
            return True

        participants.append(agent_id)

        success = await self.update_session(session_id, {"participants": participants})

        if success:
            logger.info(f"Agent {agent_id} added to session {session_id}")

        return success

    async def remove_participant(self, session_id: str, agent_id: str) -> bool:
        """
        Remove a participant from a session.

        Args:
            session_id: Session identifier
            agent_id: Agent to remove

        Returns:
            True if successful
        """
        session = await self.get_session(session_id)

        if not session:
            return False

        participants = session.get("participants", [])

        if agent_id not in participants:
            logger.warning(f"Agent {agent_id} not in session {session_id}")
            return True

        participants.remove(agent_id)

        success = await self.update_session(session_id, {"participants": participants})

        if success:
            logger.info(f"Agent {agent_id} removed from session {session_id}")

        return success

    async def get_participants(self, session_id: str) -> List[str]:
        """
        Get list of session participants.

        Args:
            session_id: Session identifier

        Returns:
            List of agent IDs
        """
        session = await self.get_session(session_id)

        if not session:
            return []

        return session.get("participants", [])

    # ========== SESSION QUERIES ==========

    async def get_active_sessions(self) -> List[Dict[str, Any]]:
        """
        Get all active sessions.

        Returns:
            List of active session dictionaries
        """
        # TODO: Implement Redis key scanning for sessions
        # For MVP, return empty list
        logger.warning("get_active_sessions not fully implemented")
        return []

    async def get_sessions_for_agent(self, agent_id: str) -> List[Dict[str, Any]]:
        """
        Get all sessions involving a specific agent.

        Args:
            agent_id: Agent identifier

        Returns:
            List of session dictionaries
        """
        # TODO: Implement reverse lookup
        logger.warning("get_sessions_for_agent not fully implemented")
        return []

    async def get_session_count(self, status: Optional[str] = None) -> int:
        """
        Get count of sessions by status.

        Args:
            status: Filter by status (active, paused, completed) or None for all

        Returns:
            Session count
        """
        # TODO: Implement efficient counting
        logger.warning("get_session_count not fully implemented")
        return 0

    # ========== SESSION MESSAGES ==========

    async def add_message_to_session(
        self,
        session_id: str,
        message: Dict[str, Any]
    ) -> bool:
        """
        Log a message in session history.

        Args:
            session_id: Session identifier
            message: MCP message dictionary

        Returns:
            True if successful
        """
        session = await self.get_session(session_id)

        if not session:
            logger.warning(f"Session {session_id} not found")
            return False

        # Increment message count
        message_count = int(session.get("message_count", 0)) + 1

        # Store message reference
        message_ref = {
            "from": message.get("from_agent"),
            "to": message.get("to_agent"),
            "timestamp": message.get("timestamp"),
            "message_id": message.get("id"),
            "type": message.get("type")
        }

        # Update session
        await self.update_session(session_id, {
            "message_count": message_count,
            "last_message_at": datetime.utcnow().isoformat()
        })

        logger.debug(f"Message logged in session {session_id}")
        return True

    async def get_session_messages(
        self,
        session_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get messages for a session.

        Args:
            session_id: Session identifier
            limit: Maximum messages to return

        Returns:
            List of message dictionaries
        """
        # TODO: Implement message retrieval from session
        # For MVP, reconstruct from agent histories
        logger.warning("get_session_messages not fully implemented")
        return []

    # ========== SESSION ANALYTICS ==========

    async def get_session_duration(self, session_id: str) -> Optional[timedelta]:
        """
        Calculate session duration.

        Args:
            session_id: Session identifier

        Returns:
            Duration as timedelta or None
        """
        session = await self.get_session(session_id)

        if not session:
            return None

        created_at = datetime.fromisoformat(session["created_at"])

        if session.get("status") == "completed":
            closed_at = datetime.fromisoformat(session.get("closed_at", datetime.utcnow().isoformat()))
            return closed_at - created_at
        else:
            # Ongoing session
            return datetime.utcnow() - created_at

    async def get_session_stats(self, session_id: str) -> Dict[str, Any]:
        """
        Get session statistics.

        Args:
            session_id: Session identifier

        Returns:
            Statistics dictionary
        """
        session = await self.get_session(session_id)

        if not session:
            return {}

        duration = await self.get_session_duration(session_id)

        return {
            "session_id": session_id,
            "status": session.get("status"),
            "participants": session.get("participants", []),
            "participant_count": len(session.get("participants", [])),
            "message_count": session.get("message_count", 0),
            "duration_seconds": duration.total_seconds() if duration else None,
            "created_at": session.get("created_at"),
            "closed_at": session.get("closed_at")
        }

    # ========== SESSION TEMPLATES ==========

    def create_research_session(
        self,
        researchers: List[str],
        topic: str
    ) -> Dict[str, Any]:
        """
        Create template for research session.

        Args:
            researchers: List of researcher agent IDs
            topic: Research topic

        Returns:
            Session metadata template
        """
        return {
            "type": "research",
            "participants": researchers,
            "goal": f"Research on: {topic}",
            "metadata": {
                "topic": topic,
                "workflow": ["search", "analyze", "summarize"],
                "deliverables": ["findings", "summary", "sources"]
            }
        }

    def create_coding_session(
        self,
        coder: str,
        reviewer: str,
        task: str
    ) -> Dict[str, Any]:
        """
        Create template for coding session.

        Args:
            coder: Coder agent ID
            reviewer: Reviewer agent ID
            task: Coding task description

        Returns:
            Session metadata template
        """
        return {
            "type": "coding",
            "participants": [coder, reviewer],
            "goal": f"Code task: {task}",
            "metadata": {
                "task": task,
                "workflow": ["implement", "review", "iterate"],
                "deliverables": ["code", "tests", "documentation"]
            }
        }
