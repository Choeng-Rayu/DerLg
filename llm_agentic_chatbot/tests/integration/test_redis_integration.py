"""Integration tests for Redis session persistence (Task 13.2.6).

Tests SessionManager save/load round-trip, TTL setting, expired booking hold
recovery, and graceful degradation when Redis is unavailable.
"""

import os

os.environ["SKIP_SETTINGS_INIT"] = "1"

from datetime import datetime, timedelta, timezone
from typing import Any

import pytest

from agent.session.manager import SESSION_TTL_SECONDS, SessionManager
from agent.session.state import AgentState, ConversationState


# ---------------------------------------------------------------------------
# In-memory Redis fake for deterministic integration testing
# ---------------------------------------------------------------------------


class FakeRedis:
    """Minimal async Redis substitute backed by a plain dict."""

    def __init__(self) -> None:
        self._store: dict[str, str] = {}
        self._ttls: dict[str, int] = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def setex(self, key: str, ttl: int, data: str) -> None:
        self._store[key] = data
        self._ttls[key] = ttl

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)
        self._ttls.pop(key, None)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def fake_redis() -> FakeRedis:
    return FakeRedis()


@pytest.fixture
def session_mgr(fake_redis: FakeRedis) -> SessionManager:
    return SessionManager(fake_redis)


# ---------------------------------------------------------------------------
# Tests: save / load round-trip
# ---------------------------------------------------------------------------


class TestSessionSaveAndLoad:
    """Verify that sessions survive a save -> load cycle."""

    @pytest.mark.asyncio
    async def test_round_trip_preserves_all_fields(
        self, session_mgr: SessionManager
    ) -> None:
        original = ConversationState(
            session_id="test-r-001",
            user_id="user-1",
            state=AgentState.SUGGESTION,
            preferred_language="KH",
            suggested_trip_ids=["trip-a", "trip-b"],
            selected_trip_id="trip-a",
            selected_trip_name="Angkor Discovery",
        )

        await session_mgr.save(original)
        loaded = await session_mgr.load("test-r-001")

        assert loaded is not None
        assert loaded.session_id == "test-r-001"
        assert loaded.user_id == "user-1"
        assert loaded.state == AgentState.SUGGESTION
        assert loaded.preferred_language == "KH"
        assert loaded.suggested_trip_ids == ["trip-a", "trip-b"]
        assert loaded.selected_trip_id == "trip-a"
        assert loaded.selected_trip_name == "Angkor Discovery"

    @pytest.mark.asyncio
    async def test_load_nonexistent_returns_none(
        self, session_mgr: SessionManager
    ) -> None:
        result = await session_mgr.load("does-not-exist")
        assert result is None

    @pytest.mark.asyncio
    async def test_save_updates_last_active(
        self, session_mgr: SessionManager
    ) -> None:
        session = ConversationState(
            session_id="test-r-002",
            user_id="user-1",
        )
        before = session.last_active

        await session_mgr.save(session)

        # last_active should be updated to a more recent timestamp
        assert session.last_active >= before

    @pytest.mark.asyncio
    async def test_overwrite_existing_session(
        self, session_mgr: SessionManager
    ) -> None:
        session = ConversationState(
            session_id="test-r-003",
            user_id="user-1",
            state=AgentState.DISCOVERY,
        )
        await session_mgr.save(session)

        # Mutate and save again
        session.state = AgentState.BOOKING
        session.selected_trip_id = "trip-x"
        await session_mgr.save(session)

        loaded = await session_mgr.load("test-r-003")
        assert loaded is not None
        assert loaded.state == AgentState.BOOKING
        assert loaded.selected_trip_id == "trip-x"


# ---------------------------------------------------------------------------
# Tests: TTL
# ---------------------------------------------------------------------------


class TestSessionTTL:
    """Verify that saves set the expected Redis key TTL."""

    @pytest.mark.asyncio
    async def test_ttl_set_to_seven_days(
        self, session_mgr: SessionManager, fake_redis: FakeRedis
    ) -> None:
        session = ConversationState(
            session_id="test-r-ttl",
            user_id="user-1",
        )
        await session_mgr.save(session)

        assert fake_redis._ttls.get("session:test-r-ttl") == SESSION_TTL_SECONDS


# ---------------------------------------------------------------------------
# Tests: expired booking hold recovery
# ---------------------------------------------------------------------------


class TestExpiredBookingHold:
    """Verify that loading a session with an expired booking hold resets it."""

    @pytest.mark.asyncio
    async def test_expired_hold_resets_to_booking_state(
        self, session_mgr: SessionManager
    ) -> None:
        expired = ConversationState(
            session_id="test-r-expire",
            user_id="user-1",
            state=AgentState.PAYMENT,
            booking_id="booking-123",
            booking_ref="DLG-ABC",
            payment_intent_id="pi_test",
            reserved_until=datetime.now(timezone.utc) - timedelta(minutes=1),
        )
        await session_mgr.save(expired)

        loaded = await session_mgr.load("test-r-expire")

        assert loaded is not None
        assert loaded.state == AgentState.BOOKING
        assert loaded.booking_id is None
        assert loaded.payment_intent_id is None
        assert loaded.reserved_until is None

    @pytest.mark.asyncio
    async def test_valid_hold_is_not_reset(
        self, session_mgr: SessionManager
    ) -> None:
        future = datetime.now(timezone.utc) + timedelta(minutes=10)
        valid = ConversationState(
            session_id="test-r-valid",
            user_id="user-1",
            state=AgentState.PAYMENT,
            booking_id="booking-456",
            booking_ref="DLG-XYZ",
            payment_intent_id="pi_good",
            reserved_until=future,
        )
        await session_mgr.save(valid)

        loaded = await session_mgr.load("test-r-valid")

        assert loaded is not None
        assert loaded.state == AgentState.PAYMENT
        assert loaded.booking_id == "booking-456"
        assert loaded.payment_intent_id == "pi_good"


# ---------------------------------------------------------------------------
# Tests: Redis unavailable graceful degradation
# ---------------------------------------------------------------------------


class TestRedisUnavailable:
    """SessionManager should degrade gracefully when Redis is None."""

    @pytest.mark.asyncio
    async def test_save_does_not_raise(self) -> None:
        mgr = SessionManager(None)
        session = ConversationState(session_id="test-r-nil", user_id="user-1")
        # Must not raise
        await mgr.save(session)

    @pytest.mark.asyncio
    async def test_load_returns_none(self) -> None:
        mgr = SessionManager(None)
        result = await mgr.load("test-r-nil")
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_does_not_raise(self) -> None:
        mgr = SessionManager(None)
        # Must not raise
        await mgr.delete("test-r-nil")


# ---------------------------------------------------------------------------
# Tests: delete
# ---------------------------------------------------------------------------


class TestSessionDelete:
    """Verify session deletion."""

    @pytest.mark.asyncio
    async def test_delete_removes_session(
        self, session_mgr: SessionManager
    ) -> None:
        session = ConversationState(
            session_id="test-r-del",
            user_id="user-1",
        )
        await session_mgr.save(session)

        loaded = await session_mgr.load("test-r-del")
        assert loaded is not None

        await session_mgr.delete("test-r-del")

        loaded_again = await session_mgr.load("test-r-del")
        assert loaded_again is None
