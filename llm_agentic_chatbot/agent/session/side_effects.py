from __future__ import annotations

from datetime import datetime, timezone

from agent.session.state import AgentState, ConversationState

import structlog

logger = structlog.get_logger(__name__)


def apply_session_side_effects(
    session: ConversationState, tool_name: str, result: dict
) -> None:
    """Mutate session state based on tool execution results."""
    if not isinstance(result, dict) or not result.get("success", True):
        return

    data = result.get("data", result)

    if tool_name == "getTripSuggestions":
        trips = data.get("trips", [])
        session.suggested_trip_ids = [t["id"] for t in trips if "id" in t]
        if session.state == AgentState.DISCOVERY:
            session.state = AgentState.SUGGESTION
        logger.info(
            "side_effect_applied",
            tool=tool_name,
            trip_count=len(session.suggested_trip_ids),
        )

    elif tool_name == "createBooking":
        session.booking_id = data.get("booking_id") or data.get("id")
        session.booking_ref = data.get("booking_ref") or data.get("reference")
        reserved = data.get("reserved_until")
        if reserved:
            if isinstance(reserved, str):
                session.reserved_until = datetime.fromisoformat(
                    reserved.replace("Z", "+00:00")
                )
            else:
                session.reserved_until = reserved
        session.state = AgentState.PAYMENT
        logger.info(
            "side_effect_applied", tool=tool_name, booking_id=session.booking_id
        )

    elif tool_name == "generatePaymentQR":
        session.payment_intent_id = data.get("payment_intent_id")
        logger.info("side_effect_applied", tool=tool_name)

    elif tool_name == "checkPaymentStatus":
        status = data.get("status")
        if status == "SUCCEEDED":
            session.payment_status = "CONFIRMED"
            session.state = AgentState.POST_BOOKING
            logger.info(
                "side_effect_applied", tool=tool_name, new_state="POST_BOOKING"
            )

    elif tool_name == "cancelBooking":
        session.booking_id = None
        session.booking_ref = None
        session.payment_intent_id = None
        session.reserved_until = None
        session.payment_status = None
        session.state = AgentState.DISCOVERY
        logger.info("side_effect_applied", tool=tool_name, new_state="DISCOVERY")
