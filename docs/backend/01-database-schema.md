# DerLg.com — Database Schema (Supabase / PostgreSQL)

**Host:** Supabase  
**ORM:** Prisma  
**Migration tool:** Prisma Migrate  

All tables are defined in `prisma/schema.prisma` and synced to Supabase via `prisma db push` or `prisma migrate deploy`.

---

## 1. users

Stores all registered users of the platform.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| supabase_uid | VARCHAR | Supabase Auth user ID (linked) |
| name | VARCHAR(100) | Full name |
| email | VARCHAR(255) | Unique, indexed |
| phone | VARCHAR(20) | Optional, used for alerts |
| avatar_url | TEXT | From Supabase Storage |
| role | ENUM | `TRAVELER`, `GUIDE`, `ADMIN` |
| preferred_language | ENUM | `EN`, `KH`, `ZH` |
| loyalty_points | INTEGER | Default 0 |
| is_student | BOOLEAN | Verified student flag |
| student_verified_at | TIMESTAMPTZ | When student ID was approved |
| emergency_contact_name | VARCHAR | For profile emergency section |
| emergency_contact_phone | VARCHAR | For profile emergency section |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

**Indexes:** `email`, `phone`, `supabase_uid`

---

## 2. trips

The master catalog of all tour packages available on DerLg.com. These are DerLg-designed packages.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| title | VARCHAR(200) | E.g. "Angkor Sunrise 2-Day Tour" |
| title_kh | VARCHAR(200) | Khmer translation |
| title_zh | VARCHAR(200) | Chinese translation |
| slug | VARCHAR | URL-friendly unique name |
| destination | VARCHAR(100) | E.g. "Siem Reap" |
| duration_days | INTEGER | |
| price_per_person_usd | DECIMAL(10,2) | Base price |
| environment | ENUM | `MOUNTAIN`, `BEACH`, `CITY`, `FOREST`, `ISLAND`, `TEMPLE` |
| mood_tags | TEXT[] | E.g. `["romantic", "adventure"]` |
| includes | JSONB | Array of included items |
| excludes | JSONB | Array of excluded items |
| itinerary | JSONB | Day-by-day schedule object |
| highlights | TEXT[] | Top 3-5 highlights |
| min_people | INTEGER | Minimum group size |
| max_people | INTEGER | Maximum group size |
| cancellation_policy | JSONB | Refund rules object |
| hotel_id | UUID (FK) | Default hotel for this trip |
| transport_type | ENUM | Default transport type |
| is_active | BOOLEAN | Visible to users |
| created_at | TIMESTAMPTZ | |

---

## 3. places

Cambodian historical and cultural places for the Explore screen.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR(200) | E.g. "Angkor Wat" |
| name_kh | VARCHAR(200) | |
| name_zh | VARCHAR(200) | |
| province | VARCHAR(100) | E.g. "Siem Reap" |
| category | ENUM | `TEMPLE`, `MUSEUM`, `NATURE`, `MARKET`, `BEACH`, `MOUNTAIN` |
| description | TEXT | Long-form cultural description |
| description_kh | TEXT | |
| description_zh | TEXT | |
| visitor_tips | TEXT | Practical tips for visitors |
| dress_code | TEXT | E.g. "Cover knees and shoulders" |
| entry_fee_usd | DECIMAL(8,2) | Null if free |
| opening_hours | JSONB | Days and hours object |
| latitude | DECIMAL(9,6) | GPS coordinate |
| longitude | DECIMAL(9,6) | GPS coordinate |
| image_urls | TEXT[] | Array of Supabase Storage URLs |
| is_offline_available | BOOLEAN | Pre-cached for offline map |
| created_at | TIMESTAMPTZ | |

---

## 4. hotels

Hotel inventory available for booking.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR(200) | |
| province | VARCHAR(100) | |
| address | TEXT | |
| star_rating | INTEGER | 1-5 |
| latitude | DECIMAL(9,6) | |
| longitude | DECIMAL(9,6) | |
| image_urls | TEXT[] | |
| amenities | TEXT[] | `["wifi", "pool", "breakfast"]` |
| check_in_time | TIME | |
| check_out_time | TIME | |
| cancellation_policy | JSONB | |
| is_active | BOOLEAN | |

---

## 5. hotel_rooms

Individual room types per hotel.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| hotel_id | UUID (FK → hotels) | |
| room_type | ENUM | `SINGLE`, `DOUBLE`, `TWIN`, `SUITE` |
| bedrooms | INTEGER | 1 or 2 |
| capacity | INTEGER | Max occupants |
| price_per_night_usd | DECIMAL(10,2) | |
| amenities | TEXT[] | Room-specific amenities |
| image_urls | TEXT[] | |
| total_rooms | INTEGER | Inventory count |
| is_active | BOOLEAN | |

---

## 6. transportation_vehicles

All bookable vehicles on the platform.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| category | ENUM | `VAN`, `BUS`, `TUK_TUK` |
| model | VARCHAR | E.g. "Toyota Hiace VIP" |
| tier | ENUM | `STANDARD`, `VIP` |
| seat_capacity | INTEGER | |
| price_per_day_usd | DECIMAL(10,2) | |
| price_per_km_usd | DECIMAL(8,4) | Optional km-based pricing |
| image_urls | TEXT[] | |
| features | TEXT[] | E.g. `["AC", "WiFi", "USB charging"]` |
| is_active | BOOLEAN | |

---

## 7. guides

Tour guide profiles.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| languages | TEXT[] | `["en", "kh", "zh"]` |
| bio | TEXT | |
| bio_kh | TEXT | |
| bio_zh | TEXT | |
| specialties | TEXT[] | E.g. `["Angkor temples", "Phnom Penh history"]` |
| price_per_day_usd | DECIMAL(10,2) | |
| years_experience | INTEGER | |
| certifications | TEXT[] | |
| profile_image_url | TEXT | |
| avg_rating | DECIMAL(3,2) | Computed from reviews |
| total_reviews | INTEGER | |
| is_verified | BOOLEAN | Admin-approved |
| is_available | BOOLEAN | Currently accepting bookings |

---

## 8. bookings

Master bookings table — every reservation lives here.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| booking_ref | VARCHAR(12) | Human-readable ref, e.g. `DLG-2025-0042` |
| user_id | UUID (FK → users) | |
| trip_id | UUID (FK → trips) | Null for custom bookings |
| hotel_room_id | UUID (FK → hotel_rooms) | Null if no hotel |
| vehicle_id | UUID (FK → transportation_vehicles) | Null if no transport |
| guide_id | UUID (FK → guides) | Null if no guide |
| status | ENUM | `PENDING`, `RESERVED`, `CONFIRMED`, `CANCELLED`, `REFUNDED`, `COMPLETED` |
| booking_type | ENUM | `PACKAGE`, `HOTEL_ONLY`, `TRANSPORT_ONLY`, `GUIDE_ONLY` |
| travel_date | DATE | Start date |
| end_date | DATE | End date |
| people_count | INTEGER | |
| pickup_location | TEXT | |
| special_requests | TEXT | |
| customizations | JSONB | Applied add-ons |
| subtotal_usd | DECIMAL(10,2) | Before discounts |
| discount_amount_usd | DECIMAL(10,2) | |
| loyalty_discount_usd | DECIMAL(10,2) | |
| total_usd | DECIMAL(10,2) | Final charged amount |
| loyalty_points_earned | INTEGER | Awarded on completion |
| loyalty_points_used | INTEGER | Redeemed at booking |
| student_discount_applied | BOOLEAN | |
| reserved_until | TIMESTAMPTZ | 15-min payment hold expiry |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Indexes:** `user_id`, `status`, `travel_date`, `booking_ref`

---

## 9. payments

Financial records linked to bookings.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| booking_id | UUID (FK → bookings) | |
| stripe_payment_intent_id | VARCHAR(100) | Unique |
| stripe_charge_id | VARCHAR(100) | Set after capture |
| stripe_event_id | VARCHAR(100) | For idempotency |
| amount_usd | DECIMAL(10,2) | |
| currency | VARCHAR(3) | `USD` (KHR/CNY converted) |
| status | ENUM | `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED` |
| payment_method | ENUM | `CARD`, `BAKONG_QR`, `PAYPAL` |
| qr_code_url | TEXT | For QR payment display |
| paid_at | TIMESTAMPTZ | |
| refunded_at | TIMESTAMPTZ | |
| refund_amount_usd | DECIMAL(10,2) | |
| refund_reason | TEXT | |
| failure_code | VARCHAR | Stripe failure code |
| failure_message | TEXT | |
| created_at | TIMESTAMPTZ | |

---

## 10. reviews

User reviews for trips, hotels, guides, and transport.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| booking_id | UUID (FK → bookings) | Linked to actual booking |
| user_id | UUID (FK → users) | |
| subject_type | ENUM | `TRIP`, `HOTEL`, `GUIDE`, `VEHICLE` |
| subject_id | UUID | ID of the reviewed entity |
| rating | INTEGER | 1-5 |
| comment | TEXT | |
| is_verified | BOOLEAN | Has completed booking |
| is_visible | BOOLEAN | Passed moderation |
| created_at | TIMESTAMPTZ | |

---

## 11. festivals

Festival and event calendar.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR(200) | |
| name_kh | VARCHAR(200) | |
| name_zh | VARCHAR(200) | |
| province | VARCHAR(100) | |
| start_date | DATE | |
| end_date | DATE | |
| description | TEXT | |
| place_id | UUID (FK → places) | |
| image_url | TEXT | |
| has_discount | BOOLEAN | Triggers coupon generation |
| discount_percent | INTEGER | If has_discount |
| is_active | BOOLEAN | |

---

## 12. discount_codes

Promotional and event-based coupons.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| code | VARCHAR(20) | Unique, uppercase |
| discount_type | ENUM | `PERCENT`, `FIXED_USD` |
| discount_value | DECIMAL(10,2) | |
| min_booking_usd | DECIMAL(10,2) | Minimum spend required |
| valid_from | TIMESTAMPTZ | |
| valid_until | TIMESTAMPTZ | |
| max_uses | INTEGER | Null = unlimited |
| current_uses | INTEGER | |
| festival_id | UUID (FK → festivals) | Null if general coupon |
| is_active | BOOLEAN | |

---

## 13. loyalty_transactions

Complete history of loyalty point changes.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| booking_id | UUID (FK → bookings) | Null for manual adjustments |
| type | ENUM | `EARNED`, `REDEEMED`, `EXPIRED`, `ADJUSTED` |
| points | INTEGER | Positive = earned, negative = spent |
| description | TEXT | E.g. "Earned from 3-day Angkor package" |
| balance_after | INTEGER | Points balance after this transaction |
| created_at | TIMESTAMPTZ | |

---

## 14. emergency_alerts

Log of all emergency events triggered by users.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| alert_type | ENUM | `SOS`, `MEDICAL`, `THEFT`, `LOST` |
| latitude | DECIMAL(9,6) | GPS at time of alert |
| longitude | DECIMAL(9,6) | GPS at time of alert |
| location_accuracy_m | INTEGER | GPS accuracy in meters |
| message | TEXT | User's optional message |
| status | ENUM | `SENT`, `ACKNOWLEDGED`, `RESOLVED` |
| responded_at | TIMESTAMPTZ | When support responded |
| resolved_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

---

## 15. student_verifications

Student discount verification requests.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| student_id_image_url | TEXT | Supabase Storage URL |
| face_selfie_url | TEXT | For face match verification |
| institution_name | VARCHAR(200) | |
| status | ENUM | `PENDING`, `APPROVED`, `REJECTED` |
| reviewed_by | UUID (FK → users) | Admin user |
| rejection_reason | TEXT | |
| expires_at | DATE | Student discount valid until |
| created_at | TIMESTAMPTZ | |

---

## 16. notifications

Outgoing notification log.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| type | ENUM | `BOOKING_CONFIRM`, `REMINDER`, `FESTIVAL_ALERT`, `PAYMENT`, `EMERGENCY` |
| channel | ENUM | `PUSH`, `EMAIL`, `SMS` |
| title | TEXT | |
| body | TEXT | |
| data | JSONB | Extra payload |
| is_read | BOOLEAN | |
| sent_at | TIMESTAMPTZ | |
| delivered_at | TIMESTAMPTZ | |

---

## 17. ai_sessions

Conversation sessions managed by the AI agent.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| session_id | VARCHAR | Redis session key |
| user_id | UUID (FK → users) | Null for anonymous |
| state | VARCHAR | Current agent state |
| booking_id | UUID (FK → bookings) | Active booking in progress |
| message_count | INTEGER | |
| last_active | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

---

## 18. Supabase Row-Level Security (RLS) Summary

| Table | Policy |
|---|---|
| users | Users can only SELECT/UPDATE their own row |
| bookings | Users can only SELECT their own bookings |
| payments | Users can SELECT their own payments; no UPDATE |
| emergency_alerts | Users can INSERT; support role can SELECT all |
| reviews | Users can INSERT if they have a completed booking |
| loyalty_transactions | Users can SELECT their own; no direct INSERT |
| ai_sessions | Users can SELECT their own; agent service role can UPDATE |

All INSERT/UPDATE operations that require business logic go through the NestJS backend (using service role key), which enforces rules before writing.
