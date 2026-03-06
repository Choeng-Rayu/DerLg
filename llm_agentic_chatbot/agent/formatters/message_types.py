"""Pydantic models for all structured message types sent to the frontend."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class TextMessage(BaseModel):
    """Plain text response with no structured data."""

    type: str = "text"
    content: str


class TripCardsMessage(BaseModel):
    """Trip suggestion cards for the SUGGESTION stage."""

    type: str = "trip_cards"
    content: str
    trips: list[dict[str, Any]]


class QRPaymentMessage(BaseModel):
    """QR code payment prompt during the PAYMENT stage."""

    type: str = "qr_payment"
    content: str
    qr_code_url: str
    amount: float | None = None
    currency: str | None = None
    booking_ref: str | None = None
    expires_at: str | None = None


class BookingConfirmedMessage(BaseModel):
    """Booking confirmation after successful payment."""

    type: str = "booking_confirmed"
    content: str
    booking_id: str | None = None
    booking_ref: str | None = None


class WeatherMessage(BaseModel):
    """Weather forecast data for a destination."""

    type: str = "weather"
    content: str
    forecast: dict[str, Any]


class ItineraryMessage(BaseModel):
    """Day-by-day itinerary for a selected trip."""

    type: str = "itinerary"
    content: str
    itinerary: list[dict[str, Any]]


class BudgetEstimateMessage(BaseModel):
    """Budget estimate breakdown for a trip."""

    type: str = "budget_estimate"
    content: str
    total_estimate_usd: float
    breakdown: dict[str, Any] | None = None


class ComparisonMessage(BaseModel):
    """Side-by-side comparison of two trips."""

    type: str = "comparison"
    content: str
    trips: list[dict[str, Any]]


class ImageGalleryMessage(BaseModel):
    """Image gallery for a destination or trip."""

    type: str = "image_gallery"
    content: str
    images: list[dict[str, Any]]
