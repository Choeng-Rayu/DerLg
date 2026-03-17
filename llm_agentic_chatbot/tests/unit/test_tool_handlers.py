"""Unit tests for all tool handlers (trips, booking, payment, info).

All handlers call the NestJS backend via httpx, so we mock httpx responses.
"""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import json
import pytest
from unittest.mock import AsyncMock, MagicMock

import httpx

from agent.tools.handlers.trips import (
    handle_get_trip_suggestions,
    handle_get_trip_itinerary,
    handle_get_trip_images,
    handle_compare_trips,
    handle_calculate_custom_trip,
    handle_customize_trip,
)
from agent.tools.handlers.booking import (
    handle_validate_user_details,
    handle_create_booking,
    handle_cancel_booking,
    handle_modify_booking,
    handle_apply_discount_code,
)
from agent.tools.handlers.payment import (
    handle_generate_payment_qr,
    handle_check_payment_status,
)
from agent.tools.handlers.info import (
    handle_get_hotel_details,
    handle_get_weather_forecast,
    handle_get_places,
    handle_get_upcoming_festivals,
    handle_estimate_budget,
    handle_get_currency_rates,
)


BACKEND_URL = "http://localhost:3001"
SERVICE_KEY = "a" * 32
LANGUAGE = "EN"


def _mock_response(data: dict, status_code: int = 200) -> MagicMock:
    """Create a mock httpx.Response."""
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = data
    resp.raise_for_status = MagicMock()
    if status_code >= 400:
        resp.raise_for_status.side_effect = httpx.HTTPStatusError(
            "error", request=MagicMock(), response=resp
        )
    return resp


def _mock_client(response: MagicMock) -> AsyncMock:
    """Create a mock httpx.AsyncClient with preset response."""
    client = AsyncMock()
    client.get = AsyncMock(return_value=response)
    client.post = AsyncMock(return_value=response)
    client.patch = AsyncMock(return_value=response)
    return client


# ===== Trip Handlers =====

class TestTripHandlers:

    @pytest.mark.asyncio
    async def test_get_trip_suggestions(self):
        data = {"data": {"trips": [{"id": "t1"}]}}
        client = _mock_client(_mock_response(data))

        result = await handle_get_trip_suggestions(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            mood="adventurous", environment="BEACH",
            duration_days=3, people_count=2,
            budget_usd={"min": 100, "max": 500},
            departure_city="Phnom Penh", language_param="EN",
        )
        assert result == data
        client.post.assert_called_once()
        call_url = client.post.call_args[0][0]
        assert "/v1/ai-tools/trip-suggestions" in call_url

    @pytest.mark.asyncio
    async def test_get_trip_itinerary(self):
        data = {"data": {"itinerary": [{"day": 1}]}}
        client = _mock_client(_mock_response(data))

        result = await handle_get_trip_itinerary(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            trip_id="trip-abc",
        )
        assert result == data
        call_url = client.get.call_args[0][0]
        assert "trip-abc/itinerary" in call_url

    @pytest.mark.asyncio
    async def test_get_trip_images(self):
        data = {"data": {"images": [{"url": "https://img.jpg"}]}}
        client = _mock_client(_mock_response(data))

        result = await handle_get_trip_images(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            trip_id="trip-xyz",
        )
        assert result == data
        call_url = client.get.call_args[0][0]
        assert "trip-xyz/images" in call_url

    @pytest.mark.asyncio
    async def test_compare_trips(self):
        data = {"data": {"trips": [{"id": "t1"}, {"id": "t2"}]}}
        client = _mock_client(_mock_response(data))

        result = await handle_compare_trips(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            trip_ids=["t1", "t2"],
        )
        assert result == data
        call_url = client.post.call_args[0][0]
        assert "/trips/compare" in call_url

    @pytest.mark.asyncio
    async def test_calculate_custom_trip(self):
        data = {"data": {"total": 500}}
        client = _mock_client(_mock_response(data))

        result = await handle_calculate_custom_trip(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            base_trip_id="t1",
            customizations={"type": "people_count", "value": 4},
        )
        assert result == data

    @pytest.mark.asyncio
    async def test_customize_trip(self):
        data = {"data": {"updated_trip": {}}}
        client = _mock_client(_mock_response(data))

        result = await handle_customize_trip(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            trip_id="t1",
            customizations={"action": "add", "item": "sunset_cruise"},
        )
        assert result == data

    @pytest.mark.asyncio
    async def test_handler_sends_correct_headers(self):
        client = _mock_client(_mock_response({}))

        await handle_get_trip_itinerary(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language="KH",
            trip_id="t1",
        )

        headers = client.get.call_args[1]["headers"]
        assert headers["X-Service-Key"] == SERVICE_KEY
        assert headers["Accept-Language"] == "KH"
        assert headers["Content-Type"] == "application/json"

    @pytest.mark.asyncio
    async def test_handler_raises_on_http_error(self):
        client = _mock_client(_mock_response({}, status_code=500))

        with pytest.raises(httpx.HTTPStatusError):
            await handle_get_trip_itinerary(
                client=client, backend_url=BACKEND_URL,
                service_key=SERVICE_KEY, language=LANGUAGE,
                trip_id="t1",
            )


# ===== Booking Handlers =====

class TestBookingHandlers:

    @pytest.mark.asyncio
    async def test_validate_user_details(self):
        data = {"valid": True}
        client = _mock_client(_mock_response(data))

        result = await handle_validate_user_details(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            name="John Doe", phone="+855 12 345 678", email="john@example.com",
        )
        assert result == data
        body = client.post.call_args[1]["json"]
        assert body["name"] == "John Doe"
        assert body["phone"] == "+855 12 345 678"
        assert body["email"] == "john@example.com"

    @pytest.mark.asyncio
    async def test_create_booking(self):
        data = {"data": {"booking_id": "b1", "booking_ref": "DLG-123"}}
        client = _mock_client(_mock_response(data))

        result = await handle_create_booking(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            trip_id="t1", user_id="u1", people_count=2,
            travel_date="2025-07-01", end_date="2025-07-03",
            pickup_location="Airport", customer_name="Jane",
            customer_phone="+855 99 123 456", customer_email="jane@test.com",
        )
        assert result == data
        call_url = client.post.call_args[0][0]
        assert "/v1/ai-tools/bookings" in call_url

    @pytest.mark.asyncio
    async def test_cancel_booking(self):
        data = {"data": {"cancelled": True}}
        client = _mock_client(_mock_response(data))

        result = await handle_cancel_booking(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            booking_id="b-123",
        )
        assert result == data
        call_url = client.post.call_args[0][0]
        assert "b-123/cancel" in call_url

    @pytest.mark.asyncio
    async def test_modify_booking(self):
        data = {"data": {"modified": True}}
        client = _mock_client(_mock_response(data))

        result = await handle_modify_booking(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            booking_id="b-123",
            modifications={"new_people_count": 4},
        )
        assert result == data
        call_url = client.patch.call_args[0][0]
        assert "b-123" in call_url

    @pytest.mark.asyncio
    async def test_apply_discount_code(self):
        data = {"data": {"valid": True, "discount_amount": 20}}
        client = _mock_client(_mock_response(data))

        result = await handle_apply_discount_code(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            code="FESTIVAL10", booking_id="b-123",
        )
        assert result == data
        body = client.post.call_args[1]["json"]
        assert body["code"] == "FESTIVAL10"


# ===== Payment Handlers =====

class TestPaymentHandlers:

    @pytest.mark.asyncio
    async def test_generate_payment_qr(self):
        data = {"data": {"qr_code_url": "https://qr.png", "payment_intent_id": "pi_1"}}
        client = _mock_client(_mock_response(data))

        result = await handle_generate_payment_qr(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            booking_id="b-123", user_id="u-456",
        )
        assert result == data
        body = client.post.call_args[1]["json"]
        assert body["booking_id"] == "b-123"
        assert body["user_id"] == "u-456"

    @pytest.mark.asyncio
    async def test_check_payment_status(self):
        data = {"data": {"status": "SUCCEEDED"}}
        client = _mock_client(_mock_response(data))

        result = await handle_check_payment_status(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            payment_intent_id="pi_test_123",
        )
        assert result == data
        call_url = client.get.call_args[0][0]
        assert "pi_test_123/status" in call_url


# ===== Info Handlers =====

class TestInfoHandlers:

    @pytest.mark.asyncio
    async def test_get_hotel_details(self):
        data = {"data": {"name": "Grand Hotel", "stars": 5}}
        client = _mock_client(_mock_response(data))

        result = await handle_get_hotel_details(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            hotel_id="h-123",
        )
        assert result == data
        call_url = client.get.call_args[0][0]
        assert "h-123" in call_url

    @pytest.mark.asyncio
    async def test_get_weather_forecast(self):
        data = {"data": {"forecast": {"temp": 32}}}
        client = _mock_client(_mock_response(data))

        result = await handle_get_weather_forecast(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            destination="Siem Reap", date="2025-07-01",
        )
        assert result == data
        params = client.get.call_args[1]["params"]
        assert params["destination"] == "Siem Reap"
        assert params["date"] == "2025-07-01"

    @pytest.mark.asyncio
    async def test_get_places(self):
        data = {"data": {"places": [{"name": "Angkor Wat"}]}}
        client = _mock_client(_mock_response(data))

        result = await handle_get_places(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            category="TEMPLE",
        )
        assert result == data

    @pytest.mark.asyncio
    async def test_get_places_with_region(self):
        data = {"data": {"places": []}}
        client = _mock_client(_mock_response(data))

        await handle_get_places(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            category="BEACH", region="Sihanoukville",
        )
        params = client.get.call_args[1]["params"]
        assert params["region"] == "Sihanoukville"

    @pytest.mark.asyncio
    async def test_get_upcoming_festivals(self):
        data = {"data": {"festivals": [{"name": "Water Festival"}]}}
        client = _mock_client(_mock_response(data))

        result = await handle_get_upcoming_festivals(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            start_date="2025-11-01", end_date="2025-11-30",
        )
        assert result == data

    @pytest.mark.asyncio
    async def test_estimate_budget(self):
        data = {"data": {"total_estimate_usd": 800}}
        client = _mock_client(_mock_response(data))

        result = await handle_estimate_budget(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            trip_type="MID", duration_days=5, people_count=2,
        )
        assert result == data
        body = client.post.call_args[1]["json"]
        assert body["trip_type"] == "MID"
        assert body["duration_days"] == 5

    @pytest.mark.asyncio
    async def test_get_currency_rates(self):
        data = {"data": {"rate": 4100}}
        client = _mock_client(_mock_response(data))

        result = await handle_get_currency_rates(
            client=client, backend_url=BACKEND_URL,
            service_key=SERVICE_KEY, language=LANGUAGE,
            from_currency="USD", to_currency="KHR",
        )
        assert result == data
        params = client.get.call_args[1]["params"]
        assert params["from"] == "USD"
        assert params["to"] == "KHR"
