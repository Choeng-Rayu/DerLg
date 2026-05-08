export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: 'user' | 'admin';
  loyaltyPoints: number;
  isStudentVerified: boolean;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number; // duration in days perhaps
  images: string[];
  itinerary: {
    day: number;
    title: string;
    description: string;
  }[];
}

export interface Place {
  id: string;
  name: string;
  category: string;
  region: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
}

export interface Festival {
  id: string;
  name: string;
  date: string; // ISO date string
  location: string;
  description: string;
  type: string;
}

export interface Booking {
  id: string;
  tripId: string;
  userId: string;
  startDate: string; // ISO date string
  guestCount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  qrCode: string | null;
}

export interface Review {
  id: string;
  tripId: string;
  user: User;
  rating: number;
  text: string;
  photos: string[];
  verifiedBooking: boolean;
}
