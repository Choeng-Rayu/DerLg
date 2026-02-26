# DerLg.com — Backend + Database Architecture (NestJS + Supabase)

**Service:** `apps/backend`  
**Framework:** NestJS 10 (TypeScript)  
**Database:** Supabase (PostgreSQL 15)  
**ORM:** Prisma 5  
**Deploy:** Railway (recommended) or Render

---

## 1. Architecture Philosophy

The backend is the **single source of truth** and the **security enforcement layer** for all data. It:
- Exposes a versioned REST API (`/v1/`) for the Next.js frontend
- Exposes a dedicated, service-key-protected tool API (`/v1/ai-tools/`) for the Python AI agent
- Owns ALL business logic: pricing, cancellation policy, refund calculation, loyalty math
- Verifies ALL Stripe webhooks before trusting any payment event
- Never lets the AI or frontend write directly to the database

**The AI agent is a trusted guest, not a direct database user.**

---

## 2. Complete Folder & File Architecture

```
apps/backend/
│
├── src/
│   │
│   ├── main.ts                     ← Bootstrap: CORS, validation pipe, Swagger, listen
│   ├── app.module.ts               ← Root module: imports all feature modules
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts        ← PrismaModule (global)
│   │   └── prisma.service.ts       ← PrismaClient singleton + onModuleInit connect
│   │
│   ├── config/
│   │   ├── configuration.ts        ← Central config factory (reads .env)
│   │   ├── database.config.ts      ← Supabase connection string + pool settings
│   │   ├── redis.config.ts         ← Upstash Redis URL + TTL constants
│   │   ├── stripe.config.ts        ← Stripe keys + webhook secret
│   │   ├── jwt.config.ts           ← JWT secret + expiry (access: 15m, refresh: 7d)
│   │   └── supabase.config.ts      ← Supabase URL + service role key (for Storage)
│   │
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts   ← Validates Bearer JWT on protected routes
│   │   │   ├── roles.guard.ts      ← Checks role claim in JWT (TRAVELER/ADMIN)
│   │   │   └── service-key.guard.ts ← Validates X-Service-Key for AI tool routes
│   │   │
│   │   ├── decorators/
│   │   │   ├── current-user.ts     ← @CurrentUser() — injects user from JWT payload
│   │   │   ├── roles.ts            ← @Roles('ADMIN') — role-based access
│   │   │   └── public.ts           ← @Public() — skips JWT guard for open routes
│   │   │
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts   ← Standard error response shape
│   │   │   └── prisma-exception.filter.ts ← Translate Prisma errors to HTTP errors
│   │   │
│   │   ├── interceptors/
│   │   │   ├── response-transform.interceptor.ts ← Wrap all responses in envelope
│   │   │   └── audit-log.interceptor.ts          ← Log financial events to DB
│   │   │
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts  ← Global validation pipe (class-validator)
│   │   │
│   │   └── dto/
│   │       └── pagination.dto.ts   ← Shared pagination query params
│   │
│   ├── redis/
│   │   ├── redis.module.ts         ← ioredis client (Upstash)
│   │   └── redis.service.ts        ← get, set, del, setex, publish, subscribe
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts      ← POST /register, /login, /refresh, /logout
│   │   ├── auth.service.ts         ← Supabase auth calls + JWT signing
│   │   ├── dto/
│   │   │   ├── register.dto.ts     ← name, email, phone, password, language
│   │   │   └── login.dto.ts        ← email, password
│   │   └── strategies/
│   │       ├── jwt.strategy.ts     ← Passport JWT strategy
│   │       └── google.strategy.ts  ← Passport Google OAuth strategy
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts     ← GET /me, PATCH /me, PATCH /language
│   │   ├── users.service.ts        ← CRUD operations on users table
│   │   └── dto/
│   │       └── update-user.dto.ts
│   │
│   ├── trips/
│   │   ├── trips.module.ts
│   │   ├── trips.controller.ts     ← GET /trips, GET /trips/featured, GET /trips/:id
│   │   ├── trips.service.ts        ← Query trips table, filter, sort
│   │   └── dto/
│   │       └── trip-filters.dto.ts ← environment, duration, province, budget
│   │
│   ├── transportation/
│   │   ├── transportation.module.ts
│   │   ├── transportation.controller.ts
│   │   ├── transportation.service.ts
│   │   └── dto/
│   │       ├── get-vehicles.dto.ts      ← category, min_capacity, travel_date
│   │       ├── check-availability.dto.ts
│   │       └── create-transport-booking.dto.ts
│   │
│   ├── hotels/
│   │   ├── hotels.module.ts
│   │   ├── hotels.controller.ts
│   │   ├── hotels.service.ts
│   │   └── dto/
│   │       ├── get-hotels.dto.ts
│   │       └── create-hotel-booking.dto.ts
│   │
│   ├── guides/
│   │   ├── guides.module.ts
│   │   ├── guides.controller.ts
│   │   ├── guides.service.ts
│   │   └── dto/
│   │       └── get-guides.dto.ts    ← language, province, available_date
│   │
│   ├── bookings/
│   │   ├── bookings.module.ts
│   │   ├── bookings.controller.ts  ← GET /bookings/my, GET /bookings/:id, DELETE /bookings/:id
│   │   ├── bookings.service.ts     ← Create, read, cancel, modify bookings
│   │   ├── booking-hold.service.ts ← Redis 15-min hold management
│   │   └── dto/
│   │       ├── create-booking.dto.ts
│   │       └── modify-booking.dto.ts
│   │
│   ├── payments/
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts  ← POST /payments/create-intent, POST /payments/qr
│   │   ├── payments.service.ts     ← Stripe payment intent + refund logic
│   │   ├── webhook.controller.ts   ← POST /payments/webhook (raw body, no JWT)
│   │   ├── webhook.service.ts      ← Event handling: succeeded, failed, refunded
│   │   └── dto/
│   │       ├── create-intent.dto.ts
│   │       └── refund.dto.ts
│   │
│   ├── explore/
│   │   ├── explore.module.ts
│   │   ├── explore.controller.ts   ← GET /places, GET /places/:id, GET /places/search
│   │   ├── explore.service.ts
│   │   └── dto/
│   │       └── search-places.dto.ts ← query, province, category, language
│   │
│   ├── festivals/
│   │   ├── festivals.module.ts
│   │   ├── festivals.controller.ts  ← GET /festivals, GET /festivals/upcoming
│   │   └── festivals.service.ts
│   │
│   ├── emergency/
│   │   ├── emergency.module.ts
│   │   ├── emergency.controller.ts  ← POST /emergency/alerts, GET /emergency/contacts
│   │   ├── emergency.service.ts     ← Alert creation + support notification dispatch
│   │   └── dto/
│   │       └── create-alert.dto.ts  ← alert_type, lat, lng, accuracy, message
│   │
│   ├── student-discount/
│   │   ├── student-discount.module.ts
│   │   ├── student-discount.controller.ts
│   │   ├── student-discount.service.ts  ← Verification lifecycle + face match call
│   │   └── dto/
│   │       └── start-verification.dto.ts
│   │
│   ├── loyalty/
│   │   ├── loyalty.module.ts
│   │   ├── loyalty.controller.ts    ← GET /loyalty/balance, GET /loyalty/history
│   │   ├── loyalty.service.ts       ← Earn, redeem, reverse points
│   │   └── dto/
│   │       └── calculate-redemption.dto.ts
│   │
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts ← FCM push + Resend email dispatch
│   │   └── templates/
│   │       ├── booking-confirmed.html
│   │       ├── booking-reminder.html
│   │       └── cancellation.html
│   │
│   ├── currency/
│   │   ├── currency.module.ts
│   │   ├── currency.controller.ts   ← GET /currency/rates
│   │   └── currency.service.ts      ← ExchangeRate-API + Redis 1hr cache
│   │
│   └── ai-tools/                    ← Tool endpoints for AI agent only
│       ├── ai-tools.module.ts
│       ├── ai-tools.controller.ts   ← All /v1/ai-tools/* routes
│       ├── ai-tools.service.ts      ← Orchestrates other services for AI tools
│       └── dto/
│           ├── suggest-trips.dto.ts
│           ├── create-booking.dto.ts
│           ├── generate-qr.dto.ts
│           └── cancel-booking.dto.ts
│
├── prisma/
│   ├── schema.prisma               ← Full Prisma schema (all 18 models)
│   └── migrations/                 ← Migration history
│
├── test/
│   ├── auth.e2e-spec.ts
│   ├── bookings.e2e-spec.ts
│   └── payments.e2e-spec.ts
│
├── .env
│   ├── DATABASE_URL                ← Supabase PostgreSQL connection string
│   ├── DIRECT_URL                  ← Supabase direct URL (for migrations)
│   ├── SUPABASE_URL
│   ├── SUPABASE_SERVICE_ROLE_KEY   ← Admin key (server only, never expose)
│   ├── REDIS_URL                   ← Upstash Redis URL
│   ├── JWT_ACCESS_SECRET
│   ├── JWT_REFRESH_SECRET
│   ├── STRIPE_SECRET_KEY
│   ├── STRIPE_WEBHOOK_SECRET
│   ├── GOOGLE_CLIENT_ID
│   ├── GOOGLE_CLIENT_SECRET
│   ├── RESEND_API_KEY
│   ├── FIREBASE_SERVICE_ACCOUNT    ← JSON string for FCM
│   ├── OPENWEATHER_API_KEY
│   ├── GOOGLE_MAPS_API_KEY         ← Server-side key, no referrer restriction
│   ├── EXCHANGE_RATE_API_KEY
│   └── AI_SERVICE_KEY              ← Secret key for AI agent authentication
│
├── nest-cli.json
└── package.json
```

---

## 3. Supabase Database Architecture

### 3.1 Connection Strategy

```
Supabase offers 3 connection modes:

1. Direct Connection (used for: Prisma migrations)
   postgresql://[user]:[password]@db.[ref].supabase.co:5432/postgres
   → Set as DIRECT_URL in .env

2. Connection Pooler (Transaction mode — used for: NestJS API requests)
   postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   → Set as DATABASE_URL in .env (Prisma uses this at runtime)
   → Pooler handles up to 10,000 concurrent connections

3. Supabase Client (used for: Storage uploads, Auth operations)
   const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
   → Use the service role key on the server ONLY
   → Never expose the service role key to the frontend
```

### 3.2 Prisma Schema Design

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─────────────────────────────────
// USERS
// ─────────────────────────────────
model User {
  id                    String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  supabase_uid          String?   @unique
  name                  String    @db.VarChar(100)
  email                 String    @unique @db.VarChar(255)
  phone                 String?   @db.VarChar(20)
  avatar_url            String?
  role                  UserRole  @default(TRAVELER)
  preferred_language    Language  @default(EN)
  loyalty_points        Int       @default(0)
  is_student            Boolean   @default(false)
  student_verified_at   DateTime?
  emergency_contact_name  String?
  emergency_contact_phone String?
  referred_by           String?   @db.Uuid
  total_completed_bookings Int    @default(0)
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  bookings              Booking[]
  reviews               Review[]
  loyalty_transactions  LoyaltyTransaction[]
  emergency_alerts      EmergencyAlert[]
  student_verifications StudentVerification[]
  ai_sessions           AiSession[]
  @@index([email])
  @@index([supabase_uid])
  @@map("users")
}

enum UserRole { TRAVELER GUIDE ADMIN }
enum Language { EN KH ZH }

// ─────────────────────────────────
// TRIPS (DerLg Package Catalog)
// ─────────────────────────────────
model Trip {
  id                    String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title                 String      @db.VarChar(200)
  title_kh              String?     @db.VarChar(200)
  title_zh              String?     @db.VarChar(200)
  slug                  String      @unique
  destination           String      @db.VarChar(100)
  duration_days         Int
  price_per_person_usd  Decimal     @db.Decimal(10,2)
  environment           Environment
  mood_tags             String[]
  includes              Json
  excludes              Json
  itinerary             Json
  highlights            String[]
  min_people            Int         @default(1)
  max_people            Int         @default(50)
  cancellation_policy   Json
  hotel_id              String?     @db.Uuid
  transport_type        String?
  is_active             Boolean     @default(true)
  avg_rating            Decimal?    @db.Decimal(3,2)
  created_at            DateTime    @default(now())
  bookings              Booking[]
  hotel                 Hotel?      @relation(fields: [hotel_id], references: [id])
  @@map("trips")
}

enum Environment { MOUNTAIN BEACH CITY FOREST ISLAND TEMPLE }

// ─────────────────────────────────
// BOOKINGS (Master table)
// ─────────────────────────────────
model Booking {
  id                      String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  booking_ref             String        @unique @db.VarChar(12)
  user_id                 String        @db.Uuid
  trip_id                 String?       @db.Uuid
  hotel_room_id           String?       @db.Uuid
  vehicle_id              String?       @db.Uuid
  guide_id                String?       @db.Uuid
  status                  BookingStatus @default(PENDING)
  booking_type            BookingType
  travel_date             DateTime      @db.Date
  end_date                DateTime      @db.Date
  people_count            Int
  pickup_location         String
  special_requests        String?
  customizations          Json?
  subtotal_usd            Decimal       @db.Decimal(10,2)
  discount_amount_usd     Decimal       @default(0) @db.Decimal(10,2)
  loyalty_discount_usd    Decimal       @default(0) @db.Decimal(10,2)
  total_usd               Decimal       @db.Decimal(10,2)
  loyalty_points_earned   Int           @default(0)
  loyalty_points_used     Int           @default(0)
  student_discount_applied Boolean      @default(false)
  reserved_until          DateTime?
  created_at              DateTime      @default(now())
  updated_at              DateTime      @updatedAt
  user                    User          @relation(fields: [user_id], references: [id])
  trip                    Trip?         @relation(fields: [trip_id], references: [id])
  vehicle                 TransportVehicle? @relation(fields: [vehicle_id], references: [id])
  guide                   Guide?        @relation(fields: [guide_id], references: [id])
  hotel_room              HotelRoom?    @relation(fields: [hotel_room_id], references: [id])
  payment                 Payment?
  reviews                 Review[]
  @@index([user_id])
  @@index([status])
  @@index([travel_date])
  @@map("bookings")
}

enum BookingStatus { PENDING RESERVED CONFIRMED CANCELLED REFUNDED COMPLETED }
enum BookingType   { PACKAGE HOTEL_ONLY TRANSPORT_ONLY GUIDE_ONLY }

// ─────────────────────────────────
// PAYMENTS
// ─────────────────────────────────
model Payment {
  id                        String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  booking_id                String        @unique @db.Uuid
  stripe_payment_intent_id  String        @unique @db.VarChar(100)
  stripe_charge_id          String?       @db.VarChar(100)
  stripe_event_id           String?       @unique @db.VarChar(100)  // idempotency
  amount_usd                Decimal       @db.Decimal(10,2)
  currency                  String        @default("USD") @db.VarChar(3)
  status                    PaymentStatus @default(PENDING)
  payment_method            PaymentMethod @default(CARD)
  qr_code_url               String?
  paid_at                   DateTime?
  refunded_at               DateTime?
  refund_amount_usd         Decimal?      @db.Decimal(10,2)
  refund_reason             String?
  failure_code              String?       @db.VarChar(50)
  failure_message           String?
  payment_attempts          Int           @default(0)
  created_at                DateTime      @default(now())
  booking                   Booking       @relation(fields: [booking_id], references: [id])
  @@map("payments")
}

enum PaymentStatus { PENDING PROCESSING SUCCEEDED FAILED REFUNDED PARTIALLY_REFUNDED }
enum PaymentMethod { CARD BAKONG_QR PAYPAL }
```

### 3.3 Row-Level Security (RLS) Configuration

RLS is configured in Supabase directly (SQL policies). The NestJS backend bypasses RLS using the **service role key**, enforcing its own business logic. RLS is a safety net, not the primary auth layer.

```sql
-- Policy: Users can only SELECT their own bookings
CREATE POLICY "users_own_bookings" ON bookings
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: Users can INSERT emergency alerts (but not UPDATE)
CREATE POLICY "users_insert_emergency" ON emergency_alerts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can SELECT their own loyalty transactions
CREATE POLICY "users_own_loyalty" ON loyalty_transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: reviews only if linked to a completed booking
CREATE POLICY "verified_reviews_only" ON reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = reviews.booking_id
        AND user_id::text = auth.uid()::text
        AND status = 'COMPLETED'
    )
  );
```

---

## 4. Redis Architecture (Upstash)

All Redis operations go through `redis.service.ts`. Redis keys and their purposes:

```
Key Pattern                          │ TTL      │ Purpose
─────────────────────────────────────┼──────────┼─────────────────────────────
session:{session_id}                 │ 7 days   │ AI conversation state (JSON)
booking_hold:{booking_id}            │ 15 min   │ Payment hold — auto-cancels
payment_events:{user_id}             │ pub/sub  │ Webhook → agent notification
rate:{user_id}:{endpoint}            │ 1 min    │ Rate limiting counter
weather:{city}                       │ 1 hour   │ OpenWeatherMap response cache
currency:rates                       │ 1 hour   │ ExchangeRate-API cache
refresh_token_version:{user_id}      │ 30 days  │ Token invalidation version
otp:{email}                          │ 10 min   │ Email OTP (if implemented)
```

### Booking Hold Flow (Critical)

```
1. createBooking() called → booking inserted with status=RESERVED
2. Redis: SET booking_hold:{booking_id} "1" EX 900   (15 minutes)
3. Payment initiated → user scans QR
4a. PAYMENT SUCCESS:
    Stripe webhook fires → booking.status = CONFIRMED
    Redis: DEL booking_hold:{booking_id}
    (booking is confirmed — hold no longer needed)
4b. TIMEOUT (no payment):
    Redis key expires automatically after 15 minutes
    A scheduled NestJS cron job runs every 5 minutes:
      - Finds bookings with status=RESERVED and reserved_until < NOW()
      - Updates their status to CANCELLED
      - (Redis key already gone — this is just DB cleanup)
```

---

## 5. Request Lifecycle (Complete Flow)

```
Incoming Request: GET /v1/trips/featured

1. NestJS listens on port 3001 (behind Railway proxy)

2. CORS middleware
   Checks Origin header against allowed origins:
   [https://derlg.com, https://www.derlg.com]
   Blocks cross-origin requests from unknown domains

3. Rate Limiter (ThrottlerGuard)
   Checks Redis: rate:{ip}:{endpoint}
   If > 30 requests/min → 429 Too Many Requests

4. Validation Pipe (global)
   Parses query params using class-validator
   Invalid params → 400 Bad Request with field errors

5. JWT Auth Guard (if route is protected)
   Reads Authorization: Bearer <token>
   Verifies signature + expiry
   Decodes payload: { sub: userId, role, email }
   Attaches to request.user

6. Controller method called
   @Get('featured')
   async getFeaturedTrips(@CurrentUser() user: JwtUser) { ... }

7. Service method called
   return this.tripsService.getFeatured(user.preferred_language);

8. Prisma query executed
   this.prisma.trip.findMany({
     where: { is_active: true, is_featured: true },
     orderBy: { avg_rating: 'desc' },
     take: 5,
     select: { id, title, title_kh, title_zh, price_per_person_usd, ... }
   })

9. Response Transform Interceptor
   Wraps result: { success: true, data: [...], message: "OK" }

10. Response sent as JSON with status 200
```

---

## 6. Stripe Webhook Architecture (Critical Path)

```
Stripe servers
     │
     │  POST /v1/payments/webhook
     │  Headers: Stripe-Signature: t=...,v1=...
     │  Body: raw JSON bytes (NOT parsed)
     ▼
webhook.controller.ts
  @Post('/webhook')
  @UseGuards()          ← NO JWT guard — this endpoint has no user auth
  handleWebhook(@Req() req: RawBodyRequest<Request>) {
    const rawBody = req.rawBody;            // must be raw bytes
    const sig = req.headers['stripe-signature'];
    ...
  }
     │
     ▼
webhook.service.ts: verifyAndProcess(rawBody, sig)
  │
  ├── Step 1: stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET)
  │   If SignatureVerificationError → throw 400 immediately
  │   (Cannot be faked without the webhook secret)
  │
  ├── Step 2: Idempotency check
  │   await prisma.payment.findFirst({ where: { stripe_event_id: event.id }})
  │   If found → return { status: 'already_processed' }
  │   (Stripe may retry webhooks — never process twice)
  │
  ├── Step 3: Route by event type
  │
  ├── event.type === 'payment_intent.succeeded'
  │   ├── Find booking by metadata.booking_id
  │   ├── Verify: payment.amount_usd === booking.total_usd (price tamper check)
  │   ├── UPDATE payment: status=SUCCEEDED, stripe_event_id, paid_at
  │   ├── UPDATE booking: status=CONFIRMED
  │   ├── LoyaltyService.awardPoints(booking_id)
  │   ├── NotificationsService.sendBookingConfirmation(user_id, booking)
  │   └── redis.publish('payment_events:{user_id}', { booking_id, status: 'SUCCEEDED' })
  │       ↑ AI agent receives this and sends confirmation to frontend WebSocket
  │
  ├── event.type === 'payment_intent.payment_failed'
  │   ├── UPDATE payment: status=FAILED, failure_code, failure_message
  │   └── redis.publish('payment_events:{user_id}', { booking_id, status: 'FAILED' })
  │
  └── event.type === 'charge.refunded'
      ├── UPDATE payment: status=REFUNDED, refunded_at, refund_amount_usd
      └── UPDATE booking: status=CANCELLED or REFUNDED
```

---

## 7. Module Dependency Graph

```
AppModule
├── PrismaModule (global)         ← All modules inject PrismaService
├── RedisModule (global)          ← All modules inject RedisService
├── ConfigModule (global)         ← All modules inject ConfigService
│
├── AuthModule
│   └── depends on: UsersModule, JwtModule
│
├── UsersModule
│   └── depends on: PrismaModule
│
├── BookingsModule
│   └── depends on: PrismaModule, RedisModule, PaymentsModule, LoyaltyModule
│
├── PaymentsModule
│   └── depends on: PrismaModule, RedisModule, BookingsModule, NotificationsModule
│
├── LoyaltyModule
│   └── depends on: PrismaModule, NotificationsModule
│
├── NotificationsModule
│   └── depends on: (external: Resend, Firebase FCM)
│
├── EmergencyModule
│   └── depends on: PrismaModule, NotificationsModule
│
├── StudentDiscountModule
│   └── depends on: PrismaModule, (external: DeepFace/AWS Rekognition)
│
├── AiToolsModule                 ← Consumes all other modules' services
│   └── depends on: TripsModule, BookingsModule, PaymentsModule,
│                   ExploreModule, WeatherModule, LoyaltyModule,
│                   CurrencyModule, StudentDiscountModule
│
└── ...all other feature modules
```

---

## 8. Security Architecture

### 8.1 Defense Layers

```
Layer 1: CORS
  Whitelist: [https://derlg.com, https://agent.derlg.com (internal)]
  All other origins → blocked at network level

Layer 2: Rate Limiting (per IP, per user)
  @nestjs/throttler + Redis backend
  Endpoint-specific limits (payment endpoints: 3/min, chat: 30/min)

Layer 3: Input Validation
  class-validator on all DTOs
  Pipe rejects on first validation error with human-readable message
  SQL injection: impossible via Prisma ORM (parameterized queries only)
  XSS: content sanitized in HTML email templates

Layer 4: JWT Authentication
  Short-lived access tokens (15 min)
  Refresh tokens in httpOnly Secure SameSite=Strict cookies
  tokenVersion in Redis for immediate invalidation

Layer 5: Service Key Authentication
  AI agent endpoints require X-Service-Key header
  Key is a 64-char random hex string stored in .env
  Rotatable without user impact

Layer 6: Database (Supabase RLS)
  Row-Level Security as backstop
  Backend uses service role key but enforces its own rules first

Layer 7: Payment Verification
  Stripe webhook signature always verified
  Amount verified server-side before confirming booking
  stripe_event_id stored to prevent replay attacks

Layer 8: Audit Logging
  All financial events (create booking, confirm payment, refund)
  logged with: timestamp, user_id, amount, booking_ref, IP address, request_id
```

### 8.2 Environment Variables Security

```
Sensitive vars (NEVER in frontend, NEVER in logs):
  DATABASE_URL, DIRECT_URL
  SUPABASE_SERVICE_ROLE_KEY
  JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
  STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  AI_SERVICE_KEY
  RESEND_API_KEY
  FIREBASE_SERVICE_ACCOUNT

Safe for frontend (NEXT_PUBLIC_*):
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  NEXT_PUBLIC_GOOGLE_MAPS_KEY (restrict by HTTP referrer in Google Console)
  NEXT_PUBLIC_FIREBASE_API_KEY
  NEXT_PUBLIC_API_URL
```

---

## 9. API Response Standard

Every response from the backend follows this envelope:

```typescript
// Success
{
  success: true,
  data: <payload>,
  message: "OK",
  meta: {         // optional — for paginated lists
    page: 1,
    per_page: 20,
    total: 157
  }
}

// Error
{
  success: false,
  data: null,
  message: "Booking not found",
  error: {
    code: "BOOKING_NOT_FOUND",    // machine-readable for AI agent
    details: { booking_id: "..." } // optional context
  }
}
```

---

## 10. Background Jobs (NestJS Cron)

```typescript
@Injectable()
export class BookingCleanupJob {

  @Cron('*/5 * * * *')   // Every 5 minutes
  async cancelExpiredReservations() {
    await this.prisma.booking.updateMany({
      where: {
        status: BookingStatus.RESERVED,
        reserved_until: { lt: new Date() }
      },
      data: { status: BookingStatus.CANCELLED }
    });
  }

  @Cron('0 9 * * *')    // Daily at 9am Cambodia time (UTC+7 = 2am UTC)
  async sendTravelReminders() {
    const tomorrow = addDays(new Date(), 1);
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        travel_date: { equals: tomorrow }
      },
      include: { user: true }
    });
    for (const booking of bookings) {
      await this.notificationsService.sendTravelReminder(booking);
    }
  }

  @Cron('0 8 * * *')    // Daily at 8am
  async checkUpcomingFestivalAlerts() {
    // Find festivals starting in 1-3 days, send alerts to all users
  }
}
```

---

## 11. Performance Configuration

```typescript
// main.ts bootstrap

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,   // CRITICAL: needed for Stripe webhook signature verification
    bufferLogs: true
  });

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: ['https://derlg.com', 'https://www.derlg.com'],
    credentials: true,  // needed for httpOnly cookie on refresh
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Key']
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // strip unknown properties
    forbidNonWhitelisted: true,
    transform: true,        // auto-transform string params to int/bool
    transformOptions: { enableImplicitConversion: true }
  }));

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('DerLg API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api-docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(3001);
}
```