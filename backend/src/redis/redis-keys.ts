/**
 * Redis key patterns used across the application.
 * Centralized here to prevent typos and ensure consistency.
 */

export const RedisKeys = {
  /** Booking hold with 15-minute TTL */
  bookingHold: (bookingId: string) => `booking_hold:${bookingId}`,

  /** Refresh token version for invalidation */
  refreshTokenVersion: (userId: string) => `refresh_token_version:${userId}`,

  /** Location sharing session */
  locationSession: (sessionId: string) => `session:${sessionId}`,

  /** Currency exchange rates (1-hour TTL) */
  currencyRates: () => 'currency:rates',

  /** Weather data (1-hour TTL) */
  weather: (city: string) => `weather:${city}`,

  /** Rate limiting counter */
  rateLimit: (endpoint: string, userId: string, window: string) =>
    `rate_limit:${endpoint}:${userId}:${window}`,

  /** Payment events pub/sub channel */
  paymentEvents: (userId: string) => `payment_events:${userId}`,

  /** Map data cache (7-day TTL) */
  mapData: (province: string) => `map:${province}`,
} as const;

export const RedisTTL = {
  BOOKING_HOLD: 900, // 15 minutes
  CURRENCY_RATES: 3600, // 1 hour
  WEATHER: 3600, // 1 hour
  LOCATION_SESSION: 604800, // 7 days
  MAP_DATA: 604800, // 7 days
} as const;
