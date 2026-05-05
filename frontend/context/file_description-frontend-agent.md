# Frontend File Description — DerLg.com

Complete inventory of every file and folder in the `frontend/` directory, with purpose, design status, and redesign priority for each.

---

## Root Configuration Files

| File | Purpose | Touch for redesign? |
|------|---------|-------------------|
| `app/globals.css` | Global CSS variables (color tokens, typography, shadows, radii) | YES — update color tokens to forest green system |
| `tailwind.config.ts` | Tailwind content paths | Only if adding new source directories |
| `next.config.ts` | Image CDN domains, Next.js settings | No |
| `postcss.config.mjs` | PostCSS + Tailwind v4 | No |
| `tsconfig.json` | TypeScript strict config | No |
| `eslint.config.mjs` | ESLint rules | No |
| `.prettierrc` | Code formatting | No |
| `package.json` | Dependencies (includes shadcn/ui dependencies) | No |

---

## App Router — Pages (`app/`)

### Root Level

| File | Purpose | Design Status |
|------|---------|--------------|
| `app/layout.tsx` | Root HTML shell, font loading (Inter + Noto Sans Khmer), providers | Functional — no visual design |
| `app/globals.css` | Design token definitions, body/reset styles | Has placeholder teal tokens — **REPLACE with forest green** |
| `app/error.tsx` | Global error boundary page | Needs full design |
| `app/not-found.tsx` | 404 page | Needs full design |
| `app/robots.ts` | SEO robots config | No UI |
| `app/sitemap.ts` | SEO sitemap | No UI |
| `app/api/health/route.ts` | Health check API route | No UI |

### Auth Layout Group `app/(auth)/`

| File | Purpose | Design Priority |
|------|---------|----------------|
| `app/(auth)/layout.tsx` | Auth pages wrapper (centered card layout) | HIGH — first user touchpoint |
| `app/(auth)/login/page.tsx` | Login form page | HIGH |
| `app/(auth)/register/page.tsx` | Registration form page | HIGH |

### Main App Layout Group `app/(main)/`

| File | Purpose | Design Priority |
|------|---------|----------------|
| `app/(main)/layout.tsx` | Main layout: TopBar + BottomNav + AIChat floating button | HIGH — affects all pages |
| `app/(main)/page.tsx` | Home page (Hero + Categories + Featured Trips + Festivals) | HIGH — primary landing |
| `app/(main)/explore/page.tsx` | Explore page (map + places grid + filters) | HIGH |
| `app/(main)/festivals/page.tsx` | Festival calendar page | MEDIUM |
| `app/(main)/booking/page.tsx` | Booking hub page | HIGH |
| `app/(main)/booking/[id]/page.tsx` | Booking detail page | HIGH |
| `app/(main)/booking/payment/page.tsx` | Payment page (Stripe + QR) | HIGH |
| `app/(main)/booking/confirmation/page.tsx` | Booking confirmation receipt | HIGH |
| `app/(main)/my-trip/page.tsx` | My trips list page | HIGH |
| `app/(main)/my-trip/[bookingId]/page.tsx` | Trip detail page | HIGH |
| `app/(main)/profile/page.tsx` | User profile page | MEDIUM |
| `app/(main)/guides/page.tsx` | Guide listing page | MEDIUM |
| `app/(main)/guides/[id]/page.tsx` | Guide detail page | MEDIUM |
| `app/(main)/hotels/page.tsx` | Hotel listing page | MEDIUM |
| `app/(main)/hotels/[id]/page.tsx` | Hotel detail page | MEDIUM |
| `app/(main)/transportation/page.tsx` | Transport listing page | MEDIUM |
| `app/(main)/trips/[id]/page.tsx` | Trip package detail page | HIGH |
| `app/(main)/contact/page.tsx` | Contact/support page | LOW |
| `app/(main)/privacy/page.tsx` | Privacy policy page | LOW |
| `app/(main)/terms/page.tsx` | Terms of service page | LOW |
| `app/(main)/cookies/page.tsx` | Cookie policy page | LOW |

### Admin Layout Group `app/(admin)/`

| File | Purpose | Design Priority |
|------|---------|----------------|
| `app/(admin)/layout.tsx` | Admin sidebar layout | LOW |
| `app/(admin)/dashboard/page.tsx` | Admin overview dashboard | LOW |
| `app/(admin)/bookings/page.tsx` | Booking management | LOW |
| `app/(admin)/emergency/page.tsx` | Emergency alert management | LOW |
| `app/(admin)/reviews/page.tsx` | Review moderation | LOW |
| `app/(admin)/support/page.tsx` | Support ticket management | LOW |

### Full-Screen Chat `app/chat/`

| File | Purpose | Design Priority |
|------|---------|----------------|
| `app/chat/page.tsx` | Full-screen AI chat interface | HIGH |

---

## Components (`components/`)

### Auth Components

| File | Purpose | Design Priority |
|------|---------|----------------|
| `components/auth/AuthBootstrap.tsx` | Runs `useAuth()` on mount — no UI | No |
| `components/auth/RequireAuth.tsx` | Redirect wrapper — no UI | No |

### Layout Components

| File | Purpose | Design Priority |
|------|---------|----------------|
| `components/layout/TopBar.tsx` | Top navigation bar (logo, nav links, dark mode toggle, language switcher) | HIGH — brand header |
| `components/layout/BottomNav.tsx` | Mobile bottom tab bar (Home, Explore, Chat, Trips, Profile) | HIGH — primary mobile nav |
| `components/layout/PageContainer.tsx` | Safe area padding wrapper | LOW |

### Home Components

| File | Purpose | Design Priority |
|------|---------|----------------|
| `components/home/HeroSection.tsx` | Full-width hero image with headline, subtext, CTA buttons | HIGH — first impression |
| `components/home/CategoriesSection.tsx` | Category chips/cards (Hotels, Guides, Transport, etc.) | HIGH |
| `components/home/FeaturedTrips.tsx` | Horizontal scroll or grid of trip cards | HIGH |
| `components/home/FestivalsSection.tsx` | Upcoming festivals teaser | MEDIUM |

### Explore Components

| File | Purpose | Design Priority |
|------|---------|----------------|
| `components/explore/CulturalInsight.tsx` | Cultural info panel/card | MEDIUM |
| `components/explore/OfflineMapView.tsx` | Leaflet map with cached tiles | MEDIUM |
| `components/explore/PlaceCard.tsx` | Place listing card with image + title | HIGH |
| `components/explore/FestivalCard.tsx` | Festival card (date, name, location) | MEDIUM |

### Booking Components

| File | Purpose | Design Priority |
|------|---------|----------------|
| `components/booking/BookingCard.tsx` | Compact booking summary card | HIGH |
| `components/booking/BookingDetail.tsx` | Full booking info panel | HIGH |
| `components/booking/BookingForm.tsx` | Booking creation form | HIGH |
| `components/booking/BookingSummary.tsx` | Price breakdown panel | HIGH |
| `components/booking/ConfirmationActions.tsx` | Post-confirmation actions (share, download) | MEDIUM |
| `components/booking/GuideCard.tsx` | Guide listing/selection card | HIGH |
| `components/booking/HotelCard.tsx` | Hotel listing/selection card | HIGH |
| `components/booking/PaymentForm.tsx` | Stripe + QR payment UI | HIGH |
| `components/booking/VehicleCard.tsx` | Transport vehicle card | HIGH |

### Chat Components

| File | Purpose | Design Priority |
|------|---------|----------------|
| `components/chat/AIChat.tsx` | Floating chat button + drawer/sheet | HIGH |
| `components/chat/ChatWindow.tsx` | Message list container | HIGH |
| `components/chat/MessageBubble.tsx` | User and AI message rendering | HIGH |
| `components/chat/BookingConfirmCard.tsx` | Booking confirmation card inside chat | HIGH |
| `components/chat/BudgetEstimateCard.tsx` | Budget breakdown card inside chat | MEDIUM |
| `components/chat/ItineraryDisplay.tsx` | Day-by-day itinerary in chat | MEDIUM |
| `components/chat/ImageGallery.tsx` | Photo grid inside chat | MEDIUM |
| `components/chat/TripCard.tsx` | Trip recommendation card in chat | HIGH |
| `components/chat/WeatherCard.tsx` | Weather forecast card in chat | MEDIUM |
| `components/chat/QRPaymentDisplay.tsx` | QR code payment UI in chat | MEDIUM |

### Emergency Components

| File | Purpose | Design Priority |
|------|---------|----------------|
| `components/emergency/EmergencyButton.tsx` | SOS floating button | HIGH — critical UI |
| `components/emergency/EmergencyContactsSheet.tsx` | Emergency contacts bottom sheet | HIGH |

### Contact Components

| File | Purpose | Design Priority |
|------|---------|----------------|
| `components/contact/ContactForm.tsx` | Support/contact form | LOW |

### Profile Components

| File | Purpose | Design Priority |
|------|---------|----------------|
| `components/profile/ProfileForm.tsx` | Profile editing form | MEDIUM |
| `components/profile/Preferences.tsx` | User preferences section | MEDIUM |
| `components/profile/LoyaltyPoints.tsx` | Loyalty points display | MEDIUM |

### Map Components

| File | Purpose | Design Priority |
|------|---------|----------------|
| `components/map/MapView.tsx` | Leaflet map wrapper component | MEDIUM |

### UI Primitives `components/ui/`

Currently empty (`.gitkeep` only). This is where **shadcn/ui** components will be installed. Do not manually create files here — use the shadcn CLI.

---

## Hooks (`hooks/`)

| File | Purpose | Design? |
|------|---------|---------|
| `hooks/useGeolocation.ts` | Browser geolocation access | No |
| `hooks/useLoyaltyPoints.ts` | Loyalty points data fetching | No |
| `hooks/useOfflineQueue.ts` | IndexedDB offline action queue | No |
| `hooks/useAuth.ts` | Auth state bootstrap, token refresh | No |

---

## Library (`lib/`)

| File | Purpose | Design? |
|------|---------|---------|
| `lib/api.ts` | Axios instance with interceptors | No |
| `lib/formatters.ts` | Date, price, number formatters | No |

---

## Internationalization (`messages/`)

| File | Languages |
|------|-----------|
| `messages/en.json` | English |
| `messages/kh.json` | Khmer |
| `messages/zh.json` | Chinese |

---

## State Management (`stores/`)

Zustand stores — no UI, do not modify for redesign.

---

## Context (`context/`)

React context providers — no UI, do not modify for redesign.

---

## Providers (`providers/`)

App-level providers (QueryClient, ThemeProvider, IntlProvider, etc.) — no UI.

---

## Public Assets (`public/`)

| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest (name, icons, theme color) |
| `public/icons/` | PWA icons — **update theme_color to forest green** |
| `public/file.svg`, `globe.svg`, etc. | Next.js default assets — replace with brand assets |

---

## Redesign Priority Summary

### Phase 1 — Foundation (Do First)
1. `app/globals.css` — new color token system
2. `components/ui/` — install shadcn/ui components
3. `components/layout/TopBar.tsx` — brand header
4. `components/layout/BottomNav.tsx` — mobile nav
5. `app/(main)/layout.tsx` — main shell

### Phase 2 — Core Pages
6. `app/(main)/page.tsx` + home components (Hero, Categories, FeaturedTrips, Festivals)
7. `app/(auth)/login/page.tsx` + `register/page.tsx`
8. `app/(main)/explore/page.tsx` + explore components

### Phase 3 — Booking Flow
9. Booking components (Cards, Forms, Payment, Confirmation)
10. `app/(main)/booking/**` pages

### Phase 4 — Chat & Features
11. Chat components (AIChat, ChatWindow, MessageBubble, cards)
12. Profile, My Trip pages
13. Emergency components

### Phase 5 — Secondary Pages
14. Guide, Hotel, Transport listing pages
15. Festival, Contact, Legal pages
16. Admin dashboard

---

## Key Implementation Notes

- `app/(main)/layout.tsx` uses `pb-24 lg:pb-10` to account for BottomNav height — preserve this
- `AuthBootstrap` and `RequireAuth` are invisible wrappers — no design needed
- `components/ui/` is intentionally empty — shadcn components go here via CLI
- All color values must use CSS custom properties from `globals.css`, never hardcoded hex
- Font variables: `--font-sans` (Inter) and `--font-khmer` (Noto Sans Khmer)
- The AIChat component renders as a floating element over all main pages
- Emergency button is a persistent floating SOS button — must always be visible and accessible
