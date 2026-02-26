# DerLg.com — Loyalty & Bonus Points System

**Module:** `src/loyalty/`  
**Endpoints prefix:** `/v1/loyalty/`

---

## 1. Overview

The Loyalty system rewards users for booking with DerLg.com. Points are earned automatically when a booking is completed and can be redeemed for discounts, free tuk tuk rides, and special travel rewards.

The system is designed to encourage longer bookings and repeat use of the platform.

---

## 2. Points Earning Rules

### Base Rate
Users earn **2 points per USD** spent on confirmed bookings.

Example: A $160 transport booking earns 320 points.

### Bonus Multipliers

| Scenario | Multiplier | Example |
|---|---|---|
| Trip duration 3+ days | 1.5× | 3-day package at $200 → 600 points |
| Trip duration 5+ days | 2× | 5-day package at $300 → 1,200 points |
| First booking ever | 2× on first booking | $100 first booking → 400 points |
| Festival period booking | 1.25× | During Water Festival bookings |
| Refer a friend | Flat 500 bonus points | When referred user completes first booking |

### When Points Are Awarded

Points are NOT awarded at booking time. They are awarded only when:
1. The `bookings.status` transitions to `COMPLETED`.
2. `COMPLETED` status is set by the system either automatically (travel_date + 1 day has passed) or manually by support staff.

This prevents users from booking and immediately cancelling to farm points.

If a booking is cancelled after payment, any points earned are reversed via a negative `loyalty_transactions` entry.

---

## 3. Points Redemption Rules

| Redemption Type | Cost | Benefit |
|---|---|---|
| Booking discount | 100 points = $1 off | Applied at checkout, max 30% of booking total |
| Free Tuk Tuk ride | 500 points | One tuk tuk booking up to $5 value |
| Free guide for 1 day | 2,000 points | Free guide add-on for any package |
| VIP van upgrade | 1,500 points | Upgrade from Standard to VIP van |
| Special travel reward | Varies | Redeemed through support — custom rewards |

### Redemption Limits
- Maximum 30% of any booking total can be paid with points.
- Points cannot be used for the entire booking value (minimum 70% must be paid in cash).
- Points have no cash value and cannot be transferred between accounts.
- Unused points expire after 24 months of account inactivity.

---

## 4. Earning Points — Backend Flow

### Triggered by: Booking completion (Stripe webhook success OR manual completion)

1. Stripe webhook fires `payment_intent.succeeded`.
2. Webhook handler calls `LoyaltyService.awardPoints(booking_id)`.
3. `LoyaltyService` fetches the booking: total amount, duration, dates.
4. `LoyaltyService` calculates base points: `Math.floor(booking.total_usd × 2)`.
5. Applies duration multiplier if applicable.
6. Applies first-booking multiplier if `user.total_completed_bookings === 0`.
7. Applies festival multiplier if booking dates overlap with a festival in the `festivals` table.
8. Final points = base × highest applicable multiplier (multipliers do not stack).
9. `LoyaltyService` calls `updateUserPoints(user_id, points)`:
   - Increments `users.loyalty_points += points`.
   - Inserts `loyalty_transactions` row: `{ user_id, booking_id, type: EARNED, points, balance_after }`.
10. Sends push notification: "You earned 320 loyalty points from your booking! 🎉"

---

## 5. Redeeming Points — Backend Flow

### Triggered by: User applying points at checkout

1. User is on the booking summary screen and toggles "Use loyalty points."
2. User selects how many points to use (slider or input, up to max allowed for this booking).
3. Frontend calls `POST /v1/loyalty/calculate-redemption` to preview the discount.
4. Backend calculates: `discount_usd = Math.floor(points_to_use / 100)`.
5. Backend enforces the 30% cap: if calculated discount > 30% of booking total, cap it.
6. Backend returns: `{ points_to_use, discount_usd, new_total_usd }`.
7. User confirms. The booking creation request includes `loyalty_points_to_use: N`.
8. Backend validates the user has sufficient points.
9. Backend holds the points (reduces `users.loyalty_points` immediately, marks as "held").
10. Points are fully deducted upon payment success.
11. Points are restored if the booking is cancelled before payment.

### Points Reversal on Cancellation

If a booking is cancelled:
1. Backend checks `bookings.loyalty_points_used`.
2. Adds those points back to `users.loyalty_points`.
3. Inserts `loyalty_transactions` row: `{ type: ADJUSTED, points: +N, description: "Refunded from cancelled booking" }`.

---

## 6. Points History Screen

Users can see their complete points history in the Profile screen.

### API

```
GET /v1/loyalty/history
```

Returns a paginated list of `loyalty_transactions` for the current user, sorted newest first.

### Response
```
{
  success: true,
  data: {
    current_balance: 820,
    transactions: [
      {
        id: "uuid",
        type: "EARNED",
        points: 320,
        balance_after: 820,
        description: "Earned from Angkor Sunrise 2-Day Tour",
        booking_ref: "DLG-2025-0087",
        created_at: "2025-12-02T..."
      },
      {
        id: "uuid",
        type: "REDEEMED",
        points: -500,
        balance_after: 500,
        description: "Redeemed for free tuk tuk ride",
        created_at: "2025-11-15T..."
      }
    ],
    pagination: { page: 1, per_page: 20, total: 5 }
  }
}
```

---

## 7. Referral System

### How it works

1. User goes to Profile → "Refer a Friend."
2. App generates a unique referral code: `DERLG-[6_char_user_hash]`.
3. User shares the code via WhatsApp, Telegram, or any app.
4. New user downloads the app and enters the referral code during registration.
5. The `users.referred_by` field stores the referring user's ID.
6. When the new user completes their first booking, the referral reward is triggered.
7. Both users receive 500 bonus points.
8. The referral bonus is one-time only per referred user.

### API Endpoints

```
GET /v1/loyalty/referral-code      → Returns user's unique referral code
GET /v1/loyalty/referrals          → List of users referred by this user
POST /v1/loyalty/apply-referral    → Apply referral code during signup (called by new user)
```

---

## 8. API Endpoints Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /balance | JWT Required | Get current point balance |
| GET | /history | JWT Required | Full transaction history |
| POST | /calculate-redemption | JWT Required | Preview redemption discount |
| GET | /rewards | Public | List available redemption options |
| POST | /redeem | JWT Required | Redeem points for a specific reward |
| GET | /referral-code | JWT Required | Get or create referral code |
| POST | /apply-referral | JWT Required | Apply referral code (new user) |
| GET | /referrals | JWT Required | See who user has referred |
