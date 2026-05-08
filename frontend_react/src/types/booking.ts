export interface BookingFormData {
  startDate: Date;
  guestCount: number;
  specialRequests?: string;
  applyLoyaltyPoints: boolean;
  studentDiscount: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
