'use client'

import { create } from 'zustand'
import type { BookingType } from '@/types'

interface BookingDraft {
  bookingType: BookingType
  tripId?: string
  hotelRoomId?: string
  vehicleId?: string
  guideId?: string
  travelDate?: string
  endDate?: string
  numAdults: number
  numChildren: number
  specialRequests?: string
  pickupLocation?: string
  loyaltyPointsToRedeem?: number
  applyStudentDiscount?: boolean
}

interface BookingStore {
  draft: BookingDraft
  setDraft: (draft: Partial<BookingDraft>) => void
  resetDraft: () => void
}

const initialDraft: BookingDraft = {
  bookingType: 'PACKAGE',
  numAdults: 1,
  numChildren: 0,
}

export const useBookingStore = create<BookingStore>((set) => ({
  draft: initialDraft,
  setDraft: (draft) =>
    set((state) => ({
      draft: {
        ...state.draft,
        ...draft,
      },
    })),
  resetDraft: () => set({ draft: initialDraft }),
}))
