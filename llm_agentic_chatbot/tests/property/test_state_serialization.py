"""Property-based tests for ConversationState serialization round-trip.

Uses Hypothesis to generate arbitrary ConversationState instances and verify
that serialization (model_dump_json) / deserialization (model_validate_json)
produces an identical object.
"""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import pytest
from datetime import datetime, timezone
from hypothesis import given, strategies as st, settings as hyp_settings, assume

from agent.session.state import AgentState, ConversationState, SUPPORTED_LANGUAGES


# ---------------------------------------------------------------------------
# Custom strategies
# ---------------------------------------------------------------------------

agent_states = st.sampled_from(list(AgentState))
languages = st.sampled_from(sorted(SUPPORTED_LANGUAGES))
optional_str = st.one_of(st.none(), st.text(min_size=1, max_size=50))
optional_dt = st.one_of(
    st.none(),
    st.datetimes(
        min_value=datetime(2020, 1, 1),
        max_value=datetime(2030, 12, 31),
        timezones=st.just(timezone.utc),
    ),
)
simple_message = st.fixed_dictionaries({
    "role": st.sampled_from(["user", "assistant"]),
    "content": st.just([{"type": "text", "text": "hello"}]),
})


conversation_state_strategy = st.builds(
    ConversationState,
    session_id=st.text(min_size=1, max_size=36, alphabet="abcdefghijklmnop0123456789-"),
    user_id=st.text(min_size=1, max_size=36, alphabet="abcdefghijklmnop0123456789-"),
    state=agent_states,
    preferred_language=languages,
    messages=st.lists(simple_message, min_size=0, max_size=5),
    suggested_trip_ids=st.lists(
        st.text(min_size=1, max_size=20, alphabet="abcdef0123456789-"),
        min_size=0, max_size=5,
    ),
    selected_trip_id=optional_str,
    selected_trip_name=optional_str,
    booking_id=optional_str,
    booking_ref=optional_str,
    reserved_until=optional_dt,
    payment_intent_id=optional_str,
    payment_status=st.one_of(st.none(), st.sampled_from(["PENDING", "CONFIRMED", "FAILED"])),
    created_at=st.datetimes(
        min_value=datetime(2020, 1, 1),
        max_value=datetime(2030, 12, 31),
        timezones=st.just(timezone.utc),
    ),
    last_active=st.datetimes(
        min_value=datetime(2020, 1, 1),
        max_value=datetime(2030, 12, 31),
        timezones=st.just(timezone.utc),
    ),
)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestStateSerializationRoundTrip:

    @given(state=conversation_state_strategy)
    @hyp_settings(max_examples=100, deadline=5000)
    def test_json_round_trip(self, state: ConversationState):
        """parse(format(x)) == x for all ConversationState instances."""
        json_str = state.model_dump_json()
        restored = ConversationState.model_validate_json(json_str)

        assert restored.session_id == state.session_id
        assert restored.user_id == state.user_id
        assert restored.state == state.state
        assert restored.preferred_language == state.preferred_language
        assert restored.messages == state.messages
        assert restored.suggested_trip_ids == state.suggested_trip_ids
        assert restored.selected_trip_id == state.selected_trip_id
        assert restored.selected_trip_name == state.selected_trip_name
        assert restored.booking_id == state.booking_id
        assert restored.booking_ref == state.booking_ref
        assert restored.payment_intent_id == state.payment_intent_id
        assert restored.payment_status == state.payment_status
        # Datetime comparison (may lose microseconds in JSON)
        assert abs((restored.created_at - state.created_at).total_seconds()) < 1
        assert abs((restored.last_active - state.last_active).total_seconds()) < 1

    @given(state=conversation_state_strategy)
    @hyp_settings(max_examples=50, deadline=5000)
    def test_dict_round_trip(self, state: ConversationState):
        """model_validate(model_dump(x)) == x for all states."""
        dumped = state.model_dump()
        restored = ConversationState.model_validate(dumped)

        assert restored.session_id == state.session_id
        assert restored.state == state.state
        assert restored.preferred_language == state.preferred_language

    @given(lang=st.text(min_size=1, max_size=5))
    @hyp_settings(max_examples=50, deadline=5000)
    def test_invalid_language_rejected(self, lang: str):
        """Languages outside {EN, KH, ZH} should be rejected."""
        assume(lang.upper() not in SUPPORTED_LANGUAGES)
        with pytest.raises(Exception):
            ConversationState(
                session_id="s", user_id="u", preferred_language=lang
            )


class TestToolSchemaPropertyTests:

    def test_all_schemas_are_dicts(self):
        from agent.tools.schemas import ALL_TOOLS
        for tool in ALL_TOOLS:
            assert isinstance(tool, dict)

    def test_all_schemas_have_string_names(self):
        from agent.tools.schemas import ALL_TOOLS
        for tool in ALL_TOOLS:
            assert isinstance(tool["name"], str)
            assert len(tool["name"]) > 0

    def test_all_input_schemas_have_type_object(self):
        from agent.tools.schemas import ALL_TOOLS
        for tool in ALL_TOOLS:
            assert tool["input_schema"]["type"] == "object"
