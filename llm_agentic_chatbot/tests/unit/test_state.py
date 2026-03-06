"""Unit tests for ConversationState model and AgentState enum."""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import pytest
from datetime import datetime, timezone
from pydantic import ValidationError

from agent.session.state import AgentState, ConversationState, SUPPORTED_LANGUAGES


class TestAgentState:
    """Tests for the AgentState enum."""

    def test_all_seven_stages_exist(self):
        stages = [s.value for s in AgentState]
        assert stages == [
            "DISCOVERY", "SUGGESTION", "EXPLORATION",
            "CUSTOMIZATION", "BOOKING", "PAYMENT", "POST_BOOKING",
        ]

    def test_string_value(self):
        assert AgentState.DISCOVERY.value == "DISCOVERY"
        assert AgentState.POST_BOOKING.value == "POST_BOOKING"

    def test_is_string_enum(self):
        assert isinstance(AgentState.DISCOVERY, str)


class TestConversationState:
    """Tests for the ConversationState Pydantic model."""

    def test_create_minimal_session(self):
        session = ConversationState(session_id="s1", user_id="u1")
        assert session.session_id == "s1"
        assert session.user_id == "u1"
        assert session.state == "DISCOVERY"
        assert session.preferred_language == "EN"
        assert session.messages == []
        assert session.suggested_trip_ids == []
        assert session.selected_trip_id is None
        assert session.booking_id is None
        assert session.payment_intent_id is None

    def test_create_full_session(self):
        now = datetime.now(timezone.utc)
        session = ConversationState(
            session_id="s2",
            user_id="u2",
            state=AgentState.PAYMENT,
            preferred_language="KH",
            messages=[{"role": "user", "content": [{"type": "text", "text": "Hi"}]}],
            suggested_trip_ids=["t1", "t2"],
            selected_trip_id="t1",
            selected_trip_name="Temple Tour",
            booking_id="b1",
            booking_ref="DLG-REF",
            reserved_until=now,
            payment_intent_id="pi_abc",
            payment_status="PENDING",
            created_at=now,
            last_active=now,
        )
        assert session.state == "PAYMENT"
        assert session.preferred_language == "KH"
        assert session.booking_id == "b1"
        assert session.payment_intent_id == "pi_abc"
        assert len(session.suggested_trip_ids) == 2

    def test_language_validation_valid(self):
        for lang in SUPPORTED_LANGUAGES:
            session = ConversationState(session_id="s", user_id="u", preferred_language=lang)
            assert session.preferred_language == lang

    def test_language_validation_lowercase(self):
        session = ConversationState(session_id="s", user_id="u", preferred_language="en")
        assert session.preferred_language == "EN"

    def test_language_validation_invalid(self):
        with pytest.raises(ValidationError) as exc_info:
            ConversationState(session_id="s", user_id="u", preferred_language="FR")
        assert "preferred_language" in str(exc_info.value)

    def test_json_round_trip(self):
        now = datetime.now(timezone.utc)
        original = ConversationState(
            session_id="s3",
            user_id="u3",
            state=AgentState.SUGGESTION,
            preferred_language="ZH",
            messages=[{"role": "user", "content": [{"type": "text", "text": "Hello"}]}],
            suggested_trip_ids=["t1"],
            selected_trip_id="t1",
            booking_id="b1",
            booking_ref="REF",
            reserved_until=now,
            payment_intent_id="pi_1",
            payment_status="PENDING",
            created_at=now,
            last_active=now,
        )
        json_str = original.model_dump_json()
        restored = ConversationState.model_validate_json(json_str)

        assert restored.session_id == original.session_id
        assert restored.user_id == original.user_id
        assert restored.state == original.state
        assert restored.preferred_language == original.preferred_language
        assert restored.messages == original.messages
        assert restored.suggested_trip_ids == original.suggested_trip_ids
        assert restored.selected_trip_id == original.selected_trip_id
        assert restored.booking_id == original.booking_id
        assert restored.booking_ref == original.booking_ref
        assert restored.payment_intent_id == original.payment_intent_id
        assert restored.payment_status == original.payment_status

    def test_default_timestamps_are_utc(self):
        session = ConversationState(session_id="s", user_id="u")
        assert session.created_at.tzinfo is not None
        assert session.last_active.tzinfo is not None

    def test_messages_default_to_empty_list(self):
        session = ConversationState(session_id="s", user_id="u")
        assert session.messages == []
        # Ensure the default is a unique list (not shared)
        session2 = ConversationState(session_id="s2", user_id="u2")
        session.messages.append({"role": "user", "content": "hi"})
        assert len(session2.messages) == 0

    def test_use_enum_values_config(self):
        """AgentState values should be plain strings after model creation."""
        session = ConversationState(
            session_id="s", user_id="u", state=AgentState.EXPLORATION
        )
        assert session.state == "EXPLORATION"
        assert isinstance(session.state, str)
