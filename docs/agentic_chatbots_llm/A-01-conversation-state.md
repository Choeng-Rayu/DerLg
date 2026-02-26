# DerLg.com AI Agent — Conversation State Machine

**File:** `agent/states.py` + `agent/transitions.py`

---

## 1. Overview

Every conversation with the AI agent is a **stateful journey**. The agent always knows which stage of the booking process the user is in, and it behaves differently at each stage.

There are 7 stages in the journey:

```
DISCOVERY → SUGGESTION → EXPLORATION → CUSTOMIZATION → BOOKING → PAYMENT → POST_BOOKING
```

States can move backwards. A user in BOOKING state can ask to change hotels, and the agent transitions back to EXPLORATION without losing any other data.

---

## 2. The ConversationState Model

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

class AgentState(str, Enum):
    DISCOVERY = "DISCOVERY"
    SUGGESTION = "SUGGESTION"
    EXPLORATION = "EXPLORATION"
    CUSTOMIZATION = "CUSTOMIZATION"
    BOOKING = "BOOKING"
    PAYMENT = "PAYMENT"
    POST_BOOKING = "POST_BOOKING"

class ConversationState(BaseModel):
    # Identity
    session_id: str
    user_id: Optional[str] = None          # None for unauthenticated preview chats
    preferred_language: str = "EN"          # "EN" | "KH" | "ZH"

    # Current stage
    state: AgentState = AgentState.DISCOVERY

    # --- Collected during DISCOVERY ---
    mood: Optional[str] = None
    environment: Optional[str] = None       # MOUNTAIN, BEACH, CITY, FOREST, ISLAND, TEMPLE
    duration_days: Optional[int] = None
    people_count: Optional[int] = None
    budget_min_usd: Optional[float] = None
    budget_max_usd: Optional[float] = None
    departure_city: Optional[str] = None
    travel_dates: Optional[dict] = None     # {"start": "2025-12-20", "end": "2025-12-22"}
    special_needs: Optional[str] = None     # Dietary, accessibility, etc.

    # --- Set during SUGGESTION ---
    suggested_trip_ids: list[str] = []

    # --- Set during EXPLORATION / CUSTOMIZATION ---
    selected_trip_id: Optional[str] = None
    selected_hotel_id: Optional[str] = None
    selected_vehicle_id: Optional[str] = None
    selected_guide_id: Optional[str] = None
    customizations: list[str] = []          # ["private_dinner", "hotel_upgrade"]
    applied_discount_code: Optional[str] = None
    loyalty_points_to_use: int = 0
    apply_student_discount: bool = False

    # --- Set during BOOKING ---
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    pickup_location: Optional[str] = None
    booking_special_requests: Optional[str] = None

    # --- Set during PAYMENT ---
    booking_id: Optional[str] = None
    booking_ref: Optional[str] = None
    payment_intent_id: Optional[str] = None
    payment_status: Optional[str] = None
    reserved_until: Optional[datetime] = None
    payment_attempts: int = 0

    # Conversation history (last 20 messages for context window)
    messages: list[dict] = []

    # Metadata
    created_at: datetime = datetime.utcnow()
    last_active: datetime = datetime.utcnow()
```

---

## 3. Stage-by-Stage Behavior

### Stage 1 — DISCOVERY

**Goal:** Collect all required information before suggesting any trips.

**Required fields:**
- `mood` — How the user is feeling (stressed, adventurous, romantic, curious, family)
- `environment` — The type of place they want (mountain, beach, city, temple...)
- `duration_days` — How many days for the trip
- `people_count` — How many people are traveling
- `budget_min_usd` and `budget_max_usd` — Their budget range
- `departure_city` — Where they are starting from

**Agent behavior:**
- Ask one question at a time. Never ask two questions in one message.
- If the user gives multiple answers at once, extract all and ask only about what's still missing.
- If the budget is vague ("not too expensive"), ask a clarifying question with anchors: "Are you thinking under $50, $50-$150, or $150+?"
- If the user gives conflicting signals ("I want luxury but my budget is $30"), surface the conflict: "Those two usually go in different directions — which matters more to you, the budget or the quality of experience?"
- Do NOT call `getTripSuggestions` until all 6 required fields are confirmed.

**Transition to SUGGESTION:** All 6 required fields are confirmed → call `getTripSuggestions` → present results → transition to SUGGESTION.

---

### Stage 2 — SUGGESTION

**Goal:** Present exactly 3 trip options and invite exploration.

**Agent behavior:**
- Always present exactly 3 options with different price tiers.
- Each option must have: emotional tagline, price, duration, top 3 highlights.
- After presenting, always invite exploration: "Would you like to see the itinerary, photos, hotel details, or compare these options?"
- Do NOT push for booking. Let the user explore.
- If the user says "none of these work," ask what specifically didn't fit and transition back to DISCOVERY for one clarifying question.

**Transition to EXPLORATION:** User shows interest in any option → transition to EXPLORATION.

---

### Stage 3 — EXPLORATION

**Goal:** Answer all the user's questions about the options.

**Agent behavior:**
- Dispatch the correct tool based on what the user asks.
- Multiple tools can be called in parallel if the user asks about two things at once (e.g., "Show me the hotel AND the weather").
- If the user selects a trip: set `selected_trip_id` in the session and transition to CUSTOMIZATION or directly to BOOKING.
- If the user asks about a place not in any package (e.g., "What about Kampot?"), treat it as an exploration question and provide information without triggering a booking flow.

**Tools commonly used in this stage:**
`getTripItinerary`, `getHotelDetails`, `getTripImages`, `getWeatherForecast`, `compareTrips`, `calculateCustomTrip`

---

### Stage 4 — CUSTOMIZATION

**Goal:** Personalize the selected trip.

**Agent behavior:**
- After each add-on, recalculate the total and present an updated summary.
- If a customization pushes the total over the user's stated budget, warn them: "Adding the private dinner brings the total to $360, which is above your $300 budget. Would you like to proceed anyway, or skip this add-on?"
- If the user applies a discount code, validate it immediately via tool call.
- If the user asks to negotiate price ("Can you give me a better deal?"), acknowledge their request warmly and offer alternatives: smaller group discount, removing an add-on, or applying a discount code if they have one.

**Transition to BOOKING:** User says "book it" / "I'm ready" / "let's do it" → transition to BOOKING.

---

### Stage 5 — BOOKING

**Goal:** Collect booking details and create the reservation.

**This stage has 3 mandatory sub-steps:**

**Sub-step 1: Confirmation**
Present a clear summary of everything being booked:
- Trip name
- Dates
- People count
- What is included
- Final total price (with all discounts applied)
- Ask: "Shall I go ahead and book this for you?"

**Sub-step 2: Collect Personal Details**
Collect the following fields one at a time (don't ask for all at once):
- Full name (`customer_name`)
- Phone number (`customer_phone`)
- Pickup location (`pickup_location`)
- Special requests (dietary, accessibility) — ask once, optional

Validate each field using `validateUserDetails` before proceeding.

**Sub-step 3: Create Reservation**
Call `createBooking()` only after all details are collected and confirmed. The returned `booking_id` and `reserved_until` are stored in the session. Transition to PAYMENT.

**The booking status is RESERVED, not CONFIRMED. Remind the user: "Your trip is reserved for 15 minutes — complete the payment to confirm your booking."**

---

### Stage 6 — PAYMENT

**Goal:** Guide the user through secure payment.

**Agent behavior:**
- Immediately call `generatePaymentQR()` and present the QR code.
- Do NOT generate a new QR unless the user reports a problem or the timer expires.
- If user asks "did it go through?" → call `checkPaymentStatus()`, never guess.
- If user says payment failed → acknowledge, call `generatePaymentQR()` for a new QR, increment `payment_attempts`.
- If `payment_attempts >= 3` → do not generate another QR. Instead: "It looks like we're having trouble with the payment. Let me connect you with our support team." Provide support contact.
- If QR timer expires (detected by comparing `reserved_until` to current time):
  - Show the user the booking has expired.
  - Offer to re-confirm and restart from BOOKING stage.
  - Reset `booking_id`, `payment_intent_id`, `reserved_until` in session.
  - Transition state back to BOOKING.

**Transition to POST_BOOKING:** Payment webhook confirmed (received via Redis pub/sub notification) → update `payment_status = "CONFIRMED"` → send success message → transition to POST_BOOKING.

---

### Stage 7 — POST_BOOKING

**Goal:** Be a helpful travel companion for the full trip lifecycle.

**Agent behavior:**
- The booking is confirmed. Act as ongoing customer support.
- Pro-actively offer: weather check before travel, packing tips, entry fee information, cultural etiquette reminders.
- Handle: cancellation requests (always check policy first), reschedule requests, refund status questions, add-on inquiries.
- Never initiate a refund without explicitly stating the refund amount and asking for confirmation.
- 24 hours before travel: the system automatically triggers a reminder message in this stage.

---

## 4. State Transitions Map

```
DISCOVERY
    ↓ (all 6 required fields collected)
SUGGESTION
    ↓ (user shows interest in an option)
EXPLORATION
    ↓ (user selects a trip)
CUSTOMIZATION
    ↓ (user ready to book)
BOOKING
    ↓ (reservation created)
PAYMENT
    ↓ (webhook confirms payment)
POST_BOOKING

Backward transitions:
SUGGESTION → DISCOVERY        (user wants different preferences)
EXPLORATION → DISCOVERY       (user wants to start over)
CUSTOMIZATION → EXPLORATION   (user wants to change selection)
BOOKING → EXPLORATION         (user wants to change hotel/guide)
BOOKING → CUSTOMIZATION       (user wants to add something)
PAYMENT → BOOKING             (QR expired — re-confirm)
```

---

## 5. Session Expiry and Recovery

Sessions are stored in Redis with a 7-day TTL. The TTL resets on every message.

### When a user returns after a long absence

1. Load session from Redis.
2. Check `state`.
3. If state is `PAYMENT`:
   - Check if `reserved_until < NOW()`.
   - If expired: inform the user and transition back to BOOKING.
   - If still valid: re-display the QR code and remaining time.
4. If state is `DISCOVERY` or `SUGGESTION`: resume normally.
5. If state is `POST_BOOKING`: resume as customer support.

### Session recovery message

When resuming a session after a gap:
> "Welcome back! Last time we were looking at [trip name]. Would you like to continue where we left off?"

Do not recap the entire conversation — just the key point of progress.
