"""
Redis Connection Utilities for DerLg.com AI Agent

This module manages the async Redis client lifecycle used for:
- Session storage (7-day TTL)
- Checkpoint persistence (7-day TTL, via RedisCheckpointer)
- Booking hold timers (15-min TTL)
- Rate limiting
- Weather cache

Usage:
    from utils.redis import init_redis, close_redis, get_redis_client

    # During FastAPI startup
    await init_redis(settings.REDIS_URL)

    # In application code
    client = get_redis_client()
    if client is not None:
        await client.set("key", "value", ex=3600)

    # For checkpoint persistence
    saver = get_redis_saver()  # returns RedisCheckpointer

    # During FastAPI shutdown
    await close_redis()
"""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING

import redis.asyncio as redis
import structlog

if TYPE_CHECKING:
    from agent.checkpointer import RedisCheckpointer

logger = structlog.get_logger(__name__)

_redis_client: redis.Redis | None = None
_redis_url: str | None = None
_redis_saver: RedisCheckpointer | None = None

RECONNECT_MAX_ATTEMPTS = 3
RECONNECT_BASE_DELAY_SECONDS = 1.0


async def init_redis(redis_url: str) -> None:
    """
    Initialize the async Redis client and verify connectivity.

    Creates a Redis client from the provided URL and tests the connection
    with a ping. Credentials are stripped from the URL before logging.
    If Redis is unreachable, the failure is logged and the client remains
    None so callers can degrade gracefully.

    Args:
        redis_url: Full Redis connection string (e.g. redis://user:pass@host:port/0)
    """
    global _redis_client, _redis_url
    _redis_url = redis_url
    safe_url = redis_url.split("@")[-1] if "@" in redis_url else redis_url

    try:
        _redis_client = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
        await _redis_client.ping()
        logger.info("redis_connected", url=safe_url)
    except (redis.ConnectionError, redis.AuthenticationError, OSError) as exc:
        logger.error(
            "redis_connection_failed",
            url=safe_url,
            error=str(exc),
        )
        _redis_client = None


async def reconnect_redis() -> redis.Redis | None:
    """
    Attempt to re-establish the Redis connection with exponential backoff.

    Tries up to ``RECONNECT_MAX_ATTEMPTS`` times with delays of 1 s, 2 s,
    and 4 s between attempts.  On success the module-level client is
    replaced and the new instance is returned.  On failure ``None`` is
    returned and the module-level client remains ``None``.

    Returns:
        The reconnected Redis client, or None if all attempts failed.
    """
    global _redis_client

    if _redis_url is None:
        logger.error("redis_reconnect_failed", reason="no redis_url configured")
        return None

    safe_url = _redis_url.split("@")[-1] if "@" in _redis_url else _redis_url

    for attempt in range(1, RECONNECT_MAX_ATTEMPTS + 1):
        delay = RECONNECT_BASE_DELAY_SECONDS * (2 ** (attempt - 1))
        logger.info(
            "redis_reconnect_attempt",
            attempt=attempt,
            max_attempts=RECONNECT_MAX_ATTEMPTS,
            delay_seconds=delay,
            url=safe_url,
        )
        await asyncio.sleep(delay)

        try:
            client = redis.from_url(
                _redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            await client.ping()
            _redis_client = client
            logger.info("redis_reconnected", attempt=attempt, url=safe_url)
            return _redis_client
        except (redis.ConnectionError, redis.AuthenticationError, OSError) as exc:
            logger.warning(
                "redis_reconnect_attempt_failed",
                attempt=attempt,
                max_attempts=RECONNECT_MAX_ATTEMPTS,
                error=str(exc),
            )

    logger.error(
        "redis_reconnect_exhausted",
        max_attempts=RECONNECT_MAX_ATTEMPTS,
        url=safe_url,
    )
    _redis_client = None
    return None


async def close_redis() -> None:
    """
    Close the Redis client connection gracefully.

    Safe to call even if the client was never initialized.
    """
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
        logger.info("redis_disconnected")


def get_redis_client() -> redis.Redis | None:
    """
    Return the initialized Redis client, or None if unavailable.

    Callers must handle a ``None`` return to degrade gracefully when
    Redis is down.

    Returns:
        The async Redis client instance, or None if Redis is not connected.
    """
    if _redis_client is None:
        logger.warning("redis_client_unavailable", hint="Redis is not connected")
        return None
    return _redis_client


def get_redis_saver() -> RedisCheckpointer:
    """
    Return the :class:`~agent.checkpointer.RedisCheckpointer` singleton.

    The saver is created lazily on first call using the current Redis
    client.  If Redis is unavailable the checkpointer still works --
    its methods degrade gracefully (saves are skipped, loads return
    ``None``).

    Returns:
        The ``RedisCheckpointer`` instance.
    """
    global _redis_saver

    if _redis_saver is None:
        from agent.checkpointer import RedisCheckpointer as _Cls
        _redis_saver = _Cls(_redis_client)
        logger.info("redis_saver_initialized")

    return _redis_saver


def init_redis_saver() -> RedisCheckpointer:
    """Create (or re-create) the ``RedisCheckpointer`` with the current client.

    Should be called after ``init_redis`` completes so the checkpointer
    gets a live Redis connection rather than ``None``.

    Returns:
        The newly created ``RedisCheckpointer`` instance.
    """
    global _redis_saver

    from agent.checkpointer import RedisCheckpointer as _Cls
    _redis_saver = _Cls(_redis_client)
    logger.info("redis_saver_initialized")
    return _redis_saver
