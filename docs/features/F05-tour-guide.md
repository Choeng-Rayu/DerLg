# F05 — Tour Guide Booking

**Feature Name:** Tour Guide Booking  
**Short Description:** Users can browse and book licensed local tour guides by language, province, specialty, and availability.

---

## Why This Feature Exists

Visiting Angkor Wat without a guide means missing 90% of the story. Cambodia's temples, history, and culture have layers that are impossible to understand from a signboard. DerLg connects travelers with licensed, reviewed local guides who speak their language — making every visit genuinely enriching rather than just visually impressive.

---

## User Stories

> **As a Chinese tourist**, I want a guide who speaks Mandarin, so I can understand the history without relying on translation apps.

> **As a history enthusiast**, I want a guide who specializes in Angkor-era history and archaeology, so my visit goes deeper than the typical tourist route.

> **As a family with young children**, I want a guide who is good with kids and knows how to make temple visits engaging for them, so the children enjoy the trip.

> **As a solo traveler on a budget**, I want a half-day guide for just the temples I care about most, so I don't pay for a full day I don't need.

> **As a tour package buyer**, I want to optionally add a guide to my existing transport + hotel booking, so everything stays in one booking.

---

## Guide Types

| Type | Description |
|---|---|
| Temple Specialist | Deep expertise in Angkor Wat, Bayon, Ta Prohm, and Angkor Thom |
| City & Culture | Phnom Penh local guide covering Royal Palace, markets, history |
| Nature & Trekking | Cardamom Mountains, Koh Ker, jungle routes |
| Culinary Guide | Food market tours, cooking class guides, street food specialists |
| Photography Guide | Knows the best light and angles at every site |
| Khmer Language Trainer | Teaches basic Khmer phrases during the tour |

---

## User Flow

### Entry Points
- Tapping "Guides" in the Booking tab
- Adding a guide to an existing trip package
- AI chat with the user expressing interest in a guided tour

---

### Screen 1 — Guide Search

```
┌──────────────────────────────────┐
│  Tour Guides           🌐  🔔    │
├──────────────────────────────────┤
│  📍 Province:  [Siem Reap    ▼ ]│
│  📅 Date:      [Dec 20       📅]│
│  🕐 Duration:  [Full Day     ▼ ]│
│  🌐 Language:  [English      ▼ ]│
│  [        Find a Guide          ]│
├──────────────────────────────────┤
│  Top Guides in Siem Reap         │
│                                  │
│  [Guide cards preview — scroll]  │
└──────────────────────────────────┘
```

**Duration options:**
- Half day (4 hours): typically morning session (5 AM – 12 PM) or afternoon
- Full day (8 hours): sunrise to late afternoon
- 2 days, 3 days, etc. (for extended itineraries)

**Language dropdown:**
- English
- Chinese (Mandarin)
- Khmer
- French
- Japanese
- Korean
*(Languages with available guides shown first, others greyed out)*

---

### Screen 2 — Guide Results

```
┌──────────────────────────────────┐
│  ← Guides: Siem Reap             │
│  Dec 20 · Full Day · English     │
│  12 guides available             │
├──────────────────────────────────┤
│  Filter: [Temple] [City] [Nature]│
│          [Photo] [Kids-friendly] │
│  Sort: [Top Rated ▼]             │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │ [Profile photo]            │  │
│  │ Sopheak Chea               │  │
│  │ ⭐ 4.9  (312 reviews)       │  │
│  │ 🏛 Temple Specialist        │  │
│  │ 🌐 English · Français       │  │
│  │ 📍 Siem Reap · 6 years exp  │  │
│  │ ✅ Available Dec 20         │  │
│  │ $45/day                    │  │
│  │ [View Profile] [Book Now]  │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ [Profile photo]            │  │
│  │ Vanna Keo                  │  │
│  │ ⭐ 4.8  (187 reviews)       │  │
│  │ 🏛 Temple + Photography     │  │
│  │ 🌐 English · 中文           │  │
│  │ 📍 Siem Reap · 4 years exp  │  │
│  │ ✅ Available Dec 20         │  │
│  │ $50/day                    │  │
│  │ [View Profile] [Book Now]  │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**Guide card shows:**
- Profile photo (real photo, not avatar)
- Full name
- Star rating + number of reviews
- Specialty tag(s)
- Languages spoken (flag icons)
- Province + years of experience
- Availability status on selected date
- Daily rate
- Two actions: View Profile and Book Now

**Availability status:**
- Green "✅ Available Dec 20" — confirmed free that date
- Orange "⚠️ Partially booked — morning only available"
- Red "❌ Booked Dec 20 — next available: Dec 23" with option to tap to book Dec 23

---

### Screen 3 — Guide Profile Page

User taps "View Profile" on Sopheak Chea.

**What the user sees (full-page profile):**

**Header:**
- Large profile photo
- Name + verified badge (✓ Licensed by Ministry of Tourism)
- Star rating + total reviews
- Province
- "Book Sopheak" button always visible

**Stats strip:**
```
[ 6 Years Exp ]  [ 312 Reviews ]  [ 98% Respond Rate ]  [ EN + FR ]
```

**Bio:**
Written in first person, warm and personal:
*"I was born in Siem Reap and grew up playing among the ruins of Angkor. I've been guiding since 2018 and I love sharing the stories behind the stones — not just what they look like, but what they meant to the people who built them. I speak English and French and can adjust the pace and depth of the tour depending on what you find most interesting."*

**Specialties:**
Icon tags with labels: 🏛 Angkor Complex, 🌅 Sunrise Tours, 📷 Photography Spots, 👶 Kid-Friendly

**What past visitors say:**
```
"Sopheak made Angkor come alive. He knew stories about 
every panel and never rushed us." 
— Emma T., UK  ⭐⭐⭐⭐⭐  Dec 2024

"He recommended the best sunrise spot that wasn't in 
any guide book. Absolutely worth it."
— Zheng W., China  ⭐⭐⭐⭐⭐  Nov 2024
```

"See all 312 reviews" link loads paginated full review list.

**Languages:** Shown as flag + language name

**Availability Calendar:**
- Month view showing available (green) and booked (grey) dates
- Tap a date to start the booking flow with that date pre-selected

**Pricing:**
```
Half day (4 hrs):   $25
Full day (8 hrs):   $45
2 days:             $85  (save $5)
3 days:            $120  (save $15)
```
Group rate note: "For groups over 8 people, contact us for a group rate."

**Similar Guides:**
Row of 3 other guides with similar specialties — in case Sopheak is unavailable or not quite right.

---

### Screen 4 — Booking Form

User taps "Book Now" or "Book Sopheak."

```
Book Sopheak Chea

  📅 Date:      Dec 20, 2025
  ⏰ Duration:  ○ Half Day (4 hrs) - $25
                ● Full Day (8 hrs) - $45
                ○ 2 Days           - $85

  ──────────────────────────────────

  Where would you like to start?
  ( ) Angkor Wat main gate
  ( ) My hotel (enter hotel name)
  ( ) Custom location

  What's your main focus? (helps the guide plan)
  ☐ Angkor Wat
  ☑ Bayon Temple
  ☐ Ta Prohm (Tomb Raider temple)
  ☐ Angkor Thom
  ☐ Sunrise photography

  Number of people in your group: [ 2 ]

  Your name:    [____________________]
  Your phone:   [____________________]

  Any requests for Sopheak:
  [e.g., we're slow walkers, please plan accordingly]

  ──────────────────────────────────
  Guide fee:           $45.00
  ──────────────────────────────────
  Total:               $45.00

  [  Continue to Payment  ]
```

**"What's your focus" checkboxes:**
These are sent directly to the guide as notes before the tour, so they can customize the route. This is not just for display — it's genuinely used.

---

### After Booking — Guide Contact Share

After payment confirmation, guide's contact is shared:

```
✅ Guide Booked!
   DLG-GUIDE-0021

   Sopheak Chea  ⭐ 4.9
   Full Day · Dec 20, 2025

   Sopheak will meet you at:
   Angkor Wat main gate
   at 5:00 AM (for sunrise)

   Contact Sopheak directly:
   📱 +855 17 XXX XXX
   [  Call  ]  [  WhatsApp  ]

   [  View in My Trips  ]
```

A reminder push notification is sent 24 hours before the tour date.

---

## Acceptance Criteria

- All guides shown are licensed by Cambodia's Ministry of Tourism (verified badge)
- Guide availability is real-time — no double-booking is possible
- Guide contact details are shared only after payment is confirmed
- Guide profile bio and photos are real (not AI-generated or stock)
- Users can book the same guide for multiple consecutive days at a multi-day discount rate
- Reviews are only from users who completed a tour with that guide (no fake reviews)
