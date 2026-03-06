"""
Sliding Window Rate Limiter for DerLg.com AI Agent

Enforces per-session message rate limits using Redis sorted sets.
Each request timestamp is stored as a member in a sorted set keyed
by session ID. Old entries outside the sliding window are pruned on
every check, and the remaining count is compared against the limit.

Default policy: 10 messages per 60-second sliding window per session.

Usage:
    from utils.rate_limiter import rate_limiter

    allowed = await rate_limiter.is_allowed(session_id)
    if not allowed:
        # reject or throttle the request
"""

import time
import structlog
from utils.redis import get_redis_client

logger = structlog.get_logger(__name__)


class RateLimiter:
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def is_allowed(self, session_id: str) -> bool:
        """Check if a request from this session is allowed under the rate limit."""
        redis = get_redis_client()
        if redis is None:
            # If Redis is down, allow the request (fail open)
            return True

        key = f"rate_limit:{session_id}"
        now = time.time()
        window_start = now - self.window_seconds

        pipe = redis.pipeline()
        # Remove old entries outside the window
        pipe.zremrangebyscore(key, 0, window_start)
        # Count entries in window
        pipe.zcard(key)
        # Add current request
        pipe.zadd(key, {str(now): now})
        # Set expiry on the key
        pipe.expire(key, self.window_seconds)

        results = await pipe.execute()
        request_count = results[1]

        if request_count >= self.max_requests:
            logger.warning("rate_limit_exceeded", session_id=session_id, count=request_count)
            return False

        return True


# Singleton
rate_limiter = RateLimiter()
