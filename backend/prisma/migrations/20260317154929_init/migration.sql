-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TRAVELER', 'GUIDE', 'ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'KH', 'ZH');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('MOUNTAIN', 'BEACH', 'CITY', 'FOREST', 'ISLAND', 'TEMPLE');

-- CreateEnum
CREATE TYPE "PlaceCategory" AS ENUM ('TEMPLE', 'MUSEUM', 'NATURE', 'MARKET', 'BEACH', 'MOUNTAIN');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'DOUBLE', 'TWIN', 'SUITE');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('VAN', 'BUS', 'TUK_TUK');

-- CreateEnum
CREATE TYPE "VehicleTier" AS ENUM ('STANDARD', 'VIP');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('PACKAGE', 'HOTEL_ONLY', 'TRANSPORT_ONLY', 'GUIDE_ONLY');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'RESERVED', 'CONFIRMED', 'CANCELLED', 'REFUNDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'BAKONG_QR', 'PAYPAL');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('TRIP', 'HOTEL', 'GUIDE', 'VEHICLE');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED_USD');

-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('SOS', 'MEDICAL', 'THEFT', 'LOST');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('SENT', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRM', 'REMINDER', 'FESTIVAL_ALERT', 'PAYMENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS');

-- CreateTable
CREATE TABLE "student_verifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "student_id_image_url" TEXT NOT NULL,
    "face_selfie_url" TEXT NOT NULL,
    "institution_name" VARCHAR(200) NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" UUID,
    "rejection_reason" TEXT,
    "expires_at" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_sessions" (
    "id" UUID NOT NULL,
    "session_id" VARCHAR NOT NULL,
    "user_id" UUID,
    "state" VARCHAR NOT NULL,
    "booking_id" UUID,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "last_active" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR NOT NULL,
    "entity_name" VARCHAR NOT NULL,
    "entity_id" UUID,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" VARCHAR,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "supabase_uid" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TRAVELER',
    "preferred_language" "Language" NOT NULL DEFAULT 'EN',
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "is_student" BOOLEAN NOT NULL DEFAULT false,
    "student_verified_at" TIMESTAMPTZ,
    "emergency_contact_name" VARCHAR,
    "emergency_contact_phone" VARCHAR,
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "booking_ref" VARCHAR(12) NOT NULL,
    "user_id" UUID NOT NULL,
    "trip_id" UUID,
    "hotel_room_id" UUID,
    "vehicle_id" UUID,
    "guide_id" UUID,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "booking_type" "BookingType" NOT NULL,
    "travel_date" DATE NOT NULL,
    "end_date" DATE,
    "people_count" INTEGER NOT NULL,
    "pickup_location" TEXT,
    "special_requests" TEXT,
    "customizations" JSONB,
    "subtotal_usd" DECIMAL(10,2) NOT NULL,
    "discount_amount_usd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "loyalty_discount_usd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_usd" DECIMAL(10,2) NOT NULL,
    "loyalty_points_earned" INTEGER NOT NULL DEFAULT 0,
    "loyalty_points_used" INTEGER NOT NULL DEFAULT 0,
    "student_discount_applied" BOOLEAN NOT NULL DEFAULT false,
    "reserved_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_codes" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "min_booking_usd" DECIMAL(10,2) NOT NULL,
    "valid_from" TIMESTAMPTZ NOT NULL,
    "valid_until" TIMESTAMPTZ NOT NULL,
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "festival_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festivals" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_kh" VARCHAR(200) NOT NULL,
    "name_zh" VARCHAR(200) NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "place_id" UUID,
    "image_url" TEXT,
    "has_discount" BOOLEAN NOT NULL DEFAULT false,
    "discount_percent" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "festivals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_kh" VARCHAR(200) NOT NULL,
    "name_zh" VARCHAR(200) NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "category" "PlaceCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "description_kh" TEXT NOT NULL,
    "description_zh" TEXT NOT NULL,
    "visitor_tips" TEXT,
    "dress_code" TEXT,
    "entry_fee_usd" DECIMAL(8,2),
    "opening_hours" JSONB NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "image_urls" TEXT[],
    "is_offline_available" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "title_kh" VARCHAR(200) NOT NULL,
    "title_zh" VARCHAR(200) NOT NULL,
    "slug" VARCHAR NOT NULL,
    "destination" VARCHAR(100) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "price_per_person_usd" DECIMAL(10,2) NOT NULL,
    "environment" "Environment" NOT NULL,
    "mood_tags" TEXT[],
    "includes" JSONB NOT NULL,
    "excludes" JSONB NOT NULL,
    "itinerary" JSONB NOT NULL,
    "highlights" TEXT[],
    "min_people" INTEGER NOT NULL,
    "max_people" INTEGER NOT NULL,
    "cancellation_policy" JSONB NOT NULL,
    "hotel_id" UUID,
    "transport_type" "VehicleCategory" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guides" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "languages" TEXT[],
    "bio" TEXT NOT NULL,
    "bio_kh" TEXT NOT NULL,
    "bio_zh" TEXT NOT NULL,
    "specialties" TEXT[],
    "price_per_day_usd" DECIMAL(10,2) NOT NULL,
    "years_experience" INTEGER NOT NULL,
    "certifications" TEXT[],
    "profile_image_url" TEXT,
    "avg_rating" DECIMAL(3,2),
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "star_rating" INTEGER NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "image_urls" TEXT[],
    "amenities" TEXT[],
    "check_in_time" TIME NOT NULL,
    "check_out_time" TIME NOT NULL,
    "cancellation_policy" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_rooms" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "room_type" "RoomType" NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "price_per_night_usd" DECIMAL(10,2) NOT NULL,
    "amenities" TEXT[],
    "image_urls" TEXT[],
    "total_rooms" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "hotel_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "booking_id" UUID,
    "type" "LoyaltyTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "balance_after" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_type" "SubjectType" NOT NULL,
    "subject_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stripe_payment_intent_id" VARCHAR(100) NOT NULL,
    "stripe_charge_id" VARCHAR(100),
    "stripe_event_id" VARCHAR(100),
    "amount_usd" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "PaymentMethod" NOT NULL,
    "qr_code_url" TEXT,
    "paid_at" TIMESTAMPTZ,
    "refunded_at" TIMESTAMPTZ,
    "refund_amount_usd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "refund_reason" TEXT,
    "failure_code" VARCHAR,
    "failure_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_alerts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "alert_type" "AlertType" NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "location_accuracy_m" INTEGER NOT NULL,
    "message" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'SENT',
    "responded_at" TIMESTAMPTZ,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportation_vehicles" (
    "id" UUID NOT NULL,
    "category" "VehicleCategory" NOT NULL,
    "model" VARCHAR NOT NULL,
    "tier" "VehicleTier" NOT NULL,
    "seat_capacity" INTEGER NOT NULL,
    "price_per_day_usd" DECIMAL(10,2),
    "price_per_km_usd" DECIMAL(8,4),
    "image_urls" TEXT[],
    "features" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "transportation_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_sessions_session_id_key" ON "ai_sessions"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_uid_key" ON "users"("supabase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_supabase_uid_idx" ON "users"("supabase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_ref_key" ON "bookings"("booking_ref");

-- CreateIndex
CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_travel_date_idx" ON "bookings"("travel_date");

-- CreateIndex
CREATE INDEX "bookings_booking_ref_idx" ON "bookings"("booking_ref");

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "trips_slug_key" ON "trips"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "guides_user_id_key" ON "guides"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_payment_intent_id_key" ON "payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_charge_id_key" ON "payments"("stripe_charge_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_event_id_key" ON "payments"("stripe_event_id");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- AddForeignKey
ALTER TABLE "student_verifications" ADD CONSTRAINT "student_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_verifications" ADD CONSTRAINT "student_verifications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hotel_room_id_fkey" FOREIGN KEY ("hotel_room_id") REFERENCES "hotel_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "transportation_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "guides"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "festivals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "festivals" ADD CONSTRAINT "festivals_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guides" ADD CONSTRAINT "guides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_rooms" ADD CONSTRAINT "hotel_rooms_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
