import { BaseApiResponse } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    role: 'user' | 'admin';
    loyaltyPoints: number;
    isStudentVerified: boolean;
  };
}
