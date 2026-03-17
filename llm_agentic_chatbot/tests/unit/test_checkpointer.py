"""Unit tests for RedisCheckpointer (LangGraph state persistence via Redis).

Tests cover:
    - Saving checkpoints (step key + latest pointer + TTL)
    - Loading checkpoints by exact step
    - Loading the latest checkpoint for conversation resumption
    - Graceful degradation when Redis is unavailable
    - Deleting all checkpoints for a session
    - Step counting
    - Invalid / corrupt data handling
    - Integration with run_agent_graph checkpoint flow
"""

import os

os.environ["SKIP_SETTINGS_INIT"] = "1"

import json
import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch, call

from agent.checkpointer import (
    RedisCheckpointer,
    CHECKPOINT_KEY_PREFIX,
    CHECKPOINT_TTL_SECONDS,
    LATEST_SUFFIX,
)
from agent.session.state import AgentState, ConversationState


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_session(**overrides) -> ConversationState:
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


def _step_key(session_id: str, step: int) -> str:
    return f"{CHECKPOINT_KEY_PREFIX}:{session_id}:{step}"


def _latest_key(session_id: str) -> str:
    return f"{CHECKPOINT_KEY_PREFIX}:{session_id}:{LATEST_SUFFIX}"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def redis_mock():
    """Mock async Redis client."""
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=None)
    mock.setex = AsyncMock()
    mock.delete = AsyncMock()

    # Pipeline mock
    pipe_mock = AsyncMock()
    pipe_mock.setex = MagicMock()
    pipe_mock.execute = AsyncMock(return_value=[True, True])
    mock.pipeline = MagicMock(return_value=pipe_mock)

    # scan_iter mock (async generator)
    async def _empty_scan_iter(*, match=None, count=None):
        return
        yield  # pragma: no cover — makes this an async generator

    mock.scan_iter = _empty_scan_iter
    return mock


@pytest.fixture
def checkpointer(redis_mock) -> RedisCheckpointer:
    return RedisCheckpointer(redis_mock)


@pytest.fixture
def null_checkpointer() -> RedisCheckpointer:
    """Checkpointer with no Redis connection (graceful degradation)."""
    return RedisCheckpointer(None)


# ===================================================================
# SAVE
# ===================================================================


class TestRedisCheckpointerSave:

    @pytest.mark.asyncio
    async def test_save_writes_step_key_and_latest_via_pipeline(
        self, checkpointer, redis_mock
    ):
        session = _make_session()
        result = await checkpointer.save(session, step=1)

        assert result is True
        pipe = redis_mock.pipeline.return_value
        pipe.setex.assert_any_call(
            _step_key("test-session-001", 1),
            CHECKPOINT_TTL_SECONDS,
            session.model_dump_json(),
        )
        pipe.setex.assert_any_call(
            _latest_key("test-session-001"),
            CHECKPOINT_TTL_SECONDS,
            "1",
        )
        pipe.execute.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_save_serializes_valid_json(self, checkpointer, redis_mock):
        session = _make_session(
            state=AgentState.BOOKING,
            selected_trip_id="trip-abc",
            messages=[{"role": "user", "content": [{"type": "text", "text": "hi"}]}],
        )
        await checkpointer.save(session, step=5)

        pipe = redis_mock.pipeline.return_value
        # The first setex call's third arg is the data payload
        data_arg = pipe.setex.call_args_list[0][0][2]
        parsed = json.loads(data_arg)
        assert parsed["session_id"] == "test-session-001"
        assert parsed["state"] == "BOOKING"
        assert parsed["selected_trip_id"] == "trip-abc"

    @pytest.mark.asyncio
    async def test_save_updates_last_active(self, checkpointer, redis_mock):
        old_time = datetime(2020, 1, 1, tzinfo=timezone.utc)
        session = _make_session(last_active=old_time)
        await checkpointer.save(session, step=1)
        assert session.last_active > old_time

    @pytest.mark.asyncio
    async def test_save_returns_false_when_redis_unavailable(self, null_checkpointer):
        session = _make_session()
        result = await null_checkpointer.save(session, step=1)
        assert result is False

    @pytest.mark.asyncio
    async def test_save_increments_step_correctly(self, checkpointer, redis_mock):
        session = _make_session()
        await checkpointer.save(session, step=1)
        await checkpointer.save(session, step=2)
        await checkpointer.save(session, step=3)

        pipe = redis_mock.pipeline.return_value
        # 3 saves => 3 execute calls
        assert pipe.execute.await_count == 3
        # Each save sets the latest pointer — verify the last one is "3"
        latest_calls = [
            c
            for c in pipe.setex.call_args_list
            if c[0][0] == _latest_key("test-session-001")
        ]
        assert latest_calls[-1][0][2] == "3"


# ===================================================================
# LOAD (exact step)
# ===================================================================


class TestRedisCheckpointerLoad:

    @pytest.mark.asyncio
    async def test_load_returns_session_for_existing_step(
        self, checkpointer, redis_mock
    ):
        session = _make_session(state=AgentState.SUGGESTION)
        redis_mock.get.return_value = session.model_dump_json()

        loaded = await checkpointer.load("test-session-001", step=2)

        assert loaded is not None
        assert loaded.session_id == "test-session-001"
        assert loaded.state == "SUGGESTION"
        redis_mock.get.assert_awaited_once_with(_step_key("test-session-001", 2))

    @pytest.mark.asyncio
    async def test_load_returns_none_for_missing_step(
        self, checkpointer, redis_mock
    ):
        redis_mock.get.return_value = None

        loaded = await checkpointer.load("test-session-001", step=99)

        assert loaded is None

    @pytest.mark.asyncio
    async def test_load_returns_none_when_redis_unavailable(
        self, null_checkpointer
    ):
        loaded = await null_checkpointer.load("test-session-001", step=1)
        assert loaded is None

    @pytest.mark.asyncio
    async def test_load_preserves_messages(self, checkpointer, redis_mock):
        msgs = [
            {"role": "user", "content": [{"type": "text", "text": "Hello"}]},
            {
                "role": "assistant",
                "content": [{"type": "text", "text": "Hi there!"}],
            },
        ]
        session = _make_session(messages=msgs)
        redis_mock.get.return_value = session.model_dump_json()

        loaded = await checkpointer.load("test-session-001", step=1)
        assert loaded is not None
        assert len(loaded.messages) == 2
        assert loaded.messages[0]["role"] == "user"
        assert loaded.messages[1]["role"] == "assistant"


# ===================================================================
# LOAD LATEST
# ===================================================================


class TestRedisCheckpointerLoadLatest:

    @pytest.mark.asyncio
    async def test_load_latest_returns_session_and_step(
        self, checkpointer, redis_mock
    ):
        session = _make_session(state=AgentState.EXPLORATION)

        async def _get_side_effect(key):
            if key == _latest_key("test-session-001"):
                return "3"
            if key == _step_key("test-session-001", 3):
                return session.model_dump_json()
            return None

        redis_mock.get.side_effect = _get_side_effect

        loaded, step = await checkpointer.load_latest("test-session-001")

        assert loaded is not None
        assert loaded.state == "EXPLORATION"
        assert step == 3

    @pytest.mark.asyncio
    async def test_load_latest_returns_none_when_no_checkpoints(
        self, checkpointer, redis_mock
    ):
        redis_mock.get.return_value = None

        loaded, step = await checkpointer.load_latest("nonexistent-session")

        assert loaded is None
        assert step == 0

    @pytest.mark.asyncio
    async def test_load_latest_returns_none_for_invalid_step_value(
        self, checkpointer, redis_mock
    ):
        redis_mock.get.return_value = "not-a-number"

        loaded, step = await checkpointer.load_latest("test-session-001")

        assert loaded is None
        assert step == 0

    @pytest.mark.asyncio
    async def test_load_latest_returns_none_when_redis_unavailable(
        self, null_checkpointer
    ):
        loaded, step = await null_checkpointer.load_latest("test-session-001")
        assert loaded is None
        assert step == 0

    @pytest.mark.asyncio
    async def test_load_latest_handles_missing_step_data(
        self, checkpointer, redis_mock
    ):
        """Latest pointer exists but the step data key was evicted."""

        async def _get_side_effect(key):
            if key == _latest_key("test-session-001"):
                return "5"
            # Step 5 data is missing
            return None

        redis_mock.get.side_effect = _get_side_effect

        loaded, step = await checkpointer.load_latest("test-session-001")

        # step is returned as 5 from latest pointer, but session is None
        assert loaded is None
        assert step == 5


# ===================================================================
# DELETE
# ===================================================================


class TestRedisCheckpointerDelete:

    @pytest.mark.asyncio
    async def test_delete_removes_all_session_keys(
        self, checkpointer, redis_mock
    ):
        keys_found = [
            _step_key("test-session-001", 1),
            _step_key("test-session-001", 2),
            _latest_key("test-session-001"),
        ]

        async def _scan_iter(*, match=None, count=None):
            for k in keys_found:
                yield k

        redis_mock.scan_iter = _scan_iter

        await checkpointer.delete("test-session-001")

        redis_mock.delete.assert_awaited_once_with(*keys_found)

    @pytest.mark.asyncio
    async def test_delete_noop_when_no_keys(self, checkpointer, redis_mock):
        # Default scan_iter yields nothing
        await checkpointer.delete("test-session-001")

        redis_mock.delete.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_delete_when_redis_unavailable(self, null_checkpointer):
        # Must not raise
        await null_checkpointer.delete("test-session-001")


# ===================================================================
# GET STEP COUNT
# ===================================================================


class TestRedisCheckpointerGetStepCount:

    @pytest.mark.asyncio
    async def test_returns_step_number(self, checkpointer, redis_mock):
        redis_mock.get.return_value = "7"
        count = await checkpointer.get_step_count("test-session-001")
        assert count == 7

    @pytest.mark.asyncio
    async def test_returns_zero_when_no_checkpoint(
        self, checkpointer, redis_mock
    ):
        redis_mock.get.return_value = None
        count = await checkpointer.get_step_count("test-session-001")
        assert count == 0

    @pytest.mark.asyncio
    async def test_returns_zero_for_invalid_value(
        self, checkpointer, redis_mock
    ):
        redis_mock.get.return_value = "garbage"
        count = await checkpointer.get_step_count("test-session-001")
        assert count == 0

    @pytest.mark.asyncio
    async def test_returns_zero_when_redis_unavailable(
        self, null_checkpointer
    ):
        count = await null_checkpointer.get_step_count("test-session-001")
        assert count == 0


# ===================================================================
# KEY HELPERS
# ===================================================================


class TestKeyHelpers:

    def test_step_key_format(self):
        assert RedisCheckpointer._step_key("sess-1", 5) == "checkpoint:sess-1:5"

    def test_latest_key_format(self):
        assert RedisCheckpointer._latest_key("sess-1") == "checkpoint:sess-1:latest"

    def test_step_key_handles_special_characters(self):
        key = RedisCheckpointer._step_key("user:abc-123", 0)
        assert key == "checkpoint:user:abc-123:0"


# ===================================================================
# ROUND-TRIP (save then load)
# ===================================================================


class TestRoundTrip:

    @pytest.mark.asyncio
    async def test_save_then_load_latest_preserves_state(self, redis_mock):
        """Simulate save + load_latest with a dict-backed fake Redis."""
        store: dict[str, str] = {}

        async def fake_get(key):
            return store.get(key)

        pipe_mock = MagicMock()

        def fake_setex(key, ttl, value):
            store[key] = value

        pipe_mock.setex = MagicMock(side_effect=fake_setex)
        pipe_mock.execute = AsyncMock(return_value=[True, True])

        redis_mock.get = AsyncMock(side_effect=fake_get)
        redis_mock.pipeline = MagicMock(return_value=pipe_mock)

        checkpointer = RedisCheckpointer(redis_mock)

        session = _make_session(
            state=AgentState.CUSTOMIZATION,
            selected_trip_id="trip-xyz",
            selected_trip_name="Phnom Penh City Tour",
            messages=[
                {"role": "user", "content": [{"type": "text", "text": "Show me trips"}]},
            ],
        )

        await checkpointer.save(session, step=1)

        loaded, step = await checkpointer.load_latest("test-session-001")

        assert loaded is not None
        assert step == 1
        assert loaded.session_id == session.session_id
        assert loaded.state == "CUSTOMIZATION"
        assert loaded.selected_trip_id == "trip-xyz"
        assert loaded.selected_trip_name == "Phnom Penh City Tour"
        assert len(loaded.messages) == 1

    @pytest.mark.asyncio
    async def test_multiple_saves_latest_points_to_last(self, redis_mock):
        """Saving multiple steps should make load_latest return the last."""
        store: dict[str, str] = {}

        async def fake_get(key):
            return store.get(key)

        pipe_mock = MagicMock()

        def fake_setex(key, ttl, value):
            store[key] = value

        pipe_mock.setex = MagicMock(side_effect=fake_setex)
        pipe_mock.execute = AsyncMock(return_value=[True, True])

        redis_mock.get = AsyncMock(side_effect=fake_get)
        redis_mock.pipeline = MagicMock(return_value=pipe_mock)

        checkpointer = RedisCheckpointer(redis_mock)

        for i in range(1, 4):
            session = _make_session(
                state=AgentState.DISCOVERY,
                messages=[{"role": "user", "content": [{"type": "text", "text": f"msg-{i}"}]}],
            )
            await checkpointer.save(session, step=i)

        loaded, step = await checkpointer.load_latest("test-session-001")

        assert step == 3
        assert loaded is not None
        assert loaded.messages[0]["content"][0]["text"] == "msg-3"

    @pytest.mark.asyncio
    async def test_load_specific_step_after_multiple_saves(self, redis_mock):
        """Can retrieve a specific earlier checkpoint by step number."""
        store: dict[str, str] = {}

        async def fake_get(key):
            return store.get(key)

        pipe_mock = MagicMock()

        def fake_setex(key, ttl, value):
            store[key] = value

        pipe_mock.setex = MagicMock(side_effect=fake_setex)
        pipe_mock.execute = AsyncMock(return_value=[True, True])

        redis_mock.get = AsyncMock(side_effect=fake_get)
        redis_mock.pipeline = MagicMock(return_value=pipe_mock)

        checkpointer = RedisCheckpointer(redis_mock)

        for i in range(1, 4):
            session = _make_session(
                state=AgentState.DISCOVERY,
                messages=[{"role": "user", "content": [{"type": "text", "text": f"msg-{i}"}]}],
            )
            await checkpointer.save(session, step=i)

        loaded = await checkpointer.load("test-session-001", step=2)

        assert loaded is not None
        assert loaded.messages[0]["content"][0]["text"] == "msg-2"


# ===================================================================
# TTL CONFIGURATION
# ===================================================================


class TestTTLConfiguration:

    def test_default_ttl_is_seven_days(self):
        assert CHECKPOINT_TTL_SECONDS == 7 * 24 * 60 * 60

    @pytest.mark.asyncio
    async def test_pipeline_uses_configured_ttl(self, checkpointer, redis_mock):
        session = _make_session()
        await checkpointer.save(session, step=1)

        pipe = redis_mock.pipeline.return_value
        for setex_call in pipe.setex.call_args_list:
            ttl_arg = setex_call[0][1]
            assert ttl_arg == CHECKPOINT_TTL_SECONDS
