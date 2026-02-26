# DerLg.com — Emergency & Safety System

**Module:** `src/emergency/`  
**Endpoints prefix:** `/v1/emergency/`  
**Priority:** Mission-critical — this feature must work even in degraded network conditions.

---

## 1. Overview

The Emergency & Safety system is one of DerLg.com's most important differentiators. It exists to protect travelers in Cambodia who may be in unfamiliar areas with limited local knowledge or language ability.

When a traveler presses the emergency button, the system:
1. Captures their GPS location immediately
2. Sends an alert to DerLg support staff
3. Provides direct contact numbers for local police
4. Works in low-connectivity environments using offline queuing

---

## 2. Emergency Contact Types

### 2.1 Police Contact
Each province in Cambodia has a local police emergency number. The system stores province-specific police contacts and displays the relevant number based on the user's current GPS location.

### 2.2 DerLg Tour Support
A 24/7 DerLg support line is available to all active travelers (those with a `CONFIRMED` booking with a travel date within 3 days of today). Support staff speak Khmer, English, and Chinese.

### 2.3 Embassy Contacts
For international travelers, the system stores embassy emergency numbers by nationality. The app prompts users during profile setup to select their country, enabling the correct embassy contact to be shown in an emergency.

---

## 3. Emergency Alert Flow (Online)

### Step-by-step

1. User is on the Profile (Emergency) screen or any screen with the persistent emergency button.
2. User presses and holds the emergency button for 3 seconds (to prevent accidental triggers).
3. App shows a confirmation dialog: "Send emergency alert? Your location will be shared with support."
4. User confirms.
5. App immediately attempts to obtain GPS coordinates (high accuracy mode, timeout: 5 seconds).
6. App sends `POST /v1/emergency/alerts` with the GPS coordinates, alert type, and optional message.
7. Backend creates an `emergency_alerts` row with `status = SENT`.
8. Backend sends an immediate push notification to the support team's dashboard.
9. Backend sends an SMS to the DerLg support emergency line.
10. Backend sends an automated reply push notification to the user: "Your alert has been received. Support will contact you within 2 minutes."
11. Backend returns to the app: support contact number, local police number, nearest hospital info.
12. App displays all emergency contacts and shows a "Alert Sent" confirmation screen.

### Request body
```
POST /v1/emergency/alerts
{
  alert_type: "SOS" | "MEDICAL" | "THEFT" | "LOST",
  latitude: 11.5564,
  longitude: 104.9282,
  location_accuracy_m: 15,
  message: "I fell and may have broken my ankle",  (optional)
  booking_id: "uuid"   (optional — links alert to active trip)
}
```

### Response
```
{
  success: true,
  data: {
    alert_id: "uuid",
    support_phone: "+855 12 345 678",
    police_phone: "117",
    nearest_hospital: {
      name: "Royal Phnom Penh Hospital",
      phone: "+855 23 991 000",
      distance_km: 2.3
    },
    message: "Help is on the way. Stay calm and stay where you are."
  }
}
```

---

## 4. Emergency Alert Flow (Low Connectivity / Offline)

This is critical for travelers in rural areas of Cambodia where internet may be unreliable.

### Strategy: Offline Queue + SMS Fallback

#### Offline Queue
1. When the user presses the emergency button with no internet:
2. App detects no connectivity.
3. App saves the alert to a local offline queue (device storage): `{ timestamp, GPS, alert_type, user_id }`.
4. App immediately displays emergency contacts that were cached during the last online session.
5. App starts polling for connectivity every 10 seconds.
6. As soon as connectivity is restored, app sends all queued alerts to `POST /v1/emergency/alerts`.
7. Backend processes the queued alert with the original timestamp from the device.

#### SMS Fallback
1. If the device has cellular signal but no data (common in rural Cambodia):
2. App generates a pre-formatted SMS message: `"DerLg SOS: [user_name], GPS: [lat],[lng], Type: [alert_type], Time: [timestamp]"`
3. App opens the native SMS composer with the DerLg emergency SMS number pre-filled.
4. User sends the SMS with one tap.
5. The DerLg support team's SMS system parses the incoming message and creates an alert record manually.

#### Cached Emergency Contacts
When the user is online, the app fetches and caches:
- DerLg support numbers
- Province-specific police numbers (for all 25 provinces)
- User's nearest hospital based on their trip location
- User's embassy contact (based on nationality)

This cache is stored in the app's local storage and is available offline indefinitely.

---

## 5. Alert Status Tracking

The user can see the status of their alert in real-time on the emergency screen.

| Status | Meaning | Display |
|---|---|---|
| SENT | Alert received by backend | "Alert sent — support notified" |
| ACKNOWLEDGED | Support staff has seen the alert | "Support team acknowledged your alert" |
| RESOLVED | Incident closed | "Alert resolved — stay safe!" |

The app uses a WebSocket connection to receive real-time status updates while online. If offline, it polls the status when connectivity returns.

---

## 6. Support Dashboard (Admin)

Support staff access a real-time dashboard at `admin.derlg.com/emergency`:

- Live list of all active alerts sorted by time sent
- Map view showing all alert locations
- One-click call button to reach the traveler
- Status update buttons: "Acknowledge" and "Resolve"
- Alert history log with full details

When a new alert arrives, the dashboard emits an audio alert and highlights the new entry in red. Push notifications are sent to all on-duty support staff.

---

## 7. Pre-Trip Safety Briefing

When a booking is confirmed, the system automatically sends the traveler:

1. A push notification 24 hours before departure with safety tips for their destination.
2. An email with the local emergency numbers for the province they are visiting.
3. The DerLg support contact details embedded in their booking confirmation.

This ensures travelers have the information before they need it.

---

## 8. Location Sharing with Guide or Driver

When a traveler has a confirmed booking with a guide or driver assigned:

- Both the traveler and the guide/driver can opt in to share their live GPS location with each other for the duration of the trip.
- This is done via `POST /v1/emergency/location-share` which creates a temporary shared-location session (TTL: duration of the booking).
- The guide's app shows the traveler's location; the traveler's app shows the guide's location.
- This session is destroyed after `end_date + 6 hours`.

---

## 9. API Endpoints Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /alerts | JWT Required | Create emergency alert |
| GET | /alerts/my | JWT Required | Get user's alert history |
| GET | /contacts | JWT Required | Get emergency contacts for current location |
| GET | /contacts/province/:name | Public | Get police/hospital for a province |
| POST | /location-share | JWT Required | Start GPS sharing session with guide/driver |
| DELETE | /location-share/:session_id | JWT Required | End GPS sharing session |
| PATCH | /alerts/:id/status | Admin Only | Update alert status (support staff) |

---

## 10. Privacy & Data

- GPS coordinates from emergency alerts are stored permanently in the `emergency_alerts` table for safety and legal purposes.
- Location-sharing session data is stored temporarily in Redis and deleted after the session ends.
- Users are informed of this during onboarding and in the Terms of Service.
- Emergency alert data is never used for marketing.
