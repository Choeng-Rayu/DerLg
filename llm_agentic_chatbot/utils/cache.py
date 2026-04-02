"""
In-memory TTL cache for DerLg.com AI Agent.

Provides a lightweight, thread-safe, in-memory cache with per-entry
time-to-live (TTL) expiration.  Designed for caching frequently accessed
data that does not require distributed consistency (e.g., weather lookups,
currency rates, trip metadata).

For distributed caching use Redis via ``utils.redis``.

Usage::

    from utils.cache import ttl_cache, cached

    # Direct usage
    ttl_cache.set("weather:phnom_penh", data, ttl_seconds=300)
    result = ttl_cache.get("weather:phnom_penh")

    # Decorator usage
    @cached(ttl_seconds=300, prefix="weather")
    async def get_weather(city: str) -> dict:
        ...
"""

from __future__ import annotations

import asyncio
import functools
import time
import threading
from typing import Any, Callable, TypeVar

import structlog

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

F = TypeVar("F", bound=Callable[..., Any])

# Maximum number of entries before automatic eviction of expired items.
MAX_CACHE_SIZE = 1024

# Default TTL in seconds when none is specified.
DEFAULT_TTL_SECONDS = 300


class _CacheEntry:
    """A single cache entry with an expiration timestamp."""

    __slots__ = ("value", "expires_at")

    def __init__(self, value: Any, ttl_seconds: float) -> None:
        self.value: Any = value
        self.expires_at: float = time.monotonic() + ttl_seconds

    def is_expired(self) -> bool:
        return time.monotonic() >= self.expires_at


class TTLCache:
    """In-memory cache with per-entry TTL.

    Thread-safe via a ``threading.Lock``.  Evicts expired entries lazily on
    ``get`` and eagerly when the cache exceeds ``MAX_CACHE_SIZE``.

    Args:
        max_size: Maximum number of entries before an eviction sweep runs.
        default_ttl: Default TTL in seconds when ``set`` is called without
            an explicit ``ttl_seconds``.
    """

    def __init__(
        self,
        max_size: int = MAX_CACHE_SIZE,
        default_ttl: float = DEFAULT_TTL_SECONDS,
    ) -> None:
        self._store: dict[str, _CacheEntry] = {}
        self._lock = threading.Lock()
        self._max_size: int = max_size
        self._default_ttl: float = default_ttl

        # Stats
        self._hits: int = 0
        self._misses: int = 0

    # -- public API -----------------------------------------------------------

    def get(self, key: str) -> Any | None:
        """Retrieve a value by *key*, returning ``None`` if missing or expired."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                self._misses += 1
                return None
            if entry.is_expired():
                del self._store[key]
                self._misses += 1
                return None
            self._hits += 1
            return entry.value

    def set(self, key: str, value: Any, ttl_seconds: float | None = None) -> None:
        """Store *value* under *key* with the given TTL.

        Args:
            key: Cache key string.
            value: Arbitrary value to cache.
            ttl_seconds: Time-to-live for this entry.  Falls back to the
                instance default when ``None``.
        """
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        with self._lock:
            self._store[key] = _CacheEntry(value, ttl)
            if len(self._store) > self._max_size:
                self._evict_expired()

    def delete(self, key: str) -> bool:
        """Remove *key* from the cache.  Returns ``True`` if the key existed."""
        with self._lock:
            return self._store.pop(key, None) is not None

    def clear(self) -> None:
        """Remove all entries from the cache."""
        with self._lock:
            self._store.clear()
            self._hits = 0
            self._misses = 0

    @property
    def size(self) -> int:
        """Return the current number of entries (including possibly expired ones)."""
        return len(self._store)

    @property
    def stats(self) -> dict[str, int]:
        """Return a snapshot of cache hit/miss statistics."""
        return {
            "hits": self._hits,
            "misses": self._misses,
            "size": len(self._store),
        }

    # -- internal -------------------------------------------------------------

    def _evict_expired(self) -> None:
        """Remove all expired entries.  Must be called with ``_lock`` held."""
        expired_keys = [k for k, v in self._store.items() if v.is_expired()]
        for key in expired_keys:
            del self._store[key]
        if expired_keys:
            logger.debug(
                "cache_evicted_expired",
                evicted_count=len(expired_keys),
                remaining=len(self._store),
            )


# Module-level singleton
ttl_cache = TTLCache()


def cached(
    ttl_seconds: float = DEFAULT_TTL_SECONDS,
    prefix: str = "",
) -> Callable[[F], F]:
    """Decorator that caches the return value of an async function.

    The cache key is built from the function name, the ``prefix``, and all
    positional/keyword arguments serialized as strings.

    Args:
        ttl_seconds: Time-to-live for cached results.
        prefix: Optional namespace prefix for the cache key.

    Returns:
        A decorator that wraps an async function with TTL caching.
    """

    def decorator(func: F) -> F:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            key_parts = [prefix or func.__name__]
            key_parts.extend(str(a) for a in args)
            key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
            cache_key = ":".join(key_parts)

            result = ttl_cache.get(cache_key)
            if result is not None:
                logger.debug("cache_hit", key=cache_key, function=func.__name__)
                return result

            result = await func(*args, **kwargs)
            ttl_cache.set(cache_key, result, ttl_seconds=ttl_seconds)
            logger.debug("cache_miss_stored", key=cache_key, function=func.__name__)
            return result

        return wrapper  # type: ignore[return-value]

    return decorator
