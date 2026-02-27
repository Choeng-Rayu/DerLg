# F14 — AI Budget Planner

**Feature Name:** AI Budget Planner  
**Short Description:** An interactive tool — powered by the AI chat — that estimates the total cost of a Cambodia trip based on duration, group size, accommodation tier, and transport type, before the user commits to any booking.

---

## Why This Feature Exists

"How much will my Cambodia trip cost?" is the most common question new travelers ask. Without a reliable answer, many either under-budget (and have a stressful trip) or never book at all (paralyzed by uncertainty). The AI Budget Planner gives travelers a personalized, honest cost estimate in under 2 minutes — in their currency, with a clear breakdown — so they can make confident decisions.

---

## User Stories

> **As a traveler on a strict budget**, I want to know the total expected cost before I commit to anything, so I can decide if Cambodia is affordable for me right now.

> **As a group organizer**, I want to see a per-person and total cost estimate for 8 people for 5 days, so I can share a realistic budget with my group.

> **As a traveler comparing tiers**, I want to see how the cost changes if I upgrade from a 2-star to a 4-star hotel, so I can make an informed quality/cost trade-off.

> **As a Chinese tourist**, I want to see the estimate in RMB/CNY alongside USD, so I can relate it to my home currency without doing mental math.

---

## Entry Points

- Home screen → "Plan Your Budget" card (shown to users who haven't booked yet)
- AI chat: user asks "How much will it cost?" or "What's my budget?" at any point
- Booking landing page: "Estimate your budget first" link

---

## User Flow — Budget Planner via Chat

This feature works entirely through the AI chat. It does not have a separate form screen. The AI asks questions and presents the estimate as a structured card.

---

### Flow Inside AI Chat

**User opens chat and says:**
> "How much would a 5-day Cambodia trip cost for 2 people?"

**AI responds:**
*"Happy to help estimate! A few quick questions to make it accurate. What kind of accommodation are you thinking?"*

**Quick reply chips appear:**
- 🏕️ Budget ($15–$30/night)
- 🏨 Mid-range ($40–$80/night)
- 🏩 Comfort ($80–$150/night)
- ✨ Luxury ($150+/night)

User taps "Mid-range."

**AI:**
*"And for getting around — will you mostly use tuk tuks, or a private van?"*

**Quick reply chips:**
- 🛺 Tuk tuks (flexible, cheap)
- 🚐 Private van (comfortable, direct)

User taps "Private van."

**AI:**
*"Are you planning to hire a guide?"*

**Quick reply chips:**
- 👍 Yes, guide included
- 👋 No guide

User taps "Yes, guide included."

**AI:**
*"Which provinces are you visiting? Pick as many as you like."*

**Checkboxes appear:**
- ☑️ Siem Reap (Angkor Wat area)
- ☐ Phnom Penh
- ☑️ Kampot / Kep
- ☐ Sihanoukville
- ☐ Battambang

User selects Siem Reap + Kampot.

**AI:**
*"Perfect — let me calculate your estimate!"*

*(1–2 second pause while tool is called)*

---

### Budget Estimate Card (Rendered in Chat)

```
┌──────────────────────────────────────┐
│  💰 Your Cambodia Budget Estimate    │
│  5 days · 2 people · Mid-range       │
├──────────────────────────────────────┤
│  Total Estimate:                     │
│                                      │
│  $480 – $640                         │
│  (per person: $240 – $320)           │
│                                      │
│  [ USD ] [ KHR ] [ CNY ]  ← toggle  │
├──────────────────────────────────────┤
│  Breakdown:                          │
│                                      │
│  🏨 Accommodation (4 nights)         │
│     ████████░░░  $160 – $240         │
│                                      │
│  🚐 Transport (private van, 2 routes)│
│     ██████░░░░░  $120 – $160         │
│                                      │
│  👨‍🏫 Guide (2 days, English)          │
│     █████░░░░░░  $90 (flat)          │
│                                      │
│  🍜 Meals (est. $15–$20/person/day)  │
│     ████░░░░░░░  $75 – $100          │
│                                      │
│  🎫 Entry fees (Angkor 3-day pass)   │
│     ████░░░░░░░  $37/person = $74    │
│                                      │
│  📦 Shopping & extras (est.)         │
│     ██░░░░░░░░░  $30 – $50           │
├──────────────────────────────────────┤
│  💡 Tips:                            │
│  • Siem Reap temple fees are a flat  │
│    $37 for a 3-day pass — book in   │
│    advance to skip the queue.        │
│  • Kampot has lower food prices than │
│    Siem Reap — budget less there.   │
├──────────────────────────────────────┤
│  [  Book a Package in This Budget  ] │
│  [  Adjust Budget Parameters       ] │
└──────────────────────────────────────┘
```

**Currency toggle:**
Tapping USD / KHR / CNY instantly converts all numbers. CNY exchange rate refreshed daily.

**"Adjust Budget Parameters" button:**
Opens a quick-edit panel (inside the chat flow):
```
What would you like to change?
○ Accommodation tier
○ Transport type
○ Add/remove a province
○ Change duration
```

User can tweak one parameter and a new estimate card appears.

**"Book a Package in This Budget" button:**
Sends the message "Find me a trip package within $480–$640 for 2 people, 5 days" to the AI, transitioning directly to the discovery stage with budget pre-filled.

---

## Acceptance Criteria

- Budget estimate takes under 5 seconds to generate
- Estimate range is clearly shown as MIN–MAX, never a single figure that creates false precision
- Currency toggle works for all 3 currencies
- Tips are genuinely useful (province-specific, not generic)
- "Book in This Budget" button pre-fills the booking discovery flow with the estimated parameters

---
---

# F15 — My Trip: Booking Management

**Feature Name:** My Trip — Booking Management  
**Short Description:** A central dashboard where users can view all their upcoming and past bookings, access booking details, manage cancellations, and share itineraries.

---

## Why This Feature Exists

After booking, travelers need a single place to access everything about their trip: driver contact, hotel address, guide's phone number, and a day-by-day itinerary. They also need an easy way to cancel, reschedule, or contact support without calling a phone number. My Trip is that place.

---

## User Stories

> **As a traveler 3 days before my trip**, I want to see my driver's contact information and pickup time, so I'm fully prepared.

> **As a traveler whose plans changed**, I want to cancel my booking from the app and see the refund amount before I confirm, so I'm not surprised.

> **As a traveler who wants to share the trip plan with their travel partner**, I want to share the itinerary as a PDF or link, so we're both on the same page.

> **As a past traveler**, I want to see all my previous trips in one place, so I can remember where I've been and leave a review.

---

## User Flow

### Entry Point
Tapping the **"My Trip"** tab in the bottom navigation bar.

---

### Screen 1 — My Trip Dashboard

```
┌──────────────────────────────────┐
│  My Trips               🌐 🔔   │
├──────────────────────────────────┤
│  [Upcoming ▼]  [Past]  [All]     │
├──────────────────────────────────┤
│  ⏰ Upcoming (2)                 │
│                                  │
│  ┌────────────────────────────┐  │
│  │ [Trip photo]               │  │
│  │ ● CONFIRMED                │  │
│  │ Angkor Sunrise 2-Day Pkg   │  │
│  │ Dec 20–22, 2025 · 2 people │  │
│  │ Ref: DLG-2025-0042         │  │
│  │ In 19 days                 │  │
│  │ [View Details]             │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ [Hotel photo]              │  │
│  │ ● CONFIRMED                │  │
│  │ Amansara Boutique Resort   │  │
│  │ Dec 20–22, 2025            │  │
│  │ Ref: DLG-HOTEL-0034        │  │
│  │ In 19 days                 │  │
│  │ [View Details]             │  │
│  └────────────────────────────┘  │
│                                  │
│  ─────────────────────────────   │
│  ✅ Past (5)                     │
│  [View Past Trips]               │
└──────────────────────────────────┘
```

**Status badges:**
- 🟢 CONFIRMED — paid and confirmed
- 🟡 RESERVED — booking made but payment pending
- 🔴 CANCELLED — cancelled, refund processing or completed
- ✅ COMPLETED — trip already happened

**Booking cards show:** Trip photo, status, name, dates, reference number, and days until travel.

---

### Screen 2 — Booking Detail (Upcoming Trip)

User taps "View Details" on the Angkor package.

```
┌──────────────────────────────────┐
│  ← DLG-2025-0042       🔔       │
│  ● CONFIRMED                     │
├──────────────────────────────────┤
│  Angkor Sunrise 2-Day Package    │
│  Dec 20–22, 2025 · 2 people      │
├──────────────────────────────────┤
│  📋 Booking Summary              │
│  ─────────────────────────────   │
│  Package:          $178          │
│  Private dinner:    +$30         │
│  Code BEACH20:      -$20.80      │
│  Loyalty points:    -$5.00       │
│  ─────────────────────────────   │
│  Total paid:       $182.20       │
├──────────────────────────────────┤
│  🚐 Transport                    │
│  Toyota Starex                   │
│  Pickup: Dec 20 at 4:30 AM       │
│  Location: Phnom Penh Intl, T1   │
│                                  │
│  Driver assigned in 3 days       │
│  (24 hrs before departure)       │
├──────────────────────────────────┤
│  🏨 Hotel                        │
│  Amansara Boutique Resort        │
│  Check-in: Dec 20 from 2:00 PM   │
│  Check-out: Dec 22 before 12 PM  │
│  +855 63 XXX XXX                 │
│  [  Get Directions  ]            │
├──────────────────────────────────┤
│  👨‍🏫 Guide                        │
│  Not included in this booking    │
│  [  Add a guide  ]               │
├──────────────────────────────────┤
│  📅 Itinerary                    │
│  ▼ Day 1 — Arrival & Sunrise     │
│    4:30 AM: Pickup               │
│    5:00 AM: Angkor Wat sunrise   │
│    7:30 AM: Breakfast            │
│    ...                           │
│  ▶ Day 2 — Jungle Temples        │
│  ▶ Day 3 — Departure             │
├──────────────────────────────────┤
│  📤 Actions                      │
│  [  Share Itinerary  ]           │
│  [  Add to Calendar  ]           │
│  [  Contact Support  ]           │
│  [  Cancel Booking  ]  ← red     │
└──────────────────────────────────┘
```

**"Share Itinerary" button:**
Generates a shareable link (e.g., derlg.com/trip/DLG-2025-0042) and a PDF version. Share via WhatsApp, Telegram, email, or copy link.

**"Add to Calendar" button:**
Creates a calendar event on the user's device (Google Calendar / Apple Calendar) with all trip details.

**"Cancel Booking" button:**
Opens the cancellation flow.

---

### Screen 3 — Cancellation Flow

User taps "Cancel Booking."

**Step 1 — Policy preview:**
```
┌──────────────────────────────────┐
│  Cancel Booking                  │
│  DLG-2025-0042                   │
├──────────────────────────────────┤
│  ⚠️ Cancellation Policy          │
│                                  │
│  Your trip is on Dec 20, 2025.   │
│  Today is Dec 1, 2025.           │
│  (19 days until travel)          │
│                                  │
│  Since you're cancelling 19 days │
│  before your trip:               │
│                                  │
│  ✅ FULL REFUND                  │
│     You'll receive $182.20 back  │
│     within 7–14 business days.   │
│                                  │
│  Note: Loyalty points used will  │
│  also be restored.               │
│                                  │
│  [  Confirm Cancellation  ]      │
│  [  Keep My Booking  ]  ← green  │
└──────────────────────────────────┘
```

**Refund policy applied dynamically:**
- 7+ days before travel → "Full refund: $182.20"
- 1–7 days before travel → "50% refund: $91.10. The remaining $91.10 is non-refundable."
- Under 24 hours → "No refund — non-refundable."

**Step 2 — Cancellation reason (optional):**
```
Why are you cancelling? (optional)
○ Change of plans
○ Found a better option
○ Medical / emergency
○ Price concerns
○ Other
[ Skip ]  [ Submit ]
```

**Step 3 — Confirmation:**
```
✅ Booking Cancelled

DLG-2025-0042

Refund of $182.20 will be processed
to your original payment method
within 7–14 business days.

Loyalty points restored: 500 pts
Your new balance: 1,320 pts

[  Back to My Trips  ]
```

---

### Screen 4 — Past Trips

```
┌──────────────────────────────────┐
│  Past Trips (5)                  │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │ ✅ COMPLETED               │  │
│  │ Kampot Countryside Tour    │  │
│  │ Nov 10–12, 2025            │  │
│  │ ⭐ You haven't rated yet   │  │
│  │ [Leave a Review] [Rebook]  │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ ✅ COMPLETED               │  │
│  │ Sihanoukville Beach 3-Day  │  │
│  │ Sep 5–7, 2025              │  │
│  │ ⭐⭐⭐⭐⭐ Rated             │  │
│  │ [View Details] [Rebook]    │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**"Rebook" button:**
Opens the booking flow for the same trip with dates pre-cleared (user selects new dates) and all previous add-ons and preferences pre-filled.

---
---

# F16 — User Profile & Account Settings

**Feature Name:** User Profile & Account Settings  
**Short Description:** Users manage their personal information, language preference, emergency contacts, notification settings, and account security.

---

## Why This Feature Exists

The profile is the control center of the DerLg experience. It connects every feature: the student discount status, the loyalty points balance, the emergency contact, language preference, and booking history all live here or link from here. A well-designed profile screen reduces support tickets because users can self-serve everything.

---

## User Stories

> **As a new user**, I want to set my emergency contact once, so that it's ready if I ever need the SOS feature.

> **As a user with a new phone number**, I want to update my contact details easily, so my driver and guide can reach me.

> **As a user who travels in different languages**, I want to switch my app language from the profile screen, so I don't have to find the globe icon.

> **As a user concerned about security**, I want to see which devices have active sessions, so I can log out of ones I don't recognize.

---

## User Flow

### Entry Point
Tapping the **"Profile"** tab in the bottom navigation.

---

### Screen 1 — Profile Overview

```
┌──────────────────────────────────┐
│  Profile                🌐 🔔   │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │ [User photo / initials]    │  │
│  │ Chan Dara                  │  │
│  │ chan.dara@email.com         │  │
│  │ +855 12 345 678            │  │
│  │ [Edit Profile]             │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│  Quick Access                    │
│  ─────────────────────────────   │
│  🏆 Loyalty Points        820 pts→│
│  🎓 Student Discount      Active→│
│  🆘 Emergency Settings         → │
│                                  │
├──────────────────────────────────┤
│  Preferences                     │
│  ─────────────────────────────   │
│  🌐 Language              English→│
│  🔔 Notifications                →│
│  💳 Saved Payment Methods        →│
│                                  │
├──────────────────────────────────┤
│  Account                         │
│  ─────────────────────────────   │
│  🔒 Change Password              →│
│  📱 Active Sessions              →│
│  🗑️ Delete Account               →│
│                                  │
├──────────────────────────────────┤
│  [  Log Out  ]                   │
└──────────────────────────────────┘
```

---

### Edit Profile Screen

```
┌──────────────────────────────────┐
│  ← Edit Profile                  │
├──────────────────────────────────┤
│       [Profile photo]            │
│       [Change Photo]             │
│                                  │
│  Full name:                      │
│  [ Chan Dara                   ] │
│                                  │
│  Email:                          │
│  [ chan.dara@email.com         ] │
│  (Email change requires         │
│   re-verification)               │
│                                  │
│  Phone number:                   │
│  [ +855 12 345 678            ] │
│                                  │
│  Nationality:                    │
│  [ Cambodian                  ▼] │
│                                  │
│  [  Save Changes  ]              │
└──────────────────────────────────┘
```

---

### Emergency Settings Screen

```
┌──────────────────────────────────┐
│  ← Emergency Contact             │
├──────────────────────────────────┤
│  ℹ️ This contact will be notified │
│  if you trigger the SOS button.  │
│                                  │
│  Contact name:                   │
│  [ Mom                        ]  │
│                                  │
│  Contact phone:                  │
│  [ +855 99 XXX XXX            ]  │
│                                  │
│  Relationship:                   │
│  [ Parent                     ▼] │
│                                  │
│  [  Save Emergency Contact  ]    │
│                                  │
│  ─────────────────────────────   │
│  🆘 Quick access to SOS          │
│  [  Open Emergency Screen  ]     │
└──────────────────────────────────┘
```

---

### Notifications Settings Screen

```
┌──────────────────────────────────┐
│  ← Notification Settings         │
├──────────────────────────────────┤
│  Booking Reminders               │
│  Get notified before your trip   │
│  24 hours before    [ ON  ●  ]   │
│  3 days before      [ ON  ●  ]   │
│                                  │
│  Festival Alerts                 │
│  Upcoming festivals near me      │
│  Festival in 7 days [ ON  ●  ]   │
│  Festival in 3 days [ ON  ●  ]   │
│  Discount periods   [ ON  ●  ]   │
│                                  │
│  Loyalty Points                  │
│  Points updates     [ ON  ●  ]   │
│  Points expiry warn [ ON  ●  ]   │
│                                  │
│  Marketing                       │
│  New trip promotions [ OFF ○ ]   │
│  Seasonal offers    [ OFF ○ ]    │
└──────────────────────────────────┘
```

---

## Acceptance Criteria

- Profile changes (phone number, name) are reflected immediately after saving
- Language change in Profile is identical to changing language via the globe icon
- Emergency contact is pre-populated on the Emergency screen immediately after saving
- "Delete Account" requires typing "DELETE" as confirmation and has a 7-day grace period before data is permanently removed
- Notification settings are respected (if user turns off Marketing, they receive no marketing pushes)
