import { PaymentStatus } from '@/lib/models/payment-status';
import { BookingMealParticipant } from '@/lib/models/booking-meal-participant';

/**
 * Booking model interface
 * Represents a booking in the system
 */
export interface Booking {
  id: number;
  created: Date;
  email: string;
  phone?: string | null;
  organizationId: number;
  menuId: number;
  comment?: string | null;
  mealParticipants?: BookingMealParticipant[];
  status: PaymentStatus;
  paypalOrderId?: string | null;
  paymentEmailSentAt?: Date | null;
  confirmationEmailSentAt?: Date | null;
}

