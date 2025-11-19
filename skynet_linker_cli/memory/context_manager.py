"""
Context Manager - Shared context management for multi-agent collaboration

Manages global and agent-specific contexts stored in Redis.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime


logger = logging.getLogger(__name__)


class ContextManager:
    """
    Manages shared context between AI agents.

    Context types:
    - Global context: Shared knowledge accessible to all agents
    - Agent context: Agent-specific working memory
    - Session context: Tied to a specific collaboration session
    """

    def __init__(self, redis_store):
        """
        Initialize context manager.

        Args:
            redis_store: RedisStore instance
        """
        self.redis = redis_store

    # ========== AGENT CONTEXT ==========

    async def push_context(
        self,
        agent_id: str,
        context_update: Dict[str, Any],
        merge: bool = True
    ) -> bool:
        """
        Push context update for an agent.

        Args:
            agent_id: Agent identifier
            context_update: New context data
            merge: If True, merge with existing context; if False, replace

        Returns:
            True if successful
        """
        try:
            if merge:
                # Merge with existing context
                existing = await self.redis.get_context(agent_id) or {}
                merged = self._merge_contexts(existing, context_update)
                success = await self.redis.set_context(agent_id, merged)
            else:
                # Replace context entirely
                success = await self.redis.set_context(agent_id, context_update)

            if success:
                logger.info(f"Context pushed for {agent_id} (merge={merge})")
            else:
                logger.error(f"Failed to push context for {agent_id}")

            return success

        except Exception as e:
            logger.error(f"Error pushing context for {agent_id}: {e}")
            return False

    async def pull_context(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Pull current context for an agent.

        Args:
            agent_id: Agent identifier

        Returns:
            Context dictionary or None
        """
        try:
            context = await self.redis.get_context(agent_id)

            if context:
                logger.debug(f"Context pulled for {agent_id}")
            else:
                logger.debug(f"No context found for {agent_id}")

            return context

        except Exception as e:
            logger.error(f"Error pulling context for {agent_id}: {e}")
            return None

    async def update_context_field(
        self,
        agent_id: str,
        field: str,
        value: Any
    ) -> bool:
        """
        Update a specific field in agent context.

        Args:
            agent_id: Agent identifier
            field: Field name
            value: New value

        Returns:
            True if successful
        """
        return await self.redis.update_context(agent_id, {field: value})

    async def delete_context(self, agent_id: str) -> bool:
        """
        Delete agent context.

        Args:
            agent_id: Agent identifier

        Returns:
            True if successful
        """
        success = await self.redis.delete_context(agent_id)

        if success:
            logger.info(f"Context deleted for {agent_id}")

        return success

    # ========== GLOBAL CONTEXT ==========

    async def get_global_context(self) -> Dict[str, Any]:
        """
        Get global shared context accessible to all agents.

        Returns:
            Global context dictionary
        """
        return await self.redis.get_context("__global__") or {}

    async def update_global_context(self, updates: Dict[str, Any]) -> bool:
        """
        Update global shared context.

        Args:
            updates: Fields to update

        Returns:
            True if successful
        """
        current = await self.get_global_context()
        merged = self._merge_contexts(current, updates)
        merged["_updated_at"] = datetime.utcnow().isoformat()

        success = await self.redis.set_context("__global__", merged)

        if success:
            logger.info("Global context updated")

        return success

    async def set_global_summary(self, summary: str) -> bool:
        """
        Set global task summary.

        Args:
            summary: Summary text

        Returns:
            True if successful
        """
        return await self.update_global_context({"global_summary": summary})

    async def set_last_user_intent(self, intent: str) -> bool:
        """
        Set last user intent in global context.

        Args:
            intent: User intent description

        Returns:
            True if successful
        """
        return await self.update_global_context({"last_user_intent": intent})

    async def add_shared_knowledge(self, key: str, value: Any) -> bool:
        """
        Add knowledge to global shared knowledge base.

        Args:
            key: Knowledge key
            value: Knowledge value

        Returns:
            True if successful
        """
        global_ctx = await self.get_global_context()
        shared_knowledge = global_ctx.get("shared_knowledge", {})
        shared_knowledge[key] = value

        return await self.update_global_context({"shared_knowledge": shared_knowledge})

    # ========== SESSION CONTEXT ==========

    async def get_session_context(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get context for a specific session.

        Args:
            session_id: Session identifier

        Returns:
            Session context or None
        """
        session = await self.redis.get_session(session_id)
        return session.get("metadata", {}).get("context") if session else None

    async def update_session_context(
        self,
        session_id: str,
        context_updates: Dict[str, Any]
    ) -> bool:
        """
        Update context for a specific session.

        Args:
            session_id: Session identifier
            context_updates: Context updates

        Returns:
            True if successful
        """
        session = await self.redis.get_session(session_id)

        if not session:
            logger.warning(f"Session {session_id} not found")
            return False

        metadata = session.get("metadata", {})
        current_context = metadata.get("context", {})
        merged_context = self._merge_contexts(current_context, context_updates)

        metadata["context"] = merged_context

        return await self.redis.update_session(session_id, {"metadata": metadata})

    # ========== CONTEXT MERGING ==========

    def _merge_contexts(
        self,
        existing: Dict[str, Any],
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Intelligently merge two context dictionaries.

        Args:
            existing: Existing context
            updates: New updates

        Returns:
            Merged context
        """
        merged = existing.copy()

        for key, value in updates.items():
            if key in merged and isinstance(merged[key], dict) and isinstance(value, dict):
                # Recursively merge nested dicts
                merged[key] = self._merge_contexts(merged[key], value)
            elif key in merged and isinstance(merged[key], list) and isinstance(value, list):
                # Append lists (avoid duplicates)
                merged[key] = list(set(merged[key] + value))
            else:
                # Overwrite
                merged[key] = value

        return merged

    # ========== CONTEXT SEARCH & QUERY ==========

    async def search_contexts(self, query: str) -> List[Dict[str, Any]]:
        """
        Search across all agent contexts (simple implementation).

        Args:
            query: Search query string

        Returns:
            List of matching contexts
        """
        # TODO: Implement full-text search
        # For now, just return all contexts containing query string

        results = []

        # This would need to iterate through all context keys
        # For MVP, return empty list
        logger.warning("Context search not fully implemented")

        return results

    async def get_all_agent_contexts(self) -> Dict[str, Dict[str, Any]]:
        """
        Get contexts for all agents (admin/debug).

        Returns:
            Dictionary mapping agent_id -> context
        """
        # This requires scanning Redis keys
        # For MVP, return empty dict
        # TODO: Implement proper key scanning

        logger.warning("get_all_agent_contexts not fully implemented")
        return {}

    # ========== CONTEXT TEMPLATES ==========

    def create_default_context(self, agent_type: str) -> Dict[str, Any]:
        """
        Create default context template based on agent type.

        Args:
            agent_type: Type of agent

        Returns:
            Default context dictionary
        """
        base_context = {
            "agent_type": agent_type,
            "created_at": datetime.utcnow().isoformat(),
            "last_active": datetime.utcnow().isoformat(),
            "message_count": 0,
            "shared_knowledge": {}
        }

        # Agent-specific defaults
        if agent_type == "planner":
            base_context.update({
                "current_plan": None,
                "subtasks": [],
                "dependencies": []
            })
        elif agent_type == "researcher":
            base_context.update({
                "research_topics": [],
                "sources": [],
                "findings": []
            })
        elif agent_type == "coder":
            base_context.update({
                "active_files": [],
                "code_changes": [],
                "test_status": None
            })

        return base_context

    # ========== CONTEXT VALIDATION ==========

    def validate_context(self, context: Dict[str, Any]) -> bool:
        """
        Validate context structure.

        Args:
            context: Context to validate

        Returns:
            True if valid
        """
        # Basic validation
        if not isinstance(context, dict):
            return False

        # Context should not be too large (prevent abuse)
        import json
        context_json = json.dumps(context)
        if len(context_json) > 1_000_000:  # 1MB limit
            logger.warning("Context exceeds size limit")
            return False

        return True
