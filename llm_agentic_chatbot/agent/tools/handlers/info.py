"""Informational tool handlers for the DerLg AI agent.

Each handler function calls the NestJS backend informational endpoints
(hotels, weather, places, festivals, budget, currency) and returns the
parsed JSON response. All handlers use the same signature:
(client, backend_url, service_key, language, **kwargs).
"""

from typing import Any, Optional

import httpx


def _headers(service_key: str, language: str) -> dict[str, str]:
    """Build standard request headers for backend calls."""
    return {
        "X-Service-Key": service_key,
        "Accept-Language": language,
        "Content-Type": "application/json",
    }


async def handle_get_hotel_details(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    hotel_id: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Retrieve detailed information about a specific hotel.

    GET /v1/ai-tools/hotels/{hotel_id}

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        hotel_id: Unique hotel identifier.

    Returns:
        Parsed JSON response containing hotel details.
    """
    url = f"{backend_url}/v1/ai-tools/hotels/{hotel_id}"
    response = await client.get(url, headers=_headers(service_key, language))
    response.raise_for_status()
    return response.json()


async def handle_get_weather_forecast(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    destination: str,
    date: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Get a weather forecast for a destination on a specific date.

    GET /v1/ai-tools/weather?destination=...&date=...

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        destination: Place or city name in Cambodia.
        date: Target date in ISO-8601 format (YYYY-MM-DD).

    Returns:
        Parsed JSON response containing weather forecast data.
    """
    url = f"{backend_url}/v1/ai-tools/weather"
    params = {"destination": destination, "date": date}
    response = await client.get(url, params=params, headers=_headers(service_key, language))
    response.raise_for_status()
    return response.json()


async def handle_get_places(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    category: str,
    region: Optional[str] = None,
    **kwargs: Any,
) -> dict[str, Any]:
    """List places filtered by category and optional region.

    GET /v1/ai-tools/places?category=...&language=...&region=...

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        category: Place category (e.g. TEMPLE, BEACH, MOUNTAIN).
        region: Optional geographic region filter.

    Returns:
        Parsed JSON response containing places list.
    """
    url = f"{backend_url}/v1/ai-tools/places"
    params: dict[str, str] = {"category": category, "language": language}
    if region is not None:
        params["region"] = region
    response = await client.get(url, params=params, headers=_headers(service_key, language))
    response.raise_for_status()
    return response.json()


async def handle_get_upcoming_festivals(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    start_date: str,
    end_date: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """List upcoming Cambodian festivals within a date range.

    GET /v1/ai-tools/festivals?start_date=...&end_date=...&language=...

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        start_date: Range start in ISO-8601 format (YYYY-MM-DD).
        end_date: Range end in ISO-8601 format (YYYY-MM-DD).

    Returns:
        Parsed JSON response containing festivals list.
    """
    url = f"{backend_url}/v1/ai-tools/festivals"
    params = {"start_date": start_date, "end_date": end_date, "language": language}
    response = await client.get(url, params=params, headers=_headers(service_key, language))
    response.raise_for_status()
    return response.json()


async def handle_estimate_budget(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    trip_type: str,
    duration_days: int,
    people_count: int,
    **kwargs: Any,
) -> dict[str, Any]:
    """Estimate a travel budget based on trip parameters.

    POST /v1/ai-tools/budget/estimate

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        trip_type: Type of trip (e.g. budget, mid-range, luxury).
        duration_days: Number of travel days.
        people_count: Number of travelers.

    Returns:
        Parsed JSON response containing budget breakdown.
    """
    url = f"{backend_url}/v1/ai-tools/budget/estimate"
    response = await client.post(
        url,
        json={
            "trip_type": trip_type,
            "duration_days": duration_days,
            "people_count": people_count,
        },
        headers=_headers(service_key, language),
    )
    response.raise_for_status()
    return response.json()


async def handle_get_currency_rates(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    *,
    from_currency: str,
    to_currency: str,
    **kwargs: Any,
) -> dict[str, Any]:
    """Get current exchange rate between two currencies.

    GET /v1/ai-tools/currency?from=...&to=...

    Args:
        client: Shared httpx async client.
        backend_url: NestJS backend base URL.
        service_key: AI service authentication key.
        language: Accept-Language value.
        from_currency: Source currency code (e.g. USD).
        to_currency: Target currency code (e.g. KHR).

    Returns:
        Parsed JSON response containing exchange rate data.
    """
    url = f"{backend_url}/v1/ai-tools/currency"
    params = {"from": from_currency, "to": to_currency}
    response = await client.get(url, params=params, headers=_headers(service_key, language))
    response.raise_for_status()
    return response.json()
