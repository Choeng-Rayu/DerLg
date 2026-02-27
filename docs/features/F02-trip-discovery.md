# F02 — Trip Discovery & Smart Suggestions

**Feature Name:** Trip Discovery & Smart Suggestions  
**Short Description:** A mood-based and preference-based trip browsing system that helps users find the right Cambodia package — both through the AI chat and through the manual Browse screen.

---

## Why This Feature Exists

Travelers arrive at DerLg.com with a feeling, not a destination. "I'm exhausted and need a break." "We want something adventurous." "The kids need to stay entertained." The Trip Discovery feature translates that feeling into concrete trip options — using mood, environment preference, budget, duration, and group size as inputs, not just search keywords.

---

## User Stories

> **As a stressed professional**, I want to describe my mood and get trip suggestions that match how I feel, so I don't have to research destinations myself.

> **As a budget traveler**, I want to filter trips by my exact price range, so I don't waste time looking at packages I can't afford.

> **As a group organizer**, I want to find trips that work for a group of 10 people, so I can book one package that fits everyone.

> **As a curious user**, I want to browse trips by category (beach, temple, jungle) before starting the AI chat, so I can get inspiration first.

> **As a repeat visitor**, I want to see trips to different provinces I haven't been to yet, so I can explore more of Cambodia.

---

## Feature Scope

Trip Discovery works through **two entry points**:

1. **Via AI Chat (F01)** — conversational, AI asks questions and returns cards
2. **Via Browse Screen** — manual browsing with filters (this document focuses on this)

---

## User Flow — Browse Screen

### Entry Point
- User taps the **"Booking"** tab in the bottom navigation
- Or taps a **province card** from the Home screen
- Or taps **"Explore our trips"** from any destination page

---

### Screen 1 — Booking Landing Page

**What the user sees:**

```
┌──────────────────────────────────┐
│  Find Your Trip          🌐  🔔  │
├──────────────────────────────────┤
│  [Search bar: "Search trips..."] │
├──────────────────────────────────┤
│  How are you feeling?            │
│  😌 Relaxed  🏄 Adventure        │
│  💑 Romantic  🧐 Curious         │
│  👨‍👩‍👧 Family   🎉 Festival          │
├──────────────────────────────────┤
│  Browse by type:                 │
│  [🛕 Temples] [🏖️ Beach]          │
│  [🌿 Nature]  [🏙️ City]           │
│  [🏔️ Mountain][🏝️ Island]         │
├──────────────────────────────────┤
│  Featured Trips                  │
│  ┌────────────┐ ┌─────────────┐  │
│  │ [photo]    │ │ [photo]     │  │
│  │ Angkor 2D  │ │ Beach 3D    │  │
│  │ ★4.9 $89/p │ │ ★4.8 $139/p│  │
│  └────────────┘ └─────────────┘  │
│  (2-column card grid, scrollable)│
└──────────────────────────────────┘
```

**Mood selector behavior:**
- Tapping a mood emoji pill filters the trip grid below
- Selected mood is highlighted (bold border, filled background)
- Multiple moods can be selected at once
- Changing mood instantly refilters without page reload

**Environment type behavior:**
- Tapping a type (e.g., "Beach") scrolls the grid and filters simultaneously
- Active type is highlighted
- Can combine mood + type (e.g., Romantic + Beach)

---

### Screen 2 — Trip List with Filters

When user taps a mood or environment type, the page scrolls to the trip grid.

**Filter bar (sticky, stays at top while scrolling):**

```
Filters: [All] [Under $100] [$100-$200] [2 days] [3 days] [Siem Reap ▼]
         Sort: [Most Popular ▼]
```

**Trip card (each card in the grid shows):**
- Destination photo (full bleed, 16:9)
- Province tag (top-left badge, e.g., "Siem Reap")
- Bookmarked/save icon (top-right heart icon)
- Trip name
- Duration + people badge ("2 Days • Up to 20 people")
- Short emotional tagline in italic
- Star rating + review count
- "From $89/person" price
- "View Details" button

**Empty state:** If no trips match the filters, show:
- Illustration of a temple with clouds
- Message: "No trips found for this combination."
- "Try the AI — it can suggest something custom" button → opens chat

---

### Screen 3 — Trip Detail Page

User taps "View Details" on any trip card.

**What the user sees (scrollable page from top to bottom):**

**Section A — Hero**
- Full-width destination photo carousel (swipeable, shows 4–6 photos)
- Province name + environment type badge overlaid on photo
- Average rating stars + "142 reviews"

**Section B — Key Info Strip**
```
[ 🕐 3 Days ]  [ 👥 Max 20 ]  [ ⭐ 4.8 ]  [ 💰 From $139/p ]
```

**Section C — What's Included / Excluded**
Two columns:
```
✅ Included              ❌ Not Included
   AC Van transport         Flight tickets
   Hotel 2 nights           Entry fees to Angkor
   Daily breakfast          Personal expenses
   English-speaking guide
   Private dinner (add-on)
```

**Section D — Highlights**
3–5 bullet points with icons:
```
🌅 Watch sunrise over Angkor Wat
🗺️ Explore Bayon temple hidden faces
🌿 Walk through jungle ruins of Ta Prohm
🚤 Sunset cruise on Tonle Sap lake
```

**Section E — Day-by-Day Itinerary**
Collapsible accordion:
```
▼ Day 1 — Arrival & Sunset (tap to expand)
  4:30 AM  Pickup from your hotel in Siem Reap
  5:00 AM  Arrive at Angkor Wat for sunrise
  7:30 AM  Breakfast at local restaurant
  ...

▶ Day 2 — Jungle Temples (collapsed, tap to expand)
▶ Day 3 — Departure (collapsed)
```

**Section F — Hotel Preview**
- Hotel thumbnail photo
- Hotel name + star rating
- Top 3 amenities (pool, WiFi, breakfast)
- "View hotel details" → opens hotel detail modal

**Section G — Transport Details**
- Vehicle type with photo (e.g., Toyota Hiace Van)
- AC / Seats / Luggage space info

**Section H — Reviews**
- Overall rating breakdown (5 stars: 78%, 4 stars: 16%, ...)
- 3 most recent reviews with user photo, name, country flag, and text
- "See all 142 reviews" link

**Section I — Similar Trips**
Horizontal scroll of 3 related trip cards

**Section J — Sticky Bottom Bar (always visible)**
```
[ From $139/person ]  [ Book via Chat ]  [ Book Now ]
```

- "Book via Chat" → opens AI chat with this trip pre-selected ("I want to book the Angkor Sunrise package")
- "Book Now" → opens the manual booking form flow

---

### Screen 4 — Manual Booking Flow (Non-AI Path)

For users who prefer to book without the chat.

**Step 1 — Select Dates**
- Calendar picker: select check-in date
- Calendar auto-selects end date based on trip duration
- Unavailable dates are greyed out
- Price changes based on date (festival periods show premium pricing)

**Step 2 — Select Group Size**
- Number spinner: 1 to 50 people
- Price updates in real time as spinner changes

**Step 3 — Select Add-ons**
Checklist of available add-ons with prices:
```
☐ Private dinner          +$30/person
☐ Hotel upgrade (4-star)  +$25/night
☐ Sunset cruise           +$20/person
☐ English-speaking guide  +$40/day
☐ Airport transfer        +$15/way
```

**Step 4 — Review Summary & Price**
Line-item price breakdown:
```
Base trip (2 people × 3 days)    $278
Private dinner (×2)              +$60
Discount code (SUMMER10)         -$33
─────────────────────────────────────
Total                            $305
```

"Apply discount code" text field + "Apply" button

**Step 5 → Checkout**
Tapping "Proceed to Checkout" continues to the Payment screen (F08).

---

## UI Elements Summary

| Element | Behavior |
|---|---|
| Mood pills | Tap to filter trip grid (multi-select allowed) |
| Environment type icons | Tap to filter, tap again to deselect |
| Trip card | Tap anywhere to open detail page |
| Heart icon | Save trip to favorites (requires login) |
| Itinerary accordion | Tap day to expand/collapse |
| Add-on checkboxes | Tick to add, price updates instantly |
| Sticky "Book Now" bar | Always visible at bottom of detail page |
| "Book via Chat" button | Hands off to AI with context pre-loaded |

---

## Acceptance Criteria

- User can reach a trip detail page in maximum 3 taps from the Home screen
- Filter combinations update the trip list without a full page reload
- Price on the booking summary matches the final price shown at checkout (no surprises)
- Empty state is shown (not an error) when no trips match filters
- "Book via Chat" passes trip context to the AI so user doesn't have to repeat trip name
