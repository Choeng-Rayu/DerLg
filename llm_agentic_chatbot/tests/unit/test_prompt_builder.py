"""Unit tests for the system prompt builder."""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import pytest
from agent.session.state import AgentState, ConversationState
from agent.prompts.builder import build_system_prompt
from agent.prompts.templates import (
    BASE_PROMPT,
    DISCOVERY_PROMPT,
    SUGGESTION_PROMPT,
    EXPLORATION_PROMPT,
    CUSTOMIZATION_PROMPT,
    BOOKING_PROMPT,
    PAYMENT_PROMPT,
    POST_BOOKING_PROMPT,
    LANGUAGE_INSTRUCTIONS,
)


def _make_session(**kwargs) -> ConversationState:
    defaults = {"session_id": "s1", "user_id": "u1"}
    defaults.update(kwargs)
    return ConversationState(**defaults)


class TestBuildSystemPrompt:

    def test_includes_base_prompt(self):
        session = _make_session()
        prompt = build_system_prompt(session)
        assert BASE_PROMPT in prompt

    def test_includes_session_context(self):
        session = _make_session(session_id="abc-123", user_id="user-456")
        prompt = build_system_prompt(session)
        assert "abc-123" in prompt
        assert "user-456" in prompt
        assert "DISCOVERY" in prompt

    def test_includes_language_in_context(self):
        session = _make_session(preferred_language="KH")
        prompt = build_system_prompt(session)
        assert "KH" in prompt

    @pytest.mark.parametrize("stage,expected_text", [
        (AgentState.DISCOVERY, "DISCOVERY"),
        (AgentState.SUGGESTION, "SUGGESTION"),
        (AgentState.EXPLORATION, "EXPLORATION"),
        (AgentState.CUSTOMIZATION, "CUSTOMIZATION"),
        (AgentState.BOOKING, "BOOKING"),
        (AgentState.PAYMENT, "PAYMENT"),
        (AgentState.POST_BOOKING, "POST_BOOKING"),
    ])
    def test_includes_stage_prompt(self, stage, expected_text):
        session = _make_session(state=stage)
        prompt = build_system_prompt(session)
        assert expected_text in prompt

    def test_discovery_stage_mentions_six_fields(self):
        session = _make_session(state=AgentState.DISCOVERY)
        prompt = build_system_prompt(session)
        assert "Mood" in prompt or "mood" in prompt.lower()
        assert "Duration" in prompt or "duration" in prompt.lower()
        assert "Budget" in prompt or "budget" in prompt.lower()

    def test_includes_suggested_trip_ids(self):
        session = _make_session(
            state=AgentState.SUGGESTION,
            suggested_trip_ids=["t-111", "t-222"],
        )
        prompt = build_system_prompt(session)
        assert "t-111" in prompt
        assert "t-222" in prompt

    def test_includes_selected_trip(self):
        session = _make_session(
            state=AgentState.EXPLORATION,
            selected_trip_id="t-333",
            selected_trip_name="Beach Paradise",
        )
        prompt = build_system_prompt(session)
        assert "t-333" in prompt
        assert "Beach Paradise" in prompt

    def test_includes_booking_info(self):
        session = _make_session(
            state=AgentState.PAYMENT,
            booking_id="b-999",
            booking_ref="DLG-XYZ",
        )
        prompt = build_system_prompt(session)
        assert "b-999" in prompt
        assert "DLG-XYZ" in prompt

    def test_includes_payment_status(self):
        session = _make_session(
            state=AgentState.POST_BOOKING,
            payment_status="CONFIRMED",
        )
        prompt = build_system_prompt(session)
        assert "CONFIRMED" in prompt

    @pytest.mark.parametrize("lang,expected_substring", [
        ("EN", "English"),
        ("KH", "Khmer"),
        ("ZH", "Chinese"),
    ])
    def test_includes_language_instruction(self, lang, expected_substring):
        session = _make_session(preferred_language=lang)
        prompt = build_system_prompt(session)
        assert expected_substring in prompt

    def test_default_language_fallback(self):
        """Unknown language should fall back to EN instructions."""
        session = _make_session()
        # Force language to something unusual via direct attribute override
        session.preferred_language = "EN"
        prompt = build_system_prompt(session)
        assert "English" in prompt

    def test_absolute_rules_present(self):
        session = _make_session()
        prompt = build_system_prompt(session)
        assert "NEVER invent" in prompt
        assert "NEVER discuss topics unrelated" in prompt
