import { Student } from './student';
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
  schoolId: number;
  menuId: number;
  students?: BookingStudent[];
  status: PaymentStatus;
  paypalOrderId?: string | null;
  paymentEmailSentAt?: Date | null;
  confirmationEmailSentAt?: Date | null;
}

/**
 * BookingStudent model interface
 * Represents a student associated with a booking
 */
export interface BookingStudent {
  id: number;
  bookingId: number;
  studentId: number | null;
  lastName: string;
  firstName: string;
  class: string;
  feedingRegime: string | null;
  parentEmail: string;
  student?: Student | null;
  menuSelections?: BookingMenuSelection[];
}

/**
 * BookingMenuSelection model interface
 * Represents a menu selection for a specific student and day
 */
export interface BookingMenuSelection {
  id: number;
  bookingId: number;
  bookingStudentId: number;
  weeklyMenuDayId: number;
  weeklyMenuDay?: WeeklyMenuDay;
}

/**
 * Booking with computed, view-specific details used in history views.
 */
export interface BookingWithDetails extends Booking {
  totalMeals: number;
  totalAmount: number;
  schoolName?: string;
  weekStartDate?: Date;
}

