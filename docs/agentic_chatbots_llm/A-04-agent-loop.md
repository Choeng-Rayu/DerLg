# DerLg.com AI Agent — Core Agent Loop & Tool Execution

**File:** `agent/agent.py` + `agent/tools/executor.py`

---

## 1. Overview

The core agent loop is a `while True` cycle that:
1. Calls the Claude API with the current conversation history
2. If Claude decides to call a tool → executes the tool → feeds results back
3. If Claude returns a final answer → formats it → sends it to the frontend

This loop continues until Claude produces a text response (not a tool call). Multiple tool calls can happen in a single user-message turn (parallel execution is supported).

---

## 2. Core Agent Loop

```python
# agent/agent.py

import anthropic
import json
import asyncio
from agent.states import ConversationState, AgentState
from agent.prompts.builder import build_system_prompt
from agent.tools.schemas import TRAVEL_TOOLS
from agent.tools.executor import execute_tool
from agent.formatters.response_formatter import format_response

client = anthropic.AsyncAnthropic()

async def run_agent(session: ConversationState, user_message: str) -> dict:
    """
    Main agent entry point.
    Returns a structured response dict for the frontend WebSocket.
    """

    # Add user message to history
    session.messages.append({
        "role": "user",
        "content": user_message
    })

    tool_call_count = 0
    MAX_TOOL_CALLS = 10  # safety limit per turn

    while True:
        if tool_call_count >= MAX_TOOL_CALLS:
            # Safety fallback — too many tool calls in one turn
            return {
                "type": "text",
                "content": "I ran into a processing issue. Could you rephrase your question?"
            }

        # Call Claude API
        response = await client.messages.create(
            model="claude-sonnet-4-5-20251001",
            max_tokens=2048,
            system=build_system_prompt(session),
            messages=session.messages[-20:],  # keep last 20 for context window
            tools=TRAVEL_TOOLS
        )

        if response.stop_reason == "tool_use":
            # Extract all tool calls from this response
            tool_calls = [block for block in response.content if block.type == "tool_use"]
            
            # Execute tool calls — parallel if multiple
            tool_results = await asyncio.gather(*[
                execute_tool(call.name, call.input, session)
                for call in tool_calls
            ])

            # Build tool result messages
            tool_result_messages = []
            for call, result in zip(tool_calls, tool_results):
                tool_result_messages.append({
                    "type": "tool_result",
                    "tool_use_id": call.id,
                    "content": json.dumps(result)
                })

            # Add assistant's tool-use response and tool results to history
            session.messages.append({
                "role": "assistant",
                "content": response.content
            })
            session.messages.append({
                "role": "user",
                "content": tool_result_messages
            })

            tool_call_count += len(tool_calls)
            # Loop again — Claude will now process tool results and form final response

        else:
            # Claude has produced a final text response
            ai_text = "".join(
                block.text for block in response.content 
                if block.type == "text"
            )

            # Add to history
            session.messages.append({
                "role": "assistant",
                "content": ai_text
            })

            # Check if state needs to transition based on last tool calls
            update_session_state(session, session.messages)

            # Format the response into appropriate frontend message type
            formatted = await format_response(ai_text, session)

            return formatted
```

---

## 3. Tool Executor

```python
# agent/tools/executor.py

import httpx
from agent.states import ConversationState
from config.settings import settings

BACKEND_BASE_URL = settings.BACKEND_URL  # e.g., "https://api.derlg.com/v1/ai-tools"
SERVICE_API_KEY = settings.AI_SERVICE_KEY

async def execute_tool(tool_name: str, tool_input: dict, session: ConversationState) -> dict:
    """
    Dispatches a tool call to the appropriate NestJS backend endpoint.
    Returns the result as a dict for feeding back to Claude.
    """
    try:
        result = await TOOL_DISPATCH[tool_name](tool_input, session)
        return { "success": True, "data": result }
    except httpx.HTTPStatusError as e:
        error_body = e.response.json() if e.response else {}
        return {
            "success": False,
            "error": {
                "code": error_body.get("error", {}).get("code", "UNKNOWN_ERROR"),
                "message": error_body.get("error", {}).get("message", "An error occurred.")
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": {
                "code": "TOOL_EXECUTION_FAILED",
                "message": "I couldn't complete that action. Please try again."
            }
        }

# Tool dispatch table — maps tool name to async function
TOOL_DISPATCH = {
    "getTripSuggestions":     _call_trip_suggestions,
    "getTripItinerary":       _call_trip_itinerary,
    "getHotelDetails":        _call_hotel_details,
    "getTripImages":          _call_trip_images,
    "getWeatherForecast":     _call_weather,
    "compareTrips":           _call_compare_trips,
    "calculateCustomTrip":    _call_calculate_trip,
    "customizeTrip":          _call_customize_trip,
    "applyDiscountCode":      _call_apply_discount,
    "validateUserDetails":    _call_validate_user,
    "createBooking":          _call_create_booking,
    "generatePaymentQR":      _call_generate_qr,
    "checkPaymentStatus":     _call_check_payment,
    "cancelBooking":          _call_cancel_booking,
    "modifyBooking":          _call_modify_booking,
    "getPlaces":              _call_get_places,
    "getUpcomingFestivals":   _call_get_festivals,
    "estimateBudget":         _call_estimate_budget,
}
```

---

## 4. Individual Tool Handler Pattern

All tool handlers follow the same pattern:

```python
async def _call_trip_suggestions(tool_input: dict, session: ConversationState) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BACKEND_BASE_URL}/trips/suggest",
            json={
                **tool_input,
                "language": session.preferred_language  # always pass language
            },
            headers={"X-Service-Key": SERVICE_API_KEY},
            timeout=10.0
        )
        response.raise_for_status()
        result = response.json()

        # Side effect: update session with returned trip IDs
        session.suggested_trip_ids = [t["id"] for t in result["data"]["trips"]]

        return result["data"]
```

Tools that modify session state have controlled side effects — they update the `session` object directly before returning results:

| Tool | Session Side Effect |
|---|---|
| `getTripSuggestions` | Updates `suggested_trip_ids` |
| `createBooking` | Updates `booking_id`, `booking_ref`, `reserved_until`, transitions state to PAYMENT |
| `generatePaymentQR` | Updates `payment_intent_id` |
| `checkPaymentStatus` | Updates `payment_status` |
| `cancelBooking` | Clears `booking_id`, transitions state to appropriate prior state |

---

## 5. State Transition Logic

State transitions happen in two ways:

### Automatic transitions (based on tool call results)

```python
def update_session_state(session: ConversationState, messages: list):
    """Check recent tool results and update session state accordingly."""

    # Get last tool result if any
    last_result = get_last_tool_result(messages)
    if not last_result:
        return

    # Transition: booking was created → move to PAYMENT
    if last_result.get("booking_id") and session.state == AgentState.BOOKING:
        session.state = AgentState.PAYMENT
        session.booking_id = last_result["booking_id"]
        session.booking_ref = last_result["booking_ref"]
        session.reserved_until = parse_datetime(last_result["reserved_until"])

    # Transition: payment confirmed → move to POST_BOOKING
    if last_result.get("payment_status") == "SUCCEEDED" and session.state == AgentState.PAYMENT:
        session.state = AgentState.POST_BOOKING
        session.payment_status = "CONFIRMED"
```

### Intent-based transitions (Claude interprets user intent)

Claude is instructed in the stage prompts to recognize when a user has selected a trip, is ready to book, or wants to go back. When Claude recognizes these signals, it transitions the state in the session by calling the `customizeTrip` or `createBooking` tools, which trigger the automatic transitions above.

---

## 6. Parallel Tool Execution

When a user asks two questions at once ("Show me the hotel AND the weather"), Claude will include two tool_use blocks in its response. The executor handles these in parallel using `asyncio.gather`:

```python
tool_results = await asyncio.gather(*[
    execute_tool(call.name, call.input, session)
    for call in tool_calls
])
```

This means if the user asks 3 questions that each require a tool call, all 3 backend requests fire simultaneously, and the total wait time is the time of the slowest single request — not the sum of all three.

---

## 7. Error Recovery

When a tool call fails, the executor returns an error dict that includes a human-friendly message. Claude is instructed to relay this to the user:

```
Tool Error Response:
{
  "success": false,
  "error": {
    "code": "BOOKING_EXPIRED",
    "message": "Your booking reservation has expired. Would you like me to start a new reservation?"
  }
}
```

Claude will then say something like: "It looks like your 15-minute booking hold has expired. Would you like me to re-reserve this trip so you can complete the payment?"

---

## 8. Token Budget Management

The agent keeps only the last 20 messages in the context window sent to Claude. This prevents exceeding Claude's context limit while preserving enough history for continuity.

The full message history is stored in Redis and referenced in `session.messages`. Only the latest 20 are sent in each API call. This means very long conversations may lose early context, but in practice the `ConversationState` model captures all the important structured data (selected trip, booking ID, etc.) which is re-injected via the system prompt context block.

---

## 9. Redis Pub/Sub for Payment Confirmation

When Stripe's webhook fires and the NestJS backend confirms payment, it publishes to Redis:

```
PUBLISH payment_events:{user_id}  '{"booking_id": "uuid", "status": "SUCCEEDED"}'
```

The AI agent server has a background task that subscribes to `payment_events:*` and pushes the confirmation down the active WebSocket to the frontend:

```python
# background task in websocket handler
async def listen_for_payment_events(user_id: str, websocket: WebSocket, session: ConversationState):
    async for message in redis_pubsub.listen(f"payment_events:{user_id}"):
        if message["data"]["status"] == "SUCCEEDED":
            session.state = AgentState.POST_BOOKING
            session.payment_status = "CONFIRMED"
            await websocket.send_json({
                "type": "payment_confirmed",
                "booking_ref": session.booking_ref
            })
            # Also generate a celebratory text message from Claude
            confirmation_message = await run_agent(
                session, 
                "__SYSTEM__: Payment confirmed. Generate a warm celebratory confirmation message."
            )
            await websocket.send_json(confirmation_message)
```
