# QA-01 — Discovery Stage Bug Tests

**Stage:** DISCOVERY (Stage 1 of 7)  
**Total tests:** 18  
**Key risk:** Agent calling getTripSuggestions before all 6 fields are confirmed

---

## Background

The Discovery stage must collect exactly 6 fields before calling any tool:
1. Mood
2. Environment (MOUNTAIN/BEACH/CITY/FOREST/ISLAND/TEMPLE)
3. Duration (days)
4. People count
5. Budget (min + max)
6. Departure city

The most common bugs in this stage are:
- Agent assumes a field from context instead of asking
- Agent asks two questions at once
- Agent calls getTripSuggestions with missing or null fields
- Agent gets confused when user answers a question not yet asked

---

## TEST CASES

---

### DISC-001
**Risk:** 🔴 Critical  
**Name:** Tool called with partial fields  

**Precondition:** Fresh session, state = DISCOVERY

**Conversation:**
```
User: "I want a 3-day beach trip for 2 people from Phnom Penh"
```

**Expected behavior:**
- Agent extracts: environment=BEACH, duration=3, people=2, departure=Phnom Penh
- Agent recognizes that mood and budget are STILL MISSING
- Agent asks ONE question: "What kind of mood are you in for this trip?" OR "What's your budget per person?"
- Agent does NOT call getTripSuggestions yet

**Bug prediction:**  
Agent sees 4 of 6 fields and short-circuits — calls `getTripSuggestions` with `mood=null` and `budget_usd=null`, causing a tool validation error or worse, getting results with wrong assumptions.

**How to detect:**  
Check LangGraph trace: does `execute_tools` node appear before all 6 fields are in session?

**Fix direction:**  
In `prompts/stages/discovery.py`, add explicit guard:
```
"NEVER call getTripSuggestions if ANY of these are missing or null:
mood, environment, duration_days, people_count, budget_usd.min, budget_usd.max, departure_city.
Check the session context block — if any field shows 'None', do not call the tool."
```

---

### DISC-002
**Risk:** 🔴 Critical  
**Name:** Budget assumed from vague language  

**Precondition:** All fields except budget collected

**Conversation:**
```
User: "Something not too expensive"
```

**Expected behavior:**
- Agent asks a clarifying question with anchors: "Are you thinking under $50, $50–$150, or above $150 per person?"
- Agent does NOT set budget to an assumed value like $100
- Agent does NOT call getTripSuggestions with a guessed budget

**Bug prediction:**  
Agent interprets "not too expensive" as a specific value (e.g., $80) and proceeds. This produces suggestions outside what the user can afford, leading to frustration and distrust.

**How to detect:**  
Check session after agent response: `session.budget_min_usd` and `session.budget_max_usd` should still be `None` after this message. If they have a value, the agent assumed.

**Fix direction:**  
System prompt must explicitly state:
```
"Vague budget expressions like 'cheap', 'not too much', 'affordable' are NOT valid budget values.
Ask for a specific range using anchors: Under $50 / $50–$150 / above $150."
```

---

### DISC-003
**Risk:** 🟡 High  
**Name:** Two questions asked in a single response  

**Precondition:** Only mood collected so far

**Conversation:**
```
User: "I'm feeling adventurous"
```

**Expected behavior:**
- Agent asks exactly ONE next question — either about environment OR duration, NOT both
- Response contains only one "?" or one clear question

**Bug prediction:**  
Agent asks: "Great! And where would you like to go — jungle, mountain, or beach? Also, how many days are you thinking?"  
This violates the one-question rule and overwhelms users, especially when the app is in Khmer or Chinese.

**How to detect:**  
Count "?" characters in agent response. More than one = test FAIL.  
Also check for "Also,", "And how", "Another question" — multi-question patterns.

**Fix direction:**  
System prompt rule: `"Ask EXACTLY ONE question per response. Count your question marks before sending."`

---

### DISC-004
**Risk:** 🟡 High  
**Name:** Out-of-order answer not captured  

**Precondition:** Agent just asked "How many days?"

**Conversation:**
```
User: "By the way my budget is $200 each, and I'm going with my wife so just 2 people. Oh and I was thinking 5 days."
```

**Expected behavior:**
- Agent extracts ALL THREE pieces of information: budget=$200, people=2, duration=5
- Agent updates session with all three values
- Agent asks the NEXT missing question (environment or mood), not questions about fields already answered

**Bug prediction:**  
Agent only registers the last answer (duration=5) and ignores budget and people_count. It then asks about budget or people count again on the next turn, making the user feel unheard.

**How to detect:**  
After this message, check session:
- `session.budget_max_usd` == 200 ✓
- `session.people_count` == 2 ✓
- `session.duration_days` == 5 ✓
All three must be set. If any are `None`, the agent failed to extract.

**Fix direction:**  
In the discovery prompt, add: `"When the user provides multiple pieces of information in one message, extract ALL of them. Update the session context for every field mentioned, not just the last one."`

---

### DISC-005
**Risk:** 🟡 High  
**Name:** Conflicting requirements not surfaced  

**Precondition:** Budget set to $30/person, now user says:

**Conversation:**
```
User: "I want a luxury 5-star resort experience"
```

**Expected behavior:**
- Agent recognizes the conflict: $30 budget vs luxury resort
- Agent surfaces the conflict clearly: "A 5-star resort typically starts around $120–200/night, which is quite a bit above your $30 budget. Which matters more to you — staying within $30, or having the luxury experience?"
- Agent does NOT silently pick one and proceed
- Agent does NOT call getTripSuggestions with impossible requirements

**Bug prediction:**  
Agent tries to be agreeable and calls `getTripSuggestions` with environment=TEMPLE/BEACH and budget_max=$30, which returns no results or falsely labeled "luxury" trips. User is confused by the mismatch.

**How to detect:**  
When `budget_max_usd < 50` and the user mentions words like "luxury", "5-star", "VIP", "premium" — agent must ask the clarifying conflict question, not call the tool.

---

### DISC-006
**Risk:** 🟡 High  
**Name:** Very large group not handled  

**Precondition:** Fresh session

**Conversation:**
```
User: "I'm planning a trip for my school group, about 45 students"
```

**Expected behavior:**
- Agent acknowledges the large group: sets `people_count = 45`
- Agent continues discovery (still needs mood, environment, budget, duration, departure)
- When presenting transport suggestions later, the 45-seat bus appears
- Agent mentions student discount possibility

**Bug prediction:**  
Agent fails to set `people_count = 45` (number parsing error on "45 students"). Or it sets it but the budget calculation is done per-person without notifying the user of the large total (e.g., $89/person × 45 = $4,005 total — needs explicit mention).

---

### DISC-007
**Risk:** 🟢 Medium  
**Name:** User answers question that wasn't asked yet  

**Precondition:** Agent just asked "What mood are you in?"

**Conversation:**
```
User: "Let's go to the beach for 4 days"
```

**Expected behavior:**
- Agent extracts environment=BEACH, duration=4
- Agent does NOT ask about environment or duration again
- Agent asks about mood (the original question the user didn't answer)

**Bug prediction:**  
Agent accepts the beach/4-day info and moves on without collecting mood. It then calls `getTripSuggestions` with `mood=null`. Or it asks "What mood are you in?" AND "How many people?" in the same message.

---

### DISC-008
**Risk:** 🔴 Critical  
**Name:** All fields given in opening message — tool NOT called too early  

**Precondition:** Fresh session

**Conversation:**
```
User: "I want a romantic 3-day beach trip for 2 people, budget $150-200 each, leaving from Phnom Penh next week"
```

**Expected behavior:**
- Agent extracts ALL 6 fields: mood=romantic, environment=BEACH, duration=3, people=2, budget=$150-200, departure=Phnom Penh
- Agent IMMEDIATELY calls getTripSuggestions (no more questions needed)
- Agent presents 3 trip suggestions
- Agent does NOT ask unnecessary questions like "How many people?" when user already said "2 people"

**Bug prediction (opposite of DISC-001):**  
Agent still asks clarifying questions even though all 6 fields are present. This creates unnecessary friction and makes the AI feel slow and unhelpful.

**How to detect:**  
No questions should appear after this message. Agent response should be trip cards.

---

### DISC-009
**Risk:** 🟡 High  
**Name:** "Surprise me" handling  

**Precondition:** Fresh session

**Conversation:**
```
User: "Just surprise me, I don't care where we go"
```

**Expected behavior:**
- Agent does NOT call getTripSuggestions with all nulls
- Agent asks ONE most-impactful missing question (usually environment or duration)
- Agent says something like: "Happy to surprise you! One quick thing — do you prefer nature, beach, or ancient temples? That helps me pick the best option."

**Bug prediction:**  
Agent treats "I don't care" as permission to fill in arbitrary values and calls `getTripSuggestions(mood="curious", environment="TEMPLE", duration=2, ...)` with assumed values. Results are random and don't match what user actually enjoys.

---

### DISC-010
**Risk:** 🟡 High  
**Name:** Numeric duration extraction edge cases  

**Precondition:** Agent asks "How many days?"

**Conversation variants to test:**
```
User A: "a weekend"          → should extract duration=2
User B: "about a week"       → should ask "5, 7 days?" (ambiguous)
User C: "half a day"         → should extract duration=0.5 or ask "just one day?"
User D: "two or three days"  → should ask "2 or 3? Just so I get the right options"
User E: "as long as possible" → should ask "What's the maximum days you have?"
```

**Bug prediction:**  
"a weekend" → agent asks again (parsing fails)  
"about a week" → agent assumes 7 and proceeds  
"half a day" → agent tries to set duration=0.5 and crashes (integer validation)

---

### DISC-011
**Risk:** 🟢 Medium  
**Name:** Departure city unrecognized  

**Precondition:** Agent asks "Where are you departing from?"

**Conversation:**
```
User: "I'm coming from Guangzhou"
```

**Expected behavior:**
- Agent recognizes Guangzhou as a valid departure city (for international tourists)
- Agent sets `departure_city = "Guangzhou"`
- Agent notes that international flight to Phnom Penh/Siem Reap will be needed but is not included in DerLg packages

**Bug prediction:**  
Agent only recognizes Cambodian cities. Guangzhou causes confusion and agent re-asks the departure question, or worse, errors on the tool call because `departure_city` must be a Cambodian city.

---

### DISC-012
**Risk:** 🔴 Critical  
**Name:** Unauthenticated user reaches booking stage  

**Precondition:** User is NOT logged in (guest session), all discovery fields collected

**Expected behavior:**
- After all fields collected, before calling getTripSuggestions, agent checks if `session.user_id` is None
- If guest, agent STILL shows trip suggestions
- When user says "Book this" — agent says: "To complete this booking, you'll need to create an account or log in first. It only takes a minute! [Link to register]"
- Agent does NOT call `createBooking()` without a user_id

**Bug prediction:**  
`createBooking()` is called with `user_id=None`, causing a backend validation error. The error response is not handled gracefully — agent either crashes or gives a confusing message.

---

### DISC-013 through DISC-018 — Additional Discovery Edge Cases

**DISC-013:** User provides budget in KHR ("ប្រហែល 200,000 រៀល")  
→ Agent must convert to USD (~$50) or ask "Is that around $50 USD?"

**DISC-014:** User provides budget in CNY ("大概500块")  
→ Agent must convert to USD (~$68) or ask for USD equivalent

**DISC-015:** User says "I already know I want Angkor Wat — just book it"  
→ Agent should clarify: still needs dates, people, budget before booking is possible

**DISC-016:** User types only emojis ("🏖️ 🌅 2⃣ 👫")  
→ Agent should interpret: beach, sunrise (morning preference), 2 days, couple — and confirm interpretation

**DISC-017:** User changes a previously given field ("Actually, make it 4 days not 3")  
→ Agent must UPDATE session.duration_days = 4, not keep the old value of 3

**DISC-018:** User asks discovery question in a different language than the UI language  
→ If UI is set to English but user types in Chinese, agent should respond in Chinese from that point forward

---

## Discovery Stage Test Matrix

| Test | Precondition | Input Type | Expected Outcome | Pass Criteria |
|---|---|---|---|---|
| DISC-001 | 4/6 fields known | Partial info | Ask for missing field | No tool call until 6/6 fields |
| DISC-002 | 5/6 (missing budget) | Vague budget | Ask with anchors | No assumed budget value |
| DISC-003 | 1/6 fields known | Single answer | One question back | ≤1 "?" in response |
| DISC-004 | 3/6 fields known | Multi-field answer | Extract all, ask next | All 3 fields in session |
| DISC-005 | Budget=$30, asking env | Luxury request | Surface conflict | No tool call with conflicting fields |
| DISC-006 | Fresh | 45-person group | Set count=45 | people_count=45 in session |
| DISC-007 | Asked mood | Answered env+duration | Extract both, ask mood | No repeat questions |
| DISC-008 | Fresh | All 6 fields in 1 msg | Call tool immediately | Suggestions appear, no questions |
| DISC-009 | Fresh | "surprise me" | Ask ONE question | No tool call with null fields |
| DISC-010 | Asked duration | Ambiguous duration | Clarify or parse correctly | No integer crash |

---

## Automated Test Script Pattern

```python
# tests/test_discovery_stage.py

import pytest
import asyncio
from agent.core.agent import run_agent
from agent.states.conversation_state import ConversationState, AgentState

@pytest.fixture
def fresh_session():
    return ConversationState(
        session_id="test-001",
        user_id="user-123",
        state=AgentState.DISCOVERY
    )

class TestDiscoveryStage:

    @pytest.mark.asyncio
    async def test_disc001_partial_fields_no_tool_call(self, fresh_session, mock_tool_executor):
        """DISC-001: Agent should NOT call tool with 4/6 fields"""
        response = await run_agent(
            fresh_session,
            "I want a 3-day beach trip for 2 people from Phnom Penh"
        )
        # Verify tool was NOT called
        assert mock_tool_executor.called == False, \
            "getTripSuggestions was called before budget and mood were collected"
        
        # Verify missing fields are still None
        assert fresh_session.budget_min_usd is None
        assert fresh_session.mood is None
        
        # Verify agent asked exactly one question
        question_marks = response['content'].count('?')
        assert question_marks <= 1, \
            f"Agent asked {question_marks} questions, expected 1"

    @pytest.mark.asyncio
    async def test_disc002_vague_budget_not_assumed(self, fresh_session, mock_tool_executor):
        """DISC-002: Vague budget should trigger clarifying question, not assumption"""
        # Pre-fill 5/6 fields
        fresh_session.mood = "relaxed"
        fresh_session.environment = "BEACH"
        fresh_session.duration_days = 3
        fresh_session.people_count = 2
        fresh_session.departure_city = "Phnom Penh"
        
        response = await run_agent(fresh_session, "something not too expensive")
        
        # Budget must NOT be set
        assert fresh_session.budget_min_usd is None, \
            "Agent assumed a budget value from vague input"
        assert fresh_session.budget_max_usd is None, \
            "Agent assumed a budget value from vague input"
        
        # Tool must NOT be called
        assert mock_tool_executor.called == False
        
        # Response must contain budget anchors
        anchors = ["$50", "$100", "$150", "under", "above", "range"]
        assert any(a in response['content'] for a in anchors), \
            "Agent did not provide budget anchor options"

    @pytest.mark.asyncio
    async def test_disc003_single_question_rule(self, fresh_session):
        """DISC-003: Agent must ask exactly one question per response"""
        fresh_session.mood = "adventurous"  # only mood collected
        
        response = await run_agent(fresh_session, "I'm feeling adventurous")
        
        question_marks = response['content'].count('?')
        assert question_marks == 1, \
            f"Agent asked {question_marks} questions. Must be exactly 1."
        
        # Also check for multi-question phrases
        bad_phrases = ["Also,", "And how", "One more thing", "Additionally"]
        for phrase in bad_phrases:
            assert phrase not in response['content'], \
                f"Agent used multi-question phrase: '{phrase}'"

    @pytest.mark.asyncio
    async def test_disc008_all_fields_immediate_suggestion(self, fresh_session, mock_tool_executor):
        """DISC-008: All 6 fields in one message should trigger tool call immediately"""
        response = await run_agent(
            fresh_session,
            "I want a romantic 3-day beach trip for 2 people, budget $150-200 each, leaving from Phnom Penh"
        )
        
        # All fields must be extracted
        assert fresh_session.mood == "romantic"
        assert fresh_session.environment == "BEACH"
        assert fresh_session.duration_days == 3
        assert fresh_session.people_count == 2
        assert fresh_session.budget_min_usd == 150
        assert fresh_session.budget_max_usd == 200
        assert fresh_session.departure_city == "Phnom Penh"
        
        # Tool MUST have been called
        assert mock_tool_executor.called == True, \
            "Agent did not call getTripSuggestions when all 6 fields were provided"
        
        # Response type must be trip_cards
        assert response['type'] == 'trip_cards', \
            f"Expected trip_cards response, got: {response['type']}"
```