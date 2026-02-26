# DerLg.com — Full System Design Documentation

**Cambodia's AI-Powered Travel Booking Platform**  
**Version:** 1.0 (Phase 1 — Claude API)

---

## Project Summary

DerLg.com is a travel booking platform for Cambodia with an AI chat concierge as its core feature. Users can discover trips, book transport, hotels, and guides, pay securely, and manage their entire trip — through a natural conversation with the AI.

The system is split into three independently deployable services:

| Folder | Service | Technology |
|---|---|---|
| `apps/backend/` | REST API + Webhooks | NestJS + Supabase (PostgreSQL) |
| `apps/frontend/` | Web App | Next.js 14 (PWA) |
| `apps/ai-agent/` | AI Concierge | Python + FastAPI + Claude API |

---

## Core Features

- AI chat that handles: discovery → suggestion → booking → payment → post-trip support
- Transport booking: Vans (Starex, Hiace, Alphard), Buses (25/45-seat), Tuk Tuks
- Hotel booking with room selection and real photos
- Tour guide booking with language, rating, and day-rate selection
- Explore screen: historical places, cultural insights, offline maps, festival calendar
- Emergency system with GPS sharing and low-connectivity offline alerts
- Student discount with ID card upload and face verification
- Loyalty points with earning multipliers and redemption rewards
- Multi-language: English, Khmer, Chinese
- PWA: installable on Android and iOS
- Currency display: USD, KHR, CNY

---

## Documentation Structure

### Backend (NestJS + Supabase)
```
backend/
├── 00-project-overview.md       Project structure, security principles, module index
├── 01-database-schema.md        All 18 Supabase table definitions with RLS policy summary
├── 02-authentication.md         Register, login, JWT, refresh token, Google OAuth
├── 03-transportation-booking.md Van, bus, tuk-tuk availability, booking, cancellation flows
├── 06-payment-system.md         Stripe, QR payment, webhooks, refunds, security
├── 07-emergency-safety.md       Emergency alerts, offline queue, SMS fallback, GPS sharing
├── 08-student-discount.md       ID upload, face match, admin review, eligibility
├── 09-loyalty-points.md         Earning rules, multipliers, redemption, referral system
└── 14-ai-tools-api.md           All tool endpoints exposed to the AI agent (20 endpoints)
```

### Frontend (Next.js)
```
frontend/
├── F-00-project-overview.md     Stack, PWA, i18n, auth state management
├── F-01-home-screen.md          Dashboard, featured trips, festival banner, AI CTA
├── F-02-explore-screen.md       Places, festivals, offline map, cultural content
├── F-06-ai-chat-interface.md    WebSocket chat, all 10 message types, QR display
```

### AI Agent (Python)
```
ai-agent/
├── A-00-project-overview.md     Architecture, Phase 1 vs future, folder structure
├── A-01-conversation-state.md   7 stages, ConversationState model, transitions
├── A-02-system-prompt-design.md Dynamic prompt builder, per-stage instructions
├── A-04-agent-loop.md           Core loop, tool executor, parallel tool calls
├── A-08-edge-cases.md           30+ real-world edge cases with system responses
└── A-09-local-model-migration.md How to switch from Claude API to local Ollama model
```

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│              USER (Mobile Browser / App)             │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS + WebSocket
┌──────────────────────▼──────────────────────────────┐
│              FRONTEND (Next.js PWA)                  │
│  Home | Explore | Booking | My Trip | Profile        │
│  AI Chat Interface (WebSocket client)                │
└────────┬────────────────────────────┬───────────────┘
         │ REST API calls             │ WebSocket
         │ (auth, bookings, explore)  │ (AI chat)
┌────────▼──────────┐    ┌────────────▼─────────────┐
│  BACKEND (NestJS) │    │  AI AGENT (Python)       │
│  Supabase Postgres│    │  LangGraph FSM           │
│  Redis Sessions   │    │  Claude API / Ollama     │
│  Stripe Webhooks  │    │  Tool Executor           │
│  Push / Email     │◄───┤  Redis Pub/Sub listener  │
└────────┬──────────┘    └──────────────────────────┘
         │                          │
         │ AI Tool HTTP calls       │
         │ POST /v1/ai-tools/...    │
         └──────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────┐
│                  SUPABASE                         │
│  PostgreSQL (bookings, users, trips, payments)   │
│  Storage (photos, student IDs)                   │
│  Auth (registration, OAuth)                      │
└──────────────────────────────────────────────────┘
```

---

## AI Agent Booking Flow

```
User:  "I want a romantic 3-day trip, budget $200, for 2 from Phnom Penh"
                              │
                    [DISCOVERY: all fields collected]
                              │
           AI calls getTripSuggestions() → 3 options returned
                              │
                    [SUGGESTION: 3 options presented]
                              │
              User: "Tell me more about option 1 and show weather"
                              │
         AI calls getTripItinerary() + getWeatherForecast() in parallel
                              │
                    [EXPLORATION: details presented]
                              │
              User: "Can we add a private dinner? Book it."
                              │
             AI calls customizeTrip() → new total calculated
             AI collects: name, phone, pickup location
             AI calls createBooking() → RESERVED, 15-min hold
                              │
                    [PAYMENT: QR code displayed]
                              │
              User scans QR → Stripe charges → Webhook fires
                              │
          Backend confirms booking → Redis pub/sub event
                              │
                    [POST_BOOKING: confirmed 🎉]
```

---

## Key Security Rules (Never Break These)

1. AI agent never accesses the database directly — all data goes through NestJS tool endpoints
2. Payment status is never trusted from the frontend or AI — only from Stripe webhooks
3. Prices are always recalculated server-side — never from AI or frontend input
4. Access tokens are stored in memory only (never localStorage)
5. Refresh tokens are in httpOnly cookies only
6. Stripe webhook signatures are always verified before processing
7. No payment event is processed twice (idempotency via `stripe_event_id`)
8. All financial events are audit-logged with timestamps and user IDs

---

## Phase 1 → Phase 2 Roadmap

| Feature | Phase 1 (Launch) | Phase 2 (Future) |
|---|---|---|
| AI Model | Claude API | Local Ollama model (cost reduction) |
| Payment | Stripe + Bakong QR | + PayPal, Wing, True Money |
| Booking | Transport, Hotel, Guide | + Flight tickets, Temple passes |
| Map | Leaflet offline | AR temple scanner |
| Coverage | Major provinces | All 25 provinces of Cambodia |
| Student | Manual admin review | Automated face match approval |
| Currency | Display USD/KHR/CNY | Auto-charge in local currency |
