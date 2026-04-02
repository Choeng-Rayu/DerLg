"""Unit tests for the Prometheus-format metrics module.

Tests cover the Metrics counter class (increment / set operations) and the
/metrics HTTP endpoint (Prometheus text exposition format).
"""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import pytest
from unittest.mock import patch

from api.metrics import Metrics, router

from httpx import ASGITransport, AsyncClient
from fastapi import FastAPI


def _make_app() -> FastAPI:
    """Create a minimal FastAPI app with only the metrics router."""
    app = FastAPI()
    app.include_router(router)
    return app


# ---------------------------------------------------------------------------
# Metrics class counters
# ---------------------------------------------------------------------------


class TestMetricsCounters:
    """Tests for the Metrics data class."""

    def test_initial_values_are_zero(self):
        m = Metrics()
        assert m.messages_processed == 0
        assert m.tool_calls_total == 0
        assert m.active_connections == 0
        assert m.errors_total == 0
        assert m.model_calls_total == 0

    def test_increment_messages(self):
        m = Metrics()
        m.increment_messages()
        assert m.messages_processed == 1
        m.increment_messages()
        assert m.messages_processed == 2

    def test_increment_tool_calls_default(self):
        m = Metrics()
        m.increment_tool_calls()
        assert m.tool_calls_total == 1

    def test_increment_tool_calls_custom_count(self):
        m = Metrics()
        m.increment_tool_calls(count=5)
        assert m.tool_calls_total == 5
        m.increment_tool_calls(count=3)
        assert m.tool_calls_total == 8

    def test_increment_errors(self):
        m = Metrics()
        m.increment_errors()
        m.increment_errors()
        m.increment_errors()
        assert m.errors_total == 3

    def test_increment_model_calls(self):
        m = Metrics()
        m.increment_model_calls()
        assert m.model_calls_total == 1

    def test_set_active_connections(self):
        m = Metrics()
        m.set_active_connections(10)
        assert m.active_connections == 10
        m.set_active_connections(5)
        assert m.active_connections == 5

    def test_set_active_connections_to_zero(self):
        m = Metrics()
        m.set_active_connections(10)
        m.set_active_connections(0)
        assert m.active_connections == 0

    def test_start_time_is_set(self):
        m = Metrics()
        assert m._start_time > 0


# ---------------------------------------------------------------------------
# /metrics endpoint
# ---------------------------------------------------------------------------


class TestMetricsEndpoint:
    """Tests for the /metrics HTTP endpoint."""

    @pytest.mark.asyncio
    async def test_metrics_returns_200(self):
        app = _make_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/metrics")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_metrics_content_type_is_text_plain(self):
        app = _make_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/metrics")
        assert "text/plain" in resp.headers["content-type"]

    @pytest.mark.asyncio
    async def test_metrics_contains_prometheus_format(self):
        app = _make_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/metrics")
        body = resp.text

        # Check for HELP and TYPE lines (Prometheus exposition format)
        assert "# HELP ai_agent_uptime_seconds" in body
        assert "# TYPE ai_agent_uptime_seconds gauge" in body
        assert "# HELP ai_agent_messages_processed_total" in body
        assert "# TYPE ai_agent_messages_processed_total counter" in body
        assert "# HELP ai_agent_tool_calls_total" in body
        assert "# TYPE ai_agent_tool_calls_total counter" in body
        assert "# HELP ai_agent_active_connections" in body
        assert "# TYPE ai_agent_active_connections gauge" in body
        assert "# HELP ai_agent_errors_total" in body
        assert "# TYPE ai_agent_errors_total counter" in body
        assert "# HELP ai_agent_model_calls_total" in body
        assert "# TYPE ai_agent_model_calls_total counter" in body

    @pytest.mark.asyncio
    async def test_metrics_contains_counter_values(self):
        app = _make_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/metrics")
        body = resp.text

        # The module-level metrics singleton is used; values depend on state,
        # but the format should contain the metric name followed by a number.
        assert "ai_agent_uptime_seconds " in body
        assert "ai_agent_messages_processed_total " in body
        assert "ai_agent_tool_calls_total " in body
        assert "ai_agent_active_connections " in body
        assert "ai_agent_errors_total " in body
        assert "ai_agent_model_calls_total " in body

    @pytest.mark.asyncio
    async def test_metrics_body_ends_with_newline(self):
        app = _make_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/metrics")
        assert resp.text.endswith("\n")

    @pytest.mark.asyncio
    async def test_metrics_uptime_is_positive(self):
        """Uptime value should be a positive float."""
        app = _make_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/metrics")
        body = resp.text

        for line in body.splitlines():
            if line.startswith("ai_agent_uptime_seconds "):
                value = float(line.split()[-1])
                assert value >= 0
                break
        else:
            pytest.fail("ai_agent_uptime_seconds metric line not found")
