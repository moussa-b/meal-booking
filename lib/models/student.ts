/**
 * Student model interface
 * Represents a student in the system
 */
export interface Student {
  id: number;
  created: Date;
  lastName: string;
  firstName: string;
  class: string;
  feedingRegime?: string | null;
  parentEmail?: string | null;
}
