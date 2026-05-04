import { apiClient } from '@/lib/api-client'
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
      apiClient.post<{ accessToken: string; user: User }>('/auth/login', payload),
    register: (payload: RegisterData) =>
      apiClient.post<{ userId: string; message: string }>('/auth/register', payload),
    logout: () => apiClient.post<{ message: string }>('/auth/logout'),
    refresh: () => apiClient.post<{ accessToken: string | null }>('/auth/refresh'),
    forgotPassword: (email: string) =>
      apiClient.post<{ message: string }>('/auth/forgot-password', { email }),
  },
  users: {
    profile: () => apiClient.get<User>('/users/profile'),
    updateProfile: (payload: Partial<User>) =>
      apiClient.patch<User>('/users/profile', payload),
  },
  trips: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Trip>>('/trips', { params }),
    featured: () => apiClient.get<Trip[]>('/trips/featured'),
    detail: (id: string) => apiClient.get<Trip>(`/trips/${id}`),
  },
  explore: {
    places: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Place>>('/explore/places', { params }),
    place: (id: string) => apiClient.get<Place>(`/explore/places/${id}`),
    provinces: () =>
      apiClient.get<Array<{ province: string; placeCount: number }>>(
        '/explore/provinces',
      ),
  },
  festivals: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<Festival[]>('/festivals', { params }),
    detail: (id: string) => apiClient.get<Festival>(`/festivals/${id}`),
  },
  hotels: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Hotel>>('/hotels', { params }),
    detail: (id: string) => apiClient.get<Hotel>(`/hotels/${id}`),
    roomAvailability: (hotelId: string, roomId: string, params: Record<string, unknown>) =>
      apiClient.get<{ available: boolean; remainingRooms: number }>(
        `/hotels/${hotelId}/rooms/${roomId}/availability`,
        { params },
      ),
  },
  transportation: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Vehicle>>('/transportation/vehicles', {
        params,
      }),
    detail: (id: string) =>
      apiClient.get<Vehicle>(`/transportation/vehicles/${id}`),
  },
  guides: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Guide>>('/guides', { params }),
    detail: (id: string) => apiClient.get<Guide>(`/guides/${id}`),
  },
  bookings: {
    create: (payload: Record<string, unknown>) =>
      apiClient.post<Booking>('/bookings', payload),
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Booking>>('/bookings', { params }),
    detail: (bookingRef: string) => apiClient.get<Booking>(`/bookings/${bookingRef}`),
    cancel: (id: string, reason?: string) =>
      apiClient.post<Booking>(`/bookings/${id}/cancel`, { reason }),
    availability: (id: string, params: Record<string, unknown>) =>
      apiClient.get<{ available: boolean; conflictingDates: Array<{ start: string; end?: string | null }> }>(
        `/bookings/${id}/availability`,
        { params },
      ),
  },
  payments: {
    createIntent: (bookingId: string) =>
      apiClient.post<PaymentIntentPayload>('/payments/create-intent', { bookingId }),
    status: (paymentIntentId: string) =>
      apiClient.get<{ status: string }>(`/payments/${paymentIntentId}/status`),
    refund: (bookingId: string, reason?: string) =>
      apiClient.post<{ status: string }>('/payments/refund', { bookingId, reason }),
  },
  loyalty: {
    balance: () => apiClient.get<LoyaltyBalance>('/loyalty/balance'),
    transactions: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<LoyaltyTransaction>>('/loyalty/transactions', {
        params,
      }),
    redeem: (bookingId: string, points: number) =>
      apiClient.post<{ redeemed: number; discountUsd: number; remainingPoints: number }>(
        '/loyalty/redeem',
        { bookingId, points },
      ),
  },
  student: {
    status: () => apiClient.get<StudentVerification | null>('/student-discount/status'),
    verify: (payload: Record<string, unknown>) =>
      apiClient.post<StudentVerification>('/student-discount/verify', payload),
  },
  emergency: {
    contacts: () => apiClient.get<Array<{ label: string; phone: string }>>('/emergency/contacts'),
    createAlert: (payload: Record<string, unknown>) =>
      apiClient.post<{ id: string; status: string }>('/emergency/alerts', payload),
  },
  notifications: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<NotificationItem>>('/notifications', { params }),
    read: (id: string) => apiClient.post<{ id: string }>(`/notifications/${id}/read`),
    readAll: () => apiClient.post<{ updated: number }>('/notifications/read-all'),
  },
  currency: {
    rates: () => apiClient.get<CurrencyRates>('/currency/rates'),
    convert: (amount: number) =>
      apiClient.get<Record<string, number>>('/currency/convert', {
        params: { amount },
      }),
  },
}
