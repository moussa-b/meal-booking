import type { MealParticipant } from './meal-participant';
import type { OrganizationType } from './organization';
import { WeeklyMenuDay } from './weekly-menu';
import { PaymentStatus } from '@/lib/models/payment-status';

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

/**
 * BookingStudent model interface
 * Represents a student associated with a booking
 */
export interface BookingMealParticipant {
  id: number;
  bookingId: number;
  mealParticipantId: number | null;
  lastName: string;
  firstName: string;
  class: string;
  type: OrganizationType;
  feedingRegime: string | null;
  email: string;
  phone?: string | null;
  mealParticipant?: MealParticipant | null;
  menuSelections?: BookingMenuSelection[];
}

/**
 * BookingMenuSelection model interface
 * Represents a menu selection for a specific student and day
 */
export interface BookingMenuSelection {
  id: number;
  bookingId: number;
  bookingMealParticipantId: number;
  weeklyMenuDayId: number;
  weeklyMenuDay?: WeeklyMenuDay;
}

/**
 * Booking with computed, view-specific details used in history views.
 */
export interface BookingWithDetails extends Booking {
  totalMeals: number;
  totalAmount: number;
  organizationName?: string;
  weekStartDate?: Date;
}
