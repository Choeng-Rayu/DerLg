"""Assembles the full system prompt from session state and stage-specific templates."""

from __future__ import annotations

from agent.prompts.templates import (
    BASE_PROMPT,
    BOOKING_PROMPT,
    CUSTOMIZATION_PROMPT,
    DISCOVERY_PROMPT,
    EXPLORATION_PROMPT,
    LANGUAGE_INSTRUCTIONS,
    PAYMENT_PROMPT,
    POST_BOOKING_PROMPT,
    SUGGESTION_PROMPT,
)
from agent.session.state import AgentState, ConversationState

_STAGE_PROMPTS: dict[str, str] = {
    AgentState.DISCOVERY: DISCOVERY_PROMPT,
    AgentState.SUGGESTION: SUGGESTION_PROMPT,
    AgentState.EXPLORATION: EXPLORATION_PROMPT,
    AgentState.CUSTOMIZATION: CUSTOMIZATION_PROMPT,
    AgentState.BOOKING: BOOKING_PROMPT,
    AgentState.PAYMENT: PAYMENT_PROMPT,
    AgentState.POST_BOOKING: POST_BOOKING_PROMPT,
}


def build_system_prompt(session: ConversationState) -> str:
    """Build a complete system prompt tailored to the current conversation stage.

    Parameters
    ----------
    session:
        The active conversation state containing stage, language, and booking context.

    Returns
    -------
    str
        A fully assembled system prompt string ready to send to the LLM.
    """
    parts: list[str] = [BASE_PROMPT]

    # Context section
    context = f"""## Session Context
- Session ID: {session.session_id}
- User ID: {session.user_id}
- Current Stage: {session.state}
- Language: {session.preferred_language}"""

    if session.suggested_trip_ids:
        context += f"\n- Suggested Trip IDs: {', '.join(session.suggested_trip_ids)}"
    if session.selected_trip_id:
        context += f"\n- Selected Trip: {session.selected_trip_name} (ID: {session.selected_trip_id})"
    if session.booking_id:
        context += f"\n- Booking ID: {session.booking_id}"
        context += f"\n- Booking Ref: {session.booking_ref}"
    if session.payment_status:
        context += f"\n- Payment Status: {session.payment_status}"

    parts.append(context)

    # Stage-specific instructions
    stage_prompt = _STAGE_PROMPTS.get(AgentState(session.state), DISCOVERY_PROMPT)
    parts.append(stage_prompt)

    # Language instructions
    lang_instruction = LANGUAGE_INSTRUCTIONS.get(
        session.preferred_language,
        LANGUAGE_INSTRUCTIONS["EN"],
    )
    parts.append(f"## Language\n{lang_instruction}")

    return "\n\n".join(parts)
