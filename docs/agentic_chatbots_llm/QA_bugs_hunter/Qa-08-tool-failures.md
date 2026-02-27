# QA-08 — Tool Failure & Recovery Bug Tests

**Total tests:** 15  
**Key risk:** Agent crashes or gives no response when a tool times out, returns 500, or returns empty data

---

## Background

Every tool call goes to the NestJS backend over HTTP. The network can fail. The backend can be down. The response schema can change without warning. A production-grade agent must handle every failure gracefully — never crashing the WebSocket, never leaving the user with a frozen chat, and never hallucinating data when a tool fails.

The golden rule: **if the tool fails, the agent must tell the user honestly and offer alternatives.** It must never pretend the tool succeeded.

---

## TEST CASES

---

### FAIL-001
**Risk:** 🔴 CRITICAL  
**Name:** getTripSuggestions returns 500 — agent hallucinates trip options

**Precondition:** All 6 discovery fields collected

**Tool behavior:** `getTripSuggestions` returns `HTTP 500 Internal Server Error`

**Expected behavior:**
- Agent catches the error
- Agent responds: "I'm having trouble finding trips right now. Let me try again in a moment."
- Agent may retry once automatically
- If retry also fails: "I'm unable to search for trips right now. Please try again in a few minutes, or contact our support."
- Agent does NOT invent trip names, prices, or descriptions

**Test:**
```python
async def test_fail001_no_hallucination_on_tool_500():
    session = all_discovery_fields_session()
    mock_suggest.side_effect = httpx.HTTPStatusError(
        "500 Internal Server Error", request=MagicMock(), response=MagicMock(status_code=500)
    )
    
    response = await run_agent(session, "Find me a trip")
    
    # Must NOT contain any trip names, prices, or details
    trip_indicators = ["$", "/person", "Day Package", "Resort", "Retreat", "Sunrise", "days trip"]
    for indicator in trip_indicators:
        assert indicator not in response['content'], \
            f"Agent hallucinated trip data after tool 500: found '{indicator}' in response"
    
    # Must communicate the issue
    error_phrases = ["trouble", "unable", "try again", "moment", "issue", "sorry"]
    assert any(p in response['content'].lower() for p in error_phrases), \
        "Agent did not communicate tool failure to user"
    
    # State must remain DISCOVERY (not advanced despite error)
    assert session.state == AgentState.DISCOVERY
```

---

### FAIL-002
**Risk:** 🔴 CRITICAL  
**Name:** createBooking network timeout — session left in broken state

**Precondition:** BOOKING stage, all details collected, user confirmed

**Tool behavior:** `createBooking` raises `httpx.TimeoutException` after 15 seconds

**Expected behavior:**
- Agent catches the timeout
- Responds: "Your booking is taking longer than expected. Let me check and try again."
- Retries `createBooking` once
- If retry also times out: "I wasn't able to complete the booking due to a connection issue. Your details are saved — please try booking again or contact support."
- `session.booking_id` remains `None`
- `session.state` remains `BOOKING` (does NOT advance to PAYMENT)

**Test:**
```python
async def test_fail002_timeout_does_not_corrupt_session():
    session = ready_to_book_session()
    mock_create_booking.side_effect = httpx.TimeoutException("Timeout after 15s")
    
    response = await run_agent(session, "Yes, book it")
    
    # Session must not have advanced
    assert session.state == AgentState.BOOKING, \
        f"State advanced to {session.state} despite timeout"
    assert session.booking_id is None, \
        "booking_id set despite tool timeout"
    assert session.payment_intent_id is None, \
        "payment_intent_id set despite booking timeout"
    
    # Response must be graceful
    assert response['type'] == 'text', "Error should be a text message"
    error_phrases = ["connection", "try again", "issue", "moment", "support"]
    assert any(p in response['content'].lower() for p in error_phrases)
```

---

### FAIL-003
**Risk:** 🔴 CRITICAL  
**Name:** generatePaymentQR fails — user left with confirmed booking but no QR

**Precondition:** createBooking succeeded, state = PAYMENT, now `generatePaymentQR` fails

**Tool behavior:** `generatePaymentQR` returns `{ "success": false, "error": { "code": "STRIPE_UNAVAILABLE" } }`

**Expected behavior:**
- Agent catches the QR failure
- Responds: "Your booking is reserved (Ref: DLG-2025-0042) but I'm having trouble generating the payment QR right now. Please try again in a moment, or use the card payment option."
- Offers alternative payment path (card)
- Does NOT leave user without any payment option
- `session.booking_id` remains set (booking still valid, just no QR yet)

**Test:**
```python
async def test_fail003_qr_failure_offers_alternative():
    session = payment_stage_session()
    session.booking_id = "booking-123"
    session.booking_ref = "DLG-2025-0042"
    mock_generate_qr.return_value = {
        "success": False,
        "error": {"code": "STRIPE_UNAVAILABLE", "message": "Stripe service down"}
    }
    
    response = await run_agent(session, "Show me the QR code")
    
    # Booking ref must still be mentioned
    assert "DLG-2025-0042" in response['content'], \
        "Agent forgot the booking reference when QR failed"
    
    # Must offer alternative
    alternatives = ["card", "alternative", "try again", "contact", "support"]
    assert any(a in response['content'].lower() for a in alternatives), \
        "Agent left user with no alternative when QR failed"
    
    # booking_id must still be in session
    assert session.booking_id == "booking-123"
```

---

### FAIL-004
**Risk:** 🟡 High  
**Name:** Tool returns unexpected JSON schema — agent crashes on key access

**Precondition:** EXPLORATION stage, user asks for itinerary

**Tool behavior:** `getTripItinerary` returns:
```json
{ "success": true, "data": { "schedule": [...] } }
```
But the agent code expects `data.itinerary`, not `data.schedule` (schema changed in backend).

**Expected behavior:**
- Agent catches the `KeyError` or `AttributeError`
- Agent responds: "I had trouble loading the itinerary. Let me try a different approach — what would you like to know about the trip?"
- Agent does NOT show a Python traceback to the user
- WebSocket connection remains open

**Test:**
```python
async def test_fail004_unexpected_schema_handled():
    session = exploration_stage_session()
    
    # Return wrong schema (backend changed "itinerary" → "schedule")
    mock_itinerary.return_value = {
        "success": True,
        "data": {
            "schedule": [  # Wrong key name
                {"day": 1, "activities": ["Angkor Wat sunrise"]}
            ]
        }
    }
    
    try:
        response = await run_agent(session, "Show me the itinerary")
        
        # Must not be a Python error
        assert "KeyError" not in response['content']
        assert "AttributeError" not in response['content']
        assert "Traceback" not in response['content']
        
        # Must be a graceful user message
        assert response['type'] == 'text'
        
    except KeyError as e:
        pytest.fail(f"Agent crashed with KeyError when schema changed: {e}")
    except AttributeError as e:
        pytest.fail(f"Agent crashed with AttributeError when schema changed: {e}")
```

---

### FAIL-005
**Risk:** 🟡 High  
**Name:** Tool returns empty data — agent must not present empty cards

**Precondition:** SUGGESTION stage

**Tool behavior:** `getTripSuggestions` returns:
```json
{ "success": true, "data": { "trips": [] } }
```

**Expected behavior:**
- Agent does NOT render empty trip cards
- Agent does NOT say "Here are your 3 options:" followed by nothing
- Agent communicates: "I couldn't find trips matching your preferences. Let me ask a couple of questions to find something better."
- Agent transitions back to DISCOVERY and asks ONE clarifying question

**Test:**
```python
async def test_fail005_empty_results_handled():
    session = all_discovery_fields_session()
    mock_suggest.return_value = {"success": True, "data": {"trips": []}}
    
    response = await run_agent(session, "Find my trip")
    
    # Must NOT render trip cards
    assert response['type'] != 'trip_cards', \
        "Agent rendered trip_cards with empty trips array"
    
    # Must communicate no results
    no_result_phrases = ["couldn't find", "no trips", "adjust", "different", "try"]
    assert any(p in response['content'].lower() for p in no_result_phrases), \
        "Agent did not communicate empty results"
    
    # Should go back to discovery
    assert session.state == AgentState.DISCOVERY
```

---

### FAIL-006
**Risk:** 🟡 High  
**Name:** Weather tool fails — agent must not invent weather data

**Precondition:** Any stage

**Tool behavior:** `getWeatherForecast` returns 404 (no data for that province)

**Expected behavior:**
- Agent does NOT invent weather: "It should be sunny and 30°C in Siem Reap in December"
- Agent says: "I don't have weather data for that area right now. You can check a reliable source like weather.com for Siem Reap forecasts. Generally, December is Cambodia's dry season — cool mornings and sunny afternoons."
- The "generally" fallback is acceptable as contextual knowledge, but NOT fabricated specific forecasts

**Test:**
```python
async def test_fail006_no_weather_hallucination():
    session = exploration_stage_session()
    mock_weather.side_effect = httpx.HTTPStatusError(
        "404", request=MagicMock(), response=MagicMock(status_code=404)
    )
    
    response = await run_agent(session, "What's the weather like in Siem Reap next week?")
    
    # Must NOT give specific fabricated forecasts
    specific_forecast_patterns = [
        r"\d+°",           # specific temperatures like "32°"
        r"\d+% rain",      # specific rain percentages
        r"Monday.*\d+",    # day-specific forecasts
    ]
    import re
    for pattern in specific_forecast_patterns:
        assert not re.search(pattern, response['content']), \
            f"Agent gave specific weather data without tool result (pattern: {pattern})"
    
    # Must acknowledge the limitation
    limitation_phrases = ["don't have", "unable to", "couldn't get", "check", "try"]
    assert any(p in response['content'].lower() for p in limitation_phrases)
```

---

### FAIL-007
**Risk:** 🟡 High  
**Name:** Redis session save failure — graceful degradation

**Precondition:** Normal conversation, `session_manager.save()` raises a Redis connection error

**Expected behavior:**
- Agent logs the Redis error (Sentry)
- Agent still responds to the user with the generated response
- Agent adds a warning if critical state was being saved (BOOKING → PAYMENT transition)
- WebSocket connection stays open

**Test:**
```python
async def test_fail007_redis_save_failure_graceful():
    session = discovery_stage_session()
    mock_redis_save.side_effect = redis.exceptions.ConnectionError("Redis down")
    
    # Agent should still respond
    try:
        response = await run_agent(session, "I want a beach trip")
        assert response is not None, "Agent returned None when Redis save failed"
        assert response.get('type') in ['text', 'error']
    except redis.exceptions.ConnectionError:
        pytest.fail("Redis error propagated to user — not handled internally")
    
    # Sentry must have been notified
    assert mock_sentry.called, "Redis failure not reported to error tracking"
```

---

### FAIL-008
**Risk:** 🟡 High  
**Name:** Claude API returns 429 (rate limit) — graceful degradation

**Precondition:** Any stage, under very high load

**Tool behavior:** Anthropic API returns `HTTP 429 Too Many Requests`

**Expected behavior:**
- Agent catches the 429
- Waits with exponential backoff (1s, 2s, 4s) and retries up to 3 times
- If all retries fail: responds to user: "I'm a little busy right now. Please send your message again in a moment."
- WebSocket stays open
- Session is preserved

**Test:**
```python
async def test_fail008_claude_api_rate_limit_handled():
    session = discovery_stage_session()
    
    # Simulate 429 on first 2 calls, success on 3rd
    call_count = 0
    original_create = anthropic_client.create_message
    
    async def rate_limited_create(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count <= 2:
            raise anthropic.RateLimitError("Rate limit exceeded")
        return await original_create(*args, **kwargs)
    
    with patch.object(anthropic_client, 'create_message', side_effect=rate_limited_create):
        response = await run_agent(session, "I want a trip")
    
    # Should eventually succeed (3rd retry)
    assert response is not None
    assert response['type'] != 'error' or call_count >= 3, \
        "Agent gave up on retry before 3 attempts"
```

---

### FAIL-009
**Risk:** 🟡 High  
**Name:** Tool executor dispatch — unknown tool name in Claude response

**Precondition:** Any stage

**Scenario:** Claude hallucinates a tool name that doesn't exist in `TOOL_DISPATCH`:  
Claude responds with a tool_use block: `{ "name": "getFlightPrices", ... }`

**Expected behavior:**
- Executor catches: `tool_name not in TOOL_DISPATCH`
- Returns: `{ "success": false, "error": { "code": "UNKNOWN_TOOL", "message": "Tool getFlightPrices is not available." } }`
- Claude receives this as a tool_result and responds gracefully
- User sees a helpful message, not a crash

**Test:**
```python
async def test_fail009_unknown_tool_name_handled():
    session = exploration_stage_session()
    
    # Mock Claude to return an unknown tool call
    mock_llm.return_value = ModelResponse(
        stop_reason="tool_use",
        content=[ContentBlock(
            type="tool_use",
            id="call_001",
            name="getFlightPrices",  # Not in TOOL_DISPATCH
            input={"destination": "Siem Reap"}
        )]
    )
    
    try:
        response = await run_agent(session, "Find me flights")
        # Must not crash
        assert response is not None
    except KeyError as e:
        pytest.fail(f"Unknown tool name caused KeyError: {e}")
```

---

### FAIL-010 through FAIL-015 — Additional Failure Tests

**FAIL-010:** All tool calls fail simultaneously (backend completely down)  
Every tool call returns 503. Agent must: respond gracefully, not crash, not loop, offer support contact, preserve session for when backend recovers.

**FAIL-011:** Tool returns success but with null critical field  
```json
{ "success": true, "data": { "booking_id": null, "booking_ref": null } }
```
Agent must catch null `booking_id` and NOT transition to PAYMENT. Must inform user booking failed despite "success".

**FAIL-012:** Session deserialization error on load  
Redis returns a corrupted JSON string for a session. `ConversationState(**data)` raises `ValidationError`. Session manager should: catch the error, return a fresh session (not crash), log the incident to Sentry.

**FAIL-013:** Sentry not configured — error logging itself doesn't crash the agent  
If `SENTRY_DSN` is missing from `.env`, the agent must still function. Sentry calls should be wrapped in try/except and fail silently.

**FAIL-014:** Tool response contains extremely large JSON (> 100KB)  
Example: `getPlaces` returns 500 places in one response. The tool result JSON is enormous. This can overflow the Claude context window when stored in `session.messages`. Test that large tool results are truncated or summarized before being stored.

**FAIL-015:** WebSocket drops mid-tool execution  
User sends message. Agent starts processing (getLLM → tool call in progress). User's connection drops. Tool call completes. What happens?
- Tool results must be discarded (user is gone)
- Session must be saved with the last consistent state (before the dropped message's changes)
- No orphaned Stripe payment intents or reserved bookings from the incomplete flow

---

## Tool Failure Recovery Decision Tree

```
Tool call fires
       │
       ├── HTTP 200 + valid data → proceed normally
       │
       ├── HTTP 200 + empty data → inform user, offer alternatives
       │
       ├── HTTP 200 + wrong schema → catch KeyError/AttributeError, 
       │                             return graceful error message
       │
       ├── HTTP 4xx (validation) → show specific error to user
       │                           (e.g., "Invalid phone format")
       │
       ├── HTTP 429 (rate limit) → exponential backoff, retry 3x
       │
       ├── HTTP 500 (server error) → retry once, then inform user
       │
       ├── HTTP 503 (backend down) → inform user, save session, 
       │                             provide support contact
       │
       ├── Timeout → retry once, then inform user gracefully
       │
       └── Unknown tool name → return UNKNOWN_TOOL error to Claude,
                               Claude responds gracefully to user
```

---

## Complete QA Test Summary

| File | Tests | Primary Bug Risk |
|---|---|---|
| QA-01 Discovery | 18 | Tool called before all fields collected |
| QA-02 Tool Calling | 22 | Hallucinated data, wrong user_id, duplicate calls |
| QA-03 State Machine | 20 | State stuck, wrong transitions, data lost |
| QA-04 Payment Flow | 16 | Duplicate charges, unverified payment confirmations |
| QA-05 Session Memory | 14 | Session loss, cross-user contamination, TTL bugs |
| QA-06 Language | 12 | Tool params in wrong language, Khmer numerals |
| QA-07 Edge Cases | 20 | Prompt injection, rapid messages, context overflow |
| QA-08 Tool Failures | 15 | Crash on tool error, hallucination when tool fails |
| **TOTAL** | **137** | |

---

## Bug Priority Fix Order

When bugs are found during testing, fix in this order:

**Priority 1 — Fix before beta:**
- DISC-001 (tool called too early)
- TOOL-002 (booking without explicit yes)  
- TOOL-003 (fake booking ID on error)
- PAY-001 (confirmed without webhook)
- PAY-002 (duplicate Stripe intent)
- ADV-001 (prompt injection)
- FAIL-001 (hallucination on tool 500)

**Priority 2 — Fix before launch:**
- All 🔴 CRITICAL tests not in P1
- STATE-001 (state not persisted)
- LANG-001 (tool params in wrong language)
- FAIL-002 (timeout corrupts session)

**Priority 3 — Fix in first week post-launch:**
- All 🟡 HIGH tests
- PAY-003 (payment attempts not counted)
- ADV-006 (infinite question loop)

**Priority 4 — Fix in first month:**
- All 🟢 MEDIUM tests
- ADV-020 (stress test / 50 messages)