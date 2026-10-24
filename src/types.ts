export type ServiceType = 'air' | 'sea' | 'hotel' | 'visa' | 'organized-trip' | 'omra';
export type BookingStatus = 'pending' | 'in-progress' | 'confirmed' | 'action-needed';
export type UserRole = 'admin' | 'client';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: any; // Firestore Timestamp
  avatarUrl?: string;
}

export interface BookingRequest {
  id: string;
  uid: string;
  serviceType: ServiceType;
  firstName: string;
  lastName: string;
  dob: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
  email: string;
  passportScanUrl?: string;
  status: BookingStatus;
  adminNotes?: { text: string; createdAt: any; author: string }[];
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface TravelOffer {
  id: string;
  type: ServiceType;
  title: string;
  description: string;
  destination: string;
  price?: number;
  currency?: string;
  imageUrl: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  rating?: number; // For hotels
  class?: string; // For flights
  partner?: string;
  amenities?: string[];
}

export interface InAppNotification {
  id: string;
  bookingId: string;
  type: 'confirmed' | 'action-needed';
  title: string;
  message: string;
  serviceType: ServiceType;
  destination: string;
  timestamp: number;
  read: boolean;
}

export type AppointmentType = 'agency' | 'phone' | 'video';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  uid?: string;
  fullName: string;
  phone: string;
  email: string;
  type: AppointmentType;
  serviceInterest: string;
  date: string;
  timeSlot: string;
  numberOfPeople?: number;
  notes?: string;
  status: AppointmentStatus;
  adminNotes?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  urgent: boolean;
  status: 'new' | 'read' | 'replied';
  createdAt: any;
}

