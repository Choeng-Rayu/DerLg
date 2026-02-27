# F01 — AI Travel Concierge Chat

**Feature Name:** AI Travel Concierge Chat  
**Short Description:** A conversational AI assistant that guides users from travel planning through booking and payment — entirely through chat.

---

## Why This Feature Exists

Most travelers planning a trip to Cambodia feel overwhelmed. They don't know where to start — which province, which temples, what budget is realistic, which transport is best. DerLg's AI chat removes that friction. Instead of browsing menus and filling forms, the user just talks. The AI handles the rest: asking the right questions, presenting real options, collecting booking details, and generating a payment link — all inside one conversation.

---

## User Stories

> **As a solo traveler**, I want to describe what kind of trip I'm in the mood for, so the AI can suggest the right package without me having to browse dozens of options.

> **As a Chinese tourist**, I want to chat in Chinese and receive responses in Chinese, so I don't have to struggle with an English-only interface.

> **As a family traveler**, I want to tell the AI my group size and budget, so it only shows me packages that actually fit.

> **As a returning user**, I want to pick up my conversation where I left off, so I don't have to repeat myself if I close the app.

> **As a user in PAYMENT stage**, I want to see a QR code inside the chat so I can pay without leaving the conversation.

---

## Feature Scope

The AI chat handles the **entire booking journey** in 7 stages:

| Stage | What happens |
|---|---|
| 1. Discovery | AI learns what the user wants (mood, budget, duration, group size) |
| 2. Suggestion | AI presents 3 trip options as interactive cards |
| 3. Exploration | AI answers questions about specific options (itinerary, hotel, weather) |
| 4. Customization | AI adjusts the trip (add private dinner, upgrade hotel, apply discount code) |
| 5. Booking | AI collects user details and confirms the booking summary |
| 6. Payment | AI generates a QR code and guides through payment |
| 7. Post-Booking | AI becomes a travel companion (reminders, cancellation, questions) |

---

## User Flow — Full Journey

### Entry Points
- Tapping the **floating AI button** (robot icon) visible on every screen
- Tapping **"Start Chat"** on the Home screen AI card
- Tapping **"Ask AI for recommendations"** from the Explore screen

### Step 1 — Landing in Chat

User opens the chat screen for the first time.

**What the user sees:**
- Full-screen chat interface (no bottom navigation bar — chat owns the screen)
- Back arrow in the top-left corner to return to the previous screen
- A greeting message from "Dara" (the AI's name) in the user's preferred language
- English: *"Hi! I'm Dara, your Cambodia travel guide 🌴 Are you planning a trip? Tell me what kind of experience you're looking for and I'll find the perfect package for you."*
- Khmer: Same message in Khmer
- Chinese: Same message in Chinese
- A blinking cursor in the text input at the bottom

### Step 2 — Discovery Conversation

The AI asks one question at a time. Never two questions in the same message.

**Example flow:**

```
Dara: "Hi! I'm Dara, your Cambodia travel guide 🌴 
       What kind of trip are you dreaming of?"

User: "Something relaxing, I'm really stressed lately"

Dara: "A relaxing escape sounds perfect. 
       Do you prefer the beach, the jungle, ancient temples, 
       or a quiet city?"

User: "Beach"

Dara: "Love it! How many days are you thinking?"

User: "3 days"

Dara: "And how many people are traveling?"

User: "Just me and my partner — 2 people"

Dara: "What's your budget per person? 
       Under $100, $100–$200, or above $200?"

User: "Around $150 each"

Dara: "Last one — where are you departing from?"

User: "Phnom Penh"

Dara: "Perfect, let me find your ideal options! ✨"
```

**UI behavior during Discovery:**
- Each AI message appears with a smooth slide-in from the left
- User messages slide in from the right
- After each user message, a typing indicator ("...") appears for 1–3 seconds before the AI responds
- Quick reply chips appear above the input bar for common answers (e.g., after asking environment: chips for "Beach 🏖️", "Temple 🛕", "Jungle 🌿", "City 🏙️")
- Tapping a chip sends that answer automatically without typing

### Step 3 — Trip Suggestion Cards

After collecting all information, the AI presents 3 options as interactive cards inside the chat.

**What the user sees:**
A horizontal scroll row of 3 trip cards, each showing:
- Full destination photo
- Trip name (e.g., "Sihanoukville Romantic Escape")
- Emotional tagline in italics (e.g., *"Barefoot mornings and sunset dinners"*)
- Duration badge (e.g., "3 Days")
- Price badge (e.g., "From $139/person")
- Star rating
- Two buttons: **"Details"** and **"Book This"**

Below the cards, the AI adds a text message:
*"Here are 3 options tailored for you. Would you like to see the itinerary, photos, hotel details, or compare them side by side?"*

Quick reply chips: **"See Itinerary"**, **"View Photos"**, **"Compare Options"**, **"Different budget"**

### Step 4 — Exploration

User taps "See Itinerary" for Option 1.

**What the user sees:**
A collapsible day-by-day itinerary card appears in the chat:

```
Day 1 — Arrival & Sunset
  Morning:   Arrive in Sihanoukville. Check in to Ocean View Hotel.
  Afternoon: Rest and settle in. Optional swim at Otres Beach.
  Evening:   Sunset dinner at local seafood restaurant. ★ Meal included

Day 2 — Beach & Exploration
  Morning:   Breakfast included. Snorkeling trip to Koh Rong island.
  Afternoon: Free time on the beach.
  Evening:   Private candlelit dinner (add-on available).

Day 3 — Departure
  Morning:   Breakfast. Check out.
  Afternoon: Return transport to Phnom Penh.
```

Each day row is expandable (tap to expand/collapse). The AI adds a contextual note below the card.

User then asks: *"What's the hotel like?"*

A hotel details card appears:
- Hotel photo gallery (swipeable)
- Hotel name, star rating, amenities icons (WiFi, pool, AC, breakfast)
- Room options and photos

User asks: *"Will it rain?"*

A 7-day weather card appears inside the chat:
- Horizontal scroll of daily forecasts
- Weather icon + high/low temp + rain chance bar for each day
- Today highlighted
- AI comment: *"Good news — December is Cambodia's dry season. Expect sunshine with very low rain chance."*

### Step 5 — Customization

User: *"Can we add the private dinner? And I have a discount code."*

**What the user sees:**
- AI confirms the add-on: *"Private candlelit dinner added! That's $30 extra for 2 people."*
- AI asks for the code: *"Sure! What's your discount code?"*
- User types the code
- AI validates it and shows:

```
✅ Code applied: BEACH20
   Original total:   $278
   Discount (10%):  -$28
   New total:        $250
```

An updated booking summary card appears with the new price breakdown.

### Step 6 — Booking Confirmation

User: *"Let's book it!"*

**Step 6a — Summary confirmation**

A booking summary card appears:
```
📋 Booking Summary
   Trip:        Sihanoukville Romantic Escape
   Dates:       Dec 20–22, 2025
   People:      2
   Hotel:       Ocean View Hotel (2 nights)
   Transport:   AC Van from Phnom Penh
   Add-ons:     Private dinner
   Discount:    BEACH20 (-10%)
   ─────────────────────────────
   Total:       $250 (2 people)
```

AI asks: *"Does everything look right? Shall I go ahead and book this?"*

User: *"Yes, book it"*

**Step 6b — Collect personal details (one at a time)**

```
Dara: "Great! What name should I put on the booking?"
User: "Chan Dara"

Dara: "And your phone number so the driver can reach you?"
User: "+855 12 345 678"

Dara: "Where should we pick you up?"
User: "Phnom Penh International Airport, Terminal 1"

Dara: "Any special requests? (dietary needs, accessibility, etc.) 
       — or just say 'none'"
User: "Vegetarian meals please"
```

**UI behavior:** Each question appears one at a time. No form, no fields. Pure conversation.

**Step 6c — Booking created**

A confirmation banner appears:
```
⏳ Trip Reserved!
   Booking Ref: DLG-2025-0042
   You have 15 minutes to complete payment.
```

### Step 7 — Payment QR

A payment QR code card appears inside the chat:

```
┌────────────────────────────┐
│   Scan to Pay              │
│                            │
│   [ QR CODE IMAGE ]        │
│                            │
│   Amount: $250.00          │
│   ≈ 1,025,000 KHR          │
│   ≈ ¥1,812                 │
│                            │
│   ⏱ 14:32 remaining        │
│   Booking: DLG-2025-0042   │
└────────────────────────────┘
   "Problem scanning? Tap here"
```

- Countdown timer counts down in real time (turns red when under 2 minutes)
- Currency toggle: tap to switch between USD / KHR / CNY display
- "Problem scanning?" link sends a help message to the AI

User scans QR with their banking app and confirms payment.

### Step 8 — Payment Confirmed

A celebration card appears:

```
🎉 Booking Confirmed!
   DLG-2025-0042

   Sihanoukville Romantic Escape
   Dec 20–22, 2025 • 2 people

   ⭐ 500 loyalty points earned!

   [ View in My Trips ]   [ Share Itinerary ]
```

Confetti animation plays. The AI sends a warm message:
*"You're all set! Your trip is confirmed and you've earned 500 points 🎉 Is there anything else you'd like to know before your trip?"*

### After Booking — Post-Trip Support

In subsequent conversations, the AI continues in "Post-Booking" mode:

- *"What should I pack?"* → AI gives Cambodia-specific packing advice
- *"What's the weather like?"* → AI calls the weather tool and shows forecast
- *"I need to cancel"* → AI explains the refund policy and amount before confirming
- *"Can I change my pickup time?"* → AI checks and updates the booking

---

## Edge Cases & Handling

| Situation | What happens |
|---|---|
| User says "just surprise me" | AI picks the single most important missing question and asks that first |
| Budget is very vague ("not too expensive") | AI offers 3 anchor ranges: "Under $50 / $50–$150 / above $150?" |
| User rejects all 3 options | AI asks ONE question: "What didn't quite fit — price, destination, or duration?" and re-searches |
| QR timer expires (user was away) | AI informs user, offers to re-reserve same trip immediately |
| Payment fails after 3 attempts | AI stops generating QRs, provides human support contact |
| User types in Khmer mid-English conversation | AI switches to Khmer from that message onward |
| User asks something unrelated (e.g., "write me a poem") | AI gently redirects: "I'm best at Cambodia travel — shall we get back to your trip?" |

---

## UI Elements Summary

| Element | Location | Behavior |
|---|---|---|
| Chat screen | Full screen | Replaces bottom nav bar |
| AI Floating Button | All main screens | Pulsing animation on first visit |
| Message bubbles | Chat area | AI = left/blue, User = right/brand color |
| Typing indicator | Chat area | "..." dots while AI is responding |
| Quick reply chips | Above input bar | Context-sensitive, tap to send |
| Trip cards | Inline in chat | Horizontal scroll, 3 cards |
| Itinerary card | Inline in chat | Expandable day rows |
| Weather card | Inline in chat | Horizontal scroll, 7 days |
| QR code card | Inline in chat | Live countdown timer |
| Booking confirmed card | Inline in chat | Confetti animation |
| Language toggle | Top bar | Instantly switches AI response language |
