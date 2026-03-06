"""Unit tests for SessionManager (Redis persistence layer)."""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import json
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock

from agent.session.state import AgentState, ConversationState
from agent.session.manager import SessionManager, SESSION_KEY_PREFIX, SESSION_TTL_SECONDS


@pytest.fixture
def redis_mock():
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=None)
    mock.setex = AsyncMock()
    mock.delete = AsyncMock()
    return mock


@pytest.fixture
def manager(redis_mock):
    return SessionManager(redis_mock)


class TestSessionManagerSave:

    @pytest.mark.asyncio
    async def test_save_sets_redis_key_with_ttl(self, manager, redis_mock):
        session = ConversationState(session_id="s1", user_id="u1")
        await manager.save(session)

        redis_mock.setex.assert_called_once()
        args = redis_mock.setex.call_args
        assert args[0][0] == f"{SESSION_KEY_PREFIX}:s1"
        assert args[0][1] == SESSION_TTL_SECONDS

    @pytest.mark.asyncio
    async def test_save_serializes_to_json(self, manager, redis_mock):
        session = ConversationState(session_id="s2", user_id="u2")
        await manager.save(session)

        stored_data = redis_mock.setex.call_args[0][2]
        parsed = json.loads(stored_data)
        assert parsed["session_id"] == "s2"
        assert parsed["user_id"] == "u2"

    @pytest.mark.asyncio
    async def test_save_updates_last_active(self, manager, redis_mock):
        session = ConversationState(
            session_id="s3",
            user_id="u3",
            last_active=datetime(2020, 1, 1, tzinfo=timezone.utc),
        )
        before = session.last_active
        await manager.save(session)
        assert session.last_active > before


class TestSessionManagerLoad:

    @pytest.mark.asyncio
    async def test_load_returns_none_when_not_found(self, manager, redis_mock):
        redis_mock.get.return_value = None
        result = await manager.load("nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_load_returns_session(self, manager, redis_mock):
        session = ConversationState(session_id="s1", user_id="u1")
        redis_mock.get.return_value = session.model_dump_json().encode()

        loaded = await manager.load("s1")
        assert loaded is not None
        assert loaded.session_id == "s1"
        assert loaded.user_id == "u1"
        assert loaded.state == "DISCOVERY"

    @pytest.mark.asyncio
    async def test_load_expires_booking_hold(self, manager, redis_mock):
        """If session is PAYMENT with an expired hold, revert to BOOKING."""
        session = ConversationState(
            session_id="s1",
            user_id="u1",
            state=AgentState.PAYMENT,
            booking_id="b1",
            payment_intent_id="pi_1",
            reserved_until=datetime.now(timezone.utc) - timedelta(minutes=1),
        )
        redis_mock.get.return_value = session.model_dump_json().encode()

        loaded = await manager.load("s1")
        assert loaded is not None
        assert loaded.state == "BOOKING"
        assert loaded.booking_id is None
        assert loaded.payment_intent_id is None
        assert loaded.reserved_until is None
        # Should have appended an expiry message
        assert any("expired" in str(m) for m in loaded.messages)
        # Should have saved the updated session
        redis_mock.setex.assert_called_once()

    @pytest.mark.asyncio
    async def test_load_does_not_expire_valid_hold(self, manager, redis_mock):
        """If hold is still valid, don't revert."""
        session = ConversationState(
            session_id="s1",
            user_id="u1",
            state=AgentState.PAYMENT,
            booking_id="b1",
            payment_intent_id="pi_1",
            reserved_until=datetime.now(timezone.utc) + timedelta(minutes=10),
        )
        redis_mock.get.return_value = session.model_dump_json().encode()

        loaded = await manager.load("s1")
        assert loaded.state == "PAYMENT"
        assert loaded.booking_id == "b1"

    @pytest.mark.asyncio
    async def test_load_non_payment_state_not_affected(self, manager, redis_mock):
        """Non-PAYMENT states should not be affected by hold logic."""
        session = ConversationState(
            session_id="s1",
            user_id="u1",
            state=AgentState.DISCOVERY,
        )
        redis_mock.get.return_value = session.model_dump_json().encode()

        loaded = await manager.load("s1")
        assert loaded.state == "DISCOVERY"


class TestSessionManagerDelete:

    @pytest.mark.asyncio
    async def test_delete_removes_key(self, manager, redis_mock):
        await manager.delete("s1")
        redis_mock.delete.assert_called_once_with(f"{SESSION_KEY_PREFIX}:s1")
