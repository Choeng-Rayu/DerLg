# DerLg.com — Transportation Booking System

**Module:** `src/transportation/`  
**Endpoints prefix:** `/v1/transportation/`  
**Supports:** Vans (Standard & VIP), Buses (25-seat & 45-seat), Tuk Tuks

---

## 1. Overview

The transportation module allows users to browse, filter, and book vehicles for their Cambodia trips. Transportation can be booked as part of a full package (via the AI agent) or as a standalone booking.

Every vehicle booking creates a record in the `bookings` table with `booking_type = TRANSPORT_ONLY` (or contributes to a `PACKAGE` booking).

---

## 2. Vehicle Categories

### 2.1 Vans
| Model | Tier | Capacity | Air-Con | WiFi | USB | Notes |
|---|---|---|---|---|---|---|
| Hyundai Starex | Standard | 8 pax | Yes | No | No | Most affordable van |
| Toyota Hiace | VIP | 10 pax | Yes | Yes | Yes | Comfortable for groups |
| Toyota Alphard | VIP | 7 pax | Yes | Yes | Yes | Premium luxury van |

### 2.2 Buses
| Type | Capacity | Air-Con | WiFi | Notes |
|---|---|---|---|---|
| Mini Bus | 25 seats | Yes | Optional | Good for medium groups |
| Full Bus | 45 seats | Yes | Optional | Large group travel |

### 2.3 Tuk Tuk
| Type | Capacity | Notes |
|---|---|---|
| Standard Khmer Tuk Tuk | 4 pax | Local transport, short distances |

---

## 3. Pricing Model

Transport pricing uses a combination of:

- **Per-day rate:** Fixed daily cost regardless of distance (for full-day hires)
- **Per-km rate:** For short point-to-point trips (primarily tuk tuks)
- **Route-based pricing:** Pre-set prices for common routes (e.g., Phnom Penh Airport to city center)

The price shown to the user always includes the driver. Fuel is included. Tolls are noted separately and may be added to the booking.

---

## 4. Browse & Filter Vehicles Flow

### Step-by-step

1. User navigates to the Booking screen → selects "Transport."
2. User is presented with filter options:
   - Vehicle category (Van / Bus / Tuk Tuk)
   - Passenger count
   - Travel date
   - Trip type (one-way / round-trip / full day hire)
   - Pickup city
   - Destination (optional)
3. Frontend calls `GET /v1/transportation/vehicles` with query parameters.
4. Backend queries `transportation_vehicles` table, filters by category, capacity ≥ requested passengers, and `is_active = true`.
5. Results are sorted by price ascending by default.
6. Frontend renders vehicle cards with image, name, capacity, price, and feature badges.

### Query parameters
```
GET /v1/transportation/vehicles
?category=VAN                  (optional, VAN | BUS | TUK_TUK)
&min_capacity=4                (minimum seats needed)
&travel_date=2025-12-20        (for availability check)
&pickup_city=Phnom Penh        (optional)
&sort=price_asc                (price_asc | price_desc | rating)
```

### Response
```
{
  success: true,
  data: [
    {
      id: "uuid",
      category: "VAN",
      model: "Toyota Hiace VIP",
      tier: "VIP",
      seat_capacity: 10,
      price_per_day_usd: 80,
      features: ["AC", "WiFi", "USB charging", "Reclining seats"],
      image_url: "https://...",
      avg_rating: 4.7,
      total_reviews: 124
    }
  ]
}
```

---

## 5. Get Vehicle Details Flow

1. User taps a vehicle card.
2. Frontend calls `GET /v1/transportation/vehicles/:id`.
3. Backend returns full details including all photos, feature list, pricing breakdown, and recent reviews.

### Response includes
- All image URLs
- Full feature list
- Per-day and per-km rates
- Sample routes with estimated prices
- Recent 5 reviews with ratings
- Availability calendar data

---

## 6. Check Availability Flow

Before confirming, the system must check that the selected vehicle is not already booked for the requested dates.

### Step-by-step

1. User selects dates and vehicle.
2. Frontend calls `POST /v1/transportation/check-availability`.
3. Backend queries the `bookings` table for any `CONFIRMED` or `RESERVED` bookings that overlap with the requested date range for the same `vehicle_id`.
4. If no conflicts: returns `{ available: true, total_price_usd: 240 }`.
5. If conflict: returns `{ available: false, next_available_date: "2025-12-22" }`.

### Request body
```
POST /v1/transportation/check-availability
{
  vehicle_id: "uuid",
  travel_date: "2025-12-20",
  end_date: "2025-12-22",
  trip_type: "FULL_DAY" | "ONE_WAY" | "ROUND_TRIP"
}
```

---

## 7. Create Transport Booking Flow

This flow is triggered either directly from the frontend or via the AI agent's tool call.

### Step-by-step

1. User confirms booking details (vehicle, dates, pickup, passenger count).
2. Frontend (or AI agent) calls `POST /v1/transportation/bookings`.
3. Backend validates all input fields.
4. Backend re-checks availability (double-check to prevent race conditions).
5. Backend calculates the total price based on the number of days and vehicle rate.
6. Backend applies any discount codes or loyalty points if provided.
7. Backend creates a `bookings` row with:
   - `status = RESERVED`
   - `booking_type = TRANSPORT_ONLY`
   - `reserved_until = NOW() + 15 minutes`
8. Backend stores the booking ID in Redis with a 15-minute TTL key: `booking_hold:{booking_id}`.
9. Backend returns the booking record and a `reserved_until` timestamp.
10. Payment flow begins (see Payment System documentation).
11. On payment success (via Stripe webhook): booking status updates to `CONFIRMED`.
12. On payment timeout (Redis key expires, no payment): booking status updates to `CANCELLED`.

### Request body
```
POST /v1/transportation/bookings
{
  vehicle_id: "uuid",
  travel_date: "2025-12-20",
  end_date: "2025-12-22",
  people_count: 6,
  pickup_location: "Phnom Penh International Airport",
  destination: "Siem Reap city center",
  special_requests: "Need child seat",
  discount_code: "FESTIVAL10",         (optional)
  loyalty_points_to_use: 100           (optional)
}
```

### Response
```
{
  success: true,
  data: {
    booking_id: "uuid",
    booking_ref: "DLG-2025-0087",
    status: "RESERVED",
    reserved_until: "2025-12-01T10:30:00Z",
    total_usd: 160,
    breakdown: {
      base_price: 160,
      discount: 16,
      loyalty_discount: 0,
      final_total: 144
    }
  }
}
```

---

## 8. Booking Cancellation Flow

### Step-by-step

1. User navigates to "My Trip" and selects a transport booking.
2. User taps "Cancel Booking."
3. Frontend calls `DELETE /v1/transportation/bookings/:id`.
4. Backend checks:
   - Is the booking in `CONFIRMED` status? (Can't cancel `PENDING` or already `CANCELLED`)
   - How many hours until travel_date?
5. Backend applies the refund policy based on the trip's `cancellation_policy`:
   - 7+ days before: 100% refund
   - 1–7 days before: 50% refund
   - Less than 24 hours: No refund
6. Backend calls the Payment module to initiate the Stripe refund.
7. Backend updates booking status to `CANCELLED`.
8. Backend deducts any loyalty points that were earned from this booking.
9. Backend sends a cancellation confirmation notification.

---

## 9. Tuk Tuk Specific Flow

Tuk tuk bookings are simpler and use per-km or per-hour pricing.

1. User selects "Tuk Tuk" from transport options.
2. User enters: pickup address, destination, date and time.
3. Backend calculates estimated distance using Google Maps Distance Matrix API.
4. Backend returns estimated price and estimated travel time.
5. User confirms. Booking is created as above.
6. Unlike vans and buses, tuk tuks support **same-day booking** (minimum 2-hour advance notice).
7. The driver's contact number is shared with the user upon confirmation.

---

## 10. API Endpoints Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /vehicles | Public | List all available vehicles with filters |
| GET | /vehicles/:id | Public | Get single vehicle full details |
| POST | /check-availability | Public | Check vehicle availability for dates |
| POST | /bookings | JWT Required | Create a new transport booking |
| GET | /bookings/:id | JWT Required | Get booking details |
| DELETE | /bookings/:id | JWT Required | Cancel a booking |
| GET | /bookings/my | JWT Required | List all transport bookings for current user |
| GET | /routes/popular | Public | List popular pre-priced routes |
