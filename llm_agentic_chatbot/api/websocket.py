from __future__ import annotations
import asyncio
import json
import uuid
from typing import Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import structlog
from agent.core import run_agent
from agent.session.state import ConversationState, AgentState
from agent.session.manager import SessionManager
from utils.redis import get_redis_client
from utils.rate_limiter import rate_limiter
from utils.sanitizer import sanitize_user_input
from api.payment_listener import listen_for_payment_events
from api.metrics import metrics

logger = structlog.get_logger(__name__)
router = APIRouter()

# Active WebSocket connections: session_id -> WebSocket
active_connections: dict[str, WebSocket] = {}

WELCOME_MESSAGES = {
    "EN": "Hello! I'm DerLg, your Cambodia travel concierge. I'd love to help you discover and book an amazing trip to Cambodia! What kind of experience are you looking for?",
    "KH": "សួស្តី! ខ្ញុំជា DerLg ទីប្រឹក្សាទេសចរណ៍កម្ពុជារបស់អ្នក។ ខ្ញុំរីករាយក្នុងការជួយអ្នករកមើល និងកក់ដំណើរកម្សាន្តដ៏អស្ចារ្យមួយទៅកម្ពុជា! តើអ្នកកំពុងរកបទពិសោធន៍បែបណា?",
    "ZH": "你好！我是DerLg，你的柬埔寨旅行顾问。我很乐意帮助你发现和预订一次精彩的柬埔寨之旅！你在寻找什么样的体验？",
}

RESUME_MESSAGES = {
    "EN": "Welcome back! I remember our conversation. Let me pick up where we left off.",
    "KH": "សូមស្វាគមន៍ត្រឡប់មកវិញ! ខ្ញុំចាំការសន្ទនារបស់យើង។ សូមឱ្យខ្ញុំបន្តពីកន្លែងដែលយើងឈប់។",
    "ZH": "欢迎回来！我记得我们的对话。让我从上次停下的地方继续。",
}


def _validate_session_id(session_id: str) -> bool:
    try:
        uuid.UUID(session_id)
        return True
    except ValueError:
        return False


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    # Validate session_id format
    if not _validate_session_id(session_id):
        await websocket.close(code=4000, reason="Invalid session_id format")
        return

    await websocket.accept()
    logger.info("websocket_connected", session_id=session_id)

    # Get Redis and session manager
    redis_client = get_redis_client()
    session_mgr = SessionManager(redis_client)

    # Track connection
    active_connections[session_id] = websocket
    metrics.set_active_connections(len(active_connections))
    payment_listener_task: asyncio.Task | None = None
    session: ConversationState | None = None

    try:
        # Wait for auth message with timeout
        try:
            raw = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
        except asyncio.TimeoutError:
            await websocket.close(code=4002, reason="Auth timeout")
            return
        auth_msg = json.loads(raw)

        if auth_msg.get("type") != "auth":
            await websocket.send_json({"type": "error", "content": "First message must be auth"})
            await websocket.close(code=4001)
            return

        user_id = auth_msg.get("user_id", "")
        language = auth_msg.get("language", "EN").upper()
        if language not in ("EN", "KH", "ZH"):
            language = "EN"

        # Load or create session
        session = await session_mgr.load(session_id)
        is_new = session is None

        if is_new:
            session = ConversationState(
                session_id=session_id,
                user_id=user_id,
                preferred_language=language,
            )
        else:
            session.user_id = user_id
            session.preferred_language = language

        await session_mgr.save(session)

        # Start payment event listener
        payment_listener_task = asyncio.create_task(
            listen_for_payment_events(user_id, session_id, websocket, session_mgr)
        )

        # Send welcome or resume message
        if is_new:
            welcome = WELCOME_MESSAGES.get(language, WELCOME_MESSAGES["EN"])
            await websocket.send_json({"type": "welcome", "content": welcome})
        else:
            resume = RESUME_MESSAGES.get(language, RESUME_MESSAGES["EN"])
            await websocket.send_json({"type": "resume", "content": resume})

        # Message loop
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg.get("type") != "user_message":
                continue

            content = sanitize_user_input(msg.get("content", ""))
            if not content:
                continue

            # Rate limit check
            if not await rate_limiter.is_allowed(session_id):
                await websocket.send_json({
                    "type": "error",
                    "content": "You're sending messages too quickly. Please wait a moment.",
                })
                continue

            # Send typing indicator
            await websocket.send_json({"type": "typing_start"})

            try:
                # Run the agent
                response = await run_agent(session, content)
                metrics.increment_messages()

                # Save session after processing
                await session_mgr.save(session)

                # Send response
                await websocket.send_json({"type": "typing_end"})
                await websocket.send_json({"type": "agent_response", **response})

            except Exception as e:
                logger.error("agent_error", error=str(e), exc_info=True)
                metrics.increment_errors()
                await websocket.send_json({"type": "typing_end"})
                await websocket.send_json({
                    "type": "error",
                    "content": "I encountered an issue processing your message. Please try again.",
                })

    except WebSocketDisconnect:
        logger.info("websocket_disconnected", session_id=session_id)
    except Exception as e:
        logger.error("websocket_error", error=str(e), exc_info=True)
    finally:
        # Clean up
        if payment_listener_task:
            payment_listener_task.cancel()
        if session:
            await session_mgr.save(session)
        active_connections.pop(session_id, None)
        metrics.set_active_connections(len(active_connections))
        logger.info("websocket_cleanup_complete", session_id=session_id)
