import { WeeklyMenuDay } from '@/lib/models/weekly-menu';

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
