# DerLg.com — Backend Project Overview

**Stack:** NestJS · Supabase (PostgreSQL) · Redis · Stripe  
**Folder:** `apps/backend/`  
**Responsibility:** All business logic, database operations, REST/WebSocket APIs, webhook handling, and third-party integrations.

---

## 1. Role of the Backend

The backend is the single source of truth for all data on DerLg.com. It:

- Exposes a REST API consumed by the Next.js frontend
- Exposes a WebSocket endpoint consumed by the Python AI Agent
- Handles all Supabase (PostgreSQL) read/write operations
- Processes Stripe payment webhooks
- Manages session state via Redis
- Enforces all business rules (cancellation policies, discount eligibility, loyalty point calculations)
- Sends push notifications and email alerts
- Never allows the AI agent or frontend to write directly to the database

The AI agent communicates with the backend exclusively through HTTP tool calls. This means the AI cannot hallucinate data into the database — every data change passes through validated NestJS service functions.

---

## 2. Monorepo Structure

```
apps/backend/
├── src/
│   ├── main.ts                        # NestJS bootstrap
│   ├── app.module.ts                  # Root module
│   │
│   ├── auth/                          # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── strategies/               # JWT + Google OAuth strategies
│   │
│   ├── users/                         # User profile management
│   ├── trips/                         # Trip packages catalog
│   ├── bookings/                      # Booking lifecycle management
│   ├── payments/                      # Stripe integration + webhooks
│   ├── transportation/                # Van, bus, tuk-tuk booking
│   ├── hotels/                        # Hotel & room management
│   ├── guides/                        # Tour guide management
│   ├── explore/                       # Places, culture, itineraries
│   ├── festivals/                     # Festival calendar + alerts
│   ├── emergency/                     # Emergency alert system
│   ├── student-discount/              # Student ID verification
│   ├── loyalty/                       # Points & rewards system
│   ├── notifications/                 # Push + email notifications
│   ├── currency/                      # Exchange rate service
│   ├── ai-tools/                      # Tool endpoints for AI agent
│   │
│   ├── common/
│   │   ├── guards/                    # Auth guards, role guards
│   │   ├── interceptors/              # Logging, response transform
│   │   ├── filters/                   # Exception filters
│   │   ├── decorators/                # Custom decorators
│   │   └── pipes/                     # Validation pipes
│   │
│   └── config/
│       ├── database.config.ts
│       ├── redis.config.ts
│       └── stripe.config.ts
│
├── test/
├── .env.example
├── nest-cli.json
└── package.json
```

---

## 3. Tech Stack Details

| Component | Technology | Purpose |
|---|---|---|
| Framework | NestJS (TypeScript) | Modular, decorator-based backend |
| Database | Supabase (PostgreSQL) | Managed Postgres + real-time subscriptions |
| ORM | Prisma | Type-safe DB queries, migrations |
| Cache / Sessions | Redis (Upstash) | Session storage, rate limiting, pub/sub |
| Payments | Stripe | Card, QR payment, webhooks |
| File Storage | Supabase Storage | Hotel photos, student ID uploads |
| Auth | Supabase Auth + JWT | User registration, login, token refresh |
| Push Notifications | Expo Push / FCM | Mobile alerts for events, bookings |
| Email | Resend | Booking confirmations, reminders |
| Validation | class-validator + class-transformer | DTO validation on every endpoint |
| Maps | Google Maps API | GPS coordinates, geocoding |
| Rate Limiting | @nestjs/throttler + Redis | Protect all endpoints |
| Logging | Winston + Sentry | Error tracking and audit logs |

---

## 4. Database Host: Supabase

All PostgreSQL tables are hosted on Supabase. The backend connects via Prisma using the Supabase connection string.

### Why Supabase

- Managed PostgreSQL with automatic backups
- Built-in Storage for images and file uploads
- Built-in Auth that integrates with JWT
- Real-time subscriptions (used for emergency alerts and live booking status)
- Row-Level Security (RLS) for per-user data isolation
- Free tier sufficient for MVP, scales on demand

### Connection Pattern

The backend uses Prisma Client to connect to the Supabase PostgreSQL instance. Supabase's built-in auth is used for user registration and login. The backend then issues its own JWT tokens for API authentication.

Supabase Storage is used for:
- Hotel and place images
- Student ID card uploads
- Tour guide profile photos

---

## 5. API Design Conventions

All endpoints follow REST conventions with consistent response shapes.

### Base URL
```
https://api.derlg.com/v1/
```

### Response Envelope
Every response uses a standard envelope:
```
{
  success: true | false,
  data: <payload>,
  message: "Human readable message",
  error: null | { code, details }
}
```

### Authentication
All protected endpoints require a Bearer JWT token in the Authorization header. Tokens expire after 15 minutes. A refresh token (7-day TTL, stored in httpOnly cookie) is used to obtain new access tokens.

### Versioning
All routes are prefixed with `/v1/`. When breaking changes are introduced, a `/v2/` prefix is added. Old versions are deprecated with a 6-month sunset notice.

---

## 6. Security Principles

These rules are non-negotiable across all modules:

1. **Never trust the AI** — Every tool call from the AI agent goes through NestJS validation and business logic. The AI cannot bypass guards.
2. **Never trust the frontend** — Payment status is only updated via Stripe webhooks verified with the webhook secret key.
3. **Input validation** — Every endpoint has a DTO with class-validator decorators. Requests without valid DTOs are rejected with 400.
4. **Rate limiting** — All endpoints are rate-limited. Payment endpoints are the most restricted.
5. **RLS on Supabase** — Row-Level Security ensures users can only read/write their own records.
6. **Secrets in environment variables** — No API keys, secrets, or connection strings are hardcoded.
7. **Audit logging** — All financial events (bookings, payments, refunds) are logged with timestamps, user IDs, and IP addresses.

---

## 7. Module Index

| File | Feature | Description |
|---|---|---|
| `01-database-schema.md` | Database | All Supabase table definitions |
| `02-authentication.md` | Auth | Register, login, JWT, refresh |
| `03-transportation-booking.md` | Transport | Van, bus, tuk-tuk booking API |
| `04-hotel-booking.md` | Hotels | Hotel search, room booking |
| `05-tour-guide-booking.md` | Guides | Guide selection, booking, reviews |
| `06-payment-system.md` | Payments | Stripe, QR, webhooks, refunds |
| `07-emergency-safety.md` | Emergency | Alert system, GPS, low-connectivity |
| `08-student-discount.md` | Students | ID upload, face verify, pricing |
| `09-loyalty-points.md` | Loyalty | Earn, redeem, point history |
| `10-explore-places.md` | Explore | Places, culture, images API |
| `11-festival-calendar.md` | Festivals | Calendar, alerts, coupons |
| `12-notifications.md` | Notifications | Push, email, reminders |
| `13-currency-service.md` | Currency | USD/KHR/CNY exchange rates |
| `14-ai-tools-api.md` | AI Tools | All tool endpoints for AI agent |
