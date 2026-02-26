# DerLg.com — Authentication System

**Module:** `src/auth/`  
**Technology:** Supabase Auth + NestJS JWT Guards  
**Endpoints prefix:** `/v1/auth/`

---

## 1. Overview

DerLg.com uses a two-layer authentication system:

1. **Supabase Auth** handles user registration, email verification, password hashing, and OAuth (Google). It issues Supabase tokens.
2. **NestJS JWT** wraps the Supabase session into a short-lived access token (15 minutes) and a long-lived refresh token (7 days) that the frontend and AI agent use for all API calls.

This means the frontend never calls Supabase directly for auth. It calls the NestJS `/v1/auth/` endpoints, which handle Supabase internally and return standardized tokens.

---

## 2. Registration Flow

### Step-by-step

1. User opens the app for the first time and taps "Register."
2. User fills in: name, email, phone, password, and preferred language.
3. Frontend sends a `POST /v1/auth/register` request.
4. NestJS calls Supabase Auth `signUp()` with the email and password.
5. Supabase creates a user record and sends a verification email.
6. NestJS creates a corresponding row in the `users` table with the Supabase UID linked.
7. NestJS returns a success message telling the user to verify their email.
8. User clicks the email link. Supabase marks the account as verified.
9. User logs in (see Login Flow below).

### Request body
```
POST /v1/auth/register
{
  name: string,
  email: string,
  phone: string (optional),
  password: string (min 8 chars),
  preferred_language: "EN" | "KH" | "ZH"
}
```

### Response
```
{
  success: true,
  message: "Registration successful. Please verify your email.",
  data: { user_id: "uuid" }
}
```

### Validation rules
- Email must be unique in the `users` table
- Password must be at least 8 characters and contain at least one number
- Name must be 2–100 characters
- Phone, if provided, must match international format

---

## 3. Login Flow

### Step-by-step

1. User enters email and password on the login screen.
2. Frontend sends `POST /v1/auth/login`.
3. NestJS calls Supabase Auth `signInWithPassword()`.
4. If Supabase returns an error (wrong password, unverified email), NestJS returns a 401.
5. If Supabase succeeds, NestJS fetches the user's row from the `users` table.
6. NestJS generates:
   - An **access token** (JWT, 15-minute TTL) containing `{ sub: user_id, role, email, preferred_language }`
   - A **refresh token** (JWT, 7-day TTL) containing only `{ sub: user_id, tokenVersion }`
7. Access token is returned in the JSON response body.
8. Refresh token is set as an `httpOnly` Secure cookie (never readable by JavaScript).
9. Frontend stores the access token in memory (not localStorage) and attaches it to every API request as `Authorization: Bearer <token>`.

### Request body
```
POST /v1/auth/login
{
  email: string,
  password: string
}
```

### Response
```
{
  success: true,
  data: {
    access_token: "<jwt>",
    user: {
      id: "uuid",
      name: "Chan Dara",
      email: "chan@example.com",
      role: "TRAVELER",
      preferred_language: "KH",
      loyalty_points: 150,
      is_student: false
    }
  }
}
```

### Cookie set by server
```
Set-Cookie: refresh_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/v1/auth/refresh; Max-Age=604800
```

---

## 4. Token Refresh Flow

Access tokens expire every 15 minutes. When the frontend receives a `401 Unauthorized` response, it automatically calls the refresh endpoint.

### Step-by-step

1. Frontend receives a 401 from any API call.
2. Frontend calls `POST /v1/auth/refresh` (the httpOnly cookie is automatically sent by the browser).
3. NestJS reads the refresh token from the cookie and validates it.
4. NestJS checks that the `tokenVersion` in the refresh token matches the value stored in the database (allows invalidation of all tokens on logout).
5. If valid, NestJS issues a new access token and returns it.
6. Frontend retries the original failed request with the new access token.

### Request
```
POST /v1/auth/refresh
(No body required — refresh token comes from httpOnly cookie)
```

### Response
```
{
  success: true,
  data: { access_token: "<new-jwt>" }
}
```

---

## 5. Logout Flow

1. User taps "Logout" in the app.
2. Frontend calls `POST /v1/auth/logout`.
3. NestJS increments the user's `tokenVersion` in the database (this invalidates all existing refresh tokens).
4. NestJS clears the httpOnly cookie by setting it with an expired date.
5. NestJS calls Supabase Auth `signOut()`.
6. Frontend clears the access token from memory and redirects to the login screen.

---

## 6. Google OAuth Flow (Optional)

1. User taps "Continue with Google."
2. Frontend redirects to `GET /v1/auth/google`.
3. NestJS redirects to Google's OAuth consent screen.
4. User authorizes. Google redirects back to `/v1/auth/google/callback`.
5. NestJS receives the Google profile (name, email, avatar).
6. NestJS checks if a user with that email exists. If yes, logs them in. If no, creates a new user row.
7. NestJS issues access and refresh tokens as in the normal login flow.
8. NestJS redirects the browser to the frontend with the access token in a query param or session.

---

## 7. Password Reset Flow

1. User taps "Forgot Password."
2. User enters their email.
3. Frontend calls `POST /v1/auth/forgot-password`.
4. NestJS calls Supabase Auth `resetPasswordForEmail()`.
5. Supabase sends a password reset email with a link.
6. User clicks the link, which opens the app's reset page.
7. User enters a new password.
8. Frontend calls `POST /v1/auth/reset-password` with the Supabase reset token and new password.
9. NestJS calls Supabase to apply the new password.
10. NestJS increments `tokenVersion` to invalidate all existing sessions.
11. User is redirected to login.

---

## 8. JWT Guard

All protected routes use the `JwtAuthGuard`. When applied to a controller or route, it:

1. Reads the `Authorization: Bearer <token>` header.
2. Verifies the JWT signature using the NestJS JWT secret.
3. Checks that the token has not expired.
4. Attaches the decoded user payload to `request.user`.
5. If any check fails, returns a `401 Unauthorized` response immediately.

### Role Guard

Some routes are restricted by role (e.g., admin-only endpoints). The `RolesGuard` reads the `role` claim from the JWT and compares it to the allowed roles defined in a `@Roles()` decorator.

---

## 9. AI Agent Authentication

The Python AI Agent is a trusted backend service. It authenticates with the NestJS backend using a **service API key** (not a user JWT). This key is stored as an environment variable and sent as `X-Service-Key: <key>` in the header of all tool call requests.

NestJS has a `ServiceKeyGuard` that validates this header for the `/v1/ai-tools/` route group. These endpoints are never accessible to regular users.

---

## 10. Security Checklist

| Check | Status |
|---|---|
| Passwords hashed by Supabase Auth (bcrypt) | Required |
| Access tokens stored in memory only (not localStorage) | Required |
| Refresh tokens in httpOnly cookie only | Required |
| Token version incremented on logout and password reset | Required |
| All auth endpoints rate-limited (5 req / 5 min) | Required |
| Email verification required before first login | Required |
| All tokens include expiry claim | Required |
| HTTPS enforced on all endpoints | Required |
