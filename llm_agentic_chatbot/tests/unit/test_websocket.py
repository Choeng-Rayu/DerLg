"""Unit tests for api/websocket.py endpoint logic."""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import json
import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from api.websocket import _validate_session_id, WELCOME_MESSAGES, RESUME_MESSAGES


# ---------------------------------------------------------------------------
# _validate_session_id
# ---------------------------------------------------------------------------

def test_validate_session_id_valid():
    assert _validate_session_id(str(uuid.uuid4())) is True


def test_validate_session_id_invalid():
    assert _validate_session_id("not-a-uuid") is False
    assert _validate_session_id("") is False
    assert _validate_session_id("12345") is False


def test_validate_session_id_nil_uuid():
    assert _validate_session_id("00000000-0000-0000-0000-000000000000") is True


# ---------------------------------------------------------------------------
# Welcome / Resume messages
# ---------------------------------------------------------------------------

def test_welcome_messages_all_languages():
    for lang in ("EN", "KH", "ZH"):
        assert lang in WELCOME_MESSAGES
        assert len(WELCOME_MESSAGES[lang]) > 10


def test_resume_messages_all_languages():
    for lang in ("EN", "KH", "ZH"):
        assert lang in RESUME_MESSAGES
        assert len(RESUME_MESSAGES[lang]) > 10


# ---------------------------------------------------------------------------
# WebSocket endpoint - integration-style with mocks
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_websocket_rejects_invalid_session_id():
    """WebSocket should close with 4000 for invalid session_id."""
    from api.websocket import websocket_endpoint

    ws = AsyncMock()
    ws.close = AsyncMock()

    await websocket_endpoint(ws, "bad-id")
    ws.close.assert_awaited_once()
    args = ws.close.call_args
    assert args[1].get("code") == 4000 or (args[0] and args[0][0] == 4000) or args[1].get("code", None) == 4000


@pytest.mark.asyncio
async def test_websocket_accepts_valid_session_id():
    """WebSocket should accept and wait for auth for valid session_id."""
    from api.websocket import websocket_endpoint, active_connections

    session_id = str(uuid.uuid4())
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.receive_text = AsyncMock(side_effect=Exception("test disconnect"))
    ws.close = AsyncMock()

    mock_redis = MagicMock()
    with patch("api.websocket.get_redis_client", return_value=mock_redis), \
         patch("api.websocket.metrics") as mock_metrics:
        try:
            await websocket_endpoint(ws, session_id)
        except Exception:
            pass

    ws.accept.assert_awaited_once()


@pytest.mark.asyncio
async def test_websocket_auth_timeout():
    """WebSocket should close with 4002 on auth timeout."""
    import asyncio
    from api.websocket import websocket_endpoint, active_connections

    session_id = str(uuid.uuid4())
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.receive_text = AsyncMock(side_effect=asyncio.TimeoutError())
    ws.close = AsyncMock()

    mock_redis = MagicMock()
    with patch("api.websocket.get_redis_client", return_value=mock_redis), \
         patch("api.websocket.metrics") as mock_metrics, \
         patch("api.websocket.asyncio.wait_for", side_effect=asyncio.TimeoutError()):
        await websocket_endpoint(ws, session_id)

    ws.close.assert_awaited()


@pytest.mark.asyncio
async def test_websocket_non_auth_first_message():
    """WebSocket should reject non-auth first messages."""
    import asyncio
    from api.websocket import websocket_endpoint

    session_id = str(uuid.uuid4())
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.close = AsyncMock()
    ws.send_json = AsyncMock()

    # Return a non-auth message
    async def mock_wait_for(coro, timeout=None):
        return json.dumps({"type": "user_message", "content": "hello"})

    mock_redis = MagicMock()
    with patch("api.websocket.get_redis_client", return_value=mock_redis), \
         patch("api.websocket.metrics") as mock_metrics, \
         patch("api.websocket.asyncio.wait_for", side_effect=mock_wait_for):
        await websocket_endpoint(ws, session_id)

    # Should have sent error and closed
    ws.send_json.assert_awaited()
    ws.close.assert_awaited()


@pytest.mark.asyncio
async def test_websocket_new_session_welcome():
    """New sessions should receive welcome message."""
    import asyncio
    from fastapi import WebSocketDisconnect
    from api.websocket import websocket_endpoint
    from agent.session.state import ConversationState

    session_id = str(uuid.uuid4())
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.close = AsyncMock()
    ws.send_json = AsyncMock()

    auth_msg = json.dumps({"type": "auth", "user_id": "user1", "language": "EN"})

    call_count = 0

    async def mock_wait_for(coro, timeout=None):
        return auth_msg

    async def mock_receive_text():
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return auth_msg
        raise WebSocketDisconnect()

    ws.receive_text = AsyncMock(side_effect=mock_receive_text)

    mock_mgr = AsyncMock()
    mock_mgr.load = AsyncMock(return_value=None)
    mock_mgr.save = AsyncMock()

    mock_redis = MagicMock()
    with patch("api.websocket.get_redis_client", return_value=mock_redis), \
         patch("api.websocket.SessionManager", return_value=mock_mgr), \
         patch("api.websocket.metrics") as mock_metrics, \
         patch("api.websocket.listen_for_payment_events", new_callable=AsyncMock) as mock_listen, \
         patch("api.websocket.asyncio.wait_for", side_effect=mock_wait_for), \
         patch("api.websocket.asyncio.create_task") as mock_create_task:
        mock_create_task.return_value = MagicMock()
        mock_create_task.return_value.cancel = MagicMock()
        await websocket_endpoint(ws, session_id)

    # Check welcome message was sent
    sent_messages = [call[0][0] for call in ws.send_json.call_args_list]
    welcome_sent = any(m.get("type") == "welcome" for m in sent_messages)
    assert welcome_sent


@pytest.mark.asyncio
async def test_websocket_existing_session_resume():
    """Existing sessions should receive resume message."""
    import asyncio
    from fastapi import WebSocketDisconnect
    from api.websocket import websocket_endpoint
    from agent.session.state import ConversationState, AgentState

    session_id = str(uuid.uuid4())
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.close = AsyncMock()
    ws.send_json = AsyncMock()

    existing_session = ConversationState(
        session_id=session_id,
        user_id="user1",
        state=AgentState.DISCOVERY,
        preferred_language="EN",
        messages=[],
        suggested_trip_ids=[],
    )

    auth_msg = json.dumps({"type": "auth", "user_id": "user1", "language": "EN"})

    async def mock_wait_for(coro, timeout=None):
        return auth_msg

    async def mock_receive_text():
        raise WebSocketDisconnect()

    ws.receive_text = AsyncMock(side_effect=mock_receive_text)

    mock_mgr = AsyncMock()
    mock_mgr.load = AsyncMock(return_value=existing_session)
    mock_mgr.save = AsyncMock()

    mock_redis = MagicMock()
    with patch("api.websocket.get_redis_client", return_value=mock_redis), \
         patch("api.websocket.SessionManager", return_value=mock_mgr), \
         patch("api.websocket.metrics") as mock_metrics, \
         patch("api.websocket.listen_for_payment_events", new_callable=AsyncMock), \
         patch("api.websocket.asyncio.wait_for", side_effect=mock_wait_for), \
         patch("api.websocket.asyncio.create_task") as mock_create_task:
        mock_create_task.return_value = MagicMock()
        mock_create_task.return_value.cancel = MagicMock()
        await websocket_endpoint(ws, session_id)

    sent_messages = [call[0][0] for call in ws.send_json.call_args_list]
    resume_sent = any(m.get("type") == "resume" for m in sent_messages)
    assert resume_sent
