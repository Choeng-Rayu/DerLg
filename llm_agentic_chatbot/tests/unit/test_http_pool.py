"""Unit tests for the ToolExecutor connection pooling (Phase 18.2.2).

Tests verify that the module-level HTTP client pool is created lazily,
reused across calls, and can be closed cleanly.
"""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

import httpx


class TestHttpPool:
    """Tests for _get_http_client and close_http_pool."""

    def test_get_http_client_creates_client(self) -> None:
        """First call should create a new client."""
        import agent.tools.executor as mod

        # Reset module-level state
        mod._http_client = None

        client = mod._get_http_client(timeout=15.0)
        assert isinstance(client, httpx.AsyncClient)
        assert not client.is_closed

        # Clean up
        mod._http_client = None

    def test_get_http_client_returns_same_instance(self) -> None:
        """Subsequent calls should return the cached client."""
        import agent.tools.executor as mod

        mod._http_client = None

        client1 = mod._get_http_client(timeout=15.0)
        client2 = mod._get_http_client(timeout=15.0)
        assert client1 is client2

        mod._http_client = None

    @pytest.mark.asyncio
    async def test_close_http_pool_closes_client(self) -> None:
        """close_http_pool should close the client and reset to None."""
        import agent.tools.executor as mod

        mod._http_client = None
        client = mod._get_http_client(timeout=15.0)
        assert not client.is_closed

        await mod.close_http_pool()
        assert mod._http_client is None

    @pytest.mark.asyncio
    async def test_close_http_pool_when_none_is_noop(self) -> None:
        """Closing when no client exists should not raise."""
        import agent.tools.executor as mod

        mod._http_client = None
        await mod.close_http_pool()  # Should not raise
        assert mod._http_client is None

    def test_get_http_client_recreates_after_close(self) -> None:
        """After closing, the next get should create a fresh client."""
        import agent.tools.executor as mod

        mod._http_client = None
        client1 = mod._get_http_client(timeout=15.0)

        # Simulate a closed client
        old_client = mod._http_client
        mod._http_client = MagicMock(spec=httpx.AsyncClient)
        mod._http_client.is_closed = True

        client2 = mod._get_http_client(timeout=15.0)
        assert isinstance(client2, httpx.AsyncClient)
        assert client2 is not old_client

        mod._http_client = None

    def test_pool_limits_are_configured(self) -> None:
        """Verify the pool is created with proper connection limits."""
        import agent.tools.executor as mod

        mod._http_client = None
        client = mod._get_http_client(timeout=15.0)

        pool = client._transport._pool
        assert pool._max_connections == mod.MAX_CONNECTIONS
        assert pool._max_keepalive_connections == mod.MAX_KEEPALIVE_CONNECTIONS

        mod._http_client = None
