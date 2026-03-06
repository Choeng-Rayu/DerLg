"""Tool handler registry mapping Anthropic tool names to handler functions.

The TOOL_DISPATCH dictionary is the single source of truth for resolving
a tool name (as returned by the Claude model in a tool_use block) to the
async handler function that calls the corresponding NestJS backend endpoint.

Every handler has the unified signature::

    async def handle_*(
        client: httpx.AsyncClient,
        backend_url: str,
        service_key: str,
        language: str,
        **kwargs,
    ) -> dict[str, Any]
"""

from typing import Any, Callable, Coroutine

import httpx

from agent.tools.handlers.booking import (
    handle_apply_discount_code,
    handle_cancel_booking,
    handle_create_booking,
    handle_modify_booking,
    handle_validate_user_details,
)
from agent.tools.handlers.info import (
    handle_estimate_budget,
    handle_get_currency_rates,
    handle_get_hotel_details,
    handle_get_places,
    handle_get_upcoming_festivals,
    handle_get_weather_forecast,
)
from agent.tools.handlers.payment import (
    handle_check_payment_status,
    handle_generate_payment_qr,
)
from agent.tools.handlers.trips import (
    handle_calculate_custom_trip,
    handle_compare_trips,
    handle_customize_trip,
    handle_get_trip_images,
    handle_get_trip_itinerary,
    handle_get_trip_suggestions,
)

# Type alias for any tool handler function
ToolHandler = Callable[..., Coroutine[Any, Any, dict[str, Any]]]

# ---------------------------------------------------------------------------
# TOOL_DISPATCH: maps every Anthropic tool name to its handler function.
# Keys must match the "name" field in the tool definitions sent to Claude.
# ---------------------------------------------------------------------------
TOOL_DISPATCH: dict[str, ToolHandler] = {
    # Trip tools (6) — keys MUST match the "name" in agent/tools/schemas.py
    "getTripSuggestions": handle_get_trip_suggestions,
    "getTripItinerary": handle_get_trip_itinerary,
    "getTripImages": handle_get_trip_images,
    "compareTrips": handle_compare_trips,
    "calculateCustomTrip": handle_calculate_custom_trip,
    "customizeTrip": handle_customize_trip,
    # Booking tools (5)
    "validateUserDetails": handle_validate_user_details,
    "createBooking": handle_create_booking,
    "cancelBooking": handle_cancel_booking,
    "modifyBooking": handle_modify_booking,
    "applyDiscountCode": handle_apply_discount_code,
    # Payment tools (2)
    "generatePaymentQR": handle_generate_payment_qr,
    "checkPaymentStatus": handle_check_payment_status,
    # Info tools (6)
    "getHotelDetails": handle_get_hotel_details,
    "getWeatherForecast": handle_get_weather_forecast,
    "getPlaces": handle_get_places,
    "getUpcomingFestivals": handle_get_upcoming_festivals,
    "estimateBudget": handle_estimate_budget,
    "getCurrencyRates": handle_get_currency_rates,
    # Post-booking
    "getBookingDetails": handle_get_trip_itinerary,
}

__all__ = [
    "TOOL_DISPATCH",
    "ToolHandler",
    # Trip handlers
    "handle_get_trip_suggestions",
    "handle_get_trip_itinerary",
    "handle_get_trip_images",
    "handle_compare_trips",
    "handle_calculate_custom_trip",
    "handle_customize_trip",
    # Booking handlers
    "handle_validate_user_details",
    "handle_create_booking",
    "handle_cancel_booking",
    "handle_modify_booking",
    "handle_apply_discount_code",
    # Payment handlers
    "handle_generate_payment_qr",
    "handle_check_payment_status",
    # Info handlers
    "handle_get_hotel_details",
    "handle_get_weather_forecast",
    "handle_get_places",
    "handle_get_upcoming_festivals",
    "handle_estimate_budget",
    "handle_get_currency_rates",
]
