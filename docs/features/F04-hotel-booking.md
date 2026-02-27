# F04 — Hotel Booking

**Feature Name:** Hotel Booking  
**Short Description:** Users can search, browse, and book hotel rooms across Cambodia's key tourist provinces — with real photos, honest ratings, and clear room-type options.

---

## Why This Feature Exists

Travelers to Cambodia often struggle to find trustworthy accommodation that matches their budget. Most global booking sites have limited Cambodia coverage or charge high commissions. DerLg curates a selection of verified hotels in every major province — from budget guesthouses to boutique resorts — with honest photos taken by DerLg staff, not AI-generated renders.

---

## User Stories

> **As a backpacker**, I want to find a clean guesthouse under $20/night in Siem Reap, so I can save money for experiences instead.

> **As a honeymooning couple**, I want to see only 4-star and above hotels with pool access, so our first trip together feels special.

> **As a family of 4**, I want to filter for family rooms that fit 2 adults and 2 children, so I don't have to book 2 separate rooms.

> **As a business traveler**, I want to know the hotel's WiFi speed and if there's a business center, so I can stay productive.

> **As a traveler who already has transport booked**, I want to add a hotel to my existing trip, so everything is in one booking.

---

## Hotel Tiers

| Tier | Stars | Typical Price/Night | Target User |
|---|---|---|---|
| Budget | 1–2 ★ | $8–$20 | Backpackers, solo travelers |
| Mid-range | 3 ★ | $25–$60 | Couples, small families |
| Comfort | 3–4 ★ | $60–$120 | Comfort seekers, business |
| Luxury | 4–5 ★ | $120–$300+ | Honeymoon, special occasions |

---

## User Flow

### Entry Points
- Tapping "Hotels" in the Booking tab category grid
- From a trip package detail page (the hotel section has a "Book separately" link)
- AI chat directing user to select accommodation

---

### Screen 1 — Hotel Search

```
┌──────────────────────────────────┐
│  Hotels                🌐  🔔    │
├──────────────────────────────────┤
│  [📍 Siem Reap              ▼ ] │
│  [Check-in:  Dec 20         📅] │
│  [Check-out: Dec 22         📅] │
│  [Guests:    2 adults       ±  ] │
│  [          Search Hotels       ]│
├──────────────────────────────────┤
│  Browse by Province              │
│  [Siem Reap] [Phnom Penh]        │
│  [Kampot]    [Sihanoukville]     │
│  [Battambang][Kep]               │
└──────────────────────────────────┘
```

**Province selector:**
Each province pill shows a small landmark photo behind the text. Tapping goes directly to hotel results for that province without filling the full search form first.

---

### Screen 2 — Hotel Results

```
┌──────────────────────────────────┐
│  ← Siem Reap  Dec 20–22  2 ppl   │
│  18 hotels available             │
├──────────────────────────────────┤
│  Filter:  [★★★+] [Pool] [Breakfast│
│           included] [Under $60]  │
│  Sort: [Best rated ▼]            │
├──────────────────────────────────┤
│  ┌──────────────────────────────┐│
│  │ [Hotel photo]                ││
│  │ ★★★★ Amansara Boutique       ││
│  │ ⭐ 4.9  (214 reviews)         ││
│  │ 💎 Pool · Breakfast · WiFi   ││
│  │ 0.4 km from Angkor Wat       ││
│  │ From $89/night               ││
│  │ [View Rooms]                 ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ [Hotel photo]                ││
│  │ ★★★ Green Garden Guesthouse  ││
│  │ ⭐ 4.5  (89 reviews)          ││
│  │ 🌱 Garden · WiFi · Fan/AC    ││
│  │ 1.2 km from city center      ││
│  │ From $22/night               ││
│  │ [View Rooms]                 ││
│  └──────────────────────────────┘│
└──────────────────────────────────┘
```

**Filter pills (multi-select, each is a toggle):**
- Star rating: ★, ★★, ★★★, ★★★★, ★★★★★
- Amenities: Pool, Breakfast included, Free WiFi, Airport transfer, Gym, Spa
- Price: Under $30, $30–$60, $60–$120, $120+
- Distance: Near Angkor Wat, Near city center, Near airport

**Sort options:**
- Best rated (default)
- Price: low to high
- Price: high to low
- Distance to landmark

**Distance shown:**
- Calculated from the most relevant landmark for the province
- Siem Reap → distance to Angkor Wat entrance
- Phnom Penh → distance to Royal Palace
- Sihanoukville → distance to Otres Beach

**"Sold out" handling:**
- If no rooms available for selected dates: hotel still shows but is greyed out
- "No rooms for Dec 20–22 — check other dates" message inside the card
- "Change dates" button → pre-fills the search form with hotel selected

---

### Screen 3 — Hotel Detail Page

User taps "View Rooms."

**Header:**
- Swipeable full-screen photo gallery (tap to open fullscreen lightbox)
- Back arrow
- Heart (save) icon
- Share icon
- Photo count badge ("1 / 12")

**Hotel name + rating section:**
```
Amansara Boutique Resort
★★★★  ⭐ 4.9 (214 reviews)  📍 Siem Reap, 0.4km from Angkor
```

**Amenities row (icons with labels):**
```
🏊 Pool  🍳 Breakfast  📶 WiFi  ❄️ AC  🅿️ Parking  🧖 Spa
```
Scroll horizontally to see more. Tap any amenity icon for a tooltip description.

**About section:**
3–4 sentences about the hotel's story, vibe, and what makes it special. Written in a warm, editorial tone (not a generic description).

Example: *"Amansara was a former royal retreat converted into a boutique hotel in 2009. It sits quietly among sugar palms just 400 meters from the south gate of Angkor Wat — close enough to be first through the gates at sunrise, far enough to feel secluded."*

**Location section:**
- Small embedded map showing hotel pin
- Key distances:
  - Angkor Wat: 0.4 km (8 min walk)
  - Siem Reap airport: 6.2 km (12 min by tuk tuk)
  - Pub Street: 3.1 km

---

### Screen 4 — Room Selection

Below the hotel info, a "Select Your Room" section:

Each room type is a card:

```
┌───────────────────────────────────────┐
│ [Room photo]  [Room photo]  [Room photo] (swipe)
├───────────────────────────────────────┤
│ Deluxe Garden Room                    │
│ 🛏 1 King Bed  |  👥 Sleeps 2         │
│ 📐 28 m²       |  🏔 Garden view      │
│                                       │
│ ✅ Free cancellation until Dec 18     │
│ ✅ Breakfast for 2 included           │
│ ✅ Free WiFi                          │
│                                       │
│ $89/night × 2 nights = $178 total     │
│                        [Select Room]  │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ [Room photo]                          │
│ Pool Villa Suite                      │
│ 🛏 1 King Bed  |  👥 Sleeps 2         │
│ 📐 52 m²       |  🏊 Private pool     │
│                                       │
│ ✅ Free cancellation until Dec 15     │
│ ✅ Breakfast for 2 + welcome fruit    │
│                                       │
│ $185/night × 2 nights = $370 total    │
│                        [Select Room]  │
└───────────────────────────────────────┘
```

**Room photo gallery:** Each room card has its own mini swipe gallery (not the same as hotel gallery).

**Cancellation policy display:** Shown on every room card. Free cancellation deadline is clearly highlighted. If the cancellation window has passed, shows "Non-refundable" in orange.

**Availability:** If a room type is sold out for the selected dates, the card is greyed and shows "Sold out for Dec 20–22" with a "Notify me if available" option (push notification).

---

### Screen 5 — Booking Details Form

User taps "Select Room" on Deluxe Garden Room.

```
Complete Your Booking

  Hotel:       Amansara Boutique Resort
  Room:        Deluxe Garden Room
  Check-in:    Dec 20, 2025 (from 2:00 PM)
  Check-out:   Dec 22, 2025 (until 12:00 PM)
  Guests:      2 adults

  ─────────────────────────────────

  Guest name:       [____________________]
  Phone number:     [____________________]
  Special requests: [____________________]
  (e.g., high floor, anniversary setup, early check-in)

  Add airport transfer?
  ○ No, thanks
  ○ Arrival pickup: +$15     (Dec 20 — Siem Reap Airport)
  ○ Departure dropoff: +$15  (Dec 22 — Siem Reap Airport)
  ○ Both: +$30

  ─────────────────────────────────
  Room (2 nights):       $178
  Airport transfer:      +$30
  ─────────────────────────────────
  Total:                 $208

  [Continue to Payment]
```

**Early check-in / late check-out:**
- "Request early check-in" toggle (free, subject to availability — shown as a note, not a guarantee)
- "Request late check-out" toggle (same)

---

### Confirmation (after payment)

```
✅ Booking Confirmed!
   DLG-HOTEL-0034

   Amansara Boutique Resort
   Deluxe Garden Room
   Dec 20–22, 2025 · 2 adults

   Check-in after 2:00 PM
   Check-out before 12:00 PM

   Hotel address:
   123 Angkor Road, Siem Reap
   [ Get Directions ]

   Hotel phone: +855 63 XXX XXX
   [ Call Hotel ]

   [  View in My Trips  ]
```

A PDF or screenshot-shareable confirmation card is also generated and sent via email.

---

## Acceptance Criteria

- All room photos are real (taken by DerLg or verified hotel staff — no stock photos)
- Room availability is accurate: a room shown as "available" must successfully book
- Cancellation policy for each room is shown before the user pays — never after
- If all rooms are sold out for chosen dates, show "0 rooms available" and suggest ±2 days alternatives
- Confirmation email arrives within 2 minutes of payment
