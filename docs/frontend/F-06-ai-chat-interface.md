# DerLg.com — AI Chat Interface

**Route:** `/chat`  
**File:** `app/chat/page.tsx`  
**Auth:** Required (unauthenticated users are redirected to /login)  
**Real-time:** WebSocket connection to Python AI Agent

---

## 1. Purpose

The AI Chat Interface is DerLg.com's signature feature. It is a full-screen conversational interface where users can plan trips, browse options, customize packages, complete bookings, and pay — entirely through natural conversation.

The chat is the primary booking channel. Every feature of DerLg.com is accessible through it: hotel browsing, transport selection, guide booking, budget planning, festival alerts, and post-trip customer support.

---

## 2. Screen Layout

```
┌─────────────────────────────────┐
│  ← Back    AI Concierge    🌐   │  ← Top bar
├─────────────────────────────────┤
│                                 │
│   [Message bubble — AI]         │
│                                 │
│              [Message — User]   │
│                                 │
│   [Trip Card Component]         │
│                                 │
│   [QR Payment Component]        │
│                                 │
│   [Typing indicator...]         │
│                                 │
├─────────────────────────────────┤
│  [Text input]    [Send Button]  │  ← Input bar
└─────────────────────────────────┘
```

The chat takes the full screen. The bottom navigation is hidden on this page. A back arrow returns to the Home screen.

---

## 3. WebSocket Connection

The frontend maintains a persistent WebSocket connection to the Python AI Agent server.

### Connection Flow

1. User navigates to `/chat`.
2. `useWebSocket` hook initiates: `new WebSocket('wss://agent.derlg.com/ws/{session_id}')`.
3. `session_id` is a UUID generated client-side on first visit and stored in sessionStorage (not localStorage — intentionally clears when browser tab closes for privacy).
4. If the session_id exists in sessionStorage, the existing session is resumed (AI remembers conversation history from Redis).
5. The hook sends an initial handshake message with the user's JWT token for authentication.
6. If the WebSocket fails to connect (offline), the hook retries with exponential backoff up to 5 attempts before showing an offline banner.

### Message Types Received from AI Agent

The AI agent sends structured JSON messages — not plain text. The frontend renders different UI components based on the `type` field:

| Type | Component Rendered |
|---|---|
| `text` | Plain chat bubble |
| `trip_cards` | `<TripCardsMessage>` — horizontal scroll of trip cards |
| `image_gallery` | `<ImageGalleryMessage>` — photo grid |
| `itinerary` | `<ItineraryDisplay>` — expandable day-by-day plan |
| `hotel_details` | `<HotelDetailsCard>` — hotel info card |
| `weather_forecast` | `<WeatherCard>` — 7-day visual forecast |
| `budget_estimate` | `<BudgetEstimateCard>` — cost breakdown |
| `trip_comparison` | `<ComparisonTable>` — side-by-side compare |
| `booking_summary` | `<BookingSummaryCard>` — pre-booking confirmation |
| `payment_qr` | `<QRPaymentDisplay>` — QR code with countdown timer |
| `booking_confirmed` | `<BookingConfirmedCard>` — success celebration card |
| `typing_start` | Show typing indicator |
| `typing_end` | Hide typing indicator |
| `payment_confirmed` | Trigger success animation |
| `error` | Show error message bubble in red |

### Sending Messages

User text input is sent via the WebSocket:
```
{
  type: "user_message",
  content: "I want to visit Angkor Wat for 2 days",
  session_id: "uuid",
  user_id: "uuid",
  timestamp: "ISO8601"
}
```

---

## 4. Message Components — Detailed Specs

### 4.1 Plain Text Bubble
- AI messages: left-aligned, light blue background, rounded corners (bottom-left flat)
- User messages: right-aligned, brand color background, white text, rounded corners (bottom-right flat)
- Timestamps shown on tap (not always visible to keep the chat clean)
- Long messages support "Read more" expansion if over 5 lines

### 4.2 Trip Cards Component (`<TripCardsMessage>`)
Triggered when AI presents the 3 trip suggestions.

- Horizontally scrollable row of cards
- Each card:
  - Destination photo (full-bleed, 16:9 ratio)
  - Trip title
  - Emotional tagline in italic
  - Price badge: "From $89/person"
  - Duration badge: "2 Days"
  - Star rating
  - "View Details" button → sends "Tell me more about option 1" to AI
  - "Book This" button → sends "I want to book this one" to AI
- Cards have a slight drop shadow and bounce-in animation on render

### 4.3 Image Gallery Component (`<ImageGalleryMessage>`)
Triggered when user asks "Show me photos."

- 2-column photo grid
- Tapping a photo opens a full-screen lightbox
- Swipe to browse all photos in the lightbox
- Photos have lazy loading

### 4.4 Itinerary Display Component (`<ItineraryDisplay>`)
Triggered when user asks "Show me the itinerary."

- Accordion-style, one row per day
- Each day shows: Day number, title, and a preview sentence
- Tapping expands to show full morning/afternoon/evening details
- Includes icons for: meals, transport type, accommodation

### 4.5 QR Payment Display Component (`<QRPaymentDisplay>`)
Triggered when booking is reserved and payment is initiated.

- Large centered QR code image
- Amount in USD, KHR, and CNY
- Booking reference number
- Countdown timer: "⏱ 14:32 remaining" (red when under 2 minutes)
- "Payment instructions" expandable hint: "Open your banking app → Scan QR → Confirm"
- "Problem with QR?" link → sends "My QR code isn't working" to AI
- When timer reaches 0: shows "QR Expired" state and sends automatic message to AI to regenerate

### 4.6 Booking Confirmed Card (`<BookingConfirmedCard>`)
Triggered by payment_confirmed WebSocket event.

- Green checkmark animation (Lottie)
- "Booking Confirmed! 🎉" heading
- Booking reference number
- Trip name and dates
- Pickup location
- "View in My Trips" button → navigates to /my-trip
- "Share Itinerary" button → native share dialog
- Confetti animation (canvas-based)

### 4.7 Budget Estimate Card (`<BudgetEstimateCard>`)
Triggered by AI Budget Planner responses.

- Total estimate range in USD: "$380 – $520"
- Currency toggle: USD / KHR / CNY (tapping switches the display)
- Visual bar chart showing breakdown by category
- "Book a Package" button → sends booking intent to AI

### 4.8 Weather Card (`<WeatherCard>`)
Triggered when user asks about weather.

- 7-day horizontal scroll
- Each day: weather icon, date, high/low temp, rain chance bar
- Today is highlighted
- AI's text response above the card provides context

---

## 5. Input Area

### Text Input
- Multi-line text area, max 3 lines before scroll
- Placeholder: "Ask anything about your Cambodia trip..."
- Send button: arrow icon, disabled when input is empty
- Pressing Enter sends the message (Shift+Enter for new line on desktop)

### Quick Reply Chips
After certain AI responses, the frontend renders quick-reply chips above the input bar. These are pre-set response shortcuts:

- After trip suggestions: "Show itinerary", "View photos", "Compare options", "Change budget"
- After itinerary shown: "Book this trip", "Modify duration", "Add a guide"
- After booking summary: "Confirm booking", "Change pickup", "Cancel"

Tapping a chip sends that text as a user message automatically.

### Voice Input (Future)
The input bar has a microphone icon reserved for a future voice-to-text feature.

---

## 6. Session Persistence

The chat supports session persistence across app visits:

- `session_id` is stored in sessionStorage
- When the user returns (same tab/session), the WebSocket reconnects with the same session_id
- The AI agent loads conversation history from Redis
- The frontend also stores the last 20 messages in `chatStore` (Zustand) for instant rendering before the WebSocket reconnects

If the user opens a fresh tab or clears sessionStorage:
- A new session_id is generated
- The AI starts fresh with a greeting

---

## 7. Offline State

If the WebSocket connection drops:
- Show an orange banner at the top: "Connection lost — messages will send when reconnected"
- Allow user to type messages (they are queued in chatStore)
- Retry WebSocket connection every 5 seconds
- When reconnected, flush the queued messages in order
- Hide the offline banner and show a brief "Reconnected ✓" toast

---

## 8. State Management (Zustand chatStore)

```typescript
interface ChatStore {
  sessionId: string;
  messages: ChatMessage[];
  isTyping: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  pendingMessages: string[];   // queued when offline

  // Actions
  addMessage: (message: ChatMessage) => void;
  setTyping: (typing: boolean) => void;
  setConnectionStatus: (status: string) => void;
  queueMessage: (text: string) => void;
  flushPendingMessages: () => void;
}
```

---

## 9. Accessibility

- All message bubbles are readable by screen readers with proper ARIA labels
- QR code has an ARIA description: "Payment QR code for booking DLG-2025-0042, amount $286"
- Trip cards have proper alt text on images
- Keyboard navigation is supported on desktop
- Focus is automatically set to the text input after each AI response
