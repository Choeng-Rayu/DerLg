# DerLg.com — Project Instructions & Permanent Memory

> **Last Updated:** 2026-03-01
> This file is the permanent memory for AI assistants working on DerLg.com.
> It is read automatically at the start of every session. Keep it updated.

---

## Project Identity

**Name:** DerLg.com
**Description:** Cambodia Travel Booking Platform — AI-powered travel concierge for tourists visiting Cambodia
**Target Users:** International tourists (English, Chinese) and local Cambodians (Khmer)
**Languages Supported:** English (EN), Khmer (KH), Simplified Chinese (ZH)

---

## Tech Stack

### Frontend (`/frontend`)
- **Framework:** Next.js 16 (App Router) — currently v16.1.6
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand (client state), React Query (server state)
- **Forms:** React Hook Form + Zod validation
- **API Client:** Axios with interceptors
- **WebSocket:** Native WebSocket API with reconnection logic
- **Maps:** Leaflet.js with OpenStreetMap tiles
- **i18n:** next-intl (EN, KH, ZH)
- **Testing:** Vitest, React Testing Library, Playwright
- **PWA:** next-pwa plugin with Workbox
- **UI Components:** shadcn/ui + custom design system
- **Deploy:** Vercel (recommended) or Cloudflare Pages

### Backend (`/backend`)
- **Framework:** NestJS 11 (TypeScript)
- **ORM:** Prisma 5
- **Database:** Supabase (PostgreSQL 15)
- **Cache:** Upstash Redis (serverless)
- **Auth:** Supabase Auth + JWT (access: 15m, refresh: 7d)
- **Payments:** Stripe SDK + Bakong QR (Phase 2)
- **Email:** Resend
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **API Docs:** Swagger/OpenAPI
- **Testing:** Jest + Supertest
- **Deploy:** Railway (recommended) or Render

### AI Agent (`/llm_agentic_chatbot`)
- **Language:** Python 3.11+
- **Framework:** FastAPI + LangGraph
- **LLM (Phase 1):** Claude Sonnet 4.5 via Anthropic API
- **LLM (Phase 2):** Qwen2.5 14B via Ollama (self-hosted, for cost optimization)
- **State Machine:** LangGraph (directed graph with 7 stages)
- **Session Storage:** Redis (7-day TTL)
- **HTTP Client:** httpx (async, for NestJS tool calls)
- **Validation:** Pydantic
- **Logging:** structlog (structured JSON)
- **Deploy:** Railway (separate service)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                TRAVELER (Mobile / Desktop Browser)            │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS + WSS
┌──────────────────────▼───────────────────────────────────────┐
│          NEXT.JS FRONTEND (Vercel / CF Pages)                │
│  [Home] [Explore] [Booking] [My Trip] [Profile] [AI Chat]   │
│  PWA — installable, offline maps via Service Worker          │
└────────┬──────────────────────────────────┬──────────────────┘
         │ REST API (HTTPS)                 │ WebSocket (WSS)
┌────────▼───────────────┐   ┌──────────────▼─────────────────┐
│  NESTJS BACKEND         │   │  PYTHON AI AGENT (FastAPI)      │
│  REST /v1/...           │◄──┤  Tool calls: POST /v1/ai-tools/ │
│  Stripe Webhooks        │   │  LangGraph State Machine         │
│  Prisma + Supabase      │──►│  Redis pub/sub (payments)        │
│  Redis (sessions)       │   │  Claude API / Ollama             │
└────────┬───────────────┘   └─────────────────────────────────┘
         │
┌────────▼───────────────────────────────────────────────────────┐
│  SUPABASE: PostgreSQL (18 tables) + Storage + Auth + RLS       │
├────────────────────────────────────────────────────────────────┤
│  REDIS (Upstash): Sessions, booking holds (15m), rate limits   │
└────────────────────────────────────────────────────────────────┘
```

---

## Feature Set (16 Features)

| # | Feature | Priority |
|---|---------|----------|
| 01 | AI Travel Concierge Chat | Core |
| 02 | Trip Discovery & Smart Suggestions | Core |
| 03 | Transportation Booking (tuk-tuk, van, bus) | Core |
| 04 | Hotel Booking | Core |
| 05 | Tour Guide Booking | Core |
| 06 | Explore — Historical Places | Core |
| 07 | Festival Calendar & Event Alerts | Medium |
| 08 | Payment & Checkout (Stripe + QR) | Core |
| 09 | Emergency & Safety System | High |
| 10 | Student Discount Verification | Medium |
| 11 | Loyalty & Bonus Points | Medium |
| 12 | Offline Maps | Medium |
| 13 | Multi-Language Support (EN/KH/ZH) | Core |
| 14 | AI Budget Planner | Medium |
| 15 | My Trip — Booking Management | Core |
| 16 | User Profile & Account Settings | Core |

---

## AI Agent — 7-Stage Conversation State Machine

The AI agent progresses through these stages in order. Backward transitions are allowed.

```
DISCOVERY → SUGGESTION → EXPLORATION → CUSTOMIZATION → BOOKING → PAYMENT → POST_BOOKING
```

1. **DISCOVERY** — Gather user preferences (mood, environment, duration, people, budget, departure city)
2. **SUGGESTION** — Call `getTripSuggestions` and present trip cards
3. **EXPLORATION** — User browses trips, agent shares details/weather/culture
4. **CUSTOMIZATION** — Modify itinerary, transport, hotel choices
5. **BOOKING** — 3-step sub-flow: validate → create → confirm
6. **PAYMENT** — Generate QR code, 15-min countdown, wait for webhook
7. **POST_BOOKING** — Confirmation, itinerary summary, tips, support

---

## Coding Conventions

### General
- **Use English** for all code, comments, variable names, and commit messages
- **No magic strings** — use enums, constants, or config files
- **No console.log in production** — use proper logging (Winston for NestJS, structlog for Python)
- **Always handle errors** — never leave empty catch blocks
- **Write self-documenting code** — prefer clear names over comments

### TypeScript / JavaScript (Frontend + Backend)
- Use **named exports**, not default exports
- Components in **PascalCase** (`BookingSummary.tsx`)
- Utility functions in **camelCase** (`formatCurrency()`)
- Constants in **UPPER_SNAKE_CASE** (`MAX_BOOKING_HOLD_MINUTES`)
- Interfaces/Types prefixed with: none (just PascalCase, e.g., `User`, `BookingResponse`)
- Use `type` for data shapes, `interface` for contracts/APIs
- Prefer `const` over `let`, never use `var`
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Async/await over raw Promises
- All API URL paths in a dedicated constants file — no inline URLs

### React / Next.js Specific
- **Server Components by default** — only add `"use client"` when interactivity is needed
- Keep components small and focused (<150 lines ideal)
- Co-locate component files: `Component.tsx`, `Component.test.tsx`
- Use Zustand for global client state, React Query for server state
- Forms: React Hook Form + Zod schema validation
- Never store sensitive data (tokens, keys) in localStorage — use httpOnly cookies
- Responsive: mobile-first, using Tailwind breakpoints (`sm:`, `md:`, `lg:`)
- Use Tailwind CSS utility classes — avoid custom CSS unless absolutely necessary
- Skeleton loaders for all async data (never show blank screens)

### NestJS Backend Specific
- One module per feature (auth, users, bookings, payments, etc.)
- DTOs with `class-validator` decorators for all inputs
- Global validation pipe, exception filter, and response transform interceptor
- Guards: `JwtAuthGuard`, `RolesGuard`, `ServiceKeyGuard` (for AI tool routes)
- Decorators: `@CurrentUser()`, `@Roles()`, `@Public()`
- All financial operations wrapped in Prisma transactions
- Stripe webhooks: always verify signature, never trust raw body
- API versioning: all routes under `/v1/`
- AI tool routes: all under `/v1/ai-tools/` with `X-Service-Key` header

### Python AI Agent Specific
- Type hints on all functions
- Pydantic models for all data structures
- Abstract base class for ModelClient (enables Claude ↔ Ollama swap)
- Tool schemas match Anthropic tool calling format
- httpx for async HTTP calls to NestJS backend
- structlog for structured JSON logging
- Never invent data — every fact must come from a tool call result

---

## Database Models (18 Tables)

`users`, `trips`, `places`, `hotels`, `rooms`, `vehicles`, `guides`,
`bookings`, `booking_items`, `payments`, `payment_qr_codes`,
`loyalty_transactions`, `student_verifications`, `emergency_alerts`,
`festivals`, `reviews`, `notifications`, `currency_rates`

**Key relationships:**
- A `booking` belongs to a `user` and can have multiple `booking_items`
- A `payment` belongs to a `booking` (1:1 for main payment)
- `loyalty_transactions` tracks earn/redeem/reverse events per user
- `student_verifications` tracks the multi-step ID verification lifecycle

---

## API Routes Structure

### Backend REST API (Frontend consumption)
- `POST /v1/auth/register`, `/login`, `/refresh`, `/logout`
- `GET /v1/users/me`, `PATCH /v1/users/me`
- `GET /v1/trips`, `GET /v1/trips/:id`
- `GET /v1/hotels`, `GET /v1/hotels/:id`
- `GET /v1/transportation/vehicles`
- `GET /v1/guides`
- `POST /v1/bookings`, `GET /v1/bookings/my`, `DELETE /v1/bookings/:id`
- `POST /v1/payments/create-intent`, `POST /v1/payments/qr`
- `POST /v1/payments/webhook` (Stripe, raw body, no JWT)
- `GET /v1/explore/places`, `GET /v1/explore/places/:id`
- `GET /v1/festivals`, `GET /v1/festivals/upcoming`
- `POST /v1/emergency/alerts`
- `GET /v1/loyalty/balance`, `GET /v1/loyalty/history`
- `GET /v1/currency/rates`

### AI Tool API (AI Agent consumption — X-Service-Key auth)
- `POST /v1/ai-tools/suggest-trips`
- `POST /v1/ai-tools/get-itinerary`
- `POST /v1/ai-tools/compare-trips`
- `POST /v1/ai-tools/get-weather`
- `POST /v1/ai-tools/get-places`
- `POST /v1/ai-tools/get-festivals`
- `POST /v1/ai-tools/check-availability`
- `POST /v1/ai-tools/validate-user`
- `POST /v1/ai-tools/create-booking`
- `POST /v1/ai-tools/cancel-booking`
- `POST /v1/ai-tools/generate-qr`
- `POST /v1/ai-tools/check-payment-status`
- `POST /v1/ai-tools/estimate-budget`

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
REDIS_URL=rediss://...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_SECRET=...
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
AI_SERVICE_KEY=...
RESEND_API_KEY=re_...
FIREBASE_CONFIG=...
EXCHANGE_RATE_API_KEY=...
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AGENT_WS_URL=ws://localhost:8000
NEXT_PUBLIC_STRIPE_PK=pk_...
NEXT_PUBLIC_FIREBASE_CONFIG=...
```

### AI Agent (.env)
```
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-5-20251001
REDIS_URL=rediss://...
BACKEND_URL=http://localhost:3001
BACKEND_SERVICE_KEY=...
MODEL_BACKEND=anthropic
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=qwen2.5:14b
```

---

## External Services & API Keys

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Anthropic | Claude AI LLM | Pay-per-token ($3/M input, $15/M output) |
| Supabase | DB + Auth + Storage | Free tier available |
| Upstash | Redis sessions/cache | 10K requests/day free |
| Stripe | Card payments | % per transaction |
| Google Maps | Places + Geocoding + Distance | Free tier + credits |
| OpenWeatherMap | Weather forecasts | 1K calls/day free |
| ExchangeRate-API | Currency rates (USD/KHR/CNY) | 1.5K requests/month free |
| Resend | Transactional email | 3K emails/month free |
| Firebase | Push notifications (FCM) | Unlimited free |
| Leaflet + OSM | Offline maps | Free |

---

## Known Issues & Gotchas

- **Supabase RLS policies** must be updated manually after schema changes
- **Stripe webhooks** require idempotency keys or duplicate charges can occur
- **Khmer language** in Claude has limited but functional quality — acceptable for Phase 1
- **Never use dynamic imports** for auth-related components
- **Tailwind CSS v4** uses a different config format than v3 — no `tailwind.config.ts`, config in CSS
- **15-minute booking hold** stored in Redis — auto-cancels unpaid bookings after TTL
- **AI agent is a trusted guest**, not a direct DB user — always goes through NestJS API
- **Service worker** must be tested on HTTPS or localhost only (not plain HTTP)

---

## Project Status

- **Documentation:** ~60% complete (core features documented, supporting screens pending)
- **Frontend:** Scaffolded with Next.js 16, Tailwind v4 — no features implemented yet
- **Backend:** Scaffolded with NestJS 11 — no features implemented yet
- **AI Agent:** Documentation written, code not started
- **Build Phase:** Pre-development (architecture finalized, implementation starting)

---

## Build Order (Recommended)

1. Supabase project + Prisma schema + NestJS skeleton
2. Auth (register, login, JWT) — frontend login screen
3. Claude API tool calling — basic 3-tool test agent
4. LangGraph state machine — 7 stages wired with mock tools
5. Trip catalog in DB + `getTripSuggestions` end-to-end
6. Transport + Hotel + Guide booking flows
7. Stripe payment + webhook + QR display
8. Full booking conversation: DISCOVERY → POST_BOOKING
9. Frontend: all 5 screens + AI chat interface
10. Emergency + Student discount + Loyalty points
11. Push notifications + Email + Offline maps
12. Testing, hardening, production deploy

---

## Documentation Reference

All project documentation lives in `/docs`:
- `/docs/architectures/` — System design, backend arch, frontend arch, AI agent arch
- `/docs/features/` — Feature specifications (F01–F16)
- `/docs/backend/` — Backend module docs (DB schema, auth, payments, etc.)
- `/docs/frontend/` — Frontend screen docs
- `/docs/agentic_chatbots_llm/` — AI agent deep dives (state machine, prompts, tools, edge cases)
- `/docs/important_requirements_and_designs.md/` — Formal requirements & design documents

---

## Recent Fixes & Decisions

_Track fixes and decisions here as the project evolves. When Claude or any AI makes a mistake and fixes it, log it here so it never happens again._

<!-- Example entries:
- Fixed: Was importing from @/lib/utils instead of @/utils — always use @/utils
- Decision: Use httpOnly cookies for JWT storage, not localStorage
- Decision: Tailwind v4 config goes in globals.css, not tailwind.config.ts
-->
