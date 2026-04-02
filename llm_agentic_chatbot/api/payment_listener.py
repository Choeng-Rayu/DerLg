from __future__ import annotations
import asyncio
import json
from fastapi import WebSocket
import structlog
from agent.session.state import AgentState
from agent.session.manager import SessionManager
from agent.core import run_agent
from utils.redis import get_redis_client

logger = structlog.get_logger(__name__)

PUBSUB_RETRY_MAX_ATTEMPTS = 3
PUBSUB_RETRY_BASE_DELAY_SECONDS = 2.0


async def _subscribe_with_retry(channel_name: str, session_id: str):
    """Obtain a Redis pub/sub subscription, retrying with exponential backoff.

    Tries up to ``PUBSUB_RETRY_MAX_ATTEMPTS`` times with delays of
    2 s, 4 s, 8 s.  Returns a ``(pubsub, redis_client)`` tuple on
    success or ``(None, None)`` if all attempts are exhausted.
    """
    for attempt in range(1, PUBSUB_RETRY_MAX_ATTEMPTS + 1):
        redis_client = get_redis_client()
        if redis_client is None:
            delay = PUBSUB_RETRY_BASE_DELAY_SECONDS * (2 ** (attempt - 1))
            logger.warning(
                "payment_listener_redis_unavailable",
                attempt=attempt,
                max_attempts=PUBSUB_RETRY_MAX_ATTEMPTS,
                retry_in_seconds=delay,
                session_id=session_id,
                channel=channel_name,
            )
            await asyncio.sleep(delay)
            continue

        try:
            pubsub = redis_client.pubsub()
            await pubsub.subscribe(channel_name)
            logger.info(
                "payment_listener_subscribed",
                channel=channel_name,
                session_id=session_id,
                attempt=attempt,
            )
            return pubsub, redis_client
        except Exception as exc:
            delay = PUBSUB_RETRY_BASE_DELAY_SECONDS * (2 ** (attempt - 1))
            logger.warning(
                "payment_listener_subscribe_failed",
                attempt=attempt,
                max_attempts=PUBSUB_RETRY_MAX_ATTEMPTS,
                retry_in_seconds=delay,
                error=str(exc),
                session_id=session_id,
                channel=channel_name,
            )
            await asyncio.sleep(delay)

    logger.error(
        "payment_listener_subscribe_exhausted",
        max_attempts=PUBSUB_RETRY_MAX_ATTEMPTS,
        session_id=session_id,
        channel=channel_name,
    )
    return None, None


async def listen_for_payment_events(
    user_id: str,
    session_id: str,
    websocket: WebSocket,
    session_mgr: SessionManager,
) -> None:
    """Background task that listens for payment confirmation via Redis pub/sub."""
    channel_name = f"payment_events:{user_id}"

    try:
        pubsub, redis_client = await _subscribe_with_retry(channel_name, session_id)
        if pubsub is None:
            logger.error(
                "payment_listener_aborted",
                reason="could not connect to Redis after retries",
                session_id=session_id,
            )
            return

        logger.info("payment_listener_started", channel=channel_name, session_id=session_id)

        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            try:
                data = json.loads(message["data"])
            except (json.JSONDecodeError, TypeError):
                continue

            status = data.get("status")
            if status != "SUCCEEDED":
                continue

            logger.info("payment_confirmed_event", session_id=session_id, user_id=user_id)

            # Load and update session
            session = await session_mgr.load(session_id)
            if not session:
                continue

            session.payment_status = "CONFIRMED"
            session.state = AgentState.POST_BOOKING
            await session_mgr.save(session)

            # Notify frontend
            await websocket.send_json({
                "type": "payment_confirmed",
                "content": "Payment confirmed!",
                "booking_ref": session.booking_ref,
            })

            # Generate confirmation message via agent
            try:
                response = await run_agent(session, "System: Payment has been confirmed successfully.")
                await session_mgr.save(session)
                await websocket.send_json({"type": "agent_response", **response})
            except Exception as e:
                logger.error("payment_confirmation_agent_error", error=str(e))

            # Unsubscribe after successful payment
            await pubsub.unsubscribe(channel_name)
            break

    except asyncio.CancelledError:
        logger.info("payment_listener_cancelled", session_id=session_id)
    except Exception as e:
        logger.error("payment_listener_error", error=str(e), exc_info=True)
