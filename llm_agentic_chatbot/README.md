# DerLg.com AI Agent

Conversational travel booking concierge for Cambodia. Built with FastAPI, LangGraph, Claude Sonnet 4.5, WebSocket real-time communication, and Redis session storage.

The agent guides travelers through a complete booking journey -- from discovering trip preferences to payment confirmation -- in English, Khmer, and Chinese.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Conversation Flow](#conversation-flow)
3. [Tools (20 total)](#tools-20-total)
4. [Supported Languages](#supported-languages)
5. [Setup](#setup)
6. [Docker Development](#docker-development)
7. [Testing](#testing)
8. [Project Structure](#project-structure)
9. [Environment Variables](#environment-variables)
10. [API Reference](#api-reference)
    - [WebSocket Protocol](#websocket-connection-protocol)
    - [Message Format Specifications](#message-format-specifications)
    - [Tool Schemas](#tool-schemas-with-examples)
    - [Conversation State Model](#conversation-state-model)
    - [Error Codes and Handling](#error-codes-and-handling)
    - [REST Endpoints](#rest-endpoints)
11. [Developer Guide](#developer-guide)
    - [Local Development Setup](#local-development-setup)
    - [Docker Development Workflow](#docker-development-workflow)
    - [Testing Procedures](#testing-procedures)
    - [Debugging Techniques](#debugging-techniques)
    - [Troubleshooting Guide](#troubleshooting-guide)
    - [Common Issues and Solutions](#common-issues-and-solutions)
12. [Architecture Documentation](#architecture-documentation)
    - [System Architecture Diagram](#system-architecture-diagram)
    - [Design Decisions and Rationale](#design-decisions-and-rationale)
    - [LangGraph State Machine Flow](#langgraph-state-machine-flow)
    - [Tool Execution Pipeline](#tool-execution-pipeline)
    - [Session Management Strategy](#session-management-strategy)
    - [Multi-Language Support Approach](#multi-language-support-approach)
13. [License](#license)

---

## Architecture

```
Frontend (Next.js)
    |
    | WebSocket (/ws/{session_id})
    v
FastAPI  -->  LangGraph State Machine  -->  Claude Sonnet 4.5 (Anthropic API)
    |                |
    |                +--> 20 Tool Schemas --> NestJS Backend API (httpx)
    |
    +--> Redis (session storage, 7-day TTL, pub/sub for payment events)
```

**Key components:**

- **FastAPI** -- HTTP server with WebSocket endpoint, CORS, security headers, structured logging
- **LangGraph** -- Three-node state machine (`call_llm -> execute_tools -> format_response`) with conditional routing and a 5-iteration tool loop cap
- **Claude Sonnet 4.5** -- LLM backend via Anthropic API (Ollama also supported for local dev)
- **Redis** -- Session persistence with 7-day TTL, pub/sub for real-time payment event notifications
- **NestJS Backend** -- Tool execution target for trip data, bookings, payments, and info lookups

## Conversation Flow

The agent operates through 7 stages, tracked in `ConversationState.state`:

| Stage | Description |
|---|---|
| **DISCOVERY** | Collect 6 traveler preferences (mood, environment, duration, people, budget, departure city) |
| **SUGGESTION** | Present 3 trip options (best match, affordable, premium) from backend |
| **EXPLORATION** | Deep-dive into selected trip -- itinerary, photos, hotel, weather, festivals |
| **CUSTOMIZATION** | Add/remove extras, upgrade transport, apply discount codes, recalculate pricing |
| **BOOKING** | Collect customer details, validate inputs, create reservation with 15-min hold |
| **PAYMENT** | Generate Stripe QR code, monitor payment status via pub/sub |
| **POST_BOOKING** | Confirmation, trip modifications, travel tips, currency info |

## Tools (20 total)

**Discovery & Suggestions:** `getTripSuggestions`, `getTripItinerary`, `getTripImages`, `getHotelDetails`, `getWeatherForecast`, `compareTrips`

**Customization:** `calculateCustomTrip`, `customizeTrip`, `applyDiscountCode`

**Booking:** `validateUserDetails`, `createBooking`

**Payment:** `generatePaymentQR`, `checkPaymentStatus`

**Post-Booking:** `cancelBooking`, `modifyBooking`, `getBookingDetails`

**Explore & Budget:** `getPlaces`, `getUpcomingFestivals`, `estimateBudget`, `getCurrencyRates`

## Supported Languages

- **EN** -- English
- **KH** -- Khmer
- **ZH** -- Simplified Chinese

Language is set during the WebSocket auth handshake and applied to system prompts and tool response localization.

## Setup

### Prerequisites

- Python 3.11+
- Redis server (local or Upstash)
- Anthropic API key (or Ollama for local LLM)

### Install dependencies

```bash
pip install -r requirements.txt
```

### Configure environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

Required variables (see Environment Variables table below for the full list):

```
MODEL_BACKEND=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...
BACKEND_URL=http://localhost:3001
AI_SERVICE_KEY=<min 32 characters>
REDIS_URL=redis://localhost:6379
```

### Run the service

```bash
# Development
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Production
python main.py
```

The WebSocket endpoint is available at `ws://localhost:8000/ws/{session_id}`.

## Docker Development

```bash
docker-compose up
```

This starts the AI agent service along with Redis. The service binds to the host and port configured in your `.env` file (defaults to `0.0.0.0:8000`).

## Testing

Tests use `SKIP_SETTINGS_INIT=1` to bypass environment variable validation during test collection.

### Run all tests

```bash
SKIP_SETTINGS_INIT=1 pytest
```

### Run by category

```bash
# Unit tests only
SKIP_SETTINGS_INIT=1 pytest tests/unit/

# Integration tests
SKIP_SETTINGS_INIT=1 pytest tests/integration/

# Property-based tests
SKIP_SETTINGS_INIT=1 pytest tests/property/

# Single test file
SKIP_SETTINGS_INIT=1 pytest tests/unit/test_tool_schemas.py

# With coverage
SKIP_SETTINGS_INIT=1 pytest --cov=agent --cov=api --cov=utils --cov-report=term-missing
```

### Test markers

```bash
SKIP_SETTINGS_INIT=1 pytest -m unit
SKIP_SETTINGS_INIT=1 pytest -m integration
SKIP_SETTINGS_INIT=1 pytest -m property
```

## Project Structure

```
llm_agentic_chatbot/
|-- main.py                          # FastAPI app entry point, lifecycle, middleware
|-- requirements.txt                 # Python dependencies
|-- pytest.ini                       # Pytest configuration and markers
|-- pyproject.toml                   # Code quality tool config (Black, Pylint, mypy)
|-- .pre-commit-config.yaml          # Pre-commit hooks
|-- CONTRIBUTING.md                  # Contributor guidelines and code standards
|-- .env.example                     # Environment variable template
|
|-- config/
|   |-- __init__.py
|   +-- settings.py                  # Pydantic BaseSettings with validation
|
|-- agent/
|   |-- __init__.py
|   |-- core.py                      # Imperative agent loop (run_agent)
|   |-- graph.py                     # LangGraph state machine (run_agent_graph)
|   |
|   |-- models/
|   |   |-- __init__.py              # get_model_client() factory
|   |   |-- client.py                # ModelResponse / ContentBlock dataclasses
|   |   |-- anthropic.py             # Anthropic Claude client
|   |   +-- ollama.py                # Ollama local model client
|   |
|   |-- prompts/
|   |   |-- __init__.py
|   |   |-- templates.py             # Stage-specific system prompt templates
|   |   +-- builder.py               # build_system_prompt() from session state
|   |
|   |-- formatters/
|   |   |-- __init__.py
|   |   |-- formatter.py             # format_response() for frontend messages
|   |   +-- message_types.py         # Response type definitions
|   |
|   |-- session/
|   |   |-- __init__.py
|   |   |-- state.py                 # ConversationState model, AgentState enum
|   |   |-- manager.py               # SessionManager (Redis load/save)
|   |   +-- side_effects.py          # apply_session_side_effects() per tool
|   |
|   +-- tools/
|       |-- __init__.py
|       |-- schemas.py               # 20 Anthropic tool-calling schemas (ALL_TOOLS)
|       |-- executor.py              # ToolExecutor with parallel execution + circuit breaker
|       +-- handlers/
|           |-- __init__.py          # TOOL_DISPATCH registry
|           |-- trips.py             # Trip suggestion/itinerary/image/compare handlers
|           |-- booking.py           # Booking creation/validation/modification handlers
|           |-- payment.py           # Payment QR generation and status handlers
|           +-- info.py              # Places, festivals, budget, currency handlers
|
|-- api/
|   |-- __init__.py
|   |-- websocket.py                 # WebSocket endpoint with auth, rate limiting, typing indicators
|   |-- health.py                    # Health check endpoint
|   |-- metrics.py                   # Prometheus-style metrics
|   |-- middleware.py                # Request logging middleware (structlog)
|   +-- payment_listener.py         # Redis pub/sub payment event listener
|
|-- utils/
|   |-- __init__.py
|   |-- logging.py                   # structlog configuration
|   |-- redis.py                     # Redis client init/close/get
|   |-- rate_limiter.py              # Per-session rate limiter
|   |-- sanitizer.py                 # Input sanitization and tool input validation
|   +-- circuit_breaker.py           # Circuit breaker for backend API calls
|
+-- tests/
    |-- __init__.py
    |-- conftest.py                  # Shared fixtures (make_session, make_model_response, mocks)
    |-- test_settings.py             # Settings validation tests
    |-- .env.test                    # Test environment variables
    |
    |-- unit/
    |   |-- test_state.py
    |   |-- test_session_manager.py
    |   |-- test_side_effects.py
    |   |-- test_prompt_builder.py
    |   |-- test_formatter.py
    |   |-- test_tool_schemas.py
    |   |-- test_tool_executor.py
    |   |-- test_tool_handlers.py
    |   |-- test_models.py
    |   |-- test_agent_core.py
    |   |-- test_middleware.py
    |   +-- test_logging.py
    |
    |-- integration/
    |   +-- test_middleware_integration.py
    |
    +-- property/
        +-- test_state_serialization.py
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MODEL_BACKEND` | Yes | -- | LLM backend: `anthropic` or `ollama` |
| `ANTHROPIC_API_KEY` | When anthropic | -- | Anthropic API key |
| `OLLAMA_BASE_URL` | When ollama | -- | Ollama server URL (e.g. `http://localhost:11434`) |
| `BACKEND_URL` | Yes | -- | NestJS backend base URL (no trailing slash) |
| `AI_SERVICE_KEY` | Yes | -- | Service auth key for backend calls (min 32 chars) |
| `REDIS_URL` | Yes | -- | Redis connection string |
| `HOST` | No | `0.0.0.0` | Server bind host |
| `PORT` | No | `8000` | Server bind port |
| `LOG_LEVEL` | No | `info` | Logging level: debug, info, warning, error, critical |
| `SENTRY_DSN` | No | -- | Sentry DSN for error tracking |

---

## API Reference

### WebSocket Connection Protocol

The AI agent communicates with the frontend exclusively over WebSocket. Every session follows a strict handshake protocol before message exchange begins.

**Endpoint:** `ws://<host>:<port>/ws/{session_id}`

**Connection sequence:**

```
1. Client opens WebSocket to /ws/{session_id}
2. Server accepts the connection
3. Client sends an "auth" message within 30 seconds
4. Server validates auth, loads or creates session
5. Server sends "welcome" (new session) or "resume" (existing session)
6. Bidirectional message exchange begins
```

**Session ID format:** Must be a valid UUID v4 string (e.g. `550e8400-e29b-41d4-a716-446655440000`). Invalid formats are rejected with close code `4000`.

**Auth message (client -> server):**

```json
{
  "type": "auth",
  "user_id": "uuid-of-authenticated-user",
  "language": "EN"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | string | Yes | Must be `"auth"` |
| `user_id` | string | Yes | UUID of the authenticated user |
| `language` | string | No | `"EN"`, `"KH"`, or `"ZH"`. Defaults to `"EN"` |

**Auth timeout:** If the auth message is not received within 30 seconds, the connection is closed with code `4002`.

**Auth failure:** If the first message is not of type `"auth"`, the server sends an error and closes the connection with code `4001`.

**Payment event listener:** Upon successful auth, a background task subscribes to the Redis pub/sub channel `payment_events:{user_id}` to receive real-time payment confirmations.

### Message Format Specifications

#### Inbound Messages (Client -> Server)

**User message:**

```json
{
  "type": "user_message",
  "content": "I want to visit Angkor Wat for 3 days"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | string | Yes | Must be `"user_message"` |
| `content` | string | Yes | User's natural language message (max 4096 chars, sanitized) |

Messages with any other `type` value are silently ignored. Empty content after sanitization is also ignored.

#### Outbound Messages (Server -> Client)

**Welcome message** (new session):

```json
{
  "type": "welcome",
  "content": "Hello! I'm DerLg, your Cambodia travel concierge..."
}
```

**Resume message** (returning session):

```json
{
  "type": "resume",
  "content": "Welcome back! I remember our conversation..."
}
```

**Typing indicator start:**

```json
{
  "type": "typing_start"
}
```

**Typing indicator end:**

```json
{
  "type": "typing_end"
}
```

**Agent text response:**

```json
{
  "type": "text",
  "content": "I'd love to help you explore Cambodia! What kind of experience are you looking for?"
}
```

**Trip cards response:**

```json
{
  "type": "trip_cards",
  "content": "Here are 3 trip options based on your preferences:",
  "trips": [
    {
      "id": "uuid",
      "name": "Angkor Explorer",
      "price_usd": 250,
      "duration_days": 3,
      "highlights": ["Angkor Wat sunrise", "Bayon Temple"]
    }
  ]
}
```

**QR payment response:**

```json
{
  "type": "qr_payment",
  "content": "Please scan the QR code to complete your payment.",
  "qr_code_url": "https://api.stripe.com/qr/...",
  "amount": 750.00,
  "currency": "USD",
  "booking_ref": "DL-20260306-ABC",
  "expires_at": "2026-03-06T15:30:00Z"
}
```

**Booking confirmed response:**

```json
{
  "type": "booking_confirmed",
  "content": "Your booking is confirmed! Here are your trip details...",
  "booking_id": "uuid",
  "booking_ref": "DL-20260306-ABC"
}
```

**Weather response:**

```json
{
  "type": "weather",
  "content": "Here's the weather forecast for Siem Reap:",
  "forecast": {
    "destination": "Siem Reap",
    "days": [
      {"date": "2026-03-07", "condition": "Sunny", "high_c": 34, "low_c": 24}
    ]
  }
}
```

**Itinerary response:**

```json
{
  "type": "itinerary",
  "content": "Here's the day-by-day itinerary for your trip:",
  "itinerary": [
    {
      "day": 1,
      "morning": "Visit Angkor Wat",
      "afternoon": "Explore Bayon Temple",
      "evening": "Dinner at local restaurant"
    }
  ]
}
```

**Budget estimate response:**

```json
{
  "type": "budget_estimate",
  "content": "Here's a detailed budget breakdown for your trip:",
  "total_estimate_usd": 450.00,
  "breakdown": {
    "accommodation": 150.00,
    "transport": 80.00,
    "meals": 120.00,
    "activities": 100.00
  }
}
```

**Comparison response:**

```json
{
  "type": "comparison",
  "content": "Here's a side-by-side comparison of your options:",
  "trips": [
    {"id": "uuid-1", "name": "Budget Explorer", "price_usd": 200},
    {"id": "uuid-2", "name": "Premium Getaway", "price_usd": 500}
  ]
}
```

**Image gallery response:**

```json
{
  "type": "image_gallery",
  "content": "Here are some photos of the destination:",
  "images": [
    {"url": "https://...", "caption": "Angkor Wat at sunrise", "category": "destination"}
  ]
}
```

**Payment confirmed (via pub/sub):**

```json
{
  "type": "payment_confirmed",
  "content": "Payment confirmed!",
  "booking_ref": "DL-20260306-ABC"
}
```

**Error response:**

```json
{
  "type": "error",
  "content": "I encountered an issue processing your message. Please try again."
}
```

### Tool Schemas with Examples

All 20 tools follow the Anthropic tool-calling format. Each tool is called by the LLM via the `tool_use` content block and executed against the NestJS backend via the `ToolExecutor`. Below are the tool schemas grouped by category with example inputs.

#### Discovery & Suggestions (6 tools)

**getTripSuggestions** -- Get personalized trip recommendations based on user preferences.

```
Backend endpoint: POST /v1/ai-tools/trip-suggestions
```

Example input:
```json
{
  "mood": "adventurous",
  "environment": "TEMPLE",
  "duration_days": 3,
  "people_count": 2,
  "budget_usd": {"min": 200, "max": 500},
  "departure_city": "Phnom Penh",
  "language": "EN"
}
```

Required fields: `mood`, `environment`, `duration_days`, `people_count`, `budget_usd`, `departure_city`, `language`

Mood values: `stressed`, `adventurous`, `romantic`, `curious`, `family`

Environment values: `MOUNTAIN`, `BEACH`, `CITY`, `FOREST`, `ISLAND`, `TEMPLE`

---

**getTripItinerary** -- Get the full day-by-day itinerary for a trip.

```
Backend endpoint: GET /v1/ai-tools/trips/{trip_id}/itinerary
```

Example input:
```json
{
  "trip_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

**getTripImages** -- Get photo gallery for a trip.

```
Backend endpoint: GET /v1/ai-tools/trips/{trip_id}/images
```

Example input:
```json
{
  "trip_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

**getHotelDetails** -- Get full hotel information including rooms, amenities, and pricing.

```
Backend endpoint: GET /v1/ai-tools/hotels/{hotel_id}
```

Example input:
```json
{
  "hotel_id": "660e8400-e29b-41d4-a716-446655440000"
}
```

---

**getWeatherForecast** -- Get 7-day weather forecast for a Cambodian destination.

```
Backend endpoint: GET /v1/ai-tools/weather?destination=...&date=...
```

Example input:
```json
{
  "destination": "Siem Reap",
  "date": "2026-03-15"
}
```

Required: `destination`. Optional: `date` (defaults to today).

---

**compareTrips** -- Side-by-side comparison of 2-3 trip options.

```
Backend endpoint: POST /v1/ai-tools/trips/compare
```

Example input:
```json
{
  "trip_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}
```

Required: `trip_ids` (array of 2-3 UUIDs).

#### Customization (3 tools)

**calculateCustomTrip** -- Recalculate pricing after user modifications.

```
Backend endpoint: POST /v1/ai-tools/trips/calculate-custom
```

Example input:
```json
{
  "base_trip_id": "550e8400-e29b-41d4-a716-446655440000",
  "customizations": [
    {"type": "people_count", "value": 4},
    {"type": "add_on", "value": "sunset_cruise"}
  ]
}
```

Customization types: `people_count`, `duration_override`, `add_on`

---

**customizeTrip** -- Apply add-ons, remove items, or upgrade transport.

```
Backend endpoint: POST /v1/ai-tools/trips/customize
```

Example input:
```json
{
  "trip_id": "550e8400-e29b-41d4-a716-446655440000",
  "customizations": [
    {"action": "add", "item": "private_dinner"},
    {"action": "add", "item": "hotel_upgrade"},
    {"action": "remove", "item": "sunset_cruise"}
  ]
}
```

Actions: `add`, `remove`

Available add-ons: `private_dinner`, `hotel_upgrade`, `sunset_cruise`, `guide_english`, `guide_chinese`, `extra_night`, `airport_transfer`

---

**applyDiscountCode** -- Validate and apply a discount code to a booking.

```
Backend endpoint: POST /v1/ai-tools/bookings/{booking_id}/discount
```

Example input:
```json
{
  "code": "FESTIVAL10",
  "booking_id": "770e8400-e29b-41d4-a716-446655440000"
}
```

#### Booking (2 tools)

**validateUserDetails** -- Validate customer contact details before booking.

```
Backend endpoint: POST /v1/ai-tools/bookings/validate
```

Example input:
```json
{
  "name": "Sok Dara",
  "phone": "+855 12 345 678",
  "email": "dara@example.com"
}
```

---

**createBooking** -- Create a booking reservation with a 15-minute payment hold.

```
Backend endpoint: POST /v1/ai-tools/bookings
```

Example input:
```json
{
  "user_id": "880e8400-e29b-41d4-a716-446655440000",
  "trip_id": "550e8400-e29b-41d4-a716-446655440000",
  "travel_date": "2026-04-01",
  "end_date": "2026-04-04",
  "people_count": 2,
  "pickup_location": "Phnom Penh International Airport, Terminal 1",
  "customer_name": "Sok Dara",
  "customer_phone": "+855 12 345 678",
  "customer_email": "dara@example.com",
  "special_requests": "Vegetarian meals preferred",
  "discount_code": "FESTIVAL10"
}
```

Required: `user_id`, `trip_id`, `travel_date`, `end_date`, `people_count`, `pickup_location`, `customer_name`, `customer_phone`, `customer_email`

Optional: `special_requests`, `discount_code`

#### Payment (2 tools)

**generatePaymentQR** -- Generate a Stripe QR code for payment.

```
Backend endpoint: POST /v1/ai-tools/payments/generate-qr
```

Example input:
```json
{
  "booking_id": "770e8400-e29b-41d4-a716-446655440000",
  "user_id": "880e8400-e29b-41d4-a716-446655440000"
}
```

---

**checkPaymentStatus** -- Check the current status of a payment.

```
Backend endpoint: GET /v1/ai-tools/payments/{payment_intent_id}/status
```

Example input:
```json
{
  "payment_intent_id": "pi_3xxxxxxxxxxxx"
}
```

Return statuses: `SUCCEEDED`, `PENDING`, `FAILED`, `CANCELLED`

#### Post-Booking (3 tools)

**cancelBooking** -- Cancel a confirmed booking and trigger refund logic.

```
Backend endpoint: POST /v1/ai-tools/bookings/{booking_id}/cancel
```

Example input:
```json
{
  "booking_id": "770e8400-e29b-41d4-a716-446655440000"
}
```

Refund policy: 7+ days = full refund, 1-7 days = 50%, under 24 hours = no refund.

---

**modifyBooking** -- Modify an existing confirmed booking.

```
Backend endpoint: PATCH /v1/ai-tools/bookings/{booking_id}
```

Example input:
```json
{
  "booking_id": "770e8400-e29b-41d4-a716-446655440000",
  "modifications": {
    "new_travel_date": "2026-04-10",
    "new_end_date": "2026-04-13",
    "new_people_count": 3
  }
}
```

Optional modification fields: `new_travel_date`, `new_end_date`, `new_people_count`, `new_pickup_location`, `new_special_requests`

---

**getBookingDetails** -- Retrieve full booking information.

```
Backend endpoint: GET /v1/ai-tools/bookings/{booking_id}
```

Example input:
```json
{
  "booking_id": "770e8400-e29b-41d4-a716-446655440000"
}
```

#### Explore & Budget (4 tools)

**getPlaces** -- Search for places in Cambodia by category and region.

```
Backend endpoint: GET /v1/ai-tools/places?category=...&language=...&region=...
```

Example input:
```json
{
  "category": "TEMPLE",
  "region": "Siem Reap",
  "language": "EN"
}
```

Categories: `TEMPLE`, `BEACH`, `MOUNTAIN`, `MUSEUM`, `MARKET`, `NATIONAL_PARK`, `WATERFALL`, `HISTORICAL`, `CULTURAL`

---

**getUpcomingFestivals** -- Get upcoming Cambodian festivals and events.

```
Backend endpoint: GET /v1/ai-tools/festivals?start_date=...&end_date=...&language=...
```

Example input:
```json
{
  "start_date": "2026-03-01",
  "end_date": "2026-06-30",
  "language": "EN"
}
```

---

**estimateBudget** -- AI budget planner with cost breakdown by category.

```
Backend endpoint: POST /v1/ai-tools/budget/estimate
```

Example input:
```json
{
  "trip_type": "MID",
  "duration_days": 5,
  "people_count": 2
}
```

Trip types: `BUDGET`, `MID`, `LUXURY`

---

**getCurrencyRates** -- Get live exchange rates between currencies.

```
Backend endpoint: GET /v1/ai-tools/currency?from=...&to=...
```

Example input:
```json
{
  "from_currency": "USD",
  "to_currency": "KHR"
}
```

Common currency codes: `USD`, `KHR` (Cambodian Riel), `CNY` (Chinese Yuan)

### Conversation State Model

The conversation state tracks the full context of a user's booking journey. It is stored in Redis as a JSON-serialized Pydantic model with a 7-day TTL.

**AgentState enum (7 stages):**

```
DISCOVERY -> SUGGESTION -> EXPLORATION -> CUSTOMIZATION -> BOOKING -> PAYMENT -> POST_BOOKING
```

| Stage | Entry Condition | Exit Condition |
|---|---|---|
| `DISCOVERY` | Session created (initial state) | `getTripSuggestions` returns results |
| `SUGGESTION` | Trip suggestions retrieved | User selects a trip for exploration |
| `EXPLORATION` | User exploring trip details | User requests customization or booking |
| `CUSTOMIZATION` | User modifying trip options | User satisfied, proceeds to booking |
| `BOOKING` | Customer details collected | `createBooking` succeeds, 15-min hold starts |
| `PAYMENT` | Booking created with hold | Payment confirmed via Stripe webhook |
| `POST_BOOKING` | Payment SUCCEEDED event received | Session expires (7-day TTL) |

**ConversationState fields:**

| Field | Type | Default | Description |
|---|---|---|---|
| `session_id` | string | (required) | UUID identifying this session |
| `user_id` | string | (required) | UUID of the authenticated user |
| `state` | AgentState | `DISCOVERY` | Current conversation stage |
| `preferred_language` | string | `"EN"` | Language: `EN`, `KH`, or `ZH` |
| `messages` | list[dict] | `[]` | Conversation history in Anthropic message format |
| `suggested_trip_ids` | list[string] | `[]` | Trip IDs from the last suggestion call |
| `selected_trip_id` | string or null | `null` | Currently selected trip UUID |
| `selected_trip_name` | string or null | `null` | Name of the selected trip |
| `booking_id` | string or null | `null` | Created booking UUID |
| `booking_ref` | string or null | `null` | Human-readable booking reference |
| `reserved_until` | datetime or null | `null` | Booking hold expiry timestamp |
| `payment_intent_id` | string or null | `null` | Stripe Payment Intent ID |
| `payment_status` | string or null | `null` | Payment status (e.g. `CONFIRMED`) |
| `created_at` | datetime | now (UTC) | Session creation timestamp |
| `last_active` | datetime | now (UTC) | Last activity timestamp (refreshed on save) |

**State transitions triggered by tool results:**

| Tool | State Change | Additional Side Effects |
|---|---|---|
| `getTripSuggestions` | DISCOVERY -> SUGGESTION | Stores `suggested_trip_ids` |
| `createBooking` | BOOKING -> PAYMENT | Stores `booking_id`, `booking_ref`, `reserved_until` |
| `generatePaymentQR` | (no change) | Stores `payment_intent_id` |
| `checkPaymentStatus` (SUCCEEDED) | PAYMENT -> POST_BOOKING | Sets `payment_status` to `CONFIRMED` |
| `cancelBooking` | (any) -> DISCOVERY | Clears all booking and payment fields |

**Expired booking hold handling:** When loading a session from Redis, the `SessionManager` checks if the `reserved_until` timestamp has passed while the state is `PAYMENT`. If expired, the state is rolled back to `BOOKING` and all booking and payment fields are cleared. A system message is injected into the conversation to inform the agent.

### Error Codes and Handling

#### WebSocket Close Codes

| Code | Meaning | When |
|---|---|---|
| `4000` | Invalid session ID format | Session ID is not a valid UUID |
| `4001` | Auth failure | First message was not type `"auth"` |
| `4002` | Auth timeout | No auth message received within 30 seconds |
| `1000` | Normal closure | Client or server initiated clean disconnect |

#### Error Message Types

| Scenario | Error Sent to Client |
|---|---|
| Rate limit exceeded | `{"type": "error", "content": "You're sending messages too quickly. Please wait a moment."}` |
| Agent processing error | `{"type": "error", "content": "I encountered an issue processing your message. Please try again."}` |
| First message not auth | `{"type": "error", "content": "First message must be auth"}` |

#### Tool Execution Errors

Tool errors are returned to the LLM as `tool_result` blocks with `is_error: true`. The LLM then generates a user-friendly message. Error types include:

| Error Type | Cause | Circuit Breaker Impact |
|---|---|---|
| Unknown tool | Tool name not found in `TOOL_DISPATCH` | None |
| Circuit breaker open | Backend deemed unhealthy after 5 consecutive failures | Blocks all tool calls |
| Timeout | Backend did not respond within 15 seconds | Records failure |
| HTTP error | Backend returned non-2xx status code | Records failure |
| Unexpected error | Any other exception during tool execution | Records failure |

#### Circuit Breaker States

| State | Behavior | Transition |
|---|---|---|
| `CLOSED` | All calls pass through | -> `OPEN` after 5 consecutive failures |
| `OPEN` | All calls blocked immediately | -> `HALF_OPEN` after 30 seconds |
| `HALF_OPEN` | Single probe call allowed | -> `CLOSED` on success, -> `OPEN` on failure |

#### Rate Limiting

Per-session sliding window rate limiter: **10 messages per 60-second window**. Implemented using Redis sorted sets. If Redis is unavailable, calls are allowed (fail-open policy).

### REST Endpoints

**GET /health** -- Health check endpoint.

```json
{
  "status": "ok",
  "service": "ai-agent",
  "uptime_seconds": 3600.15
}
```

**GET /metrics** -- Prometheus-format metrics.

```
ai_agent_uptime_seconds 3600.15
ai_agent_messages_processed_total 142
ai_agent_tool_calls_total 87
ai_agent_active_connections 3
ai_agent_errors_total 2
ai_agent_model_calls_total 156
```

---

## Developer Guide

### Local Development Setup

**Step 1: Clone and navigate to the project.**

```bash
git clone <repository-url>
cd llm_agentic_chatbot
```

**Step 2: Create and activate a virtual environment.**

```bash
python3.11 -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows
```

**Step 3: Install dependencies.**

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Step 4: Install pre-commit hooks.**

```bash
pip install pre-commit
pre-commit install
```

**Step 5: Set up environment variables.**

```bash
cp .env.example .env
```

Edit `.env` with your values. At minimum you need:

```
MODEL_BACKEND=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
BACKEND_URL=http://localhost:3001
AI_SERVICE_KEY=$(openssl rand -hex 32)
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
```

For local development without Anthropic API credits, use Ollama:

```
MODEL_BACKEND=ollama
OLLAMA_BASE_URL=http://localhost:11434
```

**Step 6: Start Redis.**

```bash
# Option A: Local Redis
redis-server

# Option B: Docker Redis
docker run -d --name derlg-redis -p 6379:6379 redis:7-alpine
```

**Step 7: Start the development server.**

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The `--reload` flag enables hot-reloading. File changes in the project directory automatically restart the server.

**Step 8: Verify the service is running.**

```bash
curl http://localhost:8000/health
# Expected: {"status":"ok","service":"ai-agent","uptime_seconds":...}
```

### Docker Development Workflow

**Starting the stack:**

```bash
docker-compose up --build
```

This builds the AI agent from `Dockerfile.dev` and starts Redis alongside it. The development Dockerfile uses `uvicorn --reload` so code changes take effect immediately via the volume mount.

**Viewing logs:**

```bash
# All services
docker-compose logs -f

# AI agent only
docker-compose logs -f ai-agent

# Redis only
docker-compose logs -f redis
```

**Running commands inside the container:**

```bash
# Open a shell
docker-compose exec ai-agent bash

# Run tests inside the container
docker-compose exec ai-agent bash -c "SKIP_SETTINGS_INIT=1 pytest"

# Check Python version
docker-compose exec ai-agent python --version

# Inspect Redis
docker-compose exec redis redis-cli
```

**Rebuilding after dependency changes:**

```bash
docker-compose up --build
```

Always rebuild after modifying `requirements.txt`.

**Stopping the stack:**

```bash
# Stop and keep volumes
docker-compose down

# Stop and remove volumes (clears Redis data)
docker-compose down -v
```

**Useful Redis CLI commands for debugging:**

```bash
docker-compose exec redis redis-cli

# List all session keys
KEYS session:*

# Inspect a session
GET session:<session-id>

# Check rate limit state
ZRANGE rate_limit:<session-id> 0 -1 WITHSCORES

# Monitor all Redis commands in real-time
MONITOR

# Check pub/sub channels
PUBSUB CHANNELS payment_events:*
```

### Testing Procedures

**Test environment:** Tests use `SKIP_SETTINGS_INIT=1` to bypass environment variable validation. A `.env.test` file provides test-safe defaults.

**Test categories:**

| Category | Directory | Markers | Description |
|---|---|---|---|
| Unit | `tests/unit/` | `@pytest.mark.unit` | Isolated tests with mocked dependencies |
| Integration | `tests/integration/` | `@pytest.mark.integration` | Tests involving multiple components |
| Property | `tests/property/` | `@pytest.mark.property` | Hypothesis-based property tests |

**Running specific test suites:**

```bash
# All tests with verbose output
SKIP_SETTINGS_INIT=1 pytest -v

# Unit tests only
SKIP_SETTINGS_INIT=1 pytest tests/unit/ -v

# Single test file
SKIP_SETTINGS_INIT=1 pytest tests/unit/test_tool_schemas.py -v

# Single test function
SKIP_SETTINGS_INIT=1 pytest tests/unit/test_state.py::test_default_state_is_discovery -v

# With coverage report
SKIP_SETTINGS_INIT=1 pytest --cov=agent --cov=api --cov=utils --cov-report=term-missing

# With coverage HTML report
SKIP_SETTINGS_INIT=1 pytest --cov=agent --cov=api --cov=utils --cov-report=html
# Open htmlcov/index.html in browser
```

**Writing new tests:**

1. Place unit tests in `tests/unit/test_<module>.py`.
2. Use the shared fixtures from `tests/conftest.py` (e.g. `make_session`, `make_model_response`).
3. Mark your tests with the appropriate marker: `@pytest.mark.unit`, `@pytest.mark.integration`, or `@pytest.mark.property`.
4. Follow the Arrange-Act-Assert pattern.
5. Use `unittest.mock.AsyncMock` for async dependencies.

**Property-based testing with Hypothesis:**

Property tests in `tests/property/` use the Hypothesis library to generate random inputs. The `test_state_serialization.py` file verifies that `ConversationState` can round-trip through JSON serialization with any valid input.

### Debugging Techniques

**Structured log inspection:**

The agent uses `structlog` for all logging. Set `LOG_LEVEL=debug` in your `.env` to see detailed processing information. Key log events to watch for:

| Log Event | Module | What It Means |
|---|---|---|
| `agent_loop_iteration` | agent/core.py | Each iteration of the tool-calling loop |
| `graph_call_llm` | agent/graph.py | LLM call from the LangGraph node |
| `graph_turn_complete` | agent/graph.py | Full turn completed with response type |
| `tool_execution_started` | agent/tools/executor.py | Tool calls dispatched |
| `tool_executed` | agent/tools/executor.py | Individual tool call completed |
| `tool_timeout` | agent/tools/executor.py | Tool call exceeded 15-second timeout |
| `circuit_breaker_opened` | utils/circuit_breaker.py | Backend deemed unhealthy |
| `session_saved` | agent/session/manager.py | Session persisted to Redis |
| `session_loaded` | agent/session/manager.py | Session loaded from Redis |
| `anthropic_api_call` | agent/models/anthropic.py | LLM API call with token usage and latency |
| `rate_limit_exceeded` | utils/rate_limiter.py | User hit the rate limit |
| `payment_confirmed_event` | api/payment_listener.py | Payment success via pub/sub |
| `websocket_connected` | api/websocket.py | New WebSocket connection |
| `websocket_disconnected` | api/websocket.py | WebSocket connection closed |

**WebSocket testing with wscat:**

```bash
# Install wscat
npm install -g wscat

# Connect to the agent
wscat -c ws://localhost:8000/ws/550e8400-e29b-41d4-a716-446655440000

# Send auth message
> {"type": "auth", "user_id": "test-user-123", "language": "EN"}

# Send a message
> {"type": "user_message", "content": "I want to visit Angkor Wat"}
```

**Inspecting session state:**

```bash
# Via Redis CLI
redis-cli GET session:550e8400-e29b-41d4-a716-446655440000 | python -m json.tool
```

**Monitoring Anthropic API usage:**

Check the `anthropic_api_call` log events for `input_tokens`, `output_tokens`, and `latency_ms`. This helps track API costs and response times.

**Using Ollama for free local testing:**

```bash
# Install Ollama (https://ollama.ai)
ollama pull llama3.1:8b

# Set environment
MODEL_BACKEND=ollama
OLLAMA_BASE_URL=http://localhost:11434
```

Note: Ollama models have limited tool-calling capability compared to Claude. Use Anthropic for full-fidelity testing.

### Troubleshooting Guide

**Service fails to start with CONFIGURATION ERROR:**

```
CONFIGURATION ERROR: Invalid environment variables
```

This means one or more required environment variables are missing or invalid. The error output lists each field with a specific message. Common fixes:

- Copy `.env.example` to `.env` and fill in all required values.
- Ensure `AI_SERVICE_KEY` is at least 32 characters: `openssl rand -hex 32`.
- Ensure `MODEL_BACKEND` is exactly `anthropic` or `ollama`.
- Ensure `BACKEND_URL` has no trailing slash.

**Redis connection failed:**

```
redis_connection_failed  url=localhost:6379  error=...
```

The service starts without Redis but sessions will not persist. To fix:
- Verify Redis is running: `redis-cli ping` should return `PONG`.
- Check `REDIS_URL` in `.env` matches your Redis instance.
- If using Docker: ensure the Redis container is running and healthy.

**WebSocket closes immediately with code 4000:**

The session ID in the URL is not a valid UUID. Use a proper UUID v4.

**WebSocket closes with code 4002 (auth timeout):**

The client did not send the auth message within 30 seconds. Ensure the client sends `{"type": "auth", ...}` immediately after the connection opens.

**Tool calls returning "Backend unavailable":**

The circuit breaker has opened after 5 consecutive backend failures. Check:
- Is the NestJS backend running at the configured `BACKEND_URL`?
- Is `AI_SERVICE_KEY` correct and matching the backend's expected key?
- Check backend logs for errors.

The circuit breaker will automatically try again after 30 seconds.

**Agent stuck in a tool loop:**

The agent has a hard cap of 5 tool-call iterations per turn. If this limit is reached, the agent sends a fallback message. This can indicate the LLM is unable to produce a final text response from the tool results. Check `agent_max_loops_reached` in logs.

**Tests failing with import errors:**

Ensure `SKIP_SETTINGS_INIT=1` is set. Without it, Pydantic tries to validate environment variables during import, which fails in test environments.

### Common Issues and Solutions

| Issue | Cause | Solution |
|---|---|---|
| `ModuleNotFoundError` on import | Dependencies not installed | Run `pip install -r requirements.txt` |
| `SKIP_SETTINGS_INIT` not working | Environment variable not exported | Use `SKIP_SETTINGS_INIT=1 pytest` (inline) |
| `ConnectionRefusedError` to Redis | Redis not running | Start Redis: `redis-server` or `docker-compose up redis` |
| Anthropic `AuthenticationError` | Invalid API key | Verify `ANTHROPIC_API_KEY` in `.env` |
| Anthropic `RateLimitError` | Too many API requests | Wait and retry; consider using Ollama for dev |
| `httpx.ConnectError` to backend | NestJS backend not running | Start the backend at `BACKEND_URL` |
| Session not persisting | Redis connection lost | Check `redis_connection_failed` logs; verify Redis health |
| Booking hold expired unexpectedly | 15-minute TTL passed | This is expected behavior; create a new booking |
| Payment events not received | Pub/sub not connected | Check `payment_listener_started` log; verify Redis connection |
| Hot-reload not working in Docker | Volume mount issue | Ensure `docker-compose.yml` mounts `.:/app` |
| `asyncio` warnings in tests | Missing `asyncio_mode` setting | Verify `pytest.ini` has `asyncio_mode = auto` |
| Ollama returning empty tool calls | Model limitation | Switch to `MODEL_BACKEND=anthropic` for tool-calling tests |
| CORS errors from frontend | Origin not allowed | Add frontend origin to CORS `allow_origins` list in `main.py` |

---

## Architecture Documentation

### System Architecture Diagram

```
+------------------+          +------------------------+          +-------------------+
|                  |          |                        |          |                   |
|   Next.js        | WebSocket|   FastAPI AI Agent      |  httpx   |   NestJS Backend  |
|   Frontend       |--------->|                        |--------->|                   |
|   (Vercel)       |<---------|   Port 8000            |<---------|   Port 3001       |
|                  |          |                        |          |                   |
+------------------+          +---+----+----+----------+          +---+---+-----------+
                                  |    |    |                         |   |
                                  |    |    |                         |   |
                            +-----+    |    +------+                  |   |
                            |          |           |                  |   |
                     +------v---+  +---v----+  +---v--------+  +-----v---v-------+
                     | Redis    |  | Claude |  | Ollama     |  | Supabase        |
                     | (Upstash)|  | API    |  | (local dev)|  | PostgreSQL      |
                     +----------+  +--------+  +------------+  +-----------------+
                     - Sessions                                 - Users, Trips
                     - Rate limits                              - Bookings
                     - Pub/Sub                                  - Payments
                     - Weather cache                            - Hotels, Guides
```

**Service communication matrix:**

| From | To | Protocol | Auth |
|---|---|---|---|
| Frontend | AI Agent | WebSocket | Session-based (auth message) |
| AI Agent | NestJS Backend | HTTP (httpx) | `X-Service-Key` header |
| AI Agent | Anthropic API | HTTPS | `ANTHROPIC_API_KEY` |
| AI Agent | Redis | TCP | Connection string credentials |
| NestJS Backend | Supabase | TCP | Service role key |
| NestJS Webhook | Redis Pub/Sub | TCP | Publishes payment events |

**LangGraph state machine (3-node graph):**

```
                        +----------+
                        |  START   |
                        +----+-----+
                             |
                             v
                     +-------+--------+
          +--------->|   call_llm     |
          |          +-------+--------+
          |                  |
          |         (route_after_llm)
          |          /               \
          |   tool_use            end_turn
          |        /                   \
          |       v                     v
    +-----+------+---+       +---------+---------+
    | execute_tools   |       | format_response   |
    +-----------------+       +---------+---------+
    - Parallel httpx calls              |
    - Circuit breaker guard             v
    - Side effect application       +---+---+
    - Max 5 iterations              |  END  |
                                    +-------+
```

### Design Decisions and Rationale

**1. Imperative loop AND LangGraph graph -- why both?**

The codebase provides two implementations of the agent loop: `agent/core.py` (imperative `while` loop) and `agent/graph.py` (LangGraph state machine). Both produce identical behavior. The imperative loop is simpler to debug and was built first. The LangGraph version enables future features like checkpointing, branching, and human-in-the-loop interrupts. The WebSocket handler currently uses the imperative loop; switching to the graph is a configuration change.

**2. Abstract ModelClient with factory pattern.**

The `ModelClient` ABC in `agent/models/client.py` defines a common interface. The factory `get_model_client()` returns either `AnthropicClient` or `OllamaClient` based on `MODEL_BACKEND`. This allows developers to test locally with Ollama (free, no API key) and deploy with Claude (full tool-calling fidelity) without touching application code.

**3. Tool schemas as Python dicts, not Pydantic models.**

Anthropic's tool-calling API expects plain JSON-Schema dicts. Wrapping each schema in a Pydantic model would add indirection without benefit since the schemas are passed directly to the API. The `ALL_TOOLS` list in `agent/tools/schemas.py` is the single source of truth.

**4. Parallel tool execution with circuit breaker.**

The `ToolExecutor` runs multiple tool calls concurrently via `asyncio.gather`. A shared `CircuitBreaker` protects against cascading failures when the NestJS backend goes down. After 5 consecutive failures the breaker opens and immediately rejects requests for 30 seconds, then allows a single probe. This prevents the agent from hanging on repeated timeouts.

**5. Redis for session storage (not PostgreSQL).**

Sessions contain conversation history that can grow to hundreds of messages. Redis provides sub-millisecond reads and writes with automatic TTL expiry. The 7-day TTL ensures stale sessions are cleaned up without manual garbage collection. If Redis is down, the service degrades gracefully (sessions are not persisted, but the agent still responds).

**6. Redis pub/sub for payment events (not polling).**

When the NestJS backend receives a Stripe webhook confirming payment, it publishes to the Redis channel `payment_events:{user_id}`. The AI agent's background listener receives this in real-time and pushes a `payment_confirmed` message to the frontend over WebSocket. This eliminates polling and provides instant payment confirmation.

**7. Pydantic BaseSettings for configuration.**

All environment variables are validated at startup by the `Settings` class. Invalid configuration causes the process to exit immediately with clear error messages instead of failing at runtime. Field validators enforce business rules like minimum key length and conditional requirements (e.g. `ANTHROPIC_API_KEY` required only when `MODEL_BACKEND=anthropic`).

**8. Input sanitization at two levels.**

User messages are sanitized by `sanitize_user_input()` (removes null bytes, control characters, enforces length limit). Tool inputs are further sanitized by `validate_tool_input()` before being sent to the backend. This prevents injection attacks at both the conversation and tool-call layers.

**9. Sliding window rate limiter.**

A per-session rate limiter (10 messages per 60 seconds) prevents abuse without blocking legitimate rapid conversations. The sliding window implementation via Redis sorted sets provides accurate, distributed rate limiting. If Redis is unavailable, the limiter fails open to avoid blocking users.

**10. Prompt builder with stage-specific templates.**

Rather than a single monolithic system prompt, the `build_system_prompt()` function assembles a prompt from: the base personality prompt, session context (IDs, state, selections), a stage-specific instruction template, and language instructions. This keeps each template focused and maintainable while providing the LLM with precise behavioral guidance for its current stage.

### LangGraph State Machine Flow

The LangGraph implementation in `agent/graph.py` defines a compiled state machine with three nodes.

**GraphState (TypedDict):**

| Field | Type | Purpose |
|---|---|---|
| `session` | ConversationState | The full session state, mutated in-place |
| `response` | ModelResponse or None | Latest LLM response |
| `tool_results_collected` | list[dict] | All tool results accumulated across iterations |
| `formatted_output` | dict or None | Final formatted message for the frontend |
| `loop_count` | int | Current iteration count (max 5) |

**Node: call_llm**

1. Retrieves model client for the session's language.
2. Builds system prompt from session state.
3. Sends last 20 messages to the LLM with all 20 tool definitions.
4. Returns `response` to the graph state.

**Node: execute_tools**

1. Extracts `tool_use` blocks from the LLM response.
2. Appends the assistant message (with tool_use blocks) to session history.
3. Runs all tool calls in parallel via `ToolExecutor`.
4. Applies session side effects (state transitions, storing IDs).
5. Appends `tool_result` messages to session history.
6. Increments `loop_count` and returns updated state.

**Node: format_response**

1. Extracts text from the LLM response.
2. Appends the assistant message to session history.
3. Analyzes tool results and session state to choose a structured message type.
4. Returns `formatted_output` for the frontend.

**Routing: route_after_llm**

- If `stop_reason == "tool_use"` and `loop_count < 5`: route to `execute_tools`.
- Otherwise: route to `format_response`.

**Compilation:**

The graph is compiled at module load time into a singleton `agent_graph`. The entry point `run_agent_graph(session, user_text)` appends the user message, invokes the graph, and returns the formatted output.

### Tool Execution Pipeline

```
    LLM Response
        |
        | (contains tool_use blocks)
        v
+------------------+
| ToolExecutor     |
|  .execute_tools_ |
|   _parallel()    |
+--------+---------+
         |
         | (for each tool_use block, concurrently)
         v
+--------+---------+
| 1. Lookup handler|  <-- TOOL_DISPATCH[tool_name]
|    in registry   |      (20 handlers mapped)
+--------+---------+
         |
+--------+---------+
| 2. Circuit       |  <-- CircuitBreaker.can_execute()
|    breaker check |      CLOSED=pass, OPEN=reject, HALF_OPEN=probe
+--------+---------+
         |
+--------+---------+
| 3. Sanitize      |  <-- validate_tool_input(tool_name, tool_input)
|    inputs        |      Strips control chars, enforces length limits
+--------+---------+
         |
+--------+---------+
| 4. Execute       |  <-- handler(client, backend_url, service_key, language, **input)
|    handler       |      HTTP call to NestJS backend (15s timeout)
+--------+---------+
         |
  success:                              failure:
  circuit_breaker.record_success()      circuit_breaker.record_failure()
  return tool_result                    return tool_result with is_error=true
         |
         v
+--------+---------+
| 5. Side effects  |  <-- apply_session_side_effects(session, tool_name, result)
|    applied       |      State transitions, ID storage
+--------+---------+
         |
         v
    tool_result appended to messages
    (loop back to LLM or format response)
```

**Handler function signature:**

All 20 tool handlers follow an identical signature:

```python
async def handle_<tool>(
    client: httpx.AsyncClient,
    backend_url: str,
    service_key: str,
    language: str,
    **kwargs: Any,
) -> dict[str, Any]
```

**NestJS backend route mapping:**

| Tool | HTTP Method | Backend Route |
|---|---|---|
| `getTripSuggestions` | POST | `/v1/ai-tools/trip-suggestions` |
| `getTripItinerary` | GET | `/v1/ai-tools/trips/{trip_id}/itinerary` |
| `getTripImages` | GET | `/v1/ai-tools/trips/{trip_id}/images` |
| `getHotelDetails` | GET | `/v1/ai-tools/hotels/{hotel_id}` |
| `getWeatherForecast` | GET | `/v1/ai-tools/weather?destination=...&date=...` |
| `compareTrips` | POST | `/v1/ai-tools/trips/compare` |
| `calculateCustomTrip` | POST | `/v1/ai-tools/trips/calculate-custom` |
| `customizeTrip` | POST | `/v1/ai-tools/trips/customize` |
| `applyDiscountCode` | POST | `/v1/ai-tools/bookings/{booking_id}/discount` |
| `validateUserDetails` | POST | `/v1/ai-tools/bookings/validate` |
| `createBooking` | POST | `/v1/ai-tools/bookings` |
| `generatePaymentQR` | POST | `/v1/ai-tools/payments/generate-qr` |
| `checkPaymentStatus` | GET | `/v1/ai-tools/payments/{payment_intent_id}/status` |
| `cancelBooking` | POST | `/v1/ai-tools/bookings/{booking_id}/cancel` |
| `modifyBooking` | PATCH | `/v1/ai-tools/bookings/{booking_id}` |
| `getBookingDetails` | GET | `/v1/ai-tools/bookings/{booking_id}` |
| `getPlaces` | GET | `/v1/ai-tools/places?category=...&language=...` |
| `getUpcomingFestivals` | GET | `/v1/ai-tools/festivals?start_date=...&end_date=...` |
| `estimateBudget` | POST | `/v1/ai-tools/budget/estimate` |
| `getCurrencyRates` | GET | `/v1/ai-tools/currency?from=...&to=...` |

### Session Management Strategy

**Storage:** Redis with key format `session:{session_id}`.

**Serialization:** The `ConversationState` Pydantic model uses `model_dump_json()` for serialization and `model_validate_json()` for deserialization. All fields are JSON-serializable (including datetime fields via ISO 8601 strings).

**TTL:** 7 days (604,800 seconds). Refreshed on every save.

**Lifecycle:**

```
1. WebSocket connects
       |
2. SessionManager.load(session_id)
       |
   found?  ----YES----> Restore session, send "resume" message
       |
      NO
       |
3. Create new ConversationState(session_id, user_id, language)
       |
4. SessionManager.save(session) -- starts 7-day TTL
       |
5. Message loop (each turn):
   a. Agent processes message
   b. SessionManager.save(session) -- refreshes TTL
       |
6. WebSocket disconnects
       |
7. Final SessionManager.save(session)
       |
8. Session persists in Redis for up to 7 more days
```

**Booking hold expiry:**

When a session is loaded and the state is `PAYMENT` with `reserved_until` in the past:
1. State is rolled back to `BOOKING`.
2. `booking_id`, `payment_intent_id`, and `reserved_until` are cleared.
3. A system message `"System: The 15-minute booking hold has expired."` is injected.
4. The updated session is saved immediately.

**Graceful degradation:**

If Redis is unavailable:
- `SessionManager.save()` logs a warning and returns silently.
- `SessionManager.load()` returns `None`, causing a new session to be created.
- The agent continues to function but sessions will not persist across connections.

### Multi-Language Support Approach

The AI agent supports three languages: English (EN), Khmer (KH), and Simplified Chinese (ZH).

**How language is set:**

1. The client specifies `language` in the WebSocket auth message.
2. The value is validated against `SUPPORTED_LANGUAGES = {"EN", "KH", "ZH"}`.
3. If invalid or missing, defaults to `"EN"`.
4. Stored in `ConversationState.preferred_language`.

**Where language is applied:**

| Component | How Language Is Used |
|---|---|
| System prompts | `LANGUAGE_INSTRUCTIONS` dict provides language-specific behavioral instructions |
| Tool calls | `Accept-Language` HTTP header sent to NestJS backend |
| Tool schemas | `language` parameter in applicable schemas (suggestions, places, festivals) |
| Welcome messages | `WELCOME_MESSAGES` dict keyed by language code |
| Resume messages | `RESUME_MESSAGES` dict keyed by language code |

**Language instruction templates:**

- **EN:** "Respond in English. Use clear, friendly language appropriate for international travelers."
- **KH:** "Respond in Khmer. Use polite, natural Khmer appropriate for local travelers. Include English for proper nouns and technical terms when needed."
- **ZH:** "Respond in Simplified Chinese. Use polite, natural Chinese appropriate for Chinese travelers. Include English for proper nouns when needed."

**Backend localization:** The NestJS backend localizes trip names, descriptions, and place information based on the `Accept-Language` header. The AI agent passes the session language as this header in every tool handler call.

**Known limitation:** Claude's Khmer language quality is limited compared to English and Chinese. For Phase 1, this is considered acceptable. Improved Khmer support may require prompt engineering or fine-tuning in later phases.

---

## License

Proprietary. All rights reserved by DerLg.com.
