# DerLg.com — Frontend Overview

> **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Zustand · React Query  
> **Rendering:** Hybrid — SSR for SEO pages (Explore, Places), CSR for app pages (Booking, AI Chat)

---

## Overview

The DerLg frontend is a **mobile-first web application** that functions as both a website and a Progressive Web App (PWA). It supports full offline capability for maps and cached place information, real-time chat with the AI agent, and multi-language support across Khmer, English, and Chinese.

---

## App Architecture

```
Next.js App (App Router)
├── /app
│   ├── (public)/                  # Marketing pages (SSR, SEO optimized)
│   │   ├── page.tsx               # Landing / Home
│   │   ├── explore/
│   │   │   ├── page.tsx           # Explore listing
│   │   │   └── [placeId]/page.tsx # Place detail
│   │   └── blog/
│   │
│   ├── (auth)/                    # Authentication pages
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   └── (app)/                     # Authenticated app (CSR)
│       ├── layout.tsx             # App shell with bottom nav
│       ├── home/page.tsx
│       ├── explore/page.tsx
│       ├── booking/
│       │   ├── page.tsx           # Booking hub
│       │   ├── transport/page.tsx
│       │   ├── hotel/page.tsx
│       │   └── guide/page.tsx
│       ├── chat/page.tsx          # AI Agent interface
│       ├── my-trips/page.tsx      # Active & past bookings
│       └── profile/
│           ├── page.tsx
│           ├── emergency/page.tsx
│           ├── student/page.tsx
│           └── loyalty/page.tsx
│
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx          # 5-button bottom navigation
│   │   ├── TopBar.tsx
│   │   └── AppShell.tsx
│   ├── booking/
│   │   ├── VehicleCard.tsx
│   │   ├── HotelCard.tsx
│   │   ├── GuideCard.tsx
│   │   └── BookingSummary.tsx
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── TripCards.tsx
│   │   ├── PaymentQR.tsx
│   │   └── BookingConfirmCard.tsx
│   ├── explore/
│   │   ├── PlaceCard.tsx
│   │   ├── PlaceGallery.tsx
│   │   └── FestivalBanner.tsx
│   ├── shared/
│   │   ├── CurrencyDisplay.tsx
│   │   ├── StarRating.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   └── OfflineIndicator.tsx
│   └── ui/                        # shadcn/ui components
│
├── lib/
│   ├── api.ts                     # API client (axios + React Query)
│   ├── websocket.ts               # WebSocket connection manager
│   ├── i18n.ts                    # Internationalization setup
│   ├── offline.ts                 # Service worker + cache helpers
│   └── currency.ts                # Currency conversion utilities
│
├── stores/
│   ├── auth.store.ts              # Zustand: user session
│   ├── booking.store.ts           # Zustand: active booking flow
│   ├── chat.store.ts              # Zustand: chat message history
│   └── language.store.ts         # Zustand: current language
│
└── public/
    ├── locales/
    │   ├── en.json
    │   ├── km.json
    │   └── zh.json
    └── offline/
        └── maps/                  # Cached offline map tiles
```

---

## State Management Strategy

| Concern | Solution | Why |
|---|---|---|
| Server data (API responses) | React Query | Caching, refetching, optimistic updates |
| Auth session & user info | Zustand | Persisted to localStorage, fast access |
| Active booking flow state | Zustand | Multi-step wizard needs cross-component state |
| Chat messages | Zustand | Real-time updates need reactive store |
| Language preference | Zustand + localStorage | Persisted across sessions |
| Form state | React Hook Form | Native form handling, Zod validation |

---

## API Client Pattern

All API calls go through a centralized axios instance with:
- JWT token injection (from Zustand auth store)
- Automatic token refresh on 401 response
- Error normalization
- Request/response logging in development

```
React Component
     │
     ▼
useQuery / useMutation (React Query)
     │
     ▼
api.ts (axios instance)
     │
     ├── Inject Authorization: Bearer {token}
     ├── On 401: refresh token → retry request
     ├── On network error: throw with user-friendly message
     └── On success: return typed response
```

---

## PWA Configuration

DerLg is configured as a PWA with:

- `manifest.json` for install prompt (add to home screen)
- Service Worker for offline caching strategy:
  - Place information: cache-first (content rarely changes)
  - API responses: network-first with fallback to cache
  - Map tiles: background sync download for saved areas
  - Images: cache-first with size limit

The user sees an "Add to Home Screen" prompt after their second visit.

---

## Performance Targets

| Metric | Target |
|---|---|
| First Contentful Paint (FCP) | < 1.5 seconds |
| Largest Contentful Paint (LCP) | < 2.5 seconds |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Time to Interactive (TTI) | < 3 seconds |
| Lighthouse Score | 90+ on mobile |

Performance strategies:
- Next.js `<Image>` component for automatic WebP conversion and lazy loading
- Skeleton loading screens while data fetches
- Route-level code splitting (each page bundle is separate)
- Infinite scroll for long lists (places, hotels) instead of pagination
- Debounced search inputs (300ms delay before API call)

---

## Theme & Design System

| Variable | Value |
|---|---|
| Primary color | `#1A56DB` (Royal Blue) |
| Secondary | `#0E9F6E` (Teal Green) |
| Accent | `#E3A008` (Amber — for Cambodian warmth) |
| Danger | `#E02424` (Red — for emergency) |
| Font | Inter (Latin) + Noto Sans Khmer (Khmer) + Noto Sans SC (Chinese) |
| Border radius | 12px (friendly, modern) |
| Bottom nav height | 64px |
| Safe area | Respects iOS/Android system insets |

The design system uses **shadcn/ui** as the base component library, customized with the DerLg color palette. All spacing follows an 8px grid system.