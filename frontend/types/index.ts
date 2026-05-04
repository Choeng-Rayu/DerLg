export type Locale = 'en' | 'kh' | 'zh'
export type ThemeMode = 'light' | 'dark' | 'system'
export type CurrencyCode = 'USD' | 'KHR' | 'CNY'
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface ApiEnvelope<T> {
  success: true
  data: T
  message: string
}

export interface Pagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: Pagination
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  role?: 'USER' | 'ADMIN' | 'SUPPORT'
  avatarUrl?: string | null
  preferredLanguage?: 'EN' | 'KH' | 'ZH'
  loyaltyPoints?: number
  isStudent?: boolean
  studentVerifiedAt?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  createdAt?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
  preferredLanguage?: 'EN' | 'KH' | 'ZH'
}

export interface AuthSession {
  accessToken: string
  user: User
}

export interface Trip {
  id: string
  title: string
  description?: string
  destination?: string
  province?: string
  durationDays: number
  pricePerPersonUsd: number
  avgRating?: number | null
  reviewCount?: number | null
  imageUrls?: string[]
  hotel?: {
    id: string
    name: string
    province?: string
    starRating?: number
    imageUrls?: string[]
  } | null
  itinerary?: Array<{
    day: number
    title: string
    description: string
  }>
  includedItems?: string[]
  excludedItems?: string[]
  meetingPoint?: string
  cancellationPolicy?: string
  availableDates?: string[]
}

export interface Place {
  id: string
  name: string
  description?: string
  province?: string
  category?: string
  imageUrls?: string[]
  latitude?: number
  longitude?: number
  festivals?: Festival[]
}

export interface Festival {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  imageUrls?: string[]
  type?: string
  place?: {
    id: string
    name: string
    province?: string
  }
  discountCodes?: Array<{
    code: string
    discountType: string
    discountValue: number
  }>
}

export interface HotelRoom {
  id: string
  roomType: string
  capacity: number
  pricePerNightUsd: number
  amenities?: string[]
  totalRooms?: number
}

export interface Hotel {
  id: string
  name: string
  province?: string
  starRating?: number
  imageUrls?: string[]
  amenities?: string[]
  description?: string
  rooms?: HotelRoom[]
}

export interface Guide {
  id: string
  bio?: string
  languages?: string[]
  specialties?: string[]
  experienceYears?: number
  isVerified?: boolean
  isAvailable?: boolean
  dailyRateUsd?: number
  user?: {
    name: string
    email?: string
    avatarUrl?: string | null
    phone?: string | null
  }
}

export interface Vehicle {
  id: string
  category: string
  model?: string
  tier?: string
  seatCapacity?: number
  pricePerDayUsd?: number
  imageUrls?: string[]
}

export type BookingType = 'PACKAGE' | 'HOTEL_ONLY' | 'TRANSPORT_ONLY' | 'GUIDE_ONLY'

export interface Booking {
  id: string
  bookingRef: string
  status: 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  bookingType: BookingType
  travelDate: string
  endDate?: string | null
  numAdults: number
  numChildren?: number
  totalUsd: number
  subtotalUsd?: number
  loyaltyPointsEarned?: number
  reservedUntil?: string
  specialRequests?: string | null
  pickupLocation?: string | null
  cancellationReason?: string | null
  trip?: Trip | null
  hotelRoom?: {
    id: string
    roomType: string
    hotel: {
      id: string
      name: string
      province?: string
    }
  } | null
  vehicle?: Vehicle | null
  guide?: Guide | null
  payments?: PaymentRecord[]
  priceBreakdown?: {
    subtotal: number
    discounts: Array<{ label: string; amount: number }>
    total: number
  }
}

export interface PaymentIntentPayload {
  clientSecret: string
  paymentIntentId: string
  amountUsd: number
  expiresAt: string
}

export interface PaymentRecord {
  id: string
  amountUsd: number
  status: string
  stripePaymentIntentId: string
  paidAt?: string | null
}

export interface LoyaltyBalance {
  points: number
  valueUsd: number
}

export interface LoyaltyTransaction {
  id: string
  type: string
  points: number
  description?: string
  balanceAfter: number
  createdAt: string
  booking?: {
    bookingRef: string
  }
}

export interface StudentVerification {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  institutionName: string
  rejectionReason?: string | null
  expiresAt?: string | null
  createdAt?: string
}

export interface EmergencyContact {
  label: string
  phone: string
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  readAt?: string | null
  createdAt: string
  href?: string
}

export interface CurrencyRates {
  base: string
  rates: Record<string, number>
  updatedAt?: string
}

export interface SearchResultGroup<T> {
  label: string
  type: string
  items: T[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  type: 'text' | 'trip_card' | 'hotel_card' | 'action_buttons' | 'status'
  content: string
  metadata?: Record<string, unknown>
  createdAt: string
}
