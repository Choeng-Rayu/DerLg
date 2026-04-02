"""Redis-backed checkpoint persistence for LangGraph state.

Stores serialized ``ConversationState`` snapshots in Redis so that
conversations can be resumed across server restarts and WebSocket
reconnects.

Key schema:
    checkpoint:{session_id}:{step}   -- individual snapshot
    checkpoint:{session_id}:latest    -- pointer to the most recent step

All keys share a 7-day TTL that is refreshed on every write.

Usage::

    from agent.checkpointer import RedisCheckpointer
    from utils.redis import get_redis_client

    checkpointer = RedisCheckpointer(get_redis_client())

    # After a graph turn completes
    await checkpointer.save(session, step=3)

    # When a user reconnects
    session = await checkpointer.load_latest(session_id)
"""

from __future__ import annotations

from datetime import datetime, timezone

import redis.asyncio as redis
import structlog

from agent.session.state import ConversationState

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

CHECKPOINT_KEY_PREFIX = "checkpoint"
CHECKPOINT_TTL_SECONDS = 7 * 24 * 60 * 60  # 604 800 -- 7 days
LATEST_SUFFIX = "latest"


class RedisCheckpointer:
    """Persist LangGraph ``ConversationState`` snapshots in Redis.

    Each snapshot is stored under ``checkpoint:{session_id}:{step}`` and
    a ``checkpoint:{session_id}:latest`` key tracks the highest step so
    that ``load_latest`` can retrieve it in O(1).

    When Redis is unavailable every public method degrades gracefully --
    saves are silently skipped and loads return ``None``.
    """

    def __init__(self, redis_client: redis.Redis | None) -> None:
        self._redis = redis_client
        self._ttl: int = CHECKPOINT_TTL_SECONDS

    # ------------------------------------------------------------------
    # Key helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _step_key(session_id: str, step: int) -> str:
        """Return the Redis key for a specific checkpoint step."""
        return f"{CHECKPOINT_KEY_PREFIX}:{session_id}:{step}"

    @staticmethod
    def _latest_key(session_id: str) -> str:
        """Return the Redis key that stores the latest step number."""
        return f"{CHECKPOINT_KEY_PREFIX}:{session_id}:{LATEST_SUFFIX}"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def save(
        self,
        session: ConversationState,
        step: int,
    ) -> bool:
        """Serialize *session* into Redis at the given *step*.

        Updates the ``latest`` pointer so ``load_latest`` always finds
        the most recent checkpoint.

        Args:
            session: The conversation state to persist.
            step: Monotonically increasing step counter (typically the
                  number of completed graph turns for this session).

        Returns:
            ``True`` when the checkpoint was written, ``False`` when
            Redis was unavailable and the write was skipped.
        """
        if self._redis is None:
            logger.warning(
                "checkpoint_save_skipped",
                session_id=session.session_id,
                step=step,
                reason="redis unavailable",
            )
            return False

        session.last_active = datetime.now(timezone.utc)

        step_key = self._step_key(session.session_id, step)
        latest_key = self._latest_key(session.session_id)
        data = session.model_dump_json()

        pipe = self._redis.pipeline()
        pipe.setex(step_key, self._ttl, data)
        pipe.setex(latest_key, self._ttl, str(step))
        await pipe.execute()

        logger.info(
            "checkpoint_saved",
            session_id=session.session_id,
            step=step,
            state=session.state,
        )
        return True

    async def load(
        self,
        session_id: str,
        step: int,
    ) -> ConversationState | None:
        """Load a specific checkpoint by *session_id* and *step*.

        Args:
            session_id: The session to look up.
            step: Exact step number to retrieve.

        Returns:
            The restored ``ConversationState``, or ``None`` if the key
            does not exist or Redis is unavailable.
        """
        if self._redis is None:
            logger.warning(
                "checkpoint_load_skipped",
                session_id=session_id,
                step=step,
                reason="redis unavailable",
            )
            return None

        step_key = self._step_key(session_id, step)
        data: str | None = await self._redis.get(step_key)

        if data is None:
            logger.info(
                "checkpoint_not_found",
                session_id=session_id,
                step=step,
            )
            return None

        session = ConversationState.model_validate_json(data)
        logger.info(
            "checkpoint_loaded",
            session_id=session_id,
            step=step,
            state=session.state,
        )
        return session

    async def load_latest(
        self,
        session_id: str,
    ) -> tuple[ConversationState | None, int]:
        """Load the most recent checkpoint for *session_id*.

        Returns:
            A ``(session, step)`` tuple.  Both values are ``(None, 0)``
            when no checkpoint exists or Redis is down.
        """
        if self._redis is None:
            logger.warning(
                "checkpoint_load_latest_skipped",
                session_id=session_id,
                reason="redis unavailable",
            )
            return None, 0

        latest_key = self._latest_key(session_id)
        step_raw: str | None = await self._redis.get(latest_key)

        if step_raw is None:
            logger.info(
                "checkpoint_no_latest",
                session_id=session_id,
            )
            return None, 0

        try:
            step = int(step_raw)
        except (ValueError, TypeError):
            logger.error(
                "checkpoint_invalid_latest_step",
                session_id=session_id,
                raw_value=step_raw,
            )
            return None, 0

        session = await self.load(session_id, step)
        return session, step

    async def delete(self, session_id: str) -> None:
        """Remove **all** checkpoints for *session_id*.

        Scans for matching keys and deletes them in one pipeline call.
        Safe to call when Redis is down.
        """
        if self._redis is None:
            logger.warning(
                "checkpoint_delete_skipped",
                session_id=session_id,
                reason="redis unavailable",
            )
            return

        pattern = f"{CHECKPOINT_KEY_PREFIX}:{session_id}:*"
        keys: list[str] = []

        async for key in self._redis.scan_iter(match=pattern, count=100):
            keys.append(key)

        if keys:
            await self._redis.delete(*keys)
            logger.info(
                "checkpoints_deleted",
                session_id=session_id,
                count=len(keys),
            )
        else:
            logger.info(
                "checkpoints_delete_noop",
                session_id=session_id,
            )

    async def get_step_count(self, session_id: str) -> int:
        """Return the latest step number, or ``0`` if none exists."""
        if self._redis is None:
            return 0

        latest_key = self._latest_key(session_id)
        step_raw: str | None = await self._redis.get(latest_key)

        if step_raw is None:
            return 0

        try:
            return int(step_raw)
        except (ValueError, TypeError):
            return 0
