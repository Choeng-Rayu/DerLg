# DerLg.com — LLM + Agentic Tools Architecture (Python AI Agent)

**Service:** `apps/ai-agent`  
**Language:** Python 3.11+  
**LLM:** Claude Sonnet 4.5 via Anthropic API (Phase 1) → Ollama (Phase 2)  
**Framework:** FastAPI + LangGraph  
**Deploy:** Railway (separate service from backend)

---

## 1. Architecture Philosophy

The AI agent is a **purpose-built, stateful booking concierge**. It is not a general-purpose assistant. Every decision in its design optimizes for one goal: converting a natural language conversation into a confirmed, paid booking — reliably, every time.

Core principles:
- **Never invent data.** Every fact (price, hotel name, availability) comes from a tool call to the NestJS backend.
- **State is everything.** The agent always knows which of 7 stages the conversation is in, and it behaves differently at each one.
- **Tools are controlled side effects.** When the agent calls a tool, the backend validates, executes, and returns structured results. The AI just orchestrates.
- **The LLM is swappable.** Claude API today, local Ollama model tomorrow — the agent code doesn't change.

---

## 2. Complete Folder & File Architecture

```
apps/ai-agent/
│
├── main.py                          ← FastAPI app: WebSocket + health endpoints
├── requirements.txt
├── Dockerfile
├── .env
│
├── agent/
│   │
│   ├── core/
│   │   ├── agent.py                 ← Main agent entry point: run_agent()
│   │   ├── graph.py                 ← LangGraph state machine definition
│   │   └── transitions.py          ← State transition logic
│   │
│   ├── states/
│   │   ├── __init__.py
│   │   ├── conversation_state.py    ← ConversationState Pydantic model
│   │   └── agent_state.py           ← AgentState enum (7 stages)
│   │
│   ├── model/
│   │   ├── __init__.py
│   │   ├── base_client.py           ← Abstract ModelClient interface
│   │   ├── anthropic_client.py      ← Claude API implementation
│   │   ├── ollama_client.py         ← Ollama implementation (Phase 2)
│   │   └── schema_converter.py      ← Claude tool schema → OpenAI format converter
│   │
│   ├── prompts/
│   │   ├── __init__.py
│   │   ├── builder.py               ← Dynamic system prompt assembler
│   │   ├── base.py                  ← Core identity, absolute rules, personality
│   │   ├── context.py               ← Injects current session context into prompt
│   │   └── stages/
│   │       ├── discovery.py         ← Stage 1 instructions
│   │       ├── suggestion.py        ← Stage 2 instructions
│   │       ├── exploration.py       ← Stage 3 instructions
│   │       ├── customization.py     ← Stage 4 instructions
│   │       ├── booking.py           ← Stage 5 instructions (3-step sub-flow)
│   │       ├── payment.py           ← Stage 6 instructions
│   │       └── post_booking.py      ← Stage 7 instructions
│   │
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── schemas.py               ← All 20 tool JSON schemas for Claude API
│   │   ├── executor.py              ← Dispatches tool calls to NestJS backend
│   │   └── handlers/
│   │       ├── trip_tools.py        ← getTripSuggestions, getItinerary, compareTrips
│   │       ├── booking_tools.py     ← validateUser, createBooking, cancelBooking
│   │       ├── payment_tools.py     ← generateQR, checkPaymentStatus
│   │       ├── explore_tools.py     ← getPlaces, getWeather, getFestivals
│   │       └── budget_tools.py      ← estimateBudget, calculateCustomTrip
│   │
│   ├── formatters/
│   │   ├── __init__.py
│   │   ├── response_formatter.py    ← Detects what structured message to send
│   │   └── message_types.py         ← Pydantic models for each message type
│   │
│   └── session/
│       ├── __init__.py
│       ├── redis_session.py         ← serialize/deserialize ConversationState
│       └── session_manager.py       ← load, save, expire, recover sessions
│
├── api/
│   ├── __init__.py
│   ├── websocket.py                 ← WebSocket endpoint: /ws/{session_id}
│   ├── health.py                    ← GET /health
│   └── middleware.py                ← Request logging, error handling
│
├── config/
│   ├── settings.py                  ← Pydantic BaseSettings (all .env vars)
│   └── constants.py                 ← Stage names, tool names, TTL values
│
└── tests/
    ├── test_agent.py
    ├── test_tools.py
    ├── test_state_transitions.py
    └── fixtures/
        └── sample_conversations.json
```

---

## 3. LangGraph State Machine Architecture

LangGraph represents the booking journey as a **directed graph** where:
- **Nodes** = processing actions (call Claude, execute tools, update state)
- **Edges** = transitions (conditional routing based on state)
- **State** = the `ConversationState` object that flows through the graph

```python
# agent/core/graph.py

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.redis import RedisSaver
from agent.states.conversation_state import ConversationState
from agent.core.agent import call_llm, execute_tools, should_continue

# Create the graph
builder = StateGraph(ConversationState)

# ── NODES (each node is an async function) ────────────────────

builder.add_node("call_llm",        call_llm)
# Calls Claude API with current messages + system prompt + tools
# Returns: updated messages + stop_reason

builder.add_node("execute_tools",   execute_tools)
# Executes all tool_use blocks from Claude's response
# Calls NestJS /v1/ai-tools/ endpoints
# Returns: tool_result messages appended to conversation

builder.add_node("format_response", format_response)
# Analyzes the final AI text response
# Determines which frontend message type to use
# Returns: structured frontend-ready message

# ── EDGES (define flow between nodes) ─────────────────────────

builder.set_entry_point("call_llm")

# After call_llm: check if Claude wants to use tools or is done
builder.add_conditional_edges(
    "call_llm",
    should_continue,   # returns "execute_tools" or "format_response"
    {
        "execute_tools":   "execute_tools",
        "format_response": "format_response"
    }
)

# After tools: always go back to call_llm (loop until done)
builder.add_edge("execute_tools", "call_llm")

# After formatting: done
builder.add_edge("format_response", END)

# ── CHECKPOINTING (session persistence) ──────────────────────

# LangGraph persists state to Redis after each node
# This means if the server crashes, the conversation resumes
checkpointer = RedisSaver(redis_url=settings.REDIS_URL)
graph = builder.compile(checkpointer=checkpointer)
```

### Graph Execution Visualization

```
User message arrives
        │
        ▼
   [call_llm]
   Claude processes message
   with current state + system prompt
        │
        ├── stop_reason = "tool_use"
        │         │
        │         ▼
        │   [execute_tools]
        │   Call NestJS /v1/ai-tools/...
        │   Get real data back
        │         │
        │         └──────────────────┐
        │                            │ Loop until
        │         ┌──────────────────┘ no more tool calls
        │         ▼
        │   [call_llm] (again, with tool results)
        │
        └── stop_reason = "end_turn"
                  │
                  ▼
          [format_response]
          Determine message type
          (text / trip_cards / payment_qr / etc.)
                  │
                  ▼
              [END]
          Send to WebSocket
```

---

## 4. Model Architecture (Swappable LLM)

### 4.1 Abstract Interface

```python
# agent/model/base_client.py

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

@dataclass
class ContentBlock:
    type: str          # "text" | "tool_use"
    text: str | None = None         # for text blocks
    id: str | None = None           # for tool_use blocks
    name: str | None = None         # tool name
    input: dict | None = None       # tool arguments

@dataclass
class ModelResponse:
    stop_reason: str               # "tool_use" | "end_turn"
    content: list[ContentBlock]

class ModelClient(ABC):
    @abstractmethod
    async def create_message(
        self,
        system: str,
        messages: list[dict],
        tools: list[dict],
        max_tokens: int = 2048
    ) -> ModelResponse:
        """All model backends implement this single method."""
        pass
```

### 4.2 Anthropic Claude Client (Phase 1 — Active)

```python
# agent/model/anthropic_client.py

import anthropic
from agent.model.base_client import ModelClient, ModelResponse, ContentBlock

class AnthropicClient(ModelClient):

    def __init__(self):
        self.client = anthropic.AsyncAnthropic()
        self.model = settings.CLAUDE_MODEL  # "claude-sonnet-4-5-20251001"

    async def create_message(self, system, messages, tools, max_tokens=2048):
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
            tools=tools
        )

        content = []
        for block in response.content:
            if block.type == "text":
                content.append(ContentBlock(type="text", text=block.text))
            elif block.type == "tool_use":
                content.append(ContentBlock(
                    type="tool_use",
                    id=block.id,
                    name=block.name,
                    input=block.input
                ))

        return ModelResponse(
            stop_reason=response.stop_reason,
            content=content
        )
```

### 4.3 Ollama Client (Phase 2 — Future)

```python
# agent/model/ollama_client.py

import httpx, json
from agent.model.base_client import ModelClient, ModelResponse, ContentBlock
from agent.model.schema_converter import claude_tools_to_openai

class OllamaClient(ModelClient):

    def __init__(self):
        self.model = settings.OLLAMA_MODEL        # "qwen2.5:14b"
        self.base_url = settings.OLLAMA_BASE_URL  # "http://localhost:11434"

    async def create_message(self, system, messages, tools, max_tokens=2048):
        # Convert schemas: Claude format → OpenAI format (Ollama uses OpenAI-compatible API)
        openai_tools = claude_tools_to_openai(tools)
        openai_messages = [{"role": "system", "content": system}] + messages

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self.base_url}/v1/chat/completions",
                json={
                    "model": self.model,
                    "messages": openai_messages,
                    "tools": openai_tools,
                    "max_tokens": max_tokens,
                    "stream": False
                }
            )
            resp.raise_for_status()
            data = resp.json()

        choice = data["choices"][0]
        message = choice["message"]
        content = []

        if message.get("tool_calls"):
            for tc in message["tool_calls"]:
                content.append(ContentBlock(
                    type="tool_use",
                    id=tc["id"],
                    name=tc["function"]["name"],
                    input=json.loads(tc["function"]["arguments"])
                ))
            return ModelResponse(stop_reason="tool_use", content=content)
        else:
            content.append(ContentBlock(type="text", text=message["content"]))
            return ModelResponse(stop_reason="end_turn", content=content)
```

### 4.4 Model Selection Factory

```python
# config/settings.py

def get_model_client(language: str = "EN") -> ModelClient:
    backend = settings.MODEL_BACKEND  # "anthropic" | "ollama"

    # Khmer always falls back to Claude API (local models have poor Khmer support)
    if language == "KH" or backend == "anthropic":
        return AnthropicClient()

    if backend == "ollama":
        return OllamaClient()

    raise ValueError(f"Unknown MODEL_BACKEND: {backend}")
```

---

## 5. Tool Schema Architecture

All 20 tools are defined as JSON schemas matching the Anthropic tool calling format. They are stored in `agent/tools/schemas.py` and passed to the Claude API in the `tools` parameter on every call.

```python
# agent/tools/schemas.py  (excerpt — showing schema design pattern)

TRAVEL_TOOLS = [

  # ── DISCOVERY TOOLS ─────────────────────────────────────────────

  {
    "name": "getTripSuggestions",
    "description": (
      "Search for trip packages matching user preferences. "
      "ONLY call this after confirming ALL 6 required fields: "
      "mood, environment, duration_days, people_count, budget_usd, departure_city. "
      "Never call with missing or assumed values."
    ),
    "input_schema": {
      "type": "object",
      "properties": {
        "mood": {
          "type": "string",
          "enum": ["stressed", "adventurous", "romantic", "curious", "family"],
          "description": "Emotional state or trip vibe the user is looking for"
        },
        "environment": {
          "type": "string",
          "enum": ["MOUNTAIN", "BEACH", "CITY", "FOREST", "ISLAND", "TEMPLE"]
        },
        "duration_days": { "type": "integer", "minimum": 1, "maximum": 30 },
        "people_count":  { "type": "integer", "minimum": 1, "maximum": 100 },
        "budget_usd": {
          "type": "object",
          "properties": {
            "min": { "type": "number" },
            "max": { "type": "number" }
          },
          "required": ["min", "max"]
        },
        "departure_city": {
          "type": "string",
          "description": "City user is departing from, e.g. 'Phnom Penh'"
        },
        "language": {
          "type": "string",
          "enum": ["EN", "KH", "ZH"],
          "description": "Return results in this language"
        }
      },
      "required": ["mood", "environment", "duration_days",
                   "people_count", "budget_usd", "departure_city"]
    }
  },

  # ── BOOKING TOOLS ────────────────────────────────────────────────

  {
    "name": "createBooking",
    "description": (
      "Create a booking reservation with a 15-minute payment hold. "
      "MUST only be called after: "
      "(1) full booking summary was presented to user, "
      "(2) user explicitly confirmed 'yes book it', "
      "(3) customer_name, customer_phone, pickup_location are all collected and validated. "
      "The returned status is RESERVED, not CONFIRMED. Payment must complete to confirm."
    ),
    "input_schema": {
      "type": "object",
      "properties": {
        "user_id":            { "type": "string" },
        "trip_id":            { "type": "string" },
        "vehicle_id":         { "type": "string" },
        "hotel_room_id":      { "type": "string" },
        "guide_id":           { "type": "string" },
        "travel_date":        { "type": "string", "format": "date" },
        "end_date":           { "type": "string", "format": "date" },
        "people_count":       { "type": "integer", "minimum": 1 },
        "pickup_location":    { "type": "string" },
        "special_requests":   { "type": "string" },
        "customizations":     { "type": "array", "items": { "type": "string" } },
        "discount_code":      { "type": "string" },
        "loyalty_points_to_use": { "type": "integer", "minimum": 0 },
        "apply_student_discount": { "type": "boolean" },
        "customer_name":      { "type": "string" },
        "customer_phone":     { "type": "string" }
      },
      "required": ["user_id", "trip_id", "travel_date", "end_date",
                   "people_count", "pickup_location",
                   "customer_name", "customer_phone"]
    }
  },

  # ── PAYMENT TOOLS ────────────────────────────────────────────────

  {
    "name": "generatePaymentQR",
    "description": (
      "Generate a Stripe Payment Intent and QR code for the user to scan. "
      "Call immediately after createBooking() succeeds. "
      "Do NOT call again unless: (a) user says QR isn't working, "
      "or (b) the timer expired (check reserved_until vs current time)."
    ),
    "input_schema": {
      "type": "object",
      "properties": {
        "booking_id": { "type": "string" },
        "user_id":    { "type": "string" }
      },
      "required": ["booking_id", "user_id"]
    }
  },

  {
    "name": "checkPaymentStatus",
    "description": (
      "Check if a payment succeeded, is pending, or failed. "
      "Call this when the user asks 'did my payment go through?' "
      "or 'is my booking confirmed?'. NEVER guess the payment status."
    ),
    "input_schema": {
      "type": "object",
      "properties": {
        "payment_intent_id": { "type": "string" }
      },
      "required": ["payment_intent_id"]
    }
  },

  # ... 16 more tools following same pattern
]
```

---

## 6. Tool Executor Architecture

```python
# agent/tools/executor.py

import asyncio, httpx, json
from agent.states.conversation_state import ConversationState
from config.settings import settings

BACKEND_URL = settings.BACKEND_URL           # https://api.derlg.com/v1/ai-tools
SERVICE_KEY = settings.AI_SERVICE_KEY        # 64-char hex secret

# Complete tool dispatch table
TOOL_DISPATCH: dict[str, callable] = {
    # Discovery
    "getTripSuggestions":       _trip_suggest,
    "getTripItinerary":         _trip_itinerary,
    "getTripImages":            _trip_images,
    "getHotelDetails":          _hotel_details,
    "getWeatherForecast":       _weather,
    "compareTrips":             _compare_trips,
    # Customization
    "calculateCustomTrip":      _calculate_trip,
    "customizeTrip":            _customize_trip,
    "applyDiscountCode":        _apply_discount,
    # Validation
    "validateUserDetails":      _validate_user,
    # Booking
    "createBooking":            _create_booking,
    # Payment
    "generatePaymentQR":        _generate_qr,
    "checkPaymentStatus":       _check_payment,
    # Post-booking
    "cancelBooking":            _cancel_booking,
    "modifyBooking":            _modify_booking,
    # Explore
    "getPlaces":                _get_places,
    "getUpcomingFestivals":     _get_festivals,
    # Budget
    "estimateBudget":           _estimate_budget,
    # Currency
    "getCurrencyRates":         _get_currency,
}


async def execute_tools_parallel(
    tool_calls: list,            # list of ContentBlock (type=tool_use)
    session: ConversationState
) -> list[dict]:
    """
    Execute multiple tool calls in parallel.
    If user asks "show me hotel AND weather", both calls fire simultaneously.
    Total time = slowest single call, not sum of all.
    """
    tasks = [
        _execute_single_tool(call.name, call.input, call.id, session)
        for call in tool_calls
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    tool_results = []
    for call, result in zip(tool_calls, results):
        if isinstance(result, Exception):
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": call.id,
                "content": json.dumps({
                    "success": False,
                    "error": {
                        "code": "TOOL_EXECUTION_FAILED",
                        "message": "I couldn't complete that action. Please try again."
                    }
                })
            })
        else:
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": call.id,
                "content": json.dumps(result)
            })

    return tool_results


async def _execute_single_tool(
    name: str,
    input_data: dict,
    call_id: str,
    session: ConversationState
) -> dict:
    """Execute one tool call and apply any session side effects."""
    handler = TOOL_DISPATCH.get(name)
    if not handler:
        return {"success": False, "error": {"code": "UNKNOWN_TOOL", "message": f"Tool {name} not found"}}

    result = await handler(input_data, session)

    # Apply session side effects based on tool results
    _apply_session_side_effects(name, result, session)

    return result


def _apply_session_side_effects(tool_name: str, result: dict, session: ConversationState):
    """Mutate session state based on tool results."""
    if not result.get("success"):
        return

    data = result.get("data", {})

    match tool_name:
        case "getTripSuggestions":
            session.suggested_trip_ids = [t["id"] for t in data.get("trips", [])]

        case "createBooking":
            session.booking_id = data.get("booking_id")
            session.booking_ref = data.get("booking_ref")
            session.reserved_until = parse_datetime(data.get("reserved_until"))
            session.state = AgentState.PAYMENT   # auto-transition

        case "generatePaymentQR":
            session.payment_intent_id = data.get("payment_intent_id")

        case "checkPaymentStatus":
            if data.get("status") == "SUCCEEDED":
                session.payment_status = "CONFIRMED"
                session.state = AgentState.POST_BOOKING  # auto-transition

        case "cancelBooking":
            if data.get("cancelled"):
                session.booking_id = None
                session.booking_ref = None
                session.payment_intent_id = None
                session.state = AgentState.DISCOVERY
```

---

## 7. Tool Handler Pattern (HTTP calls to NestJS)

```python
# agent/tools/handlers/booking_tools.py

async def _create_booking(input_data: dict, session: ConversationState) -> dict:
    """POST /v1/ai-tools/bookings/create"""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{BACKEND_URL}/bookings/create",
            json={
                **input_data,
                "user_id": session.user_id,  # always from session, not from AI input
            },
            headers={
                "X-Service-Key": SERVICE_KEY,
                "Accept-Language": session.preferred_language
            }
        )

        if response.status_code == 200:
            return {"success": True, "data": response.json()["data"]}
        else:
            error = response.json().get("error", {})
            return {
                "success": False,
                "error": {
                    "code": error.get("code", "BOOKING_FAILED"),
                    "message": error.get("message", "Failed to create booking.")
                }
            }
```

---

## 8. Response Formatter Architecture

After Claude produces a final text response, the formatter decides what frontend message type to send:

```python
# agent/formatters/response_formatter.py

import re
from agent.formatters.message_types import (
    TextMessage, TripCardsMessage, QRPaymentMessage,
    BookingConfirmedMessage, WeatherMessage, BudgetEstimateMessage,
    ItineraryMessage, ImageGalleryMessage, ComparisonMessage,
    BookingSummaryMessage, ErrorMessage
)

async def format_response(ai_text: str, session: ConversationState,
                           last_tool_results: list[dict]) -> dict:
    """
    Analyze the AI response + recent tool results to determine
    which frontend message type to send.
    Priority: structured data from tools > plain text.
    """

    # Check recent tool results for structured data to render as cards
    for tool_result in last_tool_results:
        data = parse_tool_result(tool_result)

        if data.get("trips"):
            return TripCardsMessage(
                text=ai_text,
                trips=data["trips"]
            ).dict()

        if data.get("qr_code_url"):
            return QRPaymentMessage(
                text=ai_text,
                qr_code_url=data["qr_code_url"],
                amount_usd=data["amount_usd"],
                expires_at=data["expires_at"],
                booking_ref=data.get("booking_ref")
            ).dict()

        if data.get("status") == "SUCCEEDED" and session.state == AgentState.POST_BOOKING:
            return BookingConfirmedMessage(
                text=ai_text,
                booking_ref=session.booking_ref,
                trip_name=session.selected_trip_name
            ).dict()

        if data.get("forecast"):
            return WeatherMessage(
                text=ai_text,
                forecast=data["forecast"],
                destination=data.get("destination")
            ).dict()

        if data.get("itinerary"):
            return ItineraryMessage(
                text=ai_text,
                itinerary=data["itinerary"]
            ).dict()

        if data.get("total_estimate_usd"):
            return BudgetEstimateMessage(
                text=ai_text,
                estimate=data
            ).dict()

        if data.get("trips") and len(data.get("trips", [])) == 2:
            return ComparisonMessage(
                text=ai_text,
                trips=data["trips"]
            ).dict()

    # No structured data — plain text response
    return TextMessage(content=ai_text).dict()
```

---

## 9. Session Management Architecture

```python
# agent/session/redis_session.py

import json, redis.asyncio as redis
from datetime import datetime, timedelta
from agent.states.conversation_state import ConversationState
from config.constants import SESSION_TTL_SECONDS  # 7 * 24 * 3600 = 604800

class RedisSessionManager:

    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def load(self, session_id: str) -> ConversationState | None:
        raw = await self.redis.get(f"session:{session_id}")
        if not raw:
            return None
        data = json.loads(raw)
        session = ConversationState(**data)
        await self._check_and_recover(session)
        return session

    async def save(self, session: ConversationState) -> None:
        session.last_active = datetime.utcnow()
        await self.redis.setex(
            f"session:{session.session_id}",
            SESSION_TTL_SECONDS,          # Reset TTL on every message
            session.model_dump_json()
        )

    async def _check_and_recover(self, session: ConversationState):
        """
        Inspect session on load and fix any broken states.
        Called automatically every time a session is loaded.
        """
        if session.state == "PAYMENT" and session.reserved_until:
            if datetime.utcnow() > session.reserved_until:
                # Booking hold expired while user was away
                # Reset to BOOKING stage so they can re-confirm
                session.state = "BOOKING"
                session.booking_id = None
                session.payment_intent_id = None
                session.reserved_until = None
                # Add a system message so Claude knows to inform the user
                session.messages.append({
                    "role": "user",
                    "content": "__SYSTEM__: The user has returned. Their 15-minute booking "
                               "hold expired while they were away. Inform them warmly and "
                               "offer to re-reserve the same trip."
                })

    async def delete(self, session_id: str) -> None:
        await self.redis.delete(f"session:{session_id}")
```

---

## 10. WebSocket Server Architecture

```python
# api/websocket.py

from fastapi import WebSocket, WebSocketDisconnect
import asyncio, json
from agent.core.agent import run_agent
from agent.session.redis_session import RedisSessionManager
from agent.states.conversation_state import ConversationState

session_manager = RedisSessionManager()

# Active connections: session_id → WebSocket
active_connections: dict[str, WebSocket] = {}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    active_connections[session_id] = websocket

    # Load existing session or create new one
    session = await session_manager.load(session_id)
    if not session:
        session = ConversationState(session_id=session_id)

    # Start Redis pub/sub listener for payment events (runs in background)
    payment_listener_task = asyncio.create_task(
        listen_for_payment_events(session, websocket)
    )

    try:
        # Initial handshake message
        auth_msg = await websocket.receive_json()
        if auth_msg.get("type") == "auth":
            session.user_id = auth_msg.get("user_id")
            session.preferred_language = auth_msg.get("language", "EN")

        # Send welcome/resume message
        if session.messages:
            await websocket.send_json({
                "type": "text",
                "content": get_resume_message(session)
            })
        else:
            await websocket.send_json({
                "type": "text",
                "content": get_welcome_message(session.preferred_language)
            })

        # Main message loop
        while True:
            data = await websocket.receive_json()

            if data.get("type") != "user_message":
                continue

            user_text = data.get("content", "").strip()
            if not user_text:
                continue

            # Show typing indicator immediately
            await websocket.send_json({"type": "typing_start"})

            try:
                # Run the agent (may take 2-10 seconds)
                response = await run_agent(session, user_text)

                # Hide typing indicator
                await websocket.send_json({"type": "typing_end"})

                # Send the structured response
                await websocket.send_json(response)

                # Save session after every message
                await session_manager.save(session)

            except Exception as e:
                await websocket.send_json({"type": "typing_end"})
                await websocket.send_json({
                    "type": "error",
                    "content": "I ran into an issue. Please try again."
                })
                log.error(f"Agent error: {e}", session_id=session_id)

    except WebSocketDisconnect:
        active_connections.pop(session_id, None)
        payment_listener_task.cancel()
        await session_manager.save(session)   # Save on disconnect


async def listen_for_payment_events(session: ConversationState, ws: WebSocket):
    """
    Background task: listens for Stripe payment confirmations from NestJS backend.
    When payment succeeds, NestJS publishes to Redis pub/sub.
    This task receives it and pushes confirmation to the frontend WebSocket.
    """
    if not session.user_id:
        return

    pubsub = redis_client.pubsub()
    await pubsub.subscribe(f"payment_events:{session.user_id}")

    async for message in pubsub.listen():
        if message["type"] != "message":
            continue

        event = json.loads(message["data"])

        if event.get("status") == "SUCCEEDED":
            # Update session state
            session.state = "POST_BOOKING"
            session.payment_status = "CONFIRMED"
            await session_manager.save(session)

            # Push payment_confirmed event to frontend
            await ws.send_json({"type": "payment_confirmed", "booking_ref": session.booking_ref})

            # Generate a warm confirmation message from Claude
            confirmation = await run_agent(
                session,
                "__SYSTEM__: Payment confirmed via Stripe webhook. "
                "Generate a warm, celebratory booking confirmation message "
                "with the booking reference number and next steps."
            )
            await ws.send_json(confirmation)
```

---

## 11. Environment Variables

```bash
# apps/ai-agent/.env

# Model (Phase 1)
MODEL_BACKEND=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-sonnet-4-5-20251001

# Model (Phase 2 — uncomment when switching)
# MODEL_BACKEND=ollama
# OLLAMA_BASE_URL=http://gpu-server:11434
# OLLAMA_MODEL=qwen2.5:14b
# KHMER_FALLBACK_TO_ANTHROPIC=true

# Backend connection
BACKEND_URL=https://api.derlg.com/v1/ai-tools
AI_SERVICE_KEY=a8f2c9e1b4d6f3a7c2e9b1d4f6...  # 64-char hex, shared with backend

# Redis (Upstash)
REDIS_URL=rediss://default:password@...upstash.io:6380

# Server
HOST=0.0.0.0
PORT=8000
WORKERS=2

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://...@sentry.io/...
```

---

## 12. Cost Optimization Strategies

### Token Reduction Techniques

```python
# 1. Keep only last 20 messages in context window
messages_for_api = session.messages[-20:]

# 2. Summarize old messages when conversation is long
if len(session.messages) > 30:
    summary = await summarize_early_messages(session.messages[:10])
    session.messages = [{"role": "user", "content": f"[Earlier: {summary}]"}] + session.messages[-20:]

# 3. Strip tool results from old messages (keep only AI's text response)
# Tool result JSON can be large — remove it from old turns
def compress_old_messages(messages: list) -> list:
    if len(messages) <= 10:
        return messages
    compressed = []
    for msg in messages:
        if isinstance(msg.get("content"), list):
            # Keep tool_use blocks but remove large tool_result content
            content = [c for c in msg["content"] if c.get("type") != "tool_result"]
            if content:
                compressed.append({"role": msg["role"], "content": content})
        else:
            compressed.append(msg)
    return compressed

# 4. Cache common tool responses in Redis
# Weather forecasts cached 1 hour — no need to call Claude + API for same city again
```

### Cost Per Conversation Estimate

```
Discovery stage:     ~1,500 tokens input + 300 tokens output
Suggestion stage:    ~3,000 tokens input + 600 tokens output (trip data)
Exploration stage:   ~4,000 tokens input + 500 tokens output (tool results)
Booking stage:       ~5,000 tokens input + 400 tokens output
Payment stage:       ~2,000 tokens input + 200 tokens output

Total per booking:   ~15,500 tokens input + 2,000 tokens output

Claude Sonnet 4.5 pricing:
  Input:  $3.00 / 1M tokens = 15,500 × $3 / 1,000,000 = $0.0465
  Output: $15.00 / 1M tokens = 2,000 × $15 / 1,000,000 = $0.0300

Total cost per completed booking: ~$0.077 (~8 cents)

Break-even vs. Ollama local model:
  At 1,000 bookings/month: $77/month API cost
  GPU server (A10G 24GB): ~$300/month
  → Switch to Ollama when > 4,000 bookings/month
```