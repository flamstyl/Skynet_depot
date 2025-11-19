"""
Redis Store - Memory backend for MCP Server

Handles all Redis operations for context, sessions, history, and presence.
"""

import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import redis.asyncio as aioredis
from redis.exceptions import RedisError


logger = logging.getLogger(__name__)


class RedisStore:
    """
    Redis-based storage for MCP server.

    Namespaces:
    - context:<agent_id> - Current context (hash)
    - session:<session_id> - Session state (hash)
    - history:<agent_id> - Message history (list, FIFO)
    - presence:<agent_id> - Online status (string + TTL)
    - channel:<channel_name> - PubSub for broadcasts
    - snapshot:<timestamp> - Full state snapshots
    """

    def __init__(self, redis_url: str = "redis://localhost:6379/0", max_history: int = 1000):
        """
        Initialize Redis store.

        Args:
            redis_url: Redis connection URL
            max_history: Maximum messages to keep in history per agent
        """
        self.redis_url = redis_url
        self.max_history = max_history
        self.redis: Optional[aioredis.Redis] = None

    async def connect(self):
        """Establish Redis connection pool"""
        try:
            self.redis = await aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=50
            )
            await self.redis.ping()
            logger.info(f"✅ Connected to Redis: {self.redis_url}")
        except RedisError as e:
            logger.error(f"❌ Redis connection failed: {e}")
            raise

    async def disconnect(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            logger.info("Redis connection closed")

    # ========== CONTEXT MANAGEMENT ==========

    async def set_context(self, agent_id: str, context: Dict[str, Any]) -> bool:
        """
        Set context for an agent.

        Args:
            agent_id: Agent identifier
            context: Context dictionary

        Returns:
            True if successful
        """
        try:
            key = f"context:{agent_id}"

            # Add metadata
            context["_updated_at"] = datetime.utcnow().isoformat()
            context["_agent_id"] = agent_id

            # Store as JSON string in hash
            await self.redis.hset(
                key,
                mapping={k: json.dumps(v) if not isinstance(v, str) else v for k, v in context.items()}
            )

            logger.debug(f"Context set for {agent_id}")
            return True

        except RedisError as e:
            logger.error(f"Failed to set context for {agent_id}: {e}")
            return False

    async def get_context(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Get context for an agent.

        Args:
            agent_id: Agent identifier

        Returns:
            Context dictionary or None
        """
        try:
            key = f"context:{agent_id}"
            data = await self.redis.hgetall(key)

            if not data:
                return None

            # Deserialize JSON values
            context = {}
            for k, v in data.items():
                try:
                    context[k] = json.loads(v)
                except (json.JSONDecodeError, TypeError):
                    context[k] = v

            return context

        except RedisError as e:
            logger.error(f"Failed to get context for {agent_id}: {e}")
            return None

    async def update_context(self, agent_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update specific fields in agent context.

        Args:
            agent_id: Agent identifier
            updates: Fields to update

        Returns:
            True if successful
        """
        try:
            key = f"context:{agent_id}"
            updates["_updated_at"] = datetime.utcnow().isoformat()

            await self.redis.hset(
                key,
                mapping={k: json.dumps(v) if not isinstance(v, str) else v for k, v in updates.items()}
            )

            return True

        except RedisError as e:
            logger.error(f"Failed to update context for {agent_id}: {e}")
            return False

    async def delete_context(self, agent_id: str) -> bool:
        """Delete agent context"""
        try:
            await self.redis.delete(f"context:{agent_id}")
            return True
        except RedisError as e:
            logger.error(f"Failed to delete context for {agent_id}: {e}")
            return False

    # ========== HISTORY MANAGEMENT ==========

    async def append_history(self, agent_id: str, message: Dict[str, Any]) -> bool:
        """
        Append message to agent history (FIFO list).

        Args:
            agent_id: Agent identifier
            message: Message dictionary

        Returns:
            True if successful
        """
        try:
            key = f"history:{agent_id}"
            message_json = json.dumps(message)

            # Add to list (right push)
            await self.redis.rpush(key, message_json)

            # Trim to max_history (keep recent messages)
            await self.redis.ltrim(key, -self.max_history, -1)

            logger.debug(f"Message added to history for {agent_id}")
            return True

        except RedisError as e:
            logger.error(f"Failed to append history for {agent_id}: {e}")
            return False

    async def get_history(self, agent_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get recent message history for agent.

        Args:
            agent_id: Agent identifier
            limit: Number of recent messages to retrieve

        Returns:
            List of message dictionaries (most recent last)
        """
        try:
            key = f"history:{agent_id}"

            # Get last N messages (negative indexing)
            messages_json = await self.redis.lrange(key, -limit, -1)

            messages = []
            for msg_json in messages_json:
                try:
                    messages.append(json.loads(msg_json))
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON in history: {msg_json[:100]}")

            return messages

        except RedisError as e:
            logger.error(f"Failed to get history for {agent_id}: {e}")
            return []

    async def clear_history(self, agent_id: str) -> bool:
        """Clear message history for agent"""
        try:
            await self.redis.delete(f"history:{agent_id}")
            return True
        except RedisError as e:
            logger.error(f"Failed to clear history for {agent_id}: {e}")
            return False

    # ========== SESSION MANAGEMENT ==========

    async def create_session(self, session_id: str, metadata: Dict[str, Any]) -> bool:
        """
        Create a new session.

        Args:
            session_id: Session identifier
            metadata: Session metadata (participants, goal, etc.)

        Returns:
            True if successful
        """
        try:
            key = f"session:{session_id}"

            session_data = {
                "session_id": session_id,
                "created_at": datetime.utcnow().isoformat(),
                "status": "active",
                "participants": json.dumps(metadata.get("participants", [])),
                "metadata": json.dumps(metadata),
                "message_count": 0
            }

            await self.redis.hset(key, mapping=session_data)
            logger.info(f"Session created: {session_id}")
            return True

        except RedisError as e:
            logger.error(f"Failed to create session {session_id}: {e}")
            return False

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data"""
        try:
            key = f"session:{session_id}"
            data = await self.redis.hgetall(key)

            if not data:
                return None

            # Deserialize JSON fields
            session = dict(data)
            for field in ["participants", "metadata"]:
                if field in session:
                    try:
                        session[field] = json.loads(session[field])
                    except json.JSONDecodeError:
                        pass

            return session

        except RedisError as e:
            logger.error(f"Failed to get session {session_id}: {e}")
            return None

    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Update session fields"""
        try:
            key = f"session:{session_id}"
            updates["updated_at"] = datetime.utcnow().isoformat()

            # Serialize complex types
            serialized = {}
            for k, v in updates.items():
                if isinstance(v, (dict, list)):
                    serialized[k] = json.dumps(v)
                else:
                    serialized[k] = v

            await self.redis.hset(key, mapping=serialized)
            return True

        except RedisError as e:
            logger.error(f"Failed to update session {session_id}: {e}")
            return False

    async def close_session(self, session_id: str) -> bool:
        """Mark session as completed"""
        return await self.update_session(
            session_id,
            {"status": "completed", "closed_at": datetime.utcnow().isoformat()}
        )

    # ========== PRESENCE MANAGEMENT ==========

    async def set_presence(self, agent_id: str, status: str = "online", ttl: int = 60) -> bool:
        """
        Set agent online status with TTL.

        Args:
            agent_id: Agent identifier
            status: Status string (online/offline)
            ttl: Time to live in seconds

        Returns:
            True if successful
        """
        try:
            key = f"presence:{agent_id}"
            await self.redis.setex(key, ttl, status)
            return True
        except RedisError as e:
            logger.error(f"Failed to set presence for {agent_id}: {e}")
            return False

    async def get_presence(self, agent_id: str) -> Optional[str]:
        """Get agent presence status"""
        try:
            key = f"presence:{agent_id}"
            status = await self.redis.get(key)
            return status if status else "offline"
        except RedisError as e:
            logger.error(f"Failed to get presence for {agent_id}: {e}")
            return "offline"

    async def get_all_online_agents(self) -> List[str]:
        """Get list of all online agents"""
        try:
            keys = []
            async for key in self.redis.scan_iter("presence:*"):
                agent_id = key.replace("presence:", "")
                status = await self.redis.get(key)
                if status == "online":
                    keys.append(agent_id)
            return keys
        except RedisError as e:
            logger.error(f"Failed to get online agents: {e}")
            return []

    # ========== SNAPSHOT MANAGEMENT ==========

    async def create_snapshot(self, snapshot_data: Dict[str, Any]) -> bool:
        """Create full state snapshot"""
        try:
            timestamp = datetime.utcnow().isoformat()
            key = f"snapshot:{timestamp}"

            snapshot_json = json.dumps(snapshot_data)
            await self.redis.set(key, snapshot_json)

            # Keep only last 10 snapshots
            all_snapshots = []
            async for key in self.redis.scan_iter("snapshot:*"):
                all_snapshots.append(key)

            if len(all_snapshots) > 10:
                all_snapshots.sort()
                for old_key in all_snapshots[:-10]:
                    await self.redis.delete(old_key)

            logger.info(f"Snapshot created: {timestamp}")
            return True

        except RedisError as e:
            logger.error(f"Failed to create snapshot: {e}")
            return False

    async def get_latest_snapshot(self) -> Optional[Dict[str, Any]]:
        """Get most recent snapshot"""
        try:
            keys = []
            async for key in self.redis.scan_iter("snapshot:*"):
                keys.append(key)

            if not keys:
                return None

            keys.sort()
            latest_key = keys[-1]

            snapshot_json = await self.redis.get(latest_key)
            return json.loads(snapshot_json) if snapshot_json else None

        except RedisError as e:
            logger.error(f"Failed to get latest snapshot: {e}")
            return None

    # ========== UTILITY METHODS ==========

    async def ping(self) -> bool:
        """Check Redis connection"""
        try:
            await self.redis.ping()
            return True
        except (RedisError, AttributeError):
            return False

    async def flush_all(self):
        """⚠️ WARNING: Delete all data in current database"""
        try:
            await self.redis.flushdb()
            logger.warning("🗑️ All Redis data flushed!")
        except RedisError as e:
            logger.error(f"Failed to flush database: {e}")

    async def get_stats(self) -> Dict[str, Any]:
        """Get storage statistics"""
        try:
            stats = {
                "total_keys": await self.redis.dbsize(),
                "agents_with_context": len([k async for k in self.redis.scan_iter("context:*")]),
                "agents_with_history": len([k async for k in self.redis.scan_iter("history:*")]),
                "active_sessions": len([k async for k in self.redis.scan_iter("session:*")]),
                "online_agents": len(await self.get_all_online_agents()),
            }
            return stats
        except RedisError as e:
            logger.error(f"Failed to get stats: {e}")
            return {}
