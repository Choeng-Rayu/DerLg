# DerLg.com — Architecture Design, LLM Selection & Existing Tools Research

**Status:** Pre-build research and design  
**Decision doc version:** 1.0 (February 2026)

---

## PART 1 — Is the Documentation Complete?

### ✅ What is Written
| Folder | Files Done | Coverage |
|---|---|---|
| `backend/` | 9 of ~14 planned | Overview, DB schema, Auth, Transport, Payment, Emergency, Student, Loyalty, AI Tools API |
| `frontend/` | 4 of ~10 planned | Overview, Home, Explore, AI Chat |
| `ai-agent/` | 6 of ~10 planned | Overview, State machine, System prompt, Agent loop, Edge cases, Local model migration |

### ❌ What Is Still Missing (Next Batch)
| File | Priority |
|---|---|
| `backend/04-hotel-booking.md` | High |
| `backend/05-tour-guide-booking.md` | High |
| `backend/10-explore-places.md` | Medium |
| `backend/11-festival-calendar.md` | Medium |
| `backend/12-notifications.md` | Medium |
| `backend/13-currency-service.md` | Low |
| `frontend/F-03-booking-screen.md` | High |
| `frontend/F-04-my-trip-screen.md` | High |
| `frontend/F-05-profile-screen.md` | High |
| `frontend/F-07-payment-flow.md` | High |
| `frontend/F-08-multi-language.md` | Medium |
| `frontend/F-09-offline-maps.md` | Medium |
| `ai-agent/A-03-tool-schemas.md` | High |
| `ai-agent/A-05-session-management.md` | Medium |
| `ai-agent/A-06-response-formatting.md` | Medium |

**About 60% is written. The core architecture and critical features are all documented. The remaining files are mostly supporting screens and secondary features.**

---

## PART 2 — Full System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    TRAVELER (Mobile / Desktop Browser)               │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ HTTPS + WSS
┌───────────────────────────────▼──────────────────────────────────────┐
│                     NEXT.JS FRONTEND (Vercel / Cloudflare Pages)     │
│                                                                      │
│  [Home]  [Explore]  [Booking]  [My Trip]  [Profile/Emergency]        │
│  [AI Chat — Full Screen, WebSocket client]                           │
│  PWA — installable, offline maps cached via Service Worker           │
└──────────┬────────────────────────────────────────┬─────────────────┘
           │                                        │
           │ REST API (HTTPS)                       │ WebSocket (WSS)
           │ Auth, Bookings, Explore                │ AI Chat only
           │                                        │
┌──────────▼─────────────────┐    ┌─────────────────▼──────────────────┐
│  NESTJS BACKEND             │    │  PYTHON AI AGENT (FastAPI)          │
│  (Railway / Render)         │    │  (Railway / Render — separate svc)  │
│                             │    │                                     │
│  REST API /v1/...           │◄───┤  Tool calls: POST /v1/ai-tools/...  │
│  Stripe Webhook Handler     │    │  LangGraph State Machine            │
│  Supabase Client (Prisma)   │────►  Redis pub/sub (payment events)    │
│  Redis Client (sessions)    │    │  Anthropic SDK (Phase 1)            │
│  Stripe SDK                 │    │  Ollama Client (Phase 2)            │
│  Resend (email)             │    │  Session saved in Redis (7-day TTL) │
│  FCM / Expo Push            │    │                                     │
└──────────┬─────────────────┘    └─────────────────────────────────────┘
           │
┌──────────▼─────────────────────────────────────────────────────────────┐
│                         SUPABASE (Managed Cloud)                        │
│   PostgreSQL — 18 tables (users, bookings, payments, trips, etc.)       │
│   Storage — hotel photos, student ID uploads, guide profile photos      │
│   Auth — email/password registration, OAuth (Google)                    │
│   Row-Level Security (RLS) — users can only access their own data       │
└────────────────────────────────────────────────────────────────────────┘
           │
┌──────────▼─────────────────────────────────────────────────────────────┐
│                    REDIS (Upstash — Serverless Redis)                   │
│   Conversation sessions (7-day TTL)                                     │
│   Booking payment holds (15-min TTL — auto-cancels unpaid bookings)     │
│   Payment confirmation pub/sub channel                                  │
│   Rate limiting counters (per user, per endpoint)                       │
│   Weather API response cache (1-hour TTL)                               │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

**Why separate the AI Agent as its own service?**
The AI agent has a completely different runtime profile than the backend — it runs long-lived WebSocket connections (minutes), makes multi-step tool calls, and sometimes waits on external APIs. NestJS is optimized for short, fast REST requests. Separating them means each scales independently and a crash in the AI agent doesn't take down the booking system.

**Why NestJS for backend instead of FastAPI everywhere?**
The backend is the data layer. NestJS with TypeScript gives strong type safety on the Supabase schema. The team likely already knows TypeScript from Next.js. FastAPI is used only for the AI agent where Python's ecosystem (LangGraph, Anthropic SDK, httpx) is necessary.

**Why Supabase instead of raw Postgres?**
Supabase gives managed Postgres + built-in Auth + Storage + real-time subscriptions + RLS in one platform. This dramatically reduces the setup time for an MVP. The backend connects via Prisma, so migrating away from Supabase to a plain Postgres instance later is straightforward.

**Why Upstash Redis instead of self-hosted?**
Upstash is serverless Redis with a free tier (10,000 requests/day). No server to manage. Scales automatically. Perfect for sessions and rate limiting. Can upgrade to paid when traffic grows.

---

## PART 3 — LLM Model Selection

### Decision: Use Claude claude-sonnet-4-5 (Phase 1)

**Recommendation: `claude-sonnet-4-5-20251001`**

Here is why Claude is the right choice for DerLg over every other model:

#### Reason 1 — Tool Use (Function Calling) is Best-in-Class

DerLg's agent makes 5-15 tool calls per booking conversation. Claude Sonnet 4.5 leads the SWE-bench benchmark at 77.2% for real-world task completion, and its tool use reliability is consistently rated above GPT-4o in multi-step agentic workflows. The agent must call tools in the right order, interpret errors, and retry gracefully. Claude's instruction following and tool orchestration is precisely what this requires.

#### Reason 2 — Multi-language (EN + ZH) with Cultural Awareness

DerLg serves English, Khmer, and Chinese speakers. Claude's "contextual understanding beyond literal translation" with cultural awareness for idiomatic expressions makes it particularly good at Chinese conversation — critical for Chinese tourists in Cambodia. GPT-4o and Gemini both support Chinese but Claude handles the cultural nuance better for a travel context.

#### Reason 3 — 200K Context Window

Each DerLg conversation stores up to 20 messages in the context window. But with tool results, itinerary data, and hotel details coming back as JSON, individual turns can be large. Claude's 200K token window means no truncation issues even in very detailed multi-step booking flows.

#### Reason 4 — Safety and Reliability

DerLg handles real money and real bookings. Claude's safety guardrails and reduced hallucination rate (especially for factual data like prices and booking IDs) are essential. The agent is explicitly instructed to never invent data — Claude's architecture makes it more resistant to prompt injection and hallucination than competitors.

#### Reason 5 — Agentic Workflow Reliability

A comparison between Claude 4, GPT-4.1, and Gemini 2.5 Pro shows Claude Sonnet 4 is "the safest, most reliable coder for maintaining complex systems" and delivers top performance for multi-step tool use. For a booking agent that must follow a strict 7-stage state machine, reliability matters more than raw benchmark scores.

### Model Comparison for DerLg's Use Case

| Factor | Claude Sonnet 4.5 | GPT-4.1 | Gemini 2.5 Flash |
|---|---|---|---|
| Tool use reliability | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐⭐ Very good | ⭐⭐⭐ Good |
| Multi-step agentic flows | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐⭐ Very good | ⭐⭐⭐ Good |
| Chinese language quality | ⭐⭐⭐⭐ Very good | ⭐⭐⭐⭐ Very good | ⭐⭐⭐⭐ Very good |
| Khmer language | ⭐⭐ Limited | ⭐⭐ Limited | ⭐⭐⭐ Better |
| Context window | 200K tokens ✅ | 1M tokens ✅ | 1M tokens ✅ |
| API pricing (input) | $3/M tokens | $2/M tokens | $0.15/M tokens |
| API pricing (output) | $15/M tokens | $8/M tokens | $0.60/M tokens |
| Instruction following | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐⭐ Very good | ⭐⭐⭐⭐ Very good |
| Hallucination resistance | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐⭐ Very good | ⭐⭐⭐ Good |

### Cost Estimate (Claude Sonnet 4.5)

A typical DerLg booking conversation (DISCOVERY → POST_BOOKING) uses approximately:
- ~8,000 input tokens (conversation history + system prompt + tool results)
- ~2,000 output tokens (AI responses across all turns)

Cost per conversation: `(8,000 × $3 + 2,000 × $15) / 1,000,000 = $0.054`

**At 100 conversations/day:** ~$162/month  
**At 500 conversations/day:** ~$810/month  
**At 1,000 conversations/day:** ~$1,620/month

When costs exceed ~$1,000/month, evaluate switching English/Chinese to a local model (see Phase 2 migration guide).

### API Key Setup

```
# .env (AI Agent service)

# Phase 1 — Claude API
ANTHROPIC_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-sonnet-4-5-20251001

# Phase 2 — Local model (uncomment when ready)
# MODEL_BACKEND=ollama
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=qwen2.5:14b
```

Get your Anthropic API key at: **https://console.anthropic.com/**

---

## PART 4 — Existing Tools & Agent Frameworks (Use Before Building Custom)

### 4.1 Agent Framework — Use LangGraph ✅

**Decision: LangGraph (not CrewAI, not AutoGen)**

For DerLg's use case:
- Single agent (not multi-agent) — one concierge AI per conversation
- Complex branching state machine — 7 stages with backward transitions
- Stateful conversation with 7-day persistence
- Human-in-the-loop payment confirmation flow

LangGraph is the right tool because it represents workflows as a **graph with nodes and edges**, exactly matching DerLg's conversation state machine. It gives:
- Fine-grained control over state transitions
- Built-in support for conditional routing (when to go to BOOKING vs back to EXPLORATION)
- `MemorySaver` for session persistence  
- Time-travel/replay for debugging
- Human breakpoints (pause and wait for payment confirmation webhook)

CrewAI is better for multi-role agent teams. AutoGen is better for research/conversational multi-agent systems. DerLg needs neither — one focused agent with controlled state.

**LangGraph Install:** `pip install langgraph`  
**LangGraph Docs:** https://langchain-ai.github.io/langgraph/

### 4.2 Agent Framework — Secondary Option: Anthropic Agent SDK

Anthropic now provides their own agent building toolkit that works natively with Claude and tool use. This is simpler than LangGraph for straightforward single-agent flows:

**Anthropic SDK with Tool Use:** `pip install anthropic`

For DerLg, the recommendation is:
- Use **LangGraph** for the state machine (managing transitions between 7 stages)
- Use the **Anthropic SDK** directly for the Claude API call within each node
- They work together — LangGraph orchestrates, Anthropic SDK calls the model

---

## PART 5 — Existing APIs (Don't Build What Already Exists)

### 5.1 Weather — OpenWeatherMap API ✅ FREE TIER SUFFICIENT

**Use for:** `getWeatherForecast()` tool  
**Free tier:** 1,000 API calls/day (more than enough for MVP)  
**Endpoint needed:** `/forecast?q={city}&appid={key}&units=metric&cnt=7`  
**Get key:** https://openweathermap.org/api  
**Cost:** Free up to 1M calls/month on paid plan ($40/month)

```python
# Example call
GET https://api.openweathermap.org/data/2.5/forecast
?q=Siem Reap,KH
&appid=YOUR_API_KEY
&units=metric
&cnt=7
```

---

### 5.2 Maps & Places — Google Maps Platform ✅

**Use for:**
- Place search and autocomplete (`/explore` screen, `getPlaces()` tool)
- Hotel coordinates and photos
- Distance Matrix API (tuk tuk fare estimation)
- Geocoding (convert address to GPS for emergency alerts)
- Static Maps (offline map fallback images)

**APIs needed:**

| API | Use | Free Tier |
|---|---|---|
| Places API (New) | Search places, get photos, details | $0 / 1K requests |
| Geocoding API | Address → GPS coordinates | $5 / 1K requests |
| Distance Matrix API | Drive time between 2 points | $5 / 1K elements |
| Maps JavaScript API | Leaflet.js replacement option | $7 / 1K loads |
| Places Photos API | Hotel and place images | $7 / 1K photos |

**Get key:** https://console.cloud.google.com/  
**Enable:** Maps JavaScript API, Places API, Geocoding API, Distance Matrix API

**Important:** Set API key restrictions by HTTP referrer (frontend domain) and IP address (backend). Never expose the key in frontend JavaScript without restrictions.

---

### 5.3 Payments — Stripe ✅

**Use for:** All card payments, QR code generation, webhooks, refunds  
**SDK:** `npm install stripe` (NestJS) + `pip install stripe` (Python, for webhook verification helper)  
**Get key:** https://dashboard.stripe.com/

**Keys you need:**

| Key | Where | Use |
|---|---|---|
| `STRIPE_SECRET_KEY` | Backend .env | Server-side API calls |
| `STRIPE_PUBLISHABLE_KEY` | Frontend .env | Stripe.js payment form |
| `STRIPE_WEBHOOK_SECRET` | Backend .env | Verify webhook signatures |

**Test card numbers:**
- Success: `4242 4242 4242 4242`  
- Failure: `4000 0000 0000 0002`  
- 3D Secure: `4000 0025 0000 3155`

**Important Stripe APIs for DerLg:**
- `stripe.paymentIntents.create()` — Create payment for QR
- `stripe.webhooks.constructEvent()` — Verify webhook (critical security step)
- `stripe.refunds.create()` — Issue refunds
- Stripe Checkout (optional) — Hosted payment page instead of custom QR

---

### 5.4 Bakong QR (Cambodia National Payment) ✅

**Use for:** Local KHR/USD QR payment — more trusted by Cambodian users than Stripe  
**Provider:** National Bank of Cambodia (NBC)  
**Documentation:** https://bakong.nbc.org.kh/  
**Integration:** REST API, requires business registration with NBC

**How it works:**
1. Your NestJS backend calls the Bakong API to generate a QR string
2. Frontend renders the QR using `qrcode.react`
3. Bakong notifies your webhook when payment is complete
4. Backend verifies and confirms booking

**Note:** For MVP, Stripe is faster to integrate. Add Bakong in v1.1 once you have business registration.

---

### 5.5 Email — Resend ✅ (Modern alternative to SendGrid)

**Use for:** Booking confirmations, reminders, cancellation notices  
**Free tier:** 3,000 emails/month  
**SDK:** `npm install resend`  
**Get key:** https://resend.com/  
**Why Resend over SendGrid:** Simpler API, better deliverability, React email templates supported

```typescript
// NestJS example
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'DerLg <bookings@derlg.com>',
  to: user.email,
  subject: `Booking Confirmed — ${bookingRef}`,
  html: bookingConfirmationTemplate(booking)
});
```

---

### 5.6 Push Notifications — Expo Push Notifications (for PWA) ✅

**Use for:** Festival alerts, booking reminders, emergency acknowledgements  
**SDK:** Expo Push API (works for both Android and iOS via a single endpoint)  
**Free tier:** Unlimited  
**Docs:** https://docs.expo.dev/push-notifications/

Since DerLg is a Next.js PWA (not a native app), Web Push via the browser's Push API is the primary mechanism. For users who install the PWA:

- Backend sends push via Firebase Cloud Messaging (FCM) Web Push
- FCM is free for all volumes
- Get key: https://console.firebase.google.com/

---

### 5.7 Face Verification — AWS Rekognition ✅ (Student Discount Feature)

**Use for:** Student ID face match verification  
**SDK:** `pip install boto3` (Python) or `npm install @aws-sdk/client-rekognition`  
**Pricing:** $0.001 per face comparison  
**Get key:** AWS Console → IAM → Create user with Rekognition permissions

**Alternative (cheaper, self-hosted):** DeepFace Python library — open source, runs on your server, no API cost. Suitable if you have at least 2 vCPU for processing.

```python
# DeepFace alternative (free, self-hosted)
from deepface import DeepFace

result = DeepFace.verify(
    img1_path="student_id_photo.jpg",
    img2_path="selfie.jpg",
    model_name="VGG-Face"
)
# result["verified"] = True/False
# result["distance"] = similarity score
```

---

### 5.8 Translation / Khmer Language — No API Needed

Claude Sonnet 4.5 handles English and Chinese natively with high quality. For Khmer, Claude has limited but functional capability.

**For Khmer UI strings** (buttons, labels, static text): use `next-intl` with manually translated JSON files. This is more reliable than AI-translated UI.

**For Khmer AI conversations**: Claude will respond in Khmer when the user writes in Khmer. Quality will be acceptable for basic travel conversations but less fluent than EN/ZH. Acceptable for Phase 1. In Phase 2, consider Qwen2.5 for a local model with stronger Asian language support.

---

### 5.9 Currency Exchange Rates — ExchangeRate-API ✅

**Use for:** USD → KHR → CNY real-time display  
**Free tier:** 1,500 requests/month  
**Get key:** https://www.exchangerate-api.com/  
**Cache strategy:** Cache rates in Redis for 1 hour — rates don't change minute to minute

```
GET https://v6.exchangerate-api.com/v6/YOUR_KEY/pair/USD/KHR
Returns: { "conversion_rate": 4100.0 }
```

---

### 5.10 Offline Maps — Leaflet.js + OpenStreetMap Tiles ✅ FREE

**Use for:** The "Maps" tab in Explore, place pins, emergency location display  
**Library:** `npm install leaflet react-leaflet`  
**Map tiles:** OpenStreetMap (free, no API key) or Mapbox (paid, better styling)

**Offline caching strategy:**
1. When user is on WiFi, service worker pre-fetches map tiles for the current province
2. Tiles stored in Cache Storage API (part of PWA service worker)
3. When offline, Leaflet loads tiles from cache
4. Leaflet.js with react-leaflet works perfectly in Next.js

**No API key needed for OpenStreetMap tiles.** For production with high traffic, self-host tiles or use Mapbox.

---

## PART 6 — What You MUST Build Custom (No Existing Tool Replaces It)

These are the parts where no off-the-shelf API exists. You must build them in your NestJS backend:

| Feature | Why Custom | Complexity |
|---|---|---|
| Khmer Tuk Tuk Booking System | No API for local Cambodia tuk tuks | Medium |
| DerLg Trip Package Catalog | Your own content (itineraries, prices) | Low |
| Tour Guide Directory | Your own guide database | Low |
| Hotel/Van Inventory Management | Your providers are local | Medium |
| Loyalty Points Engine | Custom rules and multipliers | Medium |
| Student ID Review Queue | Custom admin workflow | Medium |
| Emergency Alert Dispatch | Custom notification flow | High |
| AI State Machine (LangGraph) | Custom 7-stage booking journey | High |
| Festival Calendar (Cambodia) | No public API for Khmer festivals | Low |

---

## PART 7 — Complete API Keys Checklist

Before writing a single line of code, register for these accounts:

### Free / Essential (Get These First)
| Service | Purpose | Where to Get | Cost |
|---|---|---|---|
| Anthropic | Claude AI API | console.anthropic.com | Pay-per-token |
| Supabase | Database + Auth + Storage | supabase.com | Free tier |
| Upstash | Redis sessions | upstash.com | Free tier |
| Stripe | Payments | dashboard.stripe.com | % per transaction |
| Google Maps | Maps + Places + Geocoding | console.cloud.google.com | Free tier |
| OpenWeatherMap | Weather forecasts | openweathermap.org/api | Free tier |
| ExchangeRate-API | USD/KHR/CNY rates | exchangerate-api.com | Free tier |
| Resend | Transactional email | resend.com | Free tier |
| Firebase | Push notifications | console.firebase.google.com | Free tier |

### Phase 2 / When Needed
| Service | Purpose | When to Add |
|---|---|---|
| Bakong (NBC) | Cambodian QR payment | After business registration |
| AWS Rekognition or DeepFace | Student face match | When student feature launches |
| Sentry | Error tracking | Before launch |

---

## PART 8 — Technology Stack Summary (Final Confirmed)

```
┌────────────────────────────────────────────────────────┐
│ LAYER            │ TECHNOLOGY             │ SERVICE    │
├────────────────────────────────────────────────────────┤
│ Frontend         │ Next.js 14 + Tailwind  │ Vercel     │
│ Backend API      │ NestJS + TypeScript    │ Railway    │
│ AI Agent         │ Python + FastAPI       │ Railway    │
│ Database         │ PostgreSQL (Prisma)    │ Supabase   │
│ Auth             │ Supabase Auth + JWT    │ Supabase   │
│ File Storage     │ Supabase Storage       │ Supabase   │
│ Session Cache    │ Redis                  │ Upstash    │
│ AI Model (P1)    │ Claude Sonnet 4.5      │ Anthropic  │
│ AI Model (P2)    │ Qwen2.5 14B (Ollama)   │ Self-host  │
│ Agent Framework  │ LangGraph              │ In AI svc  │
│ Payments         │ Stripe + Bakong QR     │ Stripe     │
│ Email            │ Resend                 │ Resend     │
│ Push Notify      │ FCM Web Push           │ Firebase   │
│ Weather          │ OpenWeatherMap         │ External   │
│ Maps             │ Leaflet + OpenStreetMap│ Free       │
│ Places           │ Google Places API      │ Google     │
│ Face Match       │ DeepFace (self-hosted) │ On backend │
│ Currency Rates   │ ExchangeRate-API       │ External   │
│ Error Tracking   │ Sentry                 │ Sentry     │
└────────────────────────────────────────────────────────┘
```

---

## PART 9 — Build Order (Recommended)

Build in this order to always have a testable product at each stage:

```
Week 1:  Supabase project + Prisma schema + NestJS skeleton
Week 2:  Auth (register, login, JWT) — frontend login screen working
Week 3:  Claude API tool calling — basic 3-tool test agent (no real data yet)
Week 4:  LangGraph state machine — 7 stages wired, mock tools
Week 5:  Real trip catalog in DB + getTripSuggestions working end-to-end
Week 6:  Transport + Hotel + Guide booking flows
Week 7:  Stripe payment + webhook + QR display
Week 8:  Full booking conversation works: DISCOVERY → POST_BOOKING
Week 9:  Frontend: all 5 screens + AI chat interface
Week 10: Emergency system + Student discount + Loyalty points
Week 11: Push notifications + Email confirmations + Offline maps
Week 12: Testing, hardening, deploy to production
```