"""Unit tests for api/payment_listener.py."""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import asyncio
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock

from api.payment_listener import (
    _subscribe_with_retry,
    listen_for_payment_events,
    PUBSUB_RETRY_MAX_ATTEMPTS,
)


# ---------------------------------------------------------------------------
# _subscribe_with_retry
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_subscribe_with_retry_success():
    mock_pubsub = AsyncMock()
    mock_pubsub.subscribe = AsyncMock()
    mock_redis = MagicMock()
    mock_redis.pubsub.return_value = mock_pubsub

    with patch("api.payment_listener.get_redis_client", return_value=mock_redis):
        pubsub, client = await _subscribe_with_retry("channel:test", "session-1")

    assert pubsub is mock_pubsub
    assert client is mock_redis
    mock_pubsub.subscribe.assert_awaited_once_with("channel:test")


@pytest.mark.asyncio
async def test_subscribe_with_retry_redis_unavailable_all_attempts():
    with patch("api.payment_listener.get_redis_client", return_value=None), \
         patch("api.payment_listener.asyncio.sleep", new_callable=AsyncMock):
        pubsub, client = await _subscribe_with_retry("channel:test", "session-1")

    assert pubsub is None
    assert client is None


@pytest.mark.asyncio
async def test_subscribe_with_retry_subscribe_fails_then_succeeds():
    mock_pubsub_fail = AsyncMock()
    mock_pubsub_fail.subscribe = AsyncMock(side_effect=Exception("conn error"))
    mock_redis_fail = MagicMock()
    mock_redis_fail.pubsub.return_value = mock_pubsub_fail

    mock_pubsub_ok = AsyncMock()
    mock_pubsub_ok.subscribe = AsyncMock()
    mock_redis_ok = MagicMock()
    mock_redis_ok.pubsub.return_value = mock_pubsub_ok

    call_count = 0

    def side_effect():
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return mock_redis_fail
        return mock_redis_ok

    with patch("api.payment_listener.get_redis_client", side_effect=side_effect), \
         patch("api.payment_listener.asyncio.sleep", new_callable=AsyncMock):
        pubsub, client = await _subscribe_with_retry("channel:test", "session-1")

    assert pubsub is mock_pubsub_ok


# ---------------------------------------------------------------------------
# listen_for_payment_events
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_listen_payment_aborts_when_subscribe_fails():
    with patch("api.payment_listener._subscribe_with_retry", new_callable=AsyncMock) as mock_sub:
        mock_sub.return_value = (None, None)
        ws = AsyncMock()
        mgr = AsyncMock()
        await listen_for_payment_events("user1", "session1", ws, mgr)
    # Should complete without error
    ws.send_json.assert_not_called()


@pytest.mark.asyncio
async def test_listen_payment_processes_succeeded_event():
    mock_pubsub = AsyncMock()
    mock_redis = MagicMock()

    from agent.session.state import ConversationState, AgentState

    session = ConversationState(
        session_id="session1",
        user_id="user1",
        state=AgentState.PAYMENT,
        preferred_language="EN",
        messages=[],
        suggested_trip_ids=[],
        booking_ref="BK-123",
    )

    async def mock_listen():
        yield {"type": "subscribe", "data": 1}
        yield {"type": "message", "data": json.dumps({"status": "SUCCEEDED"})}

    mock_pubsub.listen = mock_listen
    mock_pubsub.unsubscribe = AsyncMock()

    ws = AsyncMock()
    mgr = AsyncMock()
    mgr.load = AsyncMock(return_value=session)
    mgr.save = AsyncMock()

    with patch("api.payment_listener._subscribe_with_retry", new_callable=AsyncMock) as mock_sub, \
         patch("api.payment_listener.run_agent", new_callable=AsyncMock) as mock_agent:
        mock_sub.return_value = (mock_pubsub, mock_redis)
        mock_agent.return_value = {"type": "text", "content": "Payment confirmed!"}
        await listen_for_payment_events("user1", "session1", ws, mgr)

    # Should have sent payment_confirmed and agent_response
    assert ws.send_json.call_count >= 2
    first_call = ws.send_json.call_args_list[0][0][0]
    assert first_call["type"] == "payment_confirmed"


@pytest.mark.asyncio
async def test_listen_payment_ignores_non_succeeded():
    mock_pubsub = AsyncMock()
    mock_redis = MagicMock()

    async def mock_listen():
        yield {"type": "message", "data": json.dumps({"status": "PENDING"})}
        yield {"type": "message", "data": json.dumps({"status": "FAILED"})}
        # Then cancel to end the loop
        raise asyncio.CancelledError()

    mock_pubsub.listen = mock_listen

    ws = AsyncMock()
    mgr = AsyncMock()

    with patch("api.payment_listener._subscribe_with_retry", new_callable=AsyncMock) as mock_sub:
        mock_sub.return_value = (mock_pubsub, mock_redis)
        await listen_for_payment_events("user1", "session1", ws, mgr)

    ws.send_json.assert_not_called()


@pytest.mark.asyncio
async def test_listen_payment_handles_invalid_json():
    mock_pubsub = AsyncMock()
    mock_redis = MagicMock()

    async def mock_listen():
        yield {"type": "message", "data": "not-json{{{"}
        raise asyncio.CancelledError()

    mock_pubsub.listen = mock_listen

    ws = AsyncMock()
    mgr = AsyncMock()

    with patch("api.payment_listener._subscribe_with_retry", new_callable=AsyncMock) as mock_sub:
        mock_sub.return_value = (mock_pubsub, mock_redis)
        await listen_for_payment_events("user1", "session1", ws, mgr)

    ws.send_json.assert_not_called()


@pytest.mark.asyncio
async def test_listen_payment_handles_cancelled_error():
    mock_pubsub = AsyncMock()
    mock_redis = MagicMock()

    async def mock_listen():
        raise asyncio.CancelledError()

    mock_pubsub.listen = mock_listen

    ws = AsyncMock()
    mgr = AsyncMock()

    with patch("api.payment_listener._subscribe_with_retry", new_callable=AsyncMock) as mock_sub:
        mock_sub.return_value = (mock_pubsub, mock_redis)
        await listen_for_payment_events("user1", "session1", ws, mgr)

    # Should not raise


@pytest.mark.asyncio
async def test_listen_payment_session_not_found():
    mock_pubsub = AsyncMock()
    mock_redis = MagicMock()

    async def mock_listen():
        yield {"type": "message", "data": json.dumps({"status": "SUCCEEDED"})}
        raise asyncio.CancelledError()

    mock_pubsub.listen = mock_listen

    ws = AsyncMock()
    mgr = AsyncMock()
    mgr.load = AsyncMock(return_value=None)

    with patch("api.payment_listener._subscribe_with_retry", new_callable=AsyncMock) as mock_sub:
        mock_sub.return_value = (mock_pubsub, mock_redis)
        await listen_for_payment_events("user1", "session1", ws, mgr)

    # No payment_confirmed sent because session not found
    ws.send_json.assert_not_called()
