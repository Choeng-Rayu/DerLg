# DerLg.com — Frontend Architecture (Next.js 14)

**Service:** `apps/frontend`  
**Framework:** Next.js 14 App Router  
**Deploy:** Vercel (recommended) or Cloudflare Pages  
**Type:** Progressive Web App (PWA) — mobile-first, installable

---

## 1. Architecture Philosophy

The frontend is a **thin client**. It handles:
- Rendering UI from data returned by the backend and AI agent
- Maintaining auth state (JWT in memory)
- Offline caching via service worker
- WebSocket connection to the AI agent

It does NOT:
- Connect to Supabase directly
- Handle any payment logic
- Make decisions about pricing or availability
- Store sensitive data in localStorage

Every user action either calls the NestJS backend REST API or sends a message through the WebSocket to the AI agent.

---

## 2. Folder & File Architecture

```
apps/frontend/
│
├── app/                              ← Next.js App Router (all routes live here)
│   │
│   ├── layout.tsx                    ← Root layout: sets html lang, loads fonts, wraps providers
│   ├── globals.css                   ← Tailwind base + custom CSS variables
│   ├── not-found.tsx                 ← 404 page
│   │
│   ├── (auth)/                       ← Route group: NO bottom nav, NO auth required
│   │   ├── layout.tsx                ← Auth layout: centered card, DerLg logo
│   │   ├── login/
│   │   │   └── page.tsx              ← Email/password + Google OAuth login
│   │   ├── register/
│   │   │   └── page.tsx              ← Registration form (name, email, phone, language)
│   │   └── forgot-password/
│   │       └── page.tsx              ← Reset password flow
│   │
│   ├── (main)/                       ← Route group: HAS bottom nav, auth REQUIRED
│   │   ├── layout.tsx                ← Main layout: bottom nav + top bar + FAB (AI button)
│   │   │
│   │   ├── home/
│   │   │   └── page.tsx              ← Dashboard: featured trips, festivals, quick actions
│   │   │
│   │   ├── explore/
│   │   │   ├── page.tsx              ← Places grid, festivals tab, offline map tab
│   │   │   ├── [place-id]/
│   │   │   │   └── page.tsx          ← Place detail: photos, description, tips, reviews
│   │   │   └── festivals/
│   │   │       └── [festival-id]/
│   │   │           └── page.tsx      ← Festival detail: dates, cultural context, discount
│   │   │
│   │   ├── booking/
│   │   │   ├── page.tsx              ← Booking landing: choose transport / hotel / guide
│   │   │   ├── transport/
│   │   │   │   ├── page.tsx          ← Vehicle list with filters
│   │   │   │   └── [vehicle-id]/
│   │   │   │       └── page.tsx      ← Vehicle detail + date picker + book CTA
│   │   │   ├── hotel/
│   │   │   │   ├── page.tsx          ← Hotel list with province filter
│   │   │   │   └── [hotel-id]/
│   │   │   │       └── page.tsx      ← Hotel detail + room selection + availability
│   │   │   └── guide/
│   │   │       ├── page.tsx          ← Guide list with language filter
│   │   │       └── [guide-id]/
│   │   │           └── page.tsx      ← Guide profile + language + book CTA
│   │   │
│   │   ├── my-trip/
│   │   │   ├── page.tsx              ← List: upcoming + past bookings
│   │   │   └── [booking-id]/
│   │   │       ├── page.tsx          ← Booking detail: status, itinerary, contacts
│   │   │       └── cancel/
│   │   │           └── page.tsx      ← Cancellation confirm with refund preview
│   │   │
│   │   └── profile/
│   │       ├── page.tsx              ← Account info, language selector, logout
│   │       ├── emergency/
│   │       │   └── page.tsx          ← Emergency contacts + SOS button
│   │       ├── loyalty/
│   │       │   └── page.tsx          ← Points balance, history, rewards catalog
│   │       └── student/
│   │           └── page.tsx          ← Verification status + upload flow
│   │
│   └── chat/
│       └── page.tsx                  ← Full-screen AI chat interface (WebSocket)
│
├── components/
│   │
│   ├── ui/                           ← Base, reusable components (design system)
│   │   ├── Button.tsx                ← Variants: primary, secondary, ghost, danger
│   │   ├── Card.tsx                  ← Standard card wrapper with shadow/border
│   │   ├── Modal.tsx                 ← Bottom sheet on mobile, centered on desktop
│   │   ├── Badge.tsx                 ← Status badges, price badges, category labels
│   │   ├── Input.tsx                 ← Text input with label, error state, icon slot
│   │   ├── Skeleton.tsx              ← Loading skeleton with shimmer animation
│   │   ├── Avatar.tsx                ← User/guide profile image with fallback initials
│   │   ├── StarRating.tsx            ← Read-only and interactive star rating
│   │   ├── Toast.tsx                 ← Global toast notifications (success/error/info)
│   │   ├── ProgressBar.tsx           ← Multi-step booking progress indicator
│   │   └── CountdownTimer.tsx        ← Payment QR 15-minute countdown
│   │
│   ├── layout/
│   │   ├── BottomNav.tsx             ← 5-tab bottom navigation bar
│   │   ├── TopBar.tsx                ← Page title, back button, language selector
│   │   ├── PageContainer.tsx         ← Max-width wrapper + safe area insets (PWA)
│   │   └── AIFab.tsx                 ← Floating AI button (above bottom nav, all screens)
│   │
│   ├── chat/                         ← All chat message rendering components
│   │   ├── ChatWindow.tsx            ← Main chat container, message list, scroll
│   │   ├── MessageBubble.tsx         ← AI (left) and User (right) text bubbles
│   │   ├── TypingIndicator.tsx       ← "..." animated dots when AI is thinking
│   │   ├── QuickReplyChips.tsx       ← Suggestion chips below input bar
│   │   ├── ChatInput.tsx             ← Text area + send button + voice placeholder
│   │   ├── TripCardsMessage.tsx      ← Horizontal scroll trip cards from AI
│   │   ├── ImageGalleryMessage.tsx   ← Photo grid in chat
│   │   ├── ItineraryMessage.tsx      ← Expandable day-by-day itinerary
│   │   ├── HotelDetailsMessage.tsx   ← Hotel info card in chat
│   │   ├── WeatherMessage.tsx        ← 7-day forecast card in chat
│   │   ├── BudgetEstimateMessage.tsx ← Cost breakdown card in chat
│   │   ├── ComparisonMessage.tsx     ← Side-by-side trip comparison table
│   │   ├── BookingSummaryMessage.tsx ← Pre-confirmation summary card
│   │   ├── QRPaymentMessage.tsx      ← QR code + countdown timer + amount
│   │   └── BookingConfirmedMessage.tsx ← Success card with confetti animation
│   │
│   ├── booking/
│   │   ├── VehicleCard.tsx           ← Van/bus/tuk-tuk listing card
│   │   ├── HotelCard.tsx             ← Hotel listing card with rating
│   │   ├── GuideCard.tsx             ← Guide listing card with languages
│   │   ├── RoomSelector.tsx          ← Room type + bed count picker
│   │   ├── DateRangePicker.tsx       ← Travel date selection
│   │   ├── PeoplePicker.tsx          ← Passenger count selector
│   │   ├── BookingSummary.tsx        ← Line-item price breakdown
│   │   ├── LoyaltyPointsSlider.tsx   ← Apply points to booking
│   │   └── DiscountCodeInput.tsx     ← Promo code field + validate button
│   │
│   ├── explore/
│   │   ├── PlaceCard.tsx             ← Historical place card with image
│   │   ├── FestivalCard.tsx          ← Festival with date badge + discount
│   │   ├── OfflineMapView.tsx        ← Leaflet map with place pins
│   │   ├── PlaceDetailHero.tsx       ← Full-bleed photo header for place page
│   │   ├── CulturalInsight.tsx       ← "Did you know?" fact box
│   │   └── OfflineDownloadButton.tsx ← Trigger offline map caching
│   │
│   └── emergency/
│       ├── EmergencyButton.tsx       ← Hold-to-activate SOS button
│       ├── EmergencyContactCard.tsx  ← Police/support/hospital contact
│       └── AlertStatusBanner.tsx     ← "Alert sent — support notified" banner
│
├── hooks/                            ← Custom React hooks
│   ├── useAuth.ts                    ← Read auth state from Zustand store
│   ├── useWebSocket.ts               ← WebSocket connection + reconnect logic
│   ├── useGeolocation.ts             ← GPS location (high accuracy mode)
│   ├── useOfflineQueue.ts            ← Queue actions when offline, flush on reconnect
│   ├── useLanguage.ts                ← Read/set language preference
│   ├── useLoyaltyPoints.ts           ← Fetch balance + calculate redemption
│   └── usePaymentStatus.ts           ← Poll payment status while QR is showing
│
├── stores/                           ← Zustand global state
│   ├── authStore.ts                  ← user, accessToken, isAuthenticated, logout
│   ├── chatStore.ts                  ← messages, sessionId, typing, connectionStatus
│   ├── bookingStore.ts               ← active booking form state during manual booking
│   └── notificationStore.ts          ← unread count, notification list
│
├── lib/                              ← Utility and service layer
│   ├── api.ts                        ← Axios instance: base URL, token attach, refresh
│   ├── apiEndpoints.ts               ← All API URL constants (no magic strings)
│   ├── i18n.ts                       ← next-intl configuration
│   ├── stripe.ts                     ← Stripe.js initialization (client-side only)
│   ├── formatters.ts                 ← Currency, date, distance formatters
│   ├── validators.ts                 ← Shared form validation functions
│   └── offlineCache.ts               ← Service worker cache management helpers
│
├── messages/                         ← i18n translation files
│   ├── en.json                       ← English strings
│   ├── kh.json                       ← Khmer strings
│   └── zh.json                       ← Chinese strings
│
├── public/
│   ├── manifest.json                 ← PWA manifest (name, icons, display: standalone)
│   ├── sw.js                         ← Service worker (generated by next-pwa)
│   └── icons/                        ← PWA icons: 192x192, 512x512, maskable
│
├── next.config.ts                    ← Next.js config: PWA, i18n, image domains
├── tailwind.config.ts                ← Tailwind theme, fonts, custom colors
├── middleware.ts                     ← Auth redirect: unauthenticated → /login
└── .env.local
    ├── NEXT_PUBLIC_API_URL           ← NestJS backend URL
    ├── NEXT_PUBLIC_AGENT_WS_URL      ← AI agent WebSocket URL
    ├── NEXT_PUBLIC_STRIPE_PK         ← Stripe publishable key
    └── NEXT_PUBLIC_FIREBASE_CONFIG   ← Firebase push notification config
```

---

## 3. Data Flow Architecture

### 3.1 Auth Data Flow

```
User submits login form
        │
        ▼
lib/api.ts  →  POST /v1/auth/login  →  NestJS Backend
        │
        ▼
Response: { access_token, user }
        │
        ├──► authStore.ts.setUser(user)
        ├──► authStore.ts.setToken(access_token)  ← stored in MEMORY only
        └──► Set httpOnly cookie (refresh_token)   ← set by server, JS cannot read
        │
        ▼
middleware.ts checks authStore on every route
If no token → redirect to /login
If token → allow through
```

### 3.2 REST API Data Flow

```
Page component renders
        │
        ▼
useQuery(queryKey, () => api.get('/v1/trips/featured'))
        │
        ▼
lib/api.ts Axios instance:
  - Reads access_token from authStore
  - Attaches: Authorization: Bearer <token>
  - Sends request to NestJS backend
        │
        ▼
If response 200: React Query caches result (per configured TTL)
If response 401: Interceptor fires
        │
        ├──► Call POST /v1/auth/refresh (httpOnly cookie sent automatically)
        ├──► Get new access_token
        ├──► authStore.setToken(newToken)
        └──► Retry original request
        │
If refresh also 401: authStore.logout() → redirect to /login
```

### 3.3 AI Chat Data Flow

```
User types message and taps Send
        │
        ▼
ChatInput.tsx → chatStore.queueMessage(text)
        │
        ▼
useWebSocket.ts → ws.send(JSON.stringify({
    type: "user_message",
    content: text,
    session_id: chatStore.sessionId,
    user_id: authStore.user.id
}))
        │
        ▼
Python AI Agent processes... (may take 2-8 seconds)
        │
WebSocket receives messages:
  { type: "typing_start" }       → chatStore.setTyping(true)
  { type: "text", content: "..." } → chatStore.addMessage()
  { type: "trip_cards", trips: [...] } → chatStore.addMessage()
  { type: "payment_qr", ... }    → chatStore.addMessage()
  { type: "payment_confirmed" }  → trigger confetti + navigate
        │
        ▼
ChatWindow.tsx renders messages:
  - type "text"           → <MessageBubble>
  - type "trip_cards"     → <TripCardsMessage>
  - type "payment_qr"     → <QRPaymentMessage>
  - type "booking_confirmed" → <BookingConfirmedMessage>
  (each type has its own component)
```

---

## 4. State Management Architecture

Three Zustand stores, each with a clear, non-overlapping responsibility:

### authStore.ts
```typescript
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}
// Access token lives ONLY here — never in localStorage or cookies
```

### chatStore.ts
```typescript
interface ChatStore {
  sessionId: string;               // UUID, persisted in sessionStorage
  messages: ChatMessage[];         // All rendered messages
  isTyping: boolean;               // AI typing indicator
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  pendingMessages: string[];       // Queued when offline
  // Actions
  addMessage: (msg: ChatMessage) => void;
  setTyping: (v: boolean) => void;
  setConnectionStatus: (s: string) => void;
  queueMessage: (text: string) => void;
  flushPendingMessages: (send: (t: string) => void) => void;
  clearChat: () => void;
}
```

### bookingStore.ts
```typescript
interface BookingStore {
  // Manual booking form state (non-AI path)
  selectedVehicleId: string | null;
  selectedHotelId: string | null;
  selectedGuideId: string | null;
  travelDate: string | null;
  endDate: string | null;
  peopleCount: number;
  pickupLocation: string;
  discountCode: string;
  loyaltyPointsToUse: number;
  // Actions
  setVehicle: (id: string) => void;
  setDates: (start: string, end: string) => void;
  reset: () => void;
}
```

---

## 5. API Client Architecture

```typescript
// lib/api.ts — Single Axios instance for all backend calls

import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,  // https://api.derlg.com/v1
  withCredentials: true,  // sends httpOnly cookie on every request
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let failedQueue: any[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.access_token;
        useAuthStore.getState().setToken(newToken);
        failedQueue.forEach(p => p.resolve(newToken));
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        failedQueue = [];
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 6. WebSocket Architecture

```typescript
// hooks/useWebSocket.ts

import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';

const WS_URL = process.env.NEXT_PUBLIC_AGENT_WS_URL;
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // exponential backoff

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const { addMessage, setTyping, setConnectionStatus, 
          sessionId, pendingMessages, flushPendingMessages } = useChatStore();
  const { user } = useAuthStore();

  const connect = useCallback(() => {
    setConnectionStatus('connecting');
    ws.current = new WebSocket(`${WS_URL}/ws/${sessionId}`);

    ws.current.onopen = () => {
      setConnectionStatus('connected');
      retryCount.current = 0;
      // Send auth handshake
      ws.current?.send(JSON.stringify({
        type: 'auth',
        user_id: user?.id,
        language: user?.preferred_language || 'EN'
      }));
      // Flush any messages that were queued while offline
      flushPendingMessages((text) => sendMessage(text));
    };

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'typing_start':   return setTyping(true);
        case 'typing_end':     return setTyping(false);
        case 'text':
        case 'trip_cards':
        case 'image_gallery':
        case 'itinerary':
        case 'hotel_details':
        case 'weather_forecast':
        case 'budget_estimate':
        case 'trip_comparison':
        case 'booking_summary':
        case 'payment_qr':
        case 'booking_confirmed':
        case 'error':
          return addMessage(msg);
        case 'payment_confirmed':
          addMessage(msg);
          // trigger celebration (handled in BookingConfirmedMessage)
      }
    };

    ws.current.onclose = () => {
      setConnectionStatus('disconnected');
      if (retryCount.current < MAX_RETRIES) {
        setTimeout(connect, RETRY_DELAYS[retryCount.current]);
        retryCount.current++;
      }
    };
  }, [sessionId, user]);

  const sendMessage = useCallback((text: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'user_message',
        content: text,
        session_id: sessionId,
        user_id: user?.id
      }));
    }
  }, [sessionId, user]);

  useEffect(() => { connect(); return () => ws.current?.close(); }, []);

  return { sendMessage };
}
```

---

## 7. PWA Architecture

### Service Worker Caching Strategy

```
Route / Resource Type          │ Strategy                │ TTL
───────────────────────────────┼─────────────────────────┼──────────
JS, CSS, fonts, icons          │ Cache First             │ Permanent
Place descriptions & photos    │ Stale While Revalidate  │ 24 hours
Festival calendar              │ Stale While Revalidate  │ 12 hours
Emergency contacts (all provs) │ Cache First             │ 7 days
OpenStreetMap tiles            │ Cache First             │ 30 days
Booking/payment API calls      │ Network First           │ No cache
Auth API calls                 │ Network Only            │ No cache
```

### PWA Install Flow
1. User visits derlg.com on mobile Chrome/Safari
2. Browser detects `manifest.json` and service worker registration
3. After 30 seconds of engagement, browser shows install prompt
4. On iOS: user must tap "Share → Add to Home Screen" (no automatic prompt)
5. After install: app launches in `standalone` mode (full screen, no browser chrome)
6. Push notification permission is requested on first confirmed booking

---

## 8. Multi-Language Architecture (i18n)

```
lib/i18n.ts — next-intl config
  locale stored in: cookie "NEXT_LOCALE" + user.preferred_language
  fallback: "en"
  supported: en, kh, zh

messages/en.json — all English UI strings
messages/kh.json — all Khmer UI strings
messages/zh.json — all Chinese UI strings

Usage in components:
  const t = useTranslations('home');
  <h1>{t('welcome', { name: user.name })}</h1>
```

Language switching flow:
1. User changes language in Profile screen
2. Frontend calls `PATCH /v1/users/language` to save preference on server
3. `useLanguage.ts` hook updates the cookie and refreshes the page locale
4. All API requests include `Accept-Language: kh` header → backend returns localized data
5. AI chat: language preference injected into the system prompt on every message

---

## 9. Environment Variables

```bash
# .env.local

# Backend
NEXT_PUBLIC_API_URL=https://api.derlg.com/v1

# AI Agent WebSocket
NEXT_PUBLIC_AGENT_WS_URL=wss://agent.derlg.com

# Stripe (publishable — safe to expose)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Google Maps (restrict by HTTP referrer in Google Console!)
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIza...

# Firebase (for push notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=derlg-prod
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...

# App
NEXT_PUBLIC_APP_URL=https://derlg.com
```

---

## 10. Performance Targets

| Metric | Target | Strategy |
|---|---|---|
| First Contentful Paint (FCP) | < 1.5s | Static shell + streaming SSR |
| Largest Contentful Paint (LCP) | < 2.5s | Image optimization (next/image) |
| Time to Interactive (TTI) | < 3.5s | Code splitting per route |
| Chat message render | < 100ms | Optimistic UI + Zustand |
| WebSocket reconnect | < 3s | Exponential backoff |
| Offline map load | < 500ms | Cached tiles in SW |