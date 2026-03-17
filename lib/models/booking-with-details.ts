import { Booking } from '@/lib/models/booking';

/**
 * Booking with computed, view-specific details used in history views.
 */
export interface BookingWithDetails extends Booking {
  totalMeals: number;
  totalAmount: number;
  organizationName?: string;
  weekStartDate?: Date;
}
