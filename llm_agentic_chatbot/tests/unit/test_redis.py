"""Unit tests for utils/redis.py - covers init, reconnect, close, get_redis_saver."""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import utils.redis as redis_mod


@pytest.fixture(autouse=True)
def reset_redis_globals():
    """Reset module-level globals before each test."""
    redis_mod._redis_client = None
    redis_mod._redis_url = None
    redis_mod._redis_saver = None
    yield
    redis_mod._redis_client = None
    redis_mod._redis_url = None
    redis_mod._redis_saver = None


# ---------------------------------------------------------------------------
# init_redis
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_init_redis_success():
    mock_client = AsyncMock()
    mock_client.ping = AsyncMock()

    with patch("utils.redis.redis.from_url", return_value=mock_client):
        await redis_mod.init_redis("redis://localhost:6379")

    assert redis_mod._redis_client is mock_client
    assert redis_mod._redis_url == "redis://localhost:6379"
    mock_client.ping.assert_awaited_once()


@pytest.mark.asyncio
async def test_init_redis_connection_failure():
    import redis.asyncio as redis_async

    mock_client = AsyncMock()
    mock_client.ping = AsyncMock(side_effect=redis_async.ConnectionError("refused"))

    with patch("utils.redis.redis.from_url", return_value=mock_client):
        await redis_mod.init_redis("redis://localhost:6379")

    assert redis_mod._redis_client is None
    assert redis_mod._redis_url == "redis://localhost:6379"


@pytest.mark.asyncio
async def test_init_redis_strips_credentials_from_log():
    mock_client = AsyncMock()
    mock_client.ping = AsyncMock()

    with patch("utils.redis.redis.from_url", return_value=mock_client), \
         patch.object(redis_mod.logger, "info") as mock_log:
        await redis_mod.init_redis("redis://user:secret@myhost:6379")

    mock_log.assert_called_once()
    call_kwargs = mock_log.call_args
    assert "secret" not in str(call_kwargs)
    assert "myhost:6379" in str(call_kwargs)


# ---------------------------------------------------------------------------
# reconnect_redis
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_reconnect_redis_no_url():
    redis_mod._redis_url = None
    result = await redis_mod.reconnect_redis()
    assert result is None


@pytest.mark.asyncio
async def test_reconnect_redis_success_first_attempt():
    redis_mod._redis_url = "redis://localhost:6379"

    mock_client = AsyncMock()
    mock_client.ping = AsyncMock()

    with patch("utils.redis.redis.from_url", return_value=mock_client), \
         patch("utils.redis.asyncio.sleep", new_callable=AsyncMock):
        result = await redis_mod.reconnect_redis()

    assert result is mock_client
    assert redis_mod._redis_client is mock_client


@pytest.mark.asyncio
async def test_reconnect_redis_all_attempts_fail():
    redis_mod._redis_url = "redis://localhost:6379"
    import redis.asyncio as redis_async

    mock_client = AsyncMock()
    mock_client.ping = AsyncMock(side_effect=redis_async.ConnectionError("fail"))

    with patch("utils.redis.redis.from_url", return_value=mock_client), \
         patch("utils.redis.asyncio.sleep", new_callable=AsyncMock):
        result = await redis_mod.reconnect_redis()

    assert result is None
    assert redis_mod._redis_client is None


@pytest.mark.asyncio
async def test_reconnect_redis_succeeds_on_second_attempt():
    redis_mod._redis_url = "redis://localhost:6379"
    import redis.asyncio as redis_async

    call_count = 0

    async def mock_ping():
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise redis_async.ConnectionError("first fail")

    mock_client = AsyncMock()
    mock_client.ping = mock_ping

    with patch("utils.redis.redis.from_url", return_value=mock_client), \
         patch("utils.redis.asyncio.sleep", new_callable=AsyncMock):
        result = await redis_mod.reconnect_redis()

    assert result is mock_client


# ---------------------------------------------------------------------------
# close_redis
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_close_redis_with_client():
    mock_client = AsyncMock()
    mock_client.close = AsyncMock()
    redis_mod._redis_client = mock_client

    await redis_mod.close_redis()

    assert redis_mod._redis_client is None
    mock_client.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_close_redis_no_client():
    redis_mod._redis_client = None
    await redis_mod.close_redis()  # Should not raise
    assert redis_mod._redis_client is None


# ---------------------------------------------------------------------------
# get_redis_client
# ---------------------------------------------------------------------------

def test_get_redis_client_when_connected():
    mock_client = MagicMock()
    redis_mod._redis_client = mock_client
    assert redis_mod.get_redis_client() is mock_client


def test_get_redis_client_when_disconnected():
    redis_mod._redis_client = None
    assert redis_mod.get_redis_client() is None


# ---------------------------------------------------------------------------
# get_redis_saver
# ---------------------------------------------------------------------------

def test_get_redis_saver_lazy_initializes_when_none():
    redis_mod._redis_saver = None
    redis_mod._redis_client = None  # No Redis connection
    saver = redis_mod.get_redis_saver()
    # Should return a RedisCheckpointer (lazy init), not raise
    from agent.checkpointer import RedisCheckpointer
    assert isinstance(saver, RedisCheckpointer)
    # Subsequent calls return the same instance
    assert redis_mod.get_redis_saver() is saver


def test_get_redis_saver_returns_saver():
    mock_saver = MagicMock()
    redis_mod._redis_saver = mock_saver
    assert redis_mod.get_redis_saver() is mock_saver
