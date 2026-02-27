# F06 — Explore: Historical Places & Cultural Content

**Feature Name:** Explore — Historical Places  
**Short Description:** A rich content discovery screen where travelers can explore Cambodia's historical sites, cultural insights, and hidden gems before and during their trip.

---

## Why This Feature Exists

Many travelers arrive in Cambodia knowing only Angkor Wat. DerLg's Explore feature introduces them to the full depth of Cambodia's heritage — from the riverside temples of Kampot to the forgotten ruins of Koh Ker. It is a travel guide built into the app, always accessible — even offline in remote areas.

---

## User Stories

> **As a first-time visitor**, I want to discover historical sites beyond Angkor Wat, so I can explore off-the-beaten-path places that match my interests.

> **As a traveler already in Siem Reap**, I want to browse nearby attractions I can visit today, so I can fill unexpected free time.

> **As a cultural learner**, I want to read the story behind each temple before I visit, so my visit feels meaningful rather than just photo-taking.

> **As a traveler in a remote area**, I want to access place information offline, so I'm not dependent on mobile data.

---

## User Flow

### Entry Point
Tapping the **"Explore"** tab in the bottom navigation bar.

---

### Screen 1 — Explore Landing

```
┌──────────────────────────────────┐
│  Explore Cambodia     🌐  🔔     │
├──────────────────────────────────┤
│  [🔍 Search temples, provinces...]│
├──────────────────────────────────┤
│  [Places]  [Festivals]  [Maps]   │  ← Tab row
├──────────────────────────────────┤
│                                  │
│  Province filter (scrollable):   │
│  [All] [Siem Reap] [Phnom Penh] │
│  [Kampot] [Sihanoukville] [More] │
├──────────────────────────────────┤
│  ✨ Place of the Week            │
│  ┌────────────────────────────┐  │
│  │ [Full-width photo of Koh   │  │
│  │   Ker Temple]              │  │
│  │ Koh Ker — The Forgotten    │  │
│  │ Capital · Preah Vihear     │  │
│  │ 2 hrs from Siem Reap  →   │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│  All Places  (24 results)        │
│  ┌──────────┐ ┌──────────┐       │
│  │[photo]   │ │[photo]   │       │
│  │Angkor Wat│ │Bayon     │       │
│  │Siem Reap │ │Siem Reap │       │
│  │🛕 Temple  │ │🛕 Temple  │       │
│  │$37 entry │ │Included  │       │
│  └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐       │
│  │[photo]   │ │[photo]   │       │
│  │Phnom     │ │Bokor Hill│       │
│  │Bakheng   │ │Station   │       │
│  │🛕 Temple  │ │🏔 History │       │
│  │Free      │ │Free      │       │
└──────────────────────────────────┘
```

**Category filter row (above the grid, horizontal scroll):**
- All · Temple · Museum · Nature · Waterfall · Beach · Ruins · Market

---

### Screen 2 — Place Detail Page

User taps "Angkor Wat."

**What the user sees (top to bottom):**

**Photo Hero:**
- Full-screen swipeable photo gallery (8–15 photos)
- Tap any photo → full-screen lightbox
- Share icon on lightbox
- "X of 12" counter

**Info Section:**
```
Angkor Wat
🛕 Temple · Siem Reap Province
⭐ UNESCO World Heritage Site since 1992

[ ⏰ 5 AM – 5:30 PM ]  [ 💰 $37 (3-day pass) ]  [ 📷 Photography OK ]
```

**"Did You Know?" fact box:**
```
💡 Did You Know?
   Angkor Wat is the largest religious monument ever built.
   It covers 400 acres — larger than Vatican City.
   It took approximately 30 years and 300,000 workers to build.
```

**About section (3–5 paragraphs, human-written):**
Rich cultural narrative about the temple's history, significance, and what makes it worth visiting. Not a Wikipedia copy — original editorial content written for travelers.

**Visitor Tips section:**
```
🕐 Best time to visit:    Sunrise (arrive by 5:00 AM for best light)
☀️ Heat warning:          Midday (11 AM–2 PM) is very hot. Plan breaks.
👗 Dress code:            Knees and shoulders must be covered.
                          Free sarongs available at the entrance.
📸 Best photo spots:      Reflection pool (north gate, early morning)
💧 Water:                 Buy water inside (cheaper than near entrance)
🎫 Tip:                   Buy a 3-day pass — same price but more flexibility
```

**Getting There section:**
```
📍 Siem Reap city center → 8 km (20 min by tuk tuk)
   Tuk tuk: ~$5–$8 return trip
   Bicycle: available for rent near Old Market
   [  Book a Tuk Tuk  ]  →  links to F03 transport booking
```

**Related Trips section:**
"Want to visit this place with a guide and transport arranged?"
→ 2–3 trip package cards that include Angkor Wat

**Reviews:**
- Overall star rating
- 5 most recent traveler reviews
- Each review: user photo/initial, name, country, date, text, photos (optional)
- "Leave a review" button (only available to users who have completed a DerLg trip that included this place)

---

## Acceptance Criteria

- Every place has at least 5 real photos (not stock)
- Dress code and entry fee information is shown prominently before user visits
- Reviews are verified (linked to completed trips only)
- All place descriptions are available offline (cached when user is online)

---
---

# F07 — Festival Calendar & Event Alerts

**Feature Name:** Festival Calendar & Event Alerts  
**Short Description:** Users can discover upcoming Cambodian festivals, set reminders, and receive discount alerts during festival periods.

---

## Why This Feature Exists

Cambodia's festivals are among the most spectacular in Southeast Asia — Water Festival with its boat races, Khmer New Year with its village celebrations, Pchum Ben with its spiritual depth. Most tourists miss these events simply because they didn't know the dates. DerLg's festival calendar makes sure travelers plan around — not past — Cambodia's best moments.

---

## User Stories

> **As a traveler planning 3 months ahead**, I want to know which festivals fall within my travel window, so I can time my trip around an event.

> **As a user who set a reminder for Water Festival**, I want to receive a push notification 7 days before, so I can complete my booking in time.

> **As a budget traveler**, I want to be notified about festival discount periods, so I can save money on my bookings during celebrations.

> **As a cultural traveler**, I want to read about what each festival means and how it's celebrated, so I can be respectful and fully present.

---

## Festival Calendar

| Festival | Khmer Name | Month | Province Focus | DerLg Discount |
|---|---|---|---|---|
| Khmer New Year | ចំណូលឆ្នាំខ្មែរ | April | Nationwide | 15% off |
| Water Festival | បុណ្យអុំទូក | November | Phnom Penh | 15% off |
| Pchum Ben | ភ្ជុំបិណ្ឌ | September–October | Nationwide | 10% off |
| Royal Plowing Ceremony | ព្រះរាជព ​ | May | Phnom Penh | — |
| Constitution Day | — | September | — | 10% off |
| Angkor Wat Int'l Half Marathon | — | December | Siem Reap | — |
| International New Year | — | January 1 | Nationwide | 12% off |

---

## User Flow

### Entry Point
Tapping "Festivals" tab on the Explore screen.

---

### Screen — Festival Tab

```
┌──────────────────────────────────┐
│  Festivals                       │
├──────────────────────────────────┤
│  ◄  December 2025  ►             │
│  ─────────────────────────────   │
│  Mo Tu We Th Fr Sa Su            │
│  1  2  3  4  5  6  7             │
│  8  9  10 11 12 13 14            │
│  15 16 17 18 19 20 21            │
│  22 23 [●]25 26 27 28  ← Dec 24  │
│  29 30 31                        │
│                                  │
│  ● = has festival/event          │
├──────────────────────────────────┤
│  Upcoming Festivals              │
│                                  │
│  ┌────────────────────────────┐  │
│  │ [Festival banner photo]    │  │
│  │ 🎉 Angkor Wat Half Marathon │  │
│  │ December 8, 2025           │  │
│  │ Siem Reap                  │  │
│  │ In 12 days                 │  │
│  │ 🎟 No discount this event  │  │
│  │ [Read More]  [Set Reminder]│  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ [Festival banner photo]    │  │
│  │ 🎊 International New Year   │  │
│  │ January 1, 2026            │  │
│  │ Nationwide                 │  │
│  │ In 38 days                 │  │
│  │ 🎟 12% off all bookings!   │  │
│  │ [Read More]  [Set Reminder]│  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**Calendar behavior:**
- Dots on dates indicate festivals
- Tapping a date with a dot scrolls to that festival's card
- Navigate forward/backward through months

**Festival card:**
- Banner photo
- Festival name + Khmer script below the English name
- Date(s) — for multi-day festivals shows "Nov 5–7"
- Province
- Days remaining badge
- Discount badge (orange, only shown if discount applies)
- Two actions: "Read More" and "Set Reminder"

---

### Festival Detail Page

User taps "Read More" on Water Festival.

**What the user sees:**

**Hero:**
- Full-width festival photo
- Festival name in English + Khmer
- Dates: "November 5–7, 2025"
- Province: "Phnom Penh (main) + Siem Reap"

**Cultural background section:**
Rich editorial content (3–5 paragraphs) explaining:
- What the festival is
- Why it's celebrated
- Historical or religious context
- What it looks like / feels like to be there

**What to expect:**
```
🚤 Boat races on the Tonle Sap river (main event)
🎆 Fireworks nightly from the Royal Palace
🌊 Reverse current ceremony (rare natural event!)
🍜 Street food and night markets
🎭 Traditional dance performances
```

**Practical tips:**
```
🏨 Book accommodation 3+ months ahead — prices triple during festival week
🚌 Phnom Penh roads are closed near the riverfront — arrive by tuk tuk
🌊 Crowds at the riverfront can be very dense. Visit early morning for best experience.
💧 Carry water — it's November but the crowds generate heat
📸 Best photo spot: Sisowath Quay, facing the river
```

**Discount section (if applicable):**
```
🎟 Water Festival Discount
   Use code: WATER15 for 15% off any DerLg booking
   during November 5–7, 2025.
   Valid for: Transport, Hotels, Guide bookings, Packages
   
   [  Book Now and Save 15%  ]
```

**Reminder section:**
```
🔔 Set a reminder
   ○ 7 days before (Oct 29)
   ● 3 days before (Nov 2)
   ○ 1 day before (Nov 4)
   [  Set Reminder  ]
```

After setting reminder:
"✅ Reminder set! We'll notify you on November 2nd so you have time to book."

---

## Acceptance Criteria

- Festival dates are accurate and updated each year
- Discount codes shown on festival pages are valid and functional
- "Set Reminder" actually sends a push notification on the chosen date
- Festival detail pages are available offline (cached)
- Discount badge is only shown on festival cards when a discount actually exists

---
---

# F08 — Payment & Checkout

**Feature Name:** Payment & Checkout  
**Short Description:** Secure payment experience supporting QR code (Bakong + Stripe), credit/debit cards, and loyalty points redemption.

---

## Why This Feature Exists

Payment in Cambodia is unique. Many travelers use ABA Pay or Wing mobile banking. International tourists may prefer Visa/Mastercard. DerLg supports both — and presents QR codes directly inside the AI chat or checkout screen so users never have to leave the app to pay.

---

## User Stories

> **As a Cambodian local**, I want to pay with ABA Pay's QR scanner, so I don't need to enter card numbers.

> **As an international tourist**, I want to pay with my Visa card, so I can use the same card I use everywhere else.

> **As a loyalty member with 1,000 points**, I want to apply my points as a discount at checkout, so I get something back for my past trips.

> **As a user who scanned the QR but the payment failed**, I want to see a clear error message and a retry option, so I'm not left confused.

> **As a budget traveler with a promo code**, I want to apply my code at checkout and see the discount applied before I pay, so I'm confident I got the right price.

---

## Payment Methods Supported

| Method | Target User | Currency | Notes |
|---|---|---|---|
| QR Code (Bakong/ABA) | Cambodian locals | KHR/USD | Instant settlement |
| QR Code (Stripe) | International tourists | USD | 15-minute expiry |
| Visa / Mastercard | International tourists | USD | 3D Secure supported |
| PayPal | International tourists | USD | Future phase |
| Loyalty Points | All users | Points → USD | Max 30% of order value |

---

## User Flow — Checkout Screen

### Entry Points
- After booking form in any feature (transport, hotel, guide, package)
- After "Confirm & Book" in the AI chat

---

### Screen — Payment Page

```
┌──────────────────────────────────┐
│  ← Checkout                      │
├──────────────────────────────────┤
│  Order Summary                   │
│  ─────────────────────────────── │
│  Angkor Sunrise 2-Day Package    │
│  Dec 20–22 · 2 people            │
│                                  │
│  Package base:         $178      │
│  Private dinner add-on: +$30     │
│  Code BEACH20 (-10%):  -$20.80   │
│  ─────────────────────────────── │
│  Subtotal:             $187.20   │
│                                  │
│  🏆 Use loyalty points           │
│  You have 820 pts = $8.20        │
│  [ Apply 500 pts = $5.00 off ]   │
│  ─────────────────────────────── │
│  Total:                $182.20   │
│  ≈ 746,000 KHR                   │
│  ≈ ¥1,321                        │
├──────────────────────────────────┤
│  Select Payment Method           │
│                                  │
│  ● QR Code (Recommended)         │
│    Pay with ABA, ACLEDA, Wing    │
│                                  │
│  ○ Credit / Debit Card           │
│    Visa, Mastercard              │
│                                  │
│  ○ Pay with PayPal               │
│                                  │
├──────────────────────────────────┤
│  [    Pay $182.20 Now    ]       │
└──────────────────────────────────┘
```

**Currency display:**
USD is the base currency. KHR and CNY equivalents are shown below the total as secondary info. They update automatically with live exchange rates (refreshed every hour).

**Loyalty points toggle:**
- Shows current point balance
- Slider or preset amount selector (100 pts / 500 pts / all available)
- Real-time total update as points are applied
- Hard cap: maximum 30% of order value can be paid with points

---

### Payment Path A — QR Code

User selects "QR Code" and taps "Pay Now."

**What the user sees:**

```
┌──────────────────────────────────┐
│  Scan to Pay                     │
├──────────────────────────────────┤
│                                  │
│   ┌──────────────────────────┐   │
│   │                          │   │
│   │      [QR CODE IMAGE]     │   │
│   │                          │   │
│   └──────────────────────────┘   │
│                                  │
│   Amount: $182.20 USD            │
│   ≈ 746,020 KHR                  │
│                                  │
│   ⏱ 14:47 remaining              │
│   Booking: DLG-2025-0042         │
│                                  │
│   How to pay:                    │
│   1. Open your banking app       │
│   2. Tap "Scan QR"               │
│   3. Confirm the amount          │
│                                  │
│   ──────────────────────────── │
│   Having trouble?                │
│   [  Generate New QR  ]          │
│   [  Try Card Instead  ]         │
└──────────────────────────────────┘
```

**Countdown timer:**
- Shows minutes and seconds
- Timer text turns orange at 3 minutes remaining
- Timer text turns red and pulses at 1 minute remaining
- When timer hits 0:
  ```
  ⏰ QR Expired
  Your booking was held for 15 minutes.
  
  [  Reserve Again & Get New QR  ]
  [  Cancel  ]
  ```

**Payment detected:**
When the QR is scanned and payment clears (real-time, Stripe webhook):

```
✅ Payment Successful!

   🎉 Your booking is confirmed!

   DLG-2025-0042
   Angkor Sunrise 2-Day Package
   Dec 20–22, 2025

   ⭐ 364 loyalty points earned!

   [  View My Trip  ]  [  Share  ]
```

Confetti animation plays.

---

### Payment Path B — Card

User selects "Credit / Debit Card" and taps "Pay Now."

**What the user sees:**
```
Card Details

  Card number:  [ ____ ____ ____ ____ ]
  Name on card: [ ____________________]
  Expiry:       [ MM/YY ]  CVV: [___]

  ☐ Save card for future bookings
  
  [  Pay $182.20  ]
```

After tapping Pay:
- Spinner shows while processing
- If 3D Secure required → bank's verification page opens in a bottom sheet
- After verification → same success screen as QR path

**Failed payment:**
```
❌ Payment Failed

   Your card was declined.
   (Code: insufficient_funds)

   Please check your card details or 
   try a different payment method.

   [  Try Again  ]  [  Use QR Code  ]
```

---

## Acceptance Criteria

- Total shown on the payment screen is identical to the total shown on the booking summary — no additional fees at checkout
- QR code countdown is real-time (not a static "15 minutes")
- Loyalty points cannot be used for more than 30% of the total
- After successful payment, confirmation appears within 5 seconds
- If payment fails 3 times, user is shown a human support contact option
- Payment failure messages include the specific reason (declined, insufficient funds, expired card) not just "payment failed"

---
---

# F09 — Emergency & Safety System

**Feature Name:** Emergency & Safety System (SOS)  
**Short Description:** A one-tap SOS system that shares the user's GPS location with DerLg's 24/7 support team, local emergency services, and the traveler's own emergency contact — even in areas with poor connectivity.

---

## Why This Feature Exists

Cambodia's rural and remote areas — jungle temples, mountain roads, coastal islands — can have poor mobile coverage. A tourist who twists an ankle at Koh Ker ruins, 2 hours from the nearest hospital, needs a way to reach help that doesn't rely on a good data connection. DerLg's emergency system works offline and can send an alert via SMS fallback when the internet is unavailable.

---

## User Stories

> **As a solo traveler in a remote area**, I want to trigger an emergency alert with one hold of a button, so help is sent even if I can't speak or type.

> **As a parent traveling with children**, I want to share my live location with my family back home during the trip, so they can see where we are at all times.

> **As a traveler who had an accident**, I want to see the local hospital and police contact numbers immediately, so I don't have to search while in distress.

> **As a traveler with poor connectivity**, I want the emergency system to still work offline, so I'm not helpless in remote areas.

> **As a guide or driver**, I want to be notified immediately if my traveler triggers an SOS, so I can reach them quickly.

---

## Entry Points

- Tapping the **"Profile"** tab → "Emergency" section
- Red **SOS button** on the emergency screen (accessible in 2 taps from anywhere)
- Emergency info section at the bottom of every confirmed booking's detail page

---

### Screen 1 — Emergency Screen

```
┌──────────────────────────────────┐
│  ← Emergency & Safety   🌐      │
├──────────────────────────────────┤
│  ⚠️ This page works offline     │
│     (info cached when online)    │
├──────────────────────────────────┤
│                                  │
│   ┌──────────────────────────┐   │
│   │                          │   │
│   │    🆘 HOLD FOR SOS       │   │
│   │   (hold 3 seconds)       │   │
│   │                          │   │
│   └──────────────────────────┘   │
│                                  │
│   Hold the button for 3 seconds  │
│   to send an alert with your     │
│   GPS location to:               │
│   ✅ DerLg 24/7 support          │
│   ✅ Local emergency services    │
│   ✅ Your emergency contact      │
│                                  │
├──────────────────────────────────┤
│  📍 Your current location:       │
│  Siem Reap Province, Cambodia    │
│  Last updated: just now          │
│  [  Share Location Link  ]       │
├──────────────────────────────────┤
│  Emergency Contacts              │
│  Siem Reap Province              │
│                                  │
│  🚓 Police:        117           │
│  🚑 Ambulance:     119           │
│  🏥 Nearest hospital:            │
│     Angkor Hospital for Children │
│     0.8 km · +855 63 963 409     │
│     [  Call  ]  [  Get Directions ]│
│                                  │
│  📞 DerLg 24/7 Support:          │
│     +855 12 345 678              │
│     [  Call  ]  [  WhatsApp  ]   │
│                                  │
│  👤 Your emergency contact:      │
│     Mom · +855 99 XXX XXX        │
│     [  Call  ]                   │
│  [  Edit emergency contact  ]    │
└──────────────────────────────────┘
```

**Province-aware contacts:**
Emergency contacts are shown for the traveler's **current province** based on GPS. If GPS is unavailable, defaults to the province of their upcoming confirmed booking.

---

### SOS Button Interaction

**Activation (to prevent accidental triggers):**
- Button requires a 3-second press-and-hold
- Circular progress ring fills around the button as user holds
- At 1 second: button vibrates
- At 2 seconds: "Release to cancel" text appears (user can still release to cancel)
- At 3 seconds: SOS is triggered

**After SOS triggers:**

```
┌──────────────────────────────────┐
│  🆘 ALERT SENT                   │
├──────────────────────────────────┤
│  Your location has been shared   │
│  with DerLg support.             │
│                                  │
│  📍 Location sent:               │
│  13.4125° N, 103.8667° E         │
│  Siem Reap Province, Cambodia    │
│  Accuracy: ±15 meters            │
│                                  │
│  Support is on their way.        │
│  Average response time: 4 min    │
│                                  │
│  Status: ⏳ SENT                  │
│  Updated: just now               │
│                                  │
│  Emergency contacts also notified│
│                                  │
│  ────────────────────────────── │
│  Still need to call?             │
│  🚓 Police: [  Call 117  ]       │
│  🏥 Ambulance: [  Call 119  ]    │
│  📞 DerLg: [  Call Support  ]    │
│                                  │
│  [  This was a false alarm  ]    │
└──────────────────────────────────┘
```

**Status updates (real-time, from support dashboard):**
- ⏳ SENT → Immediately when alert fires
- 👀 ACKNOWLEDGED → Support agent sees the alert (usually within 4 minutes)
- ✅ RESOLVED → Support agent marks as resolved after contact

These status labels update in real-time on the user's screen.

---

### Low Connectivity / Offline Mode

When the user has no internet:
1. App detects no network connection
2. Emergency screen shows a yellow banner: "⚠️ Offline — SMS fallback enabled"
3. When SOS is pressed, the app sends an SMS from the user's phone number (no internet needed) to DerLg's support SMS line
4. SMS format: "DERLG SOS [user name] [GPS coordinates] [timestamp]"
5. Cached emergency contacts are shown (stored from last online session)

Note displayed on screen: "You're offline. Emergency contacts below are saved from your last online session and may not reflect current location."

---

### Location Sharing (Non-Emergency)

Users can optionally share a live location link with family back home:

```
Share Your Location

  "Share a live tracking link with 
   someone at home so they can see 
   where you are during your trip."

  Link expires after:
  ○ 24 hours
  ● 3 days
  ○ Duration of my trip

  [  Generate Link  ]
```

After generating: a short link (e.g., derlg.com/track/abc123) is created and user can copy/share via any messaging app. The link shows a live map pin updated every 5 minutes.

---

## Acceptance Criteria

- SOS button requires 3-second hold (no accidental triggers)
- Alert reaches DerLg support dashboard within 30 seconds of activation
- Emergency contacts are accurate for every province (updated quarterly)
- Offline mode works: SMS fallback sends even with no data connection
- "This was a false alarm" button cancels the alert and notifies support
- Emergency page loads without any network connection (fully cached)
