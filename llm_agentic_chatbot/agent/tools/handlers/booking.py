"""Booking-related tool handlers for the DerLg AI agent.

Each handler function calls the NestJS backend booking endpoints
and returns the parsed JSON response. All handlers use the same
signature: (client, backend_url, service_key, language, **kwargs).
"""

from typing import Any

import httpx


def _headers(service_key: str, language: str) -> dict[str, str]:
    """Build standard request headers for backend calls."""
    return {
        "X-Service-Key": service_key,
        "Accept-Language": language,
        "Content-Type": "application/json",
    }


async def handle_validate_user_details(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    name: str,
    phone: str,
    email: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Validate user contact details before creating a booking.

    POST /v1/ai-tools/bookings/validate

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        name: User full name.
        phone: User phone number.
        email: User email address.

    Returns:
        Parsed JSON response containing validation result.
    """
    url = f"{backend_url}/v1/ai-tools/bookings/validate"
    response = await client.post(
        url,
        json={"name": name, "phone": phone, "email": email},
        headers=_headers(service_key, language),
    )
    response.raise_for_status()
    return response.json()


async def handle_create_booking(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Create a new booking with a 15-minute hold.

    POST /v1/ai-tools/bookings

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        **kwargs: Booking details forwarded as the JSON body
                  (trip_id, user_id, people_count, start_date, etc.).

    Returns:
        Parsed JSON response containing created booking details.
    """
    url = f"{backend_url}/v1/ai-tools/bookings"
    response = await client.post(url, json=kwargs, headers=_headers(service_key, language))
    response.raise_for_status()
    return response.json()


async def handle_cancel_booking(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    booking_id: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Cancel an existing booking.

    POST /v1/ai-tools/bookings/{booking_id}/cancel

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        booking_id: Booking identifier to cancel.

    Returns:
        Parsed JSON response confirming cancellation.
    """
    url = f"{backend_url}/v1/ai-tools/bookings/{booking_id}/cancel"
    response = await client.post(url, headers=_headers(service_key, language))
    response.raise_for_status()
    return response.json()


async def handle_modify_booking(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    booking_id: str,
    modifications: dict[str, Any],
    **kwargs: Any,
) -> dict[str, Any]:
    """Modify an existing booking with partial updates.

    PATCH /v1/ai-tools/bookings/{booking_id}

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        booking_id: Booking identifier to modify.
        modifications: Dict of fields to update (dates, people_count, etc.).

    Returns:
        Parsed JSON response containing updated booking.
    """
    url = f"{backend_url}/v1/ai-tools/bookings/{booking_id}"
    response = await client.patch(
        url,
        json=modifications,
        headers=_headers(service_key, language),
    )
    response.raise_for_status()
    return response.json()


async def handle_apply_discount_code(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    code: str,
    booking_id: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Apply a discount or promo code to a booking.

    POST /v1/ai-tools/bookings/{booking_id}/discount

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        code: Discount or promo code string.
        booking_id: Booking to apply the discount to.

    Returns:
        Parsed JSON response containing discount application result.
    """
    url = f"{backend_url}/v1/ai-tools/bookings/{booking_id}/discount"
    response = await client.post(
        url,
        json={"code": code},
        headers=_headers(service_key, language),
    )
    response.raise_for_status()
    return response.json()
