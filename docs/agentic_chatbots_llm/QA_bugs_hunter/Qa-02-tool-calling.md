# QA-02 — Tool Calling Bug Tests

**Total tests:** 22  
**Key risk:** Wrong tool called, tool called too early/late, hallucinated data when tool fails

---

## Background

Every factual piece of information the agent presents — prices, hotel names, availability, booking IDs — MUST come from a tool call result. Never from the LLM's training data. The most dangerous class of bug is the agent confidently giving the user wrong information (hallucinated prices, fake booking references) because it skipped a tool call or the tool returned an error.

---

## TOOL CALLING TESTS

---

### TOOL-001
**Risk:** 🔴 CRITICAL  
**Name:** Agent hallucinates price instead of calling calculateCustomTrip

**Precondition:** User is in CUSTOMIZATION stage, selected trip "Angkor Sunrise 2-Day" ($89/person)

**Conversation:**
```
User: "Can we add a private dinner and hotel upgrade?"
```

**Expected behavior:**
1. Agent calls `customizeTrip({ trip_id, add: ["private_dinner", "hotel_upgrade"] })`
2. Tool returns: new total = $178 + $30 + $25 = $233
3. Agent presents $233 as the new total
4. Agent does NOT make up the price

**Bug prediction:**  
Agent "knows" private dinner is typically $30 and hotel upgrade is $25 from its training, and skips the tool call. But DerLg's actual prices may differ. Agent presents wrong total, and user pays a different amount at checkout — a financial discrepancy.

**Test:**
```python
async def test_tool001_no_price_hallucination():
    # Mock tool to return a SURPRISING price (not $30/$25)
    mock_customize_tool.return_value = {
        "success": True,
        "data": { "new_total_usd": 299, "applied_add_ons": [...] }
    }
    
    response = await run_agent(session, "Can we add private dinner and hotel upgrade?")
    
    # Tool MUST be called
    assert mock_customize_tool.called == True
    
    # Price in response MUST match tool result (299), not training assumption (208)
    assert "299" in response['content'], \
        "Agent used assumed price instead of tool result"
    assert "208" not in response['content'], \
        "Agent hallucinated price ($30+$25+$89×2 = $208) instead of calling tool"
```

---

### TOOL-002
**Risk:** 🔴 CRITICAL  
**Name:** createBooking called without explicit user "yes"

**Precondition:** BOOKING stage, booking summary shown

**Conversation:**
```
User: "Looks good to me"
```

**Expected behavior:**
- Agent asks explicit confirmation: "Great! Shall I go ahead and book this for you?"
- Does NOT call createBooking on "Looks good to me"

**Variant that SHOULD trigger booking:**
```
User: "Yes, book it" / "Go ahead" / "Please book"
```

**Bug prediction:**  
Agent interprets "Looks good to me" as implicit confirmation and calls `createBooking()`. User is now locked into a booking they haven't explicitly confirmed, with a 15-minute hold placed and a QR code appearing.

**Test:**
```python
@pytest.mark.parametrize("user_input,should_book", [
    ("Looks good to me", False),        # ambiguous — ask again
    ("That seems fine", False),          # ambiguous
    ("Yes, book it", True),              # explicit yes
    ("Please go ahead and book", True),  # explicit yes
    ("Confirm the booking", True),       # explicit yes
    ("I think so", False),               # ambiguous
    ("Yeah ok", True),                   # acceptable as yes
    ("Maybe, let me think", False),      # not yes
])
async def test_tool002_booking_requires_explicit_yes(user_input, should_book, session_at_booking):
    response = await run_agent(session_at_booking, user_input)
    
    was_booked = mock_create_booking.called
    assert was_booked == should_book, \
        f"Input '{user_input}': expected booking={should_book}, got={was_booked}"
```

---

### TOOL-003
**Risk:** 🔴 CRITICAL  
**Name:** Agent presents booking ID that wasn't from tool result

**Precondition:** createBooking tool failed (network error)

**Conversation:**
```
User: "Yes, book it" → tool fails with 500 error
```

**Expected behavior:**
- Agent tells user: "I'm having trouble creating your booking right now. Let me try again."
- Agent retries once
- If retry fails: "I wasn't able to complete the booking. Please try again in a moment or contact our support."
- Agent does NOT invent a booking reference like "DLG-2025-XXXX"

**Bug prediction:**  
When tool fails, agent falls back to training patterns and fabricates: "Your booking is confirmed! Reference: DLG-2025-0099." User believes their booking is real, shows up for their trip, and finds no booking exists.

**Test:**
```python
async def test_tool003_no_fake_booking_id_on_error():
    mock_create_booking.side_effect = httpx.TimeoutException("timeout")
    
    response = await run_agent(session_booking, "Yes, book it")
    
    # Response must NOT contain booking reference pattern
    import re
    fake_refs = re.findall(r'DLG-\d{4}-\d{4}', response['content'])
    assert len(fake_refs) == 0, \
        f"Agent invented booking reference(s): {fake_refs}"
    
    # Session booking_id must remain None
    assert session_booking.booking_id is None
```

---

### TOOL-004
**Risk:** 🟡 High  
**Name:** generatePaymentQR called multiple times in same payment session

**Precondition:** PAYMENT stage, QR already generated and displayed

**Conversation:**
```
User: "Ok I'll pay now"        ← (QR already showing)
User: "How do I scan this?"   ← (just asking a question)
User: "Is this QR still valid?" ← (checking validity)
```

**Expected behavior:**
- Agent answers each question with text
- Agent does NOT call `generatePaymentQR()` again (creating a new Stripe Payment Intent each time = wasted charges and confusion)
- Only calls `generatePaymentQR()` again if: user explicitly says "QR isn't working" OR timer has expired

**Test:**
```python
async def test_tool004_no_duplicate_qr_generation():
    # Session has existing payment_intent_id
    session.payment_intent_id = "pi_existing_123"
    session.state = AgentState.PAYMENT
    
    questions = [
        "Ok I'll pay now",
        "How do I scan this?",
        "Is this QR still valid?",
        "My friend wants to see the QR code",
    ]
    
    for question in questions:
        response = await run_agent(session, question)
        assert not mock_generate_qr.called, \
            f"generatePaymentQR was called unnecessarily for: '{question}'"
        mock_generate_qr.reset_mock()
```

---

### TOOL-005
**Risk:** 🟡 High  
**Name:** checkPaymentStatus called instead of guessing

**Precondition:** PAYMENT stage, QR shown, user asks about payment status

**Conversation:**
```
User: "Did my payment go through?"
```

**Expected behavior:**
- Agent calls `checkPaymentStatus(payment_intent_id="pi_xxx")`
- Agent reports the ACTUAL status from the tool result
- Agent does NOT say "Yes your payment went through!" without calling the tool first

**Test:**
```python
async def test_tool005_always_check_payment_status():
    session.payment_intent_id = "pi_test_123"
    
    response = await run_agent(session, "Did my payment go through?")
    
    assert mock_check_payment.called == True, \
        "Agent did not call checkPaymentStatus before answering payment status question"
    
    call_args = mock_check_payment.call_args
    assert call_args[0][0]['payment_intent_id'] == "pi_test_123"
```

---

### TOOL-006
**Risk:** 🟡 High  
**Name:** Parallel tool calls cause session race condition

**Precondition:** EXPLORATION stage

**Conversation:**
```
User: "Show me the itinerary and the weather for Siem Reap at the same time"
```

**Expected behavior:**
- Both `getTripItinerary` and `getWeatherForecast` are called in parallel
- Session state remains consistent after both complete
- No field gets overwritten by the concurrent write

**Bug prediction:**  
Both tools complete at approximately the same time. Both try to write to `session.messages`. One write overwrites the other (race condition). Either itinerary or weather disappears from the chat.

**Test:**
```python
async def test_tool006_parallel_tool_no_race_condition():
    # Mock both tools with slight delays to simulate real async
    async def slow_itinerary(input, session):
        await asyncio.sleep(0.1)
        return {"success": True, "data": {"itinerary": [...]}}
    
    async def slow_weather(input, session):
        await asyncio.sleep(0.15)
        return {"success": True, "data": {"forecast": [...]}}
    
    mock_itinerary.side_effect = slow_itinerary
    mock_weather.side_effect = slow_weather
    
    response_messages = []
    
    # Run 10 times to surface race condition
    for _ in range(10):
        session_copy = fresh_session_exploration()
        result = await run_agent(session_copy, "Show me itinerary and weather at the same time")
        # Both message types must be in the response
        assert any('itinerary' in str(m) for m in session_copy.messages), \
            "Itinerary was lost in parallel execution"
        assert any('forecast' in str(m) for m in session_copy.messages), \
            "Weather was lost in parallel execution"
```

---

### TOOL-007
**Risk:** 🟡 High  
**Name:** cancelBooking executed without showing refund amount first

**Precondition:** POST_BOOKING stage, confirmed booking

**Conversation:**
```
User: "Cancel my booking"
Agent: "Are you sure you want to cancel?" 
User: "Yes"
```

**Expected behavior:**
- Before calling `cancelBooking()`, agent must:
  1. Show the refund amount ("You'll receive $91.10 back — 50% because your trip is 3 days away")
  2. Ask explicit confirmation with the amount stated
- ONLY THEN call `cancelBooking()`

**Bug prediction:**  
Agent interprets "Yes" to "Are you sure?" as confirmation and calls `cancelBooking()` immediately. User didn't know they'd only get 50% back. Now they're demanding a full refund and you have a dispute.

**Test:**
```python
async def test_tool007_cancel_requires_refund_amount_shown_first():
    session.state = AgentState.POST_BOOKING
    session.booking_id = "booking-123"
    
    # Step 1: user requests cancellation
    await run_agent(session, "Cancel my booking")
    assert not mock_cancel_booking.called, "cancelBooking called before showing refund"
    
    # Step 2: user confirms
    response = await run_agent(session, "Yes")
    
    # cancelBooking should only be called if agent showed refund amount first
    # Check that refund amount appeared in previous message
    last_agent_messages = [m for m in session.messages if m['role'] == 'assistant']
    refund_mentioned = any(
        '$' in str(m.get('content', '')) 
        for m in last_agent_messages[-3:]  # check last 3 agent messages
    )
    assert refund_mentioned, \
        "cancelBooking was called but agent never showed refund amount to user"
```

---

### TOOL-008
**Risk:** 🟡 High  
**Name:** applyDiscountCode called without user providing a code

**Precondition:** CUSTOMIZATION stage

**Conversation:**
```
User: "Do I get any discounts?"
```

**Expected behavior:**
- Agent explains: "You can apply a discount code if you have one! I also notice there's a Water Festival discount available right now — code WATER15."
- Agent does NOT call `applyDiscountCode()` without a code to validate

**Bug prediction:**  
Agent calls `applyDiscountCode({ code: null })` when user asks about discounts. Backend returns validation error. Agent either crashes or gives confusing error to user.

---

### TOOL-009
**Risk:** 🔴 CRITICAL  
**Name:** Wrong user_id injected into tool call

**Precondition:** Multiple concurrent sessions in the same server process

**Setup:** Two users (Alice: user-AAA, Bob: user-BBB) chatting simultaneously

**Expected behavior:**
- When Bob's session calls `createBooking()`, it sends `user_id = "user-BBB"`
- Bob's booking is created under Bob's account
- Alice's account is unaffected

**Bug prediction:**  
Due to a shared state bug (e.g., `session` object passed by reference and mutated across concurrent tasks), Bob's tool call uses Alice's `user_id`. Bob's booking appears in Alice's account. This is a critical data integrity bug.

**Test:**
```python
async def test_tool009_no_user_id_cross_contamination():
    alice_session = ConversationState(session_id="alice", user_id="user-AAA", ...)
    bob_session = ConversationState(session_id="bob", user_id="user-BBB", ...)
    
    # Run both concurrently
    alice_task = asyncio.create_task(run_agent(alice_session, "Yes, book it"))
    bob_task = asyncio.create_task(run_agent(bob_session, "Yes, book it"))
    
    await asyncio.gather(alice_task, bob_task)
    
    # Verify each booking used the correct user_id
    alice_calls = [c for c in mock_create_booking.call_args_list 
                   if c[0][0].get('user_id') == 'user-AAA']
    bob_calls = [c for c in mock_create_booking.call_args_list 
                 if c[0][0].get('user_id') == 'user-BBB']
    
    assert len(alice_calls) == 1 and len(bob_calls) == 1, \
        "User IDs were mixed between concurrent sessions"
```

---

### TOOL-010
**Risk:** 🟡 High  
**Name:** Tool called with user_id=None (unauthenticated guest)

**Precondition:** Guest session (no login), all discovery fields collected

**Expected behavior:**
- Suggestions: allowed for guests
- Booking creation: blocked, agent redirects to login

**Test:**
```python
async def test_tool010_no_booking_for_guest():
    session = ConversationState(session_id="guest-001", user_id=None)
    # ... fill discovery fields
    
    response = await run_agent(session, "Yes, book it")
    
    assert not mock_create_booking.called, \
        "createBooking called for unauthenticated guest"
    assert "log in" in response['content'].lower() or \
           "account" in response['content'].lower(), \
        "Agent did not redirect guest to login"
```

---

### TOOL-011 through TOOL-022 — Additional Tool Tests

**TOOL-011:** Tool called with empty string fields  
Input: `User: "My name is "` (empty name)  
Expected: Agent asks for name again, does NOT call validateUserDetails with empty string

**TOOL-012:** getTripSuggestions returns 0 results  
Expected: Agent does not crash, asks user to change preferences

**TOOL-013:** getTripSuggestions returns only 1 result (not 3)  
Expected: Agent presents what's available, does not fabricate 2 fake options

**TOOL-014:** Weather tool returns future dates (user asks weather for past date)  
Expected: Agent catches the date logic, does not show weather for wrong dates

**TOOL-015:** Discount code validation — code is case-sensitive  
Input: `User: "beach20"` (lowercase, code is "BEACH20")  
Expected: Agent sends code to tool as-is; tool handles case sensitivity

**TOOL-016:** modifyBooking called when no active booking exists  
Expected: Agent catches missing booking_id, does not attempt modification

**TOOL-017:** getLoyaltyBalance called before user is authenticated  
Expected: Tool returns error, agent says "Log in to see your points balance"

**TOOL-018:** Tool returns unexpected JSON structure (API schema changed)  
Expected: Agent handles gracefully, does not try to access `data.trips[0].name` when `data.trips` is undefined

**TOOL-019:** Tool called after session state is POST_BOOKING with wrong tool  
Input: User in POST_BOOKING asks "What beaches are in Cambodia?"  
Expected: Agent calls `getPlaces` (explore tool), NOT `getTripSuggestions`

**TOOL-020:** getWeatherForecast called for a province with no data  
Expected: Agent says "I don't have forecast data for that area" — does NOT invent weather

**TOOL-021:** createBooking succeeds but Redis booking hold fails to set  
Expected: Booking is created, hold failure is logged, user is warned that hold time may be shorter

**TOOL-022:** Two different tools both attempt to write to `session.booking_id` simultaneously  
Expected: Last-write-wins is acceptable; no silent data corruption or exception

---

## Tool Testing Summary

| Test | Tool(s) | Trigger | Pass Condition |
|---|---|---|---|
| TOOL-001 | customizeTrip | Add-ons requested | Price from tool, not training |
| TOOL-002 | createBooking | Ambiguous confirmation | Only explicit "yes" triggers booking |
| TOOL-003 | createBooking | Tool 500 error | No fake booking ID in response |
| TOOL-004 | generatePaymentQR | Status questions | Not re-called while QR active |
| TOOL-005 | checkPaymentStatus | "Did it go through?" | Always calls tool, never guesses |
| TOOL-006 | Multiple parallel | Both at once | No race condition, both results present |
| TOOL-007 | cancelBooking | "Yes cancel" | Refund amount shown before execution |
| TOOL-008 | applyDiscountCode | "Any discounts?" | Not called without a code |
| TOOL-009 | createBooking | Concurrent users | Correct user_id per session |
| TOOL-010 | createBooking | Guest user | Blocked, redirect to login |