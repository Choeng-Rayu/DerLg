"""Unit tests for response formatter and message types."""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import json
import pytest

from agent.formatters.formatter import format_response, _parse_tool_data, _match_structured_data
from agent.formatters.message_types import (
    BookingConfirmedMessage,
    BudgetEstimateMessage,
    ComparisonMessage,
    ImageGalleryMessage,
    ItineraryMessage,
    QRPaymentMessage,
    TextMessage,
    TripCardsMessage,
    WeatherMessage,
)
from agent.session.state import AgentState, ConversationState


def _make_session(**kwargs) -> ConversationState:
    defaults = {"session_id": "s1", "user_id": "u1"}
    defaults.update(kwargs)
    return ConversationState(**defaults)


def _tool_result(data: dict) -> dict:
    return {"tool_use_id": "tu_1", "content": json.dumps(data)}


# ===== Message Type Model Tests =====

class TestMessageTypes:

    def test_text_message(self):
        msg = TextMessage(content="Hello")
        assert msg.type == "text"
        assert msg.content == "Hello"

    def test_trip_cards_message(self):
        trips = [{"id": "t1", "name": "Beach"}]
        msg = TripCardsMessage(content="Here are trips", trips=trips)
        assert msg.type == "trip_cards"
        assert len(msg.trips) == 1

    def test_qr_payment_message(self):
        msg = QRPaymentMessage(
            content="Scan to pay",
            qr_code_url="https://example.com/qr.png",
            amount=150.0,
            currency="USD",
            booking_ref="DLG-123",
            expires_at="2025-06-15T12:00:00Z",
        )
        assert msg.type == "qr_payment"
        assert msg.amount == 150.0

    def test_qr_payment_optional_fields(self):
        msg = QRPaymentMessage(content="Pay", qr_code_url="https://qr.png")
        assert msg.amount is None
        assert msg.currency is None

    def test_booking_confirmed_message(self):
        msg = BookingConfirmedMessage(
            content="Confirmed!", booking_id="b1", booking_ref="REF"
        )
        assert msg.type == "booking_confirmed"
        assert msg.booking_id == "b1"

    def test_weather_message(self):
        forecast = {"temp_high": 35, "temp_low": 25, "condition": "sunny"}
        msg = WeatherMessage(content="Weather info", forecast=forecast)
        assert msg.type == "weather"
        assert msg.forecast["temp_high"] == 35

    def test_itinerary_message(self):
        itinerary = [{"day": 1, "activities": ["Temple visit"]}]
        msg = ItineraryMessage(content="Your itinerary", itinerary=itinerary)
        assert msg.type == "itinerary"
        assert len(msg.itinerary) == 1

    def test_budget_estimate_message(self):
        msg = BudgetEstimateMessage(
            content="Budget estimate",
            total_estimate_usd=500.0,
            breakdown={"accommodation": 200, "transport": 100},
        )
        assert msg.type == "budget_estimate"
        assert msg.total_estimate_usd == 500.0

    def test_comparison_message(self):
        trips = [{"id": "t1"}, {"id": "t2"}]
        msg = ComparisonMessage(content="Comparison", trips=trips)
        assert msg.type == "comparison"
        assert len(msg.trips) == 2

    def test_image_gallery_message(self):
        images = [{"url": "https://img.png", "caption": "Beach"}]
        msg = ImageGalleryMessage(content="Images", images=images)
        assert msg.type == "image_gallery"
        assert len(msg.images) == 1

    def test_all_messages_have_type_field(self):
        """Every message model must have a 'type' field for frontend routing."""
        models = [
            TextMessage(content="x"),
            TripCardsMessage(content="x", trips=[]),
            QRPaymentMessage(content="x", qr_code_url="url"),
            BookingConfirmedMessage(content="x"),
            WeatherMessage(content="x", forecast={}),
            ItineraryMessage(content="x", itinerary=[]),
            BudgetEstimateMessage(content="x", total_estimate_usd=0),
            ComparisonMessage(content="x", trips=[]),
            ImageGalleryMessage(content="x", images=[]),
        ]
        for m in models:
            dumped = m.model_dump()
            assert "type" in dumped
            assert isinstance(dumped["type"], str)


# ===== _parse_tool_data Tests =====

class TestParseToolData:

    def test_parses_json_string_content(self):
        results = [{"content": '{"trips": []}'}]
        parsed = _parse_tool_data(results)
        assert len(parsed) == 1
        assert parsed[0] == {"trips": []}

    def test_passes_through_dict_content(self):
        results = [{"content": {"trips": []}}]
        parsed = _parse_tool_data(results)
        assert len(parsed) == 1

    def test_skips_invalid_json(self):
        results = [{"content": "not json"}]
        parsed = _parse_tool_data(results)
        assert len(parsed) == 0

    def test_skips_missing_content(self):
        results = [{}]
        parsed = _parse_tool_data(results)
        assert len(parsed) == 0

    def test_handles_multiple_results(self):
        results = [
            {"content": '{"a": 1}'},
            {"content": "invalid"},
            {"content": '{"b": 2}'},
        ]
        parsed = _parse_tool_data(results)
        assert len(parsed) == 2


# ===== format_response Tests =====

class TestFormatResponse:

    def test_returns_text_message_by_default(self):
        session = _make_session()
        result = format_response("Hello world", [], session)
        assert result["type"] == "text"
        assert result["content"] == "Hello world"

    def test_detects_trip_cards(self):
        session = _make_session()
        tool_results = [_tool_result({
            "data": {
                "trips": [
                    {"id": "t1", "name": "Beach"},
                    {"id": "t2", "name": "Temple"},
                    {"id": "t3", "name": "Mountain"},
                ]
            }
        })]
        result = format_response("Here are suggestions", tool_results, session)
        assert result["type"] == "trip_cards"
        assert len(result["trips"]) == 3

    def test_detects_comparison_for_two_trips(self):
        session = _make_session()
        tool_results = [_tool_result({
            "data": {
                "trips": [
                    {"id": "t1", "name": "Beach"},
                    {"id": "t2", "name": "Temple"},
                ]
            }
        })]
        result = format_response("Comparison", tool_results, session)
        assert result["type"] == "comparison"
        assert len(result["trips"]) == 2

    def test_detects_qr_payment(self):
        session = _make_session()
        tool_results = [_tool_result({
            "data": {
                "qr_code_url": "https://example.com/qr.png",
                "amount": 200.0,
                "currency": "USD",
            }
        })]
        result = format_response("Scan QR", tool_results, session)
        assert result["type"] == "qr_payment"
        assert result["qr_code_url"] == "https://example.com/qr.png"

    def test_detects_weather(self):
        session = _make_session()
        tool_results = [_tool_result({
            "data": {"forecast": {"temp": 32, "condition": "sunny"}}
        })]
        result = format_response("Weather", tool_results, session)
        assert result["type"] == "weather"

    def test_detects_itinerary(self):
        session = _make_session()
        tool_results = [_tool_result({
            "data": {"itinerary": [{"day": 1}]}
        })]
        result = format_response("Itinerary", tool_results, session)
        assert result["type"] == "itinerary"

    def test_detects_budget_estimate(self):
        session = _make_session()
        tool_results = [_tool_result({
            "data": {"total_estimate_usd": 800.0, "breakdown": {"hotel": 400}}
        })]
        result = format_response("Budget", tool_results, session)
        assert result["type"] == "budget_estimate"
        assert result["total_estimate_usd"] == 800.0

    def test_detects_image_gallery(self):
        session = _make_session()
        tool_results = [_tool_result({
            "data": {"images": [{"url": "https://img.jpg"}]}
        })]
        result = format_response("Images", tool_results, session)
        assert result["type"] == "image_gallery"

    def test_booking_confirmed_in_post_booking_state(self):
        session = _make_session(
            state=AgentState.POST_BOOKING,
            payment_status="CONFIRMED",
            booking_id="b-123",
            booking_ref="DLG-ABC",
        )
        result = format_response("Booking confirmed!", [], session)
        assert result["type"] == "booking_confirmed"
        assert result["booking_id"] == "b-123"
        assert result["booking_ref"] == "DLG-ABC"

    def test_post_booking_without_confirmed_returns_text(self):
        session = _make_session(state=AgentState.POST_BOOKING, payment_status="PENDING")
        result = format_response("Processing", [], session)
        assert result["type"] == "text"

    def test_empty_tool_results_returns_text(self):
        session = _make_session()
        result = format_response("Just text", [], session)
        assert result["type"] == "text"
        assert result["content"] == "Just text"

    def test_tool_results_without_data_key(self):
        """Tool result with direct keys (no 'data' wrapper)."""
        session = _make_session()
        tool_results = [_tool_result({
            "forecast": {"temp": 30}
        })]
        result = format_response("Weather", tool_results, session)
        assert result["type"] == "weather"

    def test_priority_qr_over_trips(self):
        """If both QR and trips are present, QR should win (first match)."""
        session = _make_session()
        tool_results = [
            _tool_result({"data": {"qr_code_url": "https://qr.png", "amount": 100}}),
            _tool_result({"data": {"trips": [{"id": "t1"}]}}),
        ]
        result = format_response("Pay now", tool_results, session)
        # The first matching pattern wins
        assert result["type"] == "qr_payment"
