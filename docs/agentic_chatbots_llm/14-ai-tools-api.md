# DerLg.com — AI Tools API (Backend Endpoints for AI Agent)

**Module:** `src/ai-tools/`  
**Endpoints prefix:** `/v1/ai-tools/`  
**Auth:** Service API Key only (`X-Service-Key` header) — never exposed to users  
**Consumed by:** Python AI Agent exclusively

---

## 1. Overview

The AI Tools API is a dedicated set of NestJS endpoints designed specifically for the Python AI Agent to call as "tool results." These endpoints encapsulate all business logic so the AI never needs direct database access.

Every endpoint in this module:
- Validates the service API key first
- Validates all input using NestJS DTO pipes
- Executes the underlying business logic via the appropriate service module
- Returns structured JSON suitable for the AI agent to parse and present to the user

---

## 2. Design Principles

1. **Single responsibility** — Each endpoint does exactly one thing well.
2. **Idempotent where possible** — Calling the same endpoint twice with the same data should not create duplicate records.
3. **Rich error messages** — Errors must include a human-readable `message` the AI can relay to the user without exposing technical details.
4. **Deterministic pricing** — Price calculations are always done server-side. The AI cannot send or override prices.
5. **State-safe** — The AI can call read-only endpoints freely. Write endpoints require validated session and user context.

---

## 3. Tool Endpoints — Discovery & Suggestions

### POST /v1/ai-tools/trips/suggest
**Purpose:** Return 3 trip package suggestions based on user preferences.

**Input:**
```
{
  mood: "stressed" | "adventurous" | "romantic" | "curious" | "family",
  environment: "MOUNTAIN" | "BEACH" | "CITY" | "FOREST" | "ISLAND" | "TEMPLE",
  duration_days: integer (1-30),
  people_count: integer (1-50),
  budget_usd: { min: number, max: number },
  departure_city: string,
  language: "EN" | "KH" | "ZH"
}
```

**Logic:**
1. Query `trips` table filtering `is_active = true`, `duration_days = input.duration_days`, `environment = input.environment`.
2. Filter by `price_per_person_usd` between `budget_usd.min` and `budget_usd.max`.
3. Score each trip based on `mood_tags` overlap.
4. Select 3 trips: best match, most affordable, premium option.
5. Return localized title/description based on `language`.

**Output:**
```
{
  trips: [
    {
      id: "uuid",
      title: "Angkor Sunrise 2-Day Package",
      tagline: "Wake up to the world's greatest sunrise.",
      price_per_person_usd: 89,
      duration_days: 2,
      environment: "TEMPLE",
      highlights: ["Sunrise at Angkor Wat", "Bayon temple faces", "Ta Prohm ruins"],
      includes: ["Hotel 1 night", "AC van transport", "Breakfast"],
      excludes: ["Flight tickets", "Entry fees"],
      image_url: "https://...",
      avg_rating: 4.8
    }
  ]
}
```

---

### GET /v1/ai-tools/trips/:id/itinerary
**Purpose:** Return the full day-by-day itinerary for a trip.

**Output:**
```
{
  trip_id: "uuid",
  title: "Angkor Sunrise 2-Day Package",
  itinerary: [
    {
      day: 1,
      title: "Arrival & Angkor Sunrise",
      morning: "4:30 AM pickup from hotel. Drive to Angkor Wat to watch sunrise...",
      afternoon: "Visit Bayon Temple and Ta Prohm...",
      evening: "Return to hotel. Optional dinner at local restaurant...",
      meals_included: ["breakfast"],
      transport: "AC van"
    }
  ]
}
```

---

### GET /v1/ai-tools/hotels/:id
**Purpose:** Return full hotel details including room types and pricing.

**Output:** Hotel name, star rating, amenities, all room types with pricing, photos, check-in/check-out policy.

---

### GET /v1/ai-tools/weather/:destination
**Purpose:** Return a 7-day forecast. Calls OpenWeatherMap API, cached 1 hour in Redis.

**Output:**
```
{
  destination: "Siem Reap",
  forecast: [
    {
      date: "2025-12-20",
      condition: "Sunny",
      temp_high_c: 32,
      temp_low_c: 22,
      humidity_percent: 45,
      rain_chance_percent: 5,
      recommendation: "Perfect for outdoor temple visits."
    }
  ]
}
```

---

### POST /v1/ai-tools/trips/compare
**Purpose:** Side-by-side comparison of 2-3 trip options.

**Input:** `{ trip_ids: ["uuid1", "uuid2"] }`

**Output:** Structured comparison with price, duration, inclusions, highlights, and ratings side by side.

---

### POST /v1/ai-tools/trips/calculate
**Purpose:** Recalculate price when the user changes duration, people count, or adds extras.

**Input:**
```
{
  trip_id: "uuid",
  people_count: 3,
  duration_override_days: 4,
  add_ons: ["private_dinner", "hotel_upgrade"]
}
```

**Output:**
```
{
  base_price_usd: 89,
  people_count: 3,
  duration_days: 4,
  add_ons_total_usd: 60,
  subtotal_usd: 327,
  total_usd: 327,
  breakdown: [
    { label: "Base trip × 3 people × 4 days", amount_usd: 267 },
    { label: "Private dinner add-on × 3", amount_usd: 30 },
    { label: "Hotel upgrade", amount_usd: 30 }
  ]
}
```

---

## 4. Tool Endpoints — Customization

### POST /v1/ai-tools/trips/:id/customize
**Purpose:** Apply add-ons or modifications to a trip and return updated pricing.

**Available Add-ons:**

| Code | Description | Price |
|---|---|---|
| private_dinner | Private candlelit dinner | +$30/person |
| hotel_upgrade | 3-star → 4-star hotel | +$25/night |
| sunset_cruise | Tonle Sap sunset boat tour | +$20/person |
| guide_english | English-speaking guide | +$40/day |
| guide_chinese | Chinese-speaking guide | +$45/day |
| extra_night | Additional hotel night | +base hotel rate |
| airport_transfer | Airport pickup/dropoff | +$15 each way |

**Input:**
```
{
  trip_id: "uuid",
  people_count: 2,
  add: ["private_dinner", "hotel_upgrade", "sunset_cruise"],
  remove: ["standard_breakfast"],
  transport_upgrade: "ALPHARD"
}
```

**Output:**
```
{
  trip_id: "uuid",
  applied_add_ons: ["private_dinner", "hotel_upgrade", "sunset_cruise"],
  new_total_usd: 320,
  price_per_person_usd: 160,
  updated_includes: ["Hotel 2 nights (4-star)", "AC Alphard transport", "Private dinner", "Sunset cruise"]
}
```

---

### POST /v1/ai-tools/discounts/apply
**Purpose:** Validate and apply a discount code.

**Input:**
```
{
  code: "FESTIVAL10",
  booking_subtotal_usd: 320
}
```

**Output (valid):**
```
{
  valid: true,
  code: "FESTIVAL10",
  discount_type: "PERCENT",
  discount_value: 10,
  discount_usd: 32,
  new_total_usd: 288,
  message: "Festival discount applied — 10% off!"
}
```

**Output (invalid):**
```
{
  valid: false,
  code: "BADCODE",
  message: "This code is expired or does not exist."
}
```

---

## 5. Tool Endpoints — Booking

### POST /v1/ai-tools/bookings/validate-user
**Purpose:** Validate collected user details before booking creation.

**Input:**
```
{
  customer_name: "Chan Dara",
  customer_phone: "+855 12 345 678",
  pickup_location: "Phnom Penh International Airport",
  travel_date: "2025-12-20"
}
```

**Output:**
```
{ valid: true, errors: [] }
```
or
```
{
  valid: false,
  errors: [
    { field: "customer_phone", message: "Phone number format is invalid." },
    { field: "travel_date", message: "Travel date must be at least 24 hours from now." }
  ]
}
```

---

### POST /v1/ai-tools/bookings/create
**Purpose:** Create a booking reservation with a 15-minute hold.

**Input:**
```
{
  user_id: "uuid",
  trip_id: "uuid",
  vehicle_id: "uuid",
  hotel_room_id: "uuid",
  guide_id: "uuid",
  travel_date: "2025-12-20",
  end_date: "2025-12-22",
  people_count: 2,
  pickup_location: "Phnom Penh International Airport",
  special_requests: "Vegetarian meal for 1 person",
  customizations: ["private_dinner", "hotel_upgrade"],
  discount_code: "FESTIVAL10",
  loyalty_points_to_use: 200,
  apply_student_discount: false
}
```

**Logic:**
1. Validate all input IDs exist and are active.
2. Re-check availability for dates (race condition guard).
3. Recalculate total price server-side — never trust external price inputs.
4. Validate user has sufficient loyalty points.
5. Validate student status if discount requested.
6. Create `bookings` row with `status = RESERVED`.
7. Set `reserved_until = NOW() + 15 minutes`.
8. Store hold in Redis: `SET booking_hold:{booking_id} "1" EX 900`.

**Output:**
```
{
  booking_id: "uuid",
  booking_ref: "DLG-2025-0042",
  status: "RESERVED",
  reserved_until: "2025-12-01T10:30:00Z",
  total_usd: 288,
  breakdown: {
    subtotal_usd: 320,
    discount_usd: 32,
    loyalty_discount_usd: 2,
    student_discount_usd: 0,
    final_total_usd: 286
  }
}
```

---

## 6. Tool Endpoints — Payment

### POST /v1/ai-tools/payments/generate-qr
**Purpose:** Create a Stripe Payment Intent and return QR code URL for display in chat.

**Input:**
```
{
  booking_id: "uuid",
  user_id: "uuid"
}
```

**Logic:**
1. Fetch booking — verify `status = RESERVED` and `reserved_until > NOW()`.
2. Recalculate price server-side.
3. Create Stripe Payment Intent.
4. Generate QR code image URL.
5. Store `payment_intent_id` in `payments` table.

**Output:**
```
{
  payment_intent_id: "pi_3xxx",
  qr_code_url: "https://storage.derlg.com/qr/pi_3xxx.png",
  amount_usd: 286,
  expires_at: "2025-12-01T10:30:00Z",
  booking_ref: "DLG-2025-0042"
}
```

---

### GET /v1/ai-tools/payments/:payment_intent_id/status
**Purpose:** Check current payment status. Called when user asks "Did my payment go through?"

**Output:**
```
{
  status: "SUCCEEDED" | "PENDING" | "FAILED" | "CANCELLED",
  booking_id: "uuid",
  booking_ref: "DLG-2025-0042",
  amount_usd: 286,
  paid_at: "2025-12-01T10:15:00Z"
}
```

---

## 7. Tool Endpoints — Post-Booking Management

### DELETE /v1/ai-tools/bookings/:id/cancel
**Purpose:** Cancel a booking and trigger refund logic per cancellation policy.

**Input:**
```
{
  booking_id: "uuid",
  user_id: "uuid",
  reason: "Change of plans"
}
```

**Logic:**
1. Verify booking belongs to `user_id`.
2. Verify status is `CONFIRMED`.
3. Calculate hours until `travel_date`.
4. Apply cancellation policy for refund amount.
5. Call Stripe refund API.
6. Update `bookings.status = CANCELLED`.
7. Reverse any loyalty points earned from this booking.

**Output:**
```
{
  cancelled: true,
  booking_ref: "DLG-2025-0042",
  refund_amount_usd: 143,
  refund_policy_applied: "50% refund (cancelled 3 days before travel)",
  refund_eta: "7-14 business days",
  loyalty_points_reversed: 572
}
```

---

### POST /v1/ai-tools/bookings/:id/modify
**Purpose:** Reschedule booking to new dates.

**Input:**
```
{
  booking_id: "uuid",
  user_id: "uuid",
  new_travel_date: "2025-12-28",
  new_end_date: "2025-12-30"
}
```

**Logic:** Check new dates for availability → recalculate price → update booking → initiate supplemental payment if price increases.

---

### GET /v1/ai-tools/bookings/:id
**Purpose:** Retrieve full booking details for an active booking.

**Output:** Complete booking record including trip, hotel, vehicle, guide, payment status, itinerary, and contact details.

---

## 8. Tool Endpoints — Explore & AI Budget Planner

### GET /v1/ai-tools/places/search
**Purpose:** Search historical and cultural places.

**Query params:** `?query=Angkor Wat&province=Siem Reap&language=EN`

**Output:** Array of place objects with name, description, visitor tips, coordinates, images, entry fee, opening hours.

---

### GET /v1/ai-tools/festivals/upcoming
**Purpose:** Return upcoming festivals for recommendations and alerts.

**Query params:** `?province=Phnom Penh&days_ahead=30`

---

### POST /v1/ai-tools/budget/estimate
**Purpose:** AI Budget Planner — estimate total trip cost before any booking.

**Input:**
```
{
  duration_days: 5,
  people_count: 2,
  accommodation_tier: "BUDGET" | "MID" | "LUXURY",
  transport_type: "TUK_TUK" | "VAN" | "VIP_VAN",
  include_guide: true,
  provinces: ["Siem Reap", "Battambang"]
}
```

**Output:**
```
{
  total_estimate_usd: { min: 380, max: 520 },
  breakdown: {
    accommodation_usd: { min: 80, max: 140 },
    transport_usd: { min: 120, max: 160 },
    guide_usd: 80,
    meals_usd: { min: 60, max: 80 },
    entry_fees_usd: { min: 40, max: 60 }
  },
  currency_equivalents: {
    khr: { min: 1558000, max: 2132000 },
    cny: { min: 2755, max: 3771 }
  },
  tips: [
    "Siem Reap temple entry fees are $37 for a 3-day pass.",
    "Consider visiting Battambang by slow boat for a scenic experience."
  ]
}
```

---

## 9. Error Handling Standard

All AI tool endpoints return errors with a human-readable message the AI can relay naturally:

```
{
  success: false,
  error: {
    code: "BOOKING_EXPIRED",
    message: "Your booking reservation has expired. Would you like me to start a new reservation?",
    details: { expired_at: "2025-12-01T10:30:00Z" }
  }
}
```

**AI response guidance by error code:**

| Code | AI Should Say |
|---|---|
| BOOKING_EXPIRED | Offer to restart booking process |
| INSUFFICIENT_AVAILABILITY | Show next available dates |
| INVALID_DISCOUNT_CODE | Tell user code is invalid, ask for another |
| INSUFFICIENT_LOYALTY_POINTS | Show current balance, suggest lower amount |
| STUDENT_NOT_VERIFIED | Explain verification process |
| PAYMENT_FAILED | Offer to regenerate QR or try different method |
| TRIP_NOT_FOUND | Suggest browsing alternatives |
| CANCELLATION_NO_REFUND | Explain policy clearly, offer to keep booking |
