# DerLg.com — Payment System

**Module:** `src/payments/`  
**Technology:** Stripe · Stripe Webhooks · Bakong QR (ABA Pay)  
**Endpoints prefix:** `/v1/payments/`

---

## 1. Overview

The payment system is the most security-critical part of DerLg.com. It handles:

- Creating Stripe Payment Intents for card payments
- Generating QR codes for Bakong/ABA Pay (Cambodia's national payment system)
- Receiving and verifying Stripe webhooks to confirm payment
- Processing partial and full refunds according to cancellation policies
- Preventing double-processing of the same payment event

**Critical rule:** Payment status is NEVER trusted from the frontend or from the AI agent. The only source of truth for payment success is the Stripe webhook, verified with the webhook secret key.

---

## 2. Supported Payment Methods

| Method | Description | Currency |
|---|---|---|
| Visa / MasterCard | Standard card payment via Stripe | USD |
| Bakong QR (ABA Pay) | Cambodia national QR payment | USD or KHR |
| PayPal | For international travelers | USD |

All prices are stored in USD. The frontend displays equivalent amounts in KHR and CNY based on live exchange rates, but the actual charge is always in USD.

---

## 3. Payment Intent Creation Flow

This is triggered after a booking is created with status `RESERVED`.

### Step-by-step

1. Booking is created (status: `RESERVED`, hold expires in 15 minutes).
2. Frontend (or AI agent tool) calls `POST /v1/payments/create-intent`.
3. Backend validates that the booking exists and is in `RESERVED` status.
4. Backend checks that the `reserved_until` timestamp has not passed.
5. Backend calls `stripe.paymentIntents.create()` with:
   - `amount`: booking total in cents (USD × 100)
   - `currency`: "usd"
   - `metadata`: `{ booking_id, user_id, booking_ref }`
   - `payment_method_types`: ["card"]
6. Backend creates a `payments` row with:
   - `status = PENDING`
   - `stripe_payment_intent_id` from Stripe response
   - `amount_usd` = booking total
7. Backend returns the `client_secret` to the frontend.
8. Frontend uses the `client_secret` with Stripe.js to render the payment form or complete the payment.

### Request body
```
POST /v1/payments/create-intent
{
  booking_id: "uuid"
}
```

### Response
```
{
  success: true,
  data: {
    client_secret: "pi_3xxx_secret_xxx",
    payment_intent_id: "pi_3xxx",
    amount_usd: 160,
    expires_at: "2025-12-01T10:30:00Z"
  }
}
```

---

## 4. QR Payment Flow (Bakong / ABA Pay)

For travelers who prefer scanning a QR code (common in Cambodia).

### Step-by-step

1. After booking is created, user selects "Pay with QR."
2. Frontend calls `POST /v1/payments/generate-qr`.
3. Backend creates a Stripe Payment Intent with `payment_method_types: ["promptpay"]` (or integrates with Bakong API directly).
4. Backend generates a QR code image URL (using a QR generation library or Stripe's built-in QR).
5. Backend stores the QR expiry time (15 minutes, matching the booking hold).
6. Frontend displays the QR code with a countdown timer.
7. User scans the QR with their banking app and completes payment.
8. Bakong/Stripe fires a webhook event upon success.
9. Backend receives webhook → verifies signature → confirms booking.
10. Backend pushes a real-time update to the frontend via WebSocket: `{ type: "payment_confirmed", booking_id }`.
11. Frontend shows success screen and confirmation card.

### QR Expiry Handling

If the user does not pay within 15 minutes:
- The Redis booking hold key expires automatically.
- The booking status updates to `CANCELLED`.
- If the user returns, the frontend detects the expired state and offers to restart the booking process.
- A new `POST /v1/payments/generate-qr` call will fail with `booking_expired` error.
- The AI agent (or frontend) creates a new booking and generates a fresh QR.

---

## 5. Stripe Webhook Handler

**Endpoint:** `POST /v1/payments/webhook`  
**This endpoint is NOT protected by JWT.** It is protected by Stripe's webhook signature.

### Handled Events

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Confirm booking, award loyalty points |
| `payment_intent.payment_failed` | Update payment status to FAILED, notify user |
| `payment_intent.canceled` | Update payment status, release booking hold |
| `charge.refunded` | Update booking to REFUNDED, log refund amount |

### Webhook Processing — Step-by-step

1. Stripe sends a POST request to `/v1/payments/webhook`.
2. NestJS reads the raw request body (must not be parsed as JSON before this step).
3. NestJS reads the `Stripe-Signature` header.
4. NestJS calls `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`.
5. If signature fails → return HTTP 400 immediately, log the attempt.
6. If signature passes → extract `event.id` and check the `payments` table for `stripe_event_id = event.id`.
7. If the event ID already exists → return HTTP 200 with `{ status: "already_processed" }` (idempotency guard).
8. If new event → process based on `event.type`.
9. Store the `event.id` in the `payments` row as `stripe_event_id`.
10. Return HTTP 200 to Stripe (Stripe will retry if it receives anything other than 2xx).

### On `payment_intent.succeeded`

1. Find the booking using `metadata.booking_id` from the Payment Intent.
2. Update `bookings.status` → `CONFIRMED`.
3. Update `payments.status` → `SUCCEEDED`, set `paid_at = NOW()`.
4. Calculate loyalty points earned: `Math.floor(booking.total_usd × 2)` (2 points per USD).
5. Update `users.loyalty_points` += earned points.
6. Insert a row in `loyalty_transactions` with `type = EARNED`.
7. Send booking confirmation email via Resend.
8. Send push notification: "Your booking is confirmed! 🎉"
9. Publish to Redis pub/sub channel `payment_events:{user_id}` so the AI agent session knows payment succeeded.
10. Log the financial event with timestamp, user ID, amount, and booking ref.

---

## 6. Refund Flow

Refunds are initiated either by the user (via cancellation) or by support staff. The amount refunded depends on the cancellation policy stored in the booking's trip record.

### Automated Refund (User-initiated cancellation)

1. User cancels booking (see Cancellation flows in transport/hotel/guide docs).
2. Backend's cancellation service calls `POST /v1/payments/refund` internally.
3. Backend fetches the booking's `cancellation_policy` and `travel_date`.
4. Backend calculates refund amount:
   - 7+ days before: full refund (minus Stripe processing fee: ~2.9% + $0.30)
   - 1–7 days before: 50% refund
   - Less than 24 hours: no refund → return error `no_refund_eligible`
5. Backend calls `stripe.refunds.create({ payment_intent: ..., amount: refund_amount_cents })`.
6. Backend updates:
   - `payments.status` → `REFUNDED` or `PARTIALLY_REFUNDED`
   - `payments.refunded_at` = NOW()
   - `payments.refund_amount_usd` = refund amount
   - `bookings.status` → `CANCELLED`
7. If loyalty points were earned from this booking, deduct them: `users.loyalty_points -= earned_points`. Insert `loyalty_transactions` row with `type = ADJUSTED`.
8. Send refund confirmation notification.
9. Refund appears in the user's bank account within 7-14 business days (handled by Stripe).

### Manual Refund (Admin-initiated)

Admin can initiate a full or partial refund from the admin dashboard regardless of cancellation policy (for exceptional cases: DerLg error, provider no-show, etc.).

---

## 7. Check Payment Status Flow

Used by the AI agent when the user asks "Did my payment go through?"

### Step-by-step

1. AI agent calls `GET /v1/payments/:payment_intent_id/status`.
2. Backend queries the `payments` table for the given intent ID.
3. If not found in the database, backend calls Stripe directly to get the latest status.
4. Backend returns the current status.
5. AI agent reports to the user based on the status.

### Response
```
{
  success: true,
  data: {
    status: "SUCCEEDED" | "PENDING" | "FAILED" | "CANCELLED",
    booking_id: "uuid",
    booking_ref: "DLG-2025-0087",
    amount_usd: 160,
    paid_at: "2025-12-01T10:15:00Z" | null
  }
}
```

---

## 8. Payment Amount Verification

Before creating a Payment Intent, the backend always calculates the price independently and compares it to what the frontend sends. This prevents price manipulation.

The backend never trusts the amount sent by the client. It always:
1. Fetches the booking from the database.
2. Recalculates the price from the trip/vehicle/hotel base price plus any applied discounts.
3. Uses the backend-calculated amount for the Stripe Payment Intent.

---

## 9. Rate Limits

| Endpoint | Limit | Window |
|---|---|---|
| POST /create-intent | 3 requests | 1 minute |
| POST /generate-qr | 3 requests | 1 minute |
| GET /:id/status | 20 requests | 1 minute |
| POST /webhook | No limit (Stripe only) | — |
| POST /refund | 2 requests | 1 minute |

---

## 10. Currency Display (Front-end Only)

While all charges are in USD, the frontend shows equivalent amounts in KHR and CNY. The backend provides a `/v1/currency/rates` endpoint (see Currency Service doc). The conversion is display-only — no charges are made in KHR or CNY through the Stripe integration.

---

## 11. Failure Escalation

After 3 consecutive payment failures for the same booking:

1. Backend sets a flag `payment_attempts_exhausted = true` on the booking.
2. Backend sends an internal notification to the support team.
3. The AI agent is instructed by the system prompt to offer human support contact instead of regenerating another QR code.
4. The booking hold is released, and the user is advised to contact support or try a different payment method.
