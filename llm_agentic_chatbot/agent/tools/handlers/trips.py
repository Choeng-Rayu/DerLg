"""Trip-related tool handlers for the DerLg AI agent.

Each handler function calls the NestJS backend trip endpoints
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


async def handle_get_trip_suggestions(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Fetch personalized trip suggestions based on user preferences.

    POST /v1/ai-tools/trip-suggestions

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL (no trailing slash).
        service_key: AI service authentication key.
        language: Accept-Language value (EN, KH, ZH).
        **kwargs: Preference fields forwarded as the JSON body
                  (mood, environment, duration, people, budget, departure_city, etc.).

    Returns:
        Parsed JSON response containing suggested trips.
    """
    url = f"{backend_url}/v1/ai-tools/trip-suggestions"
    response = await client.post(url, json=kwargs, headers=_headers(service_key, language))
    response.raise_for_status()
    return response.json()


async def handle_get_trip_itinerary(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    trip_id: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Retrieve the full daily itinerary for a specific trip.

    GET /v1/ai-tools/trips/{trip_id}/itinerary

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        trip_id: Unique trip identifier.

    Returns:
        Parsed JSON response containing itinerary details.
    """
    url = f"{backend_url}/v1/ai-tools/trips/{trip_id}/itinerary"
    response = await client.get(url, headers=_headers(service_key, language))
    response.raise_for_status()
    return response.json()


async def handle_get_trip_images(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    trip_id: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Retrieve image gallery for a specific trip.

    GET /v1/ai-tools/trips/{trip_id}/images

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        trip_id: Unique trip identifier.

    Returns:
        Parsed JSON response containing trip images.
    """
    url = f"{backend_url}/v1/ai-tools/trips/{trip_id}/images"
    response = await client.get(url, headers=_headers(service_key, language))
    response.raise_for_status()
    return response.json()


async def handle_compare_trips(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    trip_ids: list[str],
    **kwargs: Any,
) -> dict[str, Any]:
    """Compare multiple trips side by side.

    POST /v1/ai-tools/trips/compare

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        trip_ids: List of trip identifiers to compare.

    Returns:
        Parsed JSON response containing comparison data.
    """
    url = f"{backend_url}/v1/ai-tools/trips/compare"
    response = await client.post(
        url,
        json={"trip_ids": trip_ids},
        headers=_headers(service_key, language),
    )
    response.raise_for_status()
    return response.json()


async def handle_calculate_custom_trip(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    base_trip_id: str,
    customizations: dict[str, Any],
    **kwargs: Any,
) -> dict[str, Any]:
    """Calculate pricing for a customized trip variant.

    POST /v1/ai-tools/trips/calculate-custom

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        base_trip_id: Original trip to customize from.
        customizations: Dict of requested changes (transport, hotel, duration, etc.).

    Returns:
        Parsed JSON response containing calculated pricing.
    """
    url = f"{backend_url}/v1/ai-tools/trips/calculate-custom"
    response = await client.post(
        url,
        json={"base_trip_id": base_trip_id, "customizations": customizations},
        headers=_headers(service_key, language),
    )
    response.raise_for_status()
    return response.json()


async def handle_customize_trip(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    trip_id: str,
    customizations: dict[str, Any],
    **kwargs: Any,
) -> dict[str, Any]:
    """Apply customizations to a trip and persist the changes.

    POST /v1/ai-tools/trips/customize

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        trip_id: Trip to customize.
        customizations: Dict of requested changes.

    Returns:
        Parsed JSON response containing the customized trip.
    """
    url = f"{backend_url}/v1/ai-tools/trips/customize"
    response = await client.post(
        url,
        json={"trip_id": trip_id, "customizations": customizations},
        headers=_headers(service_key, language),
    )
    response.raise_for_status()
    return response.json()
