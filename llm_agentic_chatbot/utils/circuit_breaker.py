"""
Circuit Breaker for DerLg.com AI Agent Backend Calls

Implements the Circuit Breaker pattern to protect the agent from cascading
failures when the NestJS backend becomes unhealthy. The breaker tracks
consecutive failures and temporarily blocks requests once a threshold is
reached, giving the backend time to recover.

States:
    CLOSED   -- Normal operation. Every call goes through.
    OPEN     -- Backend is considered down. Calls are blocked immediately.
    HALF_OPEN -- After a cooldown period the breaker allows a single probe
                 request. Success closes the circuit; failure re-opens it.

Usage::

    from utils.circuit_breaker import CircuitBreaker

    cb = CircuitBreaker(failure_threshold=5, recovery_timeout=30)

    if not cb.can_execute():
        return "Backend unavailable, please try again later."

    try:
        response = await client.get(url)
        cb.record_success()
    except Exception:
        cb.record_failure()
"""

import time
from enum import Enum

import structlog

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)


class CircuitState(Enum):
    """Possible states of the circuit breaker."""

    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    """Track consecutive backend failures and trip the circuit when a threshold is exceeded.

    Args:
        failure_threshold: Number of consecutive failures required to open
            the circuit. Defaults to ``5``.
        recovery_timeout: Seconds to wait before transitioning from OPEN to
            HALF_OPEN for a probe request. Defaults to ``30``.
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 30,
    ) -> None:
        self._failure_threshold: int = failure_threshold
        self._recovery_timeout: float = recovery_timeout

        self._failure_count: int = 0
        self._last_failure_time: float = 0.0
        self._state: CircuitState = CircuitState.CLOSED

        logger.info(
            "circuit_breaker_initialized",
            failure_threshold=failure_threshold,
            recovery_timeout_s=recovery_timeout,
        )

    # -- public API -----------------------------------------------------------

    @property
    def state(self) -> CircuitState:
        """Return the current circuit state, evaluating time-based transitions.

        When the circuit is OPEN and the recovery timeout has elapsed the state
        is automatically promoted to HALF_OPEN so the next call acts as a probe.
        """
        if self._state is CircuitState.OPEN:
            elapsed = time.monotonic() - self._last_failure_time
            if elapsed >= self._recovery_timeout:
                self._state = CircuitState.HALF_OPEN
                logger.info(
                    "circuit_breaker_half_open",
                    elapsed_s=round(elapsed, 2),
                    recovery_timeout_s=self._recovery_timeout,
                )
        return self._state

    def can_execute(self) -> bool:
        """Return ``True`` if a backend call is allowed right now.

        * CLOSED   -- always allowed.
        * HALF_OPEN -- allowed (single probe request).
        * OPEN     -- blocked.
        """
        current = self.state  # triggers time-based transition
        if current is CircuitState.OPEN:
            logger.warning(
                "circuit_breaker_rejected",
                failure_count=self._failure_count,
                seconds_until_retry=round(
                    max(
                        0.0,
                        self._recovery_timeout
                        - (time.monotonic() - self._last_failure_time),
                    ),
                    1,
                ),
            )
            return False
        return True

    def record_success(self) -> None:
        """Record a successful backend response.

        * In HALF_OPEN state this closes the circuit and resets the counter.
        * In CLOSED state this merely resets the consecutive failure counter.
        """
        previous = self._state

        self._failure_count = 0
        self._state = CircuitState.CLOSED

        if previous is CircuitState.HALF_OPEN:
            logger.info(
                "circuit_breaker_closed",
                reason="successful_probe",
            )

    def record_failure(self) -> None:
        """Record a failed backend call.

        Increments the consecutive failure counter and, if the threshold is
        reached, opens the circuit.  In HALF_OPEN state a single failure
        immediately re-opens the circuit.
        """
        self._failure_count += 1
        self._last_failure_time = time.monotonic()

        if self._state is CircuitState.HALF_OPEN:
            self._state = CircuitState.OPEN
            logger.warning(
                "circuit_breaker_reopened",
                reason="probe_failed",
                failure_count=self._failure_count,
            )
            return

        if self._failure_count >= self._failure_threshold:
            self._state = CircuitState.OPEN
            logger.error(
                "circuit_breaker_opened",
                failure_count=self._failure_count,
                failure_threshold=self._failure_threshold,
                recovery_timeout_s=self._recovery_timeout,
            )
        else:
            logger.warning(
                "circuit_breaker_failure_recorded",
                failure_count=self._failure_count,
                failure_threshold=self._failure_threshold,
            )
