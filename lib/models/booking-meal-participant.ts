import type { OrganizationType } from '@/lib/models/organization';
import type { MealParticipant } from '@/lib/models/meal-participant';

import { BookingMenuSelection } from '@/lib/models/booking-menu-selection';

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
