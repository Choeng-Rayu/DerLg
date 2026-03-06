"""Payment-related tool handlers for the DerLg AI agent.

Each handler function calls the NestJS backend payment endpoints
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


async def handle_generate_payment_qr(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    booking_id: str,
    user_id: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Generate a QR code for Stripe or Bakong payment.

    POST /v1/ai-tools/payments/generate-qr

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        booking_id: Booking to generate payment for.
        user_id: Authenticated user identifier.

    Returns:
        Parsed JSON response containing QR code data and payment intent.
    """
    url = f"{backend_url}/v1/ai-tools/payments/generate-qr"
    response = await client.post(
        url,
        json={"booking_id": booking_id, "user_id": user_id},
        headers=_headers(service_key, language),
    )
    response.raise_for_status()
    return response.json()


async def handle_check_payment_status(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    payment_intent_id: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Check the current status of a payment intent.

    GET /v1/ai-tools/payments/{payment_intent_id}/status

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        payment_intent_id: Stripe payment intent identifier.

    Returns:
        Parsed JSON response containing payment status.
    """
    url = f"{backend_url}/v1/ai-tools/payments/{payment_intent_id}/status"
    response = await client.get(url, headers=_headers(service_key, language))
    response.raise_for_status()
    return response.json()
