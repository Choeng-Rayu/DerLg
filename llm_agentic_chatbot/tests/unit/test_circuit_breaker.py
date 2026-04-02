"""Unit tests for the CircuitBreaker utility.

Tests cover the full state machine: CLOSED -> OPEN -> HALF_OPEN -> CLOSED,
including failure counting, threshold tripping, recovery timeout transitions,
and success/failure handling in each state.
"""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import time
from unittest.mock import patch

import pytest

from utils.circuit_breaker import CircuitBreaker, CircuitState


class TestCircuitBreakerInit:
    """Tests for initial construction and default values."""

    def test_initial_state_is_closed(self):
        cb = CircuitBreaker()
        assert cb.state is CircuitState.CLOSED

    def test_default_failure_threshold(self):
        cb = CircuitBreaker()
        assert cb._failure_threshold == 5

    def test_default_recovery_timeout(self):
        cb = CircuitBreaker()
        assert cb._recovery_timeout == 30

    def test_custom_parameters(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=10)
        assert cb._failure_threshold == 3
        assert cb._recovery_timeout == 10

    def test_initial_failure_count_is_zero(self):
        cb = CircuitBreaker()
        assert cb._failure_count == 0


class TestCircuitBreakerClosed:
    """Tests for behaviour in the CLOSED state."""

    def test_can_execute_returns_true_when_closed(self):
        cb = CircuitBreaker()
        assert cb.can_execute() is True

    def test_single_failure_stays_closed(self):
        cb = CircuitBreaker(failure_threshold=5)
        cb.record_failure()
        assert cb.state is CircuitState.CLOSED
        assert cb._failure_count == 1

    def test_failures_below_threshold_stay_closed(self):
        cb = CircuitBreaker(failure_threshold=5)
        for _ in range(4):
            cb.record_failure()
        assert cb.state is CircuitState.CLOSED
        assert cb._failure_count == 4
        assert cb.can_execute() is True

    def test_record_success_resets_failure_count(self):
        cb = CircuitBreaker(failure_threshold=5)
        cb.record_failure()
        cb.record_failure()
        assert cb._failure_count == 2
        cb.record_success()
        assert cb._failure_count == 0
        assert cb.state is CircuitState.CLOSED

    def test_record_success_resets_count_even_at_threshold_minus_one(self):
        cb = CircuitBreaker(failure_threshold=5)
        for _ in range(4):
            cb.record_failure()
        cb.record_success()
        assert cb._failure_count == 0
        assert cb.state is CircuitState.CLOSED


class TestCircuitBreakerOpening:
    """Tests for the CLOSED -> OPEN transition."""

    def test_opens_at_exact_threshold(self):
        cb = CircuitBreaker(failure_threshold=5)
        for _ in range(5):
            cb.record_failure()
        assert cb.state is CircuitState.OPEN
        assert cb._failure_count == 5

    def test_opens_with_custom_threshold(self):
        cb = CircuitBreaker(failure_threshold=2)
        cb.record_failure()
        assert cb.state is CircuitState.CLOSED
        cb.record_failure()
        assert cb.state is CircuitState.OPEN

    def test_can_execute_returns_false_when_open(self):
        cb = CircuitBreaker(failure_threshold=2)
        cb.record_failure()
        cb.record_failure()
        assert cb.can_execute() is False

    def test_additional_failures_keep_circuit_open(self):
        cb = CircuitBreaker(failure_threshold=2)
        for _ in range(5):
            cb.record_failure()
        assert cb.state is CircuitState.OPEN
        assert cb._failure_count == 5


class TestCircuitBreakerHalfOpen:
    """Tests for the OPEN -> HALF_OPEN timeout-based transition."""

    def test_transitions_to_half_open_after_recovery_timeout(self):
        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=1.0)
        cb.record_failure()
        cb.record_failure()
        assert cb.state is CircuitState.OPEN

        # Simulate time passing beyond the recovery timeout
        cb._last_failure_time = time.monotonic() - 2.0
        assert cb.state is CircuitState.HALF_OPEN

    def test_can_execute_returns_true_when_half_open(self):
        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=1.0)
        cb.record_failure()
        cb.record_failure()
        cb._last_failure_time = time.monotonic() - 2.0
        assert cb.can_execute() is True

    def test_stays_open_before_recovery_timeout(self):
        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=60)
        cb.record_failure()
        cb.record_failure()
        assert cb.state is CircuitState.OPEN
        assert cb.can_execute() is False

    def test_record_success_closes_circuit_from_half_open(self):
        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=1.0)
        cb.record_failure()
        cb.record_failure()
        assert cb.state is CircuitState.OPEN

        # Move to HALF_OPEN
        cb._last_failure_time = time.monotonic() - 2.0
        assert cb.state is CircuitState.HALF_OPEN

        # Successful probe closes the circuit
        cb.record_success()
        assert cb.state is CircuitState.CLOSED
        assert cb._failure_count == 0

    def test_single_failure_in_half_open_reopens_circuit(self):
        cb = CircuitBreaker(failure_threshold=5, recovery_timeout=1.0)
        # Open the circuit
        for _ in range(5):
            cb.record_failure()
        assert cb.state is CircuitState.OPEN

        # Transition to HALF_OPEN
        cb._last_failure_time = time.monotonic() - 2.0
        assert cb.state is CircuitState.HALF_OPEN

        # A single failure should re-open the breaker immediately
        cb.record_failure()
        assert cb.state is CircuitState.OPEN


class TestCircuitBreakerFullCycle:
    """Integration-style tests covering full state transitions."""

    def test_full_lifecycle_closed_open_halfopen_closed(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=1.0)

        # Start CLOSED
        assert cb.state is CircuitState.CLOSED
        assert cb.can_execute() is True

        # Accumulate failures to trip the circuit
        cb.record_failure()
        cb.record_failure()
        cb.record_failure()
        assert cb.state is CircuitState.OPEN
        assert cb.can_execute() is False

        # Wait for recovery
        cb._last_failure_time = time.monotonic() - 2.0
        assert cb.state is CircuitState.HALF_OPEN
        assert cb.can_execute() is True

        # Successful probe closes the circuit
        cb.record_success()
        assert cb.state is CircuitState.CLOSED
        assert cb._failure_count == 0
        assert cb.can_execute() is True

    def test_full_lifecycle_with_failed_probe(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=1.0)

        # Trip the circuit
        for _ in range(3):
            cb.record_failure()
        assert cb.state is CircuitState.OPEN

        # Wait for recovery
        cb._last_failure_time = time.monotonic() - 2.0
        assert cb.state is CircuitState.HALF_OPEN

        # Probe fails: re-opens
        cb.record_failure()
        assert cb.state is CircuitState.OPEN
        assert cb.can_execute() is False

        # Wait again for recovery
        cb._last_failure_time = time.monotonic() - 2.0
        assert cb.state is CircuitState.HALF_OPEN

        # This time the probe succeeds
        cb.record_success()
        assert cb.state is CircuitState.CLOSED

    def test_intermittent_successes_prevent_opening(self):
        cb = CircuitBreaker(failure_threshold=3)
        cb.record_failure()
        cb.record_failure()
        cb.record_success()  # resets
        cb.record_failure()
        cb.record_failure()
        # Only 2 consecutive failures, should still be CLOSED
        assert cb.state is CircuitState.CLOSED
        assert cb._failure_count == 2
