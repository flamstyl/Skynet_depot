"""
Tests for MemorySystem
"""

import pytest
from datetime import datetime
from core.memory import MemorySystem, MemoryEntry


@pytest.fixture
def config(tmp_path):
    """Test configuration"""
    return {
        "memory": {
            "short_term_size": 10,
            "long_term_enabled": False,  # Disable for testing
            "vector_store_path": str(tmp_path / "vectorstore"),
            "chunk_size": 512,
            "chunk_overlap": 50,
        }
    }


@pytest.fixture
def memory(config):
    """Create memory system instance"""
    return MemorySystem(config)


def test_memory_initialization(memory):
    """Test memory system initialization"""
    assert memory is not None
    assert len(memory.short_term) == 0
    assert len(memory.long_term) == 0


def test_store_short_term(memory):
    """Test storing short-term memory"""
    memory.store_short_term("test_key", "test_value")

    assert len(memory.short_term) == 1
    assert memory.get_short_term("test_key") == "test_value"


def test_store_long_term(memory):
    """Test storing long-term memory"""
    memory.store_long_term("test_key", "test_value", category="test")

    assert len(memory.long_term) == 1
    assert memory.get_long_term("test_key") == "test_value"


def test_short_term_size_limit(memory):
    """Test short-term memory size limit"""
    # Add more than limit
    for i in range(15):
        memory.store_short_term(f"key_{i}", f"value_{i}")

    # Should only keep last 10
    assert len(memory.short_term) == 10


def test_search_memory(memory):
    """Test memory search"""
    memory.store_short_term("test_1", "hello world")
    memory.store_short_term("test_2", "goodbye world")
    memory.store_long_term("test_3", "hello universe")

    results = memory.search_memory("hello")

    assert len(results) == 2
    assert all("hello" in r.value.lower() for r in results)


def test_get_statistics(memory):
    """Test getting memory statistics"""
    memory.store_short_term("key1", "value1", category="cat1")
    memory.store_long_term("key2", "value2", category="cat2")

    stats = memory.get_statistics()

    assert stats["short_term_count"] == 1
    assert stats["long_term_count"] == 1
    assert "cat1" in stats["categories"]
    assert "cat2" in stats["categories"]


def test_clear_memory(memory):
    """Test clearing memory"""
    memory.store_short_term("key1", "value1")
    memory.store_long_term("key2", "value2")

    memory.clear_short_term()
    assert len(memory.short_term) == 0

    memory.clear_long_term()
    assert len(memory.long_term) == 0
