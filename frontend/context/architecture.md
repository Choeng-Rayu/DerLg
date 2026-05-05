# Architecture Context

## Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Framework | Next.js 16.1.6 + TypeScript 5 | App Router, SSR/SSG, API routes |
| UI Library | shadcn/ui + Tailwind CSS v4 | Accessible component primitives |
| State (client) | Zustand 5 | Auth state, UI state, chat state, preferences |
| State (server) | TanStack React Query 5 | Server data caching, background refetch |
| Forms | React Hook Form 7 + Zod 4 | Form state, schema validation |
| HTTP | Axios 1.x | REST API client with interceptors |
| Real-time | Native WebSocket | AI agent chat (Python backend) |
| Maps | Leaflet 1.x + react-leaflet 5 | Interactive maps with offline tile caching |
| Payment | Stripe.js 9 + @stripe/react-stripe-js | Card payment UI |
| i18n | next-intl 4 | EN / KH / ZH locale routing |
| Theming | next-themes 0.4 | Light / dark mode via CSS variables |
| Fonts | next/font/google | Inter (--font-sans), Noto Sans Khmer (--font-khmer) |
| Offline | idb 8 (IndexedDB), Service Worker | Offline action queue, map tile cache |
| Icons | lucide-react 1.x | Stroke icons |
| Auth | JWT (custom) | Access token in Zustand memory, refresh in httpOnly cookie |

## System Boundaries

- `app/` — Next.js pages and API routes. Pages are thin — just composition of components and data fetching triggers.
- `components/` — All UI components, organized by feature domain. Components are pure presentational or use hooks for data.
- `hooks/` — Custom React hooks. Own data fetching (via React Query), side effects, browser APIs. No direct UI.
- `stores/` — Zustand stores. Own client-side state only: auth tokens, UI open/close, preferences, chat messages.
- `lib/` — Utilities: Axios instance configuration, date/price formatters, helper functions. No React.
- `context/` — React Context providers (wraps Zustand or provides theme/locale). No business logic.
- `providers/` — App-level provider tree composition (QueryClient, ThemeProvider, IntlProvider, etc.).
- `messages/` — i18n JSON translation files. EN/KH/ZH.
- `public/` — Static assets: PWA manifest, icons, SVGs. Service Worker registered from here.

## Auth and Access Model

- Users sign in via email/password or OAuth — backend issues JWT access token + httpOnly refresh cookie
- Access token is stored **in memory only** via Zustand `authStore` — never in localStorage or cookies
- Axios request interceptor attaches `Authorization: Bearer <token>` to every API call
- On 401 response, Axios response interceptor calls `/auth/refresh` using the httpOnly cookie, gets new access token, retries original request
- Protected pages use `RequireAuth` wrapper component — redirects to `/login` if no token
- Admin pages have additional role check — redirect if not admin

## Storage Model

- **Server (NestJS API)**: All business data — users, trips, bookings, hotels, guides, payments
- **React Query cache**: In-memory server state mirror — auto-invalidated on mutations
- **Zustand stores**: Ephemeral client state — auth token, open/close UI state, chat session
- **IndexedDB (idb)**: Offline action queue (bookings attempted while offline), cached user preferences
- **Service Worker cache**: Static assets (Cache First), API responses (Network First), map tiles (Cache First with expiry)

## Invariants

1. **Access tokens live in memory only** — never write them to localStorage, sessionStorage, or cookies
2. **Components never call Axios directly** — always go through hooks (useQuery/useMutation) or the `lib/api.ts` instance
3. **No hardcoded color values in components** — all colors via CSS custom properties defined in `globals.css`
4. **Server components by default** — add `'use client'` only when browser APIs, event handlers, or React state are needed
5. **Functional parity preserved** — UI redesign must not alter any data fetching, auth logic, or API call behavior
6. **shadcn/ui components are installed via CLI** — do not hand-write files in `components/ui/`; use `npx shadcn@latest add <component>`

## Route Groups

```
app/
├── (auth)/          # Login, Register — no nav bar, centered card layout
├── (main)/          # Main app — TopBar + BottomNav + floating AIChat
├── (admin)/         # Admin — sidebar layout, requires admin role
└── chat/            # Full-screen AI chat — standalone layout
```

## Key Environment Variables

```
NEXT_PUBLIC_API_URL          # NestJS REST API base URL
NEXT_PUBLIC_AGENT_WS_URL     # Python AI Agent WebSocket URL
NEXT_PUBLIC_STRIPE_KEY       # Stripe publishable key
NEXT_PUBLIC_IMAGE_CDN_HOST   # Image CDN hostname for next/image
```

