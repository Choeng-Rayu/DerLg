# QA-05 — Session & Memory Bug Tests

**Total tests:** 14  
**Key risk:** Session data lost on reconnect, stale data from previous session bleeding into new conversation, Redis TTL not reset on activity, message history truncation breaking context

---

## Background

The agent's memory is entirely stored in Redis as a serialized `ConversationState` object. If anything goes wrong with serialization, TTL management, or session loading, the user experiences a conversation that "forgets" things, asks repeat questions, or worse — loads another user's data. These bugs are subtle because they often happen intermittently (only when Redis is slow or a session is near its TTL boundary).

---

## TEST CASES

---

### MEM-001
**Risk:** 🔴 CRITICAL  
**Name:** Session loads with corrupted/partial JSON from Redis

**Precondition:** Redis returns a partial JSON string (mid-write crash scenario)
```
{"session_id":"abc","user_id":"user-1","state":"PAYMENT","booking_id":
```
(truncated)

**Expected behavior:**
- `session_manager.load()` catches the JSON parse error
- Returns `None` (treat as new session)
- Agent starts fresh DISCOVERY with greeting
- Error is logged to Sentry with session_id and raw payload

**Bug prediction:**  
`json.loads()` raises `JSONDecodeError`. No try/catch in `load()`. WebSocket handler crashes. User gets disconnected and sees nothing — not even an error message.

**Test:**
```python
async def test_mem001_corrupted_redis_json_handled():
    # Inject corrupted JSON directly into Redis
    await redis_client.set(
        "session:corrupted-test",
        '{"session_id":"corrupted-test","state":"PAYMENT","booking_id":'  # truncated
    )
    
    # Load should not raise, should return None
    result = await session_manager.load("corrupted-test")
    assert result is None, \
        "load() should return None for corrupted JSON, not raise exception"
    
    # WebSocket should handle None gracefully (start fresh)
    # Verify error was logged
    assert mock_sentry_capture.called, "Corrupted session error not sent to Sentry"
```

---

### MEM-002
**Risk:** 🔴 CRITICAL  
**Name:** Redis TTL not reset on active conversation

**Setup:** Session was created 6 days ago. TTL = 7 days. User sends a message today.

**Expected behavior:**
- Every time `session_manager.save()` is called, TTL resets to 7 days
- An active user NEVER loses their session because of TTL expiry
- Only truly inactive sessions (no messages for 7 days) expire

**Bug prediction:**  
`save()` uses `redis.set()` (no TTL) instead of `redis.setex()` (with TTL). On first save, TTL is set to 7 days. On subsequent saves, TTL is removed. Session never expires → Redis memory grows unbounded. OR: TTL is fixed at creation time, not reset on activity. User mid-PAYMENT stage (day 6 of 7) loses session.

**Test:**
```python
async def test_mem002_ttl_reset_on_every_save():
    session = ConversationState(session_id="ttl-test", user_id="user-1")
    
    # First save
    await session_manager.save(session)
    ttl_after_first = await redis_client.ttl("session:ttl-test")
    assert 604700 < ttl_after_first <= 604800, \
        f"TTL after first save: {ttl_after_first}s (expected ~7 days)"
    
    # Simulate 1 day passing
    await redis_client.expire("session:ttl-test", 518400)  # set to 6 days
    
    # Second save (user sends a message)
    await session_manager.save(session)
    ttl_after_second = await redis_client.ttl("session:ttl-test")
    
    # TTL must be RESET back to 7 days, not continue counting from 6
    assert ttl_after_second > 600000, \
        f"TTL not reset after save: {ttl_after_second}s — session will expire on active user"
```

---

### MEM-003
**Risk:** 🟡 High  
**Name:** Message history truncation removes critical context

**Setup:** Conversation has 25 messages. Only last 20 are sent to Claude API.

**Critical message at position 3 (will be truncated):**
```
User [msg 3]: "My pickup is Phnom Penh International Airport Terminal 1"
Agent [msg 4]: "Got it — PP Airport Terminal 1. ✓"
```

**Current message (25):**
```
User: "What time should I be at the pickup point?"
```

**Expected behavior:**
- Agent answers based on the confirmed pickup location: "Your driver will meet you at Phnom Penh International Airport Terminal 1. For a 4:30 AM departure, we recommend being there by 4:15 AM."

**Bug prediction:**  
Pickup location is in messages 3–4, which were truncated. Claude API doesn't see it. Agent says: "Could you remind me — where is your pickup location?" User is frustrated: they already gave this info.

**Partial fix:** Pickup location is stored in `session.pickup_location`. The session context block is injected into the system prompt on EVERY message. So even if the chat history is truncated, the pickup location is still available via the system prompt context block.

**Test:**
```python
async def test_mem003_truncated_history_uses_session_context():
    session = post_booking_session()
    session.pickup_location = "Phnom Penh International Airport Terminal 1"
    
    # Fill history with 22 messages (so pickup msgs are truncated)
    session.messages = generate_dummy_messages(22)
    # Pickup was mentioned in messages 3-4 (now truncated)
    
    response = await run_agent(
        session, 
        "What time should I be at the pickup point?"
    )
    
    # Agent must answer with the correct pickup location
    assert "Airport" in response['content'] or "Terminal 1" in response['content'], \
        "Agent lost pickup location context after history truncation"
    
    # Agent must NOT ask for pickup location again
    assert "where" not in response['content'].lower() or \
           "pickup" not in response['content'].lower(), \
        "Agent asked for pickup location that's already in session context"
```

---

### MEM-004
**Risk:** 🟡 High  
**Name:** Previous session data bleeds into new session

**Setup:** User clears sessionStorage (opens new tab). New `session_id` is generated. Agent starts fresh. However, the previous `session_id` still exists in Redis.

**Bug prediction:**  
A bug in `session_manager.create()` loads the LAST session from Redis rather than truly starting fresh. User 2 in a completely different context starts a new conversation and sees data from a previous session (e.g., a trip they didn't select, a booking_id from a different trip).

**Test:**
```python
async def test_mem004_new_session_id_always_fresh():
    # Create and save an existing session with rich data
    old_session = ConversationState(
        session_id="old-session-111",
        user_id="user-old",
        state=AgentState.PAYMENT,
        booking_id="booking-old-999",
        selected_trip_id="trip-angkor"
    )
    await session_manager.save(old_session)
    
    # Load a completely new session_id (simulates new browser tab)
    new_session = await session_manager.load("brand-new-session-222")
    
    # Must be None (fresh start)
    assert new_session is None, \
        "New session_id returned data from a different session"
    
    # Create fresh session
    new_session = ConversationState(session_id="brand-new-session-222")
    assert new_session.booking_id is None
    assert new_session.state == AgentState.DISCOVERY
    assert new_session.selected_trip_id is None
```

---

### MEM-005
**Risk:** 🟡 High  
**Name:** Session fields not deserialized correctly (type mismatch)

**Precondition:** Session saved with `reserved_until = datetime(2025, 12, 20, 10, 30, 0)`. Redis stores as ISO string: `"2025-12-20T10:30:00"`.

**Bug prediction:**  
When deserializing, `reserved_until` is loaded as a plain string, not a `datetime` object. Code that compares `datetime.utcnow() > session.reserved_until` throws `TypeError: '>' not supported between instances of 'datetime' and 'str'`. Agent crashes mid-conversation.

**Test:**
```python
async def test_mem005_datetime_fields_deserialize_correctly():
    session = payment_stage_session()
    session.reserved_until = datetime(2025, 12, 20, 10, 30, 0)
    session.created_at = datetime(2025, 12, 18, 8, 0, 0)
    
    # Save and reload
    await session_manager.save(session)
    loaded = await session_manager.load(session.session_id)
    
    # Fields must be datetime objects, not strings
    assert isinstance(loaded.reserved_until, datetime), \
        f"reserved_until loaded as {type(loaded.reserved_until)}, expected datetime"
    assert isinstance(loaded.created_at, datetime), \
        f"created_at loaded as {type(loaded.created_at)}, expected datetime"
    
    # Comparison must work without error
    try:
        is_expired = datetime.utcnow() > loaded.reserved_until
    except TypeError as e:
        pytest.fail(f"Datetime comparison failed after deserialization: {e}")
```

---

### MEM-006
**Risk:** 🟡 High  
**Name:** Tool result messages not preserved correctly in session.messages

**Precondition:** Tool call made, result stored in `session.messages` as assistant tool_use + tool_result

**Expected behavior:**
- `session.messages[-20:]` sent to Claude API preserves the tool_use / tool_result format
- Claude correctly interprets previous tool results as context

**Bug prediction:**  
When serializing `session.messages` to JSON, the nested structure of `tool_use` content blocks (which have `type`, `id`, `name`, `input` sub-fields) gets flattened or stripped. On reload, Claude receives malformed message history and either errors or ignores past tool context.

**Test:**
```python
async def test_mem006_tool_result_messages_preserved():
    session = exploration_stage_session()
    
    # Simulate a tool call and result in message history
    session.messages.append({
        "role": "assistant",
        "content": [{
            "type": "tool_use",
            "id": "toolu_01",
            "name": "getTripSuggestions",
            "input": {"mood": "romantic", "environment": "BEACH"}
        }]
    })
    session.messages.append({
        "role": "user",
        "content": [{
            "type": "tool_result",
            "tool_use_id": "toolu_01",
            "content": '{"success": true, "data": {"trips": [...]}}'
        }]
    })
    
    # Save and reload
    await session_manager.save(session)
    loaded = await session_manager.load(session.session_id)
    
    # Check the tool_use block is intact
    tool_use_msg = loaded.messages[-2]
    assert isinstance(tool_use_msg['content'], list), \
        "tool_use content flattened to string during serialization"
    assert tool_use_msg['content'][0]['type'] == 'tool_use', \
        "tool_use type lost during serialization"
    assert tool_use_msg['content'][0]['id'] == 'toolu_01'
```

---

### MEM-007
**Risk:** 🟡 High  
**Name:** Agent repeats questions from truncated message history

**Precondition:** Long conversation (30+ messages). First 10 messages are truncated from API call.

**Scenario — truncated messages included:**
- [Msg 2] Agent: "What's your budget?"
- [Msg 3] User: "$150 per person"
- [Msg 4] Agent: "Great, $150/person noted."

**Current message (visible to API):**
- [Msg 25] User: "Actually wait, what's my total going to be?"

**Bug prediction:**  
Agent doesn't see msgs 2-4. Budget is in `session.budget_max_usd = 150` (session context). But agent ignores the session context block and re-asks: "I don't see your budget — could you remind me?"

**Fix test:**
```python
async def test_mem007_session_context_fills_truncation_gaps():
    session = customization_stage_session()
    session.budget_max_usd = 150
    session.people_count = 2
    # Fill 25 messages so budget exchange is truncated
    session.messages = [
        *generate_dummy_messages(24),
        {"role": "user", "content": "Actually wait, what's my total going to be?"}
    ]
    
    response = await run_agent(session, "Actually wait, what's my total going to be?")
    
    # Agent must NOT ask for budget again
    repeat_questions = ["what's your budget", "remind me", "budget again", "how much per person"]
    for phrase in repeat_questions:
        assert phrase not in response['content'].lower(), \
            f"Agent re-asked a question whose answer is in session context: '{phrase}'"
```

---

### MEM-008 through MEM-014 — Additional Memory Tests

**MEM-008:** `session.messages` list grows unbounded  
If no truncation is applied before saving, a 100-message conversation creates a massive Redis entry. Test that `session.messages` is trimmed to 50 before saving (last 50 kept, older ones summarized or discarded).

**MEM-009:** Session ID collision (two different users get same UUID)  
Extremely unlikely but test that `uuid4()` generation for session IDs is truly unique across 10,000 concurrent test sessions.

**MEM-010:** Redis connection lost mid-save  
Simulate Redis connection drop during `session_manager.save()`. WebSocket must not crash. User receives their agent response. Next message triggers a re-save attempt. Error is logged.

**MEM-011:** `session.suggested_trip_ids` populated but trips no longer available  
User returned to SUGGESTION stage after 2 weeks. Old `suggested_trip_ids` are still in session. Agent re-presents old trips (which may be sold out or price-changed). Fix: re-call `getTripSuggestions` when resuming SUGGESTION after a long gap.

**MEM-012:** User_id changes within same session (auth re-login)  
User was a guest (user_id=None), then logged in mid-conversation (user_id="user-123"). Session must update `user_id` to the authenticated ID. All subsequent tool calls use the authenticated user_id.

**MEM-013:** `session.payment_attempts` counter persists across re-bookings  
User's first trip fails payment 2 times. They re-book a different trip. Payment attempt counter should reset to 0 for the new booking, not continue from 2 (which would block them after just 1 more failure).

**MEM-014:** Agent summary injection for very old sessions  
User returns after 5 days. First 100 messages are discarded from Redis (only last 50 kept). Agent must inject a "Earlier summary" block into system prompt: "Earlier in this conversation, we discussed [trip name], [destination], and established [key preferences]." Not just truncate and pretend those messages never happened.