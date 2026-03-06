"""Unit tests for the TTL in-memory cache (utils/cache.py).

Covers:
- Basic get/set/delete operations
- TTL expiration behavior
- Cache eviction when max size is exceeded
- Hit/miss statistics
- The @cached async decorator
"""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import asyncio
import time
import pytest
from unittest.mock import patch

from utils.cache import TTLCache, cached, ttl_cache, DEFAULT_TTL_SECONDS


# ---------------------------------------------------------------------------
# TTLCache class
# ---------------------------------------------------------------------------


class TestTTLCacheBasicOperations:
    """Tests for basic get/set/delete/clear."""

    def test_get_missing_key_returns_none(self) -> None:
        cache = TTLCache()
        assert cache.get("nonexistent") is None

    def test_set_and_get(self) -> None:
        cache = TTLCache()
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_set_overwrites_existing(self) -> None:
        cache = TTLCache()
        cache.set("k", "v1")
        cache.set("k", "v2")
        assert cache.get("k") == "v2"

    def test_delete_existing_key(self) -> None:
        cache = TTLCache()
        cache.set("k", "v")
        assert cache.delete("k") is True
        assert cache.get("k") is None

    def test_delete_missing_key_returns_false(self) -> None:
        cache = TTLCache()
        assert cache.delete("nope") is False

    def test_clear_removes_all(self) -> None:
        cache = TTLCache()
        cache.set("a", 1)
        cache.set("b", 2)
        cache.clear()
        assert cache.get("a") is None
        assert cache.get("b") is None
        assert cache.size == 0

    def test_size_tracks_entries(self) -> None:
        cache = TTLCache()
        assert cache.size == 0
        cache.set("a", 1)
        assert cache.size == 1
        cache.set("b", 2)
        assert cache.size == 2
        cache.delete("a")
        assert cache.size == 1

    def test_stores_various_types(self) -> None:
        cache = TTLCache()
        cache.set("int", 42)
        cache.set("list", [1, 2, 3])
        cache.set("dict", {"key": "value"})
        cache.set("none", None)  # None is a valid value to cache

        assert cache.get("int") == 42
        assert cache.get("list") == [1, 2, 3]
        assert cache.get("dict") == {"key": "value"}
        # Note: None values cannot be distinguished from cache misses
        # with the current API. This is a known trade-off.


class TestTTLCacheExpiration:
    """Tests for TTL-based expiration."""

    def test_expired_entry_returns_none(self) -> None:
        cache = TTLCache()
        cache.set("k", "v", ttl_seconds=0.01)
        time.sleep(0.05)
        assert cache.get("k") is None

    def test_non_expired_entry_returns_value(self) -> None:
        cache = TTLCache()
        cache.set("k", "v", ttl_seconds=60)
        assert cache.get("k") == "v"

    def test_default_ttl_is_used(self) -> None:
        cache = TTLCache(default_ttl=0.01)
        cache.set("k", "v")  # No explicit TTL
        time.sleep(0.05)
        assert cache.get("k") is None

    def test_custom_ttl_overrides_default(self) -> None:
        cache = TTLCache(default_ttl=0.01)
        cache.set("k", "v", ttl_seconds=60)
        time.sleep(0.05)
        assert cache.get("k") == "v"


class TestTTLCacheEviction:
    """Tests for automatic eviction when max_size is exceeded."""

    def test_eviction_removes_expired_entries(self) -> None:
        cache = TTLCache(max_size=3)
        cache.set("expired1", "v", ttl_seconds=0.01)
        cache.set("expired2", "v", ttl_seconds=0.01)
        time.sleep(0.05)

        # These two pushes the size to 4, triggering eviction
        cache.set("fresh1", "v", ttl_seconds=60)
        cache.set("fresh2", "v", ttl_seconds=60)

        # Expired entries should have been evicted
        assert cache.get("expired1") is None
        assert cache.get("expired2") is None
        assert cache.get("fresh1") == "v"
        assert cache.get("fresh2") == "v"


class TestTTLCacheStats:
    """Tests for hit/miss statistics."""

    def test_initial_stats_are_zero(self) -> None:
        cache = TTLCache()
        stats = cache.stats
        assert stats["hits"] == 0
        assert stats["misses"] == 0
        assert stats["size"] == 0

    def test_hit_increments_on_successful_get(self) -> None:
        cache = TTLCache()
        cache.set("k", "v")
        cache.get("k")
        assert cache.stats["hits"] == 1

    def test_miss_increments_on_missing_key(self) -> None:
        cache = TTLCache()
        cache.get("nope")
        assert cache.stats["misses"] == 1

    def test_miss_increments_on_expired_key(self) -> None:
        cache = TTLCache()
        cache.set("k", "v", ttl_seconds=0.01)
        time.sleep(0.05)
        cache.get("k")
        assert cache.stats["misses"] == 1

    def test_clear_resets_stats(self) -> None:
        cache = TTLCache()
        cache.set("k", "v")
        cache.get("k")
        cache.get("nope")
        cache.clear()
        assert cache.stats["hits"] == 0
        assert cache.stats["misses"] == 0


# ---------------------------------------------------------------------------
# @cached decorator
# ---------------------------------------------------------------------------


class TestCachedDecorator:
    """Tests for the @cached async function decorator."""

    @pytest.mark.asyncio
    async def test_caches_return_value(self) -> None:
        call_count = 0

        @cached(ttl_seconds=60, prefix="test_caches")
        async def expensive_fn(x: int) -> int:
            nonlocal call_count
            call_count += 1
            return x * 2

        result1 = await expensive_fn(5)
        result2 = await expensive_fn(5)

        assert result1 == 10
        assert result2 == 10
        assert call_count == 1  # Second call served from cache

        # Clean up
        ttl_cache.clear()

    @pytest.mark.asyncio
    async def test_different_args_produce_different_cache_keys(self) -> None:
        call_count = 0

        @cached(ttl_seconds=60, prefix="test_diff_args")
        async def fn(x: int) -> int:
            nonlocal call_count
            call_count += 1
            return x

        await fn(1)
        await fn(2)
        assert call_count == 2

        ttl_cache.clear()

    @pytest.mark.asyncio
    async def test_kwargs_included_in_cache_key(self) -> None:
        call_count = 0

        @cached(ttl_seconds=60, prefix="test_kwargs")
        async def fn(city: str = "pp") -> str:
            nonlocal call_count
            call_count += 1
            return city

        await fn(city="pp")
        await fn(city="sr")
        await fn(city="pp")  # Cache hit

        assert call_count == 2

        ttl_cache.clear()

    @pytest.mark.asyncio
    async def test_expired_cache_re_calls_function(self) -> None:
        call_count = 0

        @cached(ttl_seconds=0.01, prefix="test_expired")
        async def fn() -> str:
            nonlocal call_count
            call_count += 1
            return "result"

        await fn()
        time.sleep(0.05)
        await fn()

        assert call_count == 2

        ttl_cache.clear()

    @pytest.mark.asyncio
    async def test_preserves_function_name(self) -> None:
        @cached(ttl_seconds=60)
        async def my_special_function() -> None:
            pass

        assert my_special_function.__name__ == "my_special_function"


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------


class TestModuleSingleton:
    """Verify the module-level ttl_cache singleton works."""

    def test_singleton_is_ttl_cache_instance(self) -> None:
        assert isinstance(ttl_cache, TTLCache)

    def test_default_ttl_matches_constant(self) -> None:
        assert ttl_cache._default_ttl == DEFAULT_TTL_SECONDS
