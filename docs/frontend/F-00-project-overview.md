# DerLg.com — Frontend Project Overview

**Framework:** Next.js 14 (App Router)  
**Styling:** Tailwind CSS  
**State Management:** Zustand + React Query (TanStack Query)  
**Real-time:** WebSocket (native) + Server-Sent Events  
**Folder:** `apps/frontend/`

---

## 1. Role of the Frontend

The Next.js frontend is the user-facing interface for DerLg.com. It is a mobile-first web application that closely mimics a native mobile app experience, built with Next.js PWA capabilities.

The frontend:
- Renders all screens (Home, Explore, Booking, My Trip, Profile)
- Communicates exclusively with the NestJS backend API (never with Supabase or Stripe directly)
- Maintains a WebSocket connection to the AI agent for the chat interface
- Renders structured AI responses (trip cards, QR codes, booking confirmations)
- Supports offline map access via service workers
- Supports Khmer, English, and Chinese via i18n
- Is installable as a PWA on Android and iOS

---

## 2. Folder Structure

```
apps/frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── (main)/
│   │   ├── layout.tsx                  # Main layout with bottom nav
│   │   ├── home/page.tsx
│   │   ├── explore/
│   │   │   ├── page.tsx                # Explore landing
│   │   │   ├── [place-id]/page.tsx     # Place detail
│   │   │   └── festivals/page.tsx
│   │   ├── booking/
│   │   │   ├── page.tsx                # Booking landing
│   │   │   ├── transport/page.tsx
│   │   │   ├── hotel/page.tsx
│   │   │   └── guide/page.tsx
│   │   ├── my-trip/
│   │   │   ├── page.tsx                # My bookings list
│   │   │   └── [booking-id]/page.tsx   # Booking detail
│   │   └── profile/
│   │       ├── page.tsx
│   │       ├── emergency/page.tsx
│   │       ├── loyalty/page.tsx
│   │       └── student/page.tsx
│   │
│   ├── chat/page.tsx                   # AI Chat interface (full screen)
│   ├── layout.tsx                      # Root layout
│   └── globals.css
│
├── components/
│   ├── ui/                             # Base components (Button, Card, Modal, etc.)
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   ├── TopBar.tsx
│   │   └── PageContainer.tsx
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── TripCard.tsx
│   │   ├── ImageGallery.tsx
│   │   ├── QRPaymentDisplay.tsx
│   │   ├── BookingConfirmCard.tsx
│   │   ├── ItineraryDisplay.tsx
│   │   ├── WeatherCard.tsx
│   │   └── BudgetEstimateCard.tsx
│   ├── booking/
│   │   ├── VehicleCard.tsx
│   │   ├── HotelCard.tsx
│   │   ├── GuideCard.tsx
│   │   └── BookingSummary.tsx
│   ├── explore/
│   │   ├── PlaceCard.tsx
│   │   ├── FestivalCard.tsx
│   │   ├── OfflineMapView.tsx
│   │   └── CulturalInsight.tsx
│   └── emergency/
│       ├── EmergencyButton.tsx
│       └── EmergencyContactsSheet.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useWebSocket.ts
│   ├── useGeolocation.ts
│   ├── useOfflineQueue.ts
│   └── useLoyaltyPoints.ts
│
├── stores/
│   ├── authStore.ts                    # Zustand: user session
│   ├── chatStore.ts                    # Zustand: chat messages
│   └── bookingStore.ts                 # Zustand: active booking flow
│
├── lib/
│   ├── api.ts                          # Axios instance with token refresh
│   ├── i18n.ts                         # Language configuration
│   └── formatters.ts                   # Currency, date formatters
│
├── public/
│   ├── manifest.json                   # PWA manifest
│   ├── sw.js                           # Service worker for offline
│   └── icons/
│
├── messages/                           # i18n translation files
│   ├── en.json
│   ├── kh.json
│   └── zh.json
│
└── next.config.ts
```

---

## 3. Navigation — 5 Bottom Tabs

The app has exactly 5 bottom navigation items. This layout is persistent across all main screens.

| Tab | Icon | Route | Description |
|---|---|---|---|
| Home | 🏠 | /home | Dashboard with featured trips and quick actions |
| Explore | 🗺️ | /explore | Historical places, festivals, cultural content |
| Booking | 🎫 | /booking | Book transport, hotel, or guide |
| My Trip | 📋 | /my-trip | All confirmed and upcoming bookings |
| Profile | 👤 | /profile | Account, emergency, loyalty, student status |

The AI chat button is a floating action button (FAB) accessible from any screen, overlaying the bottom nav.

---

## 4. Tech Stack Details

| Technology | Purpose |
|---|---|
| Next.js 14 App Router | Page routing, SSR for SEO, API routes |
| Tailwind CSS | Utility-first styling |
| Zustand | Lightweight global state (auth, chat) |
| TanStack Query (React Query) | Server state, caching, background refetch |
| next-intl | Multi-language support (EN, KH, ZH) |
| Leaflet.js | Offline-capable map rendering |
| Workbox (next-pwa) | Service worker, offline caching strategy |
| Framer Motion | Smooth animations and transitions |
| Stripe.js | Client-side payment form rendering |
| Socket.io-client | WebSocket connection to AI agent |
| QRCode.react | QR code display component |
| date-fns | Date formatting and manipulation |
| Sentry | Frontend error tracking |

---

## 5. Authentication State

The auth state is managed in `authStore.ts` (Zustand). It holds:
- `user`: The current user object (id, name, email, role, loyalty_points, is_student)
- `accessToken`: The JWT access token stored in memory only (not localStorage)
- `isAuthenticated`: Boolean derived from token existence

The `lib/api.ts` Axios instance:
1. Attaches `accessToken` to every request as `Authorization: Bearer <token>`
2. Intercepts 401 responses
3. Calls `POST /v1/auth/refresh` using the httpOnly cookie
4. Retries the original request with the new token
5. If refresh fails, clears auth state and redirects to `/login`

---

## 6. Multi-Language Support (i18n)

Three languages are supported throughout the app: English (EN), Khmer (KH), Chinese (ZH).

Language preference is:
1. Stored in the user's profile (`preferred_language`)
2. Saved locally in a cookie for unauthenticated pages
3. Changeable at any time from the Profile screen

All UI strings are stored in JSON translation files under `/messages/`. API responses that include user-facing content (trip names, place descriptions) return the localized version based on the `Accept-Language` header sent with every API request.

The chat interface additionally instructs the AI agent to respond in the user's preferred language, which is injected into the system prompt.

---

## 7. PWA (Progressive Web App) Configuration

DerLg.com is installable as a PWA on Android and iOS. The PWA configuration enables:

- **Install prompt** on mobile browsers
- **Offline access** to cached pages (home, explore, emergency contacts)
- **Push notifications** for booking reminders and emergency alerts
- **Splash screen** and standalone display (no browser chrome)
- **App icon** on home screen

Service worker caching strategy:
- Static assets (JS, CSS, fonts): Cache First
- API responses for places and festivals: Stale While Revalidate (30-minute TTL)
- Emergency contacts: Cache First (never stale — always updated on login)
- Booking and payment data: Network First (always fresh)

---

## 8. Screen Index

| File | Feature |
|---|---|
| `F-01-home-screen.md` | Home dashboard |
| `F-02-explore-screen.md` | Explore places and festivals |
| `F-03-booking-screen.md` | Booking flows (transport, hotel, guide) |
| `F-04-my-trip-screen.md` | Active and past bookings |
| `F-05-profile-screen.md` | Profile, emergency, loyalty, student |
| `F-06-ai-chat-interface.md` | Full AI chat screen and message rendering |
| `F-07-payment-flow.md` | Payment screens and QR display |
| `F-08-multi-language.md` | i18n implementation |
| `F-09-offline-maps.md` | Offline map feature |
| `F-10-pwa-setup.md` | PWA install, push notifications |
