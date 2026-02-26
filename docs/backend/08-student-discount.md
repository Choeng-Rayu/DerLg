# DerLg.com — Student Discount System

**Module:** `src/student-discount/`  
**Endpoints prefix:** `/v1/student/`

---

## 1. Overview

DerLg.com offers verified student discounts to make travel in Cambodia more accessible to students. The verification process uses document upload combined with face match to prevent abuse.

Student discount applies as a percentage reduction on the total booking price and is available for all booking types (packages, transport, hotels, guides).

---

## 2. Eligibility Rules

- Must be enrolled in an accredited educational institution (high school, university, or vocational training).
- Must submit a valid student ID card.
- Verification expires after 12 months and must be renewed.
- Only one student verification per user account.
- The discount applies only to bookings made while the student status is active.
- Student discount cannot be combined with other promotional discount codes, but can be combined with loyalty point redemption.
- Discount rate: **15% off** the total booking price.

---

## 3. Verification Flow

### Step 1 — User Initiates Verification

1. User navigates to Profile → "Student Discount."
2. App shows the eligibility rules and the required documents.
3. User taps "Apply for Student Discount."

### Step 2 — Student ID Card Upload

1. User is prompted to take a photo of their student ID card (front side).
2. App guides the user with overlay guidelines: "Hold your ID within the frame."
3. The app performs basic client-side checks:
   - Image is not blurry (uses a sharpness detection heuristic)
   - The entire card is visible in the frame
   - Minimum resolution check
4. User confirms the image looks clear.
5. Frontend uploads the image to a pre-signed Supabase Storage URL.
6. Frontend calls `POST /v1/student/verify/start` with the image URL and institution name.
7. Backend creates a `student_verifications` row with `status = PENDING`.

### Step 3 — Face Selfie Capture

1. Immediately after ID upload, the app prompts: "Now take a selfie to verify it's you."
2. App opens the front camera with a face oval guide.
3. App performs a liveness check (user must blink or turn their head slightly to prevent photo spoofing).
4. Once liveness is confirmed, the selfie is captured.
5. Frontend uploads the selfie to Supabase Storage.
6. Frontend calls `POST /v1/student/verify/face` with the selfie URL and the verification ID.
7. Backend queues the face match job.

### Step 4 — Face Match Processing

1. Backend retrieves both images (student ID photo and selfie).
2. Backend calls the face comparison service (AWS Rekognition or a self-hosted face recognition model).
3. The service compares the face on the student ID card to the face in the selfie.
4. If similarity score ≥ 85%: proceed to admin review.
5. If similarity score < 85%: mark as `REJECTED` automatically with reason "Face does not match the student ID."

### Step 5 — Admin Review

1. Verification requests with a passing face match score are placed in the admin review queue.
2. Admin sees: student ID image, selfie, face match score, and institution name entered by the user.
3. Admin checks:
   - Is the student ID card genuine-looking?
   - Does the expiry date on the card show the student is currently enrolled?
   - Does the institution name match what's on the card?
4. Admin either approves (status → `APPROVED`) or rejects with a reason (status → `REJECTED`).
5. Approval sets `expires_at = NOW() + 12 months` on the user record.

### Step 6 — Notification

- On approval: Push notification and email sent to user. `users.is_student = true`. Discount is immediately active.
- On rejection: Push notification with the rejection reason. User may re-apply with a clearer ID photo.

---

## 4. Applying the Student Discount

When a user with `is_student = true` and a valid `student_verified_at` within the last 12 months creates a booking:

1. Frontend automatically shows the student discount badge on the pricing screen.
2. User can toggle "Apply Student Discount" on or off.
3. If applied, frontend calls the booking creation endpoint with `apply_student_discount: true`.
4. Backend verifies the student status server-side (never trusts the frontend flag alone).
5. Backend applies 15% reduction to `subtotal_usd`.
6. The discount is shown as a line item in the booking breakdown.
7. The `bookings` table records `student_discount_applied = true`.

---

## 5. Renewal Flow

30 days before expiry, the system sends a push notification and email reminding the student to re-verify. The re-verification process follows the same flow as the initial verification, but the admin review is expedited for known good actors.

---

## 6. API Endpoints Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /status | JWT Required | Get current student verification status |
| POST | /verify/start | JWT Required | Start verification, upload ID card |
| POST | /verify/face | JWT Required | Submit selfie for face match |
| GET | /verify/:id | JWT Required | Get verification request status |
| GET | /verify/queue | Admin Only | List all pending verifications |
| PATCH | /verify/:id/approve | Admin Only | Approve a verification |
| PATCH | /verify/:id/reject | Admin Only | Reject with reason |
