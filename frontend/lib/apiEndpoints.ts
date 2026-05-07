export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    google: '/auth/google',
    telegram: '/auth/telegram',
  },
  users: {
    profile: '/users/profile',
  },
  trips: {
    list: '/trips',
    featured: '/trips/featured',
    detail: (id: string) => `/trips/${id}`,
  },
  explore: {
    places: '/explore/places',
    place: (id: string) => `/explore/places/${id}`,
    provinces: '/explore/provinces',
  },
  festivals: {
    list: '/festivals',
    detail: (id: string) => `/festivals/${id}`,
  },
  hotels: {
    list: '/hotels',
    detail: (id: string) => `/hotels/${id}`,
    roomAvailability: (hotelId: string, roomId: string) =>
      `/hotels/${hotelId}/rooms/${roomId}/availability`,
  },
  transportation: {
    list: '/transportation/vehicles',
    detail: (id: string) => `/transportation/vehicles/${id}`,
  },
  guides: {
    list: '/guides',
    detail: (id: string) => `/guides/${id}`,
  },
  bookings: {
    create: '/bookings',
    list: '/bookings',
    detail: (bookingRef: string) => `/bookings/${bookingRef}`,
    cancel: (id: string) => `/bookings/${id}/cancel`,
    availability: (id: string) => `/bookings/${id}/availability`,
  },
  payments: {
    createIntent: '/payments/create-intent',
    status: (paymentIntentId: string) => `/payments/${paymentIntentId}/status`,
    refund: '/payments/refund',
  },
  loyalty: {
    balance: '/loyalty/balance',
    transactions: '/loyalty/transactions',
    redeem: '/loyalty/redeem',
  },
  student: {
    status: '/student-discount/status',
    verify: '/student-discount/verify',
  },
  emergency: {
    contacts: '/emergency/contacts',
    createAlert: '/emergency/alerts',
  },
  notifications: {
    list: '/notifications',
    read: (id: string) => `/notifications/${id}/read`,
    readAll: '/notifications/read-all',
  },
  currency: {
    rates: '/currency/rates',
    convert: '/currency/convert',
  },
} as const;
