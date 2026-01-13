import { Student } from './student';
import { MenuSelection } from './menu-selection';

/**
 * Booking submission model interface
 * Represents a complete meal booking submission
 */
export interface BookingSubmission {
  schoolCode: string;
  email: string;
  children: Student[];
  menuSelections: Record<string, MenuSelection>;
  saveChildrenInfo: boolean;
}
