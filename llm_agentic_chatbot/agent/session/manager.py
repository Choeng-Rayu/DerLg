"""Session persistence via Redis with automatic booking-hold expiry."""

from datetime import datetime, timezone

import redis.asyncio as redis
import structlog

from agent.session.state import AgentState, ConversationState

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

SESSION_KEY_PREFIX = "session"
SESSION_TTL_SECONDS = 7 * 24 * 60 * 60  # 604800 — 7 days


class SessionManager:
    """Persists ConversationState in Redis with 7-day TTL and expired-hold recovery."""

    def __init__(self, redis_client: redis.Redis | None) -> None:
        self.redis = redis_client
        self.ttl_seconds: int = SESSION_TTL_SECONDS

    async def save(self, session: ConversationState) -> None:
        """Serialize *session* to Redis, refreshing the 7-day TTL.

        If Redis is unavailable the failure is logged and the call returns
        silently so the rest of the application can continue operating.
        """
        if self.redis is None:
            logger.warning(
                "session_save_skipped",
                session_id=session.session_id,
                reason="redis unavailable",
            )
            return

        session.last_active = datetime.now(timezone.utc)
        key = f"{SESSION_KEY_PREFIX}:{session.session_id}"
        data = session.model_dump_json()
        await self.redis.setex(key, self.ttl_seconds, data)
        logger.info(
            "session_saved",
            session_id=session.session_id,
            state=session.state,
        )

    async def load(self, session_id: str) -> ConversationState | None:
        """Load a session from Redis, handling expired booking holds.

        Returns ``None`` when Redis is unavailable so callers can treat
        the session as missing and start fresh.
        """
        if self.redis is None:
            logger.warning(
                "session_load_skipped",
                session_id=session_id,
                reason="redis unavailable",
            )
            return None

        key = f"{SESSION_KEY_PREFIX}:{session_id}"
        data: bytes | None = await self.redis.get(key)

        if data is None:
            logger.info("session_not_found", session_id=session_id)
            return None

        session = ConversationState.model_validate_json(data)

        # Auto-expire 15-minute booking holds that have lapsed
        if (
            session.state == AgentState.PAYMENT
            and session.reserved_until is not None
            and datetime.now(timezone.utc) > session.reserved_until
        ):
            session.state = AgentState.BOOKING
            session.booking_id = None
            session.payment_intent_id = None
            session.reserved_until = None
            session.messages.append(
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "System: The 15-minute booking hold has expired.",
                        }
                    ],
                }
            )
            await self.save(session)

        logger.info(
            "session_loaded",
            session_id=session_id,
            state=session.state,
        )
        return session

    async def delete(self, session_id: str) -> None:
        """Remove a session from Redis entirely.

        If Redis is unavailable the call returns silently.
        """
        if self.redis is None:
            logger.warning(
                "session_delete_skipped",
                session_id=session_id,
                reason="redis unavailable",
            )
            return

        key = f"{SESSION_KEY_PREFIX}:{session_id}"
        await self.redis.delete(key)
        logger.info("session_deleted", session_id=session_id)
