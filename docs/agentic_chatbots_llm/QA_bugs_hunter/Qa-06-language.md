# QA-06 — Multi-Language Bug Tests

**Total tests:** 12  
**Key risk:** Language switching mid-conversation breaks state, Khmer rendering causes parse errors, tool responses in wrong language mixed into chat

---

## Background

DerLg supports English, Khmer, and Chinese. The agent must detect language from the user's message, respond in the correct language, and keep tool call parameters in English regardless of the conversation language. Mixing languages in a single response is acceptable only for technical terms (booking refs, USD, brand names). Everything else must be consistent.

---

## TEST CASES

---

### LANG-001
**Risk:** 🔴 CRITICAL  
**Name:** Tool call parameters sent in Khmer/Chinese when backend expects English

**Precondition:** User is chatting in Khmer. All discovery fields collected.

**Conversation (in Khmer):**
```
User: ខ្ញុំចង់ទៅដំណើរកម្សាន្ត ១០ ថ្ងៃ ទៅ សៀមរាប ២ នាក់ ថ្លៃ $200
(Translation: "I want a 10-day trip to Siem Reap, 2 people, budget $200")
```

**Expected behavior:**
- `getTripSuggestions` is called with English parameters:
  ```json
  { "environment": "TEMPLE", "duration_days": 10, "people_count": 2, "language": "KH" }
  ```
- NOT with Khmer parameters like `"environment": "ប្រាសាទ"` which the backend cannot parse

**Bug prediction:**  
When the system prompt is in Khmer mode, Claude interprets "fill the tool input in Khmer" and sends `"environment": "ហ្គូ"` or a Khmer word. Backend schema validation fails. Tool returns 422 error. User gets an error message in the middle of planning their trip.

**Test:**
```python
async def test_lang001_tool_params_always_in_english():
    session = fresh_session()
    session.preferred_language = "KH"
    
    # Provide all 6 fields in Khmer
    await run_agent(session, "ខ្ញុំចង់ទៅដំណើរកម្សាន្ត ៣ ថ្ងៃ ដំណើរ romantic ២ នាក់ $100-200 ចេញពីភ្នំពេញ")
    
    # Inspect the actual tool call
    if mock_suggest.called:
        call_input = mock_suggest.call_args[0][0]  # first positional arg
        
        # All enum fields must be English strings
        valid_environments = ["MOUNTAIN", "BEACH", "CITY", "FOREST", "ISLAND", "TEMPLE"]
        assert call_input.get('environment') in valid_environments, \
            f"Tool received non-English environment: {call_input.get('environment')}"
        
        # Duration and count must be integers, not Khmer numerals
        assert isinstance(call_input.get('duration_days'), int), \
            f"duration_days not integer: {call_input.get('duration_days')}"
        assert isinstance(call_input.get('people_count'), int), \
            f"people_count not integer: {call_input.get('people_count')}"
```

---

### LANG-002
**Risk:** 🔴 CRITICAL  
**Name:** Language switch mid-conversation not applied to next response

**Precondition:** Conversation has been in English for 5 turns. User switches to Chinese.

**Conversation:**
```
Turn 6 — User: "我想用中文聊天" (I want to chat in Chinese)
Turn 7 — Agent response: ???
```

**Expected behavior:**
- Agent's Turn 7 response is entirely in Chinese
- System prompt is rebuilt with `preferred_language = "ZH"` for Turn 7 onward
- `session.preferred_language` is updated to "ZH"
- Tool calls from Turn 7 include `language: "ZH"` parameter

**Bug prediction:**  
System prompt is built at the START of the WebSocket connection and not rebuilt per message. Language switch request is acknowledged in English ("Sure, I'll switch to Chinese!") but the next response is still in English because the cached system prompt still says EN.

**Test:**
```python
async def test_lang002_language_switch_applies_immediately():
    session = exploration_stage_session()
    session.preferred_language = "EN"
    
    # Turn 1: Switch language request
    r1 = await run_agent(session, "我想用中文聊天")
    
    # Session language must be updated
    assert session.preferred_language == "ZH", \
        f"Language not updated in session: {session.preferred_language}"
    
    # Turn 2: Next message should be fully Chinese
    r2 = await run_agent(session, "介绍一下行程")  # "Introduce the itinerary"
    
    # Response should contain Chinese characters
    has_chinese = any('\u4e00' <= c <= '\u9fff' for c in r2['content'])
    assert has_chinese, \
        f"Agent responded in non-Chinese after language switch: {r2['content'][:100]}"
    
    # Should NOT contain long English sentences
    english_sentences = [s for s in r2['content'].split('.') if len(s) > 20 and s.isascii()]
    assert len(english_sentences) == 0, \
        f"Agent used English sentences after Chinese switch: {english_sentences}"
```

---

### LANG-003
**Risk:** 🟡 High  
**Name:** Booking reference remains in correct format across all languages

**Precondition:** Booking confirmed in Chinese session

**Expected behavior:**
- Booking reference is always displayed as "DLG-2025-0042" (English alphanumeric)
- NOT translated or converted to Chinese characters
- NOT shown as "订单号：DLG-二零二五-零零四二"

**Test:**
```python
async def test_lang003_booking_ref_always_english():
    session = post_booking_session()
    session.preferred_language = "ZH"
    session.booking_ref = "DLG-2025-0042"
    
    response = await run_agent(session, "我的订单号是什么?")
    
    assert "DLG-2025-0042" in response['content'], \
        "Booking reference not present in English format in Chinese response"
    
    # Should NOT appear in any translated form
    chinese_ref_patterns = ["二零", "零零", "四二"]
    for pattern in chinese_ref_patterns:
        assert pattern not in response['content'], \
            f"Booking reference appears to be translated to Chinese: found '{pattern}'"
```

---

### LANG-004
**Risk:** 🟡 High  
**Name:** Khmer numerals cause integer parsing failure

**Precondition:** Agent asking "How many days?" in Khmer session

**Conversation:**
```
User: ៣ ថ្ងៃ  (Khmer numeral for "3 days")
```

**Expected behavior:**
- Agent correctly parses Khmer numeral ៣ as integer 3
- `session.duration_days = 3`

**Bug prediction:**  
Khmer numeral ៣ (U+17E3) is not a standard digit. `int("៣")` raises `ValueError`. If not handled, session duration stays None and agent asks the question again — potentially in a loop.

**Test:**
```python
@pytest.mark.parametrize("khmer_input,expected_days", [
    ("១ ថ្ងៃ", 1),     # 1 day
    ("៣ ថ្ងៃ", 3),     # 3 days
    ("១០ ថ្ងៃ", 10),   # 10 days
    ("ពីរ​សប្ដាហ៍", 14), # "two weeks"
])
async def test_lang004_khmer_numerals_parsed(khmer_input, expected_days, khmer_session):
    response = await run_agent(khmer_session, khmer_input)
    
    assert khmer_session.duration_days == expected_days, \
        f"Failed to parse Khmer input '{khmer_input}'. " \
        f"Expected {expected_days}, got {khmer_session.duration_days}"
    
    # Agent must NOT ask about duration again
    duration_questions = ["ថ្ងៃ", "days", "how many"]
    assert not any(q in response['content'].lower() for q in duration_questions), \
        "Agent re-asked about duration after Khmer numeral was provided"
```

---

### LANG-005
**Risk:** 🟡 High  
**Name:** Mixed language response — Chinese body with English error message injected

**Precondition:** Chinese session, tool call fails

**Expected behavior:**
- Error is communicated in Chinese: "我无法找到相关行程，请稍后再试。"
- NOT: agent responds in Chinese then appends English error: "Sorry, an error occurred: Tool execution failed"

**Bug prediction:**  
The tool executor's error messages are hardcoded in English. When the error is fed back to Claude as a tool_result, Claude sometimes quotes the English error directly in its otherwise-Chinese response. User sees a jarring English error embedded in Chinese text.

**Test:**
```python
async def test_lang005_error_messages_in_user_language():
    session = exploration_stage_session()
    session.preferred_language = "ZH"
    
    # Force a tool failure
    mock_itinerary.return_value = {
        "success": False,
        "error": {
            "code": "TRIP_NOT_FOUND",
            "message": "Trip not found in database"  # English error
        }
    }
    
    response = await run_agent(session, "给我看行程")
    
    # Response must NOT contain raw English error message
    raw_error = "Trip not found in database"
    assert raw_error not in response['content'], \
        "English error message leaked into Chinese response"
    
    # Response should be in Chinese
    has_chinese = any('\u4e00' <= c <= '\u9fff' for c in response['content'])
    assert has_chinese, "Error response is not in Chinese"
```

---

### LANG-006
**Risk:** 🟡 High  
**Name:** System prompt language injection not rebuilding on every message

**Precondition:** Fresh session

**Test approach:** Inspect the system prompt passed to Claude API on turns 1, 5, and 10. The language section should always reflect the CURRENT `session.preferred_language`, not the language from when the session started.

```python
async def test_lang006_system_prompt_rebuilt_per_message():
    session = fresh_session()
    session.preferred_language = "EN"
    
    captured_prompts = []
    original_create = anthropic_client.create_message
    
    async def capture_prompt(system, messages, tools, **kwargs):
        captured_prompts.append(system)
        return await original_create(system, messages, tools, **kwargs)
    
    with patch.object(anthropic_client, 'create_message', side_effect=capture_prompt):
        await run_agent(session, "I want a beach trip")  # Turn 1: EN
        
        session.preferred_language = "ZH"  # Simulate switch
        
        await run_agent(session, "我要看行程")  # Turn 2: ZH
    
    # Turn 1 prompt should mention English
    assert "English" in captured_prompts[0] or "EN" in captured_prompts[0]
    
    # Turn 2 prompt should mention Chinese
    assert "Chinese" in captured_prompts[1] or \
           "ZH" in captured_prompts[1] or \
           "中文" in captured_prompts[1], \
        "System prompt not updated after language switch"
```

---

### LANG-007
**Risk:** 🟢 Medium  
**Name:** Automatic language detection from message content

**Precondition:** Session starts with `preferred_language = "EN"` (default)

**Conversation:**
```
User (first message): "我想去柬埔寨旅游" (Chinese — I want to travel to Cambodia)
```

**Expected behavior:**
- Agent auto-detects Chinese from the message
- Updates `session.preferred_language = "ZH"`
- Responds in Chinese
- Does NOT respond in English just because the session default was EN

**Test:**
```python
@pytest.mark.parametrize("first_message,expected_lang", [
    ("I want to go to Cambodia", "EN"),
    ("我想去柬埔寨", "ZH"),
    ("ខ្ញុំចង់ទៅកម្ពុជា", "KH"),
    ("Je veux aller au Cambodge", "EN"),  # French → fallback to EN
])
async def test_lang007_auto_detect_language(first_message, expected_lang):
    session = fresh_session()
    session.preferred_language = "EN"  # Default
    
    response = await run_agent(session, first_message)
    
    assert session.preferred_language == expected_lang, \
        f"Expected language {expected_lang} for input '{first_message[:30]}', " \
        f"got {session.preferred_language}"
```

---

### LANG-008 through LANG-012 — Additional Language Tests

**LANG-008:** Phone number validation accepts Cambodian format in any language  
User in Chinese session enters "+855 12 345 678". `validateUserDetails` must accept this regardless of UI language.

**LANG-009:** Khmer text in booking confirmation email  
When `preferred_language = "KH"`, the confirmation email template must render in Khmer. Test that email body contains Khmer characters (Unicode range 0x1780–0x17FF).

**LANG-010:** Festival discount code language-independent  
Code "WATER15" works regardless of whether user types it in the middle of a Chinese, Khmer, or English conversation. `applyDiscountCode` receives the code as ASCII string.

**LANG-011:** Push notification language matches profile preference  
After booking, the 24-hour reminder push notification text should be in `user.preferred_language`. If user is "ZH", notification is in Chinese. Test by verifying the `NotificationsService.send()` call receives the correct language parameter.

**LANG-012:** Agent handles mixed-script input gracefully  
```
User: "I want 3 ថ្ងៃ trip" (English + Khmer mixed)
```
Agent should parse 3 days, respond gracefully (in English since majority is English), and not crash on the Khmer word in the middle of an otherwise English sentence.

---

## Language Bug Summary

| Test | Language Pair | Bug Type | Severity |
|---|---|---|---|
| LANG-001 | KH/ZH → EN | Tool params in wrong language | 🔴 Critical |
| LANG-002 | EN → ZH | Language switch not applied | 🔴 Critical |
| LANG-003 | ZH | Booking ref translated | 🟡 High |
| LANG-004 | KH | Khmer numerals unparsed | 🟡 High |
| LANG-005 | ZH | English error in Chinese response | 🟡 High |
| LANG-006 | Any | System prompt not rebuilt | 🟡 High |
| LANG-007 | Any → detected | Auto-detect fails | 🟢 Medium |
| LANG-008 | ZH | Phone validation rejects valid format | 🟢 Medium |
| LANG-009 | KH | Email in wrong language | 🟢 Medium |
| LANG-010 | Any | Discount code not ASCII | 🟢 Medium |
| LANG-011 | ZH | Notification in wrong language | 🟢 Medium |
| LANG-012 | Mixed | Mixed-script crash | 🟢 Medium |