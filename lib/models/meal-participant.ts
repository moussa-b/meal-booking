import type { OrganizationType } from './organization';

/**
 * Meal participant model interface
 * Represents a meal participant in the system
 */
export interface MealParticipant {
  id: number;
  created: Date;
  lastName: string;
  firstName: string;
  class: string;
  type: OrganizationType;
  feedingRegime?: string | null;
  parentEmail?: string | null;
}
