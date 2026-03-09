import { MealParticipant } from './meal-participant';

/**
 * Booking submission input model interface
 * Represents a complete meal booking submission from the form
 */
export interface BookingSubmission {
  organizationId: number;
  menuId: number;
  email: string;
  mealParticipants: Omit<MealParticipant, 'id' | 'created' | 'email'>[];
  menuSelections: Record<string, number[]>; // Array of WeeklyMenuDay IDs
  saveChildrenInfo: boolean;
}
