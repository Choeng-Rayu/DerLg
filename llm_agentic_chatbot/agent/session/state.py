"""Conversation state model and agent stage enum for the 7-stage booking flow."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


SUPPORTED_LANGUAGES = {"EN", "KH", "ZH"}


class AgentState(str, Enum):
    """Seven stages of the DerLg booking conversation."""

    DISCOVERY = "DISCOVERY"
    SUGGESTION = "SUGGESTION"
    EXPLORATION = "EXPLORATION"
    CUSTOMIZATION = "CUSTOMIZATION"
    BOOKING = "BOOKING"
    PAYMENT = "PAYMENT"
    POST_BOOKING = "POST_BOOKING"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ConversationState(BaseModel):
    """Full state for a single AI agent conversation session.

    Stored in Redis with a 7-day TTL. Every field is JSON-serializable
    so the model can round-trip through ``model_dump_json`` / ``model_validate_json``.
    """

    model_config = ConfigDict(use_enum_values=True)

    # Identity
    session_id: str
    user_id: str

    # Current stage
    state: AgentState = AgentState.DISCOVERY

    # Language preference (EN, KH, ZH)
    preferred_language: str = "EN"

    # Conversation history (Anthropic message format)
    messages: list[dict[str, Any]] = Field(default_factory=list)

    # Suggestion stage
    suggested_trip_ids: list[str] = Field(default_factory=list)

    # Exploration / Customization stage
    selected_trip_id: Optional[str] = None
    selected_trip_name: Optional[str] = None

    # Booking stage
    booking_id: Optional[str] = None
    booking_ref: Optional[str] = None
    reserved_until: Optional[datetime] = None

    # Payment stage
    payment_intent_id: Optional[str] = None
    payment_status: Optional[str] = None

    # Metadata
    created_at: datetime = Field(default_factory=_utc_now)
    last_active: datetime = Field(default_factory=_utc_now)

    @field_validator("preferred_language")
    @classmethod
    def validate_preferred_language(cls, value: str) -> str:
        """Ensure preferred_language is one of the supported locales."""
        upper = value.upper()
        if upper not in SUPPORTED_LANGUAGES:
            raise ValueError(
                f"preferred_language must be one of {sorted(SUPPORTED_LANGUAGES)}, "
                f"got '{value}'"
            )
        return upper
