### Home Screen

**User Story:** As a user, I want to see featured trips, upcoming festivals, and quick access to the AI assistant, so that I can discover travel opportunities and get help planning my trip.

#### Acceptance Criteria

1. THE Frontend_App SHALL display a hero section with a search bar and AI quick-start button on the Home screen
2. THE Frontend_App SHALL fetch and display featured trips from the Backend_API with images, titles, prices, and durations
3. THE Frontend_App SHALL fetch and display upcoming festivals from the Backend_API with dates, locations, and descriptions
4. WHEN a user clicks a featured trip, THE Frontend_App SHALL navigate to the trip detail page
5. WHEN a user clicks the AI quick-start button, THE Frontend_App SHALL open the full-screen AI chat interface
6. THE Frontend_App SHALL display a categories section with icons for Temples, Nature, Culture, Adventure, and Food
7. WHEN a user clicks a category, THE Frontend_App SHALL navigate to the Explore screen with that category pre-filtered
8. THE Frontend_App SHALL implement infinite scroll or pagination for featured trips
9. THE Frontend_App SHALL display loading skeletons while fetching data from the Backend_API
# DerLg.com — Home Screen

**Route:** `/home`  
**File:** `app/(main)/home/page.tsx`  
**Auth:** Required (redirect to /login if not authenticated)

---

## 1. Purpose

The Home screen is the first thing a logged-in user sees. It serves as a dashboard that:
- Welcomes the user by name
- Gives quick access to the AI chat assistant
- Shows featured and recommended trips
- Displays upcoming festivals with alerts
- Shows a quick-access emergency button
- Displays the user's loyalty point balance

---

## 2. Screen Sections (Top to Bottom)

### 2.1 Top Bar
- DerLg logo (left)
- Language selector (right): taps cycle through EN → KH → ZH
- Notification bell icon with unread count badge
- Tapping the bell opens the notifications drawer

### 2.2 Welcome Banner
- "Good morning, [Name]! 🌅" (greeting changes based on time of day)
- Current loyalty points displayed as: "⭐ 820 points"
- Tapping the points display navigates to `/profile/loyalty`

### 2.3 AI Assistant Quick-Start Card
- Prominent card with gradient background
- Text: "Plan your Cambodia adventure 🤖"
- Subtitle: "Ask me anything — hotels, temples, transport, budget..."
- Button: "Start Chat" → navigates to `/chat` and opens the AI agent
- If the user has an active chat session, this shows: "Continue your conversation →"

### 2.4 Featured Trips Carousel
- Horizontal scroll of 3-5 curated trip package cards
- Each card shows:
  - Destination image (full bleed)
  - Trip title
  - Duration badge (e.g., "2 days")
  - Price starting from (e.g., "From $89/person")
  - Rating stars
- Tapping a card opens the trip detail modal
- Data fetched from `GET /v1/trips/featured` (cached 1 hour by React Query)

### 2.5 Upcoming Festivals Banner
- Shows the next upcoming festival (within 30 days) if any
- Example: "🎉 Water Festival — Nov 5-7 in Phnom Penh"
- Shows discount badge if festival discount is active: "🎟 15% off during festival!"
- Tapping opens the Festival detail in the Explore screen

### 2.6 Browse by Category Grid
- 2×2 icon grid for quick navigation:
  - 🚐 Transport → /booking/transport
  - 🏨 Hotels → /booking/hotel
  - 👨‍🏫 Guides → /booking/guide
  - 🗺️ Explore → /explore

### 2.7 Popular Destinations Row
- Horizontal scroll of province cards with photos
- Provinces: Siem Reap, Phnom Penh, Kampot, Sihanoukville, Battambang
- Tapping a province filters the Explore screen to that location

### 2.8 Recent Booking Quick-View (if active booking exists)
- Shows the most recent upcoming booking
- Trip name, date, status badge
- Quick-access "View Details" link

---

## 3. Data Fetching Strategy

All data on the home screen uses React Query with background refetching:

| Data | Endpoint | Cache TTL | Stale Time |
|---|---|---|---|
| User profile | GET /v1/users/me | 5 min | 2 min |
| Featured trips | GET /v1/trips/featured | 1 hour | 30 min |
| Upcoming festivals | GET /v1/festivals/upcoming?days_ahead=30 | 1 hour | 30 min |
| Recent booking | GET /v1/bookings/my?limit=1&status=CONFIRMED | 2 min | 1 min |
| Loyalty balance | GET /v1/loyalty/balance | 5 min | 2 min |

---

## 5. Loading States

- Each section uses skeleton loading cards while data is fetching
- Skeleton cards match the exact dimensions of the real content to prevent layout shift
- The AI Quick-Start Card never shows a skeleton — it is always visible immediately as it requires no API call

---

## 6. Empty States

- If no upcoming bookings: hide the Recent Booking Widget entirely
- If no upcoming festivals: hide the Festival Banner entirely
- If featured trips fetch fails: show "Explore our trips →" link to /explore instead of the carousel

---

## 7. Floating AI Button

A floating action button (FAB) is positioned above the bottom navigation bar and is visible on ALL main screens including Home. It uses the DerLg brand color.

- Icon: Robot/AI icon
- Label: "AI Chat" (shown on first load, hides after 3 seconds)
- Tap → navigates to /chat
- Has a pulsing animation on first-time users to attract attention
- Dismissed animation note stored in localStorage to prevent repeating
