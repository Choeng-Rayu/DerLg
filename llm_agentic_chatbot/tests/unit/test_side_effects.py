"""Unit tests for session side effects logic."""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import pytest
from datetime import datetime, timezone

from agent.session.state import AgentState, ConversationState
from agent.session.side_effects import apply_session_side_effects


def _make_session(**kwargs) -> ConversationState:
    defaults = {"session_id": "s1", "user_id": "u1"}
    defaults.update(kwargs)
    return ConversationState(**defaults)


class TestGetTripSuggestionsSideEffects:

    def test_updates_suggested_trip_ids(self):
        session = _make_session(state=AgentState.DISCOVERY)
        result = {
            "data": {
                "trips": [
                    {"id": "trip-1", "name": "Beach"},
                    {"id": "trip-2", "name": "Temple"},
                    {"id": "trip-3", "name": "Mountain"},
                ]
            }
        }
        apply_session_side_effects(session, "getTripSuggestions", result)
        assert session.suggested_trip_ids == ["trip-1", "trip-2", "trip-3"]

    def test_transitions_discovery_to_suggestion(self):
        session = _make_session(state=AgentState.DISCOVERY)
        result = {"data": {"trips": [{"id": "t1"}]}}
        apply_session_side_effects(session, "getTripSuggestions", result)
        assert session.state == "SUGGESTION"

    def test_does_not_transition_from_non_discovery(self):
        session = _make_session(state=AgentState.EXPLORATION)
        result = {"data": {"trips": [{"id": "t1"}]}}
        apply_session_side_effects(session, "getTripSuggestions", result)
        assert session.state == "EXPLORATION"
        assert session.suggested_trip_ids == ["t1"]

    def test_handles_trips_without_id(self):
        session = _make_session()
        result = {"data": {"trips": [{"name": "No ID"}, {"id": "t1"}]}}
        apply_session_side_effects(session, "getTripSuggestions", result)
        assert session.suggested_trip_ids == ["t1"]

    def test_handles_empty_trips(self):
        session = _make_session()
        result = {"data": {"trips": []}}
        apply_session_side_effects(session, "getTripSuggestions", result)
        assert session.suggested_trip_ids == []


class TestCreateBookingSideEffects:

    def test_sets_booking_fields(self):
        session = _make_session(state=AgentState.BOOKING)
        result = {
            "data": {
                "booking_id": "b-123",
                "booking_ref": "DLG-XYZ",
                "reserved_until": "2025-06-15T12:00:00Z",
            }
        }
        apply_session_side_effects(session, "createBooking", result)
        assert session.booking_id == "b-123"
        assert session.booking_ref == "DLG-XYZ"
        assert session.reserved_until is not None
        assert session.state == "PAYMENT"

    def test_accepts_alternative_field_names(self):
        session = _make_session(state=AgentState.BOOKING)
        result = {"data": {"id": "b-456", "reference": "REF-000"}}
        apply_session_side_effects(session, "createBooking", result)
        assert session.booking_id == "b-456"
        assert session.booking_ref == "REF-000"

    def test_handles_reserved_until_as_datetime(self):
        session = _make_session(state=AgentState.BOOKING)
        dt = datetime(2025, 6, 15, 12, 0, 0, tzinfo=timezone.utc)
        result = {"data": {"booking_id": "b1", "reserved_until": dt}}
        apply_session_side_effects(session, "createBooking", result)
        assert session.reserved_until == dt


class TestGeneratePaymentQRSideEffects:

    def test_sets_payment_intent_id(self):
        session = _make_session(state=AgentState.PAYMENT)
        result = {"data": {"payment_intent_id": "pi_test_789"}}
        apply_session_side_effects(session, "generatePaymentQR", result)
        assert session.payment_intent_id == "pi_test_789"


class TestCheckPaymentStatusSideEffects:

    def test_succeeded_transitions_to_post_booking(self):
        session = _make_session(state=AgentState.PAYMENT)
        result = {"data": {"status": "SUCCEEDED"}}
        apply_session_side_effects(session, "checkPaymentStatus", result)
        assert session.payment_status == "CONFIRMED"
        assert session.state == "POST_BOOKING"

    def test_pending_does_not_transition(self):
        session = _make_session(state=AgentState.PAYMENT)
        result = {"data": {"status": "PENDING"}}
        apply_session_side_effects(session, "checkPaymentStatus", result)
        assert session.state == "PAYMENT"
        assert session.payment_status is None

    def test_failed_does_not_transition(self):
        session = _make_session(state=AgentState.PAYMENT)
        result = {"data": {"status": "FAILED"}}
        apply_session_side_effects(session, "checkPaymentStatus", result)
        assert session.state == "PAYMENT"


class TestCancelBookingSideEffects:

    def test_clears_all_booking_fields(self):
        session = _make_session(
            state=AgentState.POST_BOOKING,
            booking_id="b1",
            booking_ref="REF",
            payment_intent_id="pi_1",
            reserved_until=datetime.now(timezone.utc),
            payment_status="CONFIRMED",
        )
        result = {"data": {"cancelled": True}}
        apply_session_side_effects(session, "cancelBooking", result)

        assert session.booking_id is None
        assert session.booking_ref is None
        assert session.payment_intent_id is None
        assert session.reserved_until is None
        assert session.payment_status is None
        assert session.state == "DISCOVERY"


class TestNoSideEffectsOnFailure:

    def test_failed_result_no_side_effects(self):
        session = _make_session()
        result = {"success": False, "error": "Something failed"}
        apply_session_side_effects(session, "getTripSuggestions", result)
        assert session.suggested_trip_ids == []
        assert session.state == "DISCOVERY"

    def test_non_dict_result_no_side_effects(self):
        session = _make_session()
        apply_session_side_effects(session, "getTripSuggestions", "not a dict")
        assert session.state == "DISCOVERY"

    def test_unknown_tool_no_side_effects(self):
        session = _make_session()
        result = {"data": {"something": True}}
        apply_session_side_effects(session, "unknownTool", result)
        assert session.state == "DISCOVERY"
