import { Student } from './student';

/**
 * Booking submission input model interface
 * Represents a complete meal booking submission from the form
 */
export interface BookingSubmission {
  organizationId: number;
  menuId: number;
  email: string;
  students: Omit<Student, 'id' | 'created' | 'parentEmail'>[];
  menuSelections: Record<string, number[]>; // Array of WeeklyMenuDay IDs
  saveChildrenInfo: boolean;
}
