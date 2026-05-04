-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'KH', 'ZH');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('MOUNTAIN', 'BEACH', 'CITY', 'FOREST', 'ISLAND', 'TEMPLE');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('PACKAGE', 'HOTEL_ONLY', 'TRANSPORT_ONLY', 'GUIDE_ONLY');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'RESERVED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'QR_CODE', 'BAKONG_QR', 'PAYPAL');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('VAN', 'BUS', 'TUK_TUK');

-- CreateEnum
CREATE TYPE "VehicleTier" AS ENUM ('STANDARD', 'VIP');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'DOUBLE', 'TWIN', 'SUITE');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('SOS', 'MEDICAL', 'THEFT', 'LOST');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('SENT', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRM', 'REMINDER', 'FESTIVAL_ALERT', 'PAYMENT', 'EMERGENCY', 'REFUND', 'CANCELLATION');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PlaceCategory" AS ENUM ('TEMPLE', 'MUSEUM', 'NATURE', 'MARKET', 'BEACH', 'MOUNTAIN');

-- CreateEnum
CREATE TYPE "ReviewSubjectType" AS ENUM ('TRIP', 'HOTEL', 'GUIDE', 'VEHICLE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "preferred_language" VARCHAR(5) NOT NULL DEFAULT 'EN',
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "is_student" BOOLEAN NOT NULL DEFAULT false,
    "student_verified_at" TIMESTAMPTZ,
    "emergency_contact_name" VARCHAR(100),
    "emergency_contact_phone" VARCHAR(20),
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verify_token" VARCHAR(100),
    "password_reset_token" VARCHAR(100),
    "password_reset_expires" TIMESTAMPTZ,
    "referral_code" VARCHAR(20),
    "referred_by_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "title_kh" VARCHAR(200),
    "title_zh" VARCHAR(200),
    "slug" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "description_kh" TEXT,
    "description_zh" TEXT,
    "destination" VARCHAR(100) NOT NULL,
    "province" VARCHAR(100),
    "duration_days" INTEGER NOT NULL,
    "price_per_person_usd" DECIMAL(10,2) NOT NULL,
    "environment" "Environment" NOT NULL,
    "mood_tags" TEXT[],
    "includes" JSONB,
    "excludes" JSONB,
    "itinerary" JSONB,
    "highlights" TEXT[],
    "min_people" INTEGER NOT NULL DEFAULT 1,
    "max_people" INTEGER NOT NULL DEFAULT 20,
    "cancellation_policy" JSONB,
    "image_urls" TEXT[],
    "avg_rating" DECIMAL(3,2),
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "hotel_id" TEXT,
    "transport_type" "VehicleCategory",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_kh" VARCHAR(200),
    "name_zh" VARCHAR(200),
    "province" VARCHAR(100) NOT NULL,
    "category" "PlaceCategory" NOT NULL,
    "description" TEXT,
    "description_kh" TEXT,
    "description_zh" TEXT,
    "visitor_tips" TEXT,
    "dress_code" TEXT,
    "entry_fee_usd" DECIMAL(8,2),
    "opening_hours" JSONB,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "image_urls" TEXT[],
    "is_offline_available" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "star_rating" INTEGER NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "image_urls" TEXT[],
    "amenities" TEXT[],
    "check_in_time" VARCHAR(10),
    "check_out_time" VARCHAR(10),
    "cancellation_policy" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_rooms" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "room_type" "RoomType" NOT NULL,
    "bedrooms" INTEGER NOT NULL DEFAULT 1,
    "capacity" INTEGER NOT NULL,
    "price_per_night_usd" DECIMAL(10,2) NOT NULL,
    "amenities" TEXT[],
    "image_urls" TEXT[],
    "total_rooms" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "hotel_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportation_vehicles" (
    "id" TEXT NOT NULL,
    "category" "VehicleCategory" NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "tier" "VehicleTier" NOT NULL DEFAULT 'STANDARD',
    "seat_capacity" INTEGER NOT NULL,
    "price_per_day_usd" DECIMAL(10,2) NOT NULL,
    "price_per_km_usd" DECIMAL(8,4),
    "image_urls" TEXT[],
    "features" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transportation_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guides" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "languages" TEXT[],
    "bio" TEXT,
    "bio_kh" TEXT,
    "bio_zh" TEXT,
    "specialties" TEXT[],
    "price_per_day_usd" DECIMAL(10,2) NOT NULL,
    "years_experience" INTEGER NOT NULL,
    "certifications" TEXT[],
    "profile_image_url" TEXT,
    "avg_rating" DECIMAL(3,2),
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "booking_ref" VARCHAR(15) NOT NULL,
    "user_id" TEXT NOT NULL,
    "trip_id" TEXT,
    "hotel_room_id" TEXT,
    "vehicle_id" TEXT,
    "guide_id" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'RESERVED',
    "booking_type" "BookingType" NOT NULL,
    "travel_date" DATE NOT NULL,
    "end_date" DATE,
    "num_adults" INTEGER NOT NULL DEFAULT 1,
    "num_children" INTEGER NOT NULL DEFAULT 0,
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
    "discount_code_id" TEXT,
    "reserved_until" TIMESTAMPTZ,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT NOT NULL,
    "stripe_charge_id" TEXT,
    "stripe_event_id" TEXT,
    "amount_usd" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "PaymentMethod",
    "qr_code_url" TEXT,
    "paid_at" TIMESTAMPTZ,
    "refunded_at" TIMESTAMPTZ,
    "refund_amount_usd" DECIMAL(10,2),
    "refund_reason" TEXT,
    "failure_code" VARCHAR(50),
    "failure_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subject_type" "ReviewSubjectType" NOT NULL,
    "subject_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" VARCHAR(1000),
    "image_urls" TEXT[],
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festivals" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_kh" VARCHAR(200),
    "name_zh" VARCHAR(200),
    "province" VARCHAR(100),
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "description" TEXT,
    "description_kh" TEXT,
    "description_zh" TEXT,
    "place_id" TEXT,
    "image_url" TEXT,
    "has_discount" BOOLEAN NOT NULL DEFAULT false,
    "discount_percent" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "festivals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_codes" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "min_booking_usd" DECIMAL(10,2),
    "valid_from" TIMESTAMPTZ NOT NULL,
    "valid_until" TIMESTAMPTZ NOT NULL,
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "festival_id" TEXT,
    "booking_type" "BookingType",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "type" "LoyaltyTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "balance_after" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alert_type" "AlertType" NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "location_accuracy_m" INTEGER,
    "message" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'SENT',
    "responded_at" TIMESTAMPTZ,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "student_id_image_url" TEXT NOT NULL,
    "face_selfie_url" TEXT,
    "institution_name" VARCHAR(200) NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "rejection_reason" TEXT,
    "expires_at" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "student_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'sent',
    "sent_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_sessions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "state" VARCHAR(50),
    "booking_id" TEXT,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "last_active" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" VARCHAR(10) NOT NULL,
    "resource" TEXT NOT NULL,
    "request_body" JSONB,
    "ip_address" VARCHAR(50),
    "result" VARCHAR(20) NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_referral_code_idx" ON "users"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "trips_slug_key" ON "trips"("slug");

-- CreateIndex
CREATE INDEX "trips_is_active_idx" ON "trips"("is_active");

-- CreateIndex
CREATE INDEX "trips_environment_idx" ON "trips"("environment");

-- CreateIndex
CREATE INDEX "trips_province_idx" ON "trips"("province");

-- CreateIndex
CREATE INDEX "trips_slug_idx" ON "trips"("slug");

-- CreateIndex
CREATE INDEX "places_province_idx" ON "places"("province");

-- CreateIndex
CREATE INDEX "places_category_idx" ON "places"("category");

-- CreateIndex
CREATE INDEX "hotels_province_idx" ON "hotels"("province");

-- CreateIndex
CREATE INDEX "hotels_is_active_idx" ON "hotels"("is_active");

-- CreateIndex
CREATE INDEX "hotel_rooms_hotel_id_idx" ON "hotel_rooms"("hotel_id");

-- CreateIndex
CREATE INDEX "hotel_rooms_room_type_idx" ON "hotel_rooms"("room_type");

-- CreateIndex
CREATE INDEX "transportation_vehicles_category_idx" ON "transportation_vehicles"("category");

-- CreateIndex
CREATE INDEX "transportation_vehicles_is_active_idx" ON "transportation_vehicles"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "guides_user_id_key" ON "guides"("user_id");

-- CreateIndex
CREATE INDEX "guides_is_verified_idx" ON "guides"("is_verified");

-- CreateIndex
CREATE INDEX "guides_is_available_idx" ON "guides"("is_available");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_ref_key" ON "bookings"("booking_ref");

-- CreateIndex
CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");

-- CreateIndex
CREATE INDEX "bookings_booking_ref_idx" ON "bookings"("booking_ref");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_travel_date_idx" ON "bookings"("travel_date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_payment_intent_id_key" ON "payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_event_id_key" ON "payments"("stripe_event_id");

-- CreateIndex
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "reviews_subject_type_subject_id_idx" ON "reviews"("subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_booking_id_subject_type_subject_id_key" ON "reviews"("booking_id", "subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "festivals_start_date_idx" ON "festivals"("start_date");

-- CreateIndex
CREATE INDEX "festivals_is_active_idx" ON "festivals"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX "discount_codes_code_idx" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX "discount_codes_is_active_idx" ON "discount_codes"("is_active");

-- CreateIndex
CREATE INDEX "loyalty_transactions_user_id_idx" ON "loyalty_transactions"("user_id");

-- CreateIndex
CREATE INDEX "loyalty_transactions_booking_id_idx" ON "loyalty_transactions"("booking_id");

-- CreateIndex
CREATE INDEX "emergency_alerts_user_id_idx" ON "emergency_alerts"("user_id");

-- CreateIndex
CREATE INDEX "emergency_alerts_status_idx" ON "emergency_alerts"("status");

-- CreateIndex
CREATE INDEX "student_verifications_user_id_idx" ON "student_verifications"("user_id");

-- CreateIndex
CREATE INDEX "student_verifications_status_idx" ON "student_verifications"("status");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE UNIQUE INDEX "ai_sessions_session_id_key" ON "ai_sessions"("session_id");

-- CreateIndex
CREATE INDEX "ai_sessions_user_id_idx" ON "ai_sessions"("user_id");

-- CreateIndex
CREATE INDEX "ai_sessions_session_id_idx" ON "ai_sessions"("session_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_id_fkey" FOREIGN KEY ("referred_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_rooms" ADD CONSTRAINT "hotel_rooms_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guides" ADD CONSTRAINT "guides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "festivals" ADD CONSTRAINT "festivals_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "festivals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_verifications" ADD CONSTRAINT "student_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_verifications" ADD CONSTRAINT "student_verifications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
