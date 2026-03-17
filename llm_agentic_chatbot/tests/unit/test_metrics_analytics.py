"""Unit tests for the analytics extensions to the Metrics class.

Tests cover:
- Tool usage tracking by name
- State transition recording
- Conversation duration tracking
- Prometheus endpoint output for new metrics
"""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import time
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
# Tool usage by name
# ---------------------------------------------------------------------------


class TestToolUsageByName:
    """Tests for record_tool_usage / get_tool_usage."""

    def test_no_usage_initially(self) -> None:
        m = Metrics()
        assert m.get_tool_usage() == {}

    def test_record_single_tool(self) -> None:
        m = Metrics()
        m.record_tool_usage("getTripSuggestions")
        assert m.get_tool_usage() == {"getTripSuggestions": 1}

    def test_record_multiple_calls_same_tool(self) -> None:
        m = Metrics()
        m.record_tool_usage("getTripSuggestions")
        m.record_tool_usage("getTripSuggestions")
        m.record_tool_usage("getTripSuggestions")
        assert m.get_tool_usage()["getTripSuggestions"] == 3

    def test_record_different_tools(self) -> None:
        m = Metrics()
        m.record_tool_usage("getTripSuggestions")
        m.record_tool_usage("getWeather")
        m.record_tool_usage("createBooking")
        m.record_tool_usage("getWeather")
        usage = m.get_tool_usage()
        assert usage["getTripSuggestions"] == 1
        assert usage["getWeather"] == 2
        assert usage["createBooking"] == 1

    def test_get_tool_usage_returns_copy(self) -> None:
        m = Metrics()
        m.record_tool_usage("toolA")
        snapshot = m.get_tool_usage()
        snapshot["toolA"] = 999  # Mutating the copy
        assert m.get_tool_usage()["toolA"] == 1  # Original unchanged


# ---------------------------------------------------------------------------
# State transitions
# ---------------------------------------------------------------------------


class TestStateTransitions:
    """Tests for record_state_transition / get_state_transitions."""

    def test_no_transitions_initially(self) -> None:
        m = Metrics()
        assert m.get_state_transitions() == {}

    def test_record_single_transition(self) -> None:
        m = Metrics()
        m.record_state_transition("DISCOVERY", "SUGGESTION")
        result = m.get_state_transitions()
        assert result == {"DISCOVERY": {"SUGGESTION": 1}}

    def test_record_same_transition_multiple_times(self) -> None:
        m = Metrics()
        m.record_state_transition("DISCOVERY", "SUGGESTION")
        m.record_state_transition("DISCOVERY", "SUGGESTION")
        result = m.get_state_transitions()
        assert result["DISCOVERY"]["SUGGESTION"] == 2

    def test_record_multiple_transitions(self) -> None:
        m = Metrics()
        m.record_state_transition("DISCOVERY", "SUGGESTION")
        m.record_state_transition("SUGGESTION", "EXPLORATION")
        m.record_state_transition("EXPLORATION", "BOOKING")
        result = m.get_state_transitions()
        assert result["DISCOVERY"]["SUGGESTION"] == 1
        assert result["SUGGESTION"]["EXPLORATION"] == 1
        assert result["EXPLORATION"]["BOOKING"] == 1

    def test_get_state_transitions_returns_copy(self) -> None:
        m = Metrics()
        m.record_state_transition("A", "B")
        snapshot = m.get_state_transitions()
        snapshot["A"]["B"] = 999
        assert m.get_state_transitions()["A"]["B"] == 1  # Original unchanged


# ---------------------------------------------------------------------------
# Conversation duration
# ---------------------------------------------------------------------------


class TestConversationDuration:
    """Tests for start_conversation / end_conversation / get_conversation_duration_stats."""

    def test_empty_stats_when_no_conversations(self) -> None:
        m = Metrics()
        stats = m.get_conversation_duration_stats()
        assert stats["count"] == 0
        assert stats["min"] == 0.0
        assert stats["max"] == 0.0
        assert stats["avg"] == 0.0
        assert stats["total"] == 0.0

    def test_single_conversation_duration(self) -> None:
        m = Metrics()
        m.start_conversation("sess-1")
        time.sleep(0.05)
        m.end_conversation("sess-1")

        stats = m.get_conversation_duration_stats()
        assert stats["count"] == 1
        assert stats["min"] >= 0.04  # At least 40ms
        assert stats["max"] >= 0.04
        assert stats["avg"] >= 0.04
        assert stats["total"] >= 0.04

    def test_multiple_conversations(self) -> None:
        m = Metrics()
        m.start_conversation("sess-a")
        time.sleep(0.02)
        m.end_conversation("sess-a")

        m.start_conversation("sess-b")
        time.sleep(0.02)
        m.end_conversation("sess-b")

        stats = m.get_conversation_duration_stats()
        assert stats["count"] == 2
        assert stats["total"] >= 0.04

    def test_end_without_start_is_noop(self) -> None:
        m = Metrics()
        m.end_conversation("unknown-session")
        stats = m.get_conversation_duration_stats()
        assert stats["count"] == 0

    def test_start_clears_previous_start(self) -> None:
        m = Metrics()
        m.start_conversation("sess-1")
        # Start again (overwrites previous start time)
        m.start_conversation("sess-1")
        time.sleep(0.02)
        m.end_conversation("sess-1")

        stats = m.get_conversation_duration_stats()
        assert stats["count"] == 1


# ---------------------------------------------------------------------------
# Prometheus endpoint with analytics metrics
# ---------------------------------------------------------------------------


class TestMetricsEndpointAnalytics:
    """Tests for the /metrics endpoint including analytics lines."""

    @pytest.mark.asyncio
    async def test_endpoint_contains_tool_usage_section(self) -> None:
        app = _make_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/metrics")
        body = resp.text
        assert "# HELP ai_agent_tool_usage_by_name" in body
        assert "# TYPE ai_agent_tool_usage_by_name counter" in body

    @pytest.mark.asyncio
    async def test_endpoint_contains_state_transitions_section(self) -> None:
        app = _make_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/metrics")
        body = resp.text
        assert "# HELP ai_agent_state_transitions" in body
        assert "# TYPE ai_agent_state_transitions counter" in body

    @pytest.mark.asyncio
    async def test_endpoint_contains_conversation_duration_section(self) -> None:
        app = _make_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/metrics")
        body = resp.text
        assert "# HELP ai_agent_conversation_duration_seconds" in body
        assert "# TYPE ai_agent_conversation_duration_seconds summary" in body
        assert "ai_agent_conversation_duration_seconds_count" in body
        assert "ai_agent_conversation_duration_seconds_total" in body

    @pytest.mark.asyncio
    async def test_endpoint_still_has_original_metrics(self) -> None:
        """Ensure we did not break the existing metric lines."""
        app = _make_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/metrics")
        body = resp.text

        assert "# HELP ai_agent_uptime_seconds" in body
        assert "# HELP ai_agent_messages_processed_total" in body
        assert "# HELP ai_agent_tool_calls_total" in body
        assert "# HELP ai_agent_active_connections" in body
        assert "# HELP ai_agent_errors_total" in body
        assert "# HELP ai_agent_model_calls_total" in body

    @pytest.mark.asyncio
    async def test_endpoint_returns_200(self) -> None:
        app = _make_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/metrics")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_endpoint_body_ends_with_newline(self) -> None:
        app = _make_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/metrics")
        assert resp.text.endswith("\n")
