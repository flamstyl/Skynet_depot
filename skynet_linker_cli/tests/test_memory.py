"""
Tests for Memory Layer

Note: These tests require a running Redis instance.
Set REDIS_URL environment variable or use default localhost:6379
"""

import pytest
import os
from unittest.mock import AsyncMock, MagicMock


# Mock Redis for tests that don't need real Redis
@pytest.fixture
def mock_redis_store():
    """Create a mock RedisStore for testing"""
    from server.redis_store import RedisStore

    store = RedisStore(redis_url="redis://localhost:6379/15")  # Use test DB 15

    # Mock Redis methods
    store.redis = MagicMock()
    store.redis.hgetall = AsyncMock(return_value={})
    store.redis.hset = AsyncMock(return_value=True)
    store.redis.get = AsyncMock(return_value=None)
    store.redis.setex = AsyncMock(return_value=True)
    store.redis.rpush = AsyncMock(return_value=1)
    store.redis.lrange = AsyncMock(return_value=[])

    return store


@pytest.mark.asyncio
async def test_set_and_get_context(mock_redis_store):
    """Test setting and getting agent context"""
    agent_id = "test_agent"
    context_data = {
        "global_summary": "Test summary",
        "last_intent": "Test intent"
    }

    # Mock the hgetall response
    mock_redis_store.redis.hgetall = AsyncMock(return_value={
        "global_summary": '"Test summary"',
        "last_intent": '"Test intent"',
        "_agent_id": f'"{agent_id}"'
    })

    # Set context
    success = await mock_redis_store.set_context(agent_id, context_data)
    assert success is True

    # Get context
    context = await mock_redis_store.get_context(agent_id)
    assert context is not None
    assert context["global_summary"] == "Test summary"


@pytest.mark.asyncio
async def test_append_and_get_history(mock_redis_store):
    """Test appending to and retrieving message history"""
    agent_id = "test_agent"
    message = {
        "id": "msg-123",
        "from_agent": "claude_cli",
        "to_agent": agent_id,
        "content": "Test message"
    }

    # Append message
    success = await mock_redis_store.append_history(agent_id, message)
    assert success is True

    # Mock history retrieval
    import json
    mock_redis_store.redis.lrange = AsyncMock(return_value=[json.dumps(message)])

    # Get history
    history = await mock_redis_store.get_history(agent_id, limit=10)
    assert len(history) == 1
    assert history[0]["id"] == "msg-123"


@pytest.mark.asyncio
async def test_presence_management(mock_redis_store):
    """Test agent presence tracking"""
    agent_id = "test_agent"

    # Set online
    success = await mock_redis_store.set_presence(agent_id, "online", ttl=60)
    assert success is True

    # Mock presence retrieval
    mock_redis_store.redis.get = AsyncMock(return_value="online")

    # Get presence
    status = await mock_redis_store.get_presence(agent_id)
    assert status == "online"


@pytest.mark.asyncio
async def test_session_creation(mock_redis_store):
    """Test session creation"""
    session_id = "session-123"
    metadata = {
        "participants": ["claude_cli", "gemini"],
        "goal": "Test collaboration"
    }

    # Create session
    success = await mock_redis_store.create_session(session_id, metadata)
    assert success is True

    # Mock session retrieval
    mock_redis_store.redis.hgetall = AsyncMock(return_value={
        "session_id": session_id,
        "status": "active",
        "participants": '["claude_cli", "gemini"]',
        "created_at": "2025-11-19T12:00:00Z"
    })

    # Get session
    session = await mock_redis_store.get_session(session_id)
    assert session is not None
    assert session["session_id"] == session_id


def test_context_manager_creation():
    """Test ContextManager initialization"""
    from memory.context_manager import ContextManager
    from server.redis_store import RedisStore

    redis_store = RedisStore()
    context_mgr = ContextManager(redis_store)

    assert context_mgr.redis is redis_store


def test_session_manager_creation():
    """Test SessionManager initialization"""
    from memory.session_manager import SessionManager
    from server.redis_store import RedisStore

    redis_store = RedisStore()
    session_mgr = SessionManager(redis_store)

    assert session_mgr.redis is redis_store


def test_context_merge():
    """Test context merging logic"""
    from memory.context_manager import ContextManager
    from server.redis_store import RedisStore

    redis_store = RedisStore()
    context_mgr = ContextManager(redis_store)

    existing = {
        "field1": "value1",
        "nested": {"a": 1, "b": 2},
        "list": [1, 2]
    }

    updates = {
        "field2": "value2",
        "nested": {"c": 3},
        "list": [3, 4]
    }

    merged = context_mgr._merge_contexts(existing, updates)

    assert merged["field1"] == "value1"  # Preserved
    assert merged["field2"] == "value2"  # Added
    assert merged["nested"]["a"] == 1  # Nested preserved
    assert merged["nested"]["c"] == 3  # Nested added
    assert set(merged["list"]) == {1, 2, 3, 4}  # Lists merged


def test_default_context_creation():
    """Test default context templates"""
    from memory.context_manager import ContextManager
    from server.redis_store import RedisStore

    redis_store = RedisStore()
    context_mgr = ContextManager(redis_store)

    # Test planner context
    planner_context = context_mgr.create_default_context("planner")
    assert "current_plan" in planner_context
    assert "subtasks" in planner_context

    # Test researcher context
    researcher_context = context_mgr.create_default_context("researcher")
    assert "research_topics" in researcher_context
    assert "findings" in researcher_context


def test_context_validation():
    """Test context validation"""
    from memory.context_manager import ContextManager
    from server.redis_store import RedisStore

    redis_store = RedisStore()
    context_mgr = ContextManager(redis_store)

    # Valid context
    valid_context = {"field": "value"}
    assert context_mgr.validate_context(valid_context) is True

    # Invalid context (not a dict)
    invalid_context = "not a dict"
    assert context_mgr.validate_context(invalid_context) is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
