# DerLg.com — Explore Screen

**Route:** `/explore`  
**File:** `app/(main)/explore/page.tsx`  
**Auth:** Public (accessible without login, but login required to bookmark)

---

## 1. Purpose

The Explore screen is the cultural and discovery hub of DerLg.com. It gives travelers rich information about Cambodia's historical places, cultural insights, festivals, and events — with offline capability so travelers can access content even in remote temple areas.

---

## 2. Screen Sections

### 2.1 Search Bar
- Sticky at the top
- Placeholder: "Search temples, provinces, festivals..."
- Real-time search as user types (debounced 300ms)
- Calls `GET /v1/places/search?query=...`
- Results appear in a dropdown below the search bar

### 2.2 Province Filter Pills
- Horizontal scroll row of province name chips
- All | Siem Reap | Phnom Penh | Kampot | Battambang | Sihanoukville | + More
- Tapping a province filters all content below to that province
- "All" is selected by default

### 2.3 Categories Tab Row
- Places | Festivals | Maps
- Each tab switches the content area below

### 2.4 Places Tab

#### Featured Place Hero Card
- Full-width card with large image and overlay text
- Shows the "Place of the Week" curated by DerLg
- Example: "Angkor Wat — The World's Largest Religious Monument"

#### Historical Places Grid
- 2-column card grid
- Each card:
  - Place photo
  - Place name (translated to user's language)
  - Province badge
  - Category icon (temple, museum, nature, etc.)
  - Entry fee or "Free" badge
  - Short one-line description
- Tapping opens Place Detail screen at `/explore/[place-id]`

### 2.5 Festivals Tab

#### Upcoming Festival Banner
- Full-width banner for the next festival
- Festival name, dates, province
- Days remaining badge: "In 12 days"
- Discount badge if applicable: "🎟 15% off bookings during this festival"
- "Set Reminder" button → creates a push notification reminder for 1 day before the festival

#### Festival Calendar
- Month view calendar highlighting festival dates
- Days with festivals have colored dots
- Tapping a date shows that day's events in a bottom sheet

#### Past Festivals
- Collapsed "View Past Festivals" section
- Shows photos and descriptions of past festivals for cultural education

### 2.6 Maps Tab

#### Offline Map View
- Embedded Leaflet.js map pre-loaded with Cambodia
- All major historical sites are pre-marked as pins
- User's GPS location shown as a blue dot (if location permission granted)
- "Download for Offline" button → triggers service worker to cache the map tiles for the current province
- Offline indicator badge shows "✓ Siem Reap available offline"
- Tapping a map pin opens a compact Place card at the bottom of the screen
- "Get Directions" link opens native maps app

---

## 3. Place Detail Screen

**Route:** `/explore/[place-id]`

### Header
- Full-bleed photo hero with back button
- Gradient overlay with place name
- Favorite (bookmark) icon — requires login

### Content Sections

#### About
- Full cultural description (3-5 paragraphs)
- Translated in user's preferred language
- Historical context and significance

#### Visitor Information
- Opening hours (table by day)
- Entry fee in USD and KHR
- Dress code requirements (highlighted in orange if strict, e.g., "Must cover knees and shoulders")
- Best time to visit
- Photography rules

#### Cultural Insights
- "Did you know?" fact boxes
- Local legends or stories about the place
- Etiquette tips specific to the site

#### Photos Gallery
- Photo grid (6-12 images)
- Tap to open full-screen lightbox with swipe navigation

#### Map & Getting There
- Small embedded map showing the place location
- Distance from popular nearby cities
- Transport options with estimated cost
  - Tuk tuk from city: ~$5
  - Van hire: see transport booking

#### Reviews
- Average rating (stars + number)
- 5 most recent reviews with photos
- "Write a review" button (requires completed booking to a nearby location or manually enabled by admin)

#### Book Related Trip
- "Explore nearby packages" CTA
- Shows 2-3 trip cards that include this place
- "Ask AI for recommendations" shortcut to /chat

---

## 4. Festival Detail Screen

**Route:** `/explore/festivals/[festival-id]`

### Content
- Festival banner image
- Festival name and dates
- Province and location
- Cultural background — what the festival is and why it's celebrated
- What to expect — activities, events, crowd size
- Best spots to watch or participate
- Practical tips (traffic, accommodation demand, safety)
- Discount code (shown if `has_discount = true`): "Use code FESTIVAL10 for 15% off any booking during this period"
- "Book Now" CTA → navigates to /booking or /chat

---

## 5. Offline Capability

### What is cached for offline
- Place descriptions and visitor information (all active places)
- Map tiles for the selected province
- Festival dates and descriptions (upcoming festivals)
- Emergency contacts for each province

### What is NOT available offline
- Real-time availability and pricing
- Booking flows
- AI chat

### Cache Management
- Offline content is cached when the user is on WiFi and the app is in the foreground
- A "Download for offline use" button manually triggers caching for a selected province
- Cached content shows a "Last updated: Dec 1" badge
- Cache is updated automatically every 24 hours when online

---

## 6. Data Fetching

| Data | Endpoint | Cache TTL |
|---|---|---|
| Places list | GET /v1/places | 24 hours |
| Place detail | GET /v1/places/:id | 24 hours |
| Search results | GET /v1/places/search | 5 minutes |
| Upcoming festivals | GET /v1/festivals/upcoming | 1 hour |
| Festival detail | GET /v1/festivals/:id | 24 hours |
