# QA-03 — State Machine & Transition Bug Tests

**Total tests:** 20  
**Key risk:** Wrong state after transition, state gets stuck, backward transitions lose data

---

## Background

The agent has 7 states: DISCOVERY → SUGGESTION → EXPLORATION → CUSTOMIZATION → BOOKING → PAYMENT → POST_BOOKING.

State transitions are the backbone of the entire booking journey. If the state machine misbehaves, a user in PAYMENT might see discovery questions. A user in POST_BOOKING might be asked to re-confirm a booking that's already confirmed. State bugs are invisible to the user — they just experience a confusing, inconsistent conversation.

---

## TEST CASES

---

### STATE-001
**Risk:** 🔴 CRITICAL  
**Name:** State not saved to Redis after transition  

**Precondition:** User is at BOOKING stage, createBooking succeeds, state should → PAYMENT

**Expected behavior:**  
After `createBooking()` succeeds:
- `session.state` changes to `PAYMENT` in memory
- `session_manager.save(session)` is called
- Redis key `session:{session_id}` is updated with new state
- If user disconnects and reconnects immediately, new WebSocket loads state=PAYMENT

**Bug prediction:**  
Agent updates `session.state` in memory but `save()` is only called at the END of the WebSocket message handler. If the server crashes between the state update and the save, session is stuck at BOOKING state. User reconnects, agent re-shows the booking form. User re-confirms. Duplicate booking is created.

**Test:**
```python
async def test_state001_state_persisted_after_transition():
    session = booking_stage_session()
    mock_create_booking.return_value = {
        "success": True,
        "data": {
            "booking_id": "booking-123",
            "booking_ref": "DLG-2025-0042",
            "reserved_until": "2025-12-20T10:30:00Z"
        }
    }
    
    await run_agent(session, "Yes, book it")
    
    # Verify Redis save was called with PAYMENT state
    saved_state = mock_redis_save.call_args[0][0]
    assert saved_state.state == AgentState.PAYMENT, \
        f"Expected PAYMENT in Redis, got: {saved_state.state}"
    
    # Simulate reconnect
    loaded_session = await session_manager.load(session.session_id)
    assert loaded_session.state == AgentState.PAYMENT
```

---

### STATE-002
**Risk:** 🔴 CRITICAL  
**Name:** State transitions to wrong stage on tool success  

**Precondition:** EXPLORATION stage, user selects a trip

**Conversation:**
```
User: "I want to book option 2"
```

**Expected behavior:**
- Agent transitions to CUSTOMIZATION (not directly to BOOKING)
- Agent asks: "Would you like to customize anything — add a private dinner, upgrade the hotel, or apply a discount code? Or are you ready to book as-is?"

**Bug prediction:**  
Agent skips CUSTOMIZATION entirely and jumps to BOOKING, immediately asking for the user's name and phone number. User can't add customizations they would have wanted. Revenue is lost on add-ons.

**Test:**
```python
async def test_state002_exploration_goes_to_customization():
    session = exploration_stage_session()
    
    response = await run_agent(session, "I want to book option 2")
    
    assert session.state == AgentState.CUSTOMIZATION, \
        f"Expected CUSTOMIZATION, got: {session.state}"
    assert session.state != AgentState.BOOKING, \
        "Agent skipped CUSTOMIZATION stage"
```

---

### STATE-003
**Risk:** 🟡 High  
**Name:** Backward transition loses previously collected data  

**Precondition:** CUSTOMIZATION stage  
Selected: trip, hotel, customizations = ["private_dinner"]  

**Conversation:**
```
User: "Actually, can I change the hotel?"
```

**Expected behavior:**
- Agent transitions back to EXPLORATION for hotel selection
- `session.selected_trip_id` is PRESERVED
- `session.customizations` (private_dinner) is PRESERVED
- Only `session.selected_hotel_id` is cleared for re-selection

**Bug prediction:**  
Backward transition to EXPLORATION resets ALL exploration-stage data: `selected_trip_id = None`, `customizations = []`. User has to start from scratch.

**Test:**
```python
async def test_state003_backward_transition_preserves_data():
    session = customization_stage_session()
    session.selected_trip_id = "trip-angkor-001"
    session.customizations = ["private_dinner"]
    session.selected_hotel_id = "hotel-old-001"
    
    await run_agent(session, "Actually, can I change the hotel?")
    
    # Trip selection must survive
    assert session.selected_trip_id == "trip-angkor-001", \
        "Trip selection was lost during backward transition"
    
    # Customizations must survive
    assert "private_dinner" in session.customizations, \
        "Customizations were lost during backward transition"
    
    # Hotel may be cleared for re-selection (acceptable)
    # State should be EXPLORATION
    assert session.state == AgentState.EXPLORATION
```

---

### STATE-004
**Risk:** 🔴 CRITICAL  
**Name:** Payment stage re-entered after booking already confirmed  

**Precondition:** POST_BOOKING stage, booking already confirmed

**Conversation:**
```
User: "Can I pay again?" (confused user)
OR
User: "I want to book another trip"
```

**Expected behavior for "pay again":**
- Agent clarifies: "Your booking DLG-2025-0042 is already confirmed and paid! You don't need to pay again."
- Agent does NOT generate a new QR code
- Agent does NOT call `generatePaymentQR()`

**Expected behavior for "another trip":**
- Agent starts a NEW session discovery flow
- Agent does NOT use the previous booking's details
- `booking_id`, `payment_intent_id` are cleared for the new booking

**Bug prediction:**  
When user says "I want to book another trip," agent reuses `session.selected_trip_id` from the previous booking and fast-forwards to BOOKING stage. User books the same trip again by accident.

---

### STATE-005
**Risk:** 🟡 High  
**Name:** PAYMENT state not recovered correctly after session gap

**Precondition:** User was at PAYMENT stage, QR was shown  
User closed the app for 20 minutes (hold expired)

**Conversation:** (User opens app again)
```
User: "Hi, I'm back" (or no message — just reconnects)
```

**Expected behavior:**
- `session_manager.load()` detects `state = PAYMENT` and `reserved_until < NOW()`
- Session recovery sets `state = BOOKING`, clears `booking_id`, `payment_intent_id`, `reserved_until`
- A system message is injected: "User has returned, their booking hold expired"
- Agent greets user and informs of expired hold, offers to re-reserve
- Agent does NOT present the expired QR code again

**Test:**
```python
async def test_state005_payment_expiry_recovery():
    session = payment_stage_session()
    session.reserved_until = datetime.utcnow() - timedelta(hours=1)  # expired
    
    # Save expired session
    await session_manager.save(session)
    
    # Reload (simulating reconnect)
    loaded = await session_manager.load(session.session_id)
    
    assert loaded.state == AgentState.BOOKING, \
        f"Expired payment session should recover to BOOKING, got: {loaded.state}"
    assert loaded.booking_id is None, \
        "booking_id should be cleared after hold expiry"
    assert loaded.payment_intent_id is None, \
        "payment_intent_id should be cleared after hold expiry"
```

---

### STATE-006
**Risk:** 🟡 High  
**Name:** Agent sends DISCOVERY questions in POST_BOOKING state  

**Precondition:** POST_BOOKING stage, user has confirmed booking

**Conversation:**
```
User: "What time does Angkor Wat open?"
```

**Expected behavior:**
- Agent answers the question (from knowledge: 5:00 AM)
- Agent stays in POST_BOOKING mode
- Agent does NOT ask "What kind of experience are you looking for?" or any discovery question

**Bug prediction:**  
Agent's state machine misfires and treats the question as a new session starting at DISCOVERY. It asks: "Hi! Are you planning a trip?" This is deeply confusing to a user who already has a confirmed booking.

**Test:**
```python
async def test_state006_no_discovery_in_post_booking():
    session = post_booking_session()
    
    response = await run_agent(session, "What time does Angkor Wat open?")
    
    # Must NOT ask discovery questions
    discovery_phrases = [
        "what kind of trip",
        "how many days",
        "what's your budget",
        "where are you departing from",
        "planning a trip"
    ]
    for phrase in discovery_phrases:
        assert phrase not in response['content'].lower(), \
            f"Agent asked discovery question in POST_BOOKING: '{phrase}'"
    
    # Must answer the actual question
    time_indicators = ["5", "AM", "open", "sunrise", "dawn"]
    assert any(t in response['content'] for t in time_indicators), \
        "Agent did not answer the question about Angkor Wat opening time"
```

---

### STATE-007
**Risk:** 🟡 High  
**Name:** BOOKING sub-step order violated — payment created before details collected

**Precondition:** CUSTOMIZATION stage, user says "Book it"

**Expected sequence:**
1. Show summary → ask "Shall I book this?"
2. Collect name → validate
3. Collect phone → validate
4. Collect pickup location → validate
5. Ask for special requests (optional)
6. Call `createBooking()`
7. Call `generatePaymentQR()`

**Bug prediction:**  
Agent skips step 1 (summary) and asks for name immediately. Or after collecting only name and phone, calls `createBooking()` before pickup location is collected. Tool call fails because `pickup_location` is required.

**Test:**
```python
async def test_state007_booking_substep_order():
    session = customization_done_session()
    
    # User confirms booking
    r1 = await run_agent(session, "Book it")
    assert "summary" in r1['content'].lower() or \
           "$" in r1['content'], \
        "Step 1: Agent must show booking summary first"
    assert not mock_create_booking.called
    
    # User confirms the summary
    r2 = await run_agent(session, "Yes, confirmed")
    assert "name" in r2['content'].lower(), \
        "Step 2: Agent must ask for name after confirmation"
    assert not mock_create_booking.called
    
    # User gives name
    r3 = await run_agent(session, "Chan Dara")
    assert "phone" in r3['content'].lower(), \
        "Step 3: Agent must ask for phone after name"
    assert not mock_create_booking.called
    
    # User gives phone
    r4 = await run_agent(session, "+855 12 345 678")
    assert "pickup" in r4['content'].lower() or \
           "pick" in r4['content'].lower(), \
        "Step 4: Agent must ask for pickup location after phone"
    assert not mock_create_booking.called
    
    # User gives pickup
    r5 = await run_agent(session, "Phnom Penh Airport Terminal 1")
    # Now createBooking may be called
    # (after optional special requests question)
```

---

### STATE-008 through STATE-020 — Additional State Tests

**STATE-008:** Concurrent messages from same session  
Two messages arrive within 100ms of each other from same user. Does the second message process with the correct updated state from the first? Or with stale state?

**STATE-009:** State = SUGGESTION after all 3 suggestions rejected  
User rejects all 3. State must go back to DISCOVERY (not stay at SUGGESTION). Discovery must ask ONE clarifying question.

**STATE-010:** State persists across service restart  
Kill and restart the AI agent service. Load a session. State should be exactly as before restart (loaded from Redis, not lost).

**STATE-011:** POST_BOOKING booking_ref accessible  
In POST_BOOKING, user asks "What's my booking number?" Agent must read `session.booking_ref` and answer. Does NOT call any tool for this.

**STATE-012:** State machine handles None state in Redis  
Redis returns a session with `state = None` (corrupted data). Session manager should default to DISCOVERY rather than crash.

**STATE-013:** Max tool calls per turn (safety limit = 10)  
If the agent somehow enters a loop calling 11 tools in one turn, the loop must break and return a graceful message. Not an infinite loop crash.

**STATE-014:** Discovery fields are not reset when user returns to discovery from SUGGESTION  
User sees suggestions, says "none of these", goes back to discovery, gets asked one clarifying question. Previously collected fields (mood, duration, people) must still be in session.

**STATE-015:** State during webhook-triggered transition  
Payment webhook arrives. Background task sets `state = POST_BOOKING`. If user sends a message at the exact same moment, which state wins for system prompt? Must not cause a race.

**STATE-016:** Booking stage: what if user provides all details in one message?  
```
User: "Book it. My name is Chan Dara, phone +855 12 345 678, pickup at PP Airport."
```
Agent should extract all three and call `createBooking()` rather than asking for each one separately.

**STATE-017:** EXPLORATION → SUGGESTION backward transition (user wants different options)  
User says "None of these options work. Show me different ones."  
State should go to DISCOVERY for one question, then re-call getTripSuggestions with updated params. Not stay in EXPLORATION.

**STATE-018:** POST_BOOKING user books another trip  
User says "I want to book another trip" in POST_BOOKING. Agent starts fresh discovery. All previous booking data (booking_id, trip_id, etc.) must be cleared from session.

**STATE-019:** Agent response type matches the current state  
At no point should a `trip_cards` message type appear when state is PAYMENT. At no point should a `payment_qr` message type appear when state is EXPLORATION. Response type must be valid for current state.

**STATE-020:** State label shown in debug mode  
For admin testing, an optional `?debug=true` WebSocket query param should return `"_debug_state": "PAYMENT"` in each response so QA can verify state without inspecting Redis.

---

## State Transition Truth Table

| From State | Trigger | Valid Next States | Invalid (Bug) |
|---|---|---|---|
| DISCOVERY | All 6 fields collected | SUGGESTION | BOOKING, PAYMENT |
| SUGGESTION | User selects a trip | EXPLORATION | BOOKING, PAYMENT |
| SUGGESTION | User rejects all | DISCOVERY | PAYMENT |
| EXPLORATION | User picks specific trip | CUSTOMIZATION | BOOKING |
| CUSTOMIZATION | User ready to book | BOOKING | PAYMENT |
| BOOKING | createBooking() success | PAYMENT | POST_BOOKING |
| PAYMENT | Payment webhook confirmed | POST_BOOKING | DISCOVERY |
| PAYMENT | Hold expired | BOOKING | DISCOVERY, POST_BOOKING |
| POST_BOOKING | User books again | DISCOVERY | PAYMENT |

**Any transition not in this table = bug to investigate.**