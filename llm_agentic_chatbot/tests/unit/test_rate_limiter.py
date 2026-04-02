"""Unit tests for the sliding-window RateLimiter.

All Redis interactions are mocked so no live Redis instance is needed.
Tests verify both the allowed/denied paths and the fail-open behaviour
when Redis is unavailable.
"""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from utils.rate_limiter import RateLimiter


class TestRateLimiterAllowed:
    """Tests where the request should be allowed."""

    @pytest.mark.asyncio
    async def test_is_allowed_under_limit(self):
        """Request count below max_requests should be allowed."""
        mock_pipe = AsyncMock()
        # pipeline execute returns: [zremrangebyscore result, zcard count, zadd result, expire result]
        mock_pipe.execute = AsyncMock(return_value=[0, 3, 1, True])
        mock_pipe.zremrangebyscore = MagicMock(return_value=mock_pipe)
        mock_pipe.zcard = MagicMock(return_value=mock_pipe)
        mock_pipe.zadd = MagicMock(return_value=mock_pipe)
        mock_pipe.expire = MagicMock(return_value=mock_pipe)

        mock_redis = MagicMock()
        mock_redis.pipeline = MagicMock(return_value=mock_pipe)

        limiter = RateLimiter(max_requests=10, window_seconds=60)

        with patch("utils.rate_limiter.get_redis_client", return_value=mock_redis):
            result = await limiter.is_allowed("session-1")

        assert result is True

    @pytest.mark.asyncio
    async def test_is_allowed_at_zero_count(self):
        """First request for a session (count=0) should be allowed."""
        mock_pipe = AsyncMock()
        mock_pipe.execute = AsyncMock(return_value=[0, 0, 1, True])
        mock_pipe.zremrangebyscore = MagicMock(return_value=mock_pipe)
        mock_pipe.zcard = MagicMock(return_value=mock_pipe)
        mock_pipe.zadd = MagicMock(return_value=mock_pipe)
        mock_pipe.expire = MagicMock(return_value=mock_pipe)

        mock_redis = MagicMock()
        mock_redis.pipeline = MagicMock(return_value=mock_pipe)

        limiter = RateLimiter(max_requests=10, window_seconds=60)

        with patch("utils.rate_limiter.get_redis_client", return_value=mock_redis):
            result = await limiter.is_allowed("session-new")

        assert result is True

    @pytest.mark.asyncio
    async def test_is_allowed_at_threshold_minus_one(self):
        """Count exactly one below the limit should be allowed."""
        mock_pipe = AsyncMock()
        mock_pipe.execute = AsyncMock(return_value=[0, 9, 1, True])
        mock_pipe.zremrangebyscore = MagicMock(return_value=mock_pipe)
        mock_pipe.zcard = MagicMock(return_value=mock_pipe)
        mock_pipe.zadd = MagicMock(return_value=mock_pipe)
        mock_pipe.expire = MagicMock(return_value=mock_pipe)

        mock_redis = MagicMock()
        mock_redis.pipeline = MagicMock(return_value=mock_pipe)

        limiter = RateLimiter(max_requests=10, window_seconds=60)

        with patch("utils.rate_limiter.get_redis_client", return_value=mock_redis):
            result = await limiter.is_allowed("session-busy")

        assert result is True


class TestRateLimiterDenied:
    """Tests where the request should be denied."""

    @pytest.mark.asyncio
    async def test_is_allowed_returns_false_when_at_limit(self):
        """Exactly at max_requests count should be denied."""
        mock_pipe = AsyncMock()
        mock_pipe.execute = AsyncMock(return_value=[0, 10, 1, True])
        mock_pipe.zremrangebyscore = MagicMock(return_value=mock_pipe)
        mock_pipe.zcard = MagicMock(return_value=mock_pipe)
        mock_pipe.zadd = MagicMock(return_value=mock_pipe)
        mock_pipe.expire = MagicMock(return_value=mock_pipe)

        mock_redis = MagicMock()
        mock_redis.pipeline = MagicMock(return_value=mock_pipe)

        limiter = RateLimiter(max_requests=10, window_seconds=60)

        with patch("utils.rate_limiter.get_redis_client", return_value=mock_redis):
            result = await limiter.is_allowed("session-flood")

        assert result is False

    @pytest.mark.asyncio
    async def test_is_allowed_returns_false_when_over_limit(self):
        """Count well above max_requests should be denied."""
        mock_pipe = AsyncMock()
        mock_pipe.execute = AsyncMock(return_value=[0, 25, 1, True])
        mock_pipe.zremrangebyscore = MagicMock(return_value=mock_pipe)
        mock_pipe.zcard = MagicMock(return_value=mock_pipe)
        mock_pipe.zadd = MagicMock(return_value=mock_pipe)
        mock_pipe.expire = MagicMock(return_value=mock_pipe)

        mock_redis = MagicMock()
        mock_redis.pipeline = MagicMock(return_value=mock_pipe)

        limiter = RateLimiter(max_requests=10, window_seconds=60)

        with patch("utils.rate_limiter.get_redis_client", return_value=mock_redis):
            result = await limiter.is_allowed("session-flood")

        assert result is False

    @pytest.mark.asyncio
    async def test_custom_lower_limit(self):
        """A custom low limit should kick in correctly."""
        mock_pipe = AsyncMock()
        mock_pipe.execute = AsyncMock(return_value=[0, 3, 1, True])
        mock_pipe.zremrangebyscore = MagicMock(return_value=mock_pipe)
        mock_pipe.zcard = MagicMock(return_value=mock_pipe)
        mock_pipe.zadd = MagicMock(return_value=mock_pipe)
        mock_pipe.expire = MagicMock(return_value=mock_pipe)

        mock_redis = MagicMock()
        mock_redis.pipeline = MagicMock(return_value=mock_pipe)

        limiter = RateLimiter(max_requests=3, window_seconds=30)

        with patch("utils.rate_limiter.get_redis_client", return_value=mock_redis):
            result = await limiter.is_allowed("session-x")

        assert result is False


class TestRateLimiterFailOpen:
    """Tests for the fail-open behaviour when Redis is unavailable."""

    @pytest.mark.asyncio
    async def test_fails_open_when_redis_is_none(self):
        """When get_redis_client returns None, requests should be allowed."""
        limiter = RateLimiter(max_requests=10, window_seconds=60)

        with patch("utils.rate_limiter.get_redis_client", return_value=None):
            result = await limiter.is_allowed("any-session")

        assert result is True

    @pytest.mark.asyncio
    async def test_fails_open_regardless_of_session_id(self):
        """Fail-open should work for any session id."""
        limiter = RateLimiter()

        with patch("utils.rate_limiter.get_redis_client", return_value=None):
            result1 = await limiter.is_allowed("session-a")
            result2 = await limiter.is_allowed("session-b")

        assert result1 is True
        assert result2 is True


class TestRateLimiterPipelineOperations:
    """Verify that the correct Redis pipeline commands are issued."""

    @pytest.mark.asyncio
    async def test_pipeline_commands_are_called(self):
        """Verifies: zremrangebyscore, zcard, zadd, expire are called."""
        mock_pipe = AsyncMock()
        mock_pipe.execute = AsyncMock(return_value=[0, 0, 1, True])
        mock_pipe.zremrangebyscore = MagicMock(return_value=mock_pipe)
        mock_pipe.zcard = MagicMock(return_value=mock_pipe)
        mock_pipe.zadd = MagicMock(return_value=mock_pipe)
        mock_pipe.expire = MagicMock(return_value=mock_pipe)

        mock_redis = MagicMock()
        mock_redis.pipeline = MagicMock(return_value=mock_pipe)

        limiter = RateLimiter(max_requests=10, window_seconds=60)

        with patch("utils.rate_limiter.get_redis_client", return_value=mock_redis):
            await limiter.is_allowed("session-test")

        # The key should be rate_limit:<session_id>
        expected_key = "rate_limit:session-test"

        mock_pipe.zremrangebyscore.assert_called_once()
        args = mock_pipe.zremrangebyscore.call_args
        assert args[0][0] == expected_key

        mock_pipe.zcard.assert_called_once_with(expected_key)

        mock_pipe.zadd.assert_called_once()
        zadd_args = mock_pipe.zadd.call_args
        assert zadd_args[0][0] == expected_key

        mock_pipe.expire.assert_called_once_with(expected_key, 60)

        mock_pipe.execute.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_pipeline_uses_correct_window_seconds(self):
        """Custom window_seconds should be used for expire."""
        mock_pipe = AsyncMock()
        mock_pipe.execute = AsyncMock(return_value=[0, 0, 1, True])
        mock_pipe.zremrangebyscore = MagicMock(return_value=mock_pipe)
        mock_pipe.zcard = MagicMock(return_value=mock_pipe)
        mock_pipe.zadd = MagicMock(return_value=mock_pipe)
        mock_pipe.expire = MagicMock(return_value=mock_pipe)

        mock_redis = MagicMock()
        mock_redis.pipeline = MagicMock(return_value=mock_pipe)

        limiter = RateLimiter(max_requests=5, window_seconds=120)

        with patch("utils.rate_limiter.get_redis_client", return_value=mock_redis):
            await limiter.is_allowed("sess-1")

        mock_pipe.expire.assert_called_once_with("rate_limit:sess-1", 120)


class TestRateLimiterDefaults:
    """Tests for default configuration."""

    def test_default_max_requests(self):
        limiter = RateLimiter()
        assert limiter.max_requests == 10

    def test_default_window_seconds(self):
        limiter = RateLimiter()
        assert limiter.window_seconds == 60
