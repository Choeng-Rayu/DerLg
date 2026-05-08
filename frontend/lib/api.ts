import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/apiEndpoints'
import type {
  Booking,
  CurrencyRates,
  Festival,
  Guide,
  Hotel,
  LoginCredentials,
  LoyaltyBalance,
  LoyaltyTransaction,
  NotificationItem,
  PaginatedResponse,
  PaymentIntentPayload,
  Place,
  RegisterData,
  StudentVerification,
  Trip,
  User,
  Vehicle,
} from '@/types'

export const api = {
  auth: {
    login: (payload: LoginCredentials) =>
      apiClient.post<{ accessToken: string; user: User }>(API_ENDPOINTS.auth.login, payload),
    register: (payload: RegisterData) =>
      apiClient.post<{ userId: string; message: string }>(API_ENDPOINTS.auth.register, payload),
    logout: () => apiClient.post<{ message: string }>(API_ENDPOINTS.auth.logout),
    refresh: () => apiClient.post<{ accessToken: string | null }>(API_ENDPOINTS.auth.refresh),
    forgotPassword: (email: string) =>
      apiClient.post<{ message: string }>(API_ENDPOINTS.auth.forgotPassword, { email }),
    google: () => {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/v1${API_ENDPOINTS.auth.google}`
    },
    telegram: (payload: Record<string, unknown>) =>
      apiClient.post<{ accessToken: string; user: User }>(API_ENDPOINTS.auth.telegram, payload),
  },
  users: {
    profile: () => apiClient.get<User>(API_ENDPOINTS.users.profile),
    updateProfile: (payload: Partial<User>) =>
      apiClient.patch<User>(API_ENDPOINTS.users.profile, payload),
  },
  trips: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Trip>>(API_ENDPOINTS.trips.list, { params }),
    featured: () => apiClient.get<Trip[]>(API_ENDPOINTS.trips.featured),
    detail: (id: string) => apiClient.get<Trip>(API_ENDPOINTS.trips.detail(id)),
  },
  explore: {
    places: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Place>>(API_ENDPOINTS.explore.places, { params }),
    place: (id: string) => apiClient.get<Place>(API_ENDPOINTS.explore.place(id)),
    provinces: () =>
      apiClient.get<Array<{ province: string; placeCount: number }>>(
        API_ENDPOINTS.explore.provinces,
      ),
  },
  festivals: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<Festival[]>(API_ENDPOINTS.festivals.list, { params }),
    detail: (id: string) => apiClient.get<Festival>(API_ENDPOINTS.festivals.detail(id)),
  },
  hotels: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Hotel>>(API_ENDPOINTS.hotels.list, { params }),
    detail: (id: string) => apiClient.get<Hotel>(API_ENDPOINTS.hotels.detail(id)),
    roomAvailability: (hotelId: string, roomId: string, params: Record<string, unknown>) =>
      apiClient.get<{ available: boolean; remainingRooms: number }>(
        API_ENDPOINTS.hotels.roomAvailability(hotelId, roomId),
        { params },
      ),
  },
  transportation: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Vehicle>>(API_ENDPOINTS.transportation.list, {
        params,
      }),
    detail: (id: string) =>
      apiClient.get<Vehicle>(API_ENDPOINTS.transportation.detail(id)),
  },
  guides: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Guide>>(API_ENDPOINTS.guides.list, { params }),
    detail: (id: string) => apiClient.get<Guide>(API_ENDPOINTS.guides.detail(id)),
  },
  bookings: {
    create: (payload: Record<string, unknown>) =>
      apiClient.post<Booking>(API_ENDPOINTS.bookings.create, payload),
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Booking>>(API_ENDPOINTS.bookings.list, { params }),
    detail: (bookingRef: string) => apiClient.get<Booking>(API_ENDPOINTS.bookings.detail(bookingRef)),
    cancel: (id: string, reason?: string) =>
      apiClient.post<Booking>(API_ENDPOINTS.bookings.cancel(id), { reason }),
    availability: (id: string, params: Record<string, unknown>) =>
      apiClient.get<{ available: boolean; conflictingDates: Array<{ start: string; end?: string | null }> }>(
        API_ENDPOINTS.bookings.availability(id),
        { params },
      ),
  },
  payments: {
    createIntent: (bookingId: string) =>
      apiClient.post<PaymentIntentPayload>(API_ENDPOINTS.payments.createIntent, { bookingId }),
    status: (paymentIntentId: string) =>
      apiClient.get<{ status: string }>(API_ENDPOINTS.payments.status(paymentIntentId)),
    refund: (bookingId: string, reason?: string) =>
      apiClient.post<{ status: string }>(API_ENDPOINTS.payments.refund, { bookingId, reason }),
  },
  loyalty: {
    balance: () => apiClient.get<LoyaltyBalance>(API_ENDPOINTS.loyalty.balance),
    transactions: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<LoyaltyTransaction>>(API_ENDPOINTS.loyalty.transactions, {
        params,
      }),
    redeem: (bookingId: string, points: number) =>
      apiClient.post<{ redeemed: number; discountUsd: number; remainingPoints: number }>(
        API_ENDPOINTS.loyalty.redeem,
        { bookingId, points },
      ),
  },
  student: {
    status: () => apiClient.get<StudentVerification | null>(API_ENDPOINTS.student.status),
    verify: (payload: Record<string, unknown>) =>
      apiClient.post<StudentVerification>(API_ENDPOINTS.student.verify, payload),
  },
  emergency: {
    contacts: () => apiClient.get<Array<{ label: string; phone: string }>>(API_ENDPOINTS.emergency.contacts),
    createAlert: (payload: Record<string, unknown>) =>
      apiClient.post<{ id: string; status: string }>(API_ENDPOINTS.emergency.createAlert, payload),
  },
  notifications: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<NotificationItem>>(API_ENDPOINTS.notifications.list, { params }),
    read: (id: string) => apiClient.post<{ id: string }>(API_ENDPOINTS.notifications.read(id)),
    readAll: () => apiClient.post<{ updated: number }>(API_ENDPOINTS.notifications.readAll),
  },
  currency: {
    rates: () => apiClient.get<CurrencyRates>(API_ENDPOINTS.currency.rates),
    convert: (amount: number) =>
      apiClient.get<Record<string, number>>(API_ENDPOINTS.currency.convert, {
        params: { amount },
      }),
  },
}
