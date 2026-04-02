"""Shared test fixtures for the DerLg AI Agent test suite."""

import os
import json
from datetime import datetime, timezone, timedelta
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Skip global settings initialization during tests
os.environ["SKIP_SETTINGS_INIT"] = "1"

from agent.session.state import AgentState, ConversationState
from agent.models.client import ContentBlock, ModelResponse


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_session(**overrides: Any) -> ConversationState:
    """Create a ConversationState with sensible defaults for testing."""
    defaults = {
        "session_id": "test-session-001",
        "user_id": "test-user-001",
        "state": AgentState.DISCOVERY,
        "preferred_language": "EN",
        "messages": [],
        "suggested_trip_ids": [],
    }
    defaults.update(overrides)
    return ConversationState(**defaults)


def make_model_response(
    *,
    stop_reason: str = "end_turn",
    text: str | None = "Hello!",
    tool_calls: list[dict[str, Any]] | None = None,
) -> ModelResponse:
    """Create a ModelResponse for testing."""
    blocks: list[ContentBlock] = []
    if text:
        blocks.append(ContentBlock(type="text", text=text))
    if tool_calls:
        for tc in tool_calls:
            blocks.append(ContentBlock(
                type="tool_use",
                id=tc["id"],
                name=tc["name"],
                input=tc.get("input", {}),
            ))
    return ModelResponse(stop_reason=stop_reason, content=blocks)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def session() -> ConversationState:
    """A fresh DISCOVERY-stage session."""
    return make_session()


@pytest.fixture
def session_suggestion() -> ConversationState:
    """A session in SUGGESTION stage with suggested trips."""
    return make_session(
        state=AgentState.SUGGESTION,
        suggested_trip_ids=["trip-a", "trip-b", "trip-c"],
    )


@pytest.fixture
def session_booking() -> ConversationState:
    """A session in BOOKING stage."""
    return make_session(
        state=AgentState.BOOKING,
        selected_trip_id="trip-a",
        selected_trip_name="Angkor Discovery",
    )


@pytest.fixture
def session_payment() -> ConversationState:
    """A session in PAYMENT stage with a booking hold."""
    return make_session(
        state=AgentState.PAYMENT,
        booking_id="booking-123",
        booking_ref="DLG-ABC123",
        reserved_until=datetime.now(timezone.utc) + timedelta(minutes=15),
        payment_intent_id="pi_test_123",
    )


@pytest.fixture
def session_post_booking() -> ConversationState:
    """A session in POST_BOOKING stage with confirmed payment."""
    return make_session(
        state=AgentState.POST_BOOKING,
        booking_id="booking-123",
        booking_ref="DLG-ABC123",
        payment_status="CONFIRMED",
    )


@pytest.fixture
def mock_redis():
    """A mock Redis client for SessionManager tests."""
    redis_mock = AsyncMock()
    redis_mock.get = AsyncMock(return_value=None)
    redis_mock.setex = AsyncMock()
    redis_mock.delete = AsyncMock()
    return redis_mock


@pytest.fixture
def mock_settings():
    """Mock settings object for tests that need config."""
    s = MagicMock()
    s.MODEL_BACKEND = "anthropic"
    s.ANTHROPIC_API_KEY = "sk-ant-test-key-1234567890"
    s.OLLAMA_BASE_URL = "http://localhost:11434"
    s.BACKEND_URL = "http://localhost:3001"
    s.AI_SERVICE_KEY = "a" * 32
    s.REDIS_URL = "redis://localhost:6379"
    s.HOST = "0.0.0.0"
    s.PORT = 8000
    s.LOG_LEVEL = "info"
    s.SENTRY_DSN = None
    return s
