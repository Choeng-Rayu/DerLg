# F10 — Student Discount Verification

**Feature Name:** Student Discount Verification  
**Short Description:** Students can upload their student ID and a selfie to verify their student status and unlock a 15% discount on all DerLg bookings for 12 months.

---

## Why This Feature Exists

Cambodia is a popular destination for student travel programs, school trips, and young budget travelers. A 15% discount is meaningful when you're on a student budget. DerLg offers this as a genuine benefit — not just a checkbox — with a lightweight verification process that protects against misuse without burdening legitimate students.

---

## User Stories

> **As a university student**, I want to verify my student status once and have the discount applied automatically to all future bookings, so I don't have to remember a code every time.

> **As a student who just uploaded their ID**, I want to know exactly when my verification will be approved, so I can plan my booking around it.

> **As a student whose ID is expiring soon**, I want to be reminded to re-verify before my discount expires, so I don't lose the benefit mid-trip.

> **As a student traveling in a group**, I want each group member to be able to verify individually, so we all get the discount.

---

## Discount Details

| Detail | Value |
|---|---|
| Discount amount | 15% off booking total |
| Valid for | 12 months from verification date |
| Applies to | All bookings (transport, hotel, guide, packages) |
| Can combine with promo code? | No — student discount is separate |
| Can combine with loyalty points? | Yes |

---

## User Flow

### Entry Points
- Profile tab → "Student Discount" section
- Checkout screen (if not verified, shows "Are you a student? Save 15% →" banner)

---

### Screen 1 — Student Discount Landing

**For unverified users:**

```
┌──────────────────────────────────┐
│  ← Student Discount              │
├──────────────────────────────────┤
│       🎓 Student Discount        │
│                                  │
│   Save 15% on every booking!     │
│                                  │
│   ✅ 15% off transport           │
│   ✅ 15% off hotels              │
│   ✅ 15% off tour guides         │
│   ✅ Valid for 12 months         │
│                                  │
│   Eligible students:             │
│   University, college, or high   │
│   school students with a valid   │
│   student ID.                    │
│                                  │
│   What you'll need:              │
│   📄 Your student ID card        │
│   🤳 A quick selfie              │
│                                  │
│   Verification takes 24–48 hours.│
│                                  │
│   [  Start Verification  ]       │
└──────────────────────────────────┘
```

**For verified users:**

```
┌──────────────────────────────────┐
│  ← Student Discount              │
├──────────────────────────────────┤
│   ✅ Student Discount Active     │
│                                  │
│   Your 15% discount is applied   │
│   automatically at checkout.     │
│                                  │
│   Verified:  June 15, 2025       │
│   Expires:   June 15, 2026       │
│                                  │
│   [████████████░░░░░] 8 months   │
│   remaining                      │
│                                  │
│   Total saved so far: $34.50     │
│                                  │
│   [  Re-verify (renew)  ]        │
└──────────────────────────────────┘
```

---

### Screen 2 — Step 1: Upload Student ID

User taps "Start Verification."

```
┌──────────────────────────────────┐
│  ← Verification (1 of 3)         │
│  Step 1: Upload Student ID       │
├──────────────────────────────────┤
│   Take a photo of your student   │
│   ID card or university card.    │
│                                  │
│   📋 Requirements:               │
│   • ID must be clearly readable  │
│   • Must show your name          │
│   • Must show expiry date        │
│   • Photo must not be blurry     │
│                                  │
│   ┌──────────────────────────┐   │
│   │                          │   │
│   │   [ Tap to take photo ]  │   │
│   │        or                │   │
│   │   [ Upload from gallery ]│   │
│   │                          │   │
│   └──────────────────────────┘   │
│                                  │
│   Examples of valid IDs:         │
│   [Sample ID image — blurred]    │
└──────────────────────────────────┘
```

**After photo is taken/selected:**
- App immediately checks for basic quality (not blurry, not too dark)
- If poor quality: "This photo looks blurry — please retake it for faster approval."
- If quality OK: green checkmark overlay on photo thumbnail
- "Continue to Step 2" button activates

---

### Screen 3 — Step 2: Take a Selfie

```
┌──────────────────────────────────┐
│  ← Verification (2 of 3)         │
│  Step 2: Selfie                  │
├──────────────────────────────────┤
│   We'll match your face to your  │
│   student ID photo.              │
│                                  │
│   📋 Requirements:               │
│   • Face must be clearly visible │
│   • Good lighting                │
│   • No sunglasses                │
│   • Look directly at camera      │
│                                  │
│   ┌──────────────────────────┐   │
│   │                          │   │
│   │   [Camera viewfinder]    │   │
│   │                          │   │
│   │   😊 Face outline guide  │   │
│   │                          │   │
│   └──────────────────────────┘   │
│                                  │
│   Liveness check:                │
│   "Please slowly blink twice"    │
│   ○○● progress dots              │
│                                  │
└──────────────────────────────────┘
```

**Liveness check:**
- Prevents using a photo of someone else's photo
- App shows an instruction: "Blink twice" or "Slowly turn your head left"
- Camera detects the action before accepting the selfie
- If liveness check fails 3 times: "Having trouble? Use the manual review option" → allows submitting without liveness but flags for admin review

---

### Screen 4 — Step 3: Confirm & Submit

```
┌──────────────────────────────────┐
│  ← Verification (3 of 3)         │
│  Review & Submit                 │
├──────────────────────────────────┤
│   Student ID Photo:              │
│   ┌──────┐  ✅ Accepted          │
│   │[photo│                       │
│   │thumb]│                       │
│   └──────┘  [Retake]             │
│                                  │
│   Selfie:                        │
│   ┌──────┐  ✅ Accepted          │
│   │[photo│                       │
│   │thumb]│                       │
│   └──────┘  [Retake]             │
│                                  │
│   ──────────────────────────── │
│   Verification time: 24–48 hours │
│   You'll be notified when done.  │
│                                  │
│   ☐ I confirm this is my genuine │
│     student ID                   │
│                                  │
│   [  Submit for Review  ]        │
└──────────────────────────────────┘
```

---

### Pending Status Screen

After submission:

```
┌──────────────────────────────────┐
│  Verification Submitted ✅       │
├──────────────────────────────────┤
│   Your application is under      │
│   review.                        │
│                                  │
│   Status: ⏳ PENDING             │
│   Submitted: today at 2:34 PM    │
│   Expected: within 24–48 hours   │
│                                  │
│   We'll send you a push          │
│   notification when your         │
│   student status is approved.    │
│                                  │
│   What happens next?             │
│   1. Our team checks your ID     │
│   2. Face match verification     │
│   3. Discount activated! 🎓      │
│                                  │
│   Questions? Chat with support → │
└──────────────────────────────────┘
```

---

### Approval Notification

Push notification received:
```
🎓 Student discount approved!
   Your 15% discount is now active.
   Start saving on your next booking.
```

Tapping the notification opens the Student Discount screen showing the active status.

---

### Rejection Handling

If rejected (most common reason: ID photo too blurry or ID expired):

Push notification:
```
⚠️ Verification needs attention
   There was an issue with your
   student ID verification.
   Tap to see details.
```

Rejection screen:
```
┌──────────────────────────────────┐
│  Verification Unsuccessful       │
├──────────────────────────────────┤
│   Reason: Student ID is expired  │
│                                  │
│   Your student ID shows an expiry│
│   date of June 2024. We can only │
│   verify currently valid IDs.    │
│                                  │
│   If you believe this is an      │
│   error, contact our support.    │
│                                  │
│   [  Try Again  ]                │
│   [  Contact Support  ]          │
└──────────────────────────────────┘
```

---
---

# F11 — Loyalty & Bonus Points

**Feature Name:** Loyalty & Bonus Points  
**Short Description:** Users earn points on every completed booking and can redeem them for discounts, free services, and upgrades on future trips.

---

## Why This Feature Exists

DerLg wants travelers to come back. The loyalty system rewards users who book consistently — a solo traveler's first booking earns double points, a 5-day trip earns 2× points, a booking during a festival period earns bonus points. Redeeming points feels immediate and valuable — not like the frustrating airline miles programs where points expire before you can use them.

---

## User Stories

> **As a frequent traveler**, I want to see my points balance clearly and know exactly how close I am to a reward, so I'm motivated to book again.

> **As a user with 2,000 points**, I want to redeem them for a free guide day, so I feel like my loyalty is genuinely rewarded.

> **As a new user on my first booking**, I want to earn double points, so I feel welcomed and motivated to use the app again.

> **As a user who referred a friend**, I want to see when my referral points are credited, so I know the referral worked.

---

## Points Earning Rules

| Trigger | Points Earned |
|---|---|
| Every $1 spent (completed booking) | 2 points |
| First booking (any amount) | 2× multiplier |
| Trip 3+ days long | 1.5× multiplier |
| Trip 5+ days long | 2× multiplier |
| Booking during festival period | 1.25× multiplier |
| Successful referral (friend's first booking) | 500 flat points |
| Leaving a review after a trip | 50 flat points |

*Multipliers stack. A first booking of 5 days during a festival = 2× × 1.25× = 2.5× points.*

Points are credited **the day after the trip ends** (not at booking time — avoids awarding points for cancelled trips).

---

## Redemption Options

| Redemption | Points Required | Value |
|---|---|---|
| $1 off any booking | 100 points | 1¢/point |
| Free tuk tuk (half day) | 500 points | ~$12 value |
| Free guide (1 day) | 2,000 points | ~$45 value |
| VIP van upgrade | 1,500 points | ~$30 value |
| Hotel breakfast add-on | 800 points | ~$15 value |
| Temple pass contribution | 1,800 points | ~$37 value |

---

## User Flow

### Entry Point
- Profile tab → "Loyalty Points"
- Home screen: points balance shown in the welcome banner
- Checkout screen: "Apply points" section

---

### Screen 1 — Loyalty Dashboard

```
┌──────────────────────────────────┐
│  ← Loyalty & Rewards    🌐      │
├──────────────────────────────────┤
│                                  │
│   ⭐ 820 points                  │
│   = $8.20 in booking credit      │
│                                  │
│   [██████████░░░░░░░░░]          │
│   820 / 2,000 for free guide day │
│   1,180 more points needed       │
│                                  │
│   Total earned:    1,420 pts     │
│   Total redeemed:    600 pts     │
│   Points expiry:  Dec 2027       │
│                                  │
├──────────────────────────────────┤
│  Earn More Points                │
│  ─────────────────────────────   │
│  📅 Book a 3-day trip → 1.5×    │
│  🎉 Book during Water Festival   │
│     (Nov 5–7) → 1.25× bonus     │
│  👥 Refer a friend → +500 pts   │
│  ⭐ Leave a review → +50 pts    │
├──────────────────────────────────┤
│  Redeem Points                   │
│  ─────────────────────────────   │
│  [See Rewards Catalog]           │
└──────────────────────────────────┘
```

---

### Screen 2 — Rewards Catalog

```
┌──────────────────────────────────┐
│  ← Rewards Catalog               │
│  Your balance: ⭐ 820 points     │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │ 🛺 Free Tuk Tuk (Half Day)  │  │
│  │ 500 points (~$12 value)     │  │
│  │ ✅ You can redeem this!     │  │
│  │ [  Redeem Now  ]            │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🚗 VIP Van Upgrade         │  │
│  │ 1,500 points               │  │
│  │ You need 680 more points   │  │
│  │ [  Learn How to Earn  ]    │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 👨‍🏫 Free Guide (1 Day)       │  │
│  │ 2,000 points               │  │
│  │ You need 1,180 more points │  │
│  │ [  Learn How to Earn  ]    │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**Redeemable items:** Green border, "✅ You can redeem this!" badge, "Redeem Now" button active.

**Not yet reachable:** Grey border, "X more points needed" text, "Learn How to Earn" button instead of redeem.

---

### Screen 3 — Points History

```
┌──────────────────────────────────┐
│  ← Points History                │
├──────────────────────────────────┤
│  Dec 21  +576 pts ⬆              │
│  Angkor Sunrise 2-Day Package    │
│  (2× first booking bonus applied)│
│                                  │
│  Dec 15  +50 pts ⬆               │
│  Review submitted                │
│                                  │
│  Dec 10  -500 pts ⬇              │
│  Free tuk tuk redeemed           │
│                                  │
│  Nov 28  +294 pts ⬆              │
│  3-day Kampot trip               │
│  (1.5× duration bonus applied)   │
└──────────────────────────────────┘
```

---

### Referral Program

In the Loyalty screen, a "Refer a Friend" section:

```
┌──────────────────────────────────┐
│  Refer a Friend                  │
│                                  │
│  Share your referral code and    │
│  both of you earn 500 points     │
│  when they complete their first  │
│  booking!                        │
│                                  │
│  Your code:  DERLG-CHAN5         │
│  [ Copy Code ]  [ Share Link ]   │
│                                  │
│  Referrals made:       3         │
│  Referrals completed:  2         │
│  Points earned:        1,000     │
└──────────────────────────────────┘
```

---
---

# F12 — Offline Maps

**Feature Name:** Offline Maps  
**Short Description:** Users can download interactive maps for a specific province to use without internet connection — including temple markers, hotels, and emergency locations.

---

## Why This Feature Exists

Angkor Wat's temple complex is enormous. Koh Ker ruins are 2 hours from the nearest WiFi. A traveler navigating by GPS in the jungle needs a map that works without cell coverage. DerLg's offline maps are pre-loaded with all DerLg-relevant locations: temples, hotels, guide meeting points, and emergency services.

---

## User Stories

> **As a traveler exploring Angkor Wat**, I want an offline map showing all the temple locations, so I can navigate between them without a data connection.

> **As a traveler flying to Siem Reap tomorrow**, I want to download the Siem Reap map on WiFi tonight, so I have it ready without paying for roaming data.

> **As a traveler in an emergency**, I want the offline map to show the nearest hospital, so I can find help even without internet.

---

## User Flow

### Entry Point
- Explore tab → "Maps" tab
- Any confirmed booking's detail page has a "Download offline map" section

---

### Screen — Maps Tab

```
┌──────────────────────────────────┐
│  Offline Maps                    │
├──────────────────────────────────┤
│  Downloaded Maps                 │
│  ─────────────────────────────   │
│  ✅ Siem Reap                   │
│     Last updated: Dec 1, 2025    │
│     Size: 18 MB  [ Delete ]      │
│                                  │
│  Download a Province Map         │
│  ─────────────────────────────   │
│  ○ Phnom Penh         22 MB      │
│  ○ Sihanoukville      14 MB      │
│  ○ Kampot             11 MB      │
│  ○ Battambang         13 MB      │
│  ○ Koh Kong           9 MB       │
│                                  │
│  [  Download Selected  ]         │
│  (WiFi recommended for download) │
└──────────────────────────────────┘
```

---

### Interactive Map Screen

User taps "Siem Reap" map to open it.

**What the user sees:**
- Full-screen map (Leaflet.js with OpenStreetMap tiles)
- Current GPS location as a blue dot (if location permission granted)
- Color-coded pins:
  - 🟠 Orange = DerLg trip departure/pickup points
  - 🟣 Purple = Historical sites and temples
  - 🔵 Blue = Hotels on DerLg
  - 🔴 Red = Emergency services (hospital, police)
  - 🟢 Green = Restaurants / rest stops

**Map controls:**
- Zoom in/out (pinch or buttons)
- "My Location" button (centers map on GPS)
- Layer toggle: show/hide categories of pins
- Search bar at top: "Search this map..."

**Tapping a pin:**
Opens a compact card at the bottom of the screen:
```
┌──────────────────────────────────┐
│ 🟣 Bayon Temple                  │
│ Angkor Archaeological Park       │
│ 1.2 km from your location        │
│ [ View Details ] [ Directions ]  │
└──────────────────────────────────┘
```

"View Details" → opens the place detail page (works offline if cached)
"Directions" → opens native Maps app (Google Maps / Apple Maps) with coordinates

---
---

# F13 — Multi-Language Support

**Feature Name:** Multi-Language Support (EN / KH / ZH)  
**Short Description:** The entire DerLg app — every screen, button, AI response, and notification — is available in English, Khmer, and Chinese.

---

## Why This Feature Exists

Cambodia's tourists come from three main language groups: English speakers (international tourists from Western countries and Australia), Chinese speakers (Cambodia's largest tourist market by volume), and Khmer speakers (local Cambodian travelers and diaspora). Without native-language support, DerLg would be inaccessible to the majority of its users.

---

## User Stories

> **As a Chinese tourist**, I want the entire app in Chinese, so I never have to struggle with English menu labels.

> **As a Khmer-speaking Cambodian local**, I want to plan my vacation in my own language, so using DerLg feels natural.

> **As a user who switches languages mid-session**, I want the AI chat to immediately respond in my new language, so I don't have to close and reopen the conversation.

---

## Language Coverage

| Element | English | Khmer | Chinese |
|---|---|---|---|
| All UI labels and buttons | ✅ | ✅ | ✅ |
| Trip names and descriptions | ✅ | ✅ | ✅ |
| Place descriptions | ✅ | ✅ | ✅ |
| Festival content | ✅ | ✅ | ✅ |
| AI chat responses | ✅ | ✅ (functional) | ✅ (excellent) |
| Error messages | ✅ | ✅ | ✅ |
| Booking confirmation emails | ✅ | ✅ | ✅ |
| Push notifications | ✅ | ✅ | ✅ |
| Emergency contacts page | ✅ | ✅ | ✅ |

---

## User Flow — Language Selection

### First Launch
On first app open (before login), the app shows:

```
┌──────────────────────────────────┐
│         Welcome to DerLg        │
│   Cambodia's Travel Platform     │
│                                  │
│   Select your language:          │
│                                  │
│   [🇬🇧 English]                  │
│   [🇰🇭 ភាសាខ្មែរ (Khmer)]         │
│   [🇨🇳 中文 (Chinese)]           │
│                                  │
│   You can change this any time   │
│   in your profile settings.      │
└──────────────────────────────────┘
```

### Changing Language (In-App)

Language selector is accessible from two places:
1. **Globe icon in the top-right corner** of the Home, Explore, and main screens
2. **Profile → Language** settings

Tapping the globe icon opens a 3-option bottom sheet:
```
[ 🇬🇧 English ]  ← checkmark if active
[ 🇰🇭 Khmer   ]
[ 🇨🇳 Chinese  ]
```

Tapping a language:
- All UI text switches immediately (no page reload)
- API calls from this point include `Accept-Language: kh` header
- AI chat receives instruction: "User has switched to Khmer. Respond in Khmer from now on."
- Language preference is saved to user profile

### Language in AI Chat

The AI detects the language of each message automatically. If a user writes in Chinese in an otherwise English conversation, the AI responds in Chinese from that message forward.

Users do not need to set the language in chat settings — the AI adapts automatically.

---

## Acceptance Criteria

- Language switch is instant (under 200ms)
- All 16 features are fully functional in all 3 languages
- Khmer script renders correctly on all screen sizes (Khmer characters are wider than Latin)
- AI chat adapts language mid-conversation without user action
- Notifications are sent in the user's saved language preference
