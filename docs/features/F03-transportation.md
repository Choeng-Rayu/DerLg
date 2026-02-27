# F03 — Transportation Booking

**Feature Name:** Transportation Booking  
**Short Description:** Users can browse and book vans, buses, and tuk tuks for inter-city and local travel in Cambodia.

---

## Why This Feature Exists

Getting around Cambodia without a tour package is confusing — renting a local tuk tuk, finding a reliable van to Siem Reap, or booking a 45-seat bus for a school group. DerLg centralizes all transport options in one place: clear vehicle photos, honest pricing, availability calendar, and instant booking confirmation.

---

## User Stories

> **As a couple**, I want to book a private AC van from Phnom Penh to Siem Reap, so we travel comfortably without sharing with strangers.

> **As a school group coordinator**, I want to book a 45-seat bus with a week's advance notice, so I can transport 40 students safely.

> **As a solo traveler staying in Siem Reap**, I want to hire a tuk tuk for the day to explore temples, so I have flexible transport without committing to a full tour package.

> **As a business traveler**, I want to book a premium Alphard van for an airport pickup, so I arrive to my meeting in comfort.

> **As a traveler on a budget**, I want to see exactly what's included (driver, fuel, AC) before I pay, so there are no surprises at the end.

---

## Vehicle Types

| Category | Models | Capacity | Best For |
|---|---|---|---|
| Standard Van | Toyota Starex | 6–8 people | Small families, friend groups |
| Comfort Van | Toyota Hiace | 8–12 people | Mid-size groups, longer trips |
| VIP Van | Toyota Alphard | 6–7 people | Business travelers, honeymoon couples |
| Mini Bus | 25-seat bus | Up to 25 people | Medium groups, school trips |
| Full Bus | 45-seat bus | Up to 45 people | Large groups, corporate events |
| Tuk Tuk | Standard Tuk Tuk | 2–4 people | Local sightseeing, short trips |

---

## User Flow

### Entry Points
- Tapping **"Transport"** icon on Home screen category grid
- Tapping **"Book Transport"** in the Booking tab
- AI chat directing user to select a vehicle

---

### Screen 1 — Transport Landing

```
┌──────────────────────────────────┐
│  Transport             🌐  🔔    │
├──────────────────────────────────┤
│  [From: Phnom Penh          ▼ ] │
│  [To:   Siem Reap           ▼ ] │
│  [Date: Dec 20, 2025        📅] │
│  [Passengers:  2            ±  ] │
│  [        Search Transport      ]│
├──────────────────────────────────┤
│  Popular Routes                  │
│  ┌──────────┐ ┌──────────┐       │
│  │PP → SR   │ │PP → SHV  │       │
│  │~3.5 hrs  │ │~4 hrs    │       │
│  │From $25  │ │From $22  │       │
│  └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐       │
│  │PP → Kep  │ │SR → BTB  │       │
│  │~3 hrs    │ │~2.5 hrs  │       │
│  │From $30  │ │From $20  │       │
│  └──────────┘ └──────────┘       │
└──────────────────────────────────┘
```

**Route selector behavior:**
- "From" and "To" fields open a searchable dropdown of Cambodia provinces/cities
- Popular pairings appear as quick-tap cards (skip the dropdown)
- Date picker: minimum date is tomorrow (same-day booking only for tuk tuks)
- Passenger count updates available vehicle options

---

### Screen 2 — Vehicle Results

After tapping "Search Transport":

```
┌──────────────────────────────────┐
│  ← Phnom Penh → Siem Reap        │
│  Dec 20 • 2 passengers           │
├──────────────────────────────────┤
│  Filter: [All] [Van] [Bus] [Tuk] │
│  Sort:   [Price ▼]               │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │ [Vehicle photo]            │  │
│  │ Toyota Starex — Standard   │  │
│  │ ★ 4.7  |  AC  |  6 seats   │  │
│  │ ✅ Available Dec 20        │  │
│  │ $65 total  ($32.50/person) │  │
│  │ [ View Details ] [Book Now]│  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ [Vehicle photo]            │  │
│  │ Toyota Alphard — VIP       │  │
│  │ ★ 4.9  |  AC  |  7 seats   │  │
│  │ ✅ Available Dec 20        │  │
│  │ $120 total ($60/person)    │  │
│  │ [ View Details ] [Book Now]│  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ [Vehicle photo]            │  │
│  │ 45-seat Bus — Group        │  │
│  │ ★ 4.6  |  AC  |  45 seats  │  │
│  │ ✅ Available Dec 20        │  │
│  │ $280 total ($7/person)     │  │
│  │ [ View Details ] [Book Now]│  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**Availability badge:**
- Green "✅ Available Dec 20" — confirmed available
- Orange "⚠️ Only 1 left on Dec 20" — urgency indicator
- Red "❌ Unavailable — pick another date" — greyed out card with date change prompt

**Price display:**
- Total price AND per-person price shown
- For group bookings (25/45-seat bus): total only

---

### Screen 3 — Vehicle Detail

User taps "View Details" on Toyota Starex.

**What the user sees:**

**Header:**
- Swipeable photo gallery (exterior, interior, luggage space, driver area)
- Vehicle name + category badge

**Info strip:**
```
[ 🚗 6 Seats ]  [ ❄️ AC ]  [ 🧳 Luggage OK ]  [ ⭐ 4.7 ]
```

**Route & Duration section:**
```
📍 Phnom Penh → Siem Reap
⏱ Estimated: 5–6 hours
🛣️ National Road 6
```

**What's included:**
```
✅ Professional driver
✅ Air conditioning
✅ Fuel and tolls
✅ Water bottles (2 per person)
✅ 1 stop at roadside rest area
❌ Meals not included
❌ Entrance fees not included
```

**Price breakdown:**
```
Route rate (flat):   $65 total
Per person:          $32.50 each
Min group:           1 person
Max group:           6 people
```

**About the Driver section:**
- Driver profile photo + name
- Languages spoken
- Years experience
- Average rating from past bookings
- *(Note: Driver is assigned after booking — section shows "Your driver will be assigned 24 hours before pickup")*

**Reviews:**
- 4 recent reviews from past passengers
- Shows rating, date, route traveled, comment

**Availability calendar:**
- Month view
- Green dots = available dates
- Red dots = booked/unavailable
- User can tap a different date to check availability without going back

**Sticky bottom bar:**
```
[ $65 total — Dec 20, 2 people ]  [ Confirm & Book ]
```

---

### Screen 4 — Booking Form

User taps "Confirm & Book."

**What the user sees:**
A simple form (not a long multi-page wizard):

```
Booking Details

  Pick-up location:
  [ Phnom Penh International Airport, Terminal 1    ]
  ✏️ Tap to change

  Drop-off location:
  [ Pub Street, Siem Reap                           ]
  ✏️ Tap to change

  Pick-up time:
  [ 08:00 AM    ▼ ]

  Contact name:
  [ ________________________ ]

  Contact phone:
  [ ________________________ ]

  Special requests (optional):
  [ ________________________ ]

  Apply discount code:
  [ _____________ ] [Apply]

  Use loyalty points: [OFF ○]
  (You have 820 points = $8.20 off)

─────────────────────────────────
  Subtotal:        $65.00
  Discount:         -$0.00
  Total:           $65.00
─────────────────────────────────

  [   Continue to Payment   ]
```

**Pickup location:**
- Text field with autocomplete (Google Places suggestions)
- Preset quick-select options: "Airport", "Bus Station", "Hotel" → tapping opens a sub-field for hotel name
- Location pin icon → tap to use current GPS location

**Pickup time:**
- Dropdown: 30-minute intervals from 5:00 AM to 10:00 PM
- If route is very long (>6 hours), shows "Recommended departure: before 7:00 AM" hint

---

### Tuk Tuk — Special Flow

Tuk tuks work differently from vans and buses. They are booked differently:

**What's different:**
- Tuk tuks are for **same-day** and **next-day** only (not advance booking weeks out)
- Priced **per km** (not a flat route rate)
- Driver contact is shared immediately after booking (no 24-hour wait)
- Duration is flexible — can book for "half day" (4 hours) or "full day" (8 hours)

**Tuk Tuk booking form:**
```
  Start location: [ Your current location (GPS) ]
  
  Booking type:
  ○ Half day (4 hours)    $12
  ○ Full day (8 hours)    $20
  ○ Per destination       $5/stop estimated

  Planned stops (optional):
  + Add a stop (e.g., Angkor Wat, Ta Prohm...)

  Contact name: [____________]
  Contact phone: [____________]

  Driver contact will be shared immediately after booking.
```

After booking, driver's phone number and photo appears:
```
Your Tuk Tuk Driver
[ Driver photo ]  Sok Dara
                  ☎ +855 12 XXX XXX
                  [  Call Driver  ]  [  WhatsApp  ]
```

---

## Cancellation Policy (shown to user before booking)

```
⚠️ Cancellation Policy:
   • 7+ days before travel:   Full refund
   • 1–7 days before travel:  50% refund
   • Less than 24 hours:      No refund
   
   Cancellations can be made from My Trips or 
   by contacting our support team.
```

User must scroll past this and check "I understand the cancellation policy" before proceeding.

---

## Acceptance Criteria

- User can complete a transport booking in under 5 minutes
- Unavailable vehicles on the selected date are clearly shown as unavailable (not hidden)
- Price shown on the results list is the same price charged at checkout — no hidden fees
- Tuk tuk driver contact is sent within 2 minutes of booking confirmation
- Cancellation policy is shown before payment, not after
